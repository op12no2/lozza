#!/bin/bash
#
# Train a Lozza net with bullet (checked out at ../bullet) from lozza.rs.
#
#   train.sh             print the datagen -> train -> release sequence (reminder)
#   train.sh data        cat data/dg_*.txt, convert to bulletformat and shuffle into
#                        data/gen11.bullet (mem is the shuffle budget in MB)
#   train.sh build       build lozza.rs in junk/train against ../bullet (cuda)
#   train.sh run         build and train
#
# lozza.rs is the single source: junk/train/src/main.rs is a symlink to it.
#

set -e

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

bullet=$root/../bullet
proj=$root/junk/train
utils=$bullet/target/release/bullet-utils
export CUDA_PATH=${CUDA_PATH:-/usr/local/cuda}

mem=48000                         # MB of RAM the shuffle may use
raw=data/gen11.txt
unshuffled=data/gen11.unshuffled.bullet
out=data/gen11.bullet

cmd=${1:-help}

setup() {
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

  data)
    if [ ! -x "$utils" ]; then
      echo "building bullet-utils"
      (cd "$bullet" && cargo b -r --package bullet-utils)
    fi
    echo "merging $(ls data/dg_*.txt | wc -l) files"
    for f in data/dg_*.txt; do           # drop an incomplete last line (instance killed mid write)
      if [ -z "$(tail -c1 "$f")" ]; then cat "$f"; else head -n -1 "$f"; fi
    done > "$raw"
    echo "$(wc -l < "$raw") positions"
    "$utils" convert --from text --input "$raw" --output "$unshuffled"
    "$utils" shuffle --input "$unshuffled" --output "$out" --mem-used-mb $mem
    "$utils" validate --input "$out" || true
    rm -f "$raw" "$unshuffled"
    ls -l "$out"
    ;;

  build)
    setup
    (cd "$proj" && cargo b -r)
    ;;

  run)
    setup
    (cd "$proj" && cargo r -r)
    ;;

  help)
    cat <<HELP
Training a new net, start to finish:

  1. bin/datagen.sh start [n]        n node instances play games into data/dg_*.txt
     bin/datagen.sh status           running instances, files, fens so far
     bin/datagen.sh stop             when there are enough fens

  2. bin/train.sh data               merge data/dg_*.txt, convert and shuffle into $out

  3. edit lozza.rs                   OUTPUT_DIR, DATA_FILES, superbatches, lr etc
                                     (resume: load_from_checkpoint + start_superbatch)

  4. bin/train.sh run                build junk/train against ../bullet (cuda) and train
                                     checkpoints land in OUTPUT_DIR/<id>/quantised.bin

  5. edit lozza.js                   point NET_WEIGHTS_FILE at the new quantised.bin
     node lozza.js qb q              bench (the number will change: new net)
     bin/sprt.sh [stc|ltc]           lozza.js vs lozzacand.js, must win

  6. bin/release.sh <version>        embeds the weights into releases/<version>/lozza<version>.js

bin/train.sh [data|build|run]
HELP
    ;;

  *)
    echo "usage: train.sh [data|build|run]"
    exit 1
    ;;

esac
