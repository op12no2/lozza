#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Native bench ==="
"$SCRIPT_DIR/test/lozza" bench q
echo ""

echo "=== Node WASM bench ==="
printf "bench\nquit\n" | node "$SCRIPT_DIR/test/node-wrapper.js"
echo ""

echo "=== Done ==="
