#!/usr/bin/env bash
set -euo pipefail

mkdir -p releases

cat \
  src/constants.js \
  src/utils.js \
  src/nodes.js \
  src/report.js \
  src/search.js \
  src/qsearch.js \
  src/perft.js \
  src/pv.js \
  src/net.js \
  src/board.js \
  src/zobrist.js \
  src/tt.js \
  src/hash.js \
  src/position.js \
  src/movegen.js \
  src/makemove.js \
  src/attack.js \
  src/evaluate.js \
  src/see.js \
  src/history.js \
  src/draw.js \
  src/format.js \
  src/boardcheck.js \
  src/stats.js \
  src/fens.js \
  src/uci.js \
  src/init.js \
  > tmp.js

echo "Built tmp.js"

# Dev build (no weights, loads from file)
{
  printf '\nconst WEIGHTS_B64 = "";\n'
  cat tmp.js
} > lozza.js

node lozza.js uci q

echo "Built lozza.js (dev)"

# Release build (inline base64 weights, unminified for browser compatibility)
{
  printf '\nconst WEIGHTS_B64 = "'
  base64 -i nets/quantised.bin | tr -d '\n'
  printf '";\n'
  cat tmp.js
} > releases/lozza.js

rm tmp.js

node releases/lozza.js uci q

echo "Built releases/lozza.js (release)"

clang -O3 -flto -DNDEBUG -march=native -static -o lozza src/lozza.c -lm

./lozza uci q

echo "Built native lozza binary (dev)"

clang -O3 -flto -DNDEBUG -march=x86-64-v3 -static -o releases/lozza-linux src/lozza.c -lm
zig cc -O3 -DNDEBUG -target x86_64-windows -mcpu=x86_64_v3 -o releases/lozza-win.exe src/lozza.c
zig cc -O3 -DNDEBUG -target aarch64-macos -o releases/lozza-mac-arm src/lozza.c
zig cc -O3 -DNDEBUG -target x86_64-macos -mcpu=x86_64_v3 -o releases/lozza-mac-x86 src/lozza.c

./releases/lozza-linux uci q
./releases/lozza-win.exe uci q

echo "Built releases"

rm -f releases/*.pdb

ls -la releases
