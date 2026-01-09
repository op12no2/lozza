# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lozza is a UCI-compliant JavaScript chess engine with NNUE (Efficiently Updatable Neural Network) evaluation. It runs both in browsers (as a Web Worker) and via Node.js for use with traditional chess UIs like Winboard, Arena, and CuteChess.

## Running Lozza

### In Node.js (for chess UIs)
```bash
node lozza.js
```

### Testing Commands (via UCI protocol)
```bash
# Run benchmark (depth 12 by default)
node lozza.js bench

# Quick benchmark without warmup
node lozza.js qb

# Run perft tests
node lozza.js pt

# Run perft at specific depth
node lozza.js "ucinewgame" "position startpos" "perft depth 5"
```

### Interactive UCI Commands
- `uci` / `u` - Initialize UCI protocol
- `ucinewgame` / `u` - Reset for new game (required before position)
- `position startpos` / `p s` - Set starting position
- `position fen <fen>` - Set position from FEN
- `go depth <n>` / `g d <n>` - Search to depth n
- `bench` - Run benchmark suite
- `pt` - Run perft test suite
- `eval` / `e` - Show NNUE evaluation
- `moves` / `m` - List legal moves
- `board` / `b` - Show current position as FEN

## Architecture

### Single-File Structure
The entire engine is in `lozza.js` (~5200 lines). The code uses folding markers (`//{{{` and `//}}}`) for organization - use a folding editor for best readability.

### Key Components

**Board Representation**: 12x12 mailbox array (`bdB`) with 8x8 playable squares embedded. Squares use 0x88-style indexing mapped via `B88` array.

**Search (`search`, `qSearch`)**: Alpha-beta with iterative deepening. Features include:
- Transposition table (TT) with configurable size
- Null move pruning (NMP)
- Late move reductions (LMR) via `LMR_LOOKUP`
- Killer moves and history heuristic
- Aspiration windows in `go()`

**NNUE Evaluation (`netEval`)**: 768→256→1 architecture with incrementally updated accumulators (`net_h1_a`, `net_h2_a`). Weights loaded from `quantised.bin`.

**Move Generation (`genMoves`, `genQMoves`)**: Generates all legal moves or quiescence moves (captures/promotions). Moves encoded as 32-bit integers with bit fields for from/to squares, piece types, and special flags.

**UCI Interface (`uciExec`)**: Parses UCI commands and routes to appropriate handlers.

### Key Data Structures
- `nodes[]` - Pre-allocated search node array (MAX_PLY=128 depth)
- `ttLo/ttHi` - Transposition table entries
- `objHistory` - History heuristic table for move ordering
- `loHash/hiHash` - Zobrist hash components for position identification

## Neural Network

The NNUE uses a simple (768,256,1) architecture:
- Input: 768 features (6 piece types × 2 colors × 64 squares)
- Hidden layer: 256 neurons with SCReLU activation
- Weights are quantized (NET_QA=255, NET_QB=64)

The accumulators are incrementally updated during make/unmake move via `netMove`, `netCapture`, `netPromote`, `netEpCapture`, `netCastle`.
