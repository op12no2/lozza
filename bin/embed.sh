#!/bin/bash

set -e

cd "$(dirname "$0")/.."

if [ "$#" -lt 2 ] || [ "$#" -gt 2 ]; then
  echo "usage: ./bin/embed.sh <net> <lozza>"
  exit 1
fi

net="$1"
lozza="$2"

if [ ! -f "$lozza" ]; then
  echo "error: $lozza not found"
  exit 1
fi

if [ ! -f "$net" ]; then
  echo "error: $net not found"
  exit 1
fi

unix2dos "$lozza"

b64=$(base64 -w0 "$net")

# replace the string on the line after function getWeights() {

# (the base64 is read from a file, a net is too big for a command line argument)

tmp=$(mktemp)
printf '%s' "$b64" > "$tmp"

awk -v f="$tmp" '
  BEGIN { getline b64 < f }
  replace { print "  return \"" b64 "\";\r"; replace = 0; done = 1; next }
  /^function getWeights\(\) \{\r?$/ { replace = 1 }
  { print }
  END { if (!done) exit 1 }
' "$lozza" > "$lozza.tmp" || { rm -f "$tmp" "$lozza.tmp"; echo "error: no getWeights() in $lozza"; exit 1; }

rm -f "$tmp"
mv "$lozza.tmp" "$lozza"

echo "embedded $net in getWeights(), ${#b64} base64 chars"

node $lozza uci net quit
