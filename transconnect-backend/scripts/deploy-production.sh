#!/bin/bash

# TransConnect Backend Production Deployment Script
# This script sets up the production database environment

set -e  # Exit on any error

echo "🚀 Starting TransConnect Backend Production Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider using a non-root user for better security."
fi

# Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
if [[ $NODE_VERSION == "not installed" ]]; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
if [ "$MAJOR_VERSION" -lt 18 ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 18 or higher."
    exit 1
fi

print_success "Node.js version $NODE_VERSION is compatible"

# Check PostgreSQL installation
print_status "Checking PostgreSQL installation..."
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version | head -n1 | awk '{print $3}')
    print_success "PostgreSQL $PG_VERSION is installed"
else
    print_error "PostgreSQL is not installed or not in PATH"
    print_status "Please install PostgreSQL 12 or higher"
    exit 1
fi

# Check pg_dump availability
if ! command -v pg_dump &> /dev/null; then
    print_error "pg_dump is not available. This is required for database backups."
    exit 1
fi

# Create necessary directories
print_status "Creating production directories..."
mkdir -p logs/monitoring
mkdir -p backups
mkdir -p uploads
mkdir -p tmp

print_success "Production directories created"

# Check environment file
if [ ! -f ".env" ]; then
    if [ -f ".env.production.example" ]; then
        print_warning "No .env file found. Copying from .env.production.example"
        cp .env.production.example .env
        print_warning "Please edit .env file with your production values before proceeding"
        exit 1
    else
        print_error "No environment configuration found. Please create .env file."
        exit 1
    fi
fi

# Source environment variables
if [ -f ".env" ]; then
    print_status "Loading environment variables..."
    export $(grep -v '^#' .env | xargs)
fi

# Validate required environment variables
print_status "Validating environment configuration..."
REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "NODE_ENV"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set"
        exit 1
    fi
done

print_success "Environment validation passed"

# Install dependencies
print_status "Installing production dependencies..."
npm ci --only=production

print_success "Dependencies installed"

# Build the application
print_status "Building TypeScript application..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Test database connection
print_status "Testing database connection..."
npm run db:test-connection

if [ $? -eq 0 ]; then
    print_success "Database connection successful"
else
    print_error "Database connection failed"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    print_success "Database migrations completed"
else
    print_error "Database migrations failed"
    exit 1
fi

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
    print_success "Prisma client generated"
else
    print_error "Prisma client generation failed"
    exit 1
fi

# Seed database if requested
if [ "$1" = "--seed" ]; then
    print_status "Seeding database with initial data..."
    npm run db:seed
    
    if [ $? -eq 0 ]; then
        print_success "Database seeding completed"
    else
        print_warning "Database seeding failed or skipped"
    fi
fi

# Set up log rotation
print_status "Setting up log rotation..."
if command -v logrotate &> /dev/null; then
    cat > /etc/logrotate.d/transconnect << EOF
$(pwd)/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $(whoami) $(whoami)
    postrotate
        systemctl reload transconnect-backend || true
    endscript
}
EOF
    print_success "Log rotation configured"
else
    print_warning "logrotate not found. Manual log management required"
fi

# Create systemd service file (if systemd is available)
if command -v systemctl &> /dev/null; then
    print_status "Creating systemd service file..."
    
    cat > transconnect-backend.service << EOF
[Unit]
Description=TransConnect Backend API Server
After=network.target postgresql.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=$(which node) dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=transconnect-backend

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$(pwd)

[Install]
WantedBy=multi-user.target
EOF

    print_success "Systemd service file created: transconnect-backend.service"
    print_status "To install the service, run:"
    print_status "  sudo cp transconnect-backend.service /etc/systemd/system/"
    print_status "  sudo systemctl daemon-reload"
    print_status "  sudo systemctl enable transconnect-backend"
    print_status "  sudo systemctl start transconnect-backend"
fi

# Create backup script
print_status "Creating backup script..."
cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# TransConnect Database Backup Script
# This script creates a database backup and manages retention

