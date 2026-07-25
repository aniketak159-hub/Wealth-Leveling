#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

# Seed the test user (jagruthi1221@gmail.com) into the database.
# This is idempotent — safe to run on every setup. All data lives in
# scripts/seed-test-user/data.json and is restored via UPSERT so nothing
# is overwritten if the user already exists with up-to-date data.
echo "Seeding test user..."
node scripts/seed-test-user/restore.mjs
