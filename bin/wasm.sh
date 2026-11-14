#!/bin/bash
#
# Build the wasm net kernel (lozza.c) and embed it in getWasm() at the bottom of
# lozza.js.
#
#   wasm.sh            build and embed into lozza.js
#   wasm.sh <file.js>  build and embed into another copy of the engine (bin/release.sh
#                      does this for each net width)
#
# Needs clang with the wasm32 target and wasm-ld (apt install clang lld).
#
# After changing lozza.c the bench node count must be the same with WASM = 1 and
# WASM = 0 at the top of lozza.js; this script checks that.
#

set -e

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

js=${1:-lozza.js}

# the kernel is built into a scratch file of its own so that two runs cannot collide

mkdir -p junk
wasm=$(mktemp junk/lozza.XXXXXX.wasm)
trap 'rm -f "$wasm"' EXIT

# the net sizes come from the engine so that the kernel always matches it

jsconst() {
  grep -m1 "^const $1 *=" "$js" | sed 's/^[^=]*= *\([0-9]*\).*/\1/'
}

i_size=$(jsconst NET_I_SIZE)
h1_size=$(jsconst NET_H1_SIZE)
o_size=$(jsconst NET_O_SIZE)
max_ply=$(jsconst MAX_PLY)

if [ -z "$i_size" ] || [ -z "$h1_size" ] || [ -z "$o_size" ] || [ -z "$max_ply" ]; then
  echo "cannot find NET_I_SIZE, NET_H1_SIZE, NET_O_SIZE and MAX_PLY in $js"
  exit 1
fi

echo "net sizes from $js: inputs $i_size hidden $h1_size output buckets $o_size max ply $max_ply"

clang --target=wasm32 -O3 -msimd128 -nostdlib -ffreestanding \
      -DI_SIZE=$i_size -DH1_SIZE=$h1_size -DO_SIZE=$o_size -DMAX_PLY=$max_ply \
      -Wl,--no-entry -Wl,--strip-all -Wl,--export-dynamic -Wl,-z,stack-size=4096 \
      -o "$wasm" lozza.c

echo "built the kernel, $(stat -c %s "$wasm") bytes"

# replace whatever is between the backticks in getWasm() with the new base64

node -e '
  const fs   = require("fs");
  const js   = process.argv[1];
  const b64  = fs.readFileSync(process.argv[2]).toString("base64").match(/.{1,100}/g).join("\n");
  const src  = fs.readFileSync(js, "utf8");
  const re   = /(function getWasm\(\) \{\n  return `\n)[^`]*(`;\n\})/;
  if (!re.test(src)) {
    console.error("getWasm() not found in " + js);
    process.exit(1);
  }
  const out = src.replace(re, (m, a, b) => a + b64 + "\n" + b);
  if (out === src)
    console.log(js + " already has this kernel");
  else {
    fs.writeFileSync(js, out);
    console.log("embedded in " + js);
  }
' "$js" "$wasm"

# the kernel must not change the search

bench() {
  node "$1" qb q | tail -1 | sed 's/.*nodes \([0-9]*\).*/\1/'
}

off=$(mktemp junk/off.XXXXXX.js)
sed 's/^const WASM = 1;/const WASM = 0;/' "$js" > "$off"

name=$(node "$js" uci q | head -1)
b1=$(bench "$js")
b0=$(bench "$off")
rm -f "$off"

echo "$name"
echo "bench wasm $b1 javascript $b0"

case "$name" in
  *wasm*) ;;
  *) echo "the kernel is not being used (WASM = 0, or it failed to load)"; exit 1 ;;
esac

if [ "$b1" != "$b0" ]; then
  echo "MISMATCH: lozza.c and the Javascript loops in $js disagree"
  exit 1
fi
