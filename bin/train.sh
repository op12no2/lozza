#!/bin/bash

# train a net with bullet from bullet.rs (or the file given), run from anywhere: bin/train.sh [file]
#
# bullet.rs is built as a small cargo project in <OUTPUT_DIR>/trainer, so a copy of the config
# that made the nets sits next to them and ~/bullet is left untouched. ~/bullet/target is shared
# as the build cache so bullet is only compiled once.
#
# env var overrides: BULLET (default ~/bullet), CUDA_PATH (default /usr/local/cuda)

set -e

# a file given is relative to where this is run from, bullet.rs to the lozza root

t=bullet.rs

if [ -n "$1" ]; then
  t=$(realpath "$1")
fi

cd "$(dirname "$0")/.."
bullet=${BULLET:-$HOME/bullet}

export CUDA_PATH=${CUDA_PATH:-/usr/local/cuda}

if [ ! -f "$t" ]; then
  echo "error: $t not found"
  exit 1
fi

if [ ! -d "$bullet/crates/bullet_lib" ]; then
  echo "error: bullet not found at $bullet"
  exit 1
fi

if [ ! -x "$CUDA_PATH/bin/nvcc" ]; then
  echo "error: no cuda at $CUDA_PATH"
  exit 1
fi

output_dir=$(grep -oP 'const OUTPUT_DIR:.*= *"\K[^"]+' "$t")

if [ -z "$output_dir" ]; then
  echo "error: no OUTPUT_DIR in $t"
  exit 1
fi

# fail now rather than after the build if a data file is missing

for f in $(grep -oP '^\s*"\K[^"]+\.(vf|bullet|data|binpack)(?=",)' "$t"); do
  if [ ! -f "$f" ]; then
    echo "error: data file $f not found"
    exit 1
  fi
done

if ls -d "$output_dir"/*-[0-9]* > /dev/null 2>&1; then
  echo "warning: $output_dir already has nets, which will be overwritten"
  read -p "continue? [y/N] " answer
  if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
    echo "aborted"
    exit 1
  fi
fi

proj="$output_dir/trainer"

mkdir -p "$proj/src"
cp "$t" "$proj/src/main.rs"

cat > "$proj/Cargo.toml" << EOF
[package]
name = "trainer"
version = "0.1.0"
edition = "2024"

[dependencies]
bullet_lib = { path = "$bullet/crates/bullet_lib", features = ["cuda"] }

[workspace]
EOF

echo "training from $t into $output_dir, config copied to $proj/src/main.rs"

CARGO_TARGET_DIR="$bullet/target" cargo run --release --manifest-path "$proj/Cargo.toml"
