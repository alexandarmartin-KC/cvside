#!/bin/bash
# Run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Running database migrations..."
  npx prisma migrate deploy
else
  echo "Skipping migrations: DATABASE_URL not set"
fi
