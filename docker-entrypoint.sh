#!/bin/sh
set -e

echo "[Sailboard] Starting Nginx reverse proxy on port 80..."
mkdir -p /run/nginx
nginx

echo "[Sailboard] Starting NestJS Backend API & WebSocket Gateway on port 3333..."
exec npx tsx apps/api/src/main.ts
