#!/bin/bash
#
# Run n concurrent datagen instances in the background, each writing a new
# uniquely named file to ./data, so it can be stopped and restarted at will.
#
#   datagen.sh start [n]   start n instances (default 15)
#   datagen.sh stop        stop all running instances
#   datagen.sh status      running instances and total fens so far
#
# The merged data for bullet is just: cat data/dg_*.txt
#

set -e

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

games=1000000
nodes=3000
randply=8
book=books/noob_4moves.epd
dir=data
logs=$dir/logs
pids=$dir/datagen.pids

cmd=${1:-start}
n=${2:-15}

case "$cmd" in

  start)
    mkdir -p "$logs"
    for ((i=0; i < n; i++)); do
      nohup node lozza.js "datagen games $games nodes $nodes randply $randply dir $dir book $book" q \
        > "$logs/datagen_$(date +%Y%m%d_%H%M%S)_$i.log" 2>&1 < /dev/null &
      echo $! >> "$pids"
    done
    echo "started $n datagen instances, logs in $logs"
    ;;

  stop)
    if [ -f "$pids" ]; then
      xargs -r kill < "$pids" 2>/dev/null || true
      rm -f "$pids"
      echo "stopped"
    else
      echo "nothing running"
    fi
    ;;

  status)
    running=0
    if [ -f "$pids" ]; then
      for p in $(cat "$pids"); do
        kill -0 "$p" 2>/dev/null && running=$((running+1))
      done
    fi
    echo "running: $running"
    echo "files:   $(ls "$dir"/dg_*.txt 2>/dev/null | wc -l)"
    echo "fens:    $(cat "$dir"/dg_*.txt 2>/dev/null | wc -l)"
    ;;

  *)
    echo "usage: datagen.sh [start [n]|stop|status]"
    exit 1
    ;;

esac

