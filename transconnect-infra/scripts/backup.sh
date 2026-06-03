#!/usr/bin/env bash
# =============================================================
# TransConnect Database Backup Script
# Backs up both staging and production PostgreSQL databases.
# Designed to be run as a cron job:
#
#   # Run daily at 02:00 AM
#   0 2 * * * /opt/transconnect/app/transconnect-infra/scripts/backup.sh >> /opt/transconnect/production/logs/backup.log 2>&1
#
# Usage:  bash backup.sh [staging|production|all]  (default: all)
# =============================================================
set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] INFO${NC}  $*"; }
warn()  { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN${NC}  $*"; }
error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR${NC} $*"; exit 1; }

# ── Config ────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$SCRIPT_DIR/../docker"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TARGET="${1:-all}"

backup_env() {
    local ENV="$1"
    local COMPOSE_FILE="$COMPOSE_DIR/docker-compose.${ENV}.yml"
    local ENV_FILE="/opt/transconnect/${ENV}/.env"
    local BACKUP_DIR="/opt/transconnect/${ENV}/backups"
    local TIMESTAMP
    TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
    local BACKUP_FILE="$BACKUP_DIR/transconnect_${ENV}_${TIMESTAMP}.sql.gz"

    info "=== Backing up $ENV database ==="

    # Validate prerequisites
    [[ -f "$COMPOSE_FILE" ]] || { warn "Compose file not found for $ENV — skipping"; return; }
    [[ -f "$ENV_FILE"     ]] || { warn ".env not found for $ENV — skipping"; return; }

    # Determine container name based on environment
    local CONTAINER="tc_postgres_${ENV}"
    [[ "$ENV" == "production" ]] && CONTAINER="tc_postgres_prod"
    [[ "$ENV" == "staging"    ]] && CONTAINER="tc_postgres_staging"

    # Check container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
        warn "Container $CONTAINER is not running — skipping backup"
        return
    fi

    mkdir -p "$BACKUP_DIR"

    # Read credentials from env file
    local POSTGRES_PASSWORD
    POSTGRES_PASSWORD=$(grep '^POSTGRES_PASSWORD' "$ENV_FILE" | cut -d= -f2- | tr -d '"')

    local DB_USER DB_NAME
    if [[ "$ENV" == "staging" ]]; then
        DB_USER="transconnect_staging"
        DB_NAME="transconnect_staging"
    else
        DB_USER="transconnect_prod"
        DB_NAME="transconnect_production"
    fi

    # Perform backup
    info "Dumping $DB_NAME → $BACKUP_FILE"
    PGPASSWORD="$POSTGRES_PASSWORD" docker exec "$CONTAINER" \
        pg_dump -U "$DB_USER" -d "$DB_NAME" --no-password | \
        gzip > "$BACKUP_FILE"

    local SIZE
    SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    info "Backup complete: $BACKUP_FILE ($SIZE)"

    # Verify backup is not empty
    if [[ ! -s "$BACKUP_FILE" ]]; then
        error "Backup file is empty: $BACKUP_FILE"
    fi

    # Remove backups older than retention period
    info "Removing backups older than $BACKUP_RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "transconnect_${ENV}_*.sql.gz" \
        -mtime "+${BACKUP_RETENTION_DAYS}" -delete
    local KEPT
    KEPT=$(find "$BACKUP_DIR" -name "transconnect_${ENV}_*.sql.gz" | wc -l)
    info "Retained $KEPT backup(s) in $BACKUP_DIR"
}

# ── Run ───────────────────────────────────────────────────────
case "$TARGET" in
    staging)    backup_env staging ;;
    production) backup_env production ;;
    all)        backup_env staging; backup_env production ;;
    *)          error "Unknown target: $TARGET. Use: staging | production | all" ;;
esac

info "Backup job finished."
