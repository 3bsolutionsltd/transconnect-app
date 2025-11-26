#!/bin/bash

# Environment Switcher for TransConnect Frontend
# Usage: ./switch-env.sh [development|mobile|production]

ENV_TYPE=${1:-development}

echo "🔄 Switching to $ENV_TYPE environment..."

case $ENV_TYPE in
  "development")
    cp .env.local.development .env.local
    echo "✅ Switched to localhost development environment"
    echo "   Frontend: http://localhost:3002"
    echo "   Backend: http://localhost:5000"
    ;;
  "mobile")
    cp .env.local.mobile .env.local
    echo "✅ Switched to mobile testing environment"
    echo "   Frontend: http://192.168.1.2:3002"
    echo "   Backend: http://192.168.1.2:5000"
    ;;
  "production")
    cp .env.local.production .env.local
    echo "✅ Switched to production environment"
    echo "   ⚠️  Update URLs in .env.local for your production domain"
    ;;
  *)
    echo "❌ Invalid environment. Use: development, mobile, or production"
    exit 1
    ;;
esac

echo ""
echo "📋 Current configuration:"
cat .env.local
echo ""
echo "🔄 Restart your frontend server to apply changes"