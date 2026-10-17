#!/bin/bash

set -e

cd "$(dirname "$0")/.."

if pgrep -f "fastchess -engine" > /dev/null; then
  echo "fastchess is already running"
  exit 1
fi

sprt="elo0=-5 elo1=0"
tc=10+0.1
hash=16
coal=lozza.js
cand=releases/lozza.js
report=100
concurrency=15
rounds=10000
timemargin=200
data=/mnt/d/chess_data
book=$data/4moves_noob.epd

fastchess=../fastchess/fastchess

if [ ! -x $fastchess ]; then
  echo "error: $fastchess not found; git clone https://github.com/Disservin/fastchess ../fastchess"
  echo "and make -C ../fastchess -j8"
  exit 1
fi

pgn=sprt.pgn

# one game per physical core: cpus 2,4..30 are the first hyperthread of cores 1-15 on the
# 9950X (siblings are 0-1, 2-3 ..), so no two games share a core and core 0 is left free

affinity=$(seq -s, 2 2 30)

echo $coal v $cand at $tc hash $hash sprt $sprt

rm -f /tmp/coal.js
rm -f /tmp/cand.js

cp $coal /tmp/coal.js
cp "$cand" /tmp/cand.js

rm -f $pgn

$fastchess \
  -engine name=coal cmd=node args=/tmp/coal.js \
  -engine name=cand cmd=node args=/tmp/cand.js \
  -each proto=uci tc=$tc timemargin=$timemargin option.Hash=$hash \
  -rounds $rounds -repeat \
  -sprt $sprt alpha=0.05 beta=0.1 \
  -concurrency $concurrency \
  -use-affinity $affinity \
  -openings file=$book format=epd order=random \
  -srand $RANDOM$RANDOM \
  -draw movenumber=40 movecount=8 score=10 \
  -resign movecount=5 score=400 \
  -pgnout file=$pgn append=false \
  -ratinginterval $report  
