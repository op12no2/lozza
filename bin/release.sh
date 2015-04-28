#!/bin/bash

mkdir releases/$1
cp lozza.js releases/$1/lozza$1.js
bun build lozza.js --compile --target=bun-windows-x64 --minify --outfile releases/$1/lozza$1.exe

