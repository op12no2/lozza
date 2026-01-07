# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Command

```bash
bash bin/build
```

This concatenates source files into `lozza.js`. The build output `lozza.js` is the distributable file. It is critical to remember this when editing files. i.e. import is not used etc.

Build order: pos.js → node.js → exec.js → uci.js → main.js

## Architecture

Lozza is a UCI (Universal Chess Interface) JavaScript chess engine with HCE evaluation. It can work within Node, Bun, Deno or a browser context (see uci.js).

### Key Files

- **pos.js** - Position class with 0x88 board representation. board[0] is a1, uses rank*16+file indexing. Contains piece constants (WHITE=0, BLACK=8, PAWN=1..KING=6) and castling rights. .board is 0x88. empty square is 0.
- **node.js** - Node class for search tree. Pre-allocated array of MAX_PLY (64) nodes, each with a Position and move lists. Moves are encoded as toSq | fromSq << 8 | flags.
- **exec.js** - UCI command parsing. execString() tokenizes input, execTokens() dispatches commands.
- **uci.js** - Multi-runtime I/O layer (Worker, Node, Deno, Bun). Handles read/write/quit across environments.
- **main.js** - Initialization entry point.

## Coding style

Indentation = 2 spaces.

Put else on next line. e.g.

if (...) {
  ...
}
else {
  ...
}

