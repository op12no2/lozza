#!/bin/bash
set -e

if [ "$#" -gt 1 ]; then
  echo "usage: sprt [stc|ltc]"
  exit 1
fi

# run from the repo root regardless of where the script is invoked from
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

rm -f sprt.pgn

node=$(command -v node)
fastchess=~/fastchess/fastchess

e1=lozza.js
e2=lozzacand.js

elo0=0
elo1=5
concurrency=15
book=noob_4moves.epd

if [ "$1" = "ltc" ]; then
  hash=256
  tc=100+1
else
  hash=16
  tc=10+0.1
fi

e1name="${e1%.js}"
e2name="${e2%.js}"

"$fastchess" -recover -concurrency $concurrency -rounds 10000 -repeat \
  -resign movecount=5 score=600 \
  -draw movenumber=40 movecount=8 score=5 \
  -engine cmd="$node" args="$e1" dir="$root" proto=uci tc=$tc timemargin=250 option.Hash=$hash name=$e1name \
  -engine cmd="$node" args="$e2" dir="$root" proto=uci tc=$tc timemargin=250 option.Hash=$hash name=$e2name \
  -openings file="$root/books/$book" format=epd order=random -srand $RANDOM$RANDOM \
  -sprt elo0=$elo0 elo1=$elo1 alpha=0.05 beta=0.1 \
  -pgnout file=sprt.pgn

