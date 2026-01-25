## overview

Lozza is a UCI chess engine written in C. This is a work-in-progress rewrite.

## status

WIP - Core engine functional with NNUE evaluation.

### completed
- Magic bitboard attack tables (bishop, rook, queen)
- Pre-computed attack tables (pawn, knight, king)
- Position representation (bitboards + board array)
- FEN parsing
- Pseudo-legal move generation (quiets and captures separated)
- Check-aware move filtering
- Make move with full support (castling, en passant, promotion)
- PERFT with 68 test positions
- Basic UCI command loop
- Alpha-beta search with PVS
- Quiescence search
- NNUE evaluation with incremental accumulator updates
- Zobrist hashing (incremental)
- Basic time control

### not yet implemented
- Transposition table
- Move ordering improvements
- Search pruning techniques

## toolchain

- clang in WSL2 Bash environment

## build

- `make` - Creates ./lozza
- `make clean` - Remove build artifacts
- `make rebuild` - Clean and rebuild

## source structure

```
src/
  main.c        - Entry point, UCI loop
  types.h       - Piece/square enums, inline helpers
  pos.h/c       - Position struct, FEN parsing, is_attacked()
  position.h/c  - position() 
  move.h/c      - Move encoding (32-bit), formatting
  nodes.h/c     - Node struct with accumulators, global search stack
  bitboard.h/c  - Attack tables, magic number generation
  movegen.h/c   - Move generation (quiets/captures)
  makemove.h/c  - Move execution with incremental accumulator updates
  search.h/c    - Alpha-beta search with PVS
  qsearch.h/c   - Quiescence search
  net.h/c       - NNUE evaluation and accumulator functions
  perft.h/c     - PERFT testing (68 positions)
  uci.h/c       - UCI protocol
  builtins.h    - popcount, bsf wrappers
  zobrist.h/c   - Zobrist hashing (incremental updates in makemove)
  bench.h/c     - Benchmark positions for search testing
  iterate.h/c   - Move iteration and sorting
  timecontrol.h/c - Time management
```

## nets

- `nets/weights.h` - Embedded NNUE weights (384 hidden layer, perspective net)

## testing

### perft (move generation correctness)
- `./lozza pt` - Run all 68 PERFT tests (~140s)
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

The net is a perspective network with two accumulators (one per side). The weights are pre-flipped so both accumulators can use the same indexing.

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

### verification
perft.c has optional verification code (toggle `if(1)` to `if(0)`) that checks incremental hash and accumulators match rebuilt values at every node.

## performance

- bitboard.c/init_attacks takes ~100ms at startup. Could write the magics to a file and claw it back by inlining.
- NNUE incremental updates are ~5x faster than rebuilding accumulators each eval.
