#!/bin/bash
#
# Train a Lozza net with bullet (checked out at ../bullet, or $BULLET) from lozza.rs.
#
#   train.sh             print the data -> train -> release sequence (reminder)
#   train.sh build       build lozza.rs in junk/train against bullet (cuda)
#   train.sh run         copy lozza.rs into OUTPUT_DIR as a record of how the net
#                        was trained, then build and train
#
# lozza.rs is the single source: junk/train/src/main.rs is a symlink to it and
# OUTPUT_DIR and DATA_FILES are read from it.
#

set -e

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

bullet=${BULLET:-$root/../bullet}
proj=$root/junk/train
export CUDA_PATH=${CUDA_PATH:-/usr/local/cuda}

# the first quoted string on the line that defines const $1 in lozza.rs

rsconst() {
  grep -m1 "^const $1:" lozza.rs | sed 's/^[^"]*"\([^"]*\)".*/\1/'
}

outdir=$(rsconst OUTPUT_DIR)
files=$(grep -m1 "^const DATA_FILES:" lozza.rs | grep -o '"[^"]*"' | tr -d '"')   # every file in the list

if [ -z "$outdir" ] || [ -z "$files" ]; then
  echo "cannot find OUTPUT_DIR and DATA_FILES in lozza.rs"
  exit 1
fi

cmd=${1:-help}

setup() {
  if [ ! -d "$bullet/crates/bullet_lib" ]; then
    echo "bullet not found at $bullet (clone it next to this repo or set BULLET)"
    exit 1
  fi
  mkdir -p "$proj/src"
  ln -sfn "$root/lozza.rs" "$proj/src/main.rs"
  cat > "$proj/Cargo.toml" <<CARGO
[package]
name = "lozzatrain"
version = "0.1.0"
edition = "2024"

[dependencies]
bullet_lib = { path = "$bullet/crates/bullet_lib", features = ["cuda"] }

[profile.release]
opt-level = 3
CARGO
}

case "$cmd" in

  build)
    setup
    (cd "$proj" && cargo b -r)
    ;;

  run)
    setup
    for f in $files; do
      if [ ! -f "$f" ]; then
        echo "$f not found: download and decompress it first, see bin/train.sh"
        exit 1
      fi
    done
    (cd "$proj" && cargo b -r)
    mkdir -p "$outdir"
    snap=$outdir/lozza.rs
    if [ -f "$snap" ] && ! cmp -s lozza.rs "$snap"; then   # keep the record of an earlier run into the same dir
      mv "$snap" "$outdir/lozza.$(date -r "$snap" +%Y%m%d_%H%M%S).rs"
    fi
    cp -p lozza.rs "$snap"
    echo "snapshot $snap"
    "$proj/target/release/lozzatrain"
    ;;

  help)
    cat <<HELP
Training a new net, start to finish:

  1. get the data                    Leela games as Stockfish binpacks. Monthly files are listed at
                                     https://huggingface.co/datasets/linrock/test80-2024/tree/main
                                     (also test80-2023 etc). Take a .min-v2.v6.binpack.zst one,
                                     about 1.5 billion usable positions per 7GB:

       cd data/leela
       wget -c https://huggingface.co/datasets/linrock/<repo>/resolve/main/<file>.binpack.zst
       zstd -d <file>.binpack.zst    (sudo apt install zstd)

  2. edit lozza.rs                   OUTPUT_DIR, DATA_FILES (the .binpack files), L1, superbatches,
                                     lr etc (resume: load_from_checkpoint + start_superbatch)

  3. bin/train.sh run                copy lozza.rs into OUTPUT_DIR, build junk/train against
                                     bullet (cuda) and train. checkpoints land in
                                     $outdir/<id>/quantised.bin

  4. edit lozza.js                   point NET_WEIGHTS_FILE at the new quantised.bin and set
                                     NET_H1_SIZE and NET_O_SIZE to L1 and OUTPUT_BUCKETS in lozza.rs
     bin/wasm.sh                     rebuild the wasm kernel if either size changed (it is built
                                     for one net shape; without this lozza.js still works, on the
                                     slow Javascript loops, and the uci name has no "wasm" in it)
     node lozza.js qb q              bench (the number will change: new net)
     bin/sprt.sh [stc|ltc]           lozza.js vs lozzacand.js, must win

  5. bin/release.sh <version>        releases/<version>/: a .js for each net in nets/net<width> with
                                     the weights and a kernel for that width embedded, and
                                     linux/windows binaries (tools/lozza2c)

bin/train.sh [build|run]
HELP
    ;;

  *)
    echo "usage: train.sh [build|run]"
    exit 1
    ;;

esac
