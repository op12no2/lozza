# Lozza - notes for an AI agent picking this repo up

Lozza is a UCI chess engine in one Javascript file, `lozza.js`, that runs in a Web
Worker and in node. Many people read and modify the source, so **keep the code plain
and well commented**; when the tooling cannot cope with something, fix the tooling
rather than bend `lozza.js`.

This file is committed to a public repo. **Never put anything personal in it** (names,
email addresses, machine details, home directory paths).

## What is where

| path | what |
|---|---|
| `lozza.js` | the engine. Organised in folds (`//{{{  name` ... `//}}}`); search for a fold name to find things. The `net` fold holds the NNUE code. |
| `lozza.c` | the WebAssembly SIMD net kernel (accumulator updates and output layer). Compiled and embedded as base64 in `getWasm()` at the bottom of `lozza.js` by `bin/wasm.sh`. |
| `lozza.rs` | the net trainer (for bullet). Its save format is exactly what `netLoad()` reads. |
| `tools/lozza2c/` | Javascript-to-C converter that makes the native binaries from `lozza.js`. |
| `bin/` | `wasm.sh`, `sprt.sh`, `release.sh`, `train.sh`. Each has a header comment saying how to use it. |
| `examples/` | the web hello world. |

Local only, not in git: `nets/` (trained nets, `nets/net<width>/lozza-200/quantised.bin`),
`data/` (training data), `books/` (opening books), `releases/`, `junk/` (scratch, logs,
archives), `lozzacand.js` (the SPRT baseline), `sprt.pgn`, `config.json`.

The repo copy of `lozza.js` is the dev version: it has no embedded weights and reads
the file named by `NET_WEIGHTS_FILE`. Releases have the weights embedded.

## The net

- `(768 -> H1) x 2 -> 1 x 8`: dual perspective, no input buckets, SCReLU, 8 output
  buckets chosen by piece count (`(pieces - 2) >> 2`). `NET_H1_SIZE` is the width.
- Quantised: QA 255, QB 64, scale 400. Everything is held in 16 bit arrays and the
  trainer's weight clipping is what makes that safe; `netCheck()` warns if a net breaks
  the assumptions.
- The net loops exist in three places that must give identical results:
  1. the Javascript loops in `lozza.js` (used when `WASM = 0` or the host has no wasm SIMD),
  2. `lozza.c` (the wasm kernel, used by `lozza.js` when `WASM = 1`, the default),
  3. the native binaries, which are *converted from the Javascript loops* (the converter
     ignores the kernel) and vectorised by clang.

  Change one and the others must follow. `bin/wasm.sh` checks 1 against 2 (same bench),
  `tools/lozza2c/test.sh` checks 3 against node.

## Everyday commands

```
node lozza.js qb q               bench; the node count is the engine's fingerprint
node lozza.js uci q              name: "Lozza <ver> (dev wasm)" = weights from a file, kernel in use
node lozza.js n q                net details
bin/wasm.sh                      rebuild + embed the kernel (needed when a net size changes), checks bench
tools/lozza2c/build.sh           lozza.js -> C -> ./lozza, ./lozza.exe, ./lozza_scalar
tools/lozza2c/test.sh            binaries against node, and the SIMD checks
bin/sprt.sh [stc|ltc] [a b]      SPRT; default lozza.js against lozzacand.js; .js or binaries
bin/release.sh <ver> [--force]   releases/<ver>/
bin/train.sh                     prints the data -> train -> release sequence
```

Command line arguments are UCI commands run in order; `q` quits. Useful extras: `qb`
(bench), `n` (net), `b` (board), `m` (moves), `et` (eval tests), `pt` (perft tests).

## Working rules

- **Bench.** A change that should not alter the search must leave the bench node count
  the same; say so in the commit message (`... bench unchanged <n>`). A change that
  does alter it quotes the new number (`... bench <n>`).
- **SPRT** anything that changes strength: bounds 0/5, STC only, let it finish unless
  the result is beyond doubt. After a pass `cp lozza.js lozzacand.js`. Keep the log of
  each run in `junk/`.
- Plain Javascript (`WASM = 0`) is about 7x slower than the kernel at width 1536, so
  matches between `.js` engines only mean something with the kernel on.
- After anything structural in `lozza.js` run `tools/lozza2c/build.sh` and `test.sh`.
- Commit and push only when asked. Commit messages are short and lower case.

## The converter (`tools/lozza2c`)

- Converts the folds of `lozza.js` to C with whole-program type inference; `fuse.js`
  and `lozza_rt.h`/`runtime_uci.c` supply the runtime (UCI loop, stdin, strings).
