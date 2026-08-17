#!/bin/sh
set -e

echo "Running database migrations..."
node ./node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js

echo "Seeding admin user (if needed)..."
node dist/database/seeds/seed.js

echo "Starting application..."
exec node dist/main
