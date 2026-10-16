#!/bin/bash

set -e

cd "$(dirname "$0")/.."

out=lozza.js

files=(
  constants
  tables
  utils
  node
  movelist
  report
  go
  rootsearch
  search
  qsearch
  perft
  pv
  net
  netload
  netupdate
  board
  history
  prng
  zobrist
  tt
  hash
  newgame
  position
  genmoves
  genqmoves
  makemove
  unmakemove
  attack
  evaluate
  see
  draw
  fen
  formatmove
  boardcheck
  stats
  bench
  uci
  uciexec
  queue
  init
  main
  weights
)

# catch a file added to src/ but not listed here

for f in src/*.js; do
  name=$(basename "$f" .js)
  if [[ ! " ${files[*]} " =~ " $name " ]]; then
    echo "error: $f is not listed in build.sh"
    exit 1
  fi
done

tmp=$(mktemp)

for name in "${files[@]}"; do
  cat "src/$name.js" >> "$tmp"
  echo >> "$tmp"
done

mv "$tmp" "$out"

echo "built $out from ${#files[@]} files"

node lozza uci q
