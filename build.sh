#!/usr/bin/env bash
set -euo pipefail

mkdir -p releases

cat \
  js/constants.js \
  js/utils.js \
  js/nodes.js \
  js/report.js \
  js/search.js \
  js/qsearch.js \
  js/perft.js \
  js/pv.js \
  js/net.js \
  js/board.js \
  js/zobrist.js \
  js/tt.js \
  js/hash.js \
  js/position.js \
  js/movegen.js \
  js/makemove.js \
  js/attack.js \
  js/evaluate.js \
  js/see.js \
  js/history.js \
  js/draw.js \
  js/format.js \
  js/boardcheck.js \
  js/stats.js \
  js/fens.js \
  js/uci.js \
  js/init.js \
  > tmp.js

# Dev build (no weights, loads from file)
{
  printf '\nconst WEIGHTS_B64 = "";\n'
  cat tmp.js
} > lozza.js

node lozza.js uci q
echo "Built lozza.js (dev)"
echo

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
echo

clang -O3 -flto -DNDEBUG -march=native -static -o lozza c/lozza.c -lm

./lozza uci q
echo "Built native lozza binary (dev)"
echo

clang -O3 -flto -DNDEBUG -march=x86-64-v3 -static -o releases/lozza-linux c/lozza.c -lm
zig cc -O3 -DNDEBUG -target x86_64-windows -mcpu=x86_64_v3 -o releases/lozza-win.exe c/lozza.c
zig cc -O3 -DNDEBUG -target aarch64-macos -o releases/lozza-mac-arm c/lozza.c
zig cc -O3 -DNDEBUG -target x86_64-macos -mcpu=x86_64_v3 -o releases/lozza-mac-x86 c/lozza.c

./releases/lozza-linux uci q
./releases/lozza-win.exe uci q
echo "Built releases"

rm -f releases/*.pdb

ls -la releases/l*
