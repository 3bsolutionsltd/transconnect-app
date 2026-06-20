#!/usr/bin/env bash
# =============================================================
# TransConnect VPS Setup Script
# Safe to run on a shared VPS alongside other applications.
# Does NOT reset the firewall or replace the global nginx.conf.
# Usage:  sudo bash setup-vps.sh
# =============================================================
set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

[[ $EUID -ne 0 ]] && error "Run as root: sudo bash setup-vps.sh"

# ── Variables — edit before running ───────────────────────────
DEPLOY_USER="${DEPLOY_USER:-transconnect}"
APP_DIR="/opt/transconnect"
DOMAIN="${DOMAIN:-transconnect.app}"       # Primary production domain
STAGING_DOMAIN="${STAGING_DOMAIN:-staging.transconnect.app}"
ALERT_EMAIL="${ALERT_EMAIL:-devops@transconnect.app}"

info "=== TransConnect VPS Setup ==="
info "Deploy user : $DEPLOY_USER"
info "App dir     : $APP_DIR"
info "Domain      : $DOMAIN"

# ── 1. System Update ──────────────────────────────────────────
info "Updating system packages..."
apt-get update -y
apt-get upgrade -y
apt-get install -y curl wget git unzip ufw fail2ban htop logrotate \
    ca-certificates gnupg lsb-release software-properties-common

# ── 2. Create deploy user ─────────────────────────────────────
if ! id "$DEPLOY_USER" &>/dev/null; then
    info "Creating deploy user: $DEPLOY_USER"
    useradd -m -s /bin/bash "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
    # Copy SSH authorized_keys if root has them
    if [[ -f /root/.ssh/authorized_keys ]]; then
        mkdir -p "/home/$DEPLOY_USER/.ssh"
        cp /root/.ssh/authorized_keys "/home/$DEPLOY_USER/.ssh/"
        chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
        chmod 700 "/home/$DEPLOY_USER/.ssh"
        chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
    fi
else
    warn "User $DEPLOY_USER already exists — skipping creation"
fi

# ── 3. Docker ─────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    info "Installing Docker..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
        gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
    usermod -aG docker "$DEPLOY_USER"
    info "Docker installed: $(docker --version)"
else
    warn "Docker already installed: $(docker --version)"
fi

# ── 4. Nginx ──────────────────────────────────────────────────
if ! command -v nginx &>/dev/null; then
    info "Installing Nginx..."
    apt-get install -y nginx
    systemctl enable --now nginx
else
    warn "Nginx already installed"
fi

# ── 5. Certbot (Let's Encrypt SSL) ────────────────────────────
if ! command -v certbot &>/dev/null; then
    info "Installing Certbot..."
    apt-get install -y certbot python3-certbot-nginx
else
    warn "Certbot already installed"
fi

# ── 6. Firewall (UFW) ─────────────────────────────────────────
# Only ADD TransConnect-required rules — never reset or change
# defaults, as other services may depend on existing rules.
info "Adding firewall rules (existing rules preserved)..."
ufw allow ssh         2>/dev/null || true
ufw allow 'Nginx Full' 2>/dev/null || true   # 80 + 443
# Enable UFW only if it isn't already active
if ! ufw status | grep -q 'Status: active'; then
    warn "UFW is not active. Enabling with safe defaults..."
    ufw default deny incoming
    ufw default allow outgoing
    ufw --force enable
else
    info "UFW already active — rules added without changing defaults"
fi
info "Current firewall rules:"
ufw status verbose

# ── 7. Fail2Ban (brute-force protection) ─────────────────────
info "Configuring Fail2Ban..."
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled  = true
filter   = nginx-limit-req
action   = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath  = /var/log/nginx/error.log
maxretry = 10
EOF
systemctl enable --now fail2ban

# ── 8. App directory structure ────────────────────────────────
info "Creating application directory structure..."
mkdir -p "$APP_DIR"/{staging,production}
mkdir -p "$APP_DIR"/staging/{logs,backups}
mkdir -p "$APP_DIR"/production/{logs,backups}
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

