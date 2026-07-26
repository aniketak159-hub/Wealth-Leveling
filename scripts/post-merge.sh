#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm run build:libs
pnpm --filter db push

# Do not seed demo or test-user data here.
# A fresh import should start with an empty vault. The optional snapshot can
# still be restored manually with scripts/seed-test-user/restore.mjs when a
# development fixture is needed.
echo "Database schema ready; starting with an empty vault."