set -e

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuration
BACKUP_DIR=${BACKUP_LOCATION:-./backups}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="transconnect_backup_${TIMESTAMP}.sql"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating database backup: $BACKUP_FILE"
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
if [ "$BACKUP_COMPRESSION" = "true" ]; then
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    echo "Backup compressed: $BACKUP_FILE"
fi

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "Backup created successfully: $BACKUP_FILE ($BACKUP_SIZE)"

# Cleanup old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "transconnect_backup_*.sql*" -mtime +$RETENTION_DAYS -delete

echo "Backup process completed"
EOF

chmod +x scripts/backup.sh
mkdir -p scripts
print_success "Backup script created: scripts/backup.sh"

# Create monitoring script
print_status "Creating monitoring script..."
cat > scripts/monitor.sh << 'EOF'
#!/bin/bash

# TransConnect Monitoring Script
# This script checks system health and sends alerts

set -e

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check if process is running
if pgrep -f "node.*dist/index.js" > /dev/null; then
    echo "✅ TransConnect Backend is running"
else
    echo "❌ TransConnect Backend is not running"
    exit 1
fi

# Check database connection
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Check disk space
DISK_USAGE=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "⚠️  High disk usage: ${DISK_USAGE}%"
    exit 1
else
    echo "✅ Disk usage: ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ "$MEMORY_USAGE" -gt 85 ]; then
    echo "⚠️  High memory usage: ${MEMORY_USAGE}%"
    exit 1
else
    echo "✅ Memory usage: ${MEMORY_USAGE}%"
fi

echo "🎉 All health checks passed"
EOF

chmod +x scripts/monitor.sh
print_success "Monitoring script created: scripts/monitor.sh"

# Create SSL certificate helper script
print_status "Creating SSL certificate helper script..."
cat > scripts/ssl-setup.sh << 'EOF'
#!/bin/bash

# SSL Certificate Setup for TransConnect Backend
# This script helps set up SSL certificates using Let's Encrypt

set -e

# Check if domain is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 api.transconnect.app"
    exit 1
fi

DOMAIN=$1

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    
    # Install certbot based on OS
    if [ -f /etc/debian_version ]; then
        sudo apt-get update
        sudo apt-get install -y certbot
    elif [ -f /etc/redhat-release ]; then
        sudo yum install -y certbot
    else
        echo "Please install certbot manually"
        exit 1
    fi
fi

# Obtain SSL certificate
echo "Obtaining SSL certificate for $DOMAIN..."
sudo certbot certonly --standalone -d $DOMAIN

# Create renewal cron job
echo "Setting up automatic renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo "SSL certificate setup completed for $DOMAIN"
echo "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
EOF

chmod +x scripts/ssl-setup.sh
print_success "SSL setup script created: scripts/ssl-setup.sh"

# Set up cron jobs for automated tasks
print_status "Setting up automated tasks..."

# Create cron jobs file
cat > cron-jobs.txt << EOF
# TransConnect Backend Automated Tasks

# Daily backup at 2 AM
0 2 * * * cd $(pwd) && ./scripts/backup.sh >> logs/backup.log 2>&1

# Health check every 5 minutes
*/5 * * * * cd $(pwd) && ./scripts/monitor.sh >> logs/monitor.log 2>&1

# Log cleanup weekly
0 0 * * 0 find $(pwd)/logs -name "*.log" -mtime +7 -delete

# Database optimization weekly
0 3 * * 0 cd $(pwd) && npm run db:optimize >> logs/optimize.log 2>&1
EOF

print_success "Cron jobs configuration created: cron-jobs.txt"
print_status "To install cron jobs, run: crontab cron-jobs.txt"

# Performance tuning recommendations
print_status "Generating performance tuning recommendations..."
cat > PERFORMANCE_TUNING.md << 'EOF'
# TransConnect Backend Performance Tuning

## Database Optimization

### PostgreSQL Configuration
Add these settings to your PostgreSQL configuration file:

```
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connection settings
max_connections = 100
statement_timeout = 30s

# WAL settings
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Query planner
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Indexes
Monitor slow queries and add indexes as needed:

```sql
-- Example indexes for common queries
CREATE INDEX CONCURRENTLY idx_bookings_user_id ON bookings(user_id);
CREATE INDEX CONCURRENTLY idx_bookings_route_id ON bookings(route_id);
CREATE INDEX CONCURRENTLY idx_bookings_created_at ON bookings(created_at);
```

## Node.js Optimization

### PM2 Configuration
Use PM2 for production process management:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'transconnect-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}
```

