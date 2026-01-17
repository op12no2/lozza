## overview

- Lozza is a UCI chess engine.
- There are 2 versions: Javascript and C.

## source

- `js/*.js` - Javascript engine.
- `c/lozza.c` - C engine.

## nets

- `nets/quantised.bin` - net for Javascript version.
- `nets/weights.h` - net for C version.

## build

- `./build.sh` - creates `./lozza.js` and `./lozza` for dev testing as well as release-friendlies in `./releases` via zig.
- use `./build.sh dev` to just quickly build the 2 dev files.

## testing

- `node lozza.js "bench warm 0" q` - runs bench command for Javascript version.
- `./lozza bench q` - runs bench command for C version.

- Note that the bench command will not report the same number of nodes for Javascript and C - the code is different between versions.

## notes

- The Javascript verison uses a 12x12 board and mailbox movegen.
- The C version uses a 8x8 + bitboards and magics movegen.
- Other then that both engines are very similar, the C version being essentially a port from Javascript to C.
