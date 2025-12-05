#!/usr/bin/env bash
# ==========================================
# Production Entrypoint Script
# ==========================================
# This script runs before the main application starts in production mode
# It handles database connectivity and migrations with stricter error handling

set -e  # Exit on error

# Default environment variables (can be overridden)
: "${DB_HOST:=db}"
: "${DB_PORT:=5432}"
: "${DB_USER:=postgres}"
: "${DB_PASS:=postgres}"
: "${DB_NAME:=net_joub_v1}"
: "${RUN_MIGRATIONS:=false}"

echo "🚀 Starting NatJoub Backend (Production Mode)"
echo "================================================"

# ==========================================
# Wait for PostgreSQL to be ready
# ==========================================
echo "⏳ Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."

max_retries=60
retry_count=0

until bash -c "cat < /dev/tcp/${DB_HOST}/${DB_PORT}" >/dev/null 2>&1; do
  retry_count=$((retry_count + 1))
  if [ $retry_count -ge $max_retries ]; then
    echo "❌ FATAL: PostgreSQL not available after ${max_retries} attempts"
    exit 1
  fi
  printf '.'
  sleep 2
done

echo ""
echo "✅ PostgreSQL is ready!"

# ==========================================
# Run Database Migrations (Production)
# ==========================================
if [ "${RUN_MIGRATIONS}" = "true" ]; then
  echo ""
  echo "🔄 Running database migrations (PRODUCTION)..."

  # Production migrations should be more careful
  npx sequelize-cli db:migrate || {
    echo "❌ FATAL: Database migrations failed in production"
    exit 1
  }

  echo "✅ Migrations completed successfully"
else
  echo "⏭️  Skipping migrations (RUN_MIGRATIONS=false)"
fi

# ==========================================
# Start Application
# ==========================================
echo ""
echo "🎯 Starting production server..."
echo "================================================"
echo ""

# Execute the command passed to this script
# This will typically be "npm start"
exec "$@"
