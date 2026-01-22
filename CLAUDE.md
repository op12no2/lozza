## overview

Lozza is a UCI chess engine written in C. This is a work-in-progress rewrite.

## status

WIP - Move generation and PERFT complete and passing all tests.

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

### not yet implemented
- Search (alpha-beta, etc.)
- Evaluation
- Time management
- Neural network integration

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
  position.h/c  - Position struct, FEN parsing, is_attacked()
  move.h/c      - Move encoding (32-bit), formatting
  nodes.h/c     - Node struct, global search stack
  bitboard.h/c  - Attack tables, magic number generation
  movegen.h/c   - Move generation (quiets/captures)
  makemove.h/c  - Move execution
  perft.h/c     - PERFT testing (65 positions)
  uci.h/c       - UCI protocol
  builtins.h    - popcount, bsf wrappers
  zobrist.h/c   - PRNG for magic generation
  bench.h/c     - Benchmark positions (unused)
```

## nets

- `nets/weights.h` - Neural network weights, currently unused

## testing

- `./lozza pt` - Run all 68 PERFT tests (~140s)
- `./lozza "pt 4"` - Run only tests with depth <= 4 (~0.1s, 25 tests)
- `./lozza "pt 5"` - Run only tests with depth <= 5 (~5s, 31 tests)
- `./lozza "p s" "f 5"` - Set startpos and run PERFT depth 5

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

## performance

- bitboard.c/init_attacks takes ~100ms at startup. Could write the magics to a file and claw it back by inlining.
