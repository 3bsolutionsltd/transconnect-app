# Backend Dockerfile
FROM node:20-alpine AS builder

# Required by Prisma engines on Alpine (OpenSSL 3.x)
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and Prisma schema first (needed for postinstall / prisma generate)
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma

# Install all deps (dev included for TypeScript build), skip postinstall
RUN npm ci --ignore-scripts

# Generate Prisma client
RUN npx prisma generate

# Copy remaining source and build
COPY . .
RUN npm run build

# ── Production stage ──────────────────────────────────────────
FROM node:20-alpine

# Required by Prisma engines on Alpine (OpenSSL 3.x)
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev --ignore-scripts
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
COPY scripts ./scripts

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start application
CMD ["npm", "start"]