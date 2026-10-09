#!/bin/bash

# build release binaries with the net embedded, run from anywhere: bin/release.sh <quantised.bin>
#
# the net is embedded in a copy of lozza.js, so the working lozza.js is left as it is. bun cross
# compiles every target from here. the output, in dist/lozza-<BUILD>/, is that lozza.js (for
# browsers and node) and a binary per target. baseline builds are for cpus without avx2.

set -e

if [ "$#" -ne 1 ]; then
  echo "usage: bin/release.sh <quantised.bin>"
  exit 1
fi

net=$(realpath "$1")

cd "$(dirname "$0")/.."

if ! command -v bun > /dev/null; then
  echo "error: bun not found"
  exit 1
fi

build=$(grep -oP '^const BUILD *= *"\K[^"]+' lozza.js)
out="dist/lozza-$build"

if [ -d "$out" ]; then
  echo "warning: $out exists and will be replaced"
  read -p "continue? [y/N] " answer
  if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
    echo "aborted"
    exit 1
  fi
  rm -rf "${out:?}"
fi

mkdir -p "$out"

js="$out/lozza-$build.js"
cp lozza.js "$js"
bin/embed.sh "$net" "$js"

# bun target -> binary name

targets=(
  "bun-windows-x64           windows-x64.exe"
  "bun-windows-x64-baseline  windows-x64-baseline.exe"
  "bun-linux-x64             linux-x64"
  "bun-linux-x64-baseline    linux-x64-baseline"
  "bun-darwin-x64            macos-x64"
  "bun-darwin-arm64          macos-arm64"
)

# the first build for a target downloads its bun runtime, which is cached after that

log=$(mktemp)

for t in "${targets[@]}"; do
  read -r target name <<< "$t"
  if ! bun build --compile --target="$target" "$js" --outfile "$out/lozza-$build-$name" > "$log" 2>&1; then
    cat "$log"
    rm -f "$log"
    echo "error: building $target failed"
    exit 1
  fi
  echo "built $out/lozza-$build-$name"
done

rm -f "$log"

# smoke test the binary this machine can run: an embedded net, so no (dev), and a short search

native="$out/lozza-$build-linux-x64"

id=$("$native" uci quit | grep '^id name')
if [ "$id" != "id name Lozza $build" ]; then
  echo "error: $native says '$id', expected 'id name Lozza $build'"
  exit 1
fi

best=$("$native" "position startpos" "go depth 8" | grep '^bestmove')
if [ -z "$best" ]; then
  echo "error: $native gave no bestmove"
  exit 1
fi

echo "$native ok: $id, $best"

ls -la "$out"
