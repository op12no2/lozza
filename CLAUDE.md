# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lozza is a UCI-compliant JavaScript chess engine with NNUE (Efficiently Updatable Neural Network) evaluation. It runs both in browsers (as a Web Worker) and via Node.js for use with traditional chess UIs like Winboard, Arena, and CuteChess.

## Building

```bash
./build.sh
```

This produces:
- `lozza.js` - Dev build (loads weights from `quantised.bin` file)
- `releases/lozza.js` - Release build (inline base64 weights, minified with bun)
- `releases/lozza-win-x64.exe` - Windows executable
- `releases/lozza-linux-x64` - Linux executable
- `releases/lozza-mac-x64` - macOS Intel executable
- `releases/lozza-mac-arm64` - macOS Apple Silicon executable

The build script runs `node lozza.js q` after each JS build to verify no syntax errors.

## Source Structure

Source files are in `src/` and concatenated by build.sh:

| File | Purpose |
|------|---------|
| constants.js | Core constants, piece values, move encoding |
| utils.js | Utility functions |
| nodes.js | Search node allocation |
| report.js | UCI info output |
| search.js | Main search, aspiration windows, MultiPV |
| qsearch.js | Quiescence search |
| perft.js | Perft testing |
| pv.js | Principal variation handling |
| net.js | NNUE weights loading and evaluation |
| board.js | Board representation arrays |
| zobrist.js | Zobrist hashing keys |
| tt.js | Transposition table |
| hash.js | Hash/TT utilities |
| position.js | Position setup from FEN |
| movegen.js | Move generation |
| makemove.js | Make/unmake move |
| attack.js | Attack detection |
| evaluate.js | Evaluation wrapper |
| see.js | Static exchange evaluation (quickSee) |
| history.js | History heuristic |
| draw.js | Draw detection |
| format.js | FEN/move formatting |
| boardcheck.js | Board validation |
| stats.js | Statistics tracking |
| fens.js | Bench/perft FEN positions |
| uci.js | UCI protocol handler |
| init.js | Initialization and entry point |

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

# Quick test for errors (used by build.sh)
node lozza.js q
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

### Board Representation
12x12 mailbox array (`bdB`) with 8x8 playable squares embedded. Squares use 0x88-style indexing mapped via `B88` array.

### Search
Alpha-beta with iterative deepening. Features include:
- Transposition table (TT) with configurable size
- Null move pruning (NMP)
- Late move reductions (LMR) via `LMR_LOOKUP`
- Killer moves and history heuristic
- Aspiration windows in `go()`
- MultiPV support (set via UCI option)

### NNUE Evaluation
768→256→1 architecture with incrementally updated accumulators (`net_h1_a`, `net_h2_a`). Weights stored in `quantised.bin` or inline as base64 in release builds.

### Move Generation
`genMoves` and `genQMoves` generate all legal moves or quiescence moves (captures/promotions). Moves encoded as 32-bit integers with bit fields for from/to squares, piece types, and special flags.

### UCI Interface
`uciExec` in uci.js parses UCI commands and routes to appropriate handlers.

## Key Data Structures
- `nodes[]` - Pre-allocated search node array (MAX_PLY=128 depth)
- `ttLo/ttHi` - Transposition table entries
- `objHistory` - History heuristic table for move ordering
- `loHash/hiHash` - Zobrist hash components for position identification

## Neural Network

The NNUE uses a simple (768,256,1) architecture:
- Input: 768 features (6 piece types x 2 colors x 64 squares)
- Hidden layer: 256 neurons with SCReLU activation
- Weights are quantized (NET_QA=255, NET_QB=64)

The accumulators are incrementally updated during make/unmake move via `netMove`, `netCapture`, `netPromote`, `netEpCapture`, `netCastle`.

## Validation

After any code changes, verify correctness:
```bash
node lozza.js qb q
```
Bench should report exactly **2002113 nodes** at depth 12.
