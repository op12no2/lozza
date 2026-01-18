## overview

- Lozza is a UCI chess engine written by Colin Jenkins.
- The C codebase is compiled to both native binaries and WASM (via Emscripten).
- Uses NNUE-style neural network evaluation (768 -> 384)x2 -> 1 architecture.
- Unity build: `src/lozza.c` includes all other `.c` files.

## source

Source files in `src/`:

| File | Purpose |
|------|---------|
| `lozza.c` | Main entry point, includes all other files (unity build) |
| `types.c` | Constants, structs (Position, Node, TT, etc.), global data |
| `uci.c` | UCI protocol handling and command parsing |
| `search.c` | Alpha-beta search with PVS |
| `iterate.c` | Iterative deepening loop |
| `movegen.c` | Move generation |
| `make.c` | Make/unmake move logic |
| `board.c` | Board manipulation and FEN parsing |
| `net.c` | NNUE evaluation |
| `tt.c` | Transposition table |
| `history.c` | History heuristics |
| `magics.c` | Magic bitboard initialization |
| `tc.c` | Time control |
| `perft.c` | Perft testing |
| `init.c` | Initialization routines |
| `thread.c` | Threading (native only, not WASM) |
| `debug.c` | Debug utilities |
| `utils.c` | Utility functions |

## nets

- `nets/weights.h` - neural network weights embedded as C arrays.
- Architecture: (768 -> 384)x2 -> 1 (horizontally mirrored perspective net).

## build

```bash
./build.sh
```

Produces:
- `test/lozza` - native binary (clang, march=native)
- `releases/lozza.js` - WASM+JS bundle (Emscripten)
- `releases/lozza-linux` - Linux release binary (x86-64-v3)
- `releases/lozza-win.exe` - Windows binary (zig cc)
- `releases/lozza-mac-arm` - macOS ARM binary
- `releases/lozza-mac-x86` - macOS x86 binary

Requirements: clang, emcc (Emscripten), zig (for cross-compilation).

## testing

```bash
./bench.sh   # bench both native and js versions. node counts should match. 3237779
```

The bench runs a fixed set of positions at depth 9. Both native and WASM must produce identical node counts.

## SPRT testing

```bash
./sprt.sh    # runs SPRT test against previous release using cutechess
```

Requires cutechess-ob at `../chess_data/cutechess-ob` and opening book at `data/4moves_noob.epd`.

## UCI commands

Standard UCI plus these custom commands (with short aliases):

| Command | Alias | Description |
|---------|-------|-------------|
| `position startpos` | `p s` | Set starting position |
| `position fen ...` | `p f ...` | Set FEN position |
| `go depth N` | `g d N` | Search to depth N |
| `go nodes N` | `g n N` | Search N nodes |
| `go movetime N` | `g m N` | Search for N ms |
| `ucinewgame` | `u` | Reset for new game (required before first search) |
| `board` | `b` | Print board |
| `eval` | `e` | Print static eval |
| `hash` | `h` | Print hash table info |
| `net` | `n` | Print network architecture |
| `perft N` | `f N` | Run perft to depth N |
| `bench` | | Run benchmark suite |
| `pt` | | Run perft tests |
| `et` | | Run eval tests |
| `build` | | Print build version |
| `quit` | `q` | Exit |

## key constants (types.c)

- `VERSION` - engine version string
- `MAX_PLY` - maximum search depth (64)
- `TT_DEFAULT` - default hash size in MB (16)
- `NET_H1_SIZE` - hidden layer size (384)
- `NET_I_SIZE` - input layer size (768)

## code conventions

- `__EMSCRIPTEN__` macro guards WASM-specific code paths.
- Native builds use pthreads for search; WASM runs synchronously.

## move encoding (types.c)

Moves are `uint16_t` with upper 4 bits encoding the move type:

```
bits 0-5:  from square (0-63)
bits 6-11: to square (0-63)
bits 12-15: move type
```

Move types:
- `MT_NON_PAWN_PUSH` (0) - normal piece move
- `MT_PAWN_PUSH` (1) - pawn push
- `MT_CASTLE` (2) - castling
- `MT_EP_PUSH` (3) - double pawn push (sets EP square)
- `MT_PROMO_PUSH_N/B/R/Q` (4-7) - promotion pushes
- `MT_CAPTURE` (8) - normal capture
- `MT_EP_CAPTURE` (9) - en passant capture
- `MT_PAWN_CAPTURE` (10) - pawn capture
- `MT_PROMO_CAPTURE_N/B/R/Q` (12-15) - promotion captures

Lookup tables (`lut_*`) index by move type for fast classification.

## search features (search.c)

- PVS (Principal Variation Search)
- Quiescence search with SEE pruning
- Transposition table cutoffs
- Null move pruning (R=3)
- Reverse futility pruning (beta pruning)
- Futility pruning (alpha pruning)
- Late move pruning
- Late move reductions (LMR)
- Killer moves
- History heuristics
- Check extensions

## data structures

**Position** - board state (bitboards, piece array, rights, EP, hash)

**Node** - search node (position + accumulators + move list + PV)

**TT** - transposition table entry:
- `hash` (64-bit)
- `move` (16-bit)
- `flags` (EXACT/ALPHA/BETA)
- `depth`, `score`, `ev`

## workflow

1. Edit source in `src/`
2. Run `./build.sh`
3. Run `./bench.sh` - verify node count is 3237779
4. Test with UCI: `./test/lozza` or `node test/node-wrapper.js`

## debugging tips

- `board` command shows current position
- `eval` shows static evaluation
- `perft N` verifies move generation
- Remove `-DNDEBUG` from build.sh to enable asserts
- Add `-g` for debug symbols
