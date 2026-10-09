#!/bin/bash

# build wasm/nnue.c and put its base64 into netWasm() in lozza.js, run from anywhere: wasm/build.sh
# needs clang with the wasm32 target and wasm-ld (on ubuntu: apt install clang lld)

set -e

cd "$(dirname "$0")"

wasm=$(mktemp)
clang --target=wasm32 -O3 -msimd128 -nostdlib -Wl,--no-entry -Wl,--import-memory -Wl,--strip-all \
  -Wl,--export=__heap_base -o "$wasm" nnue.c

b64=$(base64 -w0 "$wasm")
rm -f "$wasm"

# replace the string on the line after function netWasm() {, keeping lozza.js's crlf line endings
awk -v b64="$b64" '
  replace { print "  return \"" b64 "\";\r"; replace = 0; next }
  /^function netWasm\(\) \{\r?$/ { replace = 1 }
  { print }
' ../lozza.js > ../lozza.js.tmp && mv ../lozza.js.tmp ../lozza.js

echo "netWasm() updated, ${#b64} base64 chars"
