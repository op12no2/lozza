#!/bin/bash

set -e

cd "$(dirname "$0")"

if pgrep -f "fastchess -engine" > /dev/null; then
  echo "a match is already running"
  exit 1
fi

timemargin=200
data=/mnt/d/chess_data
fastchess=$data/fastchess
book=$data/4moves_noob.epd
pgn=sprt.pgn
rounds=10000
sprt="-sprt elo0=0 elo1=5 alpha=0.05 beta=0.1 model=normalized"
concurrency=16

tc=10+0.1
#tc=100+1
hash=16
#hash=128

# snapshot both engines so editing magic.js during a match changes nothing

rm -f $pgn

$fastchess \
  -engine name=dev cmd=node args=lozza.js \
  -engine name=cand cmd=node args=releases/lozza.js \
  -each proto=uci tc=$tc timemargin=$timemargin option.Hash=$hash \
  -rounds $rounds -repeat \
  $sprt \
  -concurrency $concurrency \
  -openings file=$book format=epd order=random \
  -srand $RANDOM$RANDOM \
  -draw movenumber=40 movecount=8 score=10 \
  -resign movecount=5 score=400 \
  -pgnout file=$pgn append=false \
  -ratinginterval 10 \
  "$@"
