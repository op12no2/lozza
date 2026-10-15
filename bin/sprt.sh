#!/bin/bash

set -e

cd "$(dirname "$0")/.."

if pgrep -f "fastchess -engine" > /dev/null; then
  echo "a match is already running"
  exit 1
fi

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
rounds=10000
sprt="-sprt elo0=0 elo1=5 alpha=0.05 beta=0.1 model=normalized"
# one game per physical core: cpus 2,4..30 are the first hyperthread of cores 1-15 on the
# 9950X (siblings are 0-1, 2-3 ..), so no two games share a core and core 0 is left free

concurrency=15
affinity=$(seq -s, 2 2 30)

# options:
#   --tc stc|ltc|vltc  time control and hash (default stc)
#   --cand <file>      the baseline engine (default releases/lozza.js) e.g. --cand releases/9.0/lozza.js
# any other args go to fastchess

coal=lozza.js
cand=releases/lozza.js
tcname=stc
extra=()

while [ $# -gt 0 ]; do
  case "$1" in
    --tc)
      tcname=$2
      shift 2
      ;;
    --cand)
      cand=$2
      shift 2
      ;;
    *)
      extra+=("$1")
      shift
      ;;
  esac
done

case "$tcname" in
  stc)
    tc=8+0.08
    hash=16
    ;;
  ltc)
    tc=40+0.4
    hash=128
    ;;
  vltc)
    tc=100+1
    hash=256
    ;;
  *)
    echo "error: unknown tc $tcname (stc, ltc or vltc)"
    exit 1
    ;;
esac

if [ ! -f "$cand" ]; then
  echo "error: $cand not found"
  exit 1
fi

echo "tc $tcname $tc hash $hash"

echo $coal v $cand

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
  $sprt \
  -concurrency $concurrency \
  -use-affinity $affinity \
  -openings file=$book format=epd order=random \
  -srand $RANDOM$RANDOM \
  -draw movenumber=40 movecount=8 score=10 \
  -resign movecount=5 score=400 \
  -pgnout file=$pgn append=false \
  -ratinginterval 10 \
  "${extra[@]}"
