#!/bin/bash
set -e

LOZZA="$(dirname "$0")/../lozza.js"

if [ "$1" = "kill" ]; then
  # only the node processes started below, not a shell whose command line mentions them
  PIDS=$(pgrep -f "^node .*lozza\.js datagen" 2>/dev/null || true)
  if [ -z "$PIDS" ]; then
    echo "no datagen processes found"
  else
    echo "$PIDS" | xargs kill
    echo "killed $(echo "$PIDS" | wc -l) datagen processes"
  fi
  exit 0
fi

# count the games and positions in every .vf file in a directory. safe while datagen is writing to
# it: a game is written in one go, and a game cut short at the end of a file is reported, not counted

if [ "$1" = "count" ]; then
  if [ "$#" -ne 2 ] || [ ! -d "$2" ]; then
    echo "usage: bin/datagen.sh count <directory>"
    exit 1
  fi
  node -e '
    const fs   = require("fs");
    const path = require("path");
    const dir  = process.argv[1];

    // a game is a 32 byte board then 4 byte (move, score) entries ending with 4 zero bytes

    const CHUNK = 1 << 24;
    const buf   = Buffer.alloc(CHUNK);

    let files = 0, games = 0, positions = 0, bytes = 0, partial = 0;

    for (const name of fs.readdirSync(dir).filter(f => f.endsWith(".vf")).sort()) {

      const fd = fs.openSync(path.join(dir, name), "r");

      let base = 0, len = 0, i = 0;  // buf holds the file from base, len bytes, read to i

      const need = n => {
        if (i + n <= len)
          return true;
        base += i;
        len   = fs.readSync(fd, buf, 0, CHUNK, base);
        i     = 0;
        return len >= n;
      };

      while (need(32)) {
        i += 32;
        let n = 0, done = false;
        while (need(4)) {
          const v = buf.readUInt32LE(i);
          i += 4;
          if (v === 0) {
            done = true;
            break;
          }
          n++;
        }
        if (!done)
          break;
        games++;
        positions += n;
      }

      if (len - i > 0)
        partial++;

      bytes += base + i;
      fs.closeSync(fd);
      files++;
    }

    const f = x => x.toLocaleString("en-GB");

    console.log(`${dir}: ${f(files)} files, ${f(games)} games, ${f(positions)} positions, ${(bytes / 1048576).toFixed(1)} MB, ${positions ? (bytes / positions).toFixed(2) : 0} bytes/position`);
    if (partial)
      console.log(`${partial} file(s) end in a game still being written, not counted`);
  ' "$2"
  exit 0
fi

if [ "$#" -ne 3 ]; then
  echo "usage: bin/datagen.sh <directory> <positions> <threads>"
  echo "       <positions> is the total across all threads (accepts e.g. 1e9)"
  echo "       bin/datagen.sh count <directory>"
  echo "       bin/datagen.sh kill"
  exit 1
fi

DIR="$1"
POSITIONS="$2"
THREADS="$3"

# split the total target evenly across threads (integer, accepts 1e9 etc)
PER_THREAD=$(awk "BEGIN{printf \"%d\", $POSITIONS / $THREADS}")

mkdir -p "$DIR"

if [ "$(ls -A "$DIR" 2>/dev/null)" ]; then
  echo "warning: $DIR is not empty"
  read -p "continue? [y/N] " answer
  if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
    echo "aborted"
    exit 1
  fi
fi

for i in $(seq 1 "$THREADS"); do
  sleep $(awk "BEGIN{printf \"%.2f\", rand() * 3}" <<< "$RANDOM")
  node "$LOZZA" "datagen $DIR $PER_THREAD" &
done

echo "launched $THREADS datagen processes, $PER_THREAD positions each (~$POSITIONS total) writing to $DIR"
wait
echo "all datagen processes complete"
