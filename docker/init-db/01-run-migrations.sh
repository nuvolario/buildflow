#!/bin/bash
# BuildFlow - Database Initialization Script
# Runs all migrations in order on first container startup

set -e

echo "BuildFlow: Starting database initialization..."

# Wait for MySQL to be ready
until mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -h localhost "$MYSQL_DATABASE" -e "SELECT 1" > /dev/null 2>&1; do
  echo "Waiting for MySQL to be ready..."
  sleep 2
done

echo "MySQL is ready. Running migrations..."

# Get the directory where migrations are mounted
MIGRATIONS_DIR="/docker-entrypoint-initdb.d/migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "No migrations directory found at $MIGRATIONS_DIR"
  echo "Migrations will be run manually via 'npm run migrate'"
  exit 0
fi

# Run each migration file in order
for migration in $(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
  echo "Running migration: $(basename $migration)"
  mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "$migration"
  echo "Completed: $(basename $migration)"
done

echo "BuildFlow: Database initialization complete!"
