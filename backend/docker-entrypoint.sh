#!/bin/sh
# BuildFlow Backend - Docker Entrypoint
# Waits for MySQL and runs migrations before starting the app

set -e

echo "BuildFlow Backend: Starting..."

# Wait for MySQL to be ready
echo "Waiting for MySQL at $DB_HOST:$DB_PORT..."

while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  echo "MySQL is not ready yet. Retrying in 2 seconds..."
  sleep 2
done

echo "MySQL is available!"

# Additional wait for MySQL to be fully ready
sleep 3

# Run migrations
echo "Running database migrations..."
npm run migrate || {
  echo "Migration failed, but continuing..."
}

echo "Starting application..."
exec npm run dev