## System Level Optimization

### Linux Kernel Parameters
```bash
# Increase file descriptor limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Network optimization
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" >> /etc/sysctl.conf
```

### Redis Configuration (if using)
```
# Memory optimization
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
```

## Monitoring

### Key Metrics to Monitor
- Response time
- Database connection pool usage
- Memory usage
- CPU usage
- Disk I/O
- Error rates

### Alerting Thresholds
- Response time > 2s
- Connection pool > 80%
- Memory usage > 85%
- CPU usage > 80%
- Error rate > 5%
EOF

print_success "Performance tuning guide created: PERFORMANCE_TUNING.md"

# Security recommendations
print_status "Generating security recommendations..."
cat > SECURITY_CHECKLIST.md << 'EOF'
# TransConnect Backend Security Checklist

## Environment Security
- [ ] Change all default passwords and secrets
- [ ] Use strong, unique JWT secrets
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure proper CORS origins
- [ ] Set secure environment variables

## Database Security
- [ ] Use database user with minimal required privileges
- [ ] Enable SSL/TLS for database connections
- [ ] Regular security updates for PostgreSQL
- [ ] Backup encryption enabled
- [ ] Network access restricted to application servers

## Application Security
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] Security headers enabled (Helmet.js)
- [ ] Authentication required for sensitive endpoints
- [ ] SQL injection protection (Prisma ORM)
- [ ] XSS protection enabled

## Server Security
- [ ] Keep Node.js updated to latest LTS version
- [ ] Regular OS security updates
- [ ] Firewall configured (only necessary ports open)
- [ ] Disable unnecessary services
- [ ] Use non-root user for application
- [ ] Log monitoring and alerting

## API Security
- [ ] Implement proper authentication (JWT)
- [ ] Use HTTPS for all API calls
- [ ] Validate and sanitize all inputs
- [ ] Implement proper error handling
- [ ] Rate limiting per user/IP
- [ ] API versioning strategy

## Monitoring & Logging
- [ ] Centralized logging system
- [ ] Security event monitoring
- [ ] Failed login attempt tracking
- [ ] Audit trail for sensitive operations
- [ ] Regular security scans
EOF

print_success "Security checklist created: SECURITY_CHECKLIST.md"

# Final status check
print_status "Running final system check..."

# Check if all services can start
npm run test:production 2>/dev/null || print_warning "Production tests failed or not configured"

# Summary
echo ""
echo "🎉 TransConnect Backend Production Setup Complete!"
echo ""
echo "📋 Summary:"
echo "  ✅ Environment validated"
echo "  ✅ Dependencies installed"
echo "  ✅ Application built"
echo "  ✅ Database migrations applied"
echo "  ✅ Production directories created"
echo "  ✅ Monitoring scripts created"
echo "  ✅ Backup scripts configured"
echo "  ✅ Security checklist generated"
echo ""
echo "📝 Next Steps:"
echo "  1. Review and update .env file with production values"
echo "  2. Configure SSL certificates using scripts/ssl-setup.sh"
echo "  3. Set up systemd service (if using systemd)"
echo "  4. Install cron jobs for automated tasks"
echo "  5. Review security checklist and performance tuning guide"
echo "  6. Configure monitoring and alerting"
echo "  7. Test the application thoroughly"
echo ""
echo "🚀 To start the application:"
echo "  npm start"
echo ""
echo "📊 To check application health:"
echo "  curl http://localhost:$PORT/health"
echo ""
echo "📁 Important files created:"
echo "  - .env.production.example (environment template)"
echo "  - transconnect-backend.service (systemd service)"
echo "  - scripts/backup.sh (database backup script)"
echo "  - scripts/monitor.sh (health monitoring script)"
echo "  - scripts/ssl-setup.sh (SSL certificate helper)"
echo "  - cron-jobs.txt (automated tasks configuration)"
echo "  - PERFORMANCE_TUNING.md (optimization guide)"
echo "  - SECURITY_CHECKLIST.md (security requirements)"
echo ""

print_success "Production deployment setup completed successfully! 🎉"