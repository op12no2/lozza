# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Lozza is a single-threaded UCI chess engine written in plain JavaScript. It runs under Node (CLI) and as a Web Worker in a browser. The release artifact `lozza.js` is the concatenation of all `src/*.js` files plus a base64-embedded NNUE weights blob — it is NOT hand-edited.

## Build / run / test

All scripts live in `bin/` and assume the repo root as the working directory.

- `bin/build` — concatenates `src/*.js` in a specific order into `lozza.js`, then runs `node lozza uci` as a syntax check. Source order matters (constants before usage); see the `cat` list in `bin/build` before reordering or adding files.
- `bin/bench [depth]` — runs `bench` on both the working tree (`./lozza.js`) and the previous release (`./releases/lozza.js`) for nps comparison.
- `bin/sprt [stc|ltc]` — SPRT against `./releases/lozza.js` via `~/fastchess-ob` (16-concurrent on pinned CPUs, openings from `/mnt/d/books/4moves_noob.epd`). Hardcoded paths — won't work on other machines without edits.
- `bin/makebin` — builds a Windows binary with `bun build --compile`.
- `bin/serialise_net <file>.bin` — base64-encodes a bullet `.bin` net into `src/weights.js`. `bin/build` must be run afterwards to embed it in `lozza.js`.
- `bin/train` — copies `src/bullet.rs` into `../bullet/examples/simple.rs` and runs `cargo r -r --example simple`. Requires the sibling `../bullet` checkout.

Single-position / interactive testing is done through UCI commands; useful non-standard ones (see `src/uci.js`):

- `position fen <FEN>` / `p fen ...` — load a position. **A `ucinewgame` or `setoption name Hash value <mb>` MUST be sent before the first `position`** (otherwise `ttSize == 1` and the command is rejected).
- `go depth N` / `g d N`, `go movetime ms`, `go nodes N`
- `perft N` / `f N` — perft from current position
- `pt [maxDepth]` — run the perft test suite from `src/data.js`
- `bench [depth]` / `h <depth>` — run the bench suite (default depth from `BENCH_DEPTH` in `src/const.js`)
- `et` — eval-test (sum of evals over bench positions)
- `eval` / `e` — eval current position
- `board` / `b` — print the board
- `net` / `n` — print net architecture info

The `stop` command is a no-op (engine does not support async stop) and there is no multi-threading. The author email noted in the README is `op12no2@gmail.com`.

## Architecture

### Source layout and the build concatenation

There are no `require`/`import` statements anywhere in `src/`. The entire engine relies on `bin/build` concatenating files in dependency order into a single global scope. When adding a file, add it to the `cat` list in `bin/build` after its dependencies and before its consumers. The final file in the build is `src/main.js`, which calls `initOnce()` and wires up the Node stdin / WebWorker `onmessage` handlers (`src/init.js`, `src/node.js`).

Top-level UCI dispatch is `uciExec` in `src/uci.js`. From there:
- `position` → `position()` in `src/position.js` (also rebuilds the NNUE accumulator from scratch)
- `go` → `go()` in `src/go.js` → `rootSearch()` → `search()` / `qSearch()` in `src/search.js` / `src/qsearch.js`

### Board representation

12×12 mailbox (`bdB`, 144 bytes; 8×8 squares surrounded by `EDGE` sentinels). Pieces are encoded as `color | piece`: white = 0x0, black = 0x8, piece = `PAWN..KING` (1..6). See `src/const.js` for the full piece-code table and the `IS_*` predicate arrays used to avoid branches in move generation. Squares are indexed in 12×12 space; the `B88` array maps 0..63 → mailbox square. `bdZ` maps mailbox square → index into per-side `wList`/`bList` piece lists (kings always live at index 0).

State is all in module globals (`bdB`, `bdZ`, `bdTurn`, `bdRights`, `bdEp`, `wCount/bCount/wCounts/bCounts`, `loHash/hiHash`, `repLo/repHi/repLoHash/repHiHash`) rather than in a struct — make/unmake operates directly on these globals.

### Search node stack

`src/node.js` allocates `MAX_PLY` (128) preallocated `nodeStruct` instances in the `nodes` array, then doubly-links them via `childNode`/`parentNode`/`grandparentNode` once during `initOnce()`. Search is recursive but never allocates — it walks down `node.childNode` and re-uses the per-ply move buffers, killers, history bits, and **per-ply NNUE accumulator snapshots** (`net_h1_a`, `net_h2_a`).

`cache(node)` / `uncacheA(node)` / `uncacheB(node)` save and restore unrecoverable state (rights, ep, hash, rep counters, and the NNUE accumulators) around make/unmake. `uncacheA` is the cheap restore (no NNUE); `uncacheB` restores the accumulators and is only called when the move was made (i.e., when `makeMoveB` ran). Illegal-move bailout skips `uncacheB`. The NMP branch in `search()` deliberately skips `uncacheB` because it never called `makeMoveB`.

### Two-stage make/move and lazy accumulator update

`makeMoveA()` updates the board, piece lists, hash, rights, and rep stack, and **records what the NNUE accumulator update would be** by setting `ueFunc` and `ueArgs0..5` — it does NOT touch the accumulator. `makeMoveB()` is what actually applies the deferred accumulator update by calling `ueFunc()`. The reason for the split: legality is checked between A and B, so illegal moves skip the accumulator work. See `src/makemove.js`, `src/net.js`. This is an active area of experimentation (see `todo.md` "lazy accumulator update like cwtch"); be careful when changing make/unmake ordering.

### Move encoding

Moves are packed into a single uint32 (see `MOVE_*_BITS` / `MOVE_*_MASK` in `src/const.js`): to-square, from-square, to-piece, from-piece, promo-piece, and flag bits for legal/EP-take/EP-make/castle/promote. `MOVE_CLEAN_MASK` clears the `LEGAL` bit when comparing moves to TT/killer/history slots — moves are stored "clean" in those tables.

### Move ordering

Two-stage ranking happens in `src/iterate.js`:
1. `addSlide`/`addCastle`/`addCapture`/`addPromotion`/`addEPTake` are called by `genMoves` and pre-rank moves into either `node.moves[]` (hash, promo, takes, killers, mate-killer, castles) or `node.moves2[]` (quiet slides — ranked lazily).
2. `getNextMove()` selection-sorts from `moves[]` first, then on exhaustion calls `rankSlides()` to assign history scores to `moves2[]` and continues selection-sorting from there.

Rank constants (`BASE_HASH`, `BASE_PROMOTES`, `BASE_GOODTAKES`, `BASE_EVENTAKES`, `BASE_EPTAKES`, `BASE_MATEKILLER`, `BASE_MYKILLERS`, `BASE_GPKILLERS`, `BASE_CASTLING`, `BASE_BADTAKES`) form a strict descending ladder. `BASE_PRUNABLE` = `BASE_BADTAKES` is the threshold for LMR / LMP / FP pruning (only moves below this count toward `numPrunes`).

### Transposition table

`src/tt.js`. Power-of-two sized, allocated as parallel typed arrays (split keys, 32+32-bit zobrist). `ttPut` only overwrites depth-0 entries when the slot is empty or also depth-0. `ttGet` returns the hash move/eval even on depth-miss so iterative deepening and IIR can still use them. Mate scores are stored ply-adjusted (`score ± ply`) and unadjusted on read.

`ttResize(mb)` and `ttInit()` are triggered by `setoption name Hash` and `ucinewgame`. Until one of those runs, `ttSize == 1` and UCI rejects `position` / `go` — `uci.js` enforces this.

### NNUE

Architecture is `768 → (NET_H1_SIZE * 2) → 1` with SqrReLU activation, trained quantised (`NET_QA=255`, `NET_QB=64`, `NET_SCALE=400`). Default `NET_H1_SIZE=256`. The "two" outputs of the feature transformer are perspective accumulators `net_h1_a` (us) and `net_h2_a` (them); `net_a[turn>>>3]` indexes them by side-to-move.

Weights pipeline:
1. Train a bullet net (see `src/bullet.rs` for the trainer config; run via `bin/train`).
2. `bin/serialise_net mynet.bin` writes `WEIGHTS_B64 = "..."` into `src/weights.js`.
3. `bin/build` concatenates `src/weights.js` into `lozza.js`.
4. `netLoad()` in `src/net.js` decodes the base64 at startup and unpacks weights via `bullet2lozza()` (a1↔a8 flip) and `flipIndex()` (perspective flip for the "them" side).

If you change activation, `NET_H1_SIZE`, or quantisation, both `src/const.js` (`NET_*` constants) and `netEval()`/`netLoad()` in `src/net.js` need to match the trainer in `src/bullet.rs`. This pipeline has historically been a source of subtle loading bugs.

### Search features currently in place

- Iterative deepening + aspiration windows (`src/go.js`)
- PVS with null-window re-search
- Null move pruning (depth>2, with depth reduction 3+improving), late move reductions (`LMR_LOOKUP` indexed by depth and `numPrunes`), late move pruning, futility pruning, mate distance pruning, beta/reverse-futility pruning, improving heuristic, IIR (search.js:311)
- Killers (per-node `killer1/killer2/mateKiller`), grandparent killers, butterfly history (`objHistory`, indexed by `frObj << 8 | to`)
- Quiescence with SEE-based pruning (`quickSee` in `src/see.js`) and standpat with futility delta
- Repetition + 50-move + insufficient material draws (`src/draw.js`); insufficient-material rules also short-circuit `evaluate()` in `src/eval.js` before calling `netEval`

`todo.md` is the running list of planned work — read it before suggesting new search features so you don't propose what's already on deck.

## Style and conventions

- Plain ES5-ish JavaScript with `"use strict"` at the top (`src/head.js`). No classes except `nodeStruct` (used with `new`). No modules.
- Hot paths use typed arrays (`Int32Array`, `Uint8Array`, ...) and `| 0` / `>>> 0` / `Math.imul` for integer coercion. Preserve these when editing — they materially affect V8 codegen.
- Side effects on module globals are the norm; pass `node` around but mutate the globals (`bdB`, `loHash`, etc.) in place.
- Indentation is 2 spaces. Source files are concatenated, so don't rely on file-scoped `let` — every `const`/`let`/`function` at top level becomes a single shared global. Watch for collisions when adding new identifiers.

## Sibling repos referenced from this project

- `../bullet` — Rust NNUE trainer; `bin/train` copies `src/bullet.rs` into it.
- `../cwtch` — the author's C engine; ideas marked "from cwtch" in `todo.md` are ports.
- `https://github.com/op12no2/lozza-ui` — browser UI / examples that consume `lozza.js` as a Web Worker.

## Things to avoid

- Don't edit `lozza.js` directly — it's a build artifact. Edit `src/*.js` and run `bin/build`.
- Don't reorder files in `bin/build` casually — the load order is load-bearing because everything shares one global scope.
- Don't change `src/weights.js` by hand — it's overwritten by `bin/serialise_net`.
- Don't add `require`/`import` to `src/` files — they break the browser/Web Worker build.