- Clue comments in `lozza.js` steer it: `// @i64` etc on a declaration, `// @types
  name:str ...` on a function line, and `// @i16` on a local `const` (declared as
  `int16_t`; a loop declaring such locals is vectorised 16 wide). `(x << 16) >> 16`
  is turned into a 16 bit cast. These are what make `netEvalSum()` compile to 256 bit
  16 bit SIMD; do not tidy them away.
- Host-only code: `if (nodeHost)` / `if (shellHost)` are treated as false, `net_kernel`
  as always null (`HOST_NULL`), functions in the `HOST` table come from the C runtime,
  and `EXCLUDE` in `build.sh` lists functions not to convert.
- Things the binaries get that the Javascript knows nothing about (all in `lozza2c.js`
  or `lozza_rt.h`, each with a comment saying what it was worth): big global arrays
  start on a 64 byte boundary (`LZ_ALIGNED`), the tt entry is prefetched straight
  after `makeMoveA()` (`PREFETCH`), and on Linux the tt is put in huge pages
  (`lz_alloc0`). In the C, speed is all that matters; readability is for `lozza.js`.
- `test.sh` ends with the SIMD checks: the net functions must contain the 256 bit 16 bit
  instructions (disassembly), and the binary must be at least 6x faster than
  `lozza_scalar` (the same C with vectorising off) for a net of 1024 or more. About 9x
  at 1536. They exist because losing SIMD changes nothing but speed.

## Releases

`bin/release.sh <ver>` makes `lozza<ver>.js` (the net `lozza.js` uses, the best one),
`lozza<ver>-linux` and `lozza<ver>.exe` with the same net, and `lozza<ver>_net<width>.js`
for each narrower net in `nets/` as smaller, weaker alternatives. Every `.js` has
`WASM = 1` and a kernel built for its width. Everything is bench-checked.

## What has been measured (so it need not be redone)

All at STC, Elo for the first named.

- Net width, each against the next size down (wasm engines): 32 +151, 64 +146, 128 +132,
  256 +129, 512 +82, 768 +40, 1024 +19, 1536 +18, 2048 -2. As native binaries 2048
  against 1536 was -6. So 1536 is the net for both `lozza.js` and the binaries.
- wasm kernel against plain Javascript at the same net: +130.
- Output buckets (8 against 1): +7. WDL 0.2 against 0.4: +15; 0.0 against 0.2: level.
- Two months of training data against one: level.
- Native binary speed at 1536 is about 1.2M nps where node with the kernel is about
  0.65M and plain Javascript about 0.1M (same machine, for the ratios only).

Speed work on the binary (same bench throughout, so no SPRT was needed):

- Helped: 64 byte alignment of the net arrays about 7%; the eval cache in
  `evaluate()` about 10% on the bench, less in long searches (it also gives the wasm
  `.js` about 10%); tt prefetch and huge pages together 2-3% at Hash 16, about 9% at
  Hash 128. Altogether the binary went from about 1.2M to 1.5M nps on the bench.
- Did not help, do not retry without a new reason: the tt as an array of structs
  instead of parallel arrays, profile guided optimisation, a non-PIE build, one shared
  weights array for both perspectives (1-2% and only under load), an eval cache
  bigger than 1 << 16, huge pages for the static arrays.
- Not done: an AVX-512 build was about 15% faster again on a CPU that has it, but
  would be an extra pair of binaries in a release.
- The time now goes roughly 45% on the net (accumulator updates and the output layer),
  30% in search()/qSearch() and 25% on move generation and ordering.

Ideas not yet tried: an input-side change to the net (horizontal mirroring or king
buckets) and keeping history tables across moves.

## Gotchas

- There is no profiler here (no perf under WSL); a SIGPROF sampler linked into a scratch
  build and resolved with nm does the job.
- Timing is noisy: pin with `taskset`, interleave the builds being compared and take
  the best of several runs. Nothing can be timed while an SPRT is running.
- The wasm kernel is built for one net shape. After changing `NET_H1_SIZE` or
  `NET_O_SIZE` run `bin/wasm.sh`; until then `lozza.js` quietly uses the Javascript
  loops (no "wasm" in the uci name).
- Under WSL the wall clock can step backwards; time things with `performance.now()` or
  `/proc/uptime`.
- To stop a match: `pkill -INT -x fastchess` (fastchess then prints its totals).
- The scripts expect fastchess, bullet and a Windows SDK for cross-compiling in
  particular places; each script says where at the top.
