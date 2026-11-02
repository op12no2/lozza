#!/bin/bash
#
# release.sh <version> [--force] [--js-only]
#
# 1. copy lozza.js to releases/<version>/lozza<version>.js with the net weights
#    (the file named by NET_WEIGHTS_FILE in lozza.js) embedded in getWeights()
# 2. check the embedded weights match the file
# 3. build lozza<version>-linux and lozza<version>.exe from the release source with
#    the lozza2c tool (JavaScript -> C with clang, weights embedded), expected in
#    ../lozza2c or $LOZZA2C
# 4. bench the dev source, the release source and both binaries and check they match
#
# --force replaces an existing releases/<version>
# --js-only skips the binaries (steps 3 and 4 then cover the js only)
#

set -e

force=0
jsonly=0
ver=""

for arg in "$@"; do
  case "$arg" in
    --force)   force=1 ;;
    --js-only) jsonly=1 ;;
    -*)        echo "unknown option $arg"; exit 1 ;;
    *)         ver=$arg ;;
  esac
done

if [ -z "$ver" ]; then
  echo "usage: release.sh <version> [--force] [--js-only]"
  exit 1
fi

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

dir=releases/$ver
js=$dir/lozza$ver.js
exe=$dir/lozza$ver.exe
lin=$dir/lozza$ver-linux

l2c=${LOZZA2C:-$root/../lozza2c}

if [ "$jsonly" = 0 ] && [ ! -x "$l2c/build.sh" ]; then
  echo "lozza2c not found at $l2c (clone it next to this repo, set LOZZA2C, or use --js-only)"
  exit 1
fi

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

case "$weights" in
  /*) wabs=$weights ;;
  *)  wabs=$root/$weights ;;
esac

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

# binaries: release js -> C -> clang with the weights embedded, see ../lozza2c/README.md

if [ "$jsonly" = 0 ]; then
  echo "binaries $l2c/build.sh"
  "$l2c/build.sh" "$wabs" "$root/$js" | tail -2
  cp "$l2c/lozza.exe" "$exe"
  cp "$l2c/lozza" "$lin"
fi

ls -l "$dir"

# bench everything

bench () {
  "$@" qb q 2>&1 | tr '\r' '\n' | grep -o 'nodes [0-9]*' | tail -1
}

dev=$(bench node lozza.js)
rel=$(bench node "$js")

if [ "$jsonly" = 0 ]; then
  win=$(bench "$exe")
  lnx=$(bench "$lin")
  echo "bench    dev: $dev  release: $rel  windows: $win  linux: $lnx"
else
  win=$dev
  lnx=$dev
  echo "bench    dev: $dev  release: $rel"
fi

if [ -z "$dev" ] || [ "$dev" != "$rel" ] || [ "$dev" != "$win" ] || [ "$dev" != "$lnx" ]; then
  echo "BENCH MISMATCH"
  exit 1
fi

echo "release $ver ok"
