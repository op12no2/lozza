#!/usr/bin/env bash

MODE="${1:-release}"

set -euo pipefail

# =============================================================================
# DEV BUILD (./test/)
# =============================================================================

mkdir -p test
rm -f test/lozza-node.js 

# Native binary (arch-native, for local dev/testing)
clang -O3 -flto -DNDEBUG -march=native -static -o test/lozza src/lozza.c -lm
./test/lozza uci q
echo "Built test/lozza (native dev binary)"

# Node.js WASM (single-threaded, for testing via stdin/stdout)
emcc -O3 -DNDEBUG \
  -s SINGLE_FILE=1 \
  -s ENVIRONMENT='node' \
  -s EXPORTED_FUNCTIONS='["_main","_uci_input"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=67108864 \
  -s STACK_SIZE=1048576 \
  -o test/lozza-node.js \
  src/lozza.c
node test/node-wrapper.js uci q
echo "Built test/lozza-node.js (node test build)"

echo "**********"
echo "Dev build complete"
echo "**********"

if [[ "$MODE" == "-dev" ]]; then
  exit 0
fi

# =============================================================================
# RELEASE BUILD (./releases/)
# =============================================================================

mkdir -p releases
rm -f releases/lozza*

# Browser WASM (single-threaded for worker environment)
emcc -O3 -DNDEBUG \
  -s SINGLE_FILE=1 \
  -s ENVIRONMENT='worker' \
  -s EXPORTED_FUNCTIONS='["_main","_uci_input","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","stringToUTF8","lengthBytesUTF8"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=67108864 \
  -s STACK_SIZE=1048576 \
  -o releases/lozza_raw.js \
  src/lozza.c

cat >> releases/lozza_raw.js << 'WORKER_SETUP'
var moduleReady = false;
var pendingMessages = [];

Module.onRuntimeInitialized = function() {
  moduleReady = true;
  pendingMessages.forEach(function(msg) {
    Module.ccall('uci_input', null, ['string'], [msg]);
  });
  pendingMessages = [];
};

onmessage = function(e) {
  if (moduleReady) {
    Module.ccall('uci_input', null, ['string'], [e.data]);
  } else {
    pendingMessages.push(e.data);
  }
};
WORKER_SETUP

mv releases/lozza_raw.js releases/lozza.js
echo "Built releases/lozza.js (browser WASM)"

# Cross-compiled native binaries
clang -O3 -flto -DNDEBUG -march=x86-64-v3 -static -o releases/lozza-linux src/lozza.c -lm
zig cc -O3 -DNDEBUG -target x86_64-windows -mcpu=x86_64_v3 -o releases/lozza-win.exe src/lozza.c
zig cc -O3 -DNDEBUG -target aarch64-macos -o releases/lozza-mac-arm src/lozza.c
zig cc -O3 -DNDEBUG -target x86_64-macos -mcpu=x86_64_v3 -o releases/lozza-mac-x86 src/lozza.c

./releases/lozza-linux uci q
./releases/lozza-win.exe uci q
echo "Built release binaries"

rm -f releases/*.pdb

echo "**********"
echo "Release build complete"
echo "**********"

ls -la releases/
