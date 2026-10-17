# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Lozza is a UCI chess engine in plain JavaScript (no npm, no modules, no test framework, no linter). The same single file runs as a Web Worker in a browser and as a stdin/stdout UCI engine under Node. Author: Colin Jenkins (op12no2).

## Build

```
bin/build.sh        # concatenates src/*.js into ./lozza.js and runs `node lozza uci q` as a smoke test
```

- There are no imports. `src/` files are concatenated in the explicit order listed in `bin/build.sh`, so everything shares one global scope and order matters (constants/tables first, `main` last). Adding a file to `src/` without listing it in `build.sh` makes the build fail on purpose.
- `./lozza.js` (repo root) is the dev build and is gitignored. `examples/lozza.js` is the committed copy of the current dev build served via GitHub Pages / CDN; refresh it from `./lozza.js` when committing engine changes. `releases/lozza.js` is the last build that passed SPRT, the accumulating candidate for the next release and the SPRT baseline (`cand` in `bin/sprt.sh`); refresh it from `./lozza.js` too when an engine change is accepted. `releases/<ver>/lozza.js` are the frozen formal releases. `releases/` is gitignored, so both are local only. VS Code marks all three read-only.
- `src/weights.js` is generated (base64 net weights, `-diff` in `.gitattributes`). Never hand edit it.

## Running and testing

Command-line args are executed as UCI commands in order, so everything is scriptable:

```
node lozza.js qb q                                           # quick bench: depth 12 over 50 fens, prints node count
node lozza.js bench depth 12 warm 1 q                        # bench with warmup (aliases: h)
node lozza.js pt n 24 q                                      # perft suite, first N positions (full suite is very slow; last fens are ~1e9 nodes)
node lozza.js "position fen <fen>" "perft depth 1 to 5" q    # perft on the current position
node lozza.js uci "position startpos" "go depth 10" q        # search
node lozza.js "position startpos moves e2e4" e q             # e/eval: static net eval; b/board: fen; m/moves: legal moves; n/net: net info
node lozza.js et q                                           # eval symmetry test on flipped fens
node examples/node-promise.js                                # promise wrapper example
```

Short aliases: `p` position, `g` go, `u` ucinewgame, `o` setoption, `q` quit. Options: `Hash` (MB), `MultiPV`.

**Bench is the regression test.** `qb` prints a deterministic node count (currently `2002113`). Commit messages end with `bench <nodes>`; an unchanged bench means the search was untouched. Any functional search/eval change changes the bench and must be verified by SPRT. Perft (`pt`) is the movegen/make/unmake test: expect `errors 0`.

## SPRT

```
bin/sprt.sh   # ./lozza.js (coal) vs releases/lozza.js (cand) via ../fastchess, book at /mnt/d/chess_data
```

Edit the variables at the top of the script (tc, hash, sprt bounds, cand) rather than passing args. It copies both engines to `/tmp` first, so rebuilding `./lozza.js` during a run is safe. `sprt.pgn` and `config.json` are fastchess output (gitignored). Refuses to start if fastchess is already running.

## Net training

`bullet.rs` is the bullet trainer config: 768 inputs -> 256x2 (us/them perspectives) -> 1, SCReLU, quantised QA=255 / QB=64, eval scale 400. `src/netload.js` converts bullet's a1-based index to Lozza's a8-based index (`bullet2lozza`) and builds the mirrored "them" weight table (`flipIndex`). Net dimensions live in `src/constants.js` and must match the trainer.

## Architecture

**Host abstraction.** `nodeHost` (constants.js) is true under Node. `uciSend` writes to stdout or `postMessage`; input arrives via stdin (`main.js`) or `onmessage`. Everything else is host-agnostic.

**Command queue (queue.js / uciexec.js).** All input goes through `cmdQueue` and is drained in order by `uciDrain`, which awaits `uciExec(cmd, canYield=1)`. `go` is async: with `canYield` it calls `checkStop()` after each `rootSearch`, which yields a macrotask to the host (`setImmediate` under Node, `MessageChannel` in a worker because nested `setTimeout(0)` is clamped) and then `pollQueue` handles `stop`, `isready` and `quit` mid-search; other commands wait for `bestmove`. Internal callers (bench, perft, `uciExec` from args) call without `canYield`, so `go` runs synchronously. `silentMode` suppresses output during bench.

**Board (board.js, tables.js, position.js).** 12x12 mailbox: `bdB` is a 144-entry Uint8Array padded with `EDGE`; `B88` maps 0..63 to mailbox indices (index 0 = a8). Piece encoding: low 3 bits piece type (PAWN=1..KING=6), bit 3 colour (`BLACK = 0x8`), so `W_PAWN=1`, `B_PAWN=9`. Piece lists `wList`/`bList` (king at slot 0) with `bdZ` giving each square's slot. The `IS_*` tables in tables.js are 16-entry lookups indexed by piece code. State is module-level globals: `bdTurn`, `bdRights`, `bdEp`, `loHash`/`hiHash` (two 32-bit zobrist halves), `wCounts`/`bCounts`.

**Moves.** A move is a 32-bit int: to (8 bits), from (8), captured obj (4), moving obj (4), then flag bits (legal, ep take/make, castle, promote, promo piece). Masks are in constants.js. `MOVE_LEGAL_MASK` marks moves the generator already knows are legal so the king-attacked check after `makeMoveA` can be skipped.

**Search tree (node.js).** `nodes[]` is a fixed array of `MAX_PLY` pre-allocated `nodeStruct`s linked by `childNode`/`parentNode`/`grandparentNode`; `rootNode = nodes[0]`. Each node owns its move lists, killers, PV buffer and a copy of the net accumulators. `cache(node)` snapshots rights/ep/rep/hash/accumulators before the move loop; `uncacheA` restores the scalars and `uncacheB` the accumulators after unmake.

**Search flow.** `go` (go.js): iterative deepening, aspiration windows, MultiPV via excluded root moves -> `rootSearch` -> `search` (PVS with TT, mate-distance pruning, improving heuristic, LMR via `LMR_LOOKUP`) -> `qSearch`. Time/node limits are globals in stats.js; `checkTime` only stops once a best move exists. Move ordering is staged in movelist.js: `genMoves` (genmoves.js) calls the `add*` helpers in movelist.js, which put hash move, promotions, captures (ranked via `quickSee`), killers and castling into `node.moves` and quiet slides into `node.moves2`; `getNextMove` selection-sorts `moves` by rank (stage 0), then calls `rankSlides` (history, falling back to `SLIDE_SCORES` piece-square deltas) and does the same for `moves2` (stage 1). The `BASE_*` constants in constants.js define the rank bands.

**Make/unmake (makemove.js, unmakemove.js, netupdate.js).** `makeMoveA` updates board, piece lists, zobrist hash and castling rights, and sets `ueFunc`/`ueArgs*` so the net accumulators can be updated incrementally (`netMove`, `netCapture`, ...) for both perspectives. `IMAP` (built in init.js) maps `(obj << 8) + square` to the offset into the flat weight arrays.

**Eval (evaluate.js, net.js).** `evaluate` returns 0 for known material draws, else `netEval(turn)`, which picks the us/them accumulator pair by side to move and applies SCReLU + output layer in int32 arithmetic.

**TT (tt.js).** Parallel typed arrays (18 bytes/entry), power-of-two sized by the `Hash` option. `ttSize === 1` means "not allocated yet", which is why `position`/`go` call `newGame()` first.

**Debug helpers.** `boardcheck.js` is a consistency checker for board vs piece lists vs hash. `formatmove.js`/`fen.js` handle UCI move and FEN text.
