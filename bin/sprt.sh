#!/bin/bash

if command -v cpupower >/dev/null; then
  sudo cpupower frequency-set -g performance || true
fi

rm -f sprt.pgn

e1=./lozza
e2=./releases/lozza
tc=60+2
elo0=0
elo1=5
concurrency=32
book=4moves_noob

CPUS=0-31   # physical cores only (no SMT) EPYC 7502P

taskset -c $CPUS \
../chess_data/cutechess-ob -concurrency $concurrency -each tc=0/$tc \
-sprt elo0=$elo0 elo1=$elo1 alpha=0.05 beta=0.1 \
-engine name=$e1 proto=uci cmd=$e1 timemargin=250 \
-engine name=$e2 proto=uci cmd=$e2 timemargin=250 \
-srand $RANDOM$RANDOM -openings file=../chess_data/$book.epd format=epd order=random \
-repeat -games 200000 -recover -pgnout sprt.pgn fi \
-draw movenumber=40 movecount=8 score=10 \
-resign movecount=5 score=400 \
-ratinginterval 10 $1
