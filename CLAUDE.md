# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bash bin/build        # Build lozza.js (required after editing source files)
node test/perft.js    # Run perft test suite (759 positions, all depths)
```

## Build System

Source files are concatenated into `lozza.js` - no imports/modules. Edit source files, not lozza.js.

Build order: pos.js → node.js → gen.js → make.js → attack.js → perft.js → exec.js → uci.js → main.js

## Architecture

Lozza is a UCI JavaScript chess engine. Runs in Node, Bun, Deno, or browser (Web Worker).

### Key Files

- **pos.js** - Position class with 0x88 board representation. sq = rank*16 + file, board[0] is a1. Pieces: WHITE=0, BLACK=8, PAWN=1..KING=6. Empty square is 0.
- **node.js** - Node class for search tree. Pre-allocated array of MAX_PLY (64) nodes, each with Position and move lists.
- **gen.js** - Move generation. Moves encoded as: toSq | (fromSq << 8) | flags. Flags: MOVE_FLAG_CAPTURE (bit 16), MOVE_FLAG_EPMAKE (bit 17), MOVE_FLAG_EPCAPTURE (bit 18), promotion piece (bits 19-20).
- **make.js** - makeMove() executes moves. RIGHTS_MASK array for castling rights updates.
- **attack.js** - isAttacked(pos, sq, byColor) for check detection.
- **perft.js** - perft(depth, ply) for move generation testing.
- **exec.js** - UCI command parsing. execString() tokenizes, execTokens() dispatches.
- **uci.js** - Multi-runtime I/O layer. Handles stdin/stdout across environments.
- **main.js** - Entry point. Exports {perft, position, nodes, genMoves, makeMove, posSet} when required as module.

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

