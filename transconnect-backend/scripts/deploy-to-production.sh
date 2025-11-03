#!/bin/bash

# TransConnect Production Deployment Script
# This script deploys TransConnect to production cloud platforms

set -e

echo "🚀 TransConnect Production Deployment Started"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
DEPLOYMENT_ENV=${1:-production}
PLATFORM=${2:-render}

print_status "Deployment Environment: $DEPLOYMENT_ENV"
print_status "Target Platform: $PLATFORM"

# Validate environment
if [ ! -f ".env.$DEPLOYMENT_ENV" ]; then
    print_error "Environment file .env.$DEPLOYMENT_ENV not found"
    print_status "Please copy .env.production.example to .env.$DEPLOYMENT_ENV and configure it"
    exit 1
fi

# Load environment variables
print_status "Loading environment configuration..."
export $(grep -v '^#' .env.$DEPLOYMENT_ENV | xargs)

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher. Current: $(node --version)"
    exit 1
fi
print_success "Node.js version check passed"

# Install dependencies
print_status "Installing production dependencies..."
npm ci --only=production --silent

# Build application
print_status "Building TypeScript application..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Run production tests
print_status "Running production readiness tests..."
npm run test:production-quick

if [ $? -eq 0 ]; then
    print_success "Production tests passed"
else
    print_warning "Some tests failed - proceeding with caution"
fi

# Platform-specific deployment
case $PLATFORM in
    "render")
        print_status "Preparing deployment for Render..."
        
        # Create render.yaml
        cat > render.yaml << EOF
services:
  - type: web
    name: transconnect-backend
    env: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: transconnect-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: BACKUP_ENCRYPTION_KEY
        generateValue: true

databases:
  - name: transconnect-db
    plan: starter
    databaseName: transconnect
    user: transconnect

EOF
        print_success "Render configuration created"
        ;;
        
    "railway")
        print_status "Preparing deployment for Railway..."
        
        # Create railway.toml
        cat > railway.toml << EOF
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "always"

[[services]]
name = "backend"
source = "."

[services.variables]
NODE_ENV = "production"
PORT = "5000"

[[services]]
name = "database"
source = "postgres"
EOF
        print_success "Railway configuration created"
        ;;
        
    "heroku")
        print_status "Preparing deployment for Heroku..."
        
        # Create Procfile
        cat > Procfile << EOF
web: npm start
worker: npm run worker
release: npx prisma migrate deploy
EOF

        # Create app.json
        cat > app.json << EOF
{
  "name": "TransConnect Backend",
  "description": "Bus ticketing and ride connector platform",
  "repository": "https://github.com/your-repo/transconnect-backend",
  "logo": "https://your-domain.com/logo.png",
  "keywords": ["node", "express", "prisma", "postgresql"],
  "addons": [
    "heroku-postgresql:mini",
    "heroku-redis:mini"
  ],
  "env": {
    "NODE_ENV": {
      "value": "production"
    },
    "JWT_SECRET": {
      "generator": "secret"
    },
    "BACKUP_ENCRYPTION_KEY": {
      "generator": "secret"
    }
  },
  "scripts": {
    "postdeploy": "npx prisma migrate deploy && npx prisma db seed"
  }
}
EOF
        print_success "Heroku configuration created"
        ;;
        
    *)
        print_error "Unsupported platform: $PLATFORM"
        print_status "Supported platforms: render, railway, heroku"
        exit 1
        ;;
esac

# Create deployment info file
cat > deployment-info.json << EOF
{
  "deploymentId": "deploy-$(date +%Y%m%d-%H%M%S)",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$DEPLOYMENT_ENV",
  "platform": "$PLATFORM",
  "nodeVersion": "$(node --version)",
  "buildHash": "$(git rev-parse HEAD 2>/dev/null || echo 'no-git')",
  "version": "$(npm pkg get version | tr -d '\"')"
}
EOF

print_success "Deployment info created"

# Create environment variables template for platform
print_status "Creating environment variables template..."

cat > env-vars-template.txt << EOF
# Copy these environment variables to your cloud platform

# Essential Configuration
NODE_ENV=production
PORT=5000
DATABASE_URL=[Your PostgreSQL connection string]
JWT_SECRET=[Generate strong secret]

# Domain Configuration
FRONTEND_URL=https://your-domain.com
API_URL=https://api.your-domain.com

# Payment Configuration (Replace with live credentials)
FLUTTERWAVE_PUBLIC_KEY=[Your live public key]
FLUTTERWAVE_SECRET_KEY=[Your live secret key]
FLUTTERWAVE_WEBHOOK_SECRET=[Your webhook secret]

# Firebase Configuration
FIREBASE_PROJECT_ID=[Your Firebase project]
FIREBASE_PRIVATE_KEY=[Your Firebase private key]
FIREBASE_CLIENT_EMAIL=[Your Firebase client email]

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[Your email]
SMTP_PASS=[Your app password]

# Production Features
ENABLE_PRODUCTION_FEATURES=true
BACKUP_ENABLED=true
MONITORING_ENABLED=true

