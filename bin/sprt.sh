#!/bin/bash
#
# sprt.sh [stc|ltc] [nonreg] [engine1 engine2]
#
# SPRT of engine1 against engine2 with fastchess; the Elo shown is engine1's. The bounds
# are 0 and 5 (is it a gain?), or with nonreg -3 and 1 (is it at least not worse?), which
# is the one for a change that is not expected to gain much: a tidy up, or a small
# speedup, which the 0 and 5 test would be more likely to fail than pass. With no
# engines it is lozza.js against lozzacand.js. An engine whose name ends in .js is run
# with node, anything else is run as a binary, so these all work:
#
#   bin/sprt.sh                                   lozza.js v lozzacand.js, stc
#   bin/sprt.sh ltc
#   bin/sprt.sh stc new.js old.js
#   bin/sprt.sh stc junk/new junk/old             two native builds (tools/lozza2c/build.sh)
#   bin/sprt.sh stc junk/new lozzacand.js         a binary against a .js
#   bin/sprt.sh stc nonreg junk/new junk/old      non-regression bounds
#
# Engine paths are relative to the repo root (or absolute). The games go to sprt.pgn.
#

set -e

usage() {
  echo "usage: sprt.sh [stc|ltc] [nonreg] [engine1 engine2]"
  exit 1
}

# run from the repo root regardless of where the script is invoked from
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

speed=stc

if [ "$1" = "stc" ] || [ "$1" = "ltc" ]; then
  speed=$1
  shift
fi

elo0=0
elo1=5

if [ "$1" = "nonreg" ]; then
  elo0=-3
  elo1=1
  shift
fi

if [ "$#" = 0 ]; then
  e1=lozza.js
  e2=lozzacand.js
elif [ "$#" = 2 ]; then
  e1=$1
  e2=$2
else
  usage
fi

node=$(command -v node)
fastchess=~/fastchess/fastchess

concurrency=15
book=noob_4moves.epd

if [ "$speed" = "ltc" ]; then
  hash=256
  tc=100+1
else
  hash=16
  tc=10+0.1
fi

# the fastchess command for an engine: node for a .js, the file itself for a binary

engine() {
  local path
  case "$1" in
    /*) path=$1 ;;
    *)  path=$root/$1 ;;
  esac
  if [ ! -f "$path" ]; then
    echo "engine not found: $path" >&2
    exit 1
  fi
  case "$path" in
    *.js) echo "cmd=$node args=$path" ;;
    *)    if [ ! -x "$path" ]; then
            echo "not a .js and not executable: $path" >&2
            exit 1
          fi
          echo "cmd=$path" ;;
  esac
}

e1cmd=$(engine "$e1")
e2cmd=$(engine "$e2")

e1name=$(basename "${e1%.js}")
e2name=$(basename "${e2%.js}")

if [ "$e1name" = "$e2name" ]; then
  echo "the two engines need different file names, both are $e1name"
  exit 1
fi

rm -f sprt.pgn

"$fastchess" -recover -concurrency $concurrency -rounds 10000 -repeat \
  -resign movecount=5 score=600 \
  -draw movenumber=40 movecount=8 score=5 \
  -engine $e1cmd dir="$root" proto=uci tc=$tc timemargin=250 option.Hash=$hash name=$e1name \
  -engine $e2cmd dir="$root" proto=uci tc=$tc timemargin=250 option.Hash=$hash name=$e2name \
  -openings file="$root/books/$book" format=epd order=random -srand $RANDOM$RANDOM \
  -sprt elo0=$elo0 elo1=$elo1 alpha=0.05 beta=0.1 \
  -pgnout file=sprt.pgn
