#!/usr/bin/env bash
# Full end-to-end run on a throwaway database and a production build.
set -euo pipefail
cd "$(dirname "$0")/.."
PB=/opt/homebrew/opt/postgresql@16/bin
export DATABASE_URL="postgresql://$USER@localhost:5432/mstech_test?schema=public"
export NEXTAUTH_URL=http://localhost:3100 NEXTAUTH_SECRET=e2e-secret-e2e-secret-e2e-secret-e2e ENCRYPTION_KEY=$(printf 'a%.0s' {1..64})
export NEXT_DIST_DIR=.next
if [ "${SKIP_BUILD:-}" != 1 ]; then
  lsof -ti tcp:3100 -sTCP:LISTEN | xargs kill 2>/dev/null || true
  "$PB/dropdb" --if-exists mstech_test; "$PB/createdb" mstech_test
  npx prisma db push >/dev/null
  npx next build
fi
npx playwright test "$@"
