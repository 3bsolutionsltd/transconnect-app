#!/usr/bin/env bash
# =============================================================
# Deploy TransConnect PRODUCTION to VPS
# Usage:  bash deploy-production.sh [--build] [--migrate-only]
#
# This script requires explicit confirmation before deploying.
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
COMPOSE_FILE="$SCRIPT_DIR/../docker/docker-compose.production.yml"
ENV_FILE="/opt/transconnect/production/.env"
BACKUP_DIR="/opt/transconnect/production/backups"
FORCE_BUILD=false
MIGRATE_ONLY=false

for arg in "$@"; do
    [[ "$arg" == "--build"         ]] && FORCE_BUILD=true
    [[ "$arg" == "--migrate-only"  ]] && MIGRATE_ONLY=true
done

# ── Pre-flight checks ─────────────────────────────────────────
section "Pre-flight checks"
[[ -f "$COMPOSE_FILE" ]] || error "Compose file not found: $COMPOSE_FILE"
[[ -f "$ENV_FILE"     ]] || error "Production .env not found: $ENV_FILE"
command -v docker &>/dev/null || error "Docker is not installed."

# ── Safety confirmation ───────────────────────────────────────
# Set SKIP_CONFIRM=1 to bypass (used by CI/CD pipelines)
if [[ "${SKIP_CONFIRM:-0}" != "1" ]]; then
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ⚠  PRODUCTION DEPLOYMENT — REAL TRAFFIC AFFECTED  ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""
    read -rp "Type 'deploy production' to continue: " CONFIRM
    [[ "$CONFIRM" == "deploy production" ]] || error "Aborted."
fi

# ── Pull latest code ──────────────────────────────────────────
section "Pulling latest code (main/master)"
cd "$REPO_ROOT"
git fetch origin
git pull origin master || git pull origin main || warn "Could not pull — working with local HEAD"
GIT_SHA=$(git rev-parse --short HEAD)
info "HEAD: $GIT_SHA"

# ── Pre-deployment database backup ────────────────────────────
section "Pre-deployment database backup"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/pre-deploy-$(date +%Y%m%d_%H%M%S).sql.gz"
if docker ps --format '{{.Names}}' | grep -q tc_postgres_prod; then
    info "Creating database snapshot: $BACKUP_FILE"
    # Load POSTGRES_PASSWORD from env file
    POSTGRES_PASSWORD=$(grep '^POSTGRES_PASSWORD' "$ENV_FILE" | cut -d= -f2-)
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
        exec -T postgres_prod pg_dump -U transconnect_prod transconnect_production | \
        gzip > "$BACKUP_FILE"
    info "Backup saved: $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"
else
    warn "DB container not running — skipping pre-deploy backup"
fi

if [[ "$MIGRATE_ONLY" == "true" ]]; then
    section "Running DB migrations only"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
        exec -T backend_prod npx prisma migrate deploy
    info "Migrations complete."
    exit 0
fi

# ── Build ─────────────────────────────────────────────────────
section "Building Docker images"
BUILD_ARGS=""
[[ "$FORCE_BUILD" == "true" ]] && BUILD_ARGS="--no-cache"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build $BUILD_ARGS

# ── Rolling restart (zero downtime attempt) ───────────────────
section "Starting production services"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
    up -d --remove-orphans

# ── Wait for backend to be healthy ────────────────────────────
# Note: node:20-alpine does not include curl; check from host using the bound
# port (127.0.0.1:5000).  /api/health always returns 200 without a DB round-
# trip so it succeeds even before migrations run.
section "Waiting for backend health check"
MAX_WAIT=180
ELAPSED=0
until curl -sf http://127.0.0.1:5000/api/health > /dev/null 2>&1; do
    if [[ $ELAPSED -ge $MAX_WAIT ]]; then
        warn "Health check timed out — rolling back"
        docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
        error "Deployment rolled back. Restore from backup: $BACKUP_FILE"
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
    exec -T backend_prod npx prisma migrate deploy
info "Migrations applied"

# ── Smoke tests ───────────────────────────────────────────────
section "Smoke tests"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/health || echo "000")
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ || echo "000")
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/ || echo "000")

info "API:   HTTP $API_STATUS"
info "Web:   HTTP $WEB_STATUS"
info "Admin: HTTP $ADMIN_STATUS"

if [[ "$API_STATUS" != "200" ]]; then
    warn "API health check failed! Inspect: docker logs tc_backend_prod"
fi

# ── Cleanup old images ────────────────────────────────────────
section "Cleaning up unused Docker images"
docker image prune -f

# ── Summary ───────────────────────────────────────────────────
section "Production deployment complete"
echo ""
info "Git SHA  : $GIT_SHA"
info "Backup   : $BACKUP_FILE"
info "Services :"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
echo ""
info "Useful commands:"
info "  View backend logs : docker logs -f tc_backend_prod"
info "  View all logs     : docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f"
info "  Stop all          : docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down"
