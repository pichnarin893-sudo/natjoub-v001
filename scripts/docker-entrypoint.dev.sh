#!/usr/bin/env bash
# ==========================================
# Development Entrypoint Script
# ==========================================
# This script runs before the main application starts in development mode
# It handles database connectivity and migrations

set -e  # Exit on error

# Default environment variables (can be overridden)
: "${DB_HOST:=db}"
: "${DB_PORT:=5432}"
: "${DB_USER:=postgres}"
: "${DB_PASS:=postgres}"
: "${DB_NAME:=net_joub_v1}"
: "${MIGRATE:=false}"
: "${SEED:=false}"

echo "🚀 Starting NatJoub Backend (Development Mode)"
echo "================================================"

# ==========================================
# Wait for PostgreSQL to be ready
# ==========================================
echo "⏳ Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."

# Use a portable TCP check with bash /dev/tcp
max_retries=30
retry_count=0

until bash -c "cat < /dev/tcp/${DB_HOST}/${DB_PORT}" >/dev/null 2>&1; do
  retry_count=$((retry_count + 1))
  if [ $retry_count -ge $max_retries ]; then
    echo "❌ ERROR: PostgreSQL not available after ${max_retries} attempts"
    exit 1
  fi
  printf '.'
  sleep 1
done

echo ""
echo "✅ PostgreSQL is ready!"

# ==========================================
# Run Database Migrations
# ==========================================
if [ "${MIGRATE}" = "true" ]; then
  echo ""
  echo "🔄 Running database migrations..."

  # Use sequelize-cli with explicit database URL
  npx sequelize-cli db:migrate || {
    echo "❌ ERROR: Database migrations failed"
    exit 1
  }

  echo "✅ Migrations completed successfully"
fi

# ==========================================
# Run Database Seeders (Optional)
# ==========================================
if [ "${SEED}" = "true" ]; then
  echo ""
  echo "🌱 Running database seeders..."

  npx sequelize-cli db:seed:all || {
    echo "⚠️  WARNING: Seeders failed (this might be expected)"
  }

  echo "✅ Seeders completed"
fi

# ==========================================
# Start Application
# ==========================================
echo ""
echo "🎯 Starting application..."
echo "================================================"
echo ""

# Execute the command passed to this script
# This will typically be "npm run dev"
exec "$@"
