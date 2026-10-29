#!/bin/bash
#
# release.sh <version> [--force]
#
# 1. copy lozza.js to releases/<version>/lozza<version>.js with the net weights
#    (the file named by NET_WEIGHTS_FILE in lozza.js) embedded in getWeights()
# 2. check the embedded weights match the file
# 3. convert the release source to C and build windows and linux binaries
#    with clang (see tools/lozza2c)
# 4. bench the dev source, the release source and the binaries and check they match
#
# --force replaces an existing releases/<version>
#

set -e

force=0
ver=""

for arg in "$@"; do
  case "$arg" in
    --force) force=1 ;;
    -*)      echo "unknown option $arg"; exit 1 ;;
    *)       ver=$arg ;;
  esac
done

if [ -z "$ver" ]; then
  echo "usage: release.sh <version> [--force]"
  exit 1
fi

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

dir=releases/$ver
js=$dir/lozza$ver.js
exe=$dir/lozza$ver.exe
lin=$dir/lozza$ver-linux

if [ -e "$dir" ]; then
  if [ "$force" = 1 ]; then
    echo "replacing $dir"
    rm -rf "$dir"
  else
    echo "$dir already exists (use --force to replace it)"
    exit 1
  fi
fi

# weights file referenced by the dev source

weights=$(grep -o "^const NET_WEIGHTS_FILE *= *'[^']*'" lozza.js | sed "s/.*'\(.*\)'/\1/")

if [ ! -f "$weights" ]; then
  echo "weights file not found: '$weights'"
  exit 1
fi

echo "weights  $weights"

# embed

mkdir -p "$dir"

node -e '
  const fs = require("fs");
  const [src, dst, weights] = process.argv.slice(1);
  const b64  = fs.readFileSync(weights).toString("base64");
  const stub = "function getWeights() {\n  return \x27\x27;\n}";
  let s = fs.readFileSync(src, "utf8");
  if (s.split(stub).length !== 2) {
    console.error("getWeights() stub not found exactly once in " + src);
    process.exit(1);
  }
  s = s.replace(stub, () => "function getWeights() {\n  return \x27" + b64 + "\x27;\n}");
  fs.writeFileSync(dst, s);
' lozza.js "$js" "$weights"

echo "release  $js"

# check the embedded weights are there and match the file

node -e '
  const fs = require("fs");
  const [dst, weights] = process.argv.slice(1);
  const b64 = fs.readFileSync(weights).toString("base64");
  const m   = fs.readFileSync(dst, "utf8").match(/function getWeights\(\) \{\n  return \x27([^\x27]*)\x27;\n\}/);
  if (!m || m[1] === "") {
    console.error("no embedded weights found in " + dst);
    process.exit(1);
  }
  if (m[1] !== b64) {
    console.error("embedded weights do not match " + weights);
    process.exit(1);
  }
  console.log("embedded " + m[1].length + " base64 chars, matches weights file");
' "$js" "$weights"

# binaries: lozza.js -> C -> clang, weights embedded (see tools/lozza2c)

echo "building binaries"
tools/lozza2c/build.sh "$weights" "$root/$js" | tail -2
cp tools/lozza2c/lozza.exe "$exe"
cp tools/lozza2c/lozza "$lin"

ls -l "$dir"

# bench all four

bench () {
  "$@" qb q 2>&1 | tr '\r' '\n' | grep -o 'nodes [0-9]*' | tail -1
}

dev=$(bench node lozza.js)
rel=$(bench node "$js")
win=$(bench "$exe")
lnx=$(bench "$lin")

echo "bench    dev: $dev  release: $rel  windows: $win  linux: $lnx"

if [ -z "$dev" ] || [ "$dev" != "$rel" ] || [ "$dev" != "$win" ] || [ "$dev" != "$lnx" ]; then
  echo "BENCH MISMATCH"
  exit 1
fi

echo "release $ver ok"
