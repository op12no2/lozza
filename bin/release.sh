#!/bin/bash
#
# release.sh <version> [--force] [--js-only]
#
# Makes releases/<version>/ from lozza.js:
#
#   lozza<version>.js              the engine with the net that lozza.js itself uses
#   lozza<version>-linux           (NET_WEIGHTS_FILE), the best one, and native binaries
#   lozza<version>.exe             with that same net
#   lozza<version>_net<width>.js   alternatives: one for each smaller net, e.g.
#                                  lozza12.0_net256.js, smaller files but weaker
#
# The nets are the one named by NET_WEIGHTS_FILE in lozza.js and its siblings: with
# nets/net1536/lozza-200/quantised.bin there, every nets/net<width>/lozza-200/quantised.bin
# that exists and is narrower is released too. They must all be the same shape apart
# from the width.
#
# Each .js is lozza.js with
#
#   - NET_H1_SIZE set to the width of the net
#   - the weights embedded in getWeights(), so it needs no weights file
#   - the wasm kernel rebuilt for that width and embedded in getWasm() (bin/wasm.sh)
#
# and is checked: the embedded weights match the file, the kernel loads, the bench node
# count is the same with and without the kernel, and for the net lozza.js uses it is the
# same as node lozza.js.
#
# The binaries are that net's release .js converted to C by tools/lozza2c and compiled
# with clang. They are checked against node running the same .js and for having the
# SIMD they should have (tools/lozza2c/test.sh), and their bench must match too.
#
# --force    replace an existing releases/<version>
# --js-only  skip the binaries
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
exe=$dir/lozza$ver.exe
lin=$dir/lozza$ver-linux
l2c=tools/lozza2c

if [ -e "$dir" ]; then
  if [ "$force" = 1 ]; then
    echo "replacing $dir"
    rm -rf "$dir"
  else
    echo "$dir already exists (use --force to replace it)"
    exit 1
  fi
fi

jsconst() {
  grep -m1 "^const $1 *=" lozza.js | sed 's/^[^=]*= *\([0-9]*\).*/\1/'
}

bench() {
  "$@" qb q 2>&1 | tr '\r' '\n' | grep -o 'nodes [0-9]*' | tail -1 | sed 's/nodes //'
}

#
# the nets: the one lozza.js uses and its siblings
#

weights=$(grep -o "^const NET_WEIGHTS_FILE *= *'[^']*'" lozza.js | sed "s/.*'\(.*\)'/\1/")

