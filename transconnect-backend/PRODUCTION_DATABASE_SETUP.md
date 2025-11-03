# TransConnect Backend Production Database Setup

## Overview

This guide covers the complete production database setup for TransConnect MVP1 Backend, including advanced features for monitoring, backups, performance optimization, and security.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ LTS
- PostgreSQL 12+
- Redis (optional, for caching)
- Sufficient disk space for backups
- SSL certificate for production deployment

### Environment Setup

1. **Copy environment template:**
   ```bash
   cp .env.production.example .env
   ```

2. **Configure production environment variables:**
   ```bash
   # Edit .env with your production values
   nano .env
   ```

3. **Run production setup script:**
   ```bash
   npm run production:setup
   ```

4. **Test the setup:**
   ```bash
   npm run test:production
   ```

## 📋 Production Features

### 🗄️ Database Service (`DatabaseService`)

**Features:**
- Connection pooling with configurable limits
- Health monitoring and metrics collection
- Transaction support with timeout handling
- Performance optimization utilities
- Redis integration for caching
- Comprehensive logging and error tracking

**Configuration:**
```env
DB_MAX_CONNECTIONS=20
DB_CONNECTION_TIMEOUT=10000
DB_QUERY_TIMEOUT=30000
DB_ENABLE_LOGGING=true
DB_ENABLE_METRICS=true
```

### 💾 Backup Service (`BackupService`)

**Features:**
- Automated scheduled backups
- Compression and encryption support
- Cloud storage integration ready
- Backup validation and integrity checks
- Retention policy management
- Backup restoration capabilities

**Configuration:**
```env
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true
BACKUP_ENCRYPTION=true
```

**Usage:**
```bash
# Manual backup
npm run production:backup

# View backup history
curl http://localhost:5000/api/admin/database/backups
```

### 📊 Monitoring Service (`MonitoringService`)

**Features:**
- Real-time performance metrics
- Connection pool monitoring
- Query performance analysis
- System resource tracking
- Automated alerting system
- Historical data retention

**Configuration:**
```env
MONITORING_ENABLED=true
MONITORING_INTERVAL=30000
ALERT_CONNECTION_POOL_USAGE=80
ALERT_QUERY_DURATION=5000
```

**Metrics Tracked:**
- Connection pool usage
- Query execution times
- Database size and growth
- System CPU, memory, disk usage
- Cache hit ratios
- Transaction rates

## 🔧 API Endpoints

### Database Administration

All endpoints require admin authentication.

#### Health Check
```http
GET /api/admin/database/health
```

#### Metrics
```http
GET /api/admin/database/metrics?hours=24
```

#### Alerts
```http
GET /api/admin/database/alerts
```

#### Create Backup
```http
POST /api/admin/database/backup
Content-Type: application/json

{
  "type": "manual"
}
```

#### Database Optimization
```http
POST /api/admin/database/optimize
```

#### Generate Report
```http
GET /api/admin/database/report?hours=24
```

## 🛠️ Management Scripts

### Database Connection Test
```bash
npm run db:test-connection
```

### Database Optimization
```bash
npm run db:optimize
```

### Manual Backup
```bash
npm run db:backup
```

### Production Health Check
```bash
npm run production:health
```

### System Monitoring
```bash
npm run production:monitor
```

## 📈 Performance Optimization

### Database Configuration

Add to your PostgreSQL configuration:

```postgresql
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connection settings
max_connections = 100
statement_timeout = 30s

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Application Tuning

1. **Connection Pooling:**
   - Configured automatically via `DatabaseService`
   - Adjust `DB_MAX_CONNECTIONS` based on your server capacity

2. **Query Optimization:**
   - Monitor slow queries via `/api/admin/database/stats`
   - Add indexes for frequently queried columns
   - Use query performance analysis tools

3. **Caching:**
   - Redis integration for session management
   - Query result caching for frequently accessed data

## 🔐 Security Measures

### Database Security
- [x] Connection string security (no hardcoded credentials)
- [x] SSL/TLS encryption for database connections
- [x] Backup encryption with configurable keys
- [x] Access control with admin-only endpoints
- [x] SQL injection protection via Prisma ORM

### Application Security
- [x] JWT-based authentication
- [x] Rate limiting on API endpoints
- [x] Security headers via Helmet.js
- [x] Input validation and sanitization
- [x] Error handling without information leakage

### Server Security
- [x] Non-root user execution
- [x] Firewall configuration
- [x] SSL certificate automation scripts
- [x] Log file rotation and management
- [x] System resource monitoring

## 📱 Monitoring & Alerting

### Alert Types

1. **Connection Pool Alerts:**
   - Triggered when usage > 80%
   - Helps prevent connection exhaustion

2. **Performance Alerts:**
   - Slow queries > 5 seconds
   - High CPU/memory usage

3. **System Alerts:**
   - Disk space > 85%
   - Database connection failures

### Notification Channels

Configure alerts via environment variables:
```env
ALERT_EMAIL_ENABLED=true
ALERT_SLACK_ENABLED=true
ALERT_WEBHOOK_URL=https://your-webhook-url
```

## 🚦 Deployment Process

### 1. Pre-deployment Checklist

```bash
# Verify environment configuration
npm run test:production

# Check database migrations
npx prisma migrate status

# Validate backup system
npm run production:backup

# Test monitoring system
npm run production:monitor
```

### 2. Deployment Steps

```bash
# 1. Build application
npm run build

# 2. Deploy database migrations
npx prisma migrate deploy

# 3. Start application
npm start

# 4. Verify deployment
npm run production:health
```

### 3. Post-deployment

```bash
# Set up system service
sudo cp transconnect-backend.service /etc/systemd/system/
sudo systemctl enable transconnect-backend
sudo systemctl start transconnect-backend

# Install cron jobs
crontab cron-jobs.txt

# Configure SSL
./scripts/ssl-setup.sh your-domain.com
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failures:**
   ```bash
   # Test connection
   npm run db:test-connection
   
   # Check database logs
   sudo journalctl -u postgresql
   ```

2. **High Memory Usage:**
   ```bash
   # Check connection pool status
   curl http://localhost:5000/api/admin/database/health
   
   # Monitor system resources
   npm run production:monitor
   ```

3. **Slow Queries:**
   ```bash
   # Get database statistics
   curl http://localhost:5000/api/admin/database/stats
   
   # Run optimization
   npm run db:optimize
   ```

### Log Files

- Application logs: `logs/app.log`
- Monitoring logs: `logs/monitoring/`
- Backup logs: `logs/backup.log`
- Error logs: Filter with `npm run logs:errors`

## 📞 Support

For production support:

1. Check the monitoring dashboard: `/api/admin/database/report`
2. Review system logs: `npm run logs:view`
3. Run health diagnostics: `npm run production:health`
4. Contact system administrators with error details

## 📚 Additional Resources

- [Performance Tuning Guide](./PERFORMANCE_TUNING.md)
- [Security Checklist](./SECURITY_CHECKLIST.md)
- [Backup and Recovery Procedures](./scripts/backup.sh)
- [Monitoring Setup Guide](./scripts/monitor.sh)

---

**TransConnect MVP1 Production Database Setup**  
Version 1.0 | Last Updated: November 2024