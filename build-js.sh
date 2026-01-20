#!/usr/bin/env bash

set -euo pipefail

mkdir -p releases

rm -f releases/lozza.js
rm -f tmp.js

cp lozza.js tmp.js

sed -i '/let WEIGHTS_B64 = "";/d' tmp.js

{
  printf '\nconst WEIGHTS_B64 = "'
  base64 -i nets/quantised.bin | tr -d '\n'
  printf '";\n'
  cat tmp.js
} > releases/lozza.js

rm -f tmp.js

