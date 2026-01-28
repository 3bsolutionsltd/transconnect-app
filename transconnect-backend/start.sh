#!/bin/bash

echo "==> Running database migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "==> Database migrations deployed successfully"
else
  echo "==> Migration failed, but continuing startup..."
fi

echo "==> Seeding database if needed..."
node scripts/seed-staging-data.js || echo "Seeding skipped (may already be seeded)"

echo "==> Starting application..."
node dist/index.js
