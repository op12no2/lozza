# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bash bin/build        # Build lozza.js (required after editing source files)
node test/perft.js    # Run perft test suite (505 positions, all depths)
```

## Build System

Source files are concatenated into `lozza.js` - no imports/modules. Edit source files, not lozza.js.

Build order: pos.js, node.js, gen.js, make.js, attack.js, eval.js, perft.js, exec.js, uci.js, main.js

## Architecture

Lozza is a UCI JavaScript chess engine. Runs in Node, Bun, Deno, or browser (Web Worker).

### Key Files

- **pos.js** - Position class with 0x88 board representation. sq = rank*16 + file, board[0] is a1. Pieces: WHITE=0, BLACK=8, PAWN=1..KING=6. Empty square is 0. Castling rights: RIGHTS_K=1, RIGHTS_Q=2, RIGHTS_k=4, RIGHTS_q=8.
- **node.js** - Node class for search tree. Pre-allocated array of MAX_PLY (64) nodes, each with Position and move lists.
- **gen.js** - Move generation. Move encoding and flags defined here (see below).
- **make.js** - makeMove() executes moves. RIGHTS_MASK array for castling rights updates. Uses MOVE_EXTRA_MASK to check if special handling needed.
- **attack.js** - isAttacked(pos, sq, byColor) for check detection.
- **eval.js** - evaluate(node) returns tapered eval from side-to-move perspective. evalInitOnce() builds MGW/MGB/EGW/EGB lookup tables (material + PST, per colour/piece/square).
- **perft.js** - perft(depth, ply) for move generation testing.
- **exec.js** - UCI command parsing. execString() tokenizes, execTokens() dispatches.
- **uci.js** - Multi-runtime I/O layer. Handles stdin/stdout across environments.
- **main.js** - Entry point. Exports {perft, position, nodes, genMoves, makeMove, posSet} when required as module.

### Move Encoding

Moves are 32-bit integers: `toSq | (fromSq << 8) | flags`

```
Bits 0-6:   to square
Bits 8-14:  from square
Bit 16:     MOVE_FLAG_CAPTURE
Bit 17:     MOVE_FLAG_EPMAKE (pawn double push)
Bit 18:     MOVE_FLAG_EPCAPTURE
Bit 19:     MOVE_FLAG_KCASTLE
Bit 20:     MOVE_FLAG_QCASTLE
Bit 21:     MOVE_FLAG_KING (king moved, not castling)
Bits 22-24: promotion piece (2=N, 3=B, 4=R, 5=Q) via MOVE_PROMO_MASK
```

MOVE_EXTRA_MASK combines flags that need special handling in makeMove(): EPMAKE, EPCAPTURE, KCASTLE, QCASTLE, KING, and MOVE_PROMO_MASK. These are mutually exclusive in the else-if chain.

## Coding Style

Indentation = 2 spaces.

Put else on next line:

```javascript
if (...) {
  ...
}
else {
  ...
}
```

Side-to-move is in pos.stm. Always use "nstm" as the not-side-to-move variable and assign using `pos.stm ^ BLACK`.

When creating a 0/1 index from stm or nstm, use var name "stmi" or "nstmi" and create using `>> 3`. This also works on piece values from board[sq].

stmi or nstmi can be toggled using `^ 1`.