case "$weights" in
  /*) ;;
  *)  weights=$root/$weights ;;
esac

if [ ! -f "$weights" ]; then
  echo "weights file not found: '$weights'"
  exit 1
fi

netfile=$(basename "$weights")                             # quantised.bin
netcp=$(basename "$(dirname "$weights")")                  # lozza-200
netdir=$(dirname "$(dirname "$weights")")                  # .../nets/net1536
netsdir=$(dirname "$netdir")                               # .../nets
devwidth=$(basename "$netdir" | sed 's/^net//')

if [ "$devwidth" != "$(jsconst NET_H1_SIZE)" ]; then
  echo "lozza.js has NET_H1_SIZE $(jsconst NET_H1_SIZE) but its weights file is in $(basename "$netdir")"
  exit 1
fi

widths=$(ls -d "$netsdir"/net[0-9]* | sed 's/.*\/net//' | grep -x '[0-9]*' | sort -n)

echo "dev net  $weights"

dev=$(bench node lozza.js)

echo "dev      bench $dev"

mkdir -p "$dir"

#
# one release .js for each net
#

i_size=$(jsconst NET_I_SIZE)
o_size=$(jsconst NET_O_SIZE)

devjs=""
summary=""

for w in $widths; do

  net=$netsdir/net$w/$netcp/$netfile

  # the dev net is lozza<version>.js, smaller nets are alternatives, bigger ones are not released

  if [ "$w" -gt "$devwidth" ]; then
    echo "net$w    skipped, bigger than the dev net"
    continue
  elif [ "$w" = "$devwidth" ]; then
    js=$dir/lozza$ver.js
  else
    js=$dir/lozza${ver}_net$w.js
  fi

  if [ ! -f "$net" ]; then
    echo "net$w    skipped, no $net"
    continue
  fi

  # the file is the weights as 16 bit values, padded by the trainer to a multiple of 64 bytes

  want=$(( (i_size * w + w + o_size * 2 * w + o_size) * 2 ))
  size=$(stat -c %s "$net")

  if [ "$size" -lt "$want" ] || [ "$size" -ge $(( want + 64 )) ]; then
    echo "net$w    $net is $size bytes but a net this shape is $want; is it the same shape as the dev net?"
    exit 1
  fi

  # width, weights file name (only a record of where the weights came from) and weights

  node -e '
    const fs = require("fs");
    const [src, dst, weights, width] = process.argv.slice(1);
    let s = fs.readFileSync(src, "utf8");
    function sub (re, to) {
      if ((s.match(re) || []).length !== 1) {
        console.error("expected exactly one match for " + re + " in " + src);
        process.exit(1);
      }
      s = s.replace(re, to);
    }
    sub(/^const NET_H1_SIZE = \d+;/mg, () => "const NET_H1_SIZE = " + width + ";");
    sub(/^const NET_WEIGHTS_FILE = \x27[^\x27]*\x27/mg, () => "const NET_WEIGHTS_FILE = \x27" + weights + "\x27");
    sub(/function getWeights\(\) \{\n  return \x27\x27;\n\}/g, () => "function getWeights() {\n  return \x27" + fs.readFileSync(weights).toString("base64") + "\x27;\n}");
    fs.writeFileSync(dst, s);
  ' lozza.js "$js" "$net" "$w"

  # the embedded weights must be the file

  node -e '
    const fs = require("fs");
    const [dst, weights] = process.argv.slice(1);
    const m = fs.readFileSync(dst, "utf8").match(/function getWeights\(\) \{\n  return \x27([^\x27]*)\x27;\n\}/);
    if (!m || m[1] === "" || !Buffer.from(m[1], "base64").equals(fs.readFileSync(weights))) {
      console.error("the weights embedded in " + dst + " do not match " + weights);
      process.exit(1);
    }
  ' "$js" "$net"

  # kernel for this width; wasm.sh fails if it does not load or changes the bench

  out=$(bin/wasm.sh "$js") || { echo "$out"; echo "net$w    bin/wasm.sh failed for $js"; exit 1; }

  # it must run, as a release (no weights file) and with the right width

  name=$(node "$js" uci q | head -1)
  h1=$(node "$js" net q | sed -n 's/^i_size, h1_size, o_size [0-9]* \([0-9]*\) .*/\1/p')
  b=$(bench node "$js")

  if [ -z "$name" ] || [[ "$name" == *dev* ]] || [ "$h1" != "$w" ] || [ -z "$b" ]; then
    echo "net$w    $js is not right: name '$name', width '$h1', bench '$b'"
    exit 1
  fi

  if node "$js" q | grep -q "too big"; then
    echo "net$w    weights are too big for 16 bit accumulators"
    exit 1
  fi

  if [ "$w" = "$devwidth" ]; then
    devjs=$js
    if [ "$b" != "$dev" ]; then
      echo "net$w    BENCH MISMATCH: $js $b, lozza.js $dev"
      exit 1
    fi
  fi

  line=$(printf 'net%-5s %-28s %9s bytes  bench %s' "$w" "$(basename "$js")" "$(stat -c %s "$js")" "$b")
  echo "$line"
  summary="$summary$line"$'\n'

done

if [ -z "$devjs" ]; then
  echo "the dev net was not released"
  exit 1
fi

#
# binaries: the dev net's release .js -> C -> clang, weights embedded
#

if [ "$jsonly" = 0 ]; then

  echo "binaries from $devjs"

  $l2c/build.sh "$weights" "$root/$devjs" | sed 's/^/  /'

  if ! out=$($l2c/test.sh "$root/$devjs"); then
    echo "$out"
    echo "the binaries do not behave like node $devjs"
    exit 1
  fi

  echo "  $(echo "$out" | grep -c '^ok') checks ok (against node, and simd)"
  echo "$out" | grep -E 'simd (speedup|windows speed)' | sed 's/^ok  /  /'

  cp $l2c/lozza     "$lin"
  cp $l2c/lozza.exe "$exe"

  for f in "$lin" "$exe"; do

    b=$(bench "$f")

    line=$(printf 'net%-5s %-28s %9s bytes  bench %s' "$devwidth" "$(basename "$f")" "$(stat -c %s "$f")" "$b")
    echo "$line"
    summary="$summary$line"$'\n'

    if [ "$b" != "$dev" ]; then
      echo "BENCH MISMATCH: $f $b, lozza.js $dev"
      exit 1
    fi

  done

fi

echo
echo "$dir"
echo "$summary"
echo "lozza$ver.js and the binaries have the net$devwidth net; the _net<width>.js files are smaller nets"
echo "release $ver ok"
