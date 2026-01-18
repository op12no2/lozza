## overview

- Lozza is a UCI chess engine.
- The C codebase is compiled to both native binaries and WASM (via Emscripten).

## source

- `src/*.c` - C engine source (unity build).

## nets

- `nets/weights.h` - neural network weights.

## build

- `./build.sh` - full build (dev + release)
- `./build.sh -dev` - dev build only

Requires Emscripten (emcc) for WASM builds.

## output

**Dev (`./test/`):**
- `test/lozza` - native binary (arch-native)
- `test/lozza-node.js` - Node WASM for testing via `test/node-wrapper.js`

**Release (`./releases/`):**
- `releases/lozza.js` - browser WASM (runs in web worker)
- `releases/lozza-linux` - Linux x86-64-v3
- `releases/lozza-win.exe` - Windows x86-64-v3
- `releases/lozza-mac-arm` - macOS ARM
- `releases/lozza-mac-x86` - macOS x86-64-v3

## testing

- `./bench.sh` - bench both native and Node WASM
- `./test/lozza bench q` - native bench
- `node test/node-wrapper.js bench q` - Node WASM bench

## notes

- WASM is single-threaded (no `stop` during search) (test and release).
