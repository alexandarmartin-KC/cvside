#!/bin/bash
# Run this script to apply the password authentication migration

echo "Applying password authentication migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "Please set it with: export DATABASE_URL='your-database-url'"
    exit 1
fi

# Apply the migration SQL
psql "$DATABASE_URL" -f prisma/migrations/20251217000000_add_password_auth/migration.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
else
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi
