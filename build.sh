#!/usr/bin/env bash

set -euo pipefail

mkdir -p test releases

clang -O3 -flto -DNDEBUG -march=native -static -o test/lozza src/lozza.c -lm

emcc -O3 -DNDEBUG \
  -s SINGLE_FILE=1 \
  -s ENVIRONMENT='worker,node' \
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

rm -f releases/lozza-*

clang -O3 -flto -DNDEBUG -march=x86-64-v3 -static -o releases/lozza-linux src/lozza.c -lm
zig cc -O3 -DNDEBUG -target x86_64-windows -mcpu=x86_64_v3 -o releases/lozza-win.exe src/lozza.c
zig cc -O3 -DNDEBUG -target aarch64-macos -o releases/lozza-mac-arm src/lozza.c
zig cc -O3 -DNDEBUG -target x86_64-macos -mcpu=x86_64_v3 -o releases/lozza-mac-x86 src/lozza.c

rm -f releases/*.pdb

ls -la releases/