# See .env.production for complete list
EOF

print_success "Environment variables template created"

# Create database migration script
print_status "Creating database migration script..."

cat > migrate-database.sh << 'EOF'
#!/bin/bash

echo "🗄️  Running database migrations..."

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
if [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
fi

echo "✅ Database setup complete"
EOF

chmod +x migrate-database.sh
print_success "Database migration script created"

# Create health check endpoint test
print_status "Creating health check test..."

cat > test-health.sh << 'EOF'
#!/bin/bash

# Health check script for production deployment
URL=${1:-http://localhost:5000}

echo "🔍 Testing health endpoint: $URL/health"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/health")

if [ "$RESPONSE" = "200" ]; then
    echo "✅ Health check passed"
    exit 0
else
    echo "❌ Health check failed (HTTP $RESPONSE)"
    exit 1
fi
EOF

chmod +x test-health.sh
print_success "Health check test created"

# Create Docker configuration (optional)
print_status "Creating Docker configuration..."

cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache postgresql-client

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S transconnect -u 1001

# Create directories
RUN mkdir -p /app/logs /app/backups /app/uploads
RUN chown -R transconnect:nodejs /app

USER transconnect

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start application
CMD ["npm", "start"]
EOF

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
      - ./backups:/app/backups
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=transconnect
      - POSTGRES_USER=transconnect
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
EOF

print_success "Docker configuration created"

# Create deployment checklist
print_status "Creating deployment checklist..."

cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# TransConnect Production Deployment Checklist

## Pre-Deployment ✅

- [ ] Environment variables configured (.env.production)
- [ ] Database connection string updated
- [ ] Payment gateway credentials (live mode)
- [ ] Firebase configuration updated
- [ ] Domain names configured
- [ ] SSL certificates ready

## Platform Setup ✅

- [ ] Cloud platform account created
- [ ] Database service provisioned
- [ ] Redis cache service (optional)
- [ ] File storage configured
- [ ] Monitoring service enabled

## Security ✅

- [ ] Strong JWT secret generated
- [ ] Database password secured
- [ ] API keys protected
- [ ] Backup encryption key set
- [ ] CORS origins configured

## Database ✅

- [ ] Production database created
- [ ] Migrations executed
- [ ] Seed data loaded (if needed)
- [ ] Backup system configured
- [ ] Performance monitoring enabled

## Testing ✅

- [ ] Health endpoint responding
- [ ] Database connectivity verified
- [ ] API endpoints functional
- [ ] Payment integration tested
- [ ] Notification system working

## Post-Deployment ✅

- [ ] Domain DNS configured
- [ ] SSL certificate installed
- [ ] Monitoring alerts set up
- [ ] Backup system validated
- [ ] Performance baseline established

## Go-Live ✅

- [ ] Frontend deployed and connected
- [ ] Mobile app updated with live API
- [ ] First test transaction completed
- [ ] User registration tested
- [ ] Admin dashboard accessible
EOF

print_success "Deployment checklist created"

# Final deployment summary
echo ""
echo "🎉 PRODUCTION DEPLOYMENT PREPARATION COMPLETE!"
echo "=============================================="
echo ""
echo "📁 Files Created:"
echo "  ✅ Platform configuration ($PLATFORM)"
echo "  ✅ Environment variables template"
echo "  ✅ Database migration script"
echo "  ✅ Health check test"
echo "  ✅ Docker configuration"
echo "  ✅ Deployment checklist"
echo ""
echo "🚀 Next Steps:"
echo "  1. Review and update environment variables"
echo "  2. Create account on $PLATFORM"
echo "  3. Set up database service"
echo "  4. Deploy application"
echo "  5. Configure domain and SSL"
echo "  6. Run post-deployment tests"
echo ""
echo "📋 Platform-Specific Instructions:"

case $PLATFORM in
    "render")
        echo "  Render Deployment:"
        echo "  1. Go to https://render.com"
        echo "  2. Create new Web Service"
        echo "  3. Connect your Git repository"
        echo "  4. Upload render.yaml configuration"
        echo "  5. Set environment variables from env-vars-template.txt"
        ;;
    "railway")
        echo "  Railway Deployment:"
        echo "  1. Go to https://railway.app"
        echo "  2. Create new project"
        echo "  3. Connect your Git repository"
        echo "  4. Add PostgreSQL database"
        echo "  5. Set environment variables from env-vars-template.txt"
        ;;
    "heroku")
        echo "  Heroku Deployment:"
        echo "  1. Install Heroku CLI"
        echo "  2. heroku create your-app-name"
        echo "  3. heroku addons:create heroku-postgresql:mini"
        echo "  4. Set environment variables: heroku config:set KEY=VALUE"
        echo "  5. git push heroku main"
        ;;
esac

echo ""
echo "📞 Support:"
echo "  - Documentation: ./DEPLOYMENT_CHECKLIST.md"
echo "  - Health check: ./test-health.sh https://your-api-url.com"
echo "  - Database setup: ./migrate-database.sh"
echo ""
print_success "Ready for production deployment! 🚀"