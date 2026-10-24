#!/bin/sh
set -eu
case "$0" in
  */*) SCRIPT_DIR=${0%/*} ;;
  *) SCRIPT_DIR=. ;;
esac
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR" && pwd)
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is missing. Install Node 22.13+; see docs/DEVELOPER-SOP.md." >&2
  exit 1
fi
exec node "$PROJECT_ROOT/scripts/start.mjs" "$@"
