#!/usr/bin/env bash
# Runs the Supabase migration and the row-level security tests on a throwaway local Postgres.
# Needs postgres, initdb, pg_ctl and psql on the PATH. Used when Docker, and so the Supabase local stack,
# is not available. Usage: npm run test:rls
set -euo pipefail
DIR=$(mktemp -d)
PORT=${RLS_PORT:-54329}
cleanup() { pg_ctl -D "$DIR/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DIR"; }
trap cleanup EXIT
initdb -D "$DIR/data" -U postgres -A trust >/dev/null
pg_ctl -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" start >/dev/null
for i in $(seq 1 30); do pg_isready -h "$DIR" -p "$PORT" >/dev/null 2>&1 && break; sleep 0.2; done
run() { psql -h "$DIR" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -f "$1"; }
run supabase/tests/00_stub_auth.sql
for m in supabase/migrations/*.sql; do run "$m"; done
run supabase/tests/10_rls_test.sql
