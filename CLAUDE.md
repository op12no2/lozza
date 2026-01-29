## overview

Lozza is a UCI chess engine written in C. This is a work-in-progress rewrite.

## status

WIP - Core engine functional with NNUE evaluation.

### todo

- see - done - sprt
- iir - done - sprt
- lmp - done - sprt
- use tt move in qs - fails sprt - why?
- use tt score in qs - fails sprt - why?
- remove tt move from captures list
- remove tt move from quiets list
- write to tt in qs beta
- write to tt in qs alpha
- pv
- use mat draw in s
- use mat draw in qs
- killers
- futility
- output buckets
- corrhist
- conthist
- caphist 
- singular extensions
- probcut
- tablebases support
- dfrc support
- mate distance pruning
- improving heuristic (and use of)

### things to try 

- simplify - zob_stm can be scaler.
- don't rank moves when in check
- track probable cut nodes
- use tt score, not eval
- normalise eval scale 
- eval cache
- nodes test nearer top of s and qs
- don't test for time up in qs
- id - don't start next depth if not enough time
- id - remove the bm paranoia now there is a tt
- defer nnue updates (post m-m and/or eval)
- pass incheck to move ierator in qs (only for move gen)
- extensions if in check etc
- only 2 calls to lmr in pv context
- tt protect bigger depths
- tt buckets
- spsa tune
- lmp - tell move iterator rather then cycle.

## toolchain

- clang in WSL2 Bash environment

## build

- makefile does not need tweaking when new files are added to the repo; it's auto
- `make` - Creates ./lozza
- `make clean` - Remove build artifacts
- `make rebuild` - Clean and rebuild

## source structure

```
src/
  main.c          - Entry point, UCI loop
  types.h         - Piece/square enums, inline helpers
  pos.h/c         - Position struct, FEN parsing, is_attacked()
  position.h/c    - position() (uci command)
  go.h/c          - go() (uci command)
  move.h/c        - Move encoding (32-bit), formatting
  nodes.h/c       - Node struct with accumulators, global search stack
  bitboard.h/c    - Attack tables, magic number generation
  movegen.h/c     - Move generation (quiets/captures)
  makemove.h/c    - Move execution with incremental accumulator updates
  search.h/c      - Alpha-beta search with PVS
  qsearch.h/c     - Quiescence search
  net.h/c         - NNUE evaluation and accumulator functions
  perft.h/c       - PERFT testing (68 positions)
  uci.h/c         - UCI protocol
  hh.h/c          - Hash history for 2/3 rep and 50 move rule
  tt.h/c          - Transposition table
  builtins.h      - popcount, bsf wrappers
  zobrist.h/c     - Zobrist hashing (incremental updates in makemove)
  bench.h/c       - Benchmark positions for search testing
  iterate.h/c     - Move iteration and sorting
  timecontrol.h/c - Time management
  history.h/c     - Piece-to history
  debug.h/c       - Debug verification for incremental updates
  see.h/c         - see_ge()
  weights.h       - Embedded NNUE weights
```

## nets

- `src/weights.h` - Embedded NNUE weights (384 hidden layer, perspective net)
- `nets/` - Alternative/experimental weight files

## testing

### perft (move generation correctness)
- `./lozza pt` - Run all 68 PERFT tests (~190s)
- `./lozza "pt 4"` - Run only tests with depth <= 4 (~0.1s, 25 tests)
- `./lozza "pt 5"` - Run only tests with depth <= 5 (~5s, 31 tests)
- `./lozza "p s" "f 5"` - Set startpos and run PERFT depth 5

### bench (search correctness)
- `./lozza bench` - Run 50 position benchmark, reports node count and nps
- Node count must match reference: use `./releases/lozza bench` to get expected value
- If node count differs, something is broken (eval, search, or accumulator updates)

### et (eval correctness)
- `./lozza et` - Run eval on 68 test positions, prints individual evals and sum
- Use `./releases/lozza et` to get reference eval sum
- Useful when tweaking evaluation or accumulator code

### reference builds
- `./releases/lozza` - Last known good build for comparison
- Always compare bench node count and et eval sum against reference after changes

Command-line arguments are executed as UCI commands then lozza exits. Without arguments, runs interactive UCI loop.

## code style

- Clear straightforward code but with performance in mind
- 2 space indentation
- else, return, continue and break on next line

```
if (x) {

}
else {

}
```

## NNUE architecture

The net is a perspective network with two accumulators (one per side). The weights are pre-flipped so both accumulators can use the same indexing. No king input buckets - basic 768 inputs.

### key files
- `net.h/c` - Weight loading, eval, and incremental update functions
- `nodes.h` - Node struct contains `accs[2][NET_H1_SIZE]` (384 elements each)
- `makemove.c` - Calls net update functions for each move type

### accumulator updates

Accumulators are updated incrementally in `make_move()` rather than rebuilt each eval. Each move type has a dedicated function that fuses all weight updates into a single loop for vectorization:
- `net_move()` - quiet moves and pawn double push
- `net_capture()` - regular captures
- `net_ep_capture()` - en passant
- `net_castle()` - castling (king + rook in one loop)
- `net_promo_push()` - pawn promotion without capture
- `net_promo_capture()` - pawn promotion with capture

### search integration
- `position()` in nodes.c calls `net_slow_rebuild_accs()` to initialize accumulators
- Search copies accumulators when copying position: `memcpy(next_node->accs, node->accs, sizeof(node->accs))`
- `make_move()` updates the copied accumulators incrementally
- `net_eval()` reads directly from `node->accs`

## sprt on hetzner epyc 7502p server

- Make sure ./lozza and ./releases/lozza are different (uci / bench etc)

```
./bin/sync.sh # copy to server
ssh root@epyc

tmux new -s sprt
./bin/sprt.sh | tee sprt.log; bash

# detach (make sure tmux pane is focused)
ctrl-b d

# later...
ssh root@epyc
tmux ls
tmux attach -t sprt # works after finish (b/c of `; bash`)
tail -f sprt.log # or just tail sprt.log if finished

# optional cleanup
tmux kill-session -t sprt
```