# ── 9. Clone / link code ──────────────────────────────────────
info "App directory: $APP_DIR"
info "Clone your repo to $APP_DIR with:"
info "  git clone git@github.com:YOUR_ORG/transconnect.git $APP_DIR/app"

# ── 10. Nginx site configs (shared-VPS safe) ─────────────────
# We use sites-available / sites-enabled so TransConnect configs
# are isolated from any other apps already on this server.
# The global /etc/nginx/nginx.conf is NOT modified.
info "Installing TransConnect Nginx site configs..."

SITES_AVAIL="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"

mkdir -p "$SITES_AVAIL" "$SITES_ENABLED"

# Copy TransConnect site files into sites-available
for CONF in "$APP_DIR/app/transconnect-infra/nginx/conf.d/"transconnect-*.conf; do
    BASENAME=$(basename "$CONF")
    cp "$CONF" "$SITES_AVAIL/$BASENAME"
    info "  installed: $SITES_AVAIL/$BASENAME"
done

# Also copy the shared proxy params snippet into conf.d (Nginx includes it)
cp "$APP_DIR/app/transconnect-infra/nginx/conf.d/_transconnect_proxy_params.conf" \
   /etc/nginx/conf.d/_transconnect_proxy_params.conf

# Enable the sites (create symlinks)
for CONF in "$SITES_AVAIL/"transconnect-*.conf; do
    BASENAME=$(basename "$CONF")
    ln -sf "$CONF" "$SITES_ENABLED/$BASENAME"
    info "  enabled:   $SITES_ENABLED/$BASENAME"
done

# Ensure the global nginx.conf includes sites-enabled
# (This is the default on Ubuntu/Debian — only add if missing)
if ! grep -q 'sites-enabled' /etc/nginx/nginx.conf; then
    warn "nginx.conf does not include sites-enabled. Adding include directive..."
    sed -i '/http {/a\    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
fi

if nginx -t; then
    systemctl reload nginx
    info "Nginx reloaded successfully"
else
    warn "nginx -t failed (SSL certs not yet issued — this is expected)."
    warn "Nginx was NOT reloaded. It will load correctly after step 5 (SSL certs)."
fi

# ── 11. SSL Certificates ──────────────────────────────────────
info ""
info "========================================================"
info "  ACTION REQUIRED: Obtain SSL certificates"
info "  Run the following commands AFTER your DNS is pointing"
info "  to this server IP:"
info ""
info "  # Production certificates"
info "  certbot --nginx -d $DOMAIN -d www.$DOMAIN \\"
info "    -d api.$DOMAIN -d admin.$DOMAIN \\"
info "    --non-interactive --agree-tos -m $ALERT_EMAIL"
info ""
info "  # Staging certificates"
info "  certbot --nginx -d $STAGING_DOMAIN \\"
info "    -d api-staging.$DOMAIN -d admin-staging.$DOMAIN \\"
info "    --non-interactive --agree-tos -m $ALERT_EMAIL"
info ""
info "  Certbot auto-renewal is enabled by default."
info "========================================================"

# ── 12. Swap (if < 2 GB RAM) ──────────────────────────────────
TOTAL_RAM=$(grep MemTotal /proc/meminfo | awk '{print $2}')
if [[ $TOTAL_RAM -lt 2097152 && ! -f /swapfile ]]; then
    info "RAM < 2 GB — creating 2 GB swapfile..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── 13. Log rotation for app logs ─────────────────────────────
cat > /etc/logrotate.d/transconnect <<EOF
$APP_DIR/*/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF

info ""
info "=== VPS setup complete ==="
info "Next steps:"
info "  1. Point your DNS A records to this server's IP"
info "  2. Clone your repo:  git clone ... $APP_DIR/app"
info "  3. Copy env files:   cp transconnect-infra/.env.staging.example $APP_DIR/staging/.env"
info "                       cp transconnect-infra/.env.production.example $APP_DIR/production/.env"
info "  4. Edit the .env files with real secrets"
info "  5. Run SSL setup commands above"
info "  6. Run deploy scripts:  bash transconnect-infra/scripts/deploy-staging.sh"
info "                          bash transconnect-infra/scripts/deploy-production.sh"
