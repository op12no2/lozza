#!/bin/bash
#
# build.sh [weights.bin] [source.js]
#
# Converts lozza.js (default ../../lozza.js) to C and builds linux and windows
# binaries here: lozza and lozza.exe for any processor with AVX2 (2013 on), and
# lozza-avx512 and lozza-avx512.exe, about 15% faster, for those with AVX-512. With a weights file the net is embedded (release), otherwise
# the binaries read the file named in lozza.js (dev).
#
# Also builds lozza_scalar, the linux binary with clang's SIMD (auto-vectorising)
# switched off. It is not for release: test.sh runs it to measure what SIMD is worth.
#

set -e
cd "$(dirname "$0")"

CFLAGS="-O3 -march=x86-64-v3 -fwrapv -Wall -Wno-parentheses-equality -Wno-unused-variable -Wno-unused-but-set-variable -Wno-unused-function"

SRC=${2:-../../lozza.js}

# Things in the converted folds that only make sense in a Javascript host: the wasm
# kernel loader, base64, a debug check that uses console.log, and the stdin/stdout
# plumbing that runtime_uci.c replaces.

EXCLUDE=netKernel,b64Decode,boardCheck,uciSend,initUci,yieldChannel,yieldResolve,fs

# acorn (the JS parser) is pinned in package-lock.json; install it on a fresh clone
if [ ! -d node_modules/acorn ]; then
  echo "installing acorn"
  npm ci --silent --no-audit --no-fund
fi

node lozza2c.js "$SRC" lozza_core.c --exclude $EXCLUDE --extra BUILD

if [ -n "$1" ]; then
  node embed_weights.js "$1" weights_blob.h
  CFLAGS="$CFLAGS -DLOZZA_WEIGHTS_H=\"weights_blob.h\""
fi

# the AVX-512 build: 512 bit SIMD in the net loops, see LZ_LOOP_I16 in lozza_rt.h

AVX512="-march=x86-64-v4 -mprefer-vector-width=512"

clang $CFLAGS -o lozza runtime_uci.c -lm
clang $CFLAGS $AVX512 -o lozza-avx512 runtime_uci.c -lm
clang $CFLAGS -DLOZZA_SCALAR -fno-vectorize -fno-slp-vectorize -o lozza_scalar runtime_uci.c -lm

X=~/.cache/cargo-xwin/xwin

# -w: the windows sdk headers are noisy under clang and none of it is ours

clang --target=x86_64-pc-windows-msvc -fuse-ld=lld $CFLAGS -w \
  -I$X/crt/include -I$X/sdk/include/ucrt -I$X/sdk/include/um -I$X/sdk/include/shared \
  -L$X/crt/lib/x86_64 -L$X/sdk/lib/um/x86_64 -L$X/sdk/lib/ucrt/x86_64 \
  runtime_uci.c -o lozza.exe

clang --target=x86_64-pc-windows-msvc -fuse-ld=lld $CFLAGS $AVX512 -w \
  -I$X/crt/include -I$X/sdk/include/ucrt -I$X/sdk/include/um -I$X/sdk/include/shared \
  -L$X/crt/lib/x86_64 -L$X/sdk/lib/um/x86_64 -L$X/sdk/lib/ucrt/x86_64 \
  runtime_uci.c -o lozza-avx512.exe

ls -l lozza lozza.exe lozza-avx512 lozza-avx512.exe lozza_scalar
