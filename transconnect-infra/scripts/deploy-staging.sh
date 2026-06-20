#!/usr/bin/env bash
# =============================================================
# Deploy TransConnect STAGING to VPS
# Usage:  bash deploy-staging.sh [--build] [--migrate-only]
# Flags:
#   --build          Force rebuild of all Docker images
#   --migrate-only   Only run DB migrations, skip rebuilding
# =============================================================
set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
section() { echo -e "\n${BLUE}══════════════════════════════════════════${NC}"; echo -e "${BLUE}  $*${NC}"; echo -e "${BLUE}══════════════════════════════════════════${NC}"; }

# ── Config ────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker/docker-compose.staging.yml"
ENV_FILE="/opt/transconnect/staging/.env"
FORCE_BUILD=false
MIGRATE_ONLY=false

for arg in "$@"; do
    [[ "$arg" == "--build"         ]] && FORCE_BUILD=true
    [[ "$arg" == "--migrate-only"  ]] && MIGRATE_ONLY=true
done

# ── Pre-flight checks ─────────────────────────────────────────
section "Pre-flight checks"
[[ -f "$COMPOSE_FILE" ]] || error "Compose file not found: $COMPOSE_FILE"
[[ -f "$ENV_FILE"     ]] || error "Staging .env not found: $ENV_FILE\n  Copy from transconnect-infra/.env.staging.example and fill in secrets."
command -v docker &>/dev/null || error "Docker is not installed."

info "Compose file : $COMPOSE_FILE"
info "Env file     : $ENV_FILE"
info "Force build  : $FORCE_BUILD"

# ── Pull latest code ──────────────────────────────────────────
section "Pulling latest code"
cd "$REPO_ROOT"
git config pull.rebase false
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git pull origin "$CURRENT_BRANCH" || warn "Could not pull — working with local HEAD"
GIT_SHA=$(git rev-parse --short HEAD)
info "HEAD: $GIT_SHA"

if [[ "$MIGRATE_ONLY" == "true" ]]; then
    section "Running DB migrations only"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
        exec backend_staging npx prisma migrate deploy
    info "Migrations complete."
    exit 0
fi

# ── Build ─────────────────────────────────────────────────────
section "Building Docker images"
BUILD_ARGS=""
[[ "$FORCE_BUILD" == "true" ]] && BUILD_ARGS="--no-cache"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build $BUILD_ARGS

# ── Start / recreate services ─────────────────────────────────
section "Starting staging services"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
    up -d --remove-orphans

# ── Wait for backend to be healthy ────────────────────────────
section "Waiting for backend health check"
MAX_WAIT=180
ELAPSED=0
# Check via the host-mapped port (127.0.0.1:5001 → container:5000)
# Avoids exec inside container; uses host curl which is always available on Ubuntu/Debian VPS
until curl -sf http://127.0.0.1:5001/health > /dev/null 2>&1; do
    if [[ $ELAPSED -ge $MAX_WAIT ]]; then
        warn "Backend health check timed out after ${MAX_WAIT}s — printing container logs:"
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail=50 backend_staging || true
        error "Backend did not become healthy in time"
    fi
    echo -n "."
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done
echo ""
info "Backend is healthy"

# ── Run DB migrations ─────────────────────────────────────────
section "Running database migrations"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
    exec -T backend_staging npx prisma migrate deploy
info "Migrations applied"

# ── Smoke test ────────────────────────────────────────────────
section "Smoke test"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5001/health || echo "000")
if [[ "$HTTP_STATUS" == "200" ]]; then
    info "API health check passed (HTTP $HTTP_STATUS)"
else
    warn "API returned HTTP $HTTP_STATUS — check logs with: docker logs tc_backend_staging"
fi

WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3010/ || echo "000")
info "Web portal status: HTTP $WEB_STATUS"

# ── Summary ───────────────────────────────────────────────────
section "Deployment complete"
echo ""
info "Git SHA   : $GIT_SHA"
info "Services  :"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
echo ""
info "Useful commands:"
info "  View backend logs : docker logs -f tc_backend_staging"
info "  View all logs     : docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f"
info "  Stop all          : docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down"
