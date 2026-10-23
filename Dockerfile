# ========================================================
# Unified Dockerfile for Sailboard (Frontend & Backend)
# Runs both Frontend (Nginx on port 80) and Backend
# (NestJS API & WebSocket on port 3333) in ONE container.
# ========================================================

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native Node packages
RUN apk add --no-cache python3 make g++

# Copy workspace package manifests
COPY package*.json nx.json tsconfig*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY libs/shared-types/package.json ./libs/shared-types/

# Clean install all dependencies
RUN npm ci

# Copy sources needed for build
COPY libs/shared-types ./libs/shared-types
COPY apps/web ./apps/web
COPY apps/api ./apps/api

# Build Vite frontend production bundle
RUN npx nx run web:build

# Stage 2: Unified Container Runner (Nginx + Node.js)
FROM node:20-alpine AS runner

WORKDIR /app

# Install Nginx and build tools for native packages
RUN apk add --no-cache nginx python3 make g++

# Create directories for Nginx runtime and static files
RUN mkdir -p /run/nginx /usr/share/nginx/html /etc/nginx/http.d /etc/nginx/conf.d

# Copy workspace package manifests and install dependencies
COPY package*.json nx.json tsconfig*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY libs/shared-types/package.json ./libs/shared-types/

RUN npm ci

# Copy shared types and backend API source code
COPY libs/shared-types ./libs/shared-types
COPY apps/api ./apps/api

# Copy compiled frontend assets from builder stage
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy container entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Production Environment variables
ENV NODE_ENV=production
ENV PORT=3333

# Expose container entrypoint ports (80 and 3250)
EXPOSE 80 3250

ENTRYPOINT ["/app/docker-entrypoint.sh"]
