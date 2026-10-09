#!/bin/bash

# embed a net in lozza.js as the base64 in netWeights() at the end, run from anywhere:
#   bin/embed.sh <quantised.bin> [file]   embed the net
#   bin/embed.sh clear [file]             back to the dev version, which reads NET_WEIGHTS_FILE
# file defaults to the lozza.js this script belongs to

set -e

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "usage: bin/embed.sh <quantised.bin> | clear [file]"
  exit 1
fi

net="$1"
lozza="${2:-$(dirname "$0")/../lozza.js}"

if [ ! -f "$lozza" ]; then
  echo "error: $lozza not found"
  exit 1
fi

if [ "$net" = "clear" ]; then
  b64=""
else
  if [ ! -f "$net" ]; then
    echo "error: $net not found"
    exit 1
  fi

  # bullet writes l0w, l0b, l1w, l1b as i16, padded to a multiple of 64 bytes

  h=$(grep -oP '^const NET_H1_SIZE *= *\K[0-9]+' "$lozza")
  want=$(( (768 * h + h + 2 * h + 1) * 2 ))
  size=$(stat -c %s "$net")

  if [ "$size" -lt "$want" ] || [ "$size" -ge $(( want + 64 )) ]; then
    echo "error: $net is $size bytes, a 768->${h}x2->1 net is $want (+ padding to 64)"
    exit 1
  fi

  b64=$(base64 -w0 "$net")
fi

# replace the string on the line after function netWeights() {, keeping lozza.js's crlf line endings

# (the base64 is read from a file, a net is too big for a command line argument)

tmp=$(mktemp)
printf '%s' "$b64" > "$tmp"

awk -v f="$tmp" '
  BEGIN { getline b64 < f }
  replace { print "  return \"" b64 "\";\r"; replace = 0; done = 1; next }
  /^function netWeights\(\) \{\r?$/ { replace = 1 }
  { print }
  END { if (!done) exit 1 }
' "$lozza" > "$lozza.tmp" || { rm -f "$tmp" "$lozza.tmp"; echo "error: no netWeights() in $lozza"; exit 1; }

rm -f "$tmp"
mv "$lozza.tmp" "$lozza"

if [ -z "$b64" ]; then
  echo "netWeights() cleared, lozza.js reads NET_WEIGHTS_FILE"
else
  echo "embedded $net in netWeights(), ${#b64} base64 chars"
fi
