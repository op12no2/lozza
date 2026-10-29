#!/bin/bash
#
# release.sh <version>
#
# 1. copy lozza.js to releases/<version>/lozza<version>.js with the net weights
#    (the file named by NET_WEIGHTS_FILE in lozza.js) embedded in getWeights()
# 2. check the embedded weights match the file
# 3. build a windows binary from the release source
# 4. bench the dev source, the release source and the binary and check they match
#

set -e

if [ "$#" -ne 1 ]; then
  echo "usage: release.sh <version>"
  exit 1
fi

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

ver=$1
dir=releases/$ver
js=$dir/lozza$ver.js
exe=$dir/lozza$ver.exe

if [ -e "$dir" ]; then
  echo "$dir already exists"
  exit 1
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

# windows binary from the release source

bun build "$js" --compile --target=bun-windows-x64 --minify --outfile "$exe"

echo "binary   $exe"

# bench all three

bench () {
  "$@" qb q 2>&1 | tr '\r' '\n' | grep -o 'nodes [0-9]*' | tail -1
}

dev=$(bench node lozza.js)
rel=$(bench node "$js")
bin=$(bench "$exe")

echo "bench    dev: $dev  release: $rel  binary: $bin"

if [ -z "$dev" ] || [ "$dev" != "$rel" ] || [ "$dev" != "$bin" ]; then
  echo "BENCH MISMATCH"
  exit 1
fi

echo "release $ver ok"
