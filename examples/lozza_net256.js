//
// https://github.com/op12no2/lozza
//

const BUILD = "12.0";

// 1 = use the WebAssembly SIMD net kernel if the host can run it, 0 = Javascript only.
// The results are identical, the kernel is just faster. See the net fold and lozza.c.

const WASM = 1;

//{{{  constants

const BENCH_DEPTH = 12;

const INT32_MAX =  2147483647;
const INT32_MIN = -2147483648;

const UINT32_MAX = 4294967295;

const NET_QA      = 255;
const NET_QB      = 64;
const NET_QAB     = NET_QA * NET_QB;
const NET_SCALE   = 400;
const NET_I_SIZE  = 768;
const NET_H1_SIZE = 256;
const NET_O_SIZE  = 8;     // output buckets: one output layer for each 4 pieces on the board

const MATERIAL = new Int32Array([0,100,394,388,588,1207,10000]);

const MAX_PLY         = 128;
const MAX_MOVES       = 256;
const INF             = 32000;
const MATE            = 31000;
const MINMATE         = 30000;
const NODES_HARD_MULT = 20;     // go nodes n: soft limit n (between id iterations), hard limit n*20 (mid search)
const EMPTY           = 0;

const WHITE = 0x0;
const BLACK = 0x8;

const PIECE_MASK  = 0x7;
const COLOR_MASK  = 0x8;
const COLOUR_MASK = 0x8;

const TT_EMPTY = 0;
const TT_EXACT = 1;
const TT_BETA  = 2;
const TT_ALPHA = 3;

const TT_MISS = -1;  // ttGet(): the position is not in the tt

const BASE_HASH       = UINT32_MAX;
const BASE_PROMOTES   = BASE_HASH       - 1000;
const BASE_GOODTAKES  = BASE_PROMOTES   - 1000;
const BASE_EVENTAKES  = BASE_GOODTAKES  - 1000;
const BASE_EPTAKES    = BASE_EVENTAKES  - 1000;
const BASE_MATEKILLER = BASE_EPTAKES    - 1000;
const BASE_MYKILLERS  = BASE_MATEKILLER - 1000;
const BASE_GPKILLERS  = BASE_MYKILLERS  - 1000;
const BASE_CASTLING   = BASE_GPKILLERS  - 1000;
const BASE_BADTAKES   = BASE_CASTLING   - 1000;
const BASE_HISSLIDE   = (UINT32_MAX >>> 1) - 10000;
const BASE_PRUNABLE   = BASE_BADTAKES;

const MOVE_TO_BITS     = 0;
const MOVE_FR_BITS     = 8;
const MOVE_TOOBJ_BITS  = 16;
const MOVE_FROBJ_BITS  = 20;
const MOVE_PROMAS_BITS = 29;

const MOVE_TO_MASK      = 0x000000FF;
const MOVE_FR_MASK      = 0x0000FF00;
const MOVE_TOOBJ_MASK   = 0x000F0000;
const MOVE_FROBJ_MASK   = 0x00F00000;
const MOVE_LEGAL_MASK   = 0x01000000;
const MOVE_EPTAKE_MASK  = 0x02000000;
const MOVE_EPMAKE_MASK  = 0x04000000;
const MOVE_CASTLE_MASK  = 0x08000000;
const MOVE_PROMOTE_MASK = 0x10000000;
const MOVE_PROMAS_MASK  = 0x60000000;  // NBRQ

const MOVE_CLEAN_MASK   = (~MOVE_LEGAL_MASK & 0xFFFFFFFF) | 0;
const MOVE_SPECIAL_MASK = MOVE_CASTLE_MASK | MOVE_PROMOTE_MASK | MOVE_EPTAKE_MASK | MOVE_EPMAKE_MASK; // need extra work in make move
const MOVE_NOISY_MASK   = MOVE_TOOBJ_MASK | MOVE_EPTAKE_MASK;

const PAWN   = 1;
const KNIGHT = 2;
const BISHOP = 3;
const ROOK   = 4;
const QUEEN  = 5;
const KING   = 6;
const EDGE   = 7;
const NO_Z   = 8;

const W_PAWN   = PAWN;
const W_KNIGHT = KNIGHT;
const W_BISHOP = BISHOP;
const W_ROOK   = ROOK;
const W_QUEEN  = QUEEN;
const W_KING   = KING;

const B_PAWN   = PAWN   | BLACK;
const B_KNIGHT = KNIGHT | BLACK;
const B_BISHOP = BISHOP | BLACK;
const B_ROOK   = ROOK   | BLACK;
const B_QUEEN  = QUEEN  | BLACK;
const B_KING   = KING   | BLACK;

//
//                                E === EMPTY, X = OFF BOARD, - === CANNOT HAPPEN
//
//                                0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15
//                                E  W  W  W  W  W  W  X  -  B  B  B  B  B  B  -
//                                E  P  N  B  R  Q  K  X  -  P  N  B  R  Q  K  -
//

const IS_O      = new Uint8Array([0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0]);
const IS_E      = new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const IS_OE     = new Uint8Array([1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0]);

const IS_P      = new Uint8Array([0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]);
const IS_N      = new Uint8Array([0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]);
const IS_NBRQKE = new Uint8Array([1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0]);
const IS_RQKE   = new Uint8Array([1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0]);
const IS_QKE    = new Uint8Array([1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0]);
const IS_K      = new Uint8Array([0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0]);
const IS_KN     = new Uint8Array([0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]);

const IS_W      = new Uint8Array([0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const IS_WNK    = new Uint8Array([0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const IS_WE     = new Uint8Array([1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const IS_WP     = new Uint8Array([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const IS_WN     = new Uint8Array([0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const IS_WNBRQ  = new Uint8Array([0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const IS_WB     = new Uint8Array([0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const IS_WBQ    = new Uint8Array([0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const IS_WRQ    = new Uint8Array([0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const IS_WQ     = new Uint8Array([0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

const IS_B      = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0]);
const IS_BNK    = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0]);
const IS_BE     = new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0]);
const IS_BP     = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]);
const IS_BN     = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]);
const IS_BNBRQ  = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0]);
const IS_BB     = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0]);
const IS_BBQ    = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0]);
const IS_BRQ    = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0]);
const IS_BQ     = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0]);

const W_PROMOTE_SQ = new Uint8Array([0,26, 27, 28, 29, 30, 31, 32, 33]);
const B_PROMOTE_SQ = new Uint8Array([0,110,111,112,113,114,115,116,117]);

const A1 = 110, B1 = 111, C1 = 112, D1 = 113, E1 = 114, F1 = 115, G1 = 116, H1 = 117;
const A8 = 26,  B8 = 27,  C8 = 28,  D8 = 29,  E8 = 30,  F8 = 31,  G8 = 32,  H8 = 33;

const SQA1 = 110, SQB1 = 111, SQC1 = 112, SQD1 = 113, SQE1 = 114, SQF1 = 115, SQG1 = 116, SQH1 = 117;
const SQA2 = 98,  SQB2 = 99,  SQC2 = 100, SQD2 = 101, SQE2 = 102, SQF2 = 103, SQG2 = 104, SQH2 = 105;
const SQA3 = 86,  SQB3 = 87,  SQC3 = 88,  SQD3 = 89,  SQE3 = 90,  SQF3 = 91,  SQG3 = 92,  SQH3 = 93;
const SQA4 = 74,  SQB4 = 75,  SQC4 = 76,  SQD4 = 77,  SQE4 = 78,  SQF4 = 79,  SQG4 = 80,  SQH4 = 81;
const SQA5 = 62,  SQB5 = 63,  SQC5 = 64,  SQD5 = 65,  SQE5 = 66,  SQF5 = 67,  SQG5 = 68,  SQH5 = 69;
const SQA6 = 50,  SQB6 = 51,  SQC6 = 52,  SQD6 = 53,  SQE6 = 54,  SQF6 = 55,  SQG6 = 56,  SQH6 = 57;
const SQA7 = 38,  SQB7 = 39,  SQC7 = 40,  SQD7 = 41,  SQE7 = 42,  SQF7 = 43,  SQG7 = 44,  SQH7 = 45;
const SQA8 = 26,  SQB8 = 27,  SQC8 = 28,  SQD8 = 29,  SQE8 = 30,  SQF8 = 31,  SQG8 = 32,  SQH8 = 33;

const MOVE_E1G1 = MOVE_CASTLE_MASK | (W_KING << MOVE_FROBJ_BITS) | (E1 << MOVE_FR_BITS) | G1;
const MOVE_E1C1 = MOVE_CASTLE_MASK | (W_KING << MOVE_FROBJ_BITS) | (E1 << MOVE_FR_BITS) | C1;
const MOVE_E8G8 = MOVE_CASTLE_MASK | (B_KING << MOVE_FROBJ_BITS) | (E8 << MOVE_FR_BITS) | G8;
const MOVE_E8C8 = MOVE_CASTLE_MASK | (B_KING << MOVE_FROBJ_BITS) | (E8 << MOVE_FR_BITS) | C8;

const QPRO = (QUEEN-2)  << MOVE_PROMAS_BITS | MOVE_PROMOTE_MASK;
const RPRO = (ROOK-2)   << MOVE_PROMAS_BITS | MOVE_PROMOTE_MASK;
const BPRO = (BISHOP-2) << MOVE_PROMAS_BITS | MOVE_PROMOTE_MASK;
const NPRO = (KNIGHT-2) << MOVE_PROMAS_BITS | MOVE_PROMOTE_MASK;

const WHITE_RIGHTS_KING  = 0x00000001;
const WHITE_RIGHTS_QUEEN = 0x00000002;
const BLACK_RIGHTS_KING  = 0x00000004;
const BLACK_RIGHTS_QUEEN = 0x00000008;
const WHITE_RIGHTS       = WHITE_RIGHTS_QUEEN | WHITE_RIGHTS_KING;
const BLACK_RIGHTS       = BLACK_RIGHTS_QUEEN | BLACK_RIGHTS_KING;

const MASK_RIGHTS = new Int8Array([
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, ~8, 15, 15, 15, ~12,15, 15, ~4, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, ~2, 15, 15, 15, ~3, 15, 15, ~1, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15
]);

const RANK_VECTOR = new Uint8Array([0,1,2,2,4,5,6]);  // for move sorting

const B88 = new Uint8Array([
  26, 27, 28, 29, 30, 31, 32, 33,
  38, 39, 40, 41, 42, 43, 44, 45,
  50, 51, 52, 53, 54, 55, 56, 57,
  62, 63, 64, 65, 66, 67, 68, 69,
  74, 75, 76, 77, 78, 79, 80, 81,
  86, 87, 88, 89, 90, 91, 92, 93,
  98, 99, 100,101,102,103,104,105,
  110,111,112,113,114,115,116,117
]);

const COORDS = [
  '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??',
  '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??',
  '??', '??', 'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8', '??', '??',
  '??', '??', 'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7', '??', '??',
  '??', '??', 'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6', '??', '??',
  '??', '??', 'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5', '??', '??',
  '??', '??', 'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4', '??', '??',
  '??', '??', 'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', '??', '??',
  '??', '??', 'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2', '??', '??',
  '??', '??', 'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1', '??', '??',
  '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??',
  '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??', '??'
];

const NAMES    = ['-','P','N','B','R','Q','K','-'];
const PROMOTES = ['n','b','r','q'];                  // 0-3 encoded in move

const RANK = new Uint8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 8, 8, 8, 8, 8, 8, 8, 8, 0, 0,
  0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 0, 0,
  0, 0, 6, 6, 6, 6, 6, 6, 6, 6, 0, 0,
  0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0,
  0, 0, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0,
  0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0,
  0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0,
  0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]);

const FILE = new Uint8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
  0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
  0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
  0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
  0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
  0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
  0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
  0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

const NULL144 = new Uint8Array(144);

const MAP = Object.seal({
  'p': B_PAWN,
  'n': B_KNIGHT,
  'b': B_BISHOP,
  'r': B_ROOK,
  'q': B_QUEEN,
  'k': B_KING,
  'P': W_PAWN,
  'N': W_KNIGHT,
  'B': W_BISHOP,
  'R': W_ROOK,
  'Q': W_QUEEN,
  'K': W_KING
});

const UMAP = Object.seal({
  9:  'p',
  10: 'n',
  11: 'b',
  12: 'r',
  13: 'q',
  14: 'k',
  1:  'P',
  2:  'N',
  3:  'B',
  4:  'R',
  5:  'Q',
  6:  'K'
});

const RANK2W = new Uint8Array([
  0, 0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,
  0, 0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,
  0, 0, 7, 14, 21, 28, 28, 21, 14, 7, 0, 0,
  0, 0, 6, 12, 18, 24, 24, 18, 12, 6, 0, 0,
  0, 0, 5, 10, 15, 20, 20, 15, 10, 5, 0, 0,
  0, 0, 4, 8,  12, 16, 16, 12, 8,  4, 0, 0,
  0, 0, 3, 6,  9,  12, 12, 9,  6,  3, 0, 0,
  0, 0, 2, 4,  6,  8,  8,  6,  4,  2, 0, 0,
  0, 0, 1, 2,  3,  4,  4,  3,  2,  1, 0, 0,
  0, 0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,
  0, 0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,
  0, 0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0
]);

const RANK2B = new Uint8Array([
  0, 0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,
  0, 0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,
  0, 0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,
  0, 0, 1, 2,  3,  4,  4,  3,  2,  1, 0, 0,
  0, 0, 2, 4,  6,  8,  8,  6,  4,  2, 0, 0,
  0, 0, 3, 6,  9,  12, 12, 9,  6,  3, 0, 0,
  0, 0, 4, 8,  12, 16, 16, 12, 8,  4, 0, 0,
  0, 0, 5, 10, 15, 20, 20, 15, 10, 5, 0, 0,
  0, 0, 6, 12, 18, 24, 24, 18, 12, 6, 0, 0,
  0, 0, 7, 14, 21, 28, 28, 21, 14, 7, 0, 0,
  0, 0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,
  0, 0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0
]);

const CENTRE = new Uint8Array([
  0, 0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,
  0, 0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,
  0, 0, 1, 2,  3,  4,  4,  3,  2,  1, 0, 0,
  0, 0, 2, 4,  6,  8,  8,  6,  4,  2, 0, 0,
  0, 0, 3, 6,  9,  12, 12, 9,  6,  3, 0, 0,
  0, 0, 4, 8,  12, 16, 16, 12, 8,  4, 0, 0,
  0, 0, 4, 8,  12, 16, 16, 12, 8,  4, 0, 0,
  0, 0, 3, 6,  9,  12, 12, 9,  6,  3, 0, 0,
  0, 0, 2, 4,  6,  8,  8,  6,  4,  2, 0, 0,
  0, 0, 1, 2,  3,  4,  4,  3,  2,  1, 0, 0,
  0, 0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,
  0, 0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0
]);

const SLIDE_SCORES = [
  NULL144,
  RANK2W, CENTRE, CENTRE, CENTRE, CENTRE, CENTRE,
  NULL144,
  NULL144,
  RANK2B, CENTRE, CENTRE, CENTRE, CENTRE, CENTRE
];

//}}}
//{{{  utils

function seal (o) {
  Object.seal(o);
}

function myround(x) {
  return Math.sign(x) * Math.round(Math.abs(x));
}

function now() {
  return performance.now() | 0;
}

//}}}
//{{{  prng
//
// https://en.wikipedia.org/wiki/Mersenne_Twister
//

let twisterList  = new Uint32Array(624);
let twisterIndex = 0;

//{{{  twisterInit

function twisterInit(seed) {

  const mt = twisterList;

  mt[0] = seed >>> 0;

  for (let i = 1; i < 624; i++) {
    mt[i] = (Math.imul(0x6C078965, mt[i - 1] ^ (mt[i - 1] >>> 30)) + i) >>> 0;
  }
}

//}}}
//{{{  twisterFill

function twisterFill() {

  const mt = twisterList;

  for (let i = 0; i < 624; i++) {
    let y = (mt[i] & 0x80000000) + (mt[(i + 1) % 624] & 0x7FFFFFFF);
    mt[i] = mt[(i + 397) % 624] ^ (y >>> 1);
    if (y % 2 !== 0) {
      mt[i] ^= 0x9908B0DF;
    }
  }
}

//}}}
//{{{  twisterRand

function twisterRand() {

  const mt = twisterList;

  if (twisterIndex === 0)
    twisterFill();

  let y = mt[twisterIndex];
  y ^= y >>> 11;
  y ^= (y << 7)  & 0x9D2C5680;
  y ^= (y << 15) & 0xEFC60000;
  y ^= y >>> 18;

  twisterIndex = (twisterIndex + 1) % 624;

  return y >>> 0;
}

//}}}

//{{{  initPrng

function initPrng () {

  twisterInit(0x9E3779B9);

}

//}}}
//}}}
//{{{  net

const NET_WEIGHTS_FILE = '/home/xyzzy/lozza/nets/net256/lozza-200/quantised.bin';  // ignore - only relevant for dev version

const IMAP = new Uint32Array(15 * 256);  // piece+colour -> offset into the flat weights, see initNet()

// The net is held in 16 bit arrays; the trainer clips the weights so that nothing
// overflows (see lozza.rs and netCheck()). The accumulator updates and the output
// layer can be done by a small WebAssembly SIMD kernel (lozza.c, embedded as getWasm()
// at the bottom of the file, switched on by WASM at the top). When the kernel is in
// use these arrays are views of its memory, so the kernel and the Javascript here work
// on the same bytes and nothing is copied; otherwise they are ordinary arrays. The
// Javascript loops below do exactly what the kernel does and are used when it is off
// or the host cannot run it. They are also what the native binaries are made from
// (tools/lozza2c), where 16 bits lets the compiler work on 16 values at a time.

const net_kernel = netKernel();  // the kernel's exports, or null if using Javascript only

const net_h1_w_flat = netArray('net_h1_w', NET_I_SIZE * NET_H1_SIZE);  // us
const net_h2_w_flat = netArray('net_h2_w', NET_I_SIZE * NET_H1_SIZE);  // them
const net_h1_b      = netArray('net_h1_b', NET_H1_SIZE);
const net_o_w       = netArray('net_o_w',  NET_O_SIZE * NET_H1_SIZE * 2);  // each bucket is an us half then a them half
const net_o_b       = new Int32Array(NET_O_SIZE);

// Each node owns the accumulators for its position. They all live in net_acc, one flat
// array so that v8 sees a constant base: node.acc1 is the offset of the us accumulator
// and node.acc2 the them accumulator (see initNodes()). makeMoveA() records what changed
// in the child node (ueType, ueArgs*) and marks it dirty. Nothing is computed until
// netEval() needs it; netRefresh() then walks up to the nearest clean ancestor and
// applies the recorded updates downwards, child = parent + delta.

const net_acc = netArray('net_acc', MAX_PLY * 2 * NET_H1_SIZE);

const UE_MOVE      = 1;
const UE_CAPTURE   = 2;
const UE_PROMOTE   = 3;
const UE_EPCAPTURE = 4;
const UE_CASTLE    = 5;
const UE_COPY      = 6;  // null move

//{{{  netKernel
//
// Compile and start the wasm kernel. Returns its exports (the functions net_move,
// net_capture, net_castle and net_eval, its memory, and the addresses of its arrays),
// or null if it is switched off, the host has no WebAssembly SIMD, or it was built
// for different net sizes.
//

function netKernel () {

  if (!WASM || typeof WebAssembly === 'undefined')
    return null;

  try {

    const module = new WebAssembly.Module(b64Decode(getWasm()));  // throws if the host cannot run it
    const kernel = new WebAssembly.Instance(module).exports;

    if (!kernel.net_sizes_ok(NET_I_SIZE, NET_H1_SIZE, NET_O_SIZE, MAX_PLY))
      return null;

    return kernel;

  }

  catch (e) {
    return null;
  }

}

//}}}
//{{{  netArray
//
// A 16 bit array of the net. name is the name of the array in lozza.c; with the
// kernel in use the result is a view of that array in the kernel's memory.
//

function netArray (name, length) {

  if (net_kernel !== null)
    return new Int16Array(net_kernel.memory.buffer, net_kernel[name].value, length);

  return new Int16Array(length);

}

//}}}
//{{{  getWeightsBuffer()

function getWeightsBuffer() {

  const weightsB64 = getWeights();  // '' in the dev version, embedded at release time

  if (weightsB64 === '')
    return fs.readFileSync(NET_WEIGHTS_FILE);

  return b64Decode(weightsB64);

}

//}}}
//{{{  b64Decode
//
// base64 string to bytes, used for the embedded weights and the wasm kernel.
//

function b64Decode (str) {

  const b64 = str.replace(/\s+/g, "");

  if (typeof Buffer !== 'undefined' && Buffer.from) {
    // node
    return Buffer.from(b64, 'base64');
  }

  if (typeof atob !== 'undefined') {
    // browser
    const binStr = atob(b64);
    const n = binStr.length;
    const bytes = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return bytes;
  }

  // bare v8 (the standalone binary): decode by hand

  const T = new Uint8Array(128);
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  for (let i=0; i < 64; i++)
    T[A.charCodeAt(i)] = i;

  let len = b64.length;

  while (len > 0 && b64[len-1] === '=')
    len--;

  const bytes = new Uint8Array((len * 3) >>> 2);

  let o    = 0;
  let acc  = 0;
  let bits = 0;

  for (let i=0; i < len; i++) {
    acc  = ((acc << 6) | T[b64.charCodeAt(i)]) & 0xFFFF;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[o++] = (acc >>> bits) & 0xFF;
    }
  }

  return bytes;

}

//}}}
//{{{  netLoad

function netLoad () {

  let offset = 0;

  const buffer = getWeightsBuffer();

  const dataView = new Int16Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength >> 1
  );

  for (let i = 0; i < NET_I_SIZE; i++) {
    const lozIndex = bullet2lozza(i);
    const h = i * NET_H1_SIZE;
    for (let j = 0; j < NET_H1_SIZE; j++) {
      net_h1_w_flat[lozIndex            * NET_H1_SIZE + j] = dataView[h + j];  // us
      net_h2_w_flat[flipIndex(lozIndex) * NET_H1_SIZE + j] = dataView[h + j];  // them
    }
  }

  offset += NET_I_SIZE * NET_H1_SIZE;
  for (let i = 0; i < NET_H1_SIZE; i++) {
    net_h1_b[i] = dataView[offset + i];
  }

  offset += NET_H1_SIZE;
  for (let i = 0; i < NET_O_SIZE * NET_H1_SIZE * 2; i++) {
    net_o_w[i] = dataView[offset + i];
  }

  offset += NET_O_SIZE * NET_H1_SIZE * 2;
  for (let i = 0; i < NET_O_SIZE; i++) {
    net_o_b[i] = dataView[offset + i];
  }

  netCheck();

}

//}}}
//{{{  netCheck
//
// The 16 bit arithmetic depends on the size of the weights, which the trainer clips
// (see lozza.rs). Check that this net is inside the limits.
//

function netCheck () {

  let maxW = 0;
  let maxB = 0;
  let maxO = 0;

  for (let i=0; i < net_h1_w_flat.length; i++)
    maxW = Math.max(maxW, Math.abs(net_h1_w_flat[i]));

  for (let i=0; i < net_h1_b.length; i++)
    maxB = Math.max(maxB, Math.abs(net_h1_b[i]));

  for (let i=0; i < net_o_w.length; i++)
    maxO = Math.max(maxO, Math.abs(net_o_w[i]));

  // an accumulator is the bias plus one weight for each of up to 32 pieces

  if (maxB + 32 * maxW > 32767)
    uciSend('info string net weights are too big for 16 bit accumulators');

  // netEvalSum() and the kernel multiply a clamped accumulator value (up to QA) by an
  // output weight in 16 bits

  if (NET_QA * maxO > 32767)
    uciSend('info string net output weights are too big for 16 bit arithmetic');

}

//}}}
//{{{  flipIndex
//
// flipIndex
//
// Slow. Only use during init.
//

function flipIndex (index) {

  const piece         = (index / 64) | 0;
  const square        = index % 64;
  const flippedSquare = square ^ 56;
  const flippedPiece  = (piece + 6) % 12;
  const flippedIndex  = flippedPiece * 64 + flippedSquare;

  return flippedIndex;

}

//}}}
//{{{  bullet2lozza
//
// bullet index 0 is a1. Lozza index 0 is a8.
// The piece order is the same.
// Apply this when loading the weights from the bullet .bin file.
//
// Slow. Only use during init.
//

function bullet2lozza (index) {

  const piece        = (index / 64) | 0;
  const bulletSquare = index % 64;
  const lozzaSquare  = bulletSquare ^ 56;          // map a1 to a8 etc
  const lozzaIndex   = piece * 64 + lozzaSquare;

  return lozzaIndex;

}

//}}}

//{{{  netEval

function netEval(node, turn) {

  if (node.accDirty !== 0)
    netRefresh(node);

  // The net has NET_O_SIZE output layers (buckets) and the number of pieces on the
  // board, kings included, picks the one to use: 2-5 pieces is bucket 0, 6-9 is
  // bucket 1 and so on up to 30-32, bucket 7. Same as MaterialCount in lozza.rs.

  const bucket = (wCount + bCount - 2) >> 2;

  if (turn === WHITE)
    return netEval2(node.acc1, node.acc2, bucket);
  else
    return netEval2(node.acc2, node.acc1, bucket);

}

function netEval2(o1, o2, bucket) {

  const ow = Math.imul(bucket, NET_H1_SIZE * 2) | 0;  // where this bucket's weights start in net_o_w

  let e = (net_kernel !== null) ? net_kernel.net_eval(o1, o2, ow) : netEvalSum(o1, o2, ow);

  e = (e / NET_QA) | 0;
  e = (e + (net_o_b[bucket] | 0)) | 0;
  e = Math.imul(e, NET_SCALE | 0) | 0;
  e = (e / NET_QAB) | 0;

  return e | 0;

}

// The output layer: the sum of w * y * y over both accumulators, the side to move's
// (at o1) first, where y is the accumulator value clamped to 0..QA (SCReLU) and the
// output weights w start at ow in net_o_w. net_eval() in lozza.c is the same thing.

function netEvalSum(o1, o2, ow) {

  const w  = net_o_w;
  const a  = net_acc;
  const N  = (ow + NET_H1_SIZE) | 0;

  let e  = 0 | 0;
  let p1 = ow | 0;
  let p2 = N | 0;
  let i1 = o1 | 0;
  let i2 = o2 | 0;

  while (p1 < N) {

    const x1 = a[i1] | 0;
    const x2 = a[i2] | 0;
    i1++; i2++;

    // y = clamp(x, 0, QA) without branches, which is much the fastest way in v8:
    // r is x with negatives set to 0, then anything over QA is brought down to QA

    const r1 = x1 & ~(x1 >> 31);
    const r2 = x2 & ~(x2 >> 31);
    const d1 = (r1 - NET_QA) | 0;
    const d2 = (r2 - NET_QA) | 0;
    const y1 = (r1 - (d1 & ~(d1 >> 31))) | 0;  // @i16
    const y2 = (r2 - (d2 & ~(d2 >> 31))) | 0;  // @i16

    // w * y * y in two steps. t = w * y fits in 16 bits because the trainer clips w
    // (see netCheck()), and the << 16 >> 16 says so: it changes nothing here, but it
    // and the @i16 clues let the native build (tools/lozza2c) do this loop in 16 bit
    // SIMD, 16 values at a time, which is worth about a third more speed.

    const t1 = (Math.imul(w[p1], y1) << 16) >> 16;  // @i16
    const t2 = (Math.imul(w[p2], y2) << 16) >> 16;  // @i16

    e = (e + Math.imul(t1, y1) + Math.imul(t2, y2)) | 0;

    p1++; p2++;

  }

  return e | 0;

}

//}}}

//{{{  netRefresh
//
// Bring node's accumulators up to date. The parent must be clean first; the
// root is always clean after position(), so the walk up always terminates.
//

function netRefresh (node) {

  const parent = node.parentNode;

  if (parent.accDirty !== 0)
    netRefresh(parent);

  switch (node.ueType) {
    case UE_MOVE: {
      netMove(parent, node);
      break;
    }
    case UE_CAPTURE: {
      netCapture(parent, node);
      break;
    }
    case UE_PROMOTE: {
      netPromote(parent, node);
      break;
    }
    case UE_EPCAPTURE: {
      netEpCapture(parent, node);
      break;
    }
    case UE_CASTLE: {
      netCastle(parent, node);
      break;
    }
    case UE_COPY: {
      netCopy(parent, node);
      break;
    }
  }

  node.accDirty = 0;

}

//}}}
//{{{  netCopy

function netCopy (parent, node) {

  const N = NET_H1_SIZE | 0;

  net_acc.set(net_acc.subarray(parent.acc1, parent.acc1 + N + N), node.acc1);

}

//}}}
//{{{  netMove

function netMove (parent, node) {

  const frObj = node.ueArgs0 << 8;
  const from  = node.ueArgs1 | 0;
  const to    = node.ueArgs2 | 0;

  const map = IMAP;
  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const a   = net_acc;
  let   c1  = node.acc1   | 0, c2 = node.acc2   | 0;
  let   q1  = parent.acc1 | 0, q2 = parent.acc2 | 0;

  const e1 = c1 + NET_H1_SIZE | 0;

  let p1 = map[frObj + from] | 0;
  let p2 = map[frObj + to]   | 0;

  if (net_kernel !== null) {
    net_kernel.net_move(c1, q1, p1, p2);
    return;
  }

  while (c1 < e1) {
    a[c1] = a[q1] + h1w[p2] - h1w[p1];
    a[c2] = a[q2] + h2w[p2] - h2w[p1];
    c1++; c2++; q1++; q2++; p1++; p2++;
  }

}

//}}}
//{{{  netCapture

function netCapture (parent, node) {

  const frObj = node.ueArgs0 << 8;
  const fr    = node.ueArgs1 | 0;
  const toObj = node.ueArgs2 << 8;
  const to    = node.ueArgs3 | 0;

  const map = IMAP;
  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const a   = net_acc;
  let   c1  = node.acc1   | 0, c2 = node.acc2   | 0;
  let   q1  = parent.acc1 | 0, q2 = parent.acc2 | 0;

  const e1 = c1 + NET_H1_SIZE | 0;

  let p1 = map[frObj + fr] | 0;
  let p2 = map[toObj + to] | 0;
  let p3 = map[frObj + to] | 0;

  if (net_kernel !== null) {
    net_kernel.net_capture(c1, q1, p1, p2, p3);
    return;
  }

  while (c1 < e1) {
    a[c1] = a[q1] + h1w[p3] - h1w[p2] - h1w[p1];
    a[c2] = a[q2] + h2w[p3] - h2w[p2] - h2w[p1];
    c1++; c2++; q1++; q2++; p1++; p2++; p3++;
  }

}

//}}}
//{{{  netPromote

function netPromote (parent, node) {

  const pawnObj    = node.ueArgs0 << 8;
  const pawnFr     = node.ueArgs1 | 0;
  const pawnTo     = node.ueArgs2 | 0;
  const captureObj = node.ueArgs3 << 8;
  const promoteObj = node.ueArgs4 << 8;

  const map = IMAP;
  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const a   = net_acc;
  let   c1  = node.acc1   | 0, c2 = node.acc2   | 0;
  let   q1  = parent.acc1 | 0, q2 = parent.acc2 | 0;

  const e1 = c1 + NET_H1_SIZE | 0;

  let p1 = map[pawnObj    + pawnFr] | 0;
  let p2 = map[promoteObj + pawnTo] | 0;

  if (net_kernel !== null) {
    if (captureObj !== 0)
      net_kernel.net_capture(c1, q1, p1, map[captureObj + pawnTo] | 0, p2);
    else
      net_kernel.net_move(c1, q1, p1, p2);
    return;
  }

  if (captureObj !== 0) {
    let p3 = map[captureObj + pawnTo] | 0;
    while (c1 < e1) {
      a[c1] = a[q1] + h1w[p2] - h1w[p1] - h1w[p3];
      a[c2] = a[q2] + h2w[p2] - h2w[p1] - h2w[p3];
      c1++; c2++; q1++; q2++; p1++; p2++; p3++;
    }
  }
  else {
    while (c1 < e1) {
      a[c1] = a[q1] + h1w[p2] - h1w[p1];
      a[c2] = a[q2] + h2w[p2] - h2w[p1];
      c1++; c2++; q1++; q2++; p1++; p2++;
    }
  }

}

//}}}
//{{{  netEpCapture

function netEpCapture (parent, node) {

  const pawnObj        = node.ueArgs0 << 8;
  const pawnFr         = node.ueArgs1 | 0;
  const pawnTo         = node.ueArgs2 | 0;
  const pawnCaptureObj = node.ueArgs3 << 8;
  const ep             = node.ueArgs4 | 0;

  const map = IMAP;
  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const a   = net_acc;
  let   c1  = node.acc1   | 0, c2 = node.acc2   | 0;
  let   q1  = parent.acc1 | 0, q2 = parent.acc2 | 0;

  const e1 = c1 + NET_H1_SIZE | 0;

  let p1 = map[pawnObj        + pawnFr] | 0;
  let p2 = map[pawnObj        + pawnTo] | 0;
  let p3 = map[pawnCaptureObj + ep] | 0;

  if (net_kernel !== null) {
    net_kernel.net_capture(c1, q1, p1, p3, p2);
    return;
  }

  while (c1 < e1) {
    a[c1] = a[q1] + h1w[p2] - h1w[p1] - h1w[p3];
    a[c2] = a[q2] + h2w[p2] - h2w[p1] - h2w[p3];
    c1++; c2++; q1++; q2++; p1++; p2++; p3++;
  }

}

//}}}
//{{{  netCastle

function netCastle (parent, node) {

  const kingObj = node.ueArgs0 << 8;
  const kingFr  = node.ueArgs1 | 0;
  const kingTo  = node.ueArgs2 | 0;
  const rookObj = node.ueArgs3 << 8;
  const rookFr  = node.ueArgs4 | 0;
  const rookTo  = node.ueArgs5 | 0;

  const map = IMAP;
  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const a   = net_acc;
  let   c1  = node.acc1   | 0, c2 = node.acc2   | 0;
  let   q1  = parent.acc1 | 0, q2 = parent.acc2 | 0;

  const e1 = c1 + NET_H1_SIZE | 0;

  let p1 = map[kingObj + kingFr] | 0;
  let p2 = map[kingObj + kingTo] | 0;
  let p3 = map[rookObj + rookFr] | 0;
  let p4 = map[rookObj + rookTo] | 0;

  if (net_kernel !== null) {
    net_kernel.net_castle(c1, q1, p1, p2, p3, p4);
    return;
  }

  while (c1 < e1) {
    a[c1] = a[q1] + h1w[p2] - h1w[p1] + h1w[p4] - h1w[p3];
    a[c2] = a[q2] + h2w[p2] - h2w[p1] + h2w[p4] - h2w[p3];
    c1++; c2++; q1++; q2++; p1++; p2++; p3++; p4++;
  }

}

//}}}

//{{{  initNet

function initNet () {

  // IMAP is used to map a piece+colour to an offset in the flat weights array.
  // Used when updating the accumulators.

  for (let i = 0; i < 64; i++) {

    const j = B88[i];

    IMAP[(W_PAWN << 8) + j]    =   (0 + (PAWN-1)   * 64 + i) * NET_H1_SIZE;
    IMAP[(W_KNIGHT << 8) + j]  =   (0 + (KNIGHT-1) * 64 + i) * NET_H1_SIZE;
    IMAP[(W_BISHOP << 8) + j]  =   (0 + (BISHOP-1) * 64 + i) * NET_H1_SIZE;
    IMAP[(W_ROOK << 8) + j]    =   (0 + (ROOK-1)   * 64 + i) * NET_H1_SIZE;
    IMAP[(W_QUEEN << 8) + j]   =   (0 + (QUEEN-1)  * 64 + i) * NET_H1_SIZE;
    IMAP[(W_KING << 8) + j]    =   (0 + (KING-1)   * 64 + i) * NET_H1_SIZE;

    IMAP[(B_PAWN << 8) + j]    = (384 + (PAWN-1)   * 64 + i) * NET_H1_SIZE;
    IMAP[(B_KNIGHT << 8) + j]  = (384 + (KNIGHT-1) * 64 + i) * NET_H1_SIZE;
    IMAP[(B_BISHOP << 8) + j]  = (384 + (BISHOP-1) * 64 + i) * NET_H1_SIZE;
    IMAP[(B_ROOK << 8) + j]    = (384 + (ROOK-1)   * 64 + i) * NET_H1_SIZE;
    IMAP[(B_QUEEN << 8) + j]   = (384 + (QUEEN-1)  * 64 + i) * NET_H1_SIZE;
    IMAP[(B_KING << 8) + j]    = (384 + (KING-1)   * 64 + i) * NET_H1_SIZE;

  }

  netLoad();

}

//}}}

//}}}
//{{{  board

const bdB = new Uint8Array(144);    // pieces
const bdZ = new Uint8Array(144);    // pointers to w|bList

let bdTurn   = 0;
let bdRights = 0;
let bdEp     = 0;

const wList = new Uint8Array(16);
const bList = new Uint8Array(16);

const wbList = [wList, bList];

const wCounts = new Uint8Array(7);
const bCounts = new Uint8Array(7);

let wCount = 0;
let bCount = 0;

let loHash = 0;
let hiHash = 0;

let repLo = 0;
let repHi = 0;

const repLoHash = new Int32Array(1024);
const repHiHash = new Int32Array(1024);

const ADJACENT = new Uint8Array(144);  // see initBoard()
const ALIGNED  = Array.from({length: 144}, () => new Int8Array(144));  // see initBoard()

//{{{  zobrist
//
// Populated by initBoard().
//

let loTurn = 0;
let hiTurn = 0;

const loObjPieces = new Int32Array(15 * 256);
const hiObjPieces = new Int32Array(15 * 256);

const loRights = new Int32Array(16);
const hiRights = new Int32Array(16);

const loEP = new Int32Array(144);
const hiEP = new Int32Array(144);

//}}}

//{{{  position

function position (bd, turn, rights, ep, moves) {  // @types bd:str turn:str rights:str ep:str moves:strarr

  for (let i=0; i < nodes.length; i++)
    initNode(nodes[i]);

  loHash = 0;
  hiHash = 0;

  //{{{  turn

  if (turn == 'w')
    bdTurn = WHITE;

  else {
    bdTurn = BLACK;
    loHash ^= loTurn;
    hiHash ^= hiTurn;
  }
  //}}}
  //{{{  rights

  bdRights = 0;

  for (let i=0; i < rights.length; i++) {

    var ch = rights.charAt(i);

    if (ch == 'K') bdRights |= WHITE_RIGHTS_KING;
    if (ch == 'Q') bdRights |= WHITE_RIGHTS_QUEEN;
    if (ch == 'k') bdRights |= BLACK_RIGHTS_KING;
    if (ch == 'q') bdRights |= BLACK_RIGHTS_QUEEN;
  }

  loHash ^= loRights[bdRights];
  hiHash ^= hiRights[bdRights];

  //}}}
  //{{{  board
  bdB.fill(EDGE);

  for (var i=0; i < B88.length; i++)
    bdB[B88[i]] = 0;

  bdZ.fill(NO_Z);

  wCounts.fill(0);
  bCounts.fill(0);

  wList.fill(EMPTY);
  bList.fill(EMPTY);

  wCount = 1;
  bCount = 1;

  let sq = 0;

  for (let j=0; j < bd.length; j++) {

    const ch  = bd.charAt(j);
    const chn = bd.charCodeAt(j) - 48;  // '1'-'8' -> 1-8, anything else is out of range

    while (bdB[sq] === EDGE)
      sq++;

    if (chn < 1 || chn > 8) {

      if (ch != '/') {

        const obj   = MAP[ch];
        const piece = obj & PIECE_MASK;
        const col   = obj & COLOR_MASK;

        bdB[sq] = obj;

        if (col === WHITE) {
          if (piece === KING) {
            wList[0] = sq;
            bdZ[sq] = 0;
            wCounts[KING]++;
          }
          else {
            wList[wCount] = sq;
            bdZ[sq] = wCount;
            wCounts[piece]++;
            wCount++;
          }
        }

        else {
          if (piece === KING) {
            bList[0] = sq;
            bdZ[sq] = 0;
            bCounts[KING]++;
          }
          else {
            bList[bCount] = sq;
            bdZ[sq] = bCount;
            bCounts[piece]++;
            bCount++;
          }
        }

        loHash ^= loObjPieces[(obj << 8) + sq];
        hiHash ^= hiObjPieces[(obj << 8) + sq];

        sq++;
      }
    }

    else {

      for (let k=0; k < chn; k++) {
        bdB[sq] = 0;
        sq++;
      }
    }

  }

  //}}}
  //{{{  ep
  if (ep.length === 2)
    bdEp = COORDS.indexOf(ep)
  else
    bdEp = 0;

  loHash ^= loEP[bdEp];
  hiHash ^= hiEP[bdEp];
  //}}}

  repLo = 0;
  repHi = 0;

  //{{{  play moves
  for (let i=0; i < moves.length; i++) {
    // play move

    const moveStr = moves[i];

    let move = 0;

    genMoves(rootNode, bdTurn);

    while ((move = getNextMove(rootNode)) !== 0) {

      const moveStr2 = formatMove(move);

      if (moveStr == moveStr2) {
        makeMoveA(rootNode, move);
        bdTurn ^= COLOR_MASK;
        break;
      }

    }

    if (repHi >= 640) {
      // long game: keep the last 128 plies so the rep stack cannot overflow. anything older
      // is either before an irreversible move or already a 50 move draw, so isDraw() is unaffected
      const keepFrom = Math.max(repLo, repHi - 128);
      for (let k=keepFrom; k < repHi; k++) {
        repLoHash[k-keepFrom] = repLoHash[k];
        repHiHash[k-keepFrom] = repHiHash[k];
      }
      repHi -= keepFrom;
      repLo  = Math.max(0, repLo - keepFrom);
    }

  }
  //}}}
  //{{{  compact lists
  const wList2 = new Uint8Array(16);
  const bList2 = new Uint8Array(16);

  let next = 0;

  for (let i=0; i < 16; i++) {
    const sq = wList[i];
    if (sq) {
      bdZ[sq] = next;
      wList2[next++] = sq;
    }
  }

  wList.set(wList2);

  next = 0;

  for (let i=0; i < 16; i++) {
    const sq = bList[i];
    if (sq) {
      bdZ[sq] = next;
      bList2[next++] = sq;
    }
  }

  bList.set(bList2);

  //}}}
  //{{{  update accumulators

  const a  = net_acc;
  const o1 = rootNode.acc1;
  const o2 = rootNode.acc2;

  a.set(net_h1_b, o1);
  a.set(net_h1_b, o2);

  for (let sq=0; sq < 64; sq++) {

    const fr    = B88[sq];
    const frObj = bdB[fr];

    if (frObj === 0)
      continue;

    const off1 = IMAP[(frObj << 8) + fr];

    for (let h=0; h < NET_H1_SIZE; h++) {
      const idx1 = off1 + h;
      a[o1 + h] += net_h1_w_flat[idx1];
      a[o2 + h] += net_h2_w_flat[idx1];
    }

  }

  rootNode.accDirty = 0;

  //}}}

  initNode(rootNode);

  objHistory.fill(0);

}

//}}}
//{{{  isAttacked

function isKingAttacked (byCol) {

  const list = wbList[(byCol ^ COLOUR_MASK) >>> 3];

  return isAttacked(list[0], byCol);

}

function isAttacked (to, byCol) {

  const b = bdB;

  let fr;

  // colour stuff

  if (byCol === WHITE) {

    if (b[to+13] === W_PAWN || b[to+11] === W_PAWN)
      return 1;

    var RQ = IS_WRQ;
    var BQ = IS_WBQ;
  }

  else {

    if (b[to-13] === B_PAWN || b[to-11] === B_PAWN)
      return 1;

    var RQ = IS_BRQ;
    var BQ = IS_BBQ;
  }

  const knight = KNIGHT | byCol;
  const king   = KING   | byCol;

  // knights

  if (b[to + -10] === knight) return 1;
  if (b[to + -23] === knight) return 1;
  if (b[to + -14] === knight) return 1;
  if (b[to + -25] === knight) return 1;
  if (b[to +  10] === knight) return 1;
  if (b[to +  23] === knight) return 1;
  if (b[to +  14] === knight) return 1;
  if (b[to +  25] === knight) return 1;

  // queen, bishop, rook

  fr = to + 1;  while (b[fr] === 0) fr += 1;  if (RQ[b[fr]] !== 0) return 1;
  fr = to - 1;  while (b[fr] === 0) fr -= 1;  if (RQ[b[fr]] !== 0) return 1;
  fr = to + 12; while (b[fr] === 0) fr += 12; if (RQ[b[fr]] !== 0) return 1;
  fr = to - 12; while (b[fr] === 0) fr -= 12; if (RQ[b[fr]] !== 0) return 1;
  fr = to + 11; while (b[fr] === 0) fr += 11; if (BQ[b[fr]] !== 0) return 1;
  fr = to - 11; while (b[fr] === 0) fr -= 11; if (BQ[b[fr]] !== 0) return 1;
  fr = to + 13; while (b[fr] === 0) fr += 13; if (BQ[b[fr]] !== 0) return 1;
  fr = to - 13; while (b[fr] === 0) fr -= 13; if (BQ[b[fr]] !== 0) return 1;

  return 0;

}

//}}}
//{{{  isDraw

function isDraw () {

  if (repHi - repLo >= 100)
    return 1;

  for (let i=repHi-5; i >= repLo; i -= 2) {

    if (repLoHash[i] === loHash && repHiHash[i] === hiHash)
      return 1;

  }

  const numPieces = wCount + bCount;

  if (numPieces === 2)
    return 1;

  const wNumBishops = wCounts[BISHOP];
  const wNumKnights = wCounts[KNIGHT];

  const bNumBishops = bCounts[BISHOP];
  const bNumKnights = bCounts[KNIGHT];

  if (numPieces === 3 && (wNumKnights !== 0 || wNumBishops !== 0 || bNumKnights !== 0 || bNumBishops !== 0))
    return 1;

  return 0;

}

//}}}
//{{{  formatFen

function formatFen (turn) {

  var fen = '';
  var n   = 0;

  for (var i=0; i < 8; i++) {
    for (var j=0; j < 8; j++) {
      var sq  = B88[i*8 + j]
      var obj = bdB[sq];
      if (obj === 0)
        n++;
      else {
        if (n) {
          fen += '' + n;
          n = 0;
        }
        fen += UMAP[obj];
      }
    }
    if (n) {
      fen += '' + n;
      n = 0;
    }
    if (i < 7)
      fen += '/';
  }

  if (turn === WHITE)
    fen += ' w';
  else
    fen += ' b';

  if (bdRights) {
    fen += ' ';
    if (bdRights & WHITE_RIGHTS_KING)
      fen += 'K';
    if (bdRights & WHITE_RIGHTS_QUEEN)
      fen += 'Q';
    if (bdRights & BLACK_RIGHTS_KING)
      fen += 'k';
    if (bdRights & BLACK_RIGHTS_QUEEN)
      fen += 'q';
  }
  else
    fen += ' -';

  if (bdEp)
    fen += ' ' + COORDS[bdEp];
  else
    fen += ' -';

  fen += ' 0 1';

  return fen;

}

//}}}
//{{{  flipFen
//
// flipFen is slow. Only use for init/test.
//

function flipFen (fen) {  // @types fen:str

  const parts = fen.split(' ');

  // board: reverse the rows and swap case

  const rows = parts[0].split('/');

  let board = '';

  for (let i=rows.length-1; i >= 0; i--) {

    const row = rows[i];

    for (let j=0; j < row.length; j++) {
      const c = row.charCodeAt(j);
      if (c >= 65 && c <= 90)
        board += String.fromCharCode(c + 32);
      else if (c >= 97 && c <= 122)
        board += String.fromCharCode(c - 32);
      else
        board += row.charAt(j);
    }

    if (i > 0)
      board += '/';
  }

  // colour

  const colour = parts[1] == 'w' ? 'b' : 'w';

  // castling

  let castling = '';

  for (let i=0; i < parts[2].length; i++) {
    const ch = parts[2].charAt(i);
    if (ch == 'K')
      castling += 'k';
    else if (ch == 'Q')
      castling += 'q';
    else if (ch == 'k')
      castling += 'K';
    else if (ch == 'q')
      castling += 'Q';
    else
      castling += ch;
  }

  // ep

  let ep = '-';

  if (parts[3] != '-')
    ep = parts[3].charAt(0) + (9 - parseInt(parts[3].charAt(1)));

  return board + ' ' + colour + ' ' + castling + ' ' + ep + ' ' + parts[4] + ' ' + parts[5];

}

//}}}
//{{{  makeMoveA

function makeMoveA (node, move) {

  const b = bdB;
  const z = bdZ;

  const fr      = (move & MOVE_FR_MASK   ) >>> MOVE_FR_BITS;
  const to      = (move & MOVE_TO_MASK   ) >>> MOVE_TO_BITS;
  const toObj   = (move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS;
  const frObj   = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;
  const frPiece = frObj & PIECE_MASK;
  const frCol   = frObj & COLOR_MASK;

  const child = node.childNode;  // records the accumulator update, applied lazily by netEval()

  child.accDirty = 1;

  // slide piece

  b[fr] = 0;
  b[to] = frObj;

  node.frZ = z[fr];
  node.toZ = z[to];

  z[fr] = NO_Z;
  z[to] = node.frZ;

  loHash ^= loObjPieces[(frObj << 8) + fr];
  hiHash ^= hiObjPieces[(frObj << 8) + fr];

  loHash ^= loObjPieces[(frObj << 8) + to];
  hiHash ^= hiObjPieces[(frObj << 8) + to];

  wbList[frCol >>> 3][node.frZ] = to;

  // clear rights?

  if (bdRights !== 0) {

    loHash ^= loRights[bdRights];
    hiHash ^= hiRights[bdRights];

    bdRights &= MASK_RIGHTS[fr] & MASK_RIGHTS[to];

    loHash ^= loRights[bdRights];
    hiHash ^= hiRights[bdRights];

  }

  // capture?

  if (toObj !== 0) {

    const toPiece = toObj & PIECE_MASK;
    const toCol   = toObj & COLOR_MASK;

    loHash ^= loObjPieces[(toObj << 8) + to];
    hiHash ^= hiObjPieces[(toObj << 8) + to];

    if (toCol === WHITE) {

      wList[node.toZ] = EMPTY;

      wCounts[toPiece]--;
      wCount--;
    }

    else {

      bList[node.toZ] = EMPTY;

      bCounts[toPiece]--;
      bCount--;
    }

    child.ueType = UE_CAPTURE;
    child.ueArgs0 = frObj;
    child.ueArgs1 = fr;
    child.ueArgs2 = toObj;
    child.ueArgs3 = to;

  }

  else {

    child.ueType = UE_MOVE;
    child.ueArgs0 = frObj;
    child.ueArgs1 = fr;
    child.ueArgs2 = to;

  }

  // reset EP

  loHash ^= loEP[bdEp];
  hiHash ^= hiEP[bdEp];

  bdEp = 0;

  loHash ^= loEP[bdEp];
  hiHash ^= hiEP[bdEp];

  if ((move & MOVE_SPECIAL_MASK) !== 0) {
    // ikky stuff

    if (frCol === WHITE) {

      const ep = to + 12;

      if ((move & MOVE_EPMAKE_MASK) !== 0) {

        child.ueType = UE_MOVE;
        child.ueArgs0 = frObj;
        child.ueArgs1 = fr;
        child.ueArgs2 = to;

        loHash ^= loEP[bdEp];
        hiHash ^= hiEP[bdEp];

        bdEp = ep;

        loHash ^= loEP[bdEp];
        hiHash ^= hiEP[bdEp];
      }

      else if ((move & MOVE_EPTAKE_MASK) !== 0) {

        child.ueType = UE_EPCAPTURE;
        child.ueArgs0 = frObj;
        child.ueArgs1 = fr;
        child.ueArgs2 = to;
        child.ueArgs3 = B_PAWN;
        child.ueArgs4 = ep;

        b[ep]    = 0;
        node.epZ = z[ep];
        z[ep]    = NO_Z;

        bList[node.epZ] = EMPTY;

        loHash ^= loObjPieces[(B_PAWN << 8) + ep];
        hiHash ^= hiObjPieces[(B_PAWN << 8) + ep];

        bCounts[PAWN]--;
        bCount--;
      }

      else if ((move & MOVE_PROMOTE_MASK) !== 0) {

        const pro = ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS) + 2;  //NBRQ
        b[to]     = WHITE | pro;

        child.ueType = UE_PROMOTE;
        child.ueArgs0 = W_PAWN;
        child.ueArgs1 = fr;
        child.ueArgs2 = to;
        child.ueArgs3 = toObj;
        child.ueArgs4 = pro|WHITE;

        loHash ^= loObjPieces[(W_PAWN << 8) + to];
        hiHash ^= hiObjPieces[(W_PAWN << 8) + to];
        loHash ^= loObjPieces[((WHITE|pro) << 8) + to];
        hiHash ^= hiObjPieces[((WHITE|pro) << 8) + to];

        wCounts[PAWN]--;
        wCounts[pro]++;

      }

      else if (move === MOVE_E1G1) {

        child.ueType = UE_CASTLE;
        child.ueArgs0 = W_KING;
        child.ueArgs1 = fr;
        child.ueArgs2 = to;
        child.ueArgs3 = W_ROOK;
        child.ueArgs4 = H1;
        child.ueArgs5 = F1;

        b[H1] = 0;
        b[F1] = W_ROOK;
        z[F1] = z[H1];
        z[H1] = NO_Z;

        wList[z[F1]] = F1;

        loHash ^= loObjPieces[(W_ROOK << 8) + H1];
        hiHash ^= hiObjPieces[(W_ROOK << 8) + H1];
        loHash ^= loObjPieces[(W_ROOK << 8) + F1];
        hiHash ^= hiObjPieces[(W_ROOK << 8) + F1];

      }

      else if (move === MOVE_E1C1) {

        child.ueType = UE_CASTLE;
        child.ueArgs0 = W_KING;
        child.ueArgs1 = fr;
        child.ueArgs2 = to;
        child.ueArgs3 = W_ROOK;
        child.ueArgs4 = A1;
        child.ueArgs5 = D1;

        b[A1] = 0;
        b[D1] = W_ROOK;
        z[D1] = z[A1];
        z[A1] = NO_Z;

        wList[z[D1]] = D1;

        loHash ^= loObjPieces[(W_ROOK << 8) + A1];
        hiHash ^= hiObjPieces[(W_ROOK << 8) + A1];
        loHash ^= loObjPieces[(W_ROOK << 8) + D1];
        hiHash ^= hiObjPieces[(W_ROOK << 8) + D1];

      }
    }

    else {

      const ep = to - 12;

      if ((move & MOVE_EPMAKE_MASK) !== 0) {

        child.ueType = UE_MOVE;
        child.ueArgs0 = frObj;
        child.ueArgs1 = fr;
        child.ueArgs2 = to;

        loHash ^= loEP[bdEp];
        hiHash ^= hiEP[bdEp];

        bdEp = ep;

        loHash ^= loEP[bdEp];
        hiHash ^= hiEP[bdEp];
      }

      else if ((move & MOVE_EPTAKE_MASK) !== 0) {

        child.ueType = UE_EPCAPTURE;
        child.ueArgs0 = frObj;
        child.ueArgs1 = fr;
        child.ueArgs2 = to;
        child.ueArgs3 = W_PAWN;
        child.ueArgs4 = ep;

        b[ep]    = 0;
        node.epZ = z[ep];
        z[ep]    = NO_Z;

        wList[node.epZ] = EMPTY;

        loHash ^= loObjPieces[(W_PAWN << 8) + ep];
        hiHash ^= hiObjPieces[(W_PAWN << 8) + ep];

        wCounts[PAWN]--;
        wCount--;
      }

      else if ((move & MOVE_PROMOTE_MASK) !== 0) {

        const pro = ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS) + 2;  //NBRQ
        b[to]     = BLACK | pro;

        child.ueType = UE_PROMOTE;
        child.ueArgs0 = B_PAWN;
        child.ueArgs1 = fr;
        child.ueArgs2 = to;
        child.ueArgs3 = toObj;
        child.ueArgs4 = pro|BLACK;

        loHash ^= loObjPieces[(B_PAWN << 8) + to];
        hiHash ^= hiObjPieces[(B_PAWN << 8) + to];
        loHash ^= loObjPieces[((pro|BLACK) << 8) + to];
        hiHash ^= hiObjPieces[((pro|BLACK) << 8) + to];

        bCounts[PAWN]--;
        bCounts[pro]++;

      }

      else if (move === MOVE_E8G8) {

        child.ueType = UE_CASTLE;
        child.ueArgs0 = B_KING;
        child.ueArgs1 = fr;
        child.ueArgs2 = to;
        child.ueArgs3 = B_ROOK;
        child.ueArgs4 = H8;
        child.ueArgs5 = F8;

        b[H8] = 0;
        b[F8] = B_ROOK;
        z[F8] = z[H8];
        z[H8] = NO_Z;

        bList[z[F8]] = F8;

        loHash ^= loObjPieces[(B_ROOK << 8) + H8];
        hiHash ^= hiObjPieces[(B_ROOK << 8) + H8];
        loHash ^= loObjPieces[(B_ROOK << 8) + F8];
        hiHash ^= hiObjPieces[(B_ROOK << 8) + F8];

      }

      else if (move === MOVE_E8C8) {

        child.ueType = UE_CASTLE;
        child.ueArgs0 = B_KING;
        child.ueArgs1 = fr;
        child.ueArgs2 = to;
        child.ueArgs3 = B_ROOK;
        child.ueArgs4 = A8;
        child.ueArgs5 = D8;

        b[A8] = 0;
        b[D8] = B_ROOK;
        z[D8] = z[A8];
        z[A8] = NO_Z;

        bList[z[D8]] = D8;

        loHash ^= loObjPieces[(B_ROOK << 8) + A8];
        hiHash ^= hiObjPieces[(B_ROOK << 8) + A8];
        loHash ^= loObjPieces[(B_ROOK << 8) + D8];
        hiHash ^= hiObjPieces[(B_ROOK << 8) + D8];

      }

    }

  }

  // flip turn in hash

  loHash ^= loTurn;
  hiHash ^= hiTurn;

  // push rep hash
  //
  // Repetitions are cancelled by pawn moves, castling, captures, EP
  // and promotions; i.e. moves that are not reversible.  The nearest
  // repetition is 5 indexes back from the current one and then that
  // and every other one entry is a possible rep.  Can also check for
  // 50 move rule by testing hi-lo >= 100 - it's not perfect because of
  // the pawn move reset but it's a type 2 error, so safe.
  //

  repLoHash[repHi] = loHash;
  repHiHash[repHi] = hiHash;

  repHi++;

  if ((move & (MOVE_SPECIAL_MASK | MOVE_TOOBJ_MASK)) || frPiece === PAWN)
    repLo = repHi;

}

//}}}
//{{{  unmakeMove

function unmakeMove (node, move) {

  const b = bdB;
  const z = bdZ;

  const fr    = (move & MOVE_FR_MASK)    >>> MOVE_FR_BITS;
  const to    = (move & MOVE_TO_MASK)    >>> MOVE_TO_BITS;
  const toObj = (move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS;
  const frObj = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;
  const frCol = frObj & COLOR_MASK;

  b[fr] = frObj;
  b[to] = toObj;

  z[fr] = node.frZ;
  z[to] = node.toZ;

  wbList[frCol >>> 3][node.frZ] = fr;

  // capture?

  if (toObj !== 0) {

    const toPiece = toObj & PIECE_MASK;
    const toCol   = toObj & COLOR_MASK;

    if (toCol === WHITE) {

      wList[node.toZ] = to;

      wCounts[toPiece]++;
      wCount++;
    }

    else {

      bList[node.toZ] = to;

      bCounts[toPiece]++;
      bCount++;
    }

  }

  if ((move & MOVE_SPECIAL_MASK) !== 0) {
    // ikky stuff

    if ((frObj & COLOR_MASK) === WHITE) {

      const ep = to + 12;

      if (move & MOVE_EPTAKE_MASK) {

        b[ep] = B_PAWN;
        z[ep] = node.epZ;

        bList[node.epZ] = ep;

        bCounts[PAWN]++;
        bCount++;

      }

      else if (move & MOVE_PROMOTE_MASK) {

        const pro = ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS) + 2;  //NBRQ

        wCounts[PAWN]++;
        wCounts[pro]--;

      }

      else if (move === MOVE_E1G1) {

        b[H1] = W_ROOK;
        b[F1] = 0;
        z[H1] = z[F1];
        z[F1] = NO_Z;

        wList[z[H1]] = H1;
      }

      else if (move === MOVE_E1C1) {

        b[A1] = W_ROOK;
        b[D1] = 0;
        z[A1] = z[D1];
        z[D1] = NO_Z;

        wList[z[A1]] = A1;
      }
    }

    else {

      const ep = to - 12;

      if (move & MOVE_EPTAKE_MASK) {

        b[ep] = W_PAWN;
        z[ep] = node.epZ;

        wList[node.epZ] = ep;

        wCounts[PAWN]++;
        wCount++;
      }

      else if (move & MOVE_PROMOTE_MASK) {

        const pro = ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS) + 2;  //NBRQ

        bCounts[PAWN]++;
        bCounts[pro]--;

      }

      else if (move === MOVE_E8G8) {

        b[H8] = B_ROOK;
        b[F8] = 0;
        z[H8] = z[F8];
        z[F8] = NO_Z;

        bList[z[H8]] = H8;
      }

      else if (move === MOVE_E8C8) {

        b[A8] = B_ROOK;
        b[D8] = 0;
        z[A8] = z[D8];
        z[D8] = NO_Z;

        bList[z[A8]] = A8;
      }
    }

  }

}

//}}}
//{{{  boardCheck (debug)

function boardCheck (node, turn) {

  const a1 = new Int32Array(NET_H1_SIZE);
  const a2 = new Int32Array(NET_H1_SIZE);

  if (node.accDirty !== 0)
    netRefresh(node);

  // hash

  var loH = 0;
  var hiH = 0;

  if (turn) {
    loH ^= loTurn;
    hiH ^= hiTurn;
  }

  loH ^= loRights[bdRights];
  hiH ^= hiRights[bdRights];

  loH ^= loEP[bdEp];
  hiH ^= hiEP[bdEp];

  for (var sq=0; sq<144; sq++) {

    var obj = bdB[sq];

    if (obj === 0 || obj === EDGE)
      continue;

    var piece = obj & PIECE_MASK;
    var col   = obj & COLOR_MASK;

    loH ^= loObjPieces[(obj << 8) + sq];
    hiH ^= hiObjPieces[(obj << 8) + sq];

  }

  if (loH !== loHash)
    console.log('*************** LO',loH,loHash);

  if (hiH !== hiHash)
    console.log('*************** HI',hiH,hiHash);

  // accumulators

  a1.set(net_h1_b);
  a2.set(net_h1_b);

  for (let sq=0; sq < 64; sq++) {

    const fr    = B88[sq];
    const frObj = bdB[fr];

    if (frObj === 0)
      continue;

    const off1 = IMAP[(frObj << 8) + fr];

    for (let h=0; h < NET_H1_SIZE; h++) {
      const idx1 = off1 + h;
      a1[h] += net_h1_w_flat[idx1];
      a2[h] += net_h2_w_flat[idx1];
    }

  }

  for (let i=0; i < NET_H1_SIZE; i++) {
    if (a1[i] !== net_acc[node.acc1 + i])
      console.log('****** A1', i, a1[i], net_acc[node.acc1 + i]);
    if (a2[i] !== net_acc[node.acc2 + i])
      console.log('****** A2', i, a2[i], net_acc[node.acc2 + i]);
  }

}

//}}}

//{{{  initBoard

function initBoard () {

  // zobrist keys

  loTurn = twisterRand();
  hiTurn = twisterRand();

  for (let i=0; i < 15 * 256; i++) {
    loObjPieces[i] = twisterRand();
    hiObjPieces[i] = twisterRand();
  }

  for (let i=0; i < 16; i++) {
    loRights[i] = twisterRand();
    hiRights[i] = twisterRand();
  }

  for (let i=0; i < 144; i++) {
    loEP[i] = twisterRand();
    hiEP[i] = twisterRand();
  }

  // ADJACENT

  ADJACENT[1]  = 1;
  ADJACENT[11] = 1;
  ADJACENT[12] = 1;
  ADJACENT[13] = 1;

  // ALIGNED

  for (var i=0; i < 144; i++) {
    ALIGNED[i].fill(EDGE);
    for (let j=0; j < 64; j++) {
      ALIGNED[i][B88[j]] = 0;
    }
  }

  for (let i=0; i < 64; i++) {

    const to = B88[i];
    const a  = ALIGNED[to];

    let dir = 1;
    let from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }

    dir = -1;
    from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }

    dir = 12;
    from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }

    dir = -12;
    from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }

    dir = 13;
    from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }

    dir = -13;
    from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }

    dir = 11;
    from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }

    dir = -11;
    from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }

  }

}

//}}}

//}}}
//{{{  nodes

const nodes = Array(MAX_PLY);

//{{{  nodeStruct

function nodeStruct () {

  this.ply             = 0;
  this.childNode       = null;
  this.parentNode      = null;
  this.grandparentNode = null;

  this.moves  = new Uint32Array(MAX_MOVES);
  this.ranks  = new Uint32Array(MAX_MOVES);
  this.moves2 = new Uint32Array(MAX_MOVES);
  this.ranks2 = new Uint32Array(MAX_MOVES);
  this.quiets = new Uint32Array(MAX_MOVES);  // quiet moves searched at this node that did not cut off

  this.killer1     = 0;
  this.killer2     = 0;
  this.mateKiller  = 0;
  this.stage       = 0;
  this.numMoves    = 0;
  this.numMoves2   = 0;
  this.next        = 0;
  this.hashMove    = 0;
  this.base        = 0;
  this.inCheck     = 0;
  this.ev          = 0;

  this.rights = 0;
  this.ep     = 0;
  this.repLo  = 0;
  this.repHi  = 0;
  this.loHash = 0;
  this.hiHash = 0;

  this.acc1     = 0;  // offsets of this node's accumulators in net_acc, see initNodes() and the net fold
  this.acc2     = 0;
  this.accDirty = 0;
  this.ueType   = 0;
  this.ueArgs0  = 0;
  this.ueArgs1  = 0;
  this.ueArgs2  = 0;
  this.ueArgs3  = 0;
  this.ueArgs4  = 0;
  this.ueArgs5  = 0;

  this.toZ = 0;
  this.frZ = 0;
  this.epZ = 0;

  this.pv    = new Uint32Array(MAX_MOVES);
  this.pvLen = 0;

}

//}}}
//{{{  initNode

function initNode (node) {

  node.killer1    = 0;
  node.killer2    = 0;
  node.mateKiller = 0;
  node.numMoves   = 0;
  node.next       = 0;
  node.hashMove   = 0;
  node.base       = 0;
  node.inCheck    = 0;

  node.toZ = 0;
  node.frZ = 0;
  node.epZ = 0;

}

//}}}
//{{{  cache

function cache (node) {

  node.rights = bdRights;
  node.ep     = bdEp;
  node.repLo  = repLo;
  node.repHi  = repHi;
  node.loHash = loHash;
  node.hiHash = hiHash;

}

//}}}
//{{{  uncacheA

function uncacheA (node) {

  bdRights = node.rights;
  bdEp     = node.ep;
  repLo    = node.repLo;
  repHi    = node.repHi;
  loHash   = node.loHash;
  hiHash   = node.hiHash;

}

//}}}

let rootNode = null;

//{{{  initNodes

function initNodes () {

  for (let i=0; i < nodes.length; i++) {
    nodes[i] = new nodeStruct();
    seal(nodes[i]);
    nodes[i].ply  = i;
    nodes[i].acc1 = i * 2 * NET_H1_SIZE;
    nodes[i].acc2 = i * 2 * NET_H1_SIZE + NET_H1_SIZE;
  }

  for (let i=0; i < nodes.length-1; i++)
    nodes[i].childNode = nodes[i+1];

  for (let i=1; i < nodes.length; i++)
    nodes[i].parentNode = nodes[i-1];

  for (let i=2; i < nodes.length; i++)
    nodes[i].grandparentNode = nodes[i-2];

  rootNode = nodes[0];

}

//}}}
//}}}
//{{{  tt

let ttDefault = 16;  // mb
let ttSize    = 1;
let ttMask    = 0;

// The tt is seven arrays, with one element of each for an entry: entry idx is
// ttLo[idx], ttHi[idx], ttType[idx] and so on.

let ttLo    = new Int32Array(ttSize);   // hash, low half
let ttHi    = new Int32Array(ttSize);   // hash, high half
let ttType  = new Uint8Array(ttSize);   // TT_EMPTY, or TT_EXACT/TT_BETA/TT_ALPHA: the score is exact/at least/at most
let ttDepth = new Int8Array(ttSize);    // depth searched to, 0 for qsearch
let ttMove  = new Uint32Array(ttSize);  // best move, or 0
let ttEval  = new Int16Array(ttSize);   // static eval
let ttScore = new Int16Array(ttSize);   // search score, see ttGetScore()

const ttWidth = 18;

let ttHashUsed = 0;

//{{{  ttResize

function ttResize(N_MB) {

  const bytesPerEntry  = ttWidth;
  const requestedBytes = N_MB * 1024 * 1024;
  const entriesNeeded  = requestedBytes / bytesPerEntry;
  const pow2           = Math.ceil(Math.log2(entriesNeeded));

  ttSize = 1 << pow2;
  ttMask = ttSize - 1;

  ttLo    = new Int32Array(ttSize);
  ttHi    = new Int32Array(ttSize);
  ttType  = new Uint8Array(ttSize);
  ttDepth = new Int8Array(ttSize);
  ttMove  = new Uint32Array(ttSize);
  ttEval  = new Int16Array(ttSize);
  ttScore = new Int16Array(ttSize);

  const sm   = silentMode;
  silentMode = 0;

  uciSend('info string tt bits', pow2, 'entries', ttSize, 'bytes', ttWidth * ttSize);

  silentMode = sm;

}

//}}}

//{{{  ttPut

function ttPut (type, depth, score, move, ply, alpha, beta, ev) {

  const idx = loHash & ttMask;

  if (depth === 0 && ttType[idx] !== TT_EMPTY && ttDepth[idx] > 0)
    return;

  if (ttType[idx] === TT_EMPTY)
    ttHashUsed++;

  if (score <= -MINMATE && score >= -MATE)
    score -= ply;

  else if (score >= MINMATE && score <= MATE)
    score += ply;

  ttLo[idx]    = loHash;
  ttHi[idx]    = hiHash;
  ttType[idx]  = type;
  ttDepth[idx] = depth;
  ttScore[idx] = score;
  ttEval[idx]  = ev;

  if (move !== 0)
    ttMove[idx] = move & MOVE_CLEAN_MASK;

}

//}}}
//{{{  ttGet
//
// Look the current position (loHash, hiHash) up in the tt. Returns the index of its
// entry, to use with the tt arrays (ttDepth[idx], ttType[idx], ttEval[idx] etc), or
// TT_MISS if it is not there. What to make of the entry is up to the caller: the move
// (ttGetMove) and the static eval are good whatever depth the entry was searched to,
// the score (ttGetScore) only if that was deep enough and the bound in ttType allows.
//
// The index is only good until the next ttPut(), i.e. until a child is searched.
//

function ttGet () {

  const idx = loHash & ttMask;

  if (ttType[idx] !== TT_EMPTY && ttLo[idx] === loHash && ttHi[idx] === hiHash)
    return idx;

  return TT_MISS;

}

//}}}
//{{{  ttGetMove
//
// The move in entry idx, or 0 if there is no entry (TT_MISS), no move, or the move
// does not fit the board (a different position with the same hash).
//

function ttGetMove (idx) {

  if (idx !== TT_MISS && ttValidate(ttMove[idx]) !== 0)
    return ttMove[idx];

  return 0;

}

//}}}
//{{{  ttGetScore
//
// The score in entry idx for a node at ply. Mate scores are stored as the distance to
// mate from the entry's own position (see ttPut), so the ply is put back here.
//

function ttGetScore (idx, ply) {

  const score = ttScore[idx];

  if (score <= -MINMATE && score >= -MATE)
    return score + ply;

  if (score >= MINMATE && score <= MATE)
    return score - ply;

  return score;

}

//}}}
//{{{  ttInit

function ttInit () {

  ttType.fill(TT_EMPTY);
  ttMove.fill(0);

  ttHashUsed = 0;

}

//}}}
//{{{  ttValidate

function ttValidate (move) {

  const b = bdB;

  const fr    = (move & MOVE_FR_MASK   ) >>> MOVE_FR_BITS;
  const frObj = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;

  if (b[fr] !== frObj)
    return 0;

  const to    = (move & MOVE_TO_MASK   ) >>> MOVE_TO_BITS;
  const toObj = (move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS;

  if (b[to] !== toObj)
    return 0;

  return 1;

}

//}}}
//{{{  newGame

function newGame() {

  if (ttSize == 1)
    ttResize(ttDefault);

  ttInit();

  //objHistory.fill(0);

}

//}}}

//}}}
//{{{  moves

//{{{  formatMove

function formatMove (move) {

  let moveStr = '0000';

  if (move !== 0) {

    const fr = (move & MOVE_FR_MASK) >>> MOVE_FR_BITS;
    const to = (move & MOVE_TO_MASK) >>> MOVE_TO_BITS;

    moveStr = COORDS[fr] + COORDS[to];

    if ((move & MOVE_PROMOTE_MASK) !== 0)
      moveStr = moveStr + PROMOTES[(move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS];

  }

  return moveStr;

}

//}}}
//{{{  genMoves
function genMoves (node, turn) {

  node.stage     = 0;
  node.numMoves  = 0;
  node.numMoves2 = 0;
  node.next      = 0;

  const b = bdB;
  const inCheck = node.inCheck;

  // colour based stuff

  if (turn === WHITE) {

    var offsetOrth  = -12;
    var offsetDiag1 = -13;
    var offsetDiag2 = -11;
    var homeRank    = 2;
    var promoteRank = 7;
    var rights      = bdRights & WHITE_RIGHTS;
    var pList       = wList;
    var theirKingSq = bList[0];
    var pCount      = wCount;
    var CAPTURE     = IS_BNK;
    var aligned     = ALIGNED[wList[0]];

    if (inCheck === 0 && rights !== 0) {

      if (((rights & WHITE_RIGHTS_KING) !== 0) && b[F1] === 0 && b[G1] === 0 && b[SQG2] !== B_KING && b[SQH2] !== B_KING && isAttacked(F1,BLACK) === 0)
        addCastle(node, MOVE_E1G1);

      if (((rights & WHITE_RIGHTS_QUEEN) !== 0) && b[B1] === 0 && b[C1] === 0 && b[D1] === 0 && b[SQB2] !== B_KING && b[SQC2] !== B_KING && isAttacked(D1,BLACK) === 0)
        addCastle(node, MOVE_E1C1);
    }

  }

  else {

    var offsetOrth  = 12;
    var offsetDiag1 = 13;
    var offsetDiag2 = 11;
    var homeRank    = 7;
    var promoteRank = 2;
    var rights      = bdRights & BLACK_RIGHTS;
    var pList       = bList;
    var theirKingSq = wList[0];
    var pCount      = bCount;
    var CAPTURE     = IS_WNK;
    var aligned     = ALIGNED[bList[0]];

    if (inCheck === 0 && rights !== 0) {

      if (((rights & BLACK_RIGHTS_KING) !== 0) && b[F8] === 0 && b[G8] === 0 && b[SQG7] !== W_KING && b[SQH7] !== W_KING && isAttacked(F8,WHITE) === 0)
        addCastle(node, MOVE_E8G8);

      if (((rights & BLACK_RIGHTS_QUEEN) !== 0) && b[B8] === 0 && b[C8] === 0 && b[D8] === 0 && b[SQB7] !== W_KING && b[SQC7] !== W_KING && isAttacked(D8,WHITE) === 0)
        addCastle(node, MOVE_E8C8);
    }

  }

  let next   = 0;
  let count  = 0;
  let to     = 0;
  let toObj  = 0;
  let myMove = 0;

  while (count < pCount) {

    const fr = pList[next];
    if (fr === 0) {
      next++;
      continue;
    }

    const frObj     = b[fr];
    const frPiece   = frObj & PIECE_MASK;
    const frMove    = (frObj << MOVE_FROBJ_BITS) | (fr << MOVE_FR_BITS);
    const frRank    = RANK[fr];
    const legalMask = inCheck === 0 && aligned[fr] === 0 ? MOVE_LEGAL_MASK : 0;

    switch (frPiece) {
      case 1: {
        // P

        // orth

        to    = fr + offsetOrth;
        toObj = b[to];

        if (toObj === 0) {

          if (frRank === promoteRank)
            addPromotion(node, frMove | to | legalMask);

          else {
            addSlide(node, frMove | to | legalMask);

            if (frRank === homeRank) {

              to += offsetOrth;
              if (b[to] === 0)
                addSlide(node, frMove | to | MOVE_EPMAKE_MASK | legalMask);
            }
          }

        }

        // diag1

        to    = fr + offsetDiag1;
        toObj = b[to];

        if (CAPTURE[toObj] !== 0) {

          if (frRank === promoteRank)
            addPromotion(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to | legalMask);
          else
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to | legalMask);
        }

        else if (toObj === 0 && to === bdEp)
          addEPTake(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to | MOVE_EPTAKE_MASK);

        // diag2

        to    = fr + offsetDiag2;
        toObj = b[to];

        if (CAPTURE[toObj] !== 0) {

          if (frRank === promoteRank)
            addPromotion(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to | legalMask);
          else
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to | legalMask);
        }

        else if (toObj === 0 && to === bdEp)
          addEPTake(node, frMove | to | MOVE_EPTAKE_MASK);

        break;

      }
      case 2: {
        // N

        myMove = frMove | legalMask;

        to = fr + 25;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 25;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 23;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 23;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 14;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 14;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 10;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 10;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        break;

      }
      case 3: {
        // B

        myMove = frMove | legalMask;

        to = fr + 11;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 11;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 13;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 13;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        break;

      }
      case 4: {
        // R

        myMove = frMove | legalMask;

        to = fr + 1;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 1;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 12;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 12;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        break;

      }
      case 5: {
        // B

        myMove = frMove | legalMask;

        to = fr + 11;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 11;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 13;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 13;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        // R

        myMove = frMove | legalMask;

        to = fr + 1;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 1;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 12;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 12;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);

        break;

      }
      case 6: {
        // K

        to = fr + 11;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }

        to = fr - 11;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }

        to = fr + 13;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }

        to = fr - 13;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }

        to = fr + 1;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }

        to = fr - 1;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }

        to = fr + 12;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }

        to = fr - 12;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }

        break;

      }
    }

    next++;
    count++

  }
}

//}}}
//{{{  genQMoves
function genQMoves (node, turn) {

  node.stage     = 0;
  node.numMoves  = 0;
  node.numMoves2 = 0;
  node.next      = 0;

  const b = bdB;

  // colour based stuff

  if (turn === WHITE) {

    var offsetOrth  = -12;
    var offsetDiag1 = -13;
    var offsetDiag2 = -11;
    var promoteRank = 7;
    var pList       = wList;
    var theirKingSq = bList[0];
    var pCount      = wCount;
    var CAPTURE     = IS_BNK;

  }

  else {

    var offsetOrth  = 12;
    var offsetDiag1 = 13;
    var offsetDiag2 = 11;
    var promoteRank = 2;
    var pList       = bList;
    var theirKingSq = wList[0];
    var pCount      = bCount;
    var CAPTURE     = IS_WNK;

  }

  let next  = 0;
  let count = 0;
  let to    = 0;
  let toObj = 0;

  while (count < pCount) {

    const fr = pList[next];
    if (fr === 0) {
      next++;
      continue;
    }

    const frObj   = b[fr];
    const frPiece = frObj & PIECE_MASK;
    const frMove  = (frObj << MOVE_FROBJ_BITS) | (fr << MOVE_FR_BITS);
    const frRank  = RANK[fr];

    switch (frPiece) {
      case 1: {
        // P

        // orth

        to    = fr + offsetOrth;
        toObj = b[to];

        if (toObj === 0) {

          if (frRank === promoteRank)
            addQPromotion(node, MOVE_PROMOTE_MASK | frMove | to);

        }

        // diag1

        to    = fr + offsetDiag1;
        toObj = b[to];

        if (CAPTURE[toObj] !== 0) {

          if (frRank === promoteRank)
            addQPromotion(node, MOVE_PROMOTE_MASK | frMove | (toObj << MOVE_TOOBJ_BITS) | to);
          else
            addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }

        else if (toObj === 0 && to === bdEp)
          addQMove(node, MOVE_EPTAKE_MASK | frMove | to);

        // diag2

        to    = fr + offsetDiag2;
        toObj = b[to];

        if (CAPTURE[toObj] !== 0) {

          if (frRank === promoteRank)
            addQPromotion(node, MOVE_PROMOTE_MASK | frMove | (toObj << MOVE_TOOBJ_BITS) | to);
          else
            addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }

        else if (toObj === 0 && to === bdEp)
          addQMove(node, MOVE_EPTAKE_MASK | frMove | to);

        break;

      }
      case 2: {
        // N

        to = fr + 25;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 25;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 23;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 23;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 14;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 14;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 10;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 10;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        break;

      }
      case 3: {
        // B

        to = fr + 11;
        while (b[to] === 0)
          to += 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 11;
        while (b[to] === 0)
          to -= 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 13;
        while (b[to] === 0)
          to += 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 13;
        while (b[to] === 0)
          to -= 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        break;

      }
      case 4: {
        // R

        to = fr + 1;
        while (b[to] === 0)
          to += 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 1;
        while (b[to] === 0)
          to -= 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 12;
        while (b[to] === 0)
          to += 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 12;
        while (b[to] === 0)
          to -= 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        break;

      }
      case 5: {
        // B

        to = fr + 11;
        while (b[to] === 0)
          to += 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 11;
        while (b[to] === 0)
          to -= 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 13;
        while (b[to] === 0)
          to += 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 13;
        while (b[to] === 0)
          to -= 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        // R

        to = fr + 1;
        while (b[to] === 0)
          to += 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 1;
        while (b[to] === 0)
          to -= 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 12;
        while (b[to] === 0)
          to += 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 12;
        while (b[to] === 0)
          to -= 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        break;

      }
      case 6: {
        // K

        to = fr + 11;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 11;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 13;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 13;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 1;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 1;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr + 12;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        to = fr - 12;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);

        break;

      }
    }

    next++;
    count++
  }

}

//}}}
//{{{  iterator

function getNextMove (node) {

  switch (node.stage) {

    case 0: {
      // node.moves

      if (node.next !== node.numMoves) {

        let maxM = 0;

        const moves = node.moves;
        const ranks = node.ranks;
        const next  = node.next;
        const num   = node.numMoves;

        let maxR = -INF;
        let maxI = 0;

        for (let i=next; i < num; i++) {
          if (ranks[i] > maxR) {
            maxR = ranks[i];
            maxI = i;
          }
        }

        maxM = moves[maxI]

        moves[maxI] = moves[next];
        ranks[maxI] = ranks[next];

        node.base = maxR;

        node.next++;

        return maxM;

      }

      else {

        node.stage++;
        node.next = 0;

        rankSlides(node);

      }

    }

    case 1: {
      // node.moves2

      if (node.next !== node.numMoves2) {

        let maxM = 0;

        const moves = node.moves2;
        const ranks = node.ranks2;
        const next  = node.next;
        const num   = node.numMoves2;

        let maxR = -INF;
        let maxI = 0;

        for (let i=next; i < num; i++) {
          if (ranks[i] > maxR) {
            maxR = ranks[i];
            maxI = i;
          }
        }

        maxM = moves[maxI]

        moves[maxI] = moves[next];
        ranks[maxI] = ranks[next];

        node.base = maxR;

        node.next++;

        return maxM;

      }

      else {

        return 0;

      }

    }

  }
}

function rankSlides (node) {

  for (let i=0; i < node.numMoves2; i++) {

    const move  = node.moves2[i];
    const fr    = (move & MOVE_FR_MASK)    >>> MOVE_FR_BITS;
    const to    = (move & MOVE_TO_MASK)    >>> MOVE_TO_BITS;
    const frObj = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;

    const slideScores = SLIDE_SCORES[frObj];

    // history is in [-HISTORY_MAX, HISTORY_MAX]; the pst delta is tiny in
    // comparison so only acts as a tie break (i.e. when there is no history yet)

    node.ranks2[i] = BASE_HISSLIDE + objHistory[(frObj << 8) + to] + slideScores[to] - slideScores[fr];

  }
}

function addSlide (node, move) {

  const m = move & MOVE_CLEAN_MASK;

  if (m === node.hashMove) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_HASH;
  }

  else if (m === node.mateKiller) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_MATEKILLER;
  }

  else if (m === node.killer1) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_MYKILLERS + 1;
  }

  else if (m === node.killer2) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_MYKILLERS;
  }

  else if (node.grandparentNode !== null && m === node.grandparentNode.killer1) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_GPKILLERS + 1;
  }

  else if (node.grandparentNode !== null && m === node.grandparentNode.killer2) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_GPKILLERS;
  }

  else {
    node.moves2[node.numMoves2++] = move;  // defer ranking until later
  }

}

function addCastle (node, move) {

  const m = move & MOVE_CLEAN_MASK;

  if (m === node.hashMove) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_HASH;
  }

  else if (m === node.mateKiller) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_MATEKILLER;
  }

  else if (m === node.killer1) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_MYKILLERS + 1;
  }

  else if (m === node.killer2) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_MYKILLERS;
  }

  else if (node.grandparentNode !== null && m === node.grandparentNode.killer1) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_GPKILLERS + 1;
  }

  else if (node.grandparentNode !== null && m === node.grandparentNode.killer2) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_GPKILLERS;
  }

  else {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_CASTLING;
  }

}

function addCapture (node, move) {

  const m = move & MOVE_CLEAN_MASK;

  if (m === node.hashMove) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_HASH;
  }

  else {

    const victim = RANK_VECTOR[((move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS) & PIECE_MASK];
    const attack = RANK_VECTOR[((move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS) & PIECE_MASK];

    if (victim > attack) {
      node.moves[node.numMoves]   = move;
      node.ranks[node.numMoves++] = BASE_GOODTAKES + (victim << 6) - attack;
    }

    else if (victim === attack) {
      node.moves[node.numMoves]   = move;
      node.ranks[node.numMoves++] = BASE_EVENTAKES + (victim << 6) - attack;
    }

    else {

      if (m === node.mateKiller) {
        node.moves[node.numMoves]   = move;
        node.ranks[node.numMoves++] = BASE_MATEKILLER;
      }

      else if (m === node.killer1) {
        node.moves[node.numMoves]   = move;
        node.ranks[node.numMoves++] = BASE_MYKILLERS + 1;
      }

      else if (m === node.killer2) {
        node.moves[node.numMoves]   = move;
        node.ranks[node.numMoves++] = BASE_MYKILLERS;
      }

      else if (node.grandparentNode !== null && m === node.grandparentNode.killer1) {
        node.moves[node.numMoves]   = move;
        node.ranks[node.numMoves++] = BASE_GPKILLERS + 1;
      }

      else if (node.grandparentNode !== null && m === node.grandparentNode.killer2) {
        node.moves[node.numMoves]   = move;
        node.ranks[node.numMoves++] = BASE_GPKILLERS;
      }

      else {
        node.moves[node.numMoves]   = move;
        node.ranks[node.numMoves++] = BASE_BADTAKES + (victim << 6) - attack;
      }

    }
  }
}

function addPromotion (node, move) {

  const m = move & MOVE_CLEAN_MASK;

  if ((m | QPRO) === node.hashMove) {
    node.moves[node.numMoves]   = move | QPRO;
    node.ranks[node.numMoves++] = BASE_HASH;
  }
  else {
    node.moves[node.numMoves]   = move | QPRO;
    node.ranks[node.numMoves++] = BASE_PROMOTES + QUEEN;
  }

  if ((m | RPRO) === node.hashMove) {
    node.moves[node.numMoves]   = move | RPRO;
    node.ranks[node.numMoves++] = BASE_HASH;
  }
  else {
    node.moves[node.numMoves]   = move | RPRO;
    node.ranks[node.numMoves++] = BASE_PROMOTES + ROOK;
  }

  if ((m | BPRO) === node.hashMove) {
    node.moves[node.numMoves]   = move | BPRO;
    node.ranks[node.numMoves++] = BASE_HASH;
  }
  else {
    node.moves[node.numMoves]   = move | BPRO;
    node.ranks[node.numMoves++] = BASE_PROMOTES + BISHOP;
  }

  if ((m | NPRO) === node.hashMove) {
    node.moves[node.numMoves]   = move | NPRO;
    node.ranks[node.numMoves++] = BASE_HASH;
  }
  else {
    node.moves[node.numMoves]   = move | NPRO;
    node.ranks[node.numMoves++] = BASE_PROMOTES + KNIGHT;
  }

}

function addEPTake (node, move) {

  const m = move & MOVE_CLEAN_MASK;

  if ((m | MOVE_EPTAKE_MASK) === node.hashMove) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_HASH;
  }

  else {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_EPTAKES;
  }

}

function addQMove (node, move) {

  const m = move & MOVE_CLEAN_MASK;
  const n = node.numMoves++;

  node.moves[n] = move;

  if (m === node.hashMove)
    node.ranks[n] = BASE_HASH;

  else if ((move & MOVE_PROMOTE_MASK) !== 0) {
    if ((move & MOVE_NOISY_MASK) !== 0)
      node.ranks[n] = BASE_PROMOTES + ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS) + 8;  // QRBN capture
    else
      node.ranks[n] = BASE_PROMOTES + ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS);      // QRBN slide (allowed in qs)
  }

  else if ((move & MOVE_EPTAKE_MASK) !== 0)
    node.ranks[n] = BASE_EPTAKES;

  else {
    const victim = RANK_VECTOR[((move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS) & PIECE_MASK];
    const attack = RANK_VECTOR[((move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS) & PIECE_MASK];

    if (victim > attack)
      node.ranks[n] = BASE_GOODTAKES + (victim << 6) - attack;

    else if (victim === attack)
      node.ranks[n] = BASE_EVENTAKES + (victim << 6) - attack;

    else
      node.ranks[n] = BASE_BADTAKES + (victim << 6) - attack;
  }

}

function addQPromotion (node, move) {

  addQMove (node, move | (QUEEN-2)  << MOVE_PROMAS_BITS);
  addQMove (node, move | (ROOK-2)   << MOVE_PROMAS_BITS);
  addQMove (node, move | (BISHOP-2) << MOVE_PROMAS_BITS);
  addQMove (node, move | (KNIGHT-2) << MOVE_PROMAS_BITS);

}

function addKiller (node, score, move) {

  move = move & MOVE_CLEAN_MASK;

  if (move === node.hashMove)
    return;

  if ((move & (MOVE_EPTAKE_MASK | MOVE_PROMOTE_MASK)) !== 0)
    return;  // before killers in move ordering.

  if ((move & MOVE_TOOBJ_MASK) !== 0) {

    const victim = RANK_VECTOR[((move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS) & PIECE_MASK];
    const attack = RANK_VECTOR[((move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS) & PIECE_MASK];

    if (victim >= attack)
      return; // before killers in move ordering.
  }

  if (score >= MINMATE && score <= MATE) {
    node.mateKiller = move;
    if (node.killer1 === move)
      node.killer1 = 0;
    if (node.killer2 === move)
      node.killer2 = 0;
    return;
  }

  if (node.killer1 === move || node.killer2 === move) {
    return;
  }

  if (node.killer1 === 0) {
    node.killer1 = move;
    return;
  }

  if (node.killer2 === 0) {
    node.killer2 = move;
    return;
  }

  const tmp    = node.killer1;
  node.killer1 = move;
  node.killer2 = tmp;

}

//}}}
//{{{  history

//
// piece-to butterfly history with gravity; entries stay in [-HISTORY_MAX, HISTORY_MAX].
//
// when a quiet move causes a beta cutoff it gets a bonus and the quiet moves
// searched before it at that node (node.quiets) get a malus of the same size.
//
// https://www.chessprogramming.org/History_Heuristic
//

const HISTORY_MAX       = 16384;
const HISTORY_BONUS_MAX = 1600;

const objHistory = new Int32Array(15 * 256);

function addHistory (bonus, move) {

  const frObj = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;
  const to    = (move & MOVE_TO_MASK)    >>> MOVE_TO_BITS;
  const idx   = (frObj << 8) + to;
  const h     = objHistory[idx];

  objHistory[idx] = h + bonus - (Math.imul(h, Math.abs(bonus)) / HISTORY_MAX | 0);

}

function updateHistory (node, numQuiets, depth, bestMove) {

  const bonus  = Math.min(HISTORY_BONUS_MAX, Math.imul(depth, depth) << 4);
  const quiets = node.quiets;

  addHistory(bonus, bestMove);

  for (let i=0; i < numQuiets; i++)
    addHistory(-bonus, quiets[i]);

}

//}}}

//}}}
//{{{  evaluate

//{{{  eval cache
//
// The net is the slow part of the engine, and the search asks for the eval of the same
// positions over and over: each iteration walks the tree of the one before, so the
// same leaves keep coming up. This is a small table of position -> eval, used by
// evaluate(). It is separate from the tt, which also holds an eval but only for
// positions that were searched and stored, and it changes nothing but speed: about a
// quarter of the evals are found here, and the bench is the same with or without it.
//
// Bigger is not better: 1 << 18 finds a few more but is slower, the table itself
// then being too big to stay in the processor's cache.
//

const EC_SIZE = 1 << 16;  // entries, a power of 2
const EC_MASK = EC_SIZE - 1;

const ecLo   = new Int32Array(EC_SIZE);  // hash, low half
const ecHi   = new Int32Array(EC_SIZE);  // hash, high half
const ecEval = new Int16Array(EC_SIZE);

//}}}

function evaluate (node, turn) {

  // init

  const numPieces = wCount + bCount;

  const wNumQueens  = wCounts[QUEEN];
  const wNumRooks   = wCounts[ROOK];
  const wNumBishops = wCounts[BISHOP];
  const wNumKnights = wCounts[KNIGHT];
  const wNumPawns   = wCounts[PAWN];

  const bNumQueens  = bCounts[QUEEN];
  const bNumRooks   = bCounts[ROOK];
  const bNumBishops = bCounts[BISHOP];
  const bNumKnights = bCounts[KNIGHT];
  const bNumPawns   = bCounts[PAWN];

  // draw?

  if (numPieces === 2)
    return 0;

  if (numPieces === 3 && (wNumKnights !== 0 || wNumBishops !== 0 || bNumKnights !== 0 || bNumBishops !== 0))
    return 0;

  if (numPieces === 4 && (wNumKnights !== 0 || wNumBishops !== 0) && (bNumKnights !== 0 || bNumBishops !== 0))
    return 0;

  if (numPieces === 4 && (wNumKnights === 2 || bNumKnights === 2))
    return 0;

  if (numPieces === 5 && wNumKnights === 2 && (bNumKnights !== 0 || bNumBishops !== 0))
    return 0;

  if (numPieces === 5 && bNumKnights === 2 && (wNumKnights !== 0 || wNumBishops !== 0))
    return 0;

  if (numPieces === 5 && wNumBishops === 2 && bNumBishops !== 0)
    return 0;

  if (numPieces === 5 && bNumBishops === 2 && wNumBishops !== 0)
    return 0;

  if (numPieces === 4 && wNumRooks !== 0 && bNumRooks !== 0)
    return 0;

  if (numPieces === 4 && wNumQueens !== 0 && bNumQueens !== 0)
    return 0;

  // the net, unless this position has been through it recently (see the eval cache)

  const idx = loHash & EC_MASK;

  if (ecLo[idx] === loHash && ecHi[idx] === hiHash)
    return ecEval[idx];

  let ev = netEval(node, turn);

  if (ev >= MINMATE)
    ev = MINMATE - 1;
  else if (ev <= -MINMATE)
    ev = -MINMATE + 1;

  ecLo[idx]   = loHash;
  ecHi[idx]   = hiHash;
  ecEval[idx] = ev;

  return ev;

}

const WB_OFFSET_DIAG1 = new Int8Array([-13, 13]);
const WB_OFFSET_DIAG2 = new Int8Array([-11, 11]);

const QS = new Uint8Array([0,0,3,3,5,9,0]);

function quickSee (turn, move) {

  if ((move & MOVE_SPECIAL_MASK) !== 0)
    return 0;

  const frObj   = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;
  const frPiece = frObj & PIECE_MASK;

  if (frPiece === PAWN)
    return 0;

  const to    = (move & MOVE_TO_MASK   ) >>> MOVE_TO_BITS;
  const toObj = (move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS;

  const cx = turn >>> 3;

  const nextTurn = turn ^ BLACK;

  const p1 = (bdB[to + WB_OFFSET_DIAG1[cx]] === (PAWN | nextTurn)) | 0;
  const p2 = (bdB[to + WB_OFFSET_DIAG2[cx]] === (PAWN | nextTurn)) | 0;

  if (toObj === 0 && (p1 !== 0 || p2 !== 0))
    return -1;

  const toPiece = toObj & PIECE_MASK;
  const dodgy   = (QS[frPiece] > QS[toPiece]) | 0;

  if (dodgy !== 0 && (p1 !== 0 || p2 !== 0))
    return -1;

  return 0;

}

//}}}
//{{{  search

const LMR_LOOKUP = new Uint8Array(MAX_PLY * MAX_MOVES);  // see initSearch()

//{{{  stats

let statsStartTime = 0;
let statsNodes     = 0;  // @i64
let statsMoveTime  = 0;
let statsHardTime  = 0;  // a fail low re-search may run past statsMoveTime but not past this
let statsSoftNodes = 0;  // stop between id iterations when reached
let statsHardNodes = 0;  // stop mid search when reached
let statsTimeOut   = 0;
let statsSelDepth  = 0;
let statsBestMove  = 0;
let statsBestScore = 0;

function initStats () {

  statsStartTime = now();
  statsNodes     = 0;
  statsMoveTime  = 0;
  statsHardTime  = 0;
  statsSoftNodes = 0;
  statsHardNodes = 0;
  statsTimeOut   = 0;
  statsSelDepth  = 0;
  statsBestMove  = 0;
  statsBestScore = 0;

}

//{{{  countNode
//
// Count a node and see if the search should stop; if so statsTimeOut is set and the
// search unwinds. A node is a position that is searched: rootSearch(), search() and
// qSearch() each call this once, and search() does not call it for a position that it
// hands straight to qSearch(), so nothing is counted twice.
//
// The node limit is tested for every node so that it is exact. The clock is slow to
// read, so that is only done every 1024 nodes.
//

function countNode () {

  statsNodes++;

  if (statsBestMove && statsHardNodes > 0 && statsNodes >= statsHardNodes)
    statsTimeOut = 1;

  if (statsMoveTime > 0 && (statsNodes & 1023) === 0)
    checkTime();

}

//}}}
//{{{  checkTime
//
// Out of time? Only called now and then, see countNode().
//

function checkTime () {

  const elapsed = now() - statsStartTime;

  if (statsBestMove && elapsed >= statsMoveTime)
    statsTimeOut = 1;

  // after a fail low there is no best move yet. rather than lose on time, stop at the
  // hard limit and let go() fall back to the last exact result

  else if (statsBestMove === 0 && multiPVNum > 0 && elapsed >= statsHardTime)
    statsTimeOut = 1;

}

//}}}

//}}}
//{{{  reporting

let multiPV = 1;

const MAX_MULTIPV = 501;

const multiPVMove  = new Uint32Array(MAX_MULTIPV);
const multiPVScore = new Int32Array(MAX_MULTIPV);
const multiPVPvLen = new Int32Array(MAX_MULTIPV);
const multiPVPv    = new Uint32Array(MAX_MULTIPV * MAX_MOVES);

let multiPVNum = 0;

//{{{  multiPVCopy

function multiPVCopy (to, fr) {

  multiPVMove[to]  = multiPVMove[fr];
  multiPVScore[to] = multiPVScore[fr];
  multiPVPvLen[to] = multiPVPvLen[fr];

  multiPVPv.set(multiPVPv.subarray(fr * MAX_MOVES, fr * MAX_MOVES + multiPVPvLen[fr]), to * MAX_MOVES);

}

//}}}
//{{{  multiPVSet

function multiPVSet (slot, move, score) {

  multiPVMove[slot]  = move;
  multiPVScore[slot] = score;
  multiPVPvLen[slot] = rootNode.pvLen;

  multiPVPv.set(rootNode.pv.subarray(0, rootNode.pvLen), slot * MAX_MOVES);

  if (slot >= multiPVNum)
    multiPVNum = slot + 1;

}

//}}}
//{{{  multiPVSort

function multiPVSort (n) {

  const scratch = MAX_MULTIPV - 1;

  let i = n - 1;

  if (i <= 0 || multiPVScore[i] <= multiPVScore[i-1])
    return;

  multiPVCopy(scratch, i);

  while (i > 0 && multiPVScore[i-1] < multiPVScore[scratch]) {
    multiPVCopy(i, i-1);
    i--;
  }

  multiPVCopy(i, scratch);

}

//}}}

let rootNumExcluded = 0;  // see rootSearch()
let rootNumLegal    = 0;

//{{{  isRootExcluded

function rootIsExcluded (move) {

  const m = move & MOVE_CLEAN_MASK;

  for (let i=0; i < rootNumExcluded; i++) {
    if ((multiPVMove[i] & MOVE_CLEAN_MASK) === m)
      return 1;
  }

  return 0;

}

//}}}

let reportedMove = 0;  // the first move of the last pv sent

//{{{  report

function report (units, value, depth, bound) {

  reportedMove = rootNode.pvLen > 0 ? rootNode.pv[rootNode.pvLen-1] : 0;

  let pvStr = 'pv';
  for (let i=rootNode.pvLen-1; i >= 0; i--)
    pvStr += ' ' + formatMove(rootNode.pv[i]);

  const tim     = now() - statsStartTime;
  const nps     = (statsNodes * 1000) / tim | 0;
  const nodeStr = 'nodes ' + statsNodes + ' time ' + tim + ' nps ' + nps;

  const depthStr = 'depth ' + depth + ' seldepth ' + statsSelDepth;
  const scoreStr = 'score ' + units + ' ' + value + (bound ? ' ' + bound : '');  // e.g. score cp 20 upperbound
  const hashStr  = 'hashfull ' + (1000 * ttHashUsed / ttSize | 0);

  uciSend('info', depthStr, scoreStr, nodeStr, hashStr, pvStr);

}

//}}}
//{{{  reportScore

function reportScore (score, depth, bound) {

  if (Math.abs(score) > MINMATE) {

    let mateScore = (MATE - Math.abs(score) + 1) / 2 | 0;
    if (score < 0)
      mateScore = -mateScore;

    report('mate', mateScore, depth, bound);

  }

  else {

    report('cp', score, depth, bound);

  }

}

//}}}
//{{{  reportMultiPV

function reportMultiPV (depth) {

  const tim     = now() - statsStartTime;
  const nps     = (statsNodes * 1000) / tim | 0;
  const nodeStr = 'nodes ' + statsNodes + ' time ' + tim + ' nps ' + nps;

  const depthStr = 'depth ' + depth + ' seldepth ' + statsSelDepth;
  const hashStr  = 'hashfull ' + (1000 * ttHashUsed / ttSize | 0);

  const n = Math.min(multiPV, multiPVNum);

  for (let i = 0; i < n; i++) {

    const pvLen = multiPVPvLen[i];
    const pvOff = i * MAX_MOVES;
    const s     = multiPVScore[i];

    let pvStr = 'pv';
    for (let j = pvLen - 1; j >= 0; j--)
      pvStr += ' ' + formatMove(multiPVPv[pvOff + j]);

    let scoreStr = '';
    if (Math.abs(s) > MINMATE) {
      let mateScore = (MATE - Math.abs(s) + 1) / 2 | 0;
      if (s < 0)
        mateScore = -mateScore;
      scoreStr = 'score mate ' + mateScore;
    }
    else {
      scoreStr = 'score cp ' + s;
    }

    uciSend('info', depthStr, 'multipv', (i + 1), scoreStr, nodeStr, hashStr, pvStr);
  }
}

//}}}
//{{{  collectPV

function collectPV(node, move) {

  const cNode = node.childNode;

  node.pv.set(cNode.pv.subarray(0, cNode.pvLen), 0);

  node.pvLen            = cNode.pvLen;
  node.pv[node.pvLen++] = move;

}

//}}}

//}}}
//{{{  go
//
// When canYield is set (commands from stdin/onmessage), go() yields to the
// host after each rootSearch so stop/isready/quit can be picked up from
// the command queue. When not set (bench etc.) there are no awaits so go()
// runs synchronously as before.
//
// go() is Ethereal shaped ish.
//

async function go (maxPly, canYield) {

  let bestMoveStr = '';
  let alpha       = 0;
  let beta        = 0;
  let score       = 0;
  let delta       = 0;
  let depth       = 0;

  const numLines = Math.min(multiPV, MAX_MULTIPV - 1);

  multiPVNum      = 0;
  rootNumExcluded = 0;
  rootNumLegal    = 0;

  for (let ply=1; ply <= maxPly; ply++) {

    //{{{  id

    for (let pvIdx=0; pvIdx < numLines; pvIdx++) {

      // one line. slots 0..pvIdx-1 hold the lines found so far in this iteration and are
      // excluded by rootSearch; slots pvIdx.. still hold the previous iteration's lines.

      rootNumExcluded = pvIdx;

      alpha = -INF;
      beta  = INF;
      delta = 10;
      depth = ply;

      if (ply >= 4 && pvIdx < multiPVNum) {
        alpha = Math.max(-INF, multiPVScore[pvIdx] - delta);
        beta  = Math.min(INF,  multiPVScore[pvIdx] + delta);
      }

      //{{{  asp

      while (1) {

        score = rootSearch(rootNode, depth, bdTurn, alpha, beta);

        if (statsTimeOut || rootNumLegal === 0)
          break;

        delta += delta/2 | 0;

        if (score <= alpha) {
          //{{{  upper bound

          beta  = Math.min(INF, ((alpha + beta) / 2) | 0);
          alpha = Math.max(-INF, alpha - delta);

          if (numLines === 1)
            reportScore(score, depth, 'upperbound');

          if (pvIdx === 0 && !statsSoftNodes)
            statsBestMove = 0;
          //}}}
        }

        else if (score >= beta) {
          //{{{  lower bound

          beta = Math.min(INF, beta + delta);

          if (numLines === 1)
            reportScore(score, depth, 'lowerbound');

          depth = Math.max(1, depth - (Math.abs(score) < MINMATE ? 1 : 0))
          //}}}
        }

        else {
          //{{{  exact

          multiPVSet(pvIdx, statsBestMove, score);

          if (numLines === 1) {

            reportScore(score, depth);

          }

          else {

            multiPVSort(pvIdx + 1);

            statsBestMove  = multiPVMove[0];
            statsBestScore = multiPVScore[0];

            reportMultiPV(depth);

          }

          break;

          //}}}
        }

        if (canYield && await checkStop())
          break;
      }

      //}}}

      if (statsTimeOut || rootNumLegal <= 1)
        break;  // out of time, or this line used the last legal move so there are no more lines

    }
    //}}}

    if (statsTimeOut)
      break;

    // soft node limit: stop between iterations once the node count is reached

    if (statsBestMove && statsSoftNodes > 0 && statsNodes >= statsSoftNodes)
      break;

    if (canYield && await checkStop())
      break;

  }

  //{{{  send best move

  // a move that became best in an iteration that then ran out of time has not
  // been reported yet. report it so that the last pv starts with the bestmove

  const pvMove = rootNode.pvLen > 0 ? rootNode.pv[rootNode.pvLen-1] : 0;

  if (numLines === 1 && statsBestMove !== 0 && statsBestMove !== reportedMove && pvMove === statsBestMove)
    reportScore(statsBestScore, depth);

  // multipv with nothing reported yet (a single legal move stops the search at ply 1)

  if (numLines > 1 && multiPVNum === 0 && statsBestMove !== 0) {
    multiPVSet(0, statsBestMove, statsBestScore);
    reportMultiPV(depth);
  }

  // after a fail low statsBestMove is 0, so fall back to the last exact result.
  // with more than one line statsBestMove may be a lower line's move if the search
  // was stopped part way through an iteration, so use the best complete line

  let bestMove = statsBestMove || (multiPVNum ? multiPVMove[0] : 0);

  if (numLines > 1 && multiPVNum > 0)
    bestMove = multiPVMove[0];

  bestMoveStr = formatMove(bestMove);

  uciSend('bestmove', bestMoveStr);

  //}}}

}


//}}}
//{{{  rootSearch

function rootSearch (node, depth, turn, alpha, beta) {

  node.pvLen = 0;

  //{{{  check time

  if (node.childNode === null) {
    statsTimeOut = 1;
    return 0;
  }
  //}}}

  countNode();

  const nextTurn = turn ^ COLOR_MASK;
  const oAlpha   = alpha;
  const inCheck  = isKingAttacked(nextTurn);
  const doLMR    = (depth >= 3) | 0;

  let numLegalMoves = 0;
  let numPrunes     = 0;
  let numQuiets     = 0;
  let move          = 0;
  let bestMove      = 0;
  let score         = 0;
  let bestScore     = -INF;
  let R             = 0;
  let E             = 0;

  // the tt entry for the root gives the move to try first and the static eval

  const tti = ttGet();

  node.hashMove = ttGetMove(tti);
  node.inCheck  = inCheck;
  node.ev       = tti !== TT_MISS ? ttEval[tti] : evaluate(node, turn);

  cache(node);
  genMoves(node, turn);

  while ((move = getNextMove(node)) !== 0) {

    if (rootNumExcluded !== 0 && rootIsExcluded(move) !== 0)
      continue;  // multipv: already a line in this iteration

    makeMoveA(node, move);

    //{{{  legal?

    if ((move & MOVE_LEGAL_MASK) === 0 && isKingAttacked(nextTurn) !== 0) {

      unmakeMove(node, move);

      uncacheA(node);

      continue;

    }
    //}}}

    numLegalMoves++;
    if (node.base <= BASE_PRUNABLE)
      numPrunes++;

    if (statsNodes > 10000000)
      uciSend('info currmove ' + formatMove(move) + ' currmovenumber ' + numLegalMoves);

    //{{{  extend / reduce

    E = 0;
    R = 0;

    if (inCheck !== 0) {
      E = 1;
    }

    else if (doLMR !== 0 && numLegalMoves > 4) {
      R = LMR_LOOKUP[(depth << 8) + numPrunes];
    }

    //}}}
    //{{{  search

    const nullWindow = (numLegalMoves > 1 || R) | 0;

    score = alpha;

    if (nullWindow !== 0)
      score = -search(node.childNode, depth+E-R-1, nextTurn, -alpha-1, -alpha);

    if (statsTimeOut === 0 && (nullWindow === 0 || score > alpha))
      score = -search(node.childNode, depth+E-1, nextTurn, -beta, -alpha);

    //}}}

    unmakeMove(node, move);

    uncacheA(node);

    if (statsTimeOut !== 0)
      return 0;

    if (score > bestScore) {

      //{{{  new best move

      bestScore = score;
      bestMove  = move;

      if (bestScore > alpha) {
        //{{{  alpha raise

        collectPV(node, move);

        alpha = bestScore;

        statsBestMove  = bestMove;
        statsBestScore = bestScore;

        if (bestScore >= beta) {
          //{{{  beta cutoff

          addKiller(node, bestScore, bestMove);

          if ((move & MOVE_NOISY_MASK) === 0)
            updateHistory(node, numQuiets, depth, bestMove);

          if (rootNumExcluded === 0)
            ttPut(TT_BETA, depth, bestScore, bestMove, node.ply, alpha, beta, node.ev);

          return bestScore;
          //}}}
        }

        //}}}
      }

      //}}}

    }

    if ((move & MOVE_NOISY_MASK) === 0)
      node.quiets[numQuiets++] = move;  // no cutoff, so a candidate for a history malus

  }

  rootNumLegal = numLegalMoves;

  if (rootNumExcluded !== 0)
    return bestScore;  // multipv: a restricted move set, so not the position's score; keep it out of the tt

  if (numLegalMoves === 1)
    statsTimeOut = 1;  // only one legal move so don't waste any more time

  if (numLegalMoves === 0) {
    statsTimeOut = 1;  // silly position
    statsBestMove = 0;
    statsBestScore = 0;
  }

  if (bestScore > oAlpha) {
    ttPut(TT_EXACT, depth, bestScore, bestMove, node.ply, alpha, beta, node.ev);
    return bestScore;
  }
  else {
    ttPut(TT_ALPHA, depth, bestScore, bestMove, node.ply, alpha, beta, node.ev);
    return bestScore;
  }

}

//}}}
//{{{  search

function search (node, depth, turn, alpha, beta) {

  node.pvLen = 0;

  //{{{  out of plies?

  if (node.childNode === null) {
    statsTimeOut = 1;
    return 0;
  }

  //}}}

  if (node.ply > statsSelDepth)
    statsSelDepth = node.ply;

  const nextTurn = turn ^ COLOR_MASK;
  const pvNode   = (beta !== (alpha + 1)) | 0;

  //{{{  mate distance pruning

  const matingValue1 = MATE - node.ply;

  if (matingValue1 < beta) {
     beta = matingValue1;
     if (alpha >= matingValue1)
       return matingValue1;
  }

  const matingValue2 = -MATE + node.ply;

  if (matingValue2 > alpha) {
     alpha = matingValue2;
     if (beta <= matingValue2)
       return matingValue2;
  }

  //}}}
  //{{{  check for draws

  if (isDraw() !== 0)
    return 0;

  //}}}

  const inCheck = isKingAttacked(nextTurn);

  //{{{  horizon?

  if (inCheck === 0 && depth <= 0)
    return qSearch(node, -1, turn, alpha, beta);

  depth = Math.max(depth,0);

  //}}}
  //{{{  count the node, stop?
  //
  // Positions handed to qSearch() above are counted there.
  //

  countNode();

  if (statsTimeOut !== 0)
    return 0;

  //}}}

  let score = 0;

  //{{{  check tt

  // A tt entry gives a move to try first and the static eval whatever depth it was
  // searched to. Its score can stand in for this search only if it was searched at
  // least this deep, and then only if it is exact or its bound is enough to cut.

  const tti = ttGet();

  node.hashMove = ttGetMove(tti);

  if (tti !== TT_MISS && pvNode === 0 && ttDepth[tti] >= depth) {

    const hashType  = ttType[tti];
    const hashScore = ttGetScore(tti, node.ply);

    if (hashType === TT_EXACT || (hashType === TT_ALPHA && hashScore <= alpha) || (hashType === TT_BETA && hashScore >= beta))
      return hashScore;

  }

  //}}}

  const doBeta = ((pvNode === 0 && inCheck === 0 && beta < MINMATE)) | 0;

  let R = 0;
  let E = 0;

  const ev = tti !== TT_MISS ? ttEval[tti] : evaluate(node, turn);

  //{{{  improving

  let improving = 0;

  if (inCheck === 0) {
    const n2 = node.grandparentNode;
    if (n2 !== null) {
      if (n2.inCheck === 0 && ev > n2.ev)
        improving = 1;
      else if (n2.inCheck !== 0) {
        const n4 = n2.grandparentNode;
        if (n4 !== null && n4.inCheck === 0 && ev > n4.ev)
          improving = 1;
      }
    }
  }

  //}}}
  //{{{  beta prune

  if (doBeta !== 0 && depth <= 8 && (ev - Math.imul(depth, 100)) >= (beta - Math.imul(improving, 50)))
    return ev;

  //}}}
  //{{{  alpha prune

  // hack if (pvNode == 0 && inCheck === 0 && alpha > -MINMATE && depth <= 4 && (ev + 900 * depth) <= alpha) {
    //const qs = qSearch(node, -1, turn, alpha, alpha + 1);
    //if (qs <= alpha) {
      //return qs;
    //}
  //}

  //}}}

  node.inCheck = inCheck;
  node.ev      = ev;

  cache(node);

  //{{{  null move pruning

  //const isPawnEG = (wCount == wCounts[PAWN]+1 && bCount == bCounts[PAWN]+1) | 0;

  if (doBeta !== 0 && depth > 2 && ev > beta) {

    R = 3 + improving;

    loHash ^= loEP[bdEp];
    hiHash ^= hiEP[bdEp];

    bdEp = 0;

    loHash ^= loEP[bdEp];
    hiHash ^= hiEP[bdEp];

    loHash ^= loTurn;
    hiHash ^= hiTurn;

    repLo = repHi;

    node.childNode.ueType   = UE_COPY;  // same pieces, so the child inherits our accumulators
    node.childNode.accDirty = 1;

    score = -search(node.childNode, depth-R-1, nextTurn, -beta, -beta+1);

    uncacheA(node);

    if (score >= beta) {
      if (score > MINMATE)
        score = beta;
      return score;
    }

    if (statsTimeOut !== 0)
      return 0;
  }

  //}}}

  const oAlpha = alpha;
  const doFP   = (inCheck === 0 && depth <= 4) | 0;
  const doLMR  = (inCheck === 0 && depth >= 3) | 0;
  const doLMP  = (pvNode === 0 && inCheck === 0 && depth <= 2) | 0;
  const doIIR  = (node.hashMove === 0 && pvNode !== 0 && depth > 3) | 0;

  let bestScore     = -INF;
  let move          = 0;
  let bestMove      = 0;
  let numLegalMoves = 0;
  let numPrunes     = 0;
  let numQuiets     = 0;

  //{{{  IIR

  // https://www.talkchess.com/forum3/viewtopic.php?f=7&t=74769

  if (doIIR !== 0) {

    depth -= 1;

  }

  //}}}

  genMoves(node, turn);

  while ((move = getNextMove(node)) !== 0) {

    //{{{  prune

    const prune = (numLegalMoves > 0 && node.base <= BASE_PRUNABLE && alpha > -MINMATE) | 0;

    if (doLMP !== 0 && prune !== 0 && numPrunes > Math.imul(depth, 5))
      continue;

    if (doFP !== 0 && prune !== 0 && (ev + Math.imul(depth, 120)) < alpha)
      continue;

    //}}}

    makeMoveA(node, move);

    //{{{  legal?

    if ((move & MOVE_LEGAL_MASK) === 0 && isKingAttacked(nextTurn) !== 0) {

      unmakeMove(node, move);

      uncacheA(node);

      continue;

    }

    //}}}

    numLegalMoves++;
    if (node.base <= BASE_PRUNABLE)
      numPrunes++;

    //{{{  extend / reduce

    E = 0;
    R = 0;

    if (inCheck !== 0 && (pvNode !== 0 || depth < 5)) {
      E = 1;
    }

    else if (doLMR !== 0 && numLegalMoves > 4) {
      R = LMR_LOOKUP[(depth << 8) + numPrunes];
    }

    //}}}
    //{{{  search

    const nullWindow = ((pvNode !== 0 && numLegalMoves > 1) || R) | 0;

    score = alpha;

    if (nullWindow !== 0)
      score = -search(node.childNode, depth+E-R-1, nextTurn, -alpha-1, -alpha);

    if (statsTimeOut === 0 && (nullWindow === 0 || score > alpha))
      score = -search(node.childNode, depth+E-1, nextTurn, -beta, -alpha);

    //}}}

    unmakeMove(node, move);
    uncacheA(node);

    if (statsTimeOut !== 0)
      return 0;

    if (score > bestScore) {

      bestScore = score;
      bestMove  = move;

      if (bestScore > alpha) {
        //{{{  alpha raise

        if (pvNode !== 0)
          collectPV(node, move);

        alpha = bestScore;

        if (bestScore >= beta) {
          //{{{  beta cutoff

          addKiller(node, bestScore, bestMove);

          if ((move & MOVE_NOISY_MASK) === 0)
            updateHistory(node, numQuiets, depth, bestMove);

          ttPut(TT_BETA, depth, bestScore, bestMove, node.ply, alpha, beta, ev);

          return bestScore;
          //}}}
        }

        //}}}
      }
    }

    if ((move & MOVE_NOISY_MASK) === 0)
      node.quiets[numQuiets++] = move;  // no cutoff, so a candidate for a history malus

  }

  //{{{  mate / draw

  if (numLegalMoves === 0) {

    if (inCheck !== 0) {
      //ttPut(TT_EXACT, depth, -MATE + node.ply, 0, node.ply, alpha, beta, ev);
      return -MATE + node.ply;
    }

    else {
      //ttPut(TT_EXACT, depth, 0, 0, node.ply, alpha, beta, ev);
      return 0;
    }

  }

  //}}}

  if (bestScore > oAlpha) {
    ttPut(TT_EXACT, depth, bestScore, bestMove, node.ply, alpha, beta, ev);
    return bestScore;
  }

  else {
    ttPut(TT_ALPHA, depth, bestScore, bestMove, node.ply, alpha, beta, ev);
    return bestScore;
  }

}

//}}}
//{{{  qsearch

function qSearch (node, depth, turn, alpha, beta) {

  //{{{  init

  node.pvLen = 0;

  // if this finds that it is time to stop the qsearch is not abandoned: it is short
  // and its result is good. search() stops when it gets back there.

  countNode();

  if (node.ply > statsSelDepth)
    statsSelDepth = node.ply;

  if (node.childNode === null)
    return evaluate(node, turn);

  const nextTurn = turn ^ COLOR_MASK;

  if (isDraw() !== 0)
    return 0;

  // as in search(), except that any entry has been searched deeply enough for here

  const tti = ttGet();

  node.hashMove = ttGetMove(tti);

  if (tti !== TT_MISS) {

    const hashType  = ttType[tti];
    const hashScore = ttGetScore(tti, node.ply);

    if (hashType === TT_EXACT || (hashType === TT_ALPHA && hashScore <= alpha) || (hashType === TT_BETA && hashScore >= beta))
      return hashScore;

  }

  let score = 0;

  const ev = tti !== TT_MISS ? ttEval[tti] : evaluate(node, turn);

  if (ev >= beta)
    return ev;
  if (ev >= alpha)
    alpha = ev;

  node.inCheck = 0;  // but not used

  cache(node);

  //}}}

  genQMoves(node, turn);

  let numLegalMoves = 0;
  let move          = 0;

  while ((move = getNextMove(node)) !== 0) {
    //{{{  move loop

    //{{{  prune

    if ((wCount + bCount) > 6 && (move & MOVE_SPECIAL_MASK) === 0 && ev + 200 + MATERIAL[((move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS) & PIECE_MASK] < alpha)
      continue;

    if (quickSee(turn, move) < 0)
      continue;
    //}}}

    makeMoveA(node, move);

    //{{{  legal?

    if (isKingAttacked(nextTurn) !== 0) {

      unmakeMove(node, move);

      uncacheA(node);

      continue;

    }

    //}}}

    numLegalMoves++;

    score = -qSearch(node.childNode, depth-1, nextTurn, -beta, -alpha);

    unmakeMove(node, move);
    uncacheA(node);

    if (score > alpha) {
      //{{{  alpha raise

      if (score >= beta) {
        ttPut(TT_BETA, 0, beta, 0, node.ply, alpha, beta, ev);
        return score;
      }

      alpha = score;
      //}}}
    }

    //}}}
  }

  ttPut(TT_ALPHA, 0, alpha, 0, node.ply, alpha, beta, ev);

  return alpha;

}

//}}}
//{{{  perft

function perft (node, depth, turn) {

  //{{{  init

  if (depth === 0)
    return 1;

  const nextTurn = turn ^ COLOR_MASK;
  const inCheck  = isKingAttacked(nextTurn);

  let totalNodes = 0;
  let move       = 0;

  node.inCheck = inCheck;

  node.rights = bdRights;
  node.ep     = bdEp;
  node.repLo  = repLo;
  node.repHi  = repHi;

  //}}}

  genMoves(node, turn);

  while ((move = getNextMove(node)) !== 0) {

    //{{{  move loop

    makeMoveA(node, move);

    if ((move & MOVE_LEGAL_MASK) === 0 && isKingAttacked(nextTurn) !== 0) {

      //{{{  legal?

      unmakeMove(node, move);

      bdRights = node.rights;
      bdEp     = node.ep;
      repLo    = node.repLo;
      repHi    = node.repHi;

      continue;

      //}}}

    }

    totalNodes += perft(node.childNode, depth-1, nextTurn);

    unmakeMove(node, move);

    bdRights = node.rights;
    bdEp     = node.ep;
    repLo    = node.repLo;
    repHi    = node.repHi;
    //}}}

  }

  return totalNodes;

}

//{{{  fens

const PERFTFENS = [
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 2, 400,       'cpw-pos1-2'],
  ['fen 4k3/8/8/8/8/8/R7/R3K2R                                  w Q    -  0 1', 3, 4729,      'castling-2'],
  ['fen 4k3/8/8/8/8/8/R7/R3K2R                                  w K    -  0 1', 3, 4686,      'castling-3'],
  ['fen 4k3/8/8/8/8/8/R7/R3K2R                                  w -    -  0 1', 3, 4522,      'castling-4'],
  ['fen r3k2r/r7/8/8/8/8/8/4K3                                  b kq   -  0 1', 3, 4893,      'castling-5'],
  ['fen r3k2r/r7/8/8/8/8/8/4K3                                  b q    -  0 1', 3, 4729,      'castling-6'],
  ['fen r3k2r/r7/8/8/8/8/8/4K3                                  b k    -  0 1', 3, 4686,      'castling-7'],
  ['fen r3k2r/r7/8/8/8/8/8/4K3                                  b -    -  0 1', 3, 4522,      'castling-8'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 0, 1,         'cpw-pos1-0'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 1, 20,        'cpw-pos1-1'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 3, 8902,      'cpw-pos1-3'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 4, 197281,    'cpw-pos1-4'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 5, 4865609,   'cpw-pos1-5'],
  ['fen rnbqkb1r/pp1p1ppp/2p5/4P3/2B5/8/PPP1NnPP/RNBQK2R        w KQkq -  0 1', 1, 42,        'cpw-pos5-1'],
  ['fen rnbqkb1r/pp1p1ppp/2p5/4P3/2B5/8/PPP1NnPP/RNBQK2R        w KQkq -  0 1', 2, 1352,      'cpw-pos5-2'],
  ['fen rnbqkb1r/pp1p1ppp/2p5/4P3/2B5/8/PPP1NnPP/RNBQK2R        w KQkq -  0 1', 3, 53392,     'cpw-pos5-3'],
  ['fen r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -  0 1', 1, 48,        'cpw-pos2-1'],
  ['fen r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -  0 1', 2, 2039,      'cpw-pos2-2'],
  ['fen r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -  0 1', 3, 97862,     'cpw-pos2-3'],
  ['fen 8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8                         w -    -  0 1', 5, 674624,    'cpw-pos3-5'],
  ['fen n1n5/PPPk4/8/8/8/8/4Kppp/5N1N                           b -    -  0 1', 1, 24,        'prom-1    '],
  ['fen 8/5bk1/8/2Pp4/8/1K6/8/8                                 w -    d6 0 1', 6, 824064,    'ccc-1     '],
  ['fen 8/8/1k6/8/2pP4/8/5BK1/8                                 b -    d3 0 1', 6, 824064,    'ccc-2     '],
  ['fen 8/8/1k6/2b5/2pP4/8/5K2/8                                b -    d3 0 1', 6, 1440467,   'ccc-3     '],
  ['fen 8/5k2/8/2Pp4/2B5/1K6/8/8                                w -    d6 0 1', 6, 1440467,   'ccc-4     '],
  ['fen 5k2/8/8/8/8/8/8/4K2R                                    w K    -  0 1', 6, 661072,    'ccc-5     '],
  ['fen 4k2r/8/8/8/8/8/8/5K2                                    b k    -  0 1', 6, 661072,    'ccc-6     '],
  ['fen 3k4/8/8/8/8/8/8/R3K3                                    w Q    -  0 1', 6, 803711,    'ccc-7     '],
  ['fen r3k3/8/8/8/8/8/8/3K4                                    b q    -  0 1', 6, 803711,    'ccc-8     '],
  ['fen r3k2r/1b4bq/8/8/8/8/7B/R3K2R                            w KQkq -  0 1', 4, 1274206,   'ccc-9     '],
  ['fen r3k2r/7b/8/8/8/8/1B4BQ/R3K2R                            b KQkq -  0 1', 4, 1274206,   'ccc-10    '],
  ['fen r3k2r/8/3Q4/8/8/5q2/8/R3K2R                             b KQkq -  0 1', 4, 1720476,   'ccc-11    '],
  ['fen r3k2r/8/5Q2/8/8/3q4/8/R3K2R                             w KQkq -  0 1', 4, 1720476,   'ccc-12    '],
  ['fen 2K2r2/4P3/8/8/8/8/8/3k4                                 w -    -  0 1', 6, 3821001,   'ccc-13    '],
  ['fen 3K4/8/8/8/8/8/4p3/2k2R2                                 b -    -  0 1', 6, 3821001,   'ccc-14    '],
  ['fen 8/8/1P2K3/8/2n5/1q6/8/5k2                               b -    -  0 1', 5, 1004658,   'ccc-15    '],
  ['fen 5K2/8/1Q6/2N5/8/1p2k3/8/8                               w -    -  0 1', 5, 1004658,   'ccc-16    '],
  ['fen 4k3/1P6/8/8/8/8/K7/8                                    w -    -  0 1', 6, 217342,    'ccc-17    '],
  ['fen 8/k7/8/8/8/8/1p6/4K3                                    b -    -  0 1', 6, 217342,    'ccc-18    '],
  ['fen 8/P1k5/K7/8/8/8/8/8                                     w -    -  0 1', 6, 92683,     'ccc-19    '],
  ['fen 8/8/8/8/8/k7/p1K5/8                                     b -    -  0 1', 6, 92683,     'ccc-20    '],
  ['fen K1k5/8/P7/8/8/8/8/8                                     w -    -  0 1', 6, 2217,      'ccc-21    '],
  ['fen 8/8/8/8/8/p7/8/k1K5                                     b -    -  0 1', 6, 2217,      'ccc-22    '],
  ['fen 8/k1P5/8/1K6/8/8/8/8                                    w -    -  0 1', 7, 567584,    'ccc-23    '],
  ['fen 8/8/8/8/1k6/8/K1p5/8                                    b -    -  0 1', 7, 567584,    'ccc-24    '],
  ['fen 8/8/2k5/5q2/5n2/8/5K2/8                                 b -    -  0 1', 4, 23527,     'ccc-25    '],
  ['fen 8/5k2/8/5N2/5Q2/2K5/8/8                                 w -    -  0 1', 4, 23527,     'ccc-26    '],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 6, 119060324, 'cpw-pos1-6'],
  ['fen 8/p7/8/1P6/K1k3p1/6P1/7P/8                              w -    -  0 1', 8, 8103790,   'jvm-7     '],
  ['fen n1n5/PPPk4/8/8/8/8/4Kppp/5N1N                           b -    -  0 1', 6, 71179139,  'jvm-8     '],
  ['fen r3k2r/p6p/8/B7/1pp1p3/3b4/P6P/R3K2R                     w KQkq -  0 1', 6, 77054993,  'jvm-9     '],
  ['fen 8/5p2/8/2k3P1/p3K3/8/1P6/8                              b -    -  0 1', 8, 64451405,  'jvm-11    '],
  ['fen r3k2r/pb3p2/5npp/n2p4/1p1PPB2/6P1/P2N1PBP/R3K2R         w KQkq -  0 1', 5, 29179893,  'jvm-12    '],
  ['fen 8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8                         w -    -  0 1', 7, 178633661, 'jvm-10    '],
  ['fen r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -  0 1', 5, 193690690, 'jvm-6     '],
  ['fen 8/2pkp3/8/RP3P1Q/6B1/8/2PPP3/rb1K1n1r                   w -    -  0 1', 6, 181153194, 'ob1       '],
  ['fen rnbqkb1r/ppppp1pp/7n/4Pp2/8/8/PPPP1PPP/RNBQKBNR         w KQkq f6 0 1', 6, 244063299, 'jvm-5     '],
  ['fen 8/2ppp3/8/RP1k1P1Q/8/8/2PPP3/rb1K1n1r                   w -    -  0 1', 6, 205552081, 'ob2       '],
  ['fen 8/8/3q4/4r3/1b3n2/8/3PPP2/2k1K2R                        w K    -  0 1', 6, 207139531, 'ob3       '],
  ['fen 4r2r/RP1kP1P1/3P1P2/8/8/3ppp2/1p4p1/4K2R                b K    -  0 1', 6, 314516438, 'ob4       '],
  ['fen r3k2r/8/8/8/3pPp2/8/8/R3K1RR                            b KQkq e3 0 1', 6, 485647607, 'jvm-1     '],
  ['fen 8/3K4/2p5/p2b2r1/5k2/8/8/1q6                            b -    -  0 1', 7, 493407574, 'jvm-4     '],
  ['fen r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1   w kq   -  0 1', 6, 706045033, 'jvm-2     '],
  ['fen r6r/1P4P1/2kPPP2/8/8/3ppp2/1p4p1/R3K2R                  w KQ   -  0 1', 6, 975944981, 'ob5       '],
  ['fen 4k2r/6K1/8/8/8/8/8/8                                    b k    -  0 1', 4, 2219,      'castling-9'],
  ['fen r3k3/2K5/8/8/8/8/8/8                                    b q    -  0 1', 4, 4999,      'castling-10']
];

//}}}
//}}}

//{{{  initSearch

function initSearch () {

  for (let p=0; p < MAX_PLY; p++) {
    for (let m=0; m < MAX_MOVES; m++) {
      LMR_LOOKUP[(p << 8) + m] = (1 + p/5 + m/20) | 0;  // stride MAX_MOVES
    }
  }

}

//}}}

//}}}
//{{{  uci

const nodeHost  = (typeof process)    != 'undefined';  // node
const shellHost = (typeof lozzaShell) != 'undefined';  // standalone binary, see shell/src/main.rs
                                                       // otherwise a web worker
const fs = (nodeHost) ? require('fs') : 0;

let silentMode = 0;

//{{{  hostExit

function hostExit () {

  if (nodeHost)
    process.exit();

  else if (shellHost)
    lozzaShell.exit(0);

}

//}}}

//{{{  bench fens
//
// bench fens from https://github.com/AndyGrant/Ethereal
//

const BENCHFENS = [

"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkQ - 0 1",
"r3k2r/2pb1ppp/2pp1q2/p7/1nP1B3/1P2P3/P2N1PPP/R2QK2R w KQkq a6 0 14",
"4rrk1/2p1b1p1/p1p3q1/4p3/2P2n1p/1P1NR2P/PB3PP1/3R1QK1 b - - 2 24",
"r3qbrk/6p1/2b2pPp/p3pP1Q/PpPpP2P/3P1B2/2PB3K/R5R1 w - - 16 42",
"6k1/1R3p2/6p1/2Bp3p/3P2q1/P7/1P2rQ1K/5R2 b - - 4 44",
"8/8/1p2k1p1/3p3p/1p1P1P1P/1P2PK2/8/8 w - - 3 54",
"7r/2p3k1/1p1p1qp1/1P1Bp3/p1P2r1P/P7/4R3/Q4RK1 w - - 0 36",
"r1bq1rk1/pp2b1pp/n1pp1n2/3P1p2/2P1p3/2N1P2N/PP2BPPP/R1BQ1RK1 b - - 2 10",
"3r3k/2r4p/1p1b3q/p4P2/P2Pp3/1B2P3/3BQ1RP/6K1 w - - 3 87",
"2r4r/1p4k1/1Pnp4/3Qb1pq/8/4BpPp/5P2/2RR1BK1 w - - 0 42",
"4q1bk/6b1/7p/p1p4p/PNPpP2P/KN4P1/3Q4/4R3 b - - 0 37",
"2q3r1/1r2pk2/pp3pp1/2pP3p/P1Pb1BbP/1P4Q1/R3NPP1/4R1K1 w - - 2 34",
"1r2r2k/1b4q1/pp5p/2pPp1p1/P3Pn2/1P1B1Q1P/2R3P1/4BR1K b - - 1 37",
"r3kbbr/pp1n1p1P/3ppnp1/q5N1/1P1pP3/P1N1B3/2P1QP2/R3KB1R b KQkq b3 0 17",
"8/6pk/2b1Rp2/3r4/1R1B2PP/P5K1/8/2r5 b - - 16 42",
"1r4k1/4ppb1/2n1b1qp/pB4p1/1n1BP1P1/7P/2PNQPK1/3RN3 w - - 8 29",
"8/p2B4/PkP5/4p1pK/4Pb1p/5P2/8/8 w - - 29 68",
"3r4/ppq1ppkp/4bnp1/2pN4/2P1P3/1P4P1/PQ3PBP/R4K2 b - - 2 20",
"5rr1/4n2k/4q2P/P1P2n2/3B1p2/4pP2/2N1P3/1RR1K2Q w - - 1 49",
"1r5k/2pq2p1/3p3p/p1pP4/4QP2/PP1R3P/6PK/8 w - - 1 51",
"q5k1/5ppp/1r3bn1/1B6/P1N2P2/BQ2P1P1/5K1P/8 b - - 2 34",
"r1b2k1r/5n2/p4q2/1ppn1Pp1/3pp1p1/NP2P3/P1PPBK2/1RQN2R1 w - - 0 22",
"r1bqk2r/pppp1ppp/5n2/4b3/4P3/P1N5/1PP2PPP/R1BQKB1R w KQkq - 0 5",
"r1bqr1k1/pp1p1ppp/2p5/8/3N1Q2/P2BB3/1PP2PPP/R3K2n b Q - 1 12",
"r1bq2k1/p4r1p/1pp2pp1/3p4/1P1B3Q/P2B1N2/2P3PP/4R1K1 b - - 2 19",
"r4qk1/6r1/1p4p1/2ppBbN1/1p5Q/P7/2P3PP/5RK1 w - - 2 25",
"r7/6k1/1p6/2pp1p2/7Q/8/p1P2K1P/8 w - - 0 32",
"r3k2r/ppp1pp1p/2nqb1pn/3p4/4P3/2PP4/PP1NBPPP/R2QK1NR w KQkq - 1 5",
"3r1rk1/1pp1pn1p/p1n1q1p1/3p4/Q3P3/2P5/PP1NBPPP/4RRK1 w - - 0 12",
"5rk1/1pp1pn1p/p3Brp1/8/1n6/5N2/PP3PPP/2R2RK1 w - - 2 20",
"8/1p2pk1p/p1p1r1p1/3n4/8/5R2/PP3PPP/4R1K1 b - - 3 27",
"8/4pk2/1p1r2p1/p1p4p/Pn5P/3R4/1P3PP1/4RK2 w - - 1 33",
"8/5k2/1pnrp1p1/p1p4p/P6P/4R1PK/1P3P2/4R3 b - - 1 38",
"8/8/1p1kp1p1/p1pr1n1p/P6P/1R4P1/1P3PK1/1R6 b - - 15 45",
"8/8/1p1k2p1/p1prp2p/P2n3P/6P1/1P1R1PK1/4R3 b - - 5 49",
"8/8/1p4p1/p1p2k1p/P2npP1P/4K1P1/1P6/3R4 w - - 6 54",
"8/8/1p4p1/p1p2k1p/P2n1P1P/4K1P1/1P6/6R1 b - - 6 59",
"8/5k2/1p4p1/p1pK3p/P2n1P1P/6P1/1P6/4R3 b - - 14 63",
"8/1R6/1p1K1kp1/p6p/P1p2P1P/6P1/1Pn5/8 w - - 0 67",
"1rb1rn1k/p3q1bp/2p3p1/2p1p3/2P1P2N/PP1RQNP1/1B3P2/4R1K1 b - - 4 23",
"4rrk1/pp1n1pp1/q5p1/P1pP4/2n3P1/7P/1P3PB1/R1BQ1RK1 w - - 3 22",
"r2qr1k1/pb1nbppp/1pn1p3/2ppP3/3P4/2PB1NN1/PP3PPP/R1BQR1K1 w - - 4 12",
"2r2k2/8/4P1R1/1p6/8/P4K1N/7b/2B5 b - - 0 55",
"6k1/5pp1/8/2bKP2P/2P5/p4PNb/B7/8 b - - 1 44",
"2rqr1k1/1p3p1p/p2p2p1/P1nPb3/2B1P3/5P2/1PQ2NPP/R1R4K w - - 3 25",
"r1b2rk1/p1q1ppbp/6p1/2Q5/8/4BP2/PPP3PP/2KR1B1R b - - 2 14",
"6r1/5k2/p1b1r2p/1pB1p1p1/1Pp3PP/2P1R1K1/2P2P2/3R4 w - - 1 36",
"rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2",
"2rr2k1/1p4bp/p1q1p1p1/4Pp1n/2PB4/1PN3P1/P3Q2P/2RR2K1 w - f6 0 20",
"3br1k1/p1pn3p/1p3n2/5pNq/2P1p3/1PN3PP/P2Q1PB1/4R1K1 w - - 0 23",
"2r2b2/5p2/5k2/p1r1pP2/P2pB3/1P3P2/K1P3R1/7R w - - 23 93"
];

//}}}

//{{{  uciSend

function uciSend () {

  if (silentMode)
    return;

  var s = '';

  for (var i = 0; i < arguments.length; i++)
    s += arguments[i] + ' ';

  //fs.writeSync(1, s + '\n');

  if (nodeHost || shellHost)
    console.log(s);
  else
    postMessage(s);

}

//}}}
//{{{  uciGetInt

function uciGetInt (tokens, key, def) {

  for (let i=0; i < tokens.length; i++)
    if (tokens[i] == key)
      if (i < tokens.length - 1)
        return parseInt(tokens[i+1]);

  return def;

}

//}}}
//{{{  uciGetStr

function uciGetStr (tokens, key, def) {

  const lkey = key.toLowerCase();

  for (let i=0; i < tokens.length; i++)
    if (tokens[i].toLowerCase() == lkey)
      if (i < tokens.length - 1)
        return tokens[i+1];

  return def;

}

//}}}
//{{{  uciGetArr

let uciArrLo = 0;  // set by uciGetArr
let uciArrHi = 0;

function uciGetArr (tokens, key, to) {

  var lo = 0;
  var hi = 0;

  for (let i=0; i < tokens.length; i++) {
    if (tokens[i] == key) {
      lo = i + 1;  //assumes at least one item
      hi = lo;
      for (let j=lo; j < tokens.length; j++) {
        if (tokens[j] == to)
          break;
        hi = j;
      }
    }
  }

  uciArrLo = lo;
  uciArrHi = hi;

}

//}}}
//{{{  uciExec
//
// canYield is only set by uciDrain. A go then returns its promise so the
// drain waits for the search to finish before running the next command.
//

function uciExec (commands, canYield) {

  const cmdList = commands.split('\n');

  for (let c=0; c < cmdList.length; c++ ) {

    let cmdStr = cmdList[c].replace(/(\r\n|\n|\r)/gm,"");

    cmdStr = cmdStr.trim();
    cmdStr = cmdStr.replace(/\s+/g,' ');

    const tokens = cmdStr.split(' ');

    let cmd = tokens[0];

    if (!cmd)
      continue;

    switch (cmd) {

      case 'isready': {
        // isready

        uciSend('readyok');

        break;

      }

      case 'position':
      case 'p': {
        // position

        if (ttSize == 1) {
          newGame();
        }

        let bd     = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
        let turn   = 'w';
        let rights = 'KQkq';
        let ep     = '-';

        uciGetArr(tokens, 'fen', 'moves');

        let lo = uciArrLo;
        let hi = uciArrHi;

        if (lo > 0) {
          if (lo <= hi) bd     = tokens[lo]; lo++;
          if (lo <= hi) turn   = tokens[lo]; lo++;
          if (lo <= hi) rights = tokens[lo]; lo++;
          if (lo <= hi) ep     = tokens[lo]; lo++;
        }

        const moves = [];

        uciGetArr(tokens, 'moves', 'fen');

        if (uciArrLo > 0) {
          for (var i=uciArrLo; i <= uciArrHi; i++)
            moves.push(tokens[i]);
        }

        position(bd, turn, rights, ep, moves);

        break;

      }

      case 'go':
      case 'g': {
        // go

        if (ttSize == 1) {
          newGame();
        }

        if (bdB[0] !== EDGE) {
          position('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR','w','KQkq','-',[]);
        }

        initStats();

        let depth     = Math.max(uciGetInt(tokens, 'depth', 0), uciGetInt(tokens, 'd', 0));
        let moveTime  = uciGetInt(tokens, 'movetime', 0);
        let maxNodes  = uciGetInt(tokens, 'nodes', 0);
        let wTime     = uciGetInt(tokens, 'wtime', 0);
        let bTime     = uciGetInt(tokens, 'btime', 0);
        let wInc      = uciGetInt(tokens, 'winc', 0);
        let bInc      = uciGetInt(tokens, 'binc', 0);
        let movesToGo = uciGetInt(tokens, 'movestogo', 0);

        let totTime = 0;
        let movTime = 0;
        let incTime = 0;

        if (depth <= 0)
          depth = MAX_PLY;

        depth = Math.min(depth, MAX_PLY - 1);  // ttDepth is int8 and LMR_LOOKUP has MAX_PLY rows

        if (moveTime > 0)
          statsMoveTime = moveTime;

        if (maxNodes > 0) {
          statsSoftNodes = maxNodes;
          statsHardNodes = maxNodes * NODES_HARD_MULT;
        }

        if (moveTime === 0) {

          if (movesToGo > 0)
            movesToGo += 2;
          else
            movesToGo = 30;

          if (bdTurn === WHITE) {
            totTime = wTime;
            incTime = wInc;
          }
          else {
            totTime = bTime;
            incTime = bInc;
          }

          movTime = myround(totTime / movesToGo) + incTime;
          movTime = Math.min(movTime, totTime / 2);  // a big increment must not allot more than the clock
          movTime = movTime * 0.95;

          if (movTime > 0)
            statsMoveTime = movTime | 0;

          if (statsMoveTime < 1 && (wTime || bTime))
            statsMoveTime = 1;
        }

        // hard limit for a fail low re-search: up to twice the soft limit but never more than half the clock

        statsHardTime = statsMoveTime;

        if (moveTime === 0 && totTime > 0)
          statsHardTime = Math.max(statsMoveTime, Math.min(statsMoveTime * 2, (totTime / 2) | 0));

        if (canYield)
          return go(depth, 1);

        go(depth, 0);

        break;

      }

      case 'ucinewgame':
      case 'u': {
        // ucinewgame

        newGame();

        break;

      }

      case 'setoption':
      case 'o': {
        // setoption

        const opt = uciGetStr(tokens, 'name', '').toLowerCase();

        if (opt == 'hash') {

          const mb = Math.max(uciGetInt(tokens, 'value', ttDefault), 1);

          ttResize(mb);

        }

        else if (opt == 'multipv') {

          multiPV = Math.max(uciGetInt(tokens, 'value', 1), 1);

        }

        break;

      }

      case 'quit':
      case 'q': {
        // quit

        hostExit();

        break;

      }

      case 'stop': {
        // stop

        break;

      }

      case 'uci': {
        // uci

        // e.g. Lozza 12.0 (dev wasm): dev = weights loaded from a file, wasm = using the wasm net kernel

        const dev  = (getWeights() === '') ? 'dev'  : '';
        const wasm = (net_kernel !== null) ? 'wasm' : '';
        const tags = (dev + ' ' + wasm).trim();

        if (tags !== '')
          uciSend('id name Lozza', BUILD, '(' + tags + ')');
        else
          uciSend('id name Lozza', BUILD);
        uciSend('id author Colin Jenkins');
        uciSend('option name Hash type spin default', ttDefault, 'min 1 max 1024');
        uciSend('option name MultiPV type spin default 1 min 1 max 500');
        uciSend('uciok');

        break;

      }

      case 'perft': {
        // perft

        uciExec('b');

        const depth1 = uciGetInt(tokens, 'depth', 0);
        const depth2 = uciGetInt(tokens, 'to', depth1);
        const warm = uciGetInt(tokens, 'warm', 0);

        for (let w=0; w < warm; w++) {
          for (let depth=depth1; depth <= depth2; depth++) {
            const nodes = perft(rootNode, depth, bdTurn);
          }
        }

        for (let depth=depth1; depth <= depth2; depth++) {
          const start = now();
          const nodes = perft(rootNode, depth, bdTurn);
          const elapsed = now() - start;
          const nps = nodes / elapsed * 1000 | 0;
          uciSend('depth', depth, 'nodes', nodes, 'time', elapsed, 'nps', nps);
        }

        break;

      }

      case 'eval':
      case 'e': {
        // eval

        const e = netEval(rootNode, bdTurn);

        uciSend(e);

        break;

      }

      case 'board':
      case 'b': {
        // board

        uciSend(formatFen(bdTurn));

        break;

      }

      case 'bench':
      case 'h': {
        // bench

        silentMode = 1;

        const depth = uciGetInt(tokens, 'depth', BENCH_DEPTH);
        const warm  = uciGetInt(tokens, 'warm', 1);

        // warmup

        for (let w=0; w < warm; w++) {

          for (var i=0; i < BENCHFENS.length; i++) {

            const fen = BENCHFENS[i];

            newGame();
            uciExec('position fen ' + fen);
            uciExec('id bench' + i);
            uciExec('go depth ' + depth);

          }

        }

        let nodes = 0;
        let start = now();

        for (let i=0; i < BENCHFENS.length; i++) {

          const fen = BENCHFENS[i];

          if (nodeHost)
            process.stdout.write(i.toString() + '\r');

          newGame();
          uciExec('position fen ' + fen);
          uciExec('id bench' + i);
          uciExec('go depth ' + depth);

          nodes += statsNodes;

        }

        silentMode = 0;

        const elapsed = now() - start;
        const nps = nodes/elapsed * 1000 | 0;

        uciSend('warm', warm, 'depth', depth, 'nodes', nodes, 'time', elapsed, 'nps', nps);

        break;

      }

      case 'qb': {
        // quick bench

        uciExec('bench warm 0');

        break;

      }

      case 'pt': {
        // perft tests

        let n = uciGetInt(tokens, 'n', PERFTFENS.length);

        silentMode = 1;

        const t1 = now();

        let errors = 0;
        let tot    = 0;  // @i64

        for (let i=0; i < n; i++) {

          const p = PERFTFENS[i];

          const fen   = p[0];
          const depth = p[1];
          const moves = p[2];
          const id    = p[3];

          newGame();
          uciExec('position ' + fen);

          const nodes = perft(rootNode, depth, bdTurn);

          tot += nodes;

          const t2     = now();
          const sec    = Math.round((t2-t1)/100)/10;
          const secStr = sec.toString().padStart(6, ' ');

          const diff = nodes - moves;

          let diffStr = '' + diff;

          if (diff) {
            errors += Math.abs(diff);
            diffStr = '\x1b[1m' + diff + '\x1b[0m';
          }

          silentMode = 0;
          uciSend(secStr, id, fen, depth, diffStr, nodes, moves);
          silentMode = 1;
        }

        silentMode = 0;

        const elapsed = now() - t1;
        const nps = tot/elapsed * 1000 | 0;

        uciSend('errors', errors, 'nodes', tot, 'nps', nps);

        break;

      }

      case 'et': {
        // eval tests

        for (let i=0; i < BENCHFENS.length; i++) {

          uciSend();

          const fen = BENCHFENS[i];

          newGame();
          uciExec('position fen ' + fen);
          uciSend(fen, 'fen')
          uciExec('e');

          const flippedFen = flipFen(fen);

          newGame();
          uciExec('position fen ' + flippedFen);
          uciSend(flippedFen, 'flipped fen')
          uciExec('e');

        }

        break;

      }

      case 'net':
      case 'n': {
        // network

        if (getWeights() === '')
          uciSend('weights file', NET_WEIGHTS_FILE);

        uciSend('wasm kernel', (net_kernel !== null) ? 'on' : 'off');
        uciSend('i_size, h1_size, o_size', NET_I_SIZE, NET_H1_SIZE, NET_O_SIZE);
        uciSend('qa, qb', NET_QA, NET_QB);
        uciSend('scale', NET_SCALE);

        uciExec('u');
        uciExec('p s');
        uciExec('e');

        break;

      }

      case 'moves':
      case 'm': {
        // moves

        initNode(rootNode);

        const nextTurn = bdTurn ^ COLOR_MASK;

        rootNode.inCheck = isKingAttacked(nextTurn);

        let move = 0;

        cache(rootNode);
        genMoves(rootNode, bdTurn);

        while ((move = getNextMove(rootNode)) !== 0) {
          makeMoveA(rootNode, move);
          if ((move & MOVE_LEGAL_MASK) !== 0 || isKingAttacked(nextTurn) === 0)
            uciSend(formatMove(move));
          unmakeMove(rootNode, move);
          uncacheA(rootNode);
        }

        initNode(rootNode);

        break;

      }

      default: {
        // ?

        uciSend('unknown command', cmd);

        break;

      }
    }
  }

}

//}}}

//{{{  command queue
// command queue
//
// All incoming commands go through cmdQueue and are run in order by uciDrain.
// While a search is in progress go yields after each rootSearch and
// pollQueue handles stop, isready and quit; everything else waits until
// the search finishes.
//

const cmdQueue = [];

let cmdBusy    = 0;
let stdinEnded = 0;

function uciQueue (commands) {

  const cmdList = commands.split('\n');

  for (let c=0; c < cmdList.length; c++) {
    const cmdStr = cmdList[c].trim();
    if (cmdStr)
      cmdQueue.push(cmdStr);
  }

  if (!cmdBusy)
    uciDrain();

}

async function uciDrain () {

  cmdBusy = 1;

  while (cmdQueue.length)
    await uciExec(cmdQueue.shift(), 1);

  cmdBusy = 0;

  if (stdinEnded)
    hostExit();

}

function pollQueue () {

  for (let c=0; c < cmdQueue.length; c++) {

    const cmd = cmdQueue[c].split(' ')[0];

    if (cmd == 'stop') {  // stop based an idea by @InSys, extended with a command queue
      // anything after the stop runs after bestmove has been sent
      statsTimeOut = 1;
      cmdQueue.splice(c, 1);
      return;
    }

    if (cmd == 'isready' || cmd == 'quit' || cmd == 'q')
      uciExec(cmd);
    else
      continue;

    cmdQueue.splice(c--, 1);

  }

}

// yieldToHost
//
// Must be a macrotask so stdin/onmessage events can run. In a web worker
// setTimeout(0) gets clamped to 4ms when nested, so use a MessageChannel.
// Node and the shell provide setImmediate.
//

const yieldChannel = (nodeHost || shellHost) ? null : new MessageChannel();

let yieldResolve = null;

function yieldToHost () {

  return new Promise(function(resolve) {
    if (nodeHost || shellHost)
      setImmediate(resolve);
    else {
      yieldResolve = resolve;
      yieldChannel.port2.postMessage(0);
    }
  });

}

async function checkStop () {

  await yieldToHost();

  pollQueue();

  return statsTimeOut;

}

//}}}

//{{{  initUci

function initUci () {

  if (nodeHost) {

    // stdin

    process.stdin.setEncoding('utf8');

    let stdinBuf = '';  // partial line carried over between chunks

    process.stdin.on('readable', function() {
      const chunk = process.stdin.read();
      process.stdin.resume();
      if (chunk !== null) {
        stdinBuf += chunk;
        const nl = stdinBuf.lastIndexOf('\n');
        if (nl >= 0) {
          uciQueue(stdinBuf.slice(0, nl));
          stdinBuf = stdinBuf.slice(nl + 1);
        }
      }
    });

    process.stdin.on('end', function() {
      // let any queued commands (inc. a running search) finish first
      stdinEnded = 1;
      if (stdinBuf)
        uciQueue(stdinBuf);
      if (!cmdBusy)
        hostExit();
    });

  }

  else if (shellHost) {

    // standalone binary: the shell delivers stdin a line at a time

    lozzaShell.onLine = function (line) {
      uciQueue(line);
    };

    lozzaShell.onEnd = function () {
      stdinEnded = 1;
      if (!cmdBusy)
        hostExit();
    };

  }

  else {

    // web worker

    onmessage = function(e) {
      uciQueue(e.data);
    };

    yieldChannel.port1.onmessage = function() { yieldResolve(); };

  }

}

//}}}

//}}}
//{{{  init

function initOnce () {

  initPrng();
  initNet();
  initBoard();
  initNodes();
  initSearch();
  initUci();

}

initOnce();

// command line arguments are commands, e.g. node lozza.js "go depth 10" q

const argv = nodeHost ? process.argv.slice(2) : (shellHost ? lozzaShell.argv : []);

for (let i=0; i < argv.length; i++)
  uciExec(argv[i]);

//}}}
//{{{  wasm
//
// The net kernel: lozza.c compiled to WebAssembly, as base64. See netKernel() and WASM
// at the top of the file. Rebuild it with bin/wasm.sh (or the command in lozza.c).
//

function getWasm() {
  return `
AGFzbQEAAAABKAVgBH9/f38Bf2AEf39/fwBgBX9/f39/AGAGf39/f39/AGADf39/AX8DBgUAAQIDBAUDAQAPBioGfwFBgOw4C38A
QYAIC38AQYCICAt/AEGAiCALfwBBgIg4C38AQYDIOAsHfwsGbWVtb3J5AgAMbmV0X3NpemVzX29rAAAIbmV0X21vdmUAAQduZXRf
YWNjAwEIbmV0X2gxX3cDAghuZXRfaDJfdwMDC25ldF9jYXB0dXJlAAIKbmV0X2Nhc3RsZQADCG5ldF9ldmFsAAQHbmV0X29fdwME
CG5ldF9oMV9iAwUK8AcFHAAgAEGABkYgAUGAAkZxIAJBCEZxIANBgAFGcQvBAQEGfyADQQF0IQQgAkEBdCEFQYCIgIAAIABBAXRq
IQZBgIiAgAAgAUEBdGohB0F4IQJBACEDA0AgBiADaiIAQYCIiIAAIAQgA2oiAWr9AAEAIAcgA2oiCP0AAQD9jgFBgIiIgAAgBSAD
aiIJav0AAQD9kQH9CwEAIABBgARqQYCIoIAAIAFq/QABACAIQYAEav0AAQD9jgFBgIiggAAgCWr9AAEA/ZEB/QsBACADQRBqIQMg
AkEIaiICQfgBSQ0ACwvtAQEHfyAEQQF0IQUgAkEBdCEGIANBAXQhB0GAiICAACAAQQF0aiEIQYCIgIAAIAFBAXRqIQlBeCECQQAh
BANAIAggBGoiA0GAiIiAACAFIARqIgBq/QABACAJIARqIgH9AAEA/Y4BQYCIiIAAIAYgBGoiCmr9AAEAQYCIiIAAIAcgBGoiC2r9
AAEA/Y4B/ZEB/QsBACADQYAEakGAiKCAACAAav0AAQAgAUGABGr9AAEA/Y4BQYCIoIAAIApq/QABAEGAiKCAACALav0AAQD9jgH9
kQH9CwEAIARBEGohBCACQQhqIgJB+AFJDQALC5kCAQh/IANBAXQhBiACQQF0IQcgBUEBdCEIIARBAXQhCUGAiICAACAAQQF0aiEK
QYCIgIAAIAFBAXRqIQtBeCECQQAhAwNAIAogA2oiBUGAiIiAACAGIANqIgRq/QABACALIANqIgD9AAEA/Y4BQYCIiIAAIAggA2oi
AWr9AAEA/Y4BQYCIiIAAIAcgA2oiDGr9AAEAQYCIiIAAIAkgA2oiDWr9AAEA/Y4B/ZEB/QsBACAFQYAEakGAiKCAACAEav0AAQAg
AEGABGr9AAEA/Y4BQYCIoIAAIAFq/QABAP2OAUGAiKCAACAMav0AAQBBgIiggAAgDWr9AAEA/Y4B/ZEB/QsBACADQRBqIQMgAkEI
aiICQfgBSQ0ACwuDAgIBfwV7QYCIuIAAIAJBAXRqIQJBgIiAgAAgAUEBdGohAUGAiICAACAAQQF0aiEAQXghA/0MAAAAAAAAAAAA
AAAAAAAAACIEIQUDQCAB/QABAP0MAAAAAAAAAAAAAAAAAAAAACIG/ZgB/Qz/AP8A/wD/AP8A/wD/AP8AIgf9lgEiCCACQYAEav0A
AQD9lQEgCP26ASAF/a4BIQUgAP0AAQAgBv2YASAH/ZYBIgYgAv0AAQD9lQEgBv26ASAE/a4BIQQgAEEQaiEAIAFBEGohASACQRBq
IQIgA0EIaiIDQfgBSQ0ACyAEIAX9rgEiBP0bACAE/RsBaiAE/RsCaiAE/RsDags=
`;
}

//}}}
//{{{  weights

function getWeights() {
  return 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC7/CQAIABIA/P8FAP3/EQACAPT/AgAIAAUADAAKAAQA/P8RAOH/BAAMAAMACQAQAN7/CAD3//L/+v8oACUA//8FAAAAKQD6/wIAG/8BAAcA1/8VAAQABABI/hQA//9JAPn/BAApACAAAAAAAAoACwAEAOj/HgAAAAYACAD8/9b/CQACABYA0P8QAEkAAAC5/wgAAAAJAAkACQDi//3//P8BAPr/+/8XAAUA/v/8/wUAEwACAAgACAD//wAADQAIAP7/BAARAPv/9P8NAP//BADo/xMA//8RAAIACAAFAAYAAQASAAQACwAMAAAARgALAPj/BAAAAAcAAgD//wMA+P8FAPv/BwAFAPv+CQAIAAgA9v8TAAUA+f8GAPj/JgAFAAcACAAJAP3///9HAA8A2v8ZAAkAAgD+/wQA9//8//v/+f8IAAAAtv/2/wEAk/8AABgA///w/wcABgACAAYA+f8SAAsAEQD6/wMADQAvAAoABQD/////CwAMAP3/DgA8AAwAFwAYANr//v8GAAwAAwAIAAYAFwAJAPn/9P/8/wEAFAAMADIABAAEAAEA+P/8/xX//P8CAAgAHAABAAYA5v8FAPz/BAAFAPv/7f8GAOL/6v8FABIAEwACAHn/AwADAA4AIACV/+L/EgAFAAYABAD5/wEACABaAAIAAwAMAAAAQ/8LAIb/GQD4/wQA+v8QAP3/4//9/wMABAAEAAcABAADAA4ADwD+/wcABQA5ABAA1//+//D/9f8BADQAIwD6/wYA//8gAPr////m/vb/BAAEACAAAwADAHX+CADk/04A+P8EACkALAD+//3/AwABAAUA3P8KAPf/EAAGAPj/1f/v//v/FADi/wwAVwALAOb/CgD7/wkACAAEANb/+//5/wUA9//6/xwAAwDY//H/AgAMAPb/7v8EAPz///8EAPj/+P///xIA+P/y/wsA/P8DAOr/LAD3/w4A/v8KAAUACAAIAP3///8JAP7/BQA8AAgA9f/3/wEACgD3//r/mv/b/wIA//8gAPr/EgAHAAMAsADz/xUADAD3//r/9/8sAAgACAACAPj/CwDY//f/HwDQ/24ADQDU//v/AQD4//j/+P/w/w4A7f+o//T/BwAI//X/OgD+/+//BAAGAP//BQD7/w8ABQAHAO7/AAD2/+7/CgAAAAAA///U/w8ABAARAFsACAAtABQA2P///wIA4P8HAAMAAQAKAAcA+f/t//z/5f8KAAwAMAAGAPz//v/6//z/Vv78//D/AAAc/wQA/v/N/wYA/P8DAAIA7f/5/wIA7v/t/wkACQBOAP//6//7/wUABQANAPP/3P8TAAQABQD6//L//f8EAGIA+v/4/wEA/f/3/wwACgAaAPb/BAD7//z/9P/1/wIA6P8DAMv/AgD+//D/DwD6/wMACQAHAAcACwDY/+v/7//z/wMAGQAjAOr/5//7/+v/+f///yYA7v8GAP7/IAABAAUAjP5EAP7/OwD8//L/GwAXAO//+//8/+T/AgDa/w4A+P8CAAUA3v/C/wEAAAATAO3/CABgAAEACwAIAP3/BgALAA4A6P/r//n/BAD3/wEAEwD+/xMA8f/5//n/EQABAAAA///+/wIALQDv/wUAEAD6//f/CAD5/wEA5v9SAPn/CQAGABAA+v8PAAIAvf/4/wIA+v8IADgABQD4/+///f8DAPb//P8bAPz/ZP///wYA/f/N//7//v8OAPD/FAA0APb/8v8HACcAGAAHAAEADQDy//D/BAACAND/AwANAJP/+/8BAAAA7//2/9//GgD3//H/9f8ZAIz/8/8XAAEA6P8FAAUA/v/6//v/BQAKABUA+P8CAAwABgD9/wUA/f/9/zcAEwD4/xMATAAMACwADgDf/wMABgDS/wcAAgDf/wsABADw/+r/+f8CACAA7/8gAP3/+v8BAPP//P9f/+H/9P/+/63+AAD+//H/CAABAAAA2f/q/zIAAwDd/+n/CgAIAAIA/v8NAP//AAACACMA3//e/xMAFgABAPn/8v/8//T/YwALAOP/+P/7/wcAi/8AACkA8//5//7/FwD6/+H/2/82APf/Uf/z/wQAAAAPAAMABgDq////AAAGAN7/7P/9//b/IgALACcA+f/0//v/CgD7/xEACgAOAAcA7/8kAPv/AAC3//T/8/8sANn/uf8jABwA8/8NANn/8f/+/9v//v/0/wv////8/7f/NwADAA4A/P8EAF0AOgAIAAsA+f8HAAYA9//v/9r/9P8GAPr/ff8UAP//3//x//b/DgDq/wQAAgD3//3/KAATAP3/8P8SAP7/9v8OAAsAAQDo/w4A9/8BAAMADwCOABgA//+t/+X/CAAHAP//MwDy//j/9/8CABIA9f/3/yMAAAACAPj/CAACAAsA8v8AABMA9v8VABX/+v/5/wwAHAAKAOf/5f/s/xAA9P8DAPT/0v8dABYAwf8DAP//9//2//D/8v8kAOP/CAD4/wYAff/w/xoAAAD1//z/9f/8/+//9v/P/wcA+f/t//v/AwADAPn/+/8AAP3/1f8QAAEAEwAzAAQA6v8dANz/2v8IAOb/BQCJ/8//EAAKAPH/7P/7//v/+v/9/xsA/f8DAAQAAgD+//j////y/wMAw/4MABQABgAJAP7//P8IAO7/CAACAOD/CQAGAAsABgADAA8ABgALAPj//v/i/+X/EwD///v/7P/s/+v/AgBoAAIAv/8UAAAABgAIAAMALgD3/wMApf/y/2b/9v8pAN3/AADU/wwA9v8CABAACQAGAB0AAQAEAP3/2v8PAAEA9P/8//7/KADz/4v/8/8SAPj/9/8DAPT/BAD5/yQA+v/3/0gA7v/9/wwA//8JABoACwABAOf/rf/3/wIAyv8DAAAA+v/r/wgAu/8OABYA///7/wUAXQAaABsA7////wUAd//v//P/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IwABAAgAFgD//+L/CAD9/wAAAgAoAP7/AQAIAAgA9v/7//n/+/8GAAAAFQALAAcADwD6//n/BgD2/wwABwAcAO7/5P/I/w0A8P8GAOP/+//9/10ACgD+/wEAAwAv/woACQAMAPz/BAD7/w8AAQD1////DAAGAAsACQAEAAIAAQC2/wAACQAAALb/EQDa/wIA8f/0//T/MgAnAAUABwD9/yYA+P8BAMX++P8EANP/FwABAAUAQ/4VAP3/RQD6/wUAJAAwAPr///8KAAsAAgDh/xcAAgADAAYA+P/S/wYAAgARAMz/DQBCAP3/r/8IAP//AQAKAAQA3v/8//f/AAD3//z/FAD//wYA9f8EAA8ABQAQAAYA/v8AAAoABgD9/wIAEQD6//r/CgD8/wQA8f8CAP3/EgABAAMABwAEAP//EAAFAAoA+f/+/0EADAD4/wUA//8LAAwA/P8BAAMABQD5/wcACwD//wgAAAANAPX/FgAAAP//DgD3/ykAAAAEAAkABQD3/wEANwBEANn/LAALAP///v8BAPD/+//5//X/CwAIAMT/9f8XAJP/BAAZAP7/+v8FAAgA//8IAPn/EAACAA0A8/8CAPP/IAAFAAQABAABAAYACQD8/w0AMgAIABkAEADd/wIABQAEAAMACwALAA0ACAD2//n/+v8pABkADQAwAAUAAgD6/wcA+/8XAPv/AgACAE3//v8HAL7/CQD6/wMABgDz/yUAAwDi/93/BQARABMAAQB4/wIAAwALAAwAqP/j/xMA//8EAAcA9v8CAAYAWAD5/wMACQACADf/CwBw/xcA9v8EAPj/AAADAPD/AQAIAAAABwALAAQABQAHACgA+/8KAAYAOAARANT/6f/d//z/8v84ACYAAwDy//z/DwD6//3/B/72/wQABgAbAAQABgBs/igA4/9IAPT/DwAtACAA+P/7/wcA+f8CANn/CwD7/wAABADt/9T/AQD7/xEA5/8JAE0A+v/i/wgA/f8IAAUABwDR//X/9v8FAPf/+/8WAA0A4P/y//7/BgDs//L/AgD6//r/CwAJAPj///8TAPf//P8LAPr/AQDz/zkA9f8UAP3/AwAGAAYA/f/7////CQAIAPn/QAAKAPP//v8AAAsA9f/6//j/2f////r/EwABAAEABgDy/wQA7/8TAAEACgDw//H/JgAJAAwAAQAJAPr/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9f///wz///8FAAoABADs/+z/+v/+/w0A9/8NAA0AEAABAPT/8v8GAAgABQD9/xQA7//F/1YABwAPAAQA2//8//b/fgAPAPz/EwD7/xEACAD9/yAACQAAAPf/CQAAAPH/+/8HAAAABwADAOv/AQD//wcAHgAJAP//BwANAOP/AQD8/wUA+////yAA/f8EAPb/IwD6/wQACQD9/wUA8/8OAPr///85APv/+f8YAPz//P8gABsADAD9/x4A//9U/9T/EwABAPr/BwAjAM//BwALABoA/v8KAEMA+P8OAAQA5v8GAAYAAwDy//n//f/e/wUA/f8aAPb/8v8YAAcABwAIAAIA/v/5//v/CQD7//v/AAAOAP//+f8zAAoA+f/w////AQAFAAMA/P8FAAYA+P8OAAAAAAD9//j/IgDy//z/EABGAAEA+P/6/wIABgD9/8j/CAAJAAgAAAAJAAQA8/+4/wUABAAAAPX/HgAFAO7/AADb/wIAAgACAAEA1/8HAAoABAAAAAgA7/8NAPf/8//y////FQC8/wEAvP/6/yEAGgAZAP3/8f8k/xAA/f8VAAoADgDq/wQA6f8EAP7//v/4//v/BgANAPf/OwAcAAEA8v8BAN7///8GABUAIgAFAAUACQADAPf/AgD9//z/9P8DABoABgDy/xUAAQDQ/wUA+/8CAAAAPv/5/wIACAABAPn/+//7//r/CQD8/xMACgAHAAgA+v/5/wUAAAAHAAsAJADw/+T/wP8UAPH/EADe//7//P9hAAoA//8DAAAAKv8KAAEADAD+/wYA//8PABUA9/8CAAoABAANAAYABAABAAgA3/4CAAwABQAPABEA2P8GAPT/7v/+/0UAJgAAAAAA/f8uAPj/AQB6//P/BgDJ/xcABAAFAGH+GwAbAEEA+v8FACYAEAD7/wMACwAIAAMA1v8WAAEABAAHAOX/0v8GAAMAEQBFAA0ARAD//4z/BwABAAAACAAAAN3/+v/8/wEA+/8CAA8ABAALAPv/BwAMAAoAFgAEAP3/AgAJAAcA/f8HABMA/P/7/wUA/f8CAPD/AwD9////BAAEAAgA/v8GAAwAAwALAAUAAQBFAAcA9/8GAAEADAACAAEACQD4/woA5f8DAAYALgAHAPf/CgD1/xUACAALAAcA/P8nAAQABQAIAAYACwAAACcA///Y/zAADQAEAP7/BAD4//7/+P/x/woAEADu//T/AADR/gYAFwD+//H/BwACAP3/BwD4/w0A+v8NAPP/AAAFAD0AFAAEAAQABgAHAAUA+f8JAEQACgANABIA3P8AAAYA+/8DAAgABwAMAAcA9f/5//v/EAAHAA0AOQAHAAMA9v/U//z/AwD+//7/AwCO/wIA/f/7/wcA+v8EAPv//P8QAAQA5f/G/wkAFgAMAAMAo/8GAAQADQAlAFH+4f8TAAEABQALAPj/AgABAF0A//8CAAQA//9M/wcAh/8fAPv/9//8/w8ABwD5/wAADwAJAAgACwAFAAUAAQAkAP//CQADAKX/EgDQ/wIA0f/+//7/XQAmAPT/AQABAAAA+/8EAAIA7v8DAB0AHAAFAAYAY/4SAOX/QADw/woAJQAnAPj/BAALAAwABADY/w4AAwAOAAcAwv/S//r/+v8SALT/CABOAAcA1P8GAAEAAwAJAAcA3//9//j//v/5/wEAFAAPAP7/9/8DAAcAWf/g/wYA+f/+/wYABQD9/wcAFQD4//7/AwD7/wIA+v8dAPf/FQADAAgACQAKAAQA/f8FAAkA7v8BAEQACQD0/wUAAwAXAPf//f8SAOP/AwDe/x8A/v/3/wgA/v8PAOr/EwAEABkA9f/9/ycAYf8GAAsAAwD2/wYABgBLANP/BgALAPD/+f/+//f/+v/4/yUADwDG/vT/8f8UAAT/9v8jAPj/AQAFAAYA+/8HAPb/CAAfAAUA8f////v/2v8sAAMAAQDx/wgABwD1/wcAWwAPAP//FQDa////BgDB/wcACAATAAMABwD9//T/9v8k/xsACwA7AAAAAADw/zUA/P/m/yEA9/8BABz/AwAMALH/AwD+/wMA+/+1/xYADADr/8L/EgAaAA0ABADe/wEABgACABMAsv/Z/w8AAAAIAAUA+P8AAAMAYgD+//X/AwAFAO////8HACYA9/8CAAEA/f9C//v/+f8RAAQABgAKAAMA/f8IAAIA//8KAAMABgARAND/5v/m//j/AgAfACQABgDq////0//8/wIAGwDY/wQAAQAcABEACwB4/vn///85AAEA9v8VABIA+v8DAAcAAAAGANX/BwAAAP3/CAA8/8f/+v8EABMA9v///1QA/P/7/wQAAgANAAoA9P/t/+v/+v////3/CAALAAEAJwD0////BwAxAAEABgD///3/BAAGAP7/BQASAPr/AgAKAPv/BgD2/x4A9v8CABoADQAGAOv/+f/1/wIACAAJAAsAOAADAPj//v8DABwA5//+/xAA/v+D/9f/+f8HAAUACADv//L/7P8PACYAFQD2////GwApAAcACwAKABUApf8GAAUA0/8aABQAS/8AAAkA8v/z//D///8QABgA/f/y/w8ALP8IAAIA9//4/wQAAgD//wQA9v/5/+r/EAD8//z/+f8IAA4AAAABAPb//v8RAOz/DgBkAAoACQAQAOD/AQD1/3//BgAJABEABgAEAPb/8P/3//f/CAAHADcAAgD///L/AQD8//j/3//1/xEAff8JANv/CQD2//z/CQAEAAgABAD8//D/yf8WABAA/f8JAP//AQADAAQAGQD6/+H/CgAEAAUABwD2/wMAaP9YAPX/lf/6/+z/AQDF/wEAJADy/4j/CAAKAP3/8P/6/2sAI////w4ABwAIAAgAAwD9/wIA+/8OAA8AzP/y/97/BQD//wkAIgAHAP3//P8AAPv/AAAIAPH/DwD9/xkA+v8GAFf+9v/u/zMA2f/o/xwAIwD8//z/DAD5/wMA3P8FAGr/FAARAMT/0v/p/xwAFwD9//b/RgALAAsABgAAAAwA8v/M//n/bP/2//z/AwBt//3//P/1//L/BQAEAIf/9/8DAPT/KgAPACAA+f/9/xIA9/8DAAsAAgD+//b/EQDr/wgA+/8CAAIAFgDp//X/nf8CAPv//f8wAPD/+/8GAPv/UADl//7/1f///wUA1/8QAAYA9v8FAAMA4//j/w4ASv8GAAMAAwAWADD//v8IAAEA7v+WAPv/CADT/xoAFwD8//v/BQD6//P/NgAhAAkAAf8BAPj/DwB//wcATgD8//L/AwD5//r/+P/3/8z/DwD7//v/9/8BAAQA///4//3/AwAAAAsA6P8SAEsAEgDy/wYA3v/r/vn/zv8GAAAAEAD9/wMA9P/s//H////b/6z/LwD+//n//f/+//z/AAAcAOn/BABk/wUADAAMAPv/CwADAH3/i//5//3/6v/4/xIAEgDv/wkAAQD8/////P8OAPf/5v8MAAIACwAOAO//KwAiAFsA/f+p//7/BQD+//f//v8wAPP//f8n//L/FQD6//f/DgArAAQAEQD0////CgAHAAMAVAD7/wkADADR//P/+//2/xIA/f8kAAYA+f/7/wwA/P8NAAYA9v8QAPX/GwAZAJn/OwD2//3/IwD7/+r/FQARAAIA9f8NAAMABADV/wUABwD5//f/EwDA//3/VAABAP7/8f9KAPP/CgADAAMADwCy/8j/9v/t//r/+/8YAAgACgDq/+T/9P8BABQAAgAFAAIACAAGAAQA/f/X/gAAEwD2/wUADQDw/wUA8v8BAPn/CAAAAP7/DADp//f/8P8iAPX/HgAdACsA2f/7/wsA/v8MAOL/+v8BAAEABgDZ/wwAAwAFABoAAwABAPD/BwAjABEA9f///x0ADAAsABUA5//+/9v//P/6/9L/CwAXAAcA//8GAAcA9/8KAPP/9/8IAAwA9v///9T//P8RAAgA5f8BAPH/+//7//j/qf/r/xEA8//6/wIADQD+/+j/+//6/wIAQQAEABAAGQBU//3/BwDY//3/tv8BAAkA6/8RAP7//P/y//X//P/6/////f8fAB3/9v8HAAAA/v8DAPL/8P8AAGf/BgANABEAUwD5/3L/AQD2/wUA+f/h/wYAHAAJAPf/AQAEAPj/DwD5/yIA+//Z/xIAGgAJABcA8f/7/6r/bQD6/4n/4f/y/wIACQACADkA9v///woADwD///T/AQAMAFr/BgAEAAIA//8CAAIA//8KAPv/BwAIANT/AAD6//r/AgD0/xsABgD///n/FQD6//P/BQADAAkA9/8bAAwAAAA6APz/+P8WAPf/CgAYAB8ABgAPABQA+v///83/BQAJADT/kf8eAL3/BgBPALH//v/0/04A6v8IAMD/CAALAAEAz//3//3/7P/4/yUABAAJAO3/+f/w/wwAEgAIAAEA8v/X/xUAFAABAPf/AAASAPD/BwAjAP7/AwD2//f/+v8EAAIA8P8EAAcA9f/7/2b/FQAJAOH/IgDS//T/IAD1////7/8DAP3/AQD+/9r/BwAKAAQABAAJAAEA7f8PAPj/EQDY//3/HgALAOn///++/wMAFQAAAPf/0P8FAAoABwDu/wIA+f/t/zUA8v/j/w0AEwD5/wEAt//6/0AA5f/l/wIAHwABAAEAEgDV/xMA8//w/xEACAAFAAEAkwD6//3/BQAE//3/PgAYAA4A9v8AANP/BAAKABQAHQD5/w8A+v/s/+//+f/u//z//f8KABcA8/8AABMA/f/6/wIA/P/2//7/gv8AAAIACAAQAP7/NwDz//7/CQD3/9n/BwAbAAIA//8BAAUAAQAaAOv/EQD8/93//P8QAE//EgDl//3/AABvAPr/9P8AAP//CgAMAAIAMAABAAYA/P///wsA7/8BAAkABAAGAOP/sP8BAPz/BwD+/wUA+P8IAAsA2/8DAPj/BQABAPL/HQD7/wEA9v8hAPz//P8FAAkABAD1/xYAAgD//0cA+v/5/wwA+f/+/yEADgAGAPj/EAD6/y8Ay/8EAAMA/v///x4Avf8GABkA3P////z/SADk/wkAAgAYAAcADQDw//L/9v/J/9//HAD+/xIA8f/w/w8ADQAMAAkAAwAPAAoAAgARAP//BwAHABIAfv///zcA8//N//T/+P/u/wIAAgDx/wgAAwDy/wgACADr/w4AAgAjAOD//P8TAM7/BAD0/woABgACAAEA2/8GAAQABgAJAAwABwDv/xQA//8UAO///f8jAAUAGAAEANj/AgD7/wMA+P/R/wMADAAEAOT/CAD//wIA9P/v/+7/AgAWANv/EACo/wIABQCsABwA8P/z/wcACgACAPr/9P8NAOf/yf8JAAIA/v/e//n/+P8HADQA6P/7/hgAAgAGAAcA0P/+/wkAEwAUAP//CQD2/wUA8P/9/wQA+f/l/wYAGgAW//b/OAD//+b/BAD2//n//v8K//7/BAALAA4A6/95//n/+v8NAPX/AAAHABcAAgD9/wEABgD+/wgA+/8cAP3/xf9cADIANAAbANb/+//+/3sABwAAACMAAQAPAAcAAAAdAA8ABQD8/wgAAQD4/wUACAAJAAcALwAaAAIA+/8GAGAACgD8/woADQDi//7//f8EAPf/9P8eAP3/AQD1/yQA+P8AAAgAAwABAPX/DQD+/wAANwD9//r/DwD6//3/GgAqAAkABQARAPT/EgDT/w8AAwAKAA8AIADT/wAABgAUAP7/CQA/AAoACQAEAMH/CAADAAYA8v/4/wAA2v8KAP//FgDw//D/DAADAAsABgADAO/////+/wkA+v8BAAIADwD8//7/QgD//wAA8v/1//3/BAAFAP3/BQADAPz/CQAAACUABAD+/x8A7v/6/wYAFAACAPT/+/8EAAIA/v/V/wUAAgAEAAAACQAFAPX/AwADAAsAAgD4/yAABAD3/wEA0/8BAPz/BQD//9r/BgAIAAcAAAAPAPX/EQD3//H/9v8DABYACgAOAL//AQAjAPT/EADk//n/FP8CADMACwAFAA0A6v81AAoABAAAAAcA/P/7/wQACgD6/0EAGQACAAEAAADZ////BQAPAA8AAAAHAAAAEwD1/wIA///8//D/BgAbAPz/BgAjAP7/j/8FAPr/AQD//3v/+v8BAAYABwD//woA/f/7/w8A+P8HAAcAAwAEAP///P8GAAMAAwACABsA7P/j/7z/FQDh/hUA5P/8/wEAZQAMAP3/BwACADX/CAACAA8AAgADAAUAEwAaAAgA//8JAAkACwADAAIACwAHAJ//BAAIAKoA8f8WANH/CwDn//H/+/9LACkABgAIAAQANgD2/wAAtv/p/woAev4fAAIAAgBp/hMADgArAPr/BgAeADMA9f8FAA8A/P8BAMv/EwAEAAEAAgDa/9j//f8CABQAigAOAD8AAACK/wUACAD5/wQA/v/U/wQA+//6//b/CAAPAAEA/P/4/wgACgAUANn////9/wQAAgALAAMABwAUAP7//P8AAP//AQD1/w0AAADv/wAAAwALAP//EwAFAAIACQD8/wQATAD+//b//////xkA+/8HAAoAAwAUALD/P//2/y8AAgB9/wgA8P8WAAQABgD+/wIALAABAAIACAD//xAA+v8hAAQA1v88AAEABwAEAAMAAwD8//n/BgAHAP3//P/y/xQAD/8MABYA/f/o/wQAAQD8/wwA+P8BAP//DwD0/wIA+/9cAEMA/v8DABQABwAEAPb/BgBeAAYACQARANT/AQAJAPP/AQAGAAcA//8DAPz//f/5/xQA/P8IADwABgAHAPj/FwD7//X/CAD+/wYAH/8CAPP/PgAKAPr/AgD+/wMAFAAgAOH/nv///x8AAwACALf/CAAKAAsAEwB+/9z/EgAFAAQAFQD7/wQA+/9rABIAAQAGAAAAT/8IAI3/JQAGAAkACQABAAMA9P8EAAwABAAIAAMABQCL/xIAGAAJAAwAKAAJABoAzv8KAKL//v8EAFMAKwACAP7/BgALAAAAAQAGAOT/BwASAB4A/v8TAG7+AgAA/ycA+/8MACYAGAD6/wQADwABAAMAz/8IAAIABQAEAKT/1P///wQAEAACAAkATgAAAOH/BwAJAP//BgD//9n////5//n/+f8JABEANgArAP3/CAAJAAMA1P8GAP7/AgAKAA4ABAANABYA/v/9/wMA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7f8HAPz/SQDs/wsAAgDq/7oA/P8DAP3/EQD+//3/BABFAP3/NP8TAAoAAAACAMv//f8LAAgADwD5/wsA5P////L//v8MAPz/8P8CACYA/f8DAGkA/P/5/wEA9//7////D//m//n/AAAJAPX/DAD8//v/CAD6/ygA/P8TAAUAAAAEAAIA+v8MAOj/CQD+/8v/UgAuAHAAGgDY//X/+f93AAkA+/8SAAsADgAHAAcAFwAZAAYABAAIAAIA+P8HAAMAAgAFABQACQAGAPj/BgCBAAcA/f8HABIA3f/8////AQD7//L/HgD3////8P8gAPr///8GAAQABwD3/xAAAAD+/zUAAQD3/woA/f///x8AEgALAAUACwDy/xEAz/8GAAAACwAGACIA2//s/wcAFwAAAAkAOAAOAP//BADHAAIABAD6//L/9f8aANb/HgAIABAA8v/y/wAADwAGAAUA///5/hEA//8FAP3/CgABAA8A///9/0sAAQAAAO3/9f/6/wQABgD6/wUAAAD7/wQA/v8SAA8ADAAiAO//6/8KACQACADw/w4ABQACAAUAyf8AAPz//v/+/wYABwDw//T//v8HAA4A+v8cAAYA/////9n/AgABAAUAAQDb/wAA//8DAPX/BgANABEA+v/0//T//v8TAEUABADI/wUABgAAABUAZAACAN3++////wkABwARAPL/7f8TAP//AwAOAPz///8AAA8A+v9JABQACQD8/wMAz//+/wcAAwAIAAAADQDu/w0A+P8PAAEA+v/x/wQAIwAMAAEANwD7/07/AQD5/wEABAAZ//j/BAACAAMA/v8KAP///f8RAPn/CQD9////AgABAPz/BgD+/wIA+/8sAPb/4v/K/xkAGgAWAPD///8EAGoADAD8/w4ABAA9/w8AMAASABAADwAPABAANQAPAAUABgAAAAYA/f/5/wQACgDJ/xQABADoAP7/JgDO/xAAxP/4/wsARQAsAAAAFwACAFIA5/8IAOX/5f8WAGP+HQAMAA8Ag/4ZABMA+//1/wIAGwAUAPz/BgASAAUAAQC8/xEADgACAAMA2f/P/wkACAAhAOv/FgBLAPX/gf8HABEA8v8MAAEAwf8FAAIA7P/v/xgADwAeAC8AAgAOAA0ABgBFAAYA/P8JAAoACgAIAAkAEwD7//j//P8EAAoA8f/+/wIA0v/6/wQA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JwDL/wwA+P8AACkABwA6AOn/dQAGABgADACY//3/AwAQACUABwAIAE//9f8ZABIA9//2//z//P8DAAQA+/8cAAUADgAAAAgAAQAqANL/Xf/z//H/8/8DACkA7P8EAPv/DgAKAAwA/P8lAL0ABQApADsACAAtAAQABwAcAPf//f8UAAIA+v8JABAAGgAIAM7/7v8GAAwA//8XAPP/6f8oABIAAgALAEcAFQDz/wIAFgADAAMAlv///xgA8f/x/yIAJgACABAA8v/5/woA7P8EAPX/GQACAPr/+/8FAPz/CwAHAA0A/v8jAAMADQDj//T/+/8KABYAAQAJAHL/AgDw/w8A9//n/xMANgDl/wUAIAAKABoA1P8eAAsA9P8XACr/BAAWAAUAEwAMAAcA7f8HACQA8f/x/xgAGADv/+//DADr/woAGwAJAPf/2v8FAKr/AgDz//r//P/8/yMA9f/+/w8AAQAHAAUA7v8WACEACAAHAAsA9P8RAPr//f/L/xMAEQAVAA4ACQAGAAYA2f/6//v/AABFAPL/CwAyAAUACQABANb/DAAHAOL/3v/v//3/uf8EABkA+/8OAAEA7/8CADMAAAAHAAsAAAD+//3////5/xAAAv8pAAgAAgD4/xYADwAEAAAAFAABADD/8/8LAA8ACAAJAP3/AAAsAAcAGwAJAMv/BgABAAQAKAAJAPX/BgByAA8A+f8GABoA+v8MABUANQAVAAUAGgAKAAsAMQD5//X/EQACAO//AwD+/xQABgDq//7/BgAIABwAy/8VAAoA/f8pAO3/JQD8/wIA9f8gAAgABwD//zQAOwD3/yMAZAAEACYAAAD+/xcA9v/8/woAIAABAAAADQDA/wQA0P/2/wv//P/z/yQA6//2/xkAXv/6/wUASgD5//z/mP8kAAoACgDC//D/8P+M/+7/KwAgAAAA8f/3/wQAAAD2/woA+P8XAAsAEQD4//b/CwANAAwAIgD+/y4AAAAJAO//9/9lAAIABADq/woADQD6//L/+v/5//D/CAAuANv/DAApAAoAFgDN//r+CwD//xEAdP/7/xQABQAIABAABwDX/wMA7v/4/ysADgAYAP//EwABAIP//P/q/wIA/v/l//T/vP///7b/8P8jALsAIgD2//7/8/8CABAACgDh/wAAaP8NAA0AIgDp/xoAAgALAPf/EgABAAYA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y//U/hQAAgAXADMA/v+6/w4AHgD2/wcANAAAABsAJQD///T/AADn/xsAAwAPAP7/+/8rAOn/FwAPADIA0P8IAAYABgDr/w4AMgD+/wYA2f8ZACUABAD0/+X/MwAbACEAXQACAPr+CgALAOL/EQAsAAIACwDJ/ggACgDD/wkAsP/n//P/AwDz/7f//v/6/xsACgAGAP//QgAAAO7/EgAlAPb/DQD9/xgAwP8CANn/7P9S/wEAJwC2//H//v/5/+L/9P/+//n/9//g/xkA/P8GAPr/+/8BACYAAgANAPX/2v8KANf/BwAQABcA5wAQAPH/9v///+n/GgA8AP3+4/8gAP//HACq/xIABgDr/yIAMf8CAOr/8//0/xMA/v/4/woA9/8UALr/IAAfANH/DQADAPP/+v///x0AGQDP/+b/XP8BAPn/AwAeACAABwDm//f/CADu//b/+f9T/ywALQAEAAgAAQDu/xsACwD4/+D/CAD9/ysACAAeAAsA5v/n/wQA5//j/wcA5f8QAG8AEAAaAAkAvP/Z/xcAy//n/+j/9f/F//P/QAApAAMABQAXAPT/SQAWAAQA+/8TAPL/+v/+//7/IQDu/hYABgALAND/BQD8/wgAEQD8/wcA0//R/xUAGQAFADIAAADz/yAA/f8QACsA4/8FAOX/DABPABYA3//W/4QACQD//wMA7P/+/97/BwATAAwADAC///X/CQD8//r/9P/x/+j/AwDx/ygA9f/n/xEA/v8aAAwAMADW/9H/4f8kAB4A8/8vAAwACgDj/woALQAUAPT/CQDvAAQAHQBMAOb/w//9/wcA8f8LAPv/JwDq/+z/AwAMACQA7v+//8//AwABAPr/IAANAPf/CwAQAAAABgArAAgA9P/u/xoAAQAUANH/BAAIAN3/0v/1/zEACQDX//T/AgD//83/HADy/wcADADZ/+j/9f8HABQA7v8HAAoAIgADAAwA7v8CAPr/HwAYAPT/AgCI////7v8RAOz/HQDm/zsAFP/y/zgA7v82AL7/BAAFAO7/EgAS/wYA4//k//z/DwD1/+f/DAATAPD/0f8YABcA8//p/wEA1f/z/0oADAALANn//v9d//H/GQD3/xYARwAvAPz/9v/b//j//f/4/13/HgBU/wcAuv8LANz/GQDx//b/tP8PAO7/LQAJABYA+f/s/87/7f/q/w8A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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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BwD2/w0A4/8rAPr/DADy//T+FQACAPP/JwAAAAoA3v/q/xkA6//l/xUAQAAZACAA5f/0/wEAAQARAPT/CADT////AgALAA0A4//T/xAA8//g/+z/EADu/xEAKgDz/wYAAgAOANT/EwD0//z/BwDp//z/CwAWABEACQAdAAgA+f8nAPT/7v9BABsA/f8CAOj/7/8QALH/AwASANr/6P/h/wYA9v8NAAEA6f9UAA4ADgCU/ycA/f8GAO3/AACt/xUA3v/1/yMAAgALAI7/BgAJAOr/IgAXAPb/7v8OAAIA/f8hACQA8f8JABoA8//O//v/GADs//v/+f/6/9z/7v8fAMv/GQDs/wwAHgAEABwADwD///v/BAD+/9b/DwAxAOn/3/8aAOz/7/+n/yAA9v8jAAYA+v8OAA0A///s/wgAAADn/ycASgC//87///8FAN//AQABACEA/f/A/6j/HgAaAA4ANAAZAB0AZQASAPv/+P8VADIA8P8SAPH/BAAcAPX/BgAKAAUApgD6/wMA7//z//r/AQD0/9j/0v8kAAEA/v/t/wQAYQABANcA6v8QAAsACQD7/xEA2//3//v/CgCi/////P/1/wQAIwAlAPv/GgATAAEAFAAPABIA//9CAPv/QQAcAO//GADq//n/FwAYANX/BgAEAC0AFgDd/wgAEAAJAAEA+f/n/xYA6P8OAPb/7f4cAAsABwAdAAQA9P/C/+//EADy//L/BQBAABMAAADr//X/BwAHABcA+P/q/9n/BgADAAwACgDq//7/EwDx/9b/5v////v/CwANAPn/DQABAB0A4P8MAPH/GQAQABoA7/+7/woADQD4/xwAEwD3/+P/8/8ZADUAHAD6//z/5v/S/wYAsv8gAAkA0/8EAOX/CAAFABQA/P/8/1YAEAD//57/EgD2/wgA9v/3/53/FgDe/wAAHgARAA4Ajf///wwA5f8oACYA9f///wsACQD4/x0AMAAMABoAEQD1/87///8MAO7/+//9//X/2/+j/x0Ayf8dAOr/BgAcACIACAAJAPT/8v8dAOv/6P8OADMA6P/X/yEADQAAAKD/GADy/xkADgD4/34AEADz/+X/HAAEAAEA7P9JAL7/z//5/wwA6////wEA///v//D/lf8QAPn/8//o/w4ADgBkAAkA9v/x/yAANADs/wUA2f/s/xAA+f/+/w8A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GwADAKj/FAD5/wwA5f8JAKz/HwAHAP//IgAhABIAk/8EAAQA3/+S/xAA+f/1/xwAIQAAAA4ANAAXABcAEgACAM////8kAOb/+v/w/+7/FwD4/xkA0v8HAOv/DwAAABEABgC1//L/IwAZAAMA8P8XADAA+P/l/yUA/f8EAJ7/FAD7/woACQD+/w8AEQD//+P/sP8PAAEA9f9UALr/2P/o//T/FQD7/wUAEgD8//3/nP8WAP//BgAHABgAEQBbAAsA8v/p/6H/MwDt/wYA6/8SABsACgD9/xAA7v+fAAoA9f/5//f/AwD//+z/4//j/wYA+/8LAP3/CABVAA4A2gDu////LwAFABIACwDZ/+L/AAAGAKT/4f/+/wgAEwBWABcA/v8MAAEA9f8fAP//HQD2/x8A7v8PABMA/f8UAAQABwAKAAYA2f8AABAAAgAcABUA7/8ZABAA/f/9//L/EwAJAAgA///A/iUACwALADMA+/8dAPT/7/8NANv/6/8DAEcADAAKAPX//P8KABcAEgAYAP7/0f8GABgABAATAAUA5v8TABIA4f8AACEACAARACkA/f8VAPH/GAD3/wYAAAD6/wkAIADk//3/KQAJAAEAFgALAPD/GQDz/x0AMQADAAkA9f/u/yEA9v+8/x4AEQDX/9//6P8RAAQAQQADAPf/UgAhAAYArf8VAPP/AwD7//7/of8dAPf//v8eAAAAHgCM/wMAAQAHACYAAgD+//D/FgAhAP7/EQAsABYAFgAJABQA0v8EAPz/3////+7/7f8cAP3/IADX/w0A5f8UAAMAHAAGACcAGQAv/+f/+v/7/w8AMgD3/9//IgDv//T/p/8PAOr/DAAQAP//GwALAAQA3v8JABMA+P8aAEsAw//s/+7/1P8HAPX/EAAXAP//+f+r/xwADwABACMAEAAVAFEAFgD2//P/LgArAPX/DgDW//P/HQAFAAQACADp/54AAwD3//r/BQD+/+7/EAADANX/+f/6/wwABQAFAFYACQDeABoA+v8MAAsAIgAcAPX/2f/9/wEAqv///wgABQATABkAFAD5/xkAHQDx/wAA8f8FAO7/HAD0/wkAIAD3/wsA4f/+/wEABgDY////YAD0/xIACAD2/+j/BQANAPT/+f8cAPT/CwD1/8/+NAACAAgANwARAPv/6P/4/x4A6v/q////QwACAAkA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DQAjAPH/AAD9/wkADgALAPf/BQARAAgA+v8gAA4ABAARAPX/FgBQAOn/2/8CAOL/FAADAL3//f8iAO//4v/5/wwACQA1AOz/6/9TACYAAgCl/xMA+/8GANj/AwDF/xIACwAAACsAEgAQAIr//v/6/xEAGAASAPr///8UABgABwAXAC0AJwARABEA///T/wQA+/8AAPn/+f/s/xgACAAmAOr/GADx/xMA/v8fAAMAtP9RANj/DgDw/w0AFAA1AAIA3/8gAAYAAQCd/wUABwAiACsABQAVAPP/HgDo/x0A/P8BABMARwDE/+r//f8IABYA4P8rACIA+P8HAJ3/BgABAAAACgAYABMABwAbAPX/qv/0/y4A+f/k/+7/CwAbAAUA8/8bAPz/iwAGANP/9P/v/+f/yP/t/+X/0f8VAP3/AgAIAPb/YQD5/9UAAAD9/xEA/P8MABcA7f/f//T//v+9//z/EAAGAPX/EgACAPz/CgALAAkAFAAMACcABwAhAPT/CQAKAOX/HQD7/xQA9f8LAPD/NAAUAAYAAQARAP3/9f8TAAcA+v8VABQA3/8MABUAs/40APD/DAABAPb/0v/d/wIAHADr//j/+P9EAAcACAAOAPr/FwAgABwAAwD+/8D//f8OABEAHQAUAOH///8MANn/9P8UAA0ADgAKAP7/EQADACEA7v///wAA/P8RAAwA0P8IAAMACwDq/yAADAAIAAkA9f8kAFUA7P/+//P/1v8JAPn/uv/6/xcA6//q////CQALADgACAD9/0sAMQAKAKb/BwDq/woAXwAGALX/FgADAOv/LQDw/wUAiP8CAPv/CQAcAA4ABwDH/wgAEQABABoALAAGABYADgARAN3/CgDq//P/4/8rAO7/EQARAB8A1f8XAOz/FgAUACIA8/8oABQAgf8KAO///P8fADcAAwC8/yUA7P8HAJ7/EwDc/yYABwDa/xYA2v/j/+T///8OABMAAQBOAMn/7/8fAAEAEgDn/04ACgD9/wMAlP8QANz/BQD1/wkADgAeAAoA+f+t/0AAKwDv//j/7/8AAOT/9//6/woAyP+fAA4Ay//4/7L/8P8BABcADADW/xcA9f8OAAEA9v9kANv/2QDz//7/MQAdABcABAATAN//AwD2/7L/LAAPABMAEAAhAO7/9/8eAAYACAAEAAEAHwD4/xMA//8LABsA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IwBMAPH///8QAM3/1/8SAL//BQAPAOz/2f/2/wEA9v8kAPn/7f9UAAgAEgCR//z/RgD5/+X//v91ACwA+v/4/x8AGQD6/5r/CQDz/wsAFQAnAPT/5f8NABUACgAeAID/DgD4/xAA///M//H/6//l/+//8//R/wAA9P8iABMADADp/wUADAAQABAAzv/9//3/EgAHABkAAwA0APr/2/8dAPr/AgCv/woA4v///wUAwf8MAK//BgDm/w0A/v/i//D/TgC//+X/+//z//b/yP8iAAsA3f8EAHn/8P8NAOj/7f8TABcAKAD2/+T/1P/Z/zMArf/u/+7//f8cAO//EQAYAMH/gQAAANH/9//k//D/+f/1/7v/wP8fAAAADAAPAOz/aQAHALP//f8fABAA//8XAAkA0P8AAPT/EwCf//X//v/r/wYACgDy/wAAHAAPAPT/DgD+/wcA7f8eAOT/6P8TAPz/4v8VAAgA4f8RANf/IgDp/+7/+P8ZABYAEQARAPX/9P/y/+//4f8VAOj/kv4EABsACADu/xUA7f/e/+b/FgDg/5f/9/9CAAkABgDs/+L/GQD+/x8AZgD0/8X/9f8EAAwALgAdANT/BgAeAOv///8DAPX/AwADAPT/FAC+/x4A7f8MAAoA8/8GAP//6//z/wwABwDe/zUA9f/M/xYA0//5/0cA5f/w/xsAqP8SABYAwP8SAA0A2f/C//n/IgDc/yAA+//x/1EAAgARAJn/AwDp//H/DgDz/+P/Ef/z/+v/IgABAAwAmf8HAA4AWwAGABEA+f/6/wcADgAAABoA5P///+X/JAAhANj//P8DANf/2f8rAM7/AADs/yAAq/8uAA0ACQAFAAIADgAOAOf/9P/z//L/CgAPADcA8f/L/x4A4v8NALP/DwBNABQA9P8CAAMA3f/w//D////9//X/FQBFALv///8WAAAA/f/o/7P//v/o/+7/jf8GAAEA7P///+//8v8GAA8A1P+4/wgALQB4AL//5/8CAPn/BADv/xUACABpAAIA1//u/87/5f8CAEsA9/8BABUA2P8MAPL/BABlAOL/W//h/xkAFQDb/w4ADAAEAPb/5P/5/7H/+f/w//7//P8SAPX/zf/9/w0ABwACAPn/+f8MABcA5/8RACMA7v8XAO/////A////7P8rADoAIwAHAAoAGAACAAQABADv/wAA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Xv9OAA8AegD3/+//JAAwABUAEgDm/9X/FADb/w8A9/84ACIACQAbALL/WQABABsAwP4lAPz/LwAiAEIALgD4//P/yv8KABwAIwAFAL3/O//q/+H/1//4//b/DQAmAPz/CQB5////JwDq/wUAHQAaAEAA///e/77/8v9iADcABwD4/wsALgATAPb/DADq/4YA8P/r/8f/TgDV/wkASAAEAPD/KgD+/wIAMwAfABoAIQBsACMA+f8uABAAJwAmADYAs/8vACMA1v80ADkA7P/k//L/HgAhAP3/MACc/zkAZwD3/wEAKQCw/wMANADi/yAA9P8NADgAHgCl/9v/0P8CAPP/GQA0AP//LwDH/yQANgABAAIAXADy/23/5/8aABIAIAAiAAoA/f/6/zwAv/8hAN7/3/+L/wsAGQDx/wcACgAyACYALgCw/xEAIQAEABEAJgDw/ygAXQDz/+X/FADm/1gAHAAYAKD/KwBFAAIANgAPAAQABQARAP7/7f8IAOT/EwBAAMD/EAAQANb/+P/QAIP/BwAEAKf/8f/5/9H/3/8rACcASQCz/wcAs/84AOH/PQBYAMf/LADn/zEADQD0//z/HQAwAB0A3v/5/1cA0/8TAEr/8P8SAAoAGwBGAPf/z/9EADYArf9LACgA/P+3/yIANgCN/wwA2f9WAP7/IwAp/0AACgB4ABMA9/8oACUABQAVANX//P8AAPP/FwD4/xkAHgAJAPj/sP9vAP7/BQDI/jQA7/8VABUAOQApAPj/7v/L/xsABgAgAAcAuwD3/on/FQD6//f/AAAIAC0A//8MAHj/CAA8AOT/AgAXAB4AMAANAOD/t//g/2kAOAD3//P/DwAQABMABwARAAQAggD2/+H/sP8nAKT/7v8EAOb///9YABEABQAQACIAAAAjADgACAD5/yAA+//4/yYA9f/C/yMAGADV/yEAMgAwANv/FwAmAEUAAgAiALH/PwB/APf/DQAoALb/BAA2AOf/MgACACoAVAArAMv/4f/2/wwA9P8aAC0AGQAyAJv/PgDm/wgACQBaAPr/Yf/V/yEABQAlABgACQAGAAYAKQDD/ysA6//a/xAADQAnAAQAFAASADIADQAIALn/HAAxABYABAD8//H/EABHAPL/6P8mAOP/TQAFAAYAr/8yACAA/f8cABEA9/8GABIA/v/r/xAA6f8cAFMA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BADt//v/AADx////+/8DAPL/CAAIAOb/CgD3//P/5f/8/wQAAgATABsACAACAOb/FQD1////FgAPAOf/8P/z/+//5v8PAAAA//8DAP//EgDg//v/3//8/wcAFADr/+z/+v8EAAAABQDz/wkAEwADAOf/9f8GAP//+f/7/9v/8f8FAAEA5//p//L/IwDz/wUA+P8SAOv/CQDx/xoA6/+M/xEA2/8XAA0A/f/R/wIA+P8GACYAHAAKAAEACAD1/wQAAgAEAO//8f+R/+D/DQD3//r/+/8VAPX//P/0/w8ABgAAAOT/BAD4/+3/IADx/9f/BgADAAkA1//l/wAAAADx/6P/+P/8/wYA7v8KAAMA4v/1//H/AQDr/w0A4P/t/wYABADF//L//P/1/7D/AADr/+v/HQD5/wgABQB//yEA8v/9//P/BQD0/wkA6//+/wwAEgD2////CwABANf/7P/1/xUA+//u/xsA7/8LAPz/4/8BAPr/6f/W/woAQP8DAPn/CAD5//H/6P/z/xUA2v8bAAQAHQADAOz/7//1/+P/+f/w/+r/5/8AAFX/w//r/wkA///3//z/G/8GAP/////i/wQA8//0//n/9P8FADcArf/u//v/9v8CAP3/CQD9//r/9//z/w4A9/8KAO///f/w/xsA9//0//X/AAC4//b/9P8DAPL/AAD+/w4A3f/1/wcA9v/5/wIA8/8SAP//AADt//X/2P8CAAYAEAAMAAAA8/8RANH//P8LAAoA8f/1//T//P/g/wMABgAEAOf/6P8PAPf/BgDy//D/EAAAAPX/8P/5/yMA+v8ZAO//BgAKAAQA7P/+/wMA8//+/wEA2f/3/wsADAAIAOX/+/8XAPz////9/xEA7v8BAPL/FgDs/5/+DgA7APn/CAD2/8r/9/8PAAEAHAAUABsA//8CAPf//f8PAP7/3P/x/9H/5P8OAO//BwD6/xUA7v/3//L/BwACAP7/8P/9//b/9/8QAO7/v/8FAPz/BQDh/+v/+P/Z//X/4v/6//3//P/y/wQACgDe//z/9v/2/+j/3P/t//j/AgAEAMX/9//+//X/pf8CAAgA8f////j/CAD//+b/DgDu/wIA7/8GAPf/CQDt/wMADAARAPL/+v8OABcA0v/y//X/NAD4/+j/FADk/w4AAADn////9//o/9v/EACJ/wQA9v8HAAgA9//x/wYACwDv/w0ADgAaAAkA4P/1//7/4P/4//X/6//m/wUA8/7P/+3/DwAUAPP/+f/2/wsAAQD+/+j/+f/s//f/+P/6/wUA8/+n/wYA+P/1//7/AgAGAPP/8v/3//D/DQD5/w8A+f/6/+j/HADu/+r/9f/+/9j/+P/y/wUA9f/2/+7/DwDs/+3/AAD0//j/EADy/w0A/f////T/9v+S//7/FAAOAAwA/P/u/xMA3f/+/xQABwDy//P/9f8CAOf/+v8CAAIA6//w/xAA9/8BAAIA4v8NABMA8//z/wAAGgD6/xkA9/8BAAUABgDq//7/BgD8//b/DABRAPj/AAAJAOP/7P/1/x4A9f8HAP//AQDv/////v8TAPT/gf4PAOD/wf8DAPz//f8AABEADQABAB0ADAD7/wIA+P/7/wsA+P/a//r/2//u/xAA9P8GAP3/FQDr//f/9P8IAAQACQDv/wcA8//4/wYA6//P/wgA+/8AAN7/9/8FAMj/7/8MAPb/AgAFAPH/BwADANz/7f/0//v/7f/n/+j/CwADAP3/wv/1//v/+P85AP//1v/y/wIA7f8PAAMACQD+/97/AQDz//j/+/8BAPL/+P8LAAUA9P8FAP7/GgDN/+3/6/8X//j/4v8cAOj/DQACAOr/AgD2/+L/8f8UADv/BwDz/xIACQD0/+f/DwD+/wsABgAOABoACwDi//z/9v/Z//z/BgD1/+j/DADc/tr/BAAQAPT/9//6//z//f8FAP//8P/u/+//+f8CAP7/FQD4/hEAEADu//D/AgAHAAsA+P/w//b/7v8KAAEACQAAAAEA3v8fAOf/7//z//7/6v/3//H/AgD///H/+v8TAOX/3P////3/7/8EAPD/GgAEAPv/+//2/4z//P8MAAgAAwDz/+r/BgAY//r/BwABAPn/9f/5//f/5//2/wMABwDd//H/CgD0//z/BADs/wYAAAAHAPr/AwDR//z/EwDy/wUAAgAIAOX/+f/8//n/+f/3/wcA+f8EABAA/v/w//r/FQD0//r/9//s//H////+/w4AAADZ/gsATv+8//v/+v/a/wIAHQAQAND/GQAFAPv/EAD8//z/CQDx/9X/8v/v//b/EQD7/wEAAgATAO//7v/t/wEAAQD2//n////4//n/+P/y/+X/AQD1////2f/w/wIAz//2/x8A8/8FAPz/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8f/w/ycABwABALX//P/9//T/Kf/+//z/+/8AAPj/AAACAAYA+//j//3/7//9//7/BgDw//z/DwAIAPP/+//+/xYAyv/1//f/tv/1/+n/FwDi/wkA/P/r/////P/q/yMAGwA9/wQA8v8NAAsA+f/x/wwA8v8cAAIAAwAXAAsA3P8DAAIA4f/8/x0A///w/wkAsP/g/wMADwD9//n//v/+////+//2/+r/8P/v//r/BQD+/wQAUv8SABQA8P/0/wcABAAFAPT/7f/5//j/DAD+/wcACQAAAKr/GADp/+b/6/8AAPv/9//w/wAA/f/6/+H/DwDt/+b//P/3//P/+f/7/xQABwD+/wIA+P+M//7/EwAHAAAA9P/t/wUA5v8CAAkABgD0//X/9//7/+z/8/8EAAAA3f/0/wcA+/8BAAcA5/8QABkABwD7/wEA5P/0/w4A8v/4//3/CADk//n/CwD+/wgABgD1//v/BAAPAN3/8f/9/xMA8//7//3/7//w//v/BAAAAAkAWv8RAKv/zv/4//n/LgAMABwAFADD/xIA4P/2/wcA+f/7/wAA8//U//f/CAD//w8AAQD+////FADu//X/8v8GAAcACgDx/wIA+P/2/wUA8v/X/wUA9v8BANv/8P8GANn/9/8IAPf/AgADAP3/+v8IAOb/AgDw//b/+v/q//L/KgACAPv/wP/4//7/7/9D//r/1f/6/wQA9//9/w8ADwAKAOT/AgDu//r//v8CAPT/9/8JAAcA9P/6//n/EQDH/+z/8/8j//X/4/8bAOr/BgAFAOn/BQD5/+P/7/8YADX/BwDy/wwACgD0/+r/DQDc/zIABgAKABkACgDd/wIA9//b//7/DwD7//P/CgB2/+D/EgANAPT//f/7//7/+P8AAPb/5//j//L/9/8IAAAADwD1/igAGwDt//P/+v8GAAgA+P/x//b/7P8JAAYACgAJAPT/CQAeAOb/8f/0//7/+v/1//X/AAD///X/2v8LAOj/3f/5//j/4f/f//r/IAAFAPz//v/3/5b/AAAFAAgAAAD0/+v/BAD0/vn/CwAEAPf/9f/3//z/5f/3/woA///e/+3/CgD8//v/CgDo/wcAAwACAPb/AgDi//H/CwDl/w8A/P8SAOH//P8PAPf/+f9n//v/+/8AAAEA+//0//j/DQD0//r/BADn/+n//P8CAAAABQBV/w4AWP/F//f/+f/J/woAFAAOALH/FwDL//j/BgD9//n//P/p/8r/8f8fAAYADgADAPv/AAAUAPD/7v/s//7/BAD5//j/AQD1//T/+P/1/9D/AQD2//f/3P/u/wUA8//2/+H/8f8KAAAA7v8FAAgA5f8GAPH/7v/0/+f/8f8AAAUACwDs/wAA+v8BAJz/9P/1/wEACQD5/wkAAgD5////AQAVAPz/3//v//n/9P+s/8n/+v8SABAABAAMACMA/v8EAMj/AwDo/wsA8f/z/ur/4//3////8P/A//b/CwATAPD/AAD7/+7//v/6/9T/jv////n/HAD1//7/7f/9/wkABADi/9n/2//5/77/6P8LAOb/0f/y//7/FQDw//v//P/U/woA9P/1/wUABQC4/+j/ov8aAP7/BAD///b/FQDf//7/+//s/woA/v8LAMT/5f8BABkACwDx/xQA8P+V/+f/9f8NAPv//v8GAAAA+v/8/wsA0//7/wEA5P8HAP7////f/wgAHwDs//v/6v/p/+b/6//w/xgA+f8DAAIA///w/+P/9v/x/wEAAwDx/wgAFAABAMX/BgDE//r/+f8EAOn/6/8FABX/DgDF/wAADwA2AAoA4P/h/x8A8v/t/+z/8P/j/xMADQADAAYA6//7/wAAHwDl//P/5f8PAOn/FwDn//P/BQCk/xwA/P/+/4r/5v/s/woAz//2/woA9v8VAPr/PQANAAoA+//l/4b/0v8mAAQAov4AABAA+v/8/+//+f/d/9L/5f/0/wYAAQDu/wkAFgD1/wsADwD4/+r/Kf8CAOv/iP/3/xEAAQD6/xAA+v/4/+7/8P/n//r/HADm/83/DwAVANv/uP/7/wUAZf/1/xYA9P/8//j/CQD///D/AwAHAA0ABAAEAPj/EQD9/+//0v8CACkADQAFAP3/IgD//ycAAAD//wIABwDq/6b/1P/u////AgD3/7n/AQD9/xQA8v/8//r/9/8GAAMA3v+h/+v/BAAYAAAA9//o/wsABwAFAPX/4//m//n/2v/j/wkA4f/j//f//P8NAO//6//+/+b/EQDy/wIABgAHAOv/7P+s/wwABQAHAAcA9f8QANr/9P/5//D/DAAAAAkAyv/i//v/EwARAOn/IQDz/3v/5v/z/wEA9f8IAP///v8HAAQADADO//b/DQDt/wEA+/8KAPL/8v8jAP/////w//v/8f/m//z/FQAGAAUAEAD+//b/2//6//H/BAAQAP//4/8qAAMAHQAKANL////+//T/7f/u/wcAFP8dAMr/9v8gACkACwDm//T/EgD6//T/8f/3/+n/EgALAN//AwDo/+7/8v8YAPL/AADq/+L/8v86APP//P8UAMP/KgD8/wUA6//g/+3/BgDW//v/DwD7/wkA9f85AAYABAACAPP/gv/d/yUA//+4/wkAEAABAAYA+v8WAOH/4f/q/wcAHQADAAQABwAaAP3/CwAXAN3/8v8OAAUA8f+p//3/EQABAAEAGQD9//T/+//2/+7/BAANAPD/uv8NABcA1v8GAAEA8/+b//n/9//2/wcA+P/g/wYAsf8IAAkAAgALAAoA+f8OAPT/2P/n/wgABQAGAPz///8RAPz/JAD3//v///8LAOz/6v/e//L/CAABAP7/vv8GANX/CwD0//b/3f/5/wIADwDI/4v/BgAKABgACgA9APn/CwAEAAAA7f/w/+X/CAAAAOT/CwDp//L//P///wsAAwDu/wUA4v8TAO//+v8CAAUA3//x/6n////+/woACAD4/xAA6/8QAPT/8/8QAP//BgDW/+L/+P8JACsA6f8mAPn/U//0//D/AADg/////P/+//H/DAAJAOP/7P8TAOH////3/zUA7/+9/x0A+v8GAOr/AQD0//z//P8UAAsABwAXAPr/+//a/wUA7f8JAAYABADw/xoAAwDr/xAAtf/9/wIAAwDn//z/BACF//n/+f/q/xEAHAAGAOr///8DAPv/9P/1//D/7f8KAAwAGgD8/+z/GQD3/xQA+P8RAPH/WQD4/zsA+P/5/wcA3/8XAPn/DwCs/+v/8f8CAOP//f8gAP3/BQD4/yQA1//Y/wUA/P+A/9z/DQD+/9H/AgARAPv/CgD+/+//9//z//D/CAD1/woAFgAHABEAAQAJABcA///x/xoAAQD2/6n/CQD+/wUAAQAfAAgA6P8FAA4ABQAFABYA7P/J/xMAFgBYAAYAAgD1/53/+P8jAJv/CAD0/+T/CACJ/wgACAAGAAwACwD8/+j/9v/4/+j/CwD+//3/AQD+//3/+v8nAA0A+f/+/w0A9v8BAPH//f/+//z//v/M/w0AR/////7/+P+r//z/CQAPAOb/cP/6/w4AGgAQAO7/6P8BAP3//P/4//3/7v8HABUA5v8LAPr//f/7/wIA8f8LAPv/DwDu/xIA7P/i/wIAAQD5/9//n//9/wUABAALAPr/CADj/ycA1//o/xIAAQAFAOX/7//9/wMADgDs/xEA//+G//r/8P8BAN3/CgDy/xUA+f8LAAYA7f/y/xYA3//z//j/DAD8//3/AwD+/xAA//8MAAAA4P8AABMAFQAMAB8A9//8/+j/BwAUAAoADwD4/+3/AQAEAP//FwDf//f/CgAMAOv/AQAOAAAAEAAHAPP/AwAKAP3/8P8EAAsAAQD///r/7//z/wYA///w//H/7f8SAPj/CgD2/xcA7v/4////GQD//+P/8f/3/wEA9/8lAOT/+v8AAOn/zP/9/xoAAAD+//r/AAAWAAYAAgAIAIz/4/8SAP3/8v8BABAA/f8IAAEAAQAEAAkA5/8OAP//BgAZAPr/2f8DAAMAGADk//r/DgD4//n/tP8CAAIABAAFABIABADd/wEAHAAAAAQACwDh/9b/FAARANz/+/8FAOv/LgD0//b/AAARAKAA5P/z/8H/GAABAAIACAAJAPv/3//w/wYA8/8LAPT/+f/+//j/4//6/xwA5//3////EQDt/w4A/P/w//r//P/4/9b/FQBf//v//v/9/+L/+P///xAA6P/N//z/CgAZABYA5/+Q//n/+//7/wkACAD0/wkAFADm/wIACwD7//r/BACQ/wcA/v8LAOj/DQDp/wMA/v/8//D/9v+R/+v//f/+/wUAAgAIAK3/GwDz//v/EQD0/wMA9v8EAAoAAQAEAO3/CAD///3/+f/w/wAA3//y//f/CABGAAcAAwDy//T/GADs/wMABAAEAP3/BQDb/wAACQAGAOn/AwDi//v/CQAQAAgADgD2////9P8WABwABAAAAPz/8P/6/wMABgAVAPP/7f8TAOr//v///wkAEgD+/w8A+/8UAP//DQDy/wcA9//+/wQA///v//n/AwD6/xQA6P/2/yYA9v8CAA0AEwDt/wIABwDy/wQAuP/Z//b/+P/2/xcAvP8GAAwA+/8h/wUAEAD9////9//7////7f/2/xEAl//s/wYA+f8FAP7/EAD2/wcA/v///wwAFgD0/xAA+v8JABMA9P/X/wQAAAASAPj/+/8OAOD/AQCx/wwAAAAFAAcAHQAEAOz/BAAUABIABQD+/+3/6v8RAAsAwP/8/wMA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9v8DABcAAQAbABEAOAATAOb/LwADAAwABAABAPn/+f/8/+//JQAUAPb/GwAKAEcA+P8KADoADwBNANj/+f8GAM7/CQDy/wkAFADJ/xMAyf4XAN//8P/4//z/Xf8eANn/EAAs//z/CADv/xAAEwDt/y4A/f8IAAcAKv8WAAMAEQAGAPX/DgDu/xQAEAACACMAxf8lAOX/AgD7////6v8LAP7/AQDu//H/BgAZAP3/AwCw/wIABgDu/xkAv//v/zEAGADz/wIAJgDv/wYAzv8NAPz/6P8DAP//1v9s/wYAIwD7/wQAAgD4/xAAEwDh//P/AADy/wEA6P/6/+3/8f/+//z/AwDf/6n/AACv//z/KwB0//P//v////H/EAAiAOr/BQABAAAAwP8fAFX//f////3/8f8EAAUAFwDG/z3/LADt/xIABgDL//b/5f/x//v/DAAEACcACwAjAAoAEwAKAOz/KAALABsA1P/3/93/NADx/xcA/v////f/6P/E/6D////v/+//3v8KAAYAof/x/xAA9v8NABkAAgAOANP//f8AALD/9/8KAAYAJAAGAOv/8/8QAAEA7v8DAAUA9v/9//b/nv8DAAQADAAYAP7/DwD+/+T//v////r/z/8FAOT/z//r/+3/0f8OAAEA+v/0/wUA9f8HAAMA8f/5//X////7//f/HQAPAB8AFgA6APr/7v8pAPr//f+B//X/BwDr//T/6/8fAPX/AwCa/wIASwAEAAsA//8NAB8A3//3/wQAw/8CAO7/CAAKANL/HADR/iYA1v/g//7/9P/Q/xgAyv8bAFL/8//r//P/FAAEAOz/HwD+//r/7P+K/xQA9v99/wAA+v8OAOH/EAD4//L/GADg/woA/f/0/+r/CQDn//v//f8CAPP/4////wkAAQAEAJH//v8RAOv/FQDa//D/NAArAOz/+f8NAOf/9/+P//3/DgDE/yMABwAGAHv/CAAgAOD/6/8HAPz/9v/1//z/+f8BAAkAcf8DAAcA7P9k/5//5//u/3IAw//o/xYAAgAgAOP/CAAHAO3/7f/y/+b/7f8TAAoAGAD2//v/CgAEABkA4v/a//3/+f/Y/8T/ff/m/wIAEADT/6H/AAANACYAAADm//H/6f/o/xgAEQAMAKX/wP/y//z/EAD5/9H/+f/Z/wcA4f8FABEA+f/A//X/tP8eAAEA6/8GAOr/IADh//b/+//0/wwAEwAIALv/6v/+//j/mf/0/8P/5v8bAPr/EQDs/xQAAAD3//X/EAAAAP//2v8BAAgAKAAIAPr//v/+/xQABwCA/wkA3/+5/xUA0f/C/x4A7v/O/xoADwD4//D/CgD6/9//+P9r/+n/CgD1/yAAuf/2/xMAvP8TANL//v8JAHX/HgADAPD/CwAnAPv/6f/m/xUA5P/3//P/+f/n/xMABAD8/xMA4P/n/1v/Rv8AABoAHAAKAN7/3f/j/xwACgAPAP7/AADo/wIAUf////H/zv/t/wUA5//h//H/8f8YAP//+v8CAIP/2v/5//3/GAAFAAwAFQAVAAIA7P/o//D/4f8JACEADAD3//z/NQBc/wcAHgDv/wwA/f8GAO3/iv/5/8L/sf/1/xUA8/8gAGz/9P9q/yIAEADp/6z/GwAbAAwA6v8CABEA+/8HAAsA5P/2//z//f8IAAUABQAHAAYACAAIAA4ADAALABv/p//w/+X/cQDh/wAAGwAJAB8Avv8RABQA6v/m//z/6/8DACMACgAPAPj/BwD7/wAAFgDr/9X/CgAHAM7/0f9m/+b/BgAOAND/4f/9/xAALgABAOb//v/k//r/JgAVAPf/v//I//n/+/8NAOf/7/8eANX/BgDg/wwADwAwAML/7/+9/xsA/P8aAAcA5f8gANP/BgD7//f/CQALAAsA1//m/wQA5f+0//b/4P/r/yoA8v/h//T/EwAYAPj/9//0/woA+v/b/+T/CgAeAPD/DQDt/+z//v8MAFb/+v/I/93/KAC9/73/JAD1/7n//f8UAP//kP////r/6P/l//D/6P8oAPn/9P+J/+7/BgDT/wEA4P/y/ycAjf8bAPX/+v8IABUANADw/9n/4P/v/wIABwADAOL/GwAcABAAEwDj/9T/m/9N/wgAFwAvAO7/8//I/+v/IgAoAAUABAD2//H/5/+o/wQA//+Q//X/GQDk/wIA+v/2/x8A9v8IAPb/kf/d//b/AwAPAB8ADQAMABQAAADd/9b/xf/n/woA/f86APv/AQBBAL//DAArAPH/EAArAAEAAQB5/+z/x/+c//H/CwD//yIAq/8PAFD/MgD9//T/y/8lAB4APwAaAAYA/v+T/x4AGgDT/9v/+/8IAA8ACQANAAgAAQAKAPv/CgAGABMAIv+a//f/BgBaANL/4f8YAAEABQDh/xUAEQDn/+v/AgD+/x0A+v8KABsAHgANAPH//f8SACEAyv8OAAYA6f/L/5j/7P8NAA4A2f+2//j/FAAwAAEA6v8HAPz/BgA6AB0A+P/Z/9n/AQD8/wwA4v8KAEUA8/8KANn//P8NAAsAyv/S/7z/EgAOABEAFgDt/w8AwP8KAPL/9v8OABMACADw/+f/CQDh/5j/7/8CACIASAD4/4b/cv8EABEA/P8HAAcADgD5/7f/tP8KAAcA6P8CAPD/8P/u/xYAiP/z/9v/5/8NAM3/sP8gAAIAwP/v/x0ABQB//woA/P/t//v/7v/y/xYA+P8aALT/0v8KAO3/9P/j/xUALQCb/xQA+v/i/w0ADQACAPP/2v/v/wEABQASAAwA6/8aAAUACQAWAOX/4P/7/7L/6f8hAB8A6//5/9n/9/8kABQAyf/4/+3/AAAUAN//AQAAAGr/8f8TAN7/DQD5//n/FAAIABsA+/+T/+7/0P/+//v/KgAMAAEAFQAOANH/6P+u//X/EgATAA4A8v8OAEIA8f8SACQA3P8VABwAAwAEAKv/9f/l/7X/+P/s/wQAHAD9/woAs/8sAAIA+/+3/wgAFQBSACMABADt/5v/HQABAPD/9v/s//L/7v8FABYABQD9/wkAAgADAAgADADR/4r//P/w/1QAyP/3/wkAAQDu/7n/DAASAOD/7P8FABcAGQD//wcAIgC//w4Akf///w8ADwDU/xMAFAADALz/h//x/w0ADwDd/9X/8v8EACkA/f/y/x8AHwALAEEAKAD8//3/3P8EAAEAAADm//b/MAD0/wwA2v/H/wYAFQD7/+D/wf/x/xQA/P8fAPH/HACC/w8A9P/1/xAAHQANAPb/5/8JABX/sf/p/xMADwBHAP3/dP8BAAcA///x//P/+P8QAPv/yP+M/xcA9f/b/x0A9v8GABgAFgACAPH/8v/i/xQAzv+7/x4ABgC9/woAHAAGAJf/DQD6//P/7v/a//T/BgABAAAA1//3/wYA5v8CAPr/LgAfAAAADgAIAPb/DgAJAP3//f/o//T/CgAHACgACgDu//3/CwAyABcA4//0//z/8v+0/yIAFgDw//z/4////yAAEQDO//b/8//+/9L/9//r/wEAfv/o/xYA9f8QAPj/8v8kAAoAIwAHAKT/AADn/wwABAAaAAwAGAATAAcAyv8KALH/CAAKAPH/HQD3/w0AOADz/xQAFwDe/w8AJwD//xIAsP/z//z/v/8FAPn/DgAgADQAFgDm/yAA/f/k/7//zv8EAEYAGQACAKL/e/93/yUA5P/y/wAA/v/0/wAAHwABAAQABgAPAAkA9v/8//n/zf/7/xAAOQC9/+r/7/////P/7f/z/xgA2//8/w8AHQATAPz/BgAuAJX/GwCW/wIADwAgALb/EgAWAAUA2v9g//z/DAAKAOL/4v8PAAEAHQD9//j/JwAyAAUARwAzAAYACQD3/wMAAgABANv/7P84APb/CgD4/xEA/P8LAPz/0//O/+n/BwDv/w4ADgAeACT/CADt//X/DwBDAAkA///l/xwAFf+z//H/FQDy/0EA9f+E//b/CQAPAOz/FAAfAA4A+P/N/2T/GQD7/9z/+f/8/wgAGgATAB4A///4//P/GQDg/8D/HwAEAMT/AQAZAAwA7f8PAAcA/f/9/7b//P/v/wIA/P/S/wIABAD8//X/PQBFABEAEAAYAAQACQD8/woA5/8GAPj/GQAXAAYALQAJAAoA7v8NAA8AGQABANv/CgABAFH/JwD6/wUADwDp/wQAEQAXAM7/8P/z/wAABAAWAM7/+v+J//T/CwAAAOD/GADh/xMAAwAlAAUAoP8NAAAADAADAAoACwAPABAAGwDd/xsAdf8TAO7/GgD6/+7/BQAtAPL/EwAWAPX/EQAwAAMAFACp//n/CwC9/woA2v8NACoATQAOABUAHwD4/wwAnv/r/+//FgAbAAMAgf+7/xYACQDp//7/+//5//D///8EAOv/+v8OAAEAFgD5/wUACADp//7/AgAYAK7/7//M//7/BwA0/+v/FwDb/wkAEgAsABoA8/8GAC8Ao/8dAIv/9/8MAAMAs/8RABMABwC9/17///8HAAQA3/8MAA8A5P/+//v/+f8nAD0ACQBLADIABQANAA8AFQACAO//vv/m/yYABwABAB4AFgDu////2v/Y/8n/3/8DAOn/4v8cABEAMv8TAI3/6P8JAC0ADwAHAOb/BAAy/6r/JAASAPr/LAD0////7P8YAP3/6f8EAAgADADu//n/1v8hAPr/6P+7/wMADwAJAAUAFQD6/+r/4v8kANT/sP8bAPT/vf8DABQADAD2/xUA8//s//D/4v8AAO7//f/1/9z/FgAPAAwABgBHADIA8f8pAA4AAADd//7////8/wAA8/81AAEACAAcAAIAJwDc/xQAPQAdACYA9v8KAP3/a/8YAPH/GAATANz/FAD0/xEA4v/r/+7//v+b/x8A1P8FAIj/7v8NAPv/EwDS/+f/JgD8/yMADQCR/xIA7/9FAAYA8P8LAP7/FAAjAPD/JgC7/zcA9P/3//3/9f/8/xcA+/8PAAAA9P8PADEABwDu/4T/+v8NAH//CQDE/+n/OgBVABEADwAuAAAAEwCv/xMA7v/e/xsA//+V/3f/IQAbAOX/BQADAAIAFgAHAPr/3/8EAP3/BgAFAPD/9f/9/+3/6v8CANL/tv/8/8L/AgAfAED/6P/w/+T/8/8MADAAFwD6/wEAJQCT/9L+pv/j//j/7f+v/w4ACwD6/9j/cP8hAPP/CADs/yYACgDu/+z/9v/7/w8AOgARADcAKwD0/woA9v8hAAEADwDn/+3/DACAAOr/IQAUAO7/6v/Y/8n/t//1//j/7f+t/xkA9v9l//v/w//3/wEAy/8IAAwA5P/h/w7/t/9JAA8AAwAyAPr/BgDg/xkA/P/s/xAAFwD7//T/GwDn/wQADgDy/9D/BwAOAAYA+P8MAOf/8f/a/xkA6/+0/xoA7v/J/wcAEAAEAPX/AAD6/+v/8P/P/wAA8P/u/+3/rv8aAAsAGwDO/1kAGwD1/zIA+v/0/+X/CQCV/9L//f/h/xwAEwDx/w8A9f9KAPj/HgALABoAHgDf/wYA/f9L/wYA9P8MABEAsP8NAMr/CAD6/9v/+f/q/+v/EwCw/wIAI//u//D/5v8dACwA5/8aAPH/EQACAI//BgDu/xkA///t/w4A8v8UAAsA7P8hAHP/IQDX/+z/8P8JAPf/BQD0/woA4f/t/wsAGgAFAAIAj//8/w4A3/8ZAL7/AQBFAB8A+P8oACkA+P8JAKH/DADo//j/CgAMAL7/of8PAAEA3P8MAAoA/v8IAAYA0f/X/wAA8/8AAN3/9v/0//D/6//9//X/l/+b//T/vf/+/yQAfv/y/+//6f8DABEAFwD9/wUA//8SAJ3/IQB+/+7/CwD5/8n/AgAXAP//wv9Q/ygA7v8LAO3/DwDq/+b/n//4/+3/8f8xAA4AJwAYAPH/AwDo//b/DQAHANH/8P/y/2MA7/8fAAsA/f/t/9f/8v+F/wcA9P/q/9H/8/8FAKz//P/o//D/AADb/wYADgDZ/wYA4v+d/wcAEQAAAEsA7v/y/+r/EgAIAOT/FQD7//b//v8BAM3/9v8IAP7/5/74/w4AAQD+/wsA6P/o/7X/AgDb/77/7v/r/67/FAAMAP7/4P/+/+z/7v/+/+L/9//m//3/+f/R/x4Ap/8bAAQAQADt/+7/MAD4/+r/GgD9/wUA5P/1/+H/LQAUAPv/kP8KACgAAAAPADUAGQAsAPf/CAD8/9f/CwDn//r////u/xoAAP8TANT/1v8GAPP/cf8hAKz/AAB0/+z/6//v/xcACwDo/xUA7v////7/c/8MAPT/Ov/0//T/DgDs/xUA+//p/xkArf8VABAA+//k/wsA6//v//L/BQDL/+j/AQAeAAAAGACg//r/GwC2/woAsv/P/zMAGgDv/+n/DgDp//v/rP8EAP7//v8fAAQA+P/o/wAAAwDH//P/DwDu//j//P/+//r//v/6/+n/BAAIALr/vP8L/9z/5f9nALD/BAAaAAUAFwDD//v/7v/g/+L/5P/8/+X/OgAIABwA8//6/wcA5/8kAMn/wf/z/wYA3P/L/3X/+f8IAA0Avf9t//j/DgAnAAMA8v/3/+7/+P8UAA4AAADK/9v/8P/4/wcA+P+1//b/v//6/8j/HQAJABoArf8PAIr/KQDv/wYAAADp/wYA2f8HAPr/7P8DAAcAFAC7//D/AwDq/37/+f9u//D/QAD2/yUA9/8YABgA6P86/wQA8v/0/8n/BgAJAC8A+//b//f/1/8QAPr/ZP8VAOL/tf/s/9v/pP8PAM7/qv8lABMA8//e/wIA9f/h/9v/8v/9/wUA+f8oAGv/9v8JAK7/8v/A/+3/CgCM/y4ADADh/wAALAD9/+H/5f8GAOD/8//5//f/6v8KABEAEAAOAOX/BQA5AAUA3/8fAP//9//1/7n/5v8fACQANwAJACMAzP/e/7j//v/e/+D/2f8KAO//5P/o/+L/DwD//+b/AABn/83/6/8JACEACwAMABkAEAAHACgA4//u/+X//v8MAPr/9v/r/zkAlf8NABYAAgAHANr////h/zb/+//x/4D/7P8cAPz/MgBJ//j/XP8TAAoA8f+w/woADwAqAPz/AQAVAKz/GgAfAMj/6v/2/wYA//8FAPH//f8QAAMA3P8KAAcA/f8//57/6/8EAHcAy//r/xcAAwATAMf/+v8VAN3/x//7/+7/BQAPABAACQA0AAMACgDu/yUA7v+8/wEA+//t/+L/j/9k/wEACQDB/7n/7/8UAC0AAgDk//b/6P8PAC8AEwD+/87/y//5//f/CADr/93/FgDT//z/2v8IAAwACAB3//z/kv8tAPr/EAAJANb/FQDA/wIA/P/x/wMAHQAXANT/9/8BAMr/qf/w/7n/0v89APD/zP8zABIADgADABAA8v8CAPH/wf/6/wEAOQDr//7/4v/v/wwABwCb//z/3f/V/ygA0P+8/xQA4P/D//n/EwD+/47/BgADAOH/8f/z//j/EgD2//j/cv/v/wwAg/8sAM3/DwAaAEH/PQADAOr/DwAcADUA6f/T/9H/9P/1/wQAEQDc/w4A//8BABIA7v/D/3//Rv8LABsAIQDa//P/0//t/yIAIAAeAPr/DADM/xgAs/8AAOz/rf/7/wkA4P/s//f/7f8ZAOv//v8BAHn/7P8AAP//BwD+/wsACQASAP7/+v/g/7j/6P8IABsABADk/9D/QQCh/wsAEADv/xQAGAAGAPn/jv/z/8r/gv/w//T///8WAKT/2P9x/yMA5v/3/5X/HwAXAEsADwD//woAuf8WAAkAsv/r//f/+v8IAAgABgADAOP/AQABAAgABwAGAE3/iP/k//H/XACn/wQAFwACAAoAx/8XABMA7f/g/wYA/P8dAAUACwAYANv/BQD4//L/FgAeAL3/DgAPAPz/w/+j/9b/9/8LAMf/t//0/wsALgADAO3//f/+/w0ANwAYAOL/1f/g//3/+/8OAOP/6/88AOz//v/T////CAAjAM3/7P+3/y4A+v8QAAkA3P8OAMr/8v/2//v/AwAWABMA6f/h//z/p/+V//L/5/8IAEsA9v9r/8z/AgACAPH/FADa/wMA8v+D/9r/AQAhAN3/EAD7/+j/DgAVAHD/4f/s/97/FQDK/7L/GAD0/7P/AgAZAP3/ov8GAPP/6P/4/+L/8P/5//3/EABb/+//CQDb/+n/3f8LACwArv8hAP3/9v/4/w8AEgDs/9X/8v/1/woAFgAPANb/DgAHACIAFADa/9D/7//n//D/JgAhAPv/+v/c//P/IAAFAAIA9P8GAOX/5v+3/wMABwCb//f/FQDL/+X/8v/c/xQAAAAMAO3/jP/3//D/CQAHABoACgD//xMABwDh/+n/xv/r/wQADAAHAOT/7/9FAOb/DgAUAND/FAAnAAAA/P9v/+7///+s//D/6P8FABMA4v/z/8P/JQD5//L/lv8WAAcAdAAlAP7/5v+b/xwAIADc//D/BwDw/wAAAQASAPz/BgD//xEABQAFAAMA2v97/+3/DABUAFn/3P8BAAEA7v+//wQAEADZ/+r/BwAAAB8A4/8HACYAq/8DAJj/BAARADMAyf8JAA0A/f/l/5n/z/8DAA8AxP/G/+T/CAAmAAEA/P8XAB0ACgBBACQA6f/w/+7//f/6//7/5v/e/yIAAQAAANH///8EAAwAuf/e/7v/FgDq//X/GADd/yQAi/8FAOv/9P8HACQAFwDt/+n/EwB6/6D/4v8PACIASAD0/3v/4f8HABUA+f8gAAsABAD3/9T/gv8EABIA0f8QAOP/9v8UABcABQD5/+r/2f8ZAM7/vP8WAOX/tP/2/x0ABwCx/wwA8P/t//n/3v/4/+3/BwD9/2P/+P8QAOL/AgD6/yUAGwDg/ykAAAD4/wMADADf//P/5P/w/wYA+/8nABMA4v/5/wMADAAWANb/0/8SAOb/4f8qABYA8v/6/+f/+f8cABgA4//y/wIA+P8SAPv/4//2/3b/5P8MAMH/9v/6/+3/FQD2/xYA//+I//v//f8OAPj/EgAKABMAFQACANH/+v+x////CwAWAAsA7f/+/z0A7v8TAA0A3/8XACIABQAUALv/+P/1/8j/BADn/wgAHAA5ABcAu/8RAPH//f+W//7/9/8aAB8A+f+h/6//FwACAML/AAD7/+3//v8GACMAAAAPAPn/BQACAPT/DAD//4b/8/8BAEEAqv/w//X////y/zH/6f8RANv/8P8QACMAFQD8/wcAMQCM/xIArf8EAAsAGwCx/w8AHwAMALn/gP/3/wMADQDP/+j/9//x/xYAAAD3/yAAJwASAEYALgD0/wIAzP////r//f8AANr/MQAeAP7/8P8OAPf/AgDW/9//yP/4/wQA5P8UAPn/KgBu//z/AADw/wYAPwAXAP//+f8TAF3/mv/t/xYAFABHAOz/bP/l/wQA+f/o//z/7v8CAPn/q/93/x4ACwDh/wsA+v8EAAoAGgAWAOT/8v/j/yUA2//E/xkAAgCx/wYAGAAEAP7/AQD3//j/5v+x/wMA9P8LAOb/a/8GAAoA7//0/zoALQAFAB8A+/8FAPr///8IAPT/+f/m/xUAAwAFACkADQD9/97/DQA9ABwA6f/2/w8A9v+J/yEABgAFAAcACwAAABEA/v/Y/+3/+f/n/9b/FQDT/wUAgP/u/xAAyf+D/wEA3/8LAPf/GgDg/5T/CgDp/xwA/f8CAAoAEAAWAA0Ayv8YANf//v8CABQADwD0/wIALADv/xIAAADV/yEAMAAEABEAo//x/wgAuP8GAMr/BQAsAEoA+//z/xkA9/8IAJX/+P/j/wEAJQD8/wIAof8UACUA2//0/wIA6P/5/wQAEAD1/xAA/P8AAA8A7/8CAA0Atv/k/+f/NACH/+z/8v8BAA0AKP/n/xEA2/8CAAkAPAAZAPX//f8gAKb/GgCj//D/DQAGAML/CgALAP//0f9l/8z/BQAAANL/9/8UAPv/+f8DAPD/IwAsABEAQwAqAOP/AwD4/wsA/f/5/+7/4P8gADEA+P8OACQA6v/b/+b/6P/D//X/AADd/8P/CgAgAHH////A//H///83AB0ADADX/wQAcP+s/yoAGQADAEwA7//x/93/GgAcAPH/EAAZAPT/9v+S/wMAIAAPAOT/TP///woACQAOAAsA1P/u/9f/HwDg/7f/GwDL/7z/CQAWAAUACgALAPz/BQDw/8T/AgDp//z/8/+c/xQABgDn//P/WQAVAPf/RgD5//v/xf8GAAcA9v/1/+z/JgALAAEAEAAKAAQA3v8cAAcAGQAFAOv/CgD1/3v/EwDt/xQACQDT/wsA8/8JAOX/4P8FANX///8XALX/4v+l/9n/CwDe/woADwDZ/woAEwAUAOj/gf8DAO7/VQAIAPX/CgAGABUAMgDX/x0Awf8GAPz/EQDt//v/BwAWAOX/CgDh/+3/EAAyAAYA+/+a//L/EwCR//r/hf8UADEANgD2/zAAEgD4/woAtP8aANT/CwAkAP//kACt/xsAEADb/wwA/f8JAAkACAAVAOT/BQDw//T//P/u//f//f/Q/+L/8f/f/7H/qv/F//v/KwBF//v/7f/c//3/EwA2AB4A+f/3/y0Aj//v/rv/3f/3//b/u/8CAAwA9f+9/17/+f/3/wMA3f/1/wIA7f+h//3/2//+/zAAEwAuACMA4v8DAOr/NQD/////7//Y/w0AWwDr/yYAGQDo/+z/2f/q/7H/GQDz/9//8P/0//z/c/8KAK3/5v/+/yIAGQAWAOb/6/+D/8//wf8fAAcATgDb/wYAxv8WAAYA2/8ZAPj/5P/2/5j/EwAHABQA5//+/wQAEwAEAAcA///W/9b/vv8RANn/wP8XAOj/rf/4/xAAAQDq//3/7v/s/+7/xP8IAOr/+//r/4j/DwD+//r/5v9gABAA3f8uAPr/6v/d//n/lP/5//H/2P8tAAkA8P8AAPj/HwD2/xoANAAeACQA7f8CAPn/nP8JAPP/6/8SAOz/AQDS//z/6v/G/wkA4/9w/xQAsf/q/4T/1P8EALP/EQAOANT//v8BAAcABwCf//D/5f9WAAkA2f8NAPj/FAAGANv/GACX/xkAEwACAOf/BwD+////2/8KAFb/6v8KAA8AAQAAAJz/7v8GAIX/FwCc//L/JAAPAPP//f8gAN///P+u/wsA1/8kAAsAAQBw/5D/EwAZAN3//v8ZAAAA/P8MANL/6/8AANP/BgDb//j/4//3/9D/6P/x/8z/kf8AAKz/AAAgAJv/5P/Q/9z/+P8DAC0AAwD4//P/GwCR/xMAuP/y/woA7P+//wIAAADz/8r/hP8RAPP/CgDh/9b/7f/p/2L/AwANAOL/JgAKACIAFwDn//z/6f/4/wAABgC+/+b/6v9SANz/CAAFAPr/4P/R/9D/yf8gAN7/4f+G/+3/+f+s//T/9f/j/wEA+f8PABEA1P8BAJH/r/8+APz/AQBeAOX/6//f/xgAAQDr/wEAAADh//7/cv////f/FwAKALj+9f8DAAQADgADAOz/5P+X//f/1f+o/9D/7/+w/x8AEAD9/+L/AQD5//r/+P/Y//b/6f/7/8j/hP8eAID/BgD6/3MA8f/Z/xoA8v/o/1wA7f8IAKL/7P/f/yYAMQADAAYAFgARAPX/DQAaAB8AMgDe/wsA9v/U/wYA3v8JAOb/1v8WAK7/BQDu/7j/FQD4/5r/GADH//T/oP/k/+z/8f8XAOr/3v8LAMj/8v8oAG7/AwD2/+j/8v/o/w0A3/8QAAQA6/8NAF//8f8VAIP/1v/8/+v/AQDo/wsAjf/u////IAAKABwAbf/u/wkAl/8FAMD/CgAtABYA6/8ZAA4A3////5r/9//u/0oA/f8NADUAkf/+//P/o/8FAP7/7v/b//T/EgD0/wMAAADs//z/CgC4/6n/Ef/a/83/dACR/+v/GQD7/xUAyv/u/wEA7f/7/9D/9//a/23+/v8qADEAAwARAOf/IQCn/6L/5f/O/9j/6v90/x0AGQAIAJj/kv/d/wMAHgAFAAQA7v/3/9r/AAAEAO//5P/o/+r/5P8RAPz/9//k/wMA+f+x/xwADgDp//D//P+H/xcA8//8/+L/2f/8/5n/2f/t/+L//P/y/w8Awv/t/+v/3P+Y/9n/n/8GADsA3P8hAAcA/P8PAN7/Rv/b/+X/8f/W//3/AwA5AOv/yv8LAMv/0P/A/0//AADR/4r/BQCo/7r/AADh/8j/BAAQAOb/wv/u/+T/2/+4/wEABwD6/xQAGABx/+f/BwDO/9//Yf/y/9r/u/8KAPj///8DADIAz//g//L/GQD0/6n/1/+5/+v/9//J/77/EADl/xYAOQD6//n/AAAyAA4A+f+n/97/GADo/ygA6f8MAJP/HgCj/+v/9f/y/+v/CQCb/+f/yf+0/xcAiv/P/yMAaf/H/woA2f8GAAkACwATAA4A+/9LAOD/zf+C/wsA5P/6/+r/2f8uAHH/CAAJAOn/DgC//xEA2v86//b/CACP////LwD9/8H/f/8IAGv/3//t/8b/o/8JAPn/6f/I/wEAJgDC/wcA8f/B/+7/+P/w/wIA+v/6/+f/EgABANf/BAAKAAQAp/8N/9L/8P91AK//0f8PAAsAGABE//j/AwDZ/9z/CwDo/woAFwACAAwA5/8AAAEAAAAtANH/uf8JAP//5//V/5L/iP8UABEA0f+i/93/EgApAAUAqf/9/+f/BQAlABEA///K/8//+v/1/wsA6//d/xsAAAD4/8//GwAHAP//ov8OAHj/KwDP/xIA/f/o/xsAnv8CAPv/4v8AABkAEwDC//v/9P+8/4///P9x/93/NADf/xQA5f8HACEA+f/1/8n/+//v/7r/+v8MAD8A6v/1//n/4/8bAPj/of8NAOn/t/8ZAOj/tf/7/83/zP/1/xcA7/+z/w8A8f/0/+f//P8JAPX//P8GAKb/7v8bANj/CQDL//j/FQB5/yoAEADx/wIAMgAlAOL/7//w/97/xf/z////6P8RAPD/EQASAOn/9f+n/yMA9v8ZAC8A3f/y/7X/6v8dAA8AMAACABkAuP/b/3//1//t/5n/1/8TAKP/4P8AAO3/BgDS/+n/EwBQ/9r/5v8IAAUACAALABQAFAD4/2H/2//X/7n/+v8JAAwA9P+2/z4Alv8LAPT/8f8NABIADQD2/yz/9v8SALL/7v/+//v/CwB//9X/jv8AAPH/CwCQ/wUAAwAtADUABgANAL3/GgAIAM7/+f8JAOH/AwD7//H/6/8PAAIA5f8PAP//AQCT/27/4P8QAE8Apv8IABIACgAXANr//v8WAOj/6/8DAOv/HwACABIAKADY/wAA8v8IACoAtP+f/wIAAQDn//L/o//u/wkAEgDG/5r/8/8RACoABAD4/wAA9P8VADAAFADv/+n/xv8FAPn/DwDy//j/KACb//b/zf8OAAMACQDE//j/lP8uAOj/7v/8/9X/DgDP//f/7//d/wAAGwATANj/7f/3/5P/jf/y//n/EABDAPT/e/+V//T/DwAEAOP/8v/2//X/nf/v/wkAMwDk//7/6/+G/w8AAwCo/wwA1f+4/yoAyv+0/woA7f/J/x0AFAD+/6X/EgD5//z/CQDv/wAAAQD9//b/Wv8IABgA1v8MANj/CgATAHL/MgAGAN//FAAkABwA5//i/+//8P/4/w8AFwDc/xAA/P/w/xUA6P/V//r/EwDs/yQAIgAaAPb/x//t/x4ADAAfAPz/CQDI/wkAVv/T//D/Zv/l/xMAt//l//3/5v8YAN///f8WADb/8/8BAAsA//8RAAsAAwAYAAUA0P/m/47/zP8CAC4AFgDq/+3/PADq/w0ABwDp/w4AKQAEAAAAqP/z/wYAtP/x//D//v8LAOv/3v+i/wYA7//w/6D/JAD6/4cAMwAGAPD/s/8SAPX/q/8KAAoA5P8BAAcA+P/1/wIA9/8GAAcA4v/+/8b/X//o/wMARgCm/9z//P8EABkAe/8GABAA3//5/xYA9P8ZAAUACAAlAK//+f+4/wEAHADk/9f/CAAKAMf/w/+7/5n/7v8XANL/pv/6/xAAIwACAPb/BAAMABMANQAXAOb/3//T//z/+f/5//v/3f8fAAcA9f/V/w0A/P8EAKX/9/+n/ykA8P/l/wUAwf8nANP//P/f/97/AAApABMA8P/b//D/g/+H/+z//P8iAE0A5f9y/+v/8P8eAP//DwABAPv/+v/K//H/FAAoAOj/LQDf/8X/FwAUAA8At//p/9P/IAB2/8f/+//X/8r/HAAZAP3/3f8IAAQA+f/7/8/////8/xMAy/9h/xIAHQDR/wIABwDz/xEA5f8aAAYA+//n/w8A///u/+X/CwDm/+r/FgATAPj/BQAQAB4AGwDc/+//HQD//+7/IwARAPD/8f/d/+r/FgAJAA4A6f8TANz/3v/u/+j/9/+V/9r/CwDB/wEA9//5/wwAzv8FAPf/dP/w/+n/AQADAPj/CgAaABkA9P/b/+z/xv/8/wUA7v8QAAcA+/89APn/EQD//8b/DAAgAAsAEQB8//H/AQC0/wEA6P8FABkAGQDo/9L/9P/b/wQAm/8mAPP/XgALAAEApP+b/xsAGgDo//r/BwDn/wcA/P8TAPj/AwD7//r//f8KAAkA3/8Z/+f/7P8sAK7/y//Y/wkAEgB1/+7/AwDT/9D/DAAUAAQAAQAPACYAhf8LAMf/BgAYAOv/sf8GAAwAAgDn/5P/+//d/xYA0v/Q/8v//f8VAAMA9v8QABgADgA6ABwA+f/p/+P/9P/5/+7/6v/o/wgA+v/4/+3/BAD4/wIA5//t/63/HQDp/97/DQDj/x0Ap////+T/2v8BAEAAFgD5/9//8v9y/4T///8ZABMASADz/4T/2v/8//v/6f/p/xMA+f/8/2r/XP8VACIA4v8NAOz/9f/C/xUAJADj/9j/2f8VAN3/0P8KAOj/xf/u/xEAAgAMABAA9f/9//P/iP8AAPH/AwDw/1T/DgAfAOj/EQA5ACMAFwAPAAEA+P8VAPr/EgDy/+//5P/n//7//v8PABwA9v/z/wUA9P8kAOf//P8TAPn/vP8eAP//IAD9//j/+f8QACMA+//f////sP/5/xUA2f8DAGb/6f/+/7//wv/f/+b/AADZ/w0A5/93/wUA7f8RAAgACwAKABQAGQAGAN3/BwD0/+v/DgAXAA0AAQAAAC8A9v8PAPH///8DAEYA/v8bAKz/9f8jAKz/CADT/wsAKQAaAPf/2v8JANz/8/+l/xEA4P9GAB0AAQDz/8n/HgD5/4L/7f8NAPb/BAD+/wYA9/8OAPv/9v8EAOz/9v/1/4j/5P/1/zYAlP/X/+v/AAARAGz/6/8CAOD/CAARABoAGwACAPn/LgCW/xQAev8CABMA+//N/wIAEQDG/+X/kP++/+v/DADe/wEADAD5/9v/AwDu//T/IwAAAD8AFADy//z//v/1//3/9f/v/9v/EwAhAPL/BgAYAOr/2//t/wIAg/8HAAMAy/8HAAAAIgBk/wEA+f/W//z/LAAVAAcA9P8LAGj/nP80ABUA/P9UANj/BgDj/xIADQDg/w0A+v/w//f/pf/t/xYAHgDp/5n/7P8IAOL/DwAKANX/yP+y/xYA2f/G/wkA1f+y/xQAHAD7/////v/p/wkA6P/G//r/8P8MAOz/jf8PAAMA9v/4/1UABQDx/xIABADr/wQA4v8HAN7/6//m/woACADV/xEAFQABAPL/BgAhACAABQDh/wgACgDL/wsA5v8LAAoA8f/8/+3/9//8/9H/CgDh/5H/CwC8////sf/r////of9S//7/0f8AAOD/AgDb/43/AQDw/z0ADgDg/wsA//8YAAsAz/8PALj/BQARAOj/EgD5//b/AgDT/wkA6P/j//3/LwAKAA0Aqf/y/xQAsP/1/73/CgAeACcA+v/I////4P8DAMP/DACv/0sA/P8BAM3/s////xMA6v/w/wwA8/8GAP7/CgDr/wEA4v/d//7/4//z/+X/u//E/+b/7P98/2L/hf/9/xkAc//q/+v/0f/B/w4AHgAbAPn/6v8xAJT/EACe/+f/DAD1/7r/+P8NAP3/4v+w//X/3/8LANv/tv8MAPX/q/8MAO//5P8hAP//KQAQANr/6f/t/xcA//8DANT/5/8DANf/8/8eAP//8f++/+H/4//R/wsA8f/a/+z/4//1/3P/7P/L/9v//P/7/xMADQD//+n/nP+j/9H/KQAKAEsA2f/8/9z/BgD3/+r/DADn/9v//f95/yIAGAAcAOn/of/r/wgA7/8QAAsAzv/O/2H//f/A/7n/CwDr/73/7P8aAAUA9f/+/+z/DgDZ/7//BQDd/xAA7P9o/yQApv/t//P/XgAbAPP/HAD7/+3/5v/u/woA5//l/+7/9P8BAP//GAACAAMA8/8MAAgAHgAVAAkABQD4/6r/AgDz////EwDw/wQAzv/u/wYA0f8TANT/lf8RAMn/3/+L/9b/9v/G/+//IADO/+f/5v/1/8z/jv/n/+z/LwAQAMv/CwDv/xIABQDi/w4Asf8MABcAKgDr//f/9v8EALr/BgDN/wgACwATABIAGABC/+j/BwCp//P/gv8cAB4AFQD//wIAAgDU/wEAu/8BANP/BAATAPf/WgC3/xcApf91//H/AgAIAPT//P/0//b/EwD2//P/0P/j/+r/zv+1/9r/+//0/6L/8/+B//f/AACA/9X/2P/T/w4A5v8TAPn/CAD1/xEAjv8ZANL/wP8LAMr/2f/n/7L/4v+4/6z/7v/j/wYA4v87AO3/6v9e/wcACQDX/xAABQAKAAEA7f/d/8r/3P/+/9r/8f8JAND/oP/o/wEAAgD5/+7/vP/a/4b/DwDh/+H/zf/a/w8AlP8RALT/wv/3/3T/CgADAAsA8P+w/97/QAD3/wIAQwDY/wIA0P/0//v/BAAEAOr/yf/9/4v/r//m/x0A5v/V/t//8v8DAA4A9f/X/9D/f//q/83/yv/W/+r/p/8mAAoA8//r/wAA3f///+//1/8PANn/EQDq/5L/GQCt//7/2/9qAMr/6v8ZAP3/5v9/AN7/CwCe/9r/4/8GAHL/+f/Q/xoA+//2/wEAEwAVAPb/uv/4/+f/0v/v//H//f/M/wgAEgC3/+L//f/c/wkA5f9z/wkA7P+Z/63/9f/m/xEAv//c/7n/9P+u/97/7v9x/wIA9f/7/wUA5v8LANf/DQDl/8H/8v/a/+v/AgDo/8b/+//l/wAAU/8HAIT/yf8TACcAEAAhAMT/6v8AAJn/6v/A/+P/GwAEAN7/+f/O/8H/3v+i/wgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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/v8gAAEA7/8KABYAFQAHAAYA7/8VAAUAHAD//wUACwD//xcAZgD2/w4ALwADAAcAFADw//r/DwAYABkAAAAKAPz/CQBS//r/BwAsABoABwD8/zQAzf8lAAkA+f8QAB8AGwAGAAgA/v8LAF4A8f/4/w8AqwD3/wQA8P8PANj/KQANABAAv//z/3//pgAtABUA9v///xUALAACACgABAAOAAwACQACAPb/AAAYAP7/2f8QABIARAD8////BgDr/wEAGgAJAPv/+f/F/xcA+f/h//z/5//4//j/LwDv/wUA7//w/xYA7P9c/x8A6f8QADoAFgAFAPL/7v8X/xkA2f8DAA0AAgD9/w0AEwDn//D/1v8EAAwACAAPAP//AwDf/wUAQ/8OAAQABgD///7/DgAWAAgADgAMALr/AwAGAAwABwAnAAgAVwAEAIL/AAACAPr/+f/i/wgA3v/5/xwADQCs//z/IAAPAAMA9P8MAAYA5/8DABAADQD2/xUACAD0/wgAFwAOACoAGAD8//r/DQAOAAkABQAJANj/HAD7//L/0P8pAO7/8f/x/yoADwAFAA0Ag/8XACYA/f8AANz/EwDr/9L/6f/+/xAAAwATAMH/CwARACoABQD2/wUAL/8pAA8ADAAuAPr/SQAQANn/+P8JAOb/ov/c//n/4P///zIABQAkABoA9f/8//P/GwAVAAEABgAUACkAHAAjAAMA/v8IAAgAAwDb/wUADwBF/wAA8/8XAO7/gv8fAB4A+P/1/zUA//8GABAA8/8FABQADQCz/wUA5f/P/yUABQDx/xgA//8sAPz/EQD6/wYAdwDo/9//9/9s////AgDs/xAA9f8vAAAA/v/T//v/aP/v/zAABQDW//3/AwAoAPf/HwAOAAUABgA+ABcABAADAPr/7v/Z//3/1/85APf/8P/5/9X/AACQAAgACQAGACsA3//1/+7/7f/3//L/EAD8/+b/BAACAMr/HwDe/2z/DwAKAAkAOAAHAEv/7/8C//r/FwDX/wMAAgAEAPf///8LAPz/6P8LAPT/AQAEAAsA/v8AAOD/BABC/+//CQAAAC8ADwAFAAwADgD+/wkAdf/9/xAACQD9/yMABgC5//r/9v/u/+j/8/8CABUAEwDb/wAADgAOALb/6v8XAEUAAADm//T/BADu/w4ADgAEAAsA/P8KAOT//P/3/w8A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8v/1/yEA/f8BAPj/EgACAOj/CwAFAA4A/f8FAM//EwACAAQACgDl/xYACQDF//n/+/8NAP7/CQDn//X/CgAdAP//5f8EACr/GgAGAPX/gwAFAE0AwP/o/wIABADy/8r/DAD4/8L//P8sAP7/MQATAAYA4//y/yAAFQAAAAkA//8AAAEA/v/4/wQAEQDz/wIAPQAQAAQA/P/+//H/GwDj//r/EQAdAPj/AAAKAAIADQDv//v/BQAJAAIAFQDm/+UA5P8tAP//LADn/wsABwAEAPn//v8IAGIA9v/q//v/i//3//T/AgADAPn/LgD///n/0//8/xv/7/8oABAACAAAABYALAD//xMAAwADAPn/9v8bAAwACADy//z/5//y/wkAPwADAOD/9//a/wMAcQAIAAcA5P8hAAwA2v8YAPf/8P/2//X/CADt/wQA7v+s/xEAx/97/xcA/v8BAC8ADAD///n/6v/5/wYA5v/x/wgA6f8EAA4A+P8DAOn/AACv/w0A9v8HAPj/AgDg/woAW/8NAPr//v/4/wYABQANAAAA9P8RAIb/BAASAPr/BgATAAEA8P/z/9f/BQD7/xAA/v/5/wgA1P/p/w4A+/+l//z/DQDW/wIA+v/6/wIA5v8DAAIACwD1/wwA/v/4//f/BQABABoA7P8EABEAAwASAAAADQDw//b/KQAGAPv/BgDn/woA7f/7////EQD8/wUAXwANABQABgAKAOH///8KAL3/9P8EAAUAAgARANT/AQACAAEABwDi/yn/KP8WAP7/AQDe/wQATwALAPL//f8DAPT/v/8FAAAABgDx/y0ACwAKABQACQDg/7T/FQAMAO7/DQAQABwA2/8DAPn/BADt/w0ABgD+/woABwD+//z/x/8ZANj/yP6f/yYAEQADABMAAADy/wEA+P8DAAAAAQAMAPX/EADn/ysABQAPAAsACAAJAAIA/f8CAAQAYgD2/+j/+/8TAPL/9/8FAOX/CgAtAA0AAADt//j/rf8gAFsAAwD6//j/CgAxAP7/DgADAPj/7/8jAO7/AAAHAPD/+v/v//P/+v9QAAMAAgAQAAcAAwA3/wcAAADu/wIAAwD//yAAw//k//n///8JAPj/AQDt/87/EgCn/5f/BwD+/wEAMwACAP//+P8VAAgA+f/r////CAAFAAkABwDq//X/9P/w/+r//v8KAPX/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BQAIAOL/AAAJAPH/+v8FABUAAAAJAAUAHQDm/wIA8v8mABEA/P8CAPX/JgANAPf/8f8PAMX/GwANAPT//f8tAAoAAQDs/wIArP8bAPz/8////wsA9P/s/xEA+f/R/yAAGgACANj/6f8IAPz/+f8bAG3//P/W/ycADwAPAM0ABgAaAAcA+/8JAKH//f/E/hEADADt/7P+HADo/wQADgD9////BQD2/wIABQD7//f/HgD+/wIADgAXAPn/+////+H/DAARAAUA0P/7//j/8P8qABX////K/uf/8f8DAAQA+P8MAPz/CQCQ/97/EAD2////+P8XAAYAAwD8/1EA3v/2/4//BADk/wEA9f8JAPz/LgCZAPX/GwD7/0IABgD///f/CwAAAPX/CQDx/woADQAfAAAA8P8BAN//CQC0/9//sP8SACsA//8FAPv/k/8NAPr/7P/6/wIA6P/t/xMA9//J////AAD7/wMALgDz/wIAFQAfAA8A7v/7/ywAav/+/xUABgD5/+X/GwDz/woA+f8FAPb/CwDU/wIABQDj/ygA6/5R//T/CQDt/9//8v/d/wwACgAEAPX/9f/8/zP/FAACAAkA9P+3/0IACgDo/wYAAwDt/9X/EQAHAAYAAwAqAPD/PQAGABP/+/8SABcAdf8BAP7/EQADAPj/8P/O/wkABAAMAAUA9f8bAPj/9P/6/wEAFwD//wEABAAbAO7/AAD6/wIAFAD0/wsAAAA4ANX/9P8CAOv/3f8lAA0A/P8AADgA4P////D/AgADACUAAwAJAPT//v8DAO7/GAD3/8j/IAAWAAkA5f///xIA9P8eAPb/JAD3/wUAKAD8/xcAFQABABIACAD//wsAEQD6//3///8LAPv/rP4SAAgA+f8DAPz/DwAGAPT/BQAoAAAABAAVAPz/8P8EAA4A8v/z//X/+P/2/wcABgDg/77/6v/z/yUAIAC0/yMA5v/0//z//f/3/wkA9//8/woABQDv//H/DAD9/xUA+P8DAOT/CgDY/wYAc/8OAPH/AwBR//z/CgDP/wEA+f8UAPb/AwAOAP7/+f8IAAEA+P8JAPb/+v8DACYABQDw//j/y/8AABAAmQCt/x4A2QD//xEAAgAEAAkA7v/x////hP8AAAwAEADy/wEA1f7//wYACwAKAPf/AgAZANX/DADz//v/KQABAPr/HQAAABMA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/f/2/x7//f9CAAIA0v/X//X/bwATAAYA/P8PABAACwD8/ysA7f/6////AQD1//3////3//f/CQCx/+D/9//y//b/MwABAPj//v8QAPv/9P/5//v/DgANAAkABQD7//X/+P///+///v8BAK//9/8GAOv/CQB0/w4A/f/2//n/+P8UAAMABQD9/xMALAAHAP3/+f///wkA/f/6/w4A+v/j/wsAKQDV/wEADADt//n/CgD0/5z/BgADAPH/AQDE//j/DwD///v//v8LAAIA7v8NAPv/+//9/wMA+P8CAAQAKADf/xYA+f9d//3/9v8sAAEAFQAeAA4Au//q/wUA8f8IAAUACQD//00AAwAMAEMA7P8MAAAAWf8HAFf/uv8EAAUA7P8LAAgACQD9/wYA/P9M//b//v////7//P9OAA4ADgAJANn++P+8/wcAPf8DAAYAHAAGAAQA4v8VAAYAHwAQABAA/v/v/+3/+v/8//z/8/+V/wQACAAIAPv/CgAGAAAA9v8JAAoACQAFAAgAHAADAAUA7v/+/wkA//8HABQA/f/+//v//P8GAM//EwANAOn///8FABEACAD+/3YAEgAoAP//AQD8/wAA/P8AABQA/v8QABIAAAD9/+///v8HAPv//f8DAPz/BQD3/yAAAgAJABQAAwAfAAoACAAJAA4A+//5/xQADAADAKH+DgDt/wUADAAAAAIABgD6/wcACQD2//7/JwAGAAAARv8DAPv///8eAPr/EQATAA4A1v/9/wEA+P8tAAUA//8HAPD/+v/8/xAA+f8EAAMABwDo//b/9P/q//7/AQAhABIACAD3/wUA7f8LAEH/BwAAAPr//v8KAAIABwD+/wsADQAGADwA9//8////BwCo/wAADAD9//j/fwAhAAcAAgD+//P/CwAIAAAAp/8SAA0A/f8BAMr/+/+L//b/+f/1/woA///2//v/+f/z//7/AwD7/wQAGAAZAAYAFQD0/yQA7f/4/zIABADt/yEAAwCy/+D////z/wAA8f8IAPn/DgD9/wkACP7p//n//f/N/ur/FgCv/wEABADz//L/BAD///b/FgD3/zP////4/wYA+f8HAFwAEAAKAAsAMgD4/8v/DgA8AP////8lAAUABgDc/xUA/v8cAA4ADwD//wMA0f/z//r/7//3/2wAAAAGAAUA8/8EAAMA9f/1/wYA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DgAXAPv/9P/+////9//8//X/9v/6/y4ABwD5//v/8/8OAAQACQCU/wYAGgDv////CAD4/wIA6f/z//n/+f/3//j/DwD4/+3/JgABAOH/EwAIAAEAAQAgAPX/CQD0//b/LAABAAUAFwDm/x0A5v8HAPX/EwAFAAYA4v8FAO7//f8FAOX/7P/5/73/+v//////+/8AAO3//P8EAAwA8v8EAPb/Lf8UAAr/6P/c/w0AUAACAJz/D/8BAPD/2P8JAAIAdf/5/yUA8v9EABAABQDq//b//f8FAAIACQAQAP//9//4//j/EAAEACoAqv/2/wcABAD2//X/AAAUANr/9v/+/w8ACADy//7//P/g//H/BgACAAEA7f/0//P/9f/p/yYACQAaAPn/9v8EAAAA8f8IAAIATwD+//r//P8KAPT/7v8bAPX/AgASAPz/9P/n/wQAGgABABoA+v8FAP7/CwAwAAcADAACAO7/7v8RAEMAtf8KAOv////+/wYA9P9EAAEAlv/x/+n/9P8OAAcA9f/D/xYACgDv/zAA7v/z///////O//f/AADz/73//f/L/woA3P/y//3/MwAHAPr/BQALAPr/+f8DAPn/CgAJADcACQAGAPD////0/+v/7v/7/woA8/8GAN3/BgDv/3UA9//+//z/+P/q/w0ABADx/xEADAAPABUA/v/0//z//f/u/2r/9f8JAAgAMwD9//f//v/8/+3/DwDk/43/BAAKAO3/BgAKAPX/AADi/xAA+/8GAPX/CQAJAPX/+f/3////7P9AAA0AFgAAAOD/9/8KAPb/9/8yAAYA/v8RABEAHgDt/wUA9f8PAAQABgD2/wQA8P8IAAYA6f8iAPj/vf/2/wAA/P8AAAUA5/////n/9//z//z/6P8s/wcA+v/z//n/CwBKAP7/5/+4//7/9P/R////BQD5/8j/JwACAAsAEQAMAPT/0P/+/wQA8/8SABIAGAD5//r/9f8OAMv+X/8HAPX/BQCR//f/9P9f/xIAz//4/7X/FgAEAO3/FgAAAOz/+P8FAAEAAADy/wUACwD3/+z/JADj/xwAAgD8//3/HgD3/w0AAwBeAPv/6f/7//z/+//0/xoA5/8SABEACQDy/+7//f8CAPn/PgAAAAAA/P8LADEAAgAKAAAANwDx//7/5/8CAAcA9f////7/UgD2/0wAAgAAAAAA3//I/w8A0f/7/yAADgAEAPv/NQDZ/xAA/f8DAP////////b/0v/z/8P/CQD3/+v///83AAAA+P8IAA0A///2//L/7P8RABEAHAAHAAQA9f8FAP3/9P+B/wAA/v/1/wMA5P8GAL3+2v8BAAAA9P/A/xUABgACAP3/EwBEAA8ACwACAPn/AgD///r/AAD1//D/AQAzAOj/9//e//n/3v8FAO//gP8IAAkA+P8CAAgA/f8DAOz/NAD8/wYA/v8BABAA/f/4//7/AQDr/14ACAAlAAAA5P77/xAA+f/5/ygABAADAAsA8v8cAPX/+f/9/xAADgAJAPf/BwD4/w0ACQDs/wMA///J//r/AAAAAAMACwDy//z/AwD///j/+//5/0j/AwACAOL/9/8LAEsA9/8IAAEA/v/6/9j/DQAIAAIAT/8fAAMACAANAA0AMgA///3/BQD0/wkAFgANAAEAAQD4/wsADAACAAcA9v8LAAUA/P/3//z/CQC3//7/+P8ZAAcAAAAQAAQA8v/5/wEABwD9//v/BAAFAP3/6/8YAO//CADq/wEABgAMAPr/DgADADgA/v/8///////6//f/FwC1/xEAEQAFAPT/6v/9/w8A+f8vAAEABQD//wkAJwAHAA4AAAAcAPH/BQD0/wgACgD4///////T//7/QQAGAOH/BgD8/2oABwDw//n/qP8KAAMA+/8rAMv/CgAEAAUA7v///wQA+f8EAPz/vf/+//f/8v/8/zQAAwD5/wMAEwD4//j//P/9/xQADQAGAAUAAQD3//b/BAD2//b/AwBj//n/BgDp/wgAPv8ZAPv/9//4/wsA+f8FAAkAAQATADoACgADAPz///8DAP3///8UAPr/CwADAC4A2v/y/wkA7//r/wYA+P+e/wcAAwD2/wMAxP/9/wUAAQD+//3/CwADAP3/EAD+//z///8FAPz/AAAEACwAz/8bAPz/kv4AAPn/KgAGAP3/GwAIALj/7//6//v/CQADAAoAAAAuAAQADABVAOz/CgACAFr/CADt/7r/BgAGAOz//P8LAAcA//8IAP3/Qf/1/wAA/f/+//7/UgAPABEABwCq//r/wP8JABn/BQAGACAACAAEANL/EwAHACEACwASAAUAEAACAPj/AQD+//P/pf8FAAYABwD5/wcABQD+//X/BwAGAA0ABQAJABMABAAGAPP/+v8KAP//CAADAAEA/P/8////BgDJ/x0ACgDs/wEAAwAZAAsAAQBzABIALQACAA8AAAABABoAAAAUAAAADwANAAcA+v/m//z/BgD7//3/BwD8/woA//8eAPn/CAAQAAkAHwAKAAcACwAGAPz/BQAPAAwAAwCb/ggA5v8FAAYAAQACAAgA+f8IAAsA+P8FACUABQAEACX//f/6//z/CQD8/xUACgAPAN3//v8AAPj/LgAMAP3/CgDz//v//v8VAPz/CgAJAAkA8f8BAPb/7f8BAAMAJAD9/wYA9/8JAOn/EAAWAAMABgD2////CgAFAAcABQAQANn/CAAwAPT////+/wgAvf8EAAwA/v8KAIUAIgAHAP//AQDy/wsACQD8/6v/DQALAAIABADH//7/4f/3//j//v8JAPz/5//6//f/+//9/wYA+/8CADwAJAACABUA9/+2/+z/+v8yAAcAxP8hAAAAw//l/wcA+v/x/+b/CgD5/xYACQALANj/5v8DAPf/x/7u/xkAsP///wMA7/8BAP7/AQD4/wQA/P9F//r/+P/8//3/AwBUABIACgANABQA+P/D/wEAPgACAAMAKAAFAAcA4P8QAAEAHQALAA8ABQDH/+v/9//8//v/9P9NAAMACQD///X/AgAGAPf/9f8GAAcABwAFAAcAEADx/wMA8/8KAAoA/v8BAKMAAAD6//L/9P/+/8D/HgAMAO///P8BAAMAAwD6/73/9f8wAKH/FgD3/wQAQAAAABMA/f8HAA4ACAD9/+3/8/8LAPr/CAACAAAA8v8QACEAs/8NAAIABQAjAPr/CAAEAP//+v8NAAYADADw/7n+AwADAAQACQD9/wAABgD2/wYAEAAEAP//HwAEAAMADADY//v///+MAPv/EgABABAAyP/6//3/9f8sAAcA8/8SAPL/+P/+/w0A+P8JAAIACAAVAPv/9v/0////AwAhAOL/BADm/+f/5f/G/7r+BAAJAPH/+v8GAAAABwD6/woA4v78//7+AwDy/wIABQDq//z/BgD2//n/AwAgAAoA+P/+//L/DQAEAAIAoP8CAAwAAgABAOn/AAD4//n/+v/5/wUA///5/xIA+P/9//r/CwD+/wQA9/4EAP7/DwD2/xsA9P/3/y0AAQC6/xkAAADg/+j//P/7/+v/fP8HAP//CwD3/wcABADm/x8AAABP//H/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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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+//t/7v/3//m////5//n//T/BQAzAGz/4//M/wgADgD7/+n//f8ZABUAEAANAMX/AgAnAMb/BwCI/ygA9f/x/xIAEAAaABIAEgC+/yIAHQALACoA+f8EAOv/2P8PAFEA6v8LANv/vP8XAIgA8/8bAMb/9v8MANj/EwAQAOr/VgAsABIAAgAQAOr/DQDe/+z/CAAXABIAIADo/w0A3/8GAMj+7//2/wIA0P8OABEAPgAUAAwALADD//3/wf/y/yYAOAALANf/BgDQ//z/HAAKAAIA4//6//3/DQD8/97//v8uABkADAACAPr/6f8iABgA+//f/yYADwDr/zUA8//u/wIAGgDk//j/8//+/wkAIAAzACIA8v/T/9n/AgDp/+//EQD//0UA5v/0/zMA1/86ANH/9f8EAAEAEgCy/wEABABfAO7/EADs//n/gf+X/93/EADF//z/EQA4ACoAJgACABQA6P/e/xYAGgDc/+D/7/8AAHn/PADp/xAACABAABQA6P8iAPf/7f8nABMAIQDf/zAAAgD5//3/CwDv/wUABgALAPv/IgDr/xMAJgDi//H/wv/i/yoAHQCb/7v/EwDr/+//JAAPAPn/EAAnAOn/EwAPACEAwP9FADkAGQAmACUAFgD8//3/BwAdABsA8P/1/wsA+P/p/wAAbf8NAPX/HQDw/97/uv/0////6v/0/wEA8P/s/yAAZv/6/7r/+f8VAPn/FAATABoAGwAKAB4AzP/i/xQAy/8HAHn/GgAhAPD/7/8IAFIAGAAAACgAFgAwAP//3P8EAAIA6//F/wwACwDj/wwA2v++/wcAFwD4/xgABgDA/wUA3//3/wAA0f/g/yQAAgDz/xQA6P/T/+P/4f///xUA//8OAPf/AwDf/woAzf7s/xUA9v/o/x0ACgAQABkABQAuAHb/8P+4//b/8/8/AAwAvf8AAFcA/v8hAPL/FQAeAAQA9P8oADEA8P8GAA4AGQAMAAQAAAD3/xwAFQAAAN//IgANAAoAFwBvAPD/BQANADYA6P/z//j/+v8XAO//JwDi/7f/3//z//T////9/wUAKQDp/ykAKwDW/zMA+//8/wsAAwANALH///8eAGYAAAANAOz/CAAkAJT/o/8UABkACgDr/wwAJgAoAP//GAAPANn/IgCY/+f/4v/u/wYAeP8gAPD/DQASADUA8v/f/ycA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6P8EAFsA4P8MANv/8v8QADEAnP8JAMf/6v8CAAIAPwARAGQABAAGALv/GwDp//H/1P/y/+//kv8AAPP/BgABADUA///t/ygADQDk/xUAGAAFAOX/OQDp/xkA5P/0//X/8v///yMADAD5/x0AJAAGAND/CAAcANT/NwARAC0A+f/v//r///8XAP3/1v8KABgACAA+APj/+P+v/0gAMQAQAOv/GACf/wQA7/8EABgAEwDn/wMABAD+//v///+h/xUADgAPAPL/6//D//3/DgD9/+j/9P/t//f/BQBt//T/0P8OABUA7f/Z/+n/EQARABQAFgDi/woABQCu//n/jv9AAPT/7/8OABwA/P9Y/w0ABwA1//r/FgAIAPj//v/9/8f/FwDy//D/+v/e/5//AgAFAPn/GQDw/+///f/g/w0A8f8CAEIAGwAIAM///f8EAP3/4//t/1kA8f8PAAgA4P/3/93/CAD8/vD/CwDz/9z/FwD7/xYABwD1/xUA/v/7/7H/7v/7/yMADgBXAOb/+f/7/w8APADv//L/NAABAAoABwD//+j/EwAhAPH/FQDa//T/AgADAPj/GQAfADQACwAbAAkA+/8KAAUADwDe/xcA8f8BAP3/7f8YACYAv//v/w0A4v///+j/sv88AAUAAwAeAPz/JADr/wAA5v/4/ycAtP/r//f/ZQD0/yMAk//y/xYANAB5//j/CwDY/wQA7P84AAQALQAFAP7/wf8YAPT/8//s/00A7f+L/wAA5//3/wEALAD4////DwAPAPj/FAArABYA5v9OACEALwDt//D/+P/l//T/HAD9/wsANQAsAAEAz/8eABkA2v8aABIALQDy/woAAgAJAA8A0P/i/xAAGAAGAPb/0v8EALT/QgA6APj/AgAFAI7/DAANAN3/CAAJAPH/4f8NAAUACQAaAKD/CQAUABIABQDw/8P/6P8GAPH/9P/d/+7/+v/w/2r/AAC7/xIADwALAP//9/8PAAUA7P8bAP3/FgAaAKr/7v+G/x0A/f/0/wwABQADAA4ABgD6/z//2/8BANb/+f8LAPv/xv8lAD0A9/8IAOn/r//3////7f8XAO//6/8aANT/HAD0//P/AgAkAAUA7v/X/+r//v/o//P/CgD7/zMAFQDK/+3/3f/b///+8f/1/+L/6/8NAPb/EwDx/9//+v/6//v/r//t//v/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PAAHAP7/JQAu/wIA9v8DAP3/EADg/wgAAwD///n/9/+h/xEAFgAjAPT/4//A/wQABwDx//r/+f/8//3/1f9o//j/0v8MABcADQD7//D/3P/r//H/KwDz/w4ADQCp/1D/jf8YAP3//v8GAAEA8/8BAAsAAAAc/7v/+P/6/wQADwAIANL/HQD8//T/AwDs/5L//P8LAOz/IAD1/+b/EwDY/wsA6P/4/xkAFwAGAPD/3f8CAPj/4v/u////9v8CABoA5v/O/9v/3f/p/vn//v8EAOP/EAD4/xsA9//i/9n////+/6b/9v/2/xUAGgAEAOP//P/6/xoAQAAAAOv/DQD+/xEABgDv/9f/GQAgAPj/hADp/+D/EQD5/+3/4v8TAPD+BQAEAOz/4P/y/wUA9v/2/wAA4v/9/xIA8f8LAOj/u//w/40ADQAmAP//3/9GAPb/EgAlAAEAIwDx/w4A9//M/xMAsv8WABgAVwD0//v/4P8aAAQAfv8kABAAFADf//b/FABDABUABAALANf/y/8VACkA8f/Q/+//7f+E/wkA/f/5/wUAQgD+////KgDj/xoAKQAZAP7/7f8JAAkAIAANAOH/5v/y/woAv//1/+7/BQAQAPv/y/8YABsA6f8HABAALgD//xIA+v/w/xkA9f/8/wQAFgDl//T/9/8RAKj/TAA+ABMADwAIABwA/P/y/wMACQDY//T/BgASAAgA8P/y/5z/BAARABkAGADm/zMA6v8lAA8A5v8NAAcA9P8oAGj/BADP/yEAEgD7//r/EgBBACgA7/8FAPP/EAAHALX/BQCO//j////z/wUABAD//yAA6//9/ygAr/8AAP7///8LAOf/0P8GAOP/9v8MAOz/ov/0/wIA6f8iABcAFAAKAOL/3f/q//P/7/8aAAwACQATAAgA2v/j/wQA5f+w////GgAcACAA2//n//P++f/b//7/CAAIACAADQAcAAYAIADx/woAsf/2//z/GwAOAN//5P/g//X//f83AAUAAAD2//7/FQAnABEA1/8WABMABAALAOn/6f8MAPL/9f/9/wYANAAMAOH//v8hACcAAwARAOP/DwDv/wgAy//h/x4A9f++//P/DwAFABgA/v/k/0MACADy/zMA+v8fAOv/CwD0/9L/AwCz//L/9/9aANP/DwDZ//L//f81AJH/DgAGANf/FQDt/0cA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BADC/wUALgD4//P/BwAPAP7/GADm////a/98ADYABABDAAoAEgAXAAAAEAAHAGQA6f/z/wcABADo/wAAvP8OAAoAPQAcAOn/q//r//f///8GAPb//v/6/xkAxv/x/+v/AwA7ANf/BwAZACIAHAASAAkAl//f/+7/QAD8/23/HQAPAMT/GADX//z/EQANAPH/AwA0AO//5v/s//7//f9n/yEA/P8AABEA7//A/woACQDm//T/CADW//P/3////0EAw/86ACsA6/8TAAoACwDw/9f//P99AA8AAQAJAP7/CwDA/wwASgD3//P////9/ycACgAnABsA6P8hALP//v+6/87/CQBCAPj/AQAFAPf/s/8MADYA2f/W//f/KgAqABsABQBYABgACgAcABMAmv/m/wIAEwD7/9P/HgDq/wwAHwD7//j/AQD3/+3/AAD//9L/GgDv//z/jv8iAJj/OQARAAUACAAKAOT/8f8DAO7/RgDj/zsA9v/r/9j/BQDq//L/BwD4/+f/4/8UAAgACwAUALb/of87AAoA/v8NAP7/YABx/wYADADz/+z/eQAlAPn/7v8MAPz//P4LABYAAAD9/1QACgAPABkAHwAVAEMAQAAbAMr/IgDO/ycAEQALAPP/FwAEABUAEwAIAP3/JwD9/6X/HwAlANn/GQAUAD0A5/8XABYA+v8RAPL/9P8JAAYA7/8JAOL/DABi/3UAUgDx/w4ABwABAA4A+//x/wUAZADv//H/EQD//+j/8//L/wUAFQAlABAA/f+t//H/AgD2/wcA9/8UAPz/x//I//b/8v///zUA7f8XABAAIwAdAMj/EAB1/xQA8P9AAAwAbv8VAPD/9v8QAAoAAAAdAA8A9v/2/y0ABQC8/ywAEQDw/2T/KgDr/wAADQDx/8b/+P/x/xAA7/8EANv/9P/n/+z/GQCz/+7/IQAPABUA+P8EAOz/u//3/wIAGAASACQA6f8SAL7/CABLAAEAGQDx/+f/HAAEABMALgD8/xkAEAANAKv/zf/x/zYA6//8/wIA6f+0/zYAMQDs/+T/9/8qAB4ADwD4/1MALAAUAAAADQCf//D/3P8SAPr/1f8lAOv/BgAkAPv//f8BAPz/6/////P/0P8DAPH//f8CACcAl/85AAcA//8EAA8A6//r/wkA9P8/AOD/OgDy/y0A3/8DAAEA7f8JAPv/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9P/C/hAAAQALAPj/PwABABYAPQAqACIAUAA6AB0Aw/8iAO3/GQD8////8v8CAGAAJQAqAPD/BgAyAP7/qv+z/ysA4/8cAAYASQDz/9H/2P/+/0gA9/8HAAcACQD+//f/4f8VAG7/cAANAPn/EwD4/+7/CwD2/wIADABWAPr/AQD4/wsA+//w/7r/JQAYACwAHwDr/7//9P8XAAIAAQD5//3/+v8ZALr/+v/v/wQARwDh/yMA7v8kABkAAgABAMj/JQDv/zkACQBz//v/AgAtAP3/AgD1/7z/BADv/wEAKAAaAOX///8IAP7/kP8gAPH/BgAMAPb/sv8HAAIA5//l/wMAzv/2/+3/7/8UAMn/EgAoAO3/DQANABAA8P/D//z/GgDR//v/IwDo/wgAwP8DAEwABgD0//P/9f8tAAoAFwAQAOP/HgCi/wQAu//f/wYAMQD7//v/+f/9/9P//P8tAP7/FwAWACgAPgAbAAQAaAAPAAUAFQAaALv/7P8RAB0AAQDW/x8A7f8WABIAAADo//r/9/8CABAACgDJ/wcAIv/z/wAA6/+l/yQABQARACwABQD1/wgAFQDl/08A7P84APj/BQAdAPn/CgDy/wIACQDn//T/DgAAABQA9v/B/8z/MAACAOP/HAD//1IApf/p/0AA5f/a/3YADwD4/+f/AwDp/9D+BQABAAYA7v85AAQADAA/ACwARQBMAC8AHwC8/x0A9v8cAAYA9v/s//n/EQAdACcA8P8KAB8A/f+p/xMALQDj/xYAFQBFAAAA+//b//3/TAD1////CwAIAPH/7f/m/xUAbv92ABYADAArAAAA5P/9//T/CwAQAFQA7v/y//3/AQD0/+n/v/8lABIAKwD3/+r/vv/u/xcA9f/9//r/CgD+/yIAvf8BAO///v8pAN//NgAjACYAIQD9/wUArP/g/+//NQAIAHT/DAAPABEACwDq//L/8v8FAPf//f8qAP//4f/9/wcA/v9X/x0A6P/+/wcA/f+5/wUADADa/97/BwDb//T/+//q/xsA1//w/zQAxf8UABMAEADp/9T/8v8PAAYAAADF/+b/DgDB/wAATQD+//f/+f/m/zgAAQAWABkA5f8cALD//f/B/87///8yAP//+f/y//j/vP8AADUA6v8EAAMAKwA+ABwA8f9tABUACAATABgAn//1//7/GgD1/83/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DgD3/9L/+//5/////v8VALr//f93/+3/rf8OAL//EgDn//b/3P8DADYA5P/1//z/8v8FAP7/AAD9/+D/KQD1/y0A8v8wABIA6//X/x4ANP/8/+f/8/8TACEADADr/+v/+//j/37/6//q////EwBEAP3/0P/5/3n/PgD1/xoADQASANn/3v8XAAcA+v/u/xEA8P/x/+z/0/8gAOD///8EABAAFQDx/3//KAA2/xsAIf++//L/DgDt/2AA9v8/AOL/+v/+/ycAAgAQAA8ATf8CAAwAjf8AALb//P8TABAA3f8EAL7/+P/s/woA2f////7//f+p//3/PwAAABMA/f/e/wUACQAQAEP/8//s/87/JgD4/wAADQABAPH/6P9IAFgA//8yAOT////8//D/4v/n/w8ACwDE//T/EAAjAOj/9//y/6z/jf8LABEA6v/+//H/+//r/yoA7P8B//b/8P///9H/9P/j/xAABgCp/wAA/f8NACEA4P8YAOj/AwARAPn/uP/3/+//4v/e/wIADwAQAB0AFQAHAMf/6f+Q/wgA9v/d/yIAmv8BANn/AQD0/+P/4f+0/4EA/v8MANf/8P8NAAwABAAUAA8A9P/x//D//f/u//z/5v8NAAgAEQDs/wcAnf/x/43/+P8hACgAvf/p/9j/iP/3/2//7P/L/9//7v/6//v/yf/p/+v/8f8JAA4AsP/6/33/8v/U/w0A7/8KAPT/7f/c/97/NAAGAPj/BADr/+//7//3//H/9f8ZANn/EQD3/wEAEQD3/9X/CQA//wMAz//2/wAAFQAIAO//9v/7/+f//f/s/9z/BgD8/y0AAQDX/wkAAQAkAML/IgAMAAsA0//X/+7/BgD//9D/FwD6/+n/7//H/yIA2/////r/CgDn/w0ANf8XAGD/FgA0/9P/8v8EAOL/eQDX/zkA+v/9//H/BQAAAN3/BQC6//D/DgCl//7/yf8EAB0ACQDE////1v/7/93/8P/N//z/9f/y/6T/BgAbAAQACgAMAN7/fQAFABkAOP/w//L/xv8cAOj//P8IAPX/8P/o/zgATAAOACUA8P8AAP3/5f/p/+P/BQD3/7T/+/8BACAA+/8GANz/5f9Y/8f/KwAWAPz/8v/d/+T/NgAGACAA7v/w/+n/+v/z/xYAIQADAM3/8P/8/woAGAD3/wwA3f/z/x0ABAC+//f/9//f/+T//v/k/wEACwALAOb/+P/H/9v////6/+n/UQCG/wsAyv/6/+f/4P/h/8D/3P8GABIA2f/r/+7/DQAGABQA9f/T//b/BgDq//j/1P/z//3/AgANAN7/AgBg//z/nf/Y//j/GgD7/wIAyf90/+z/3f///87/BADy/+//DQC7/93/BgDw/3b/7/8fAPf/qv/s/67/CgD+/x8AAwD2//b/AQDt/+X/7/8GAPX/CQDr//P/PgDx/xsAFAAYAL3/GwC0/93/FAD2//L/+P8HAPz/9P/J/w8ADQDu//D/5/8xAO//FADE/wEADwAFANv/7f8JAOf/BADo/w0A8v/7//b/4f9l//b/GAAZABcANwDu/+j//v8iAP7/EwD7/+7//P8pACQA2P/3//P+xv8FAOL/IADL/9T/IwDm//v/2f/t//X/3v8HAMz/BAARAJD/AwAMAPr/wP8SAAMA/P/5//T/BgALAM3/7//o//T/9v8ZAPP/+v/h/3D/9v/7//j/FQAk/wsAyv/8/7v/8//0/1kA///z/9//HgD+////JwAQABEA/v/j//T/6v/G/yMAEAAGAOf/IwAIAAMADQCJ//z/9/8zAAoAFADz//j/HwCv//r//v/6//j//f8fAPP/+f/k//H/DQDl/xMADwAXAA0AEgD1/9n/2f8OAIz/+/8QADn/BADB/w4ADAAYAPP/CAD1/w8A1v/x/wMA1v/z/4//+P/O/93/7v/f//z/8f/Z/wgA0v+K/1cAEQASAAcADgD1/yIASwDi/9T/5P/e/xMA+f/3/x3/GgD+/4P/2P+1/xUA8v8cAAoAAQBFAO7/CwDb/9b//v8vAAEA+P8EABgA5//m/wIA5f///xcA/P+n//H/dP8FAPT/LwD0/wQA+v8RAAIA6f/w/wcA//8QAOv/8P8eAPv/HgD6/wkA8f8VAJT/7f8ZAP//8f/W/wUA+P8UANX/DwD1/+n/9//s/ywADQD+/8L/EQAXAPT/5f/i/wMA7//z/+n/DAD///L/9v/o/2b/9v8WABoAGgARAOn/5/8BACoAAwAWAAMA///2/x4AGwDB//r/C//c/wQA7P8uAN3/6P8jAO//BQDZ//v/+v/m/wgAW/8CAA4AkP8LAAsABQCp/w8AFQD//w4A9v8EAA8A4f/m/wQA/P/r/xAAAADw/+n/cf8KAP//AgAPAPn+AgDc/wwA1P/t/wIARgACAPr/DAAlAAcA//8aAAMAEAACAP//9v/t/83/+P8vALX/CwAaAL7/AAAiAJn/8/8BADAACwDp//z/EQAUALz/DgACAPj/9v8DACgA+//8/9b/AgAPAPT/FgABABIACgAPAPf//f/Z/wsAdP8dAA4Adf8DALb/EwAZABIABwAIAPD/IwDJ//v/DwDM//L/if8IAOL/HQD+/+X/+P8AAOP/DQAGAJf/MQDc/w4ACwASAPf/MQAbANn/4v/v/83/+f8AAPf/U/8RAP3/ZP/n/7H/NQDs/yQA/P/3/x4A4/8MAOP/4f/q/xgA5//t//z/HgD///P/+//+/+z/AwD9/4H////J//n/DwApAP//FQAAABAABQDw/+///f8MAA4AAgD1/0gA/P8mAOP////6/yIAxv/0/xMA/v/t/8L/AwD2/wwA3v8NAPn/7f/z//L/IgAUAOv/3v8KACQAAADa//f/BgD4/ykA8P8NABMA5v/t/+n/4P/4/xUAHwAeAAgA7v/n//L/GQAFABUADAAcAP3/GAACANf/AgD5/uX/CQDt/y4A0P/l/xsA6v8JAOD/DgAgAAIA4f/J/woADQCE/wwACAADAMD/DQAQAP//DQABAP3/FwDk/+n/JAAQAPn//P/9//b/+P+A/xYACAAIAB0AMf8BAPb/HADw//D//P85AP7//P///yoABwD2/xYA9v8KAPj////s/+D/3v8UACcAxf/y/x4A5/8CAMT/lf/g/wIAIAAMANb/CgD5/xMA4v/1/wUA+//x/wYAKgD9/woA5P8FABgACAANAP7/GAAPACAA/P8CANv//f9b/ykACgCN/wEA3P8aAPf/CwAJAO//9v8lAM///v8NALP/9v+W/xAA4P/q//b//P/5/+L/7/8PABQAlf8oAOT/DAADABQA8P8gADgA6P/W//H/+f8VAAwA9f/C/w4A/P+F//r/zv8kAOX/HQD7//j/EQCP/w4A6P/p/+H/IQDr/+P/+v8ZAAYA9//9/w0As//b/wAAq/+X/+z/AgDp/yoADADx/xQADQAQAPb/+f/z//f/DAApAP7/BAD3/yMA/P8IAAIAFgDr//n/BwAUAN//1P////T/AADx/w0ACgD0/+r/7/8ZAAkA+//5/wMAJQD3//H/CAD1//z/+//4/xYAHwCY/wMA/f////r/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CAAfABoA/f/+//7/BwD2/wIABAAlAP3/8v/2/wkA//////T/FAD5////9P8FAOD/5/8JAPf/+//9//b/EAD8//D/6f8PAP//BAAAANP/FgD7/wYABQD1//X/DAAMACAAGQCN/+v/DQAJAAMA8f/Y//v/AQD9//n//P8AAPb/DwAOABsACQDb////pv8VAN3/+f8LAAAACACy//r/BAD//wgA8//z/zAAFgDr/7H///8LAMP/EQD7//f/7f8LABEA+v/8//v/0v8OAPn/AQAVAPn/BwATAO3/AQAMAND/BwANAAkABwAl/wsABwDz/wEA9v8lAAMA7P/4/+7/FAD7//v/+/8EAP7//P/r/wYA8/8IAAEAEgDn/wgAFAD7/xAACgBT/+H///8MAAEA8/8bAAgA9v/4/wkACQAFAO//AQACAP7/EgADAAcA8f8UAP7/8v/4//n/FADz//j/IwDq/zb/+//3//v/AAD5/xIA8//9/xAA6P8AAAsACQD+//z/8v/4/5H////M/wsA9/8IAPP/CwDs//D/FQDC/+///f8KAAAADQD1/wwAAQAnANT/GwD+//H/BAD//+r/AwACANX/9f/5/wcA7f8FAPT/+f/7//z/AAAQAAIAy//4/9b/CwDx//D/DgAJAAQAFgD+/+X/AACG//T/BAD0/+j/FwANAP//FgD1/woA///9//f/AAD4/x8A/v/1//n/DAABABYA3f8CAAcA/f/v//v/vf8AAAcA8v/2/xQA+/8GAP3/6v/p/wcA+v8MAAYAEAAUAAEA+v8HAPr/9//+/ycAIQATAOX/4/8LAA0AAADx/+L/0P/4//P/+v8PAPr/u/8CAA0ADQALACr/BgCU/xgA7v/z/woACQD8/8b/CAABAP7/BQAFAN//+v8OAN3/HAAIAAoA4P8PAOr/6v/8/wsACwD0/+v/8v/G/wYA5/8JAAMABQD//xoABQAEABMA5P8CAAgAAQATACv//////+f/DQD2/x4ABAACAPf/7P8aAAQA+v/9//H/9//6/+j/BQDu/ycABwDx/+z/CQAWAP//EQD2/3j/xv8KAPL/3/8LAAkA9//t/wAACQAOAAoA8f8FAPn/9v/p/wkACADK/xwA7v8GAPn/5v8AAPb//v8SAO7/Of/+//P/AQABAAwADwAAAAgACwAEAPb/9f8VAPr/+f8IAPr/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7//S/w4AYv/w/woADgDq/wUAAQD9//L/EQC+/xsABwD8/wYA8//X/wEABgDo/+//BAALAO3/0f/w/wcACwAFAAEAJgD/////AAD5/wEA+v/0/wIA9v8OABgA8v/u//3/iv/z/wUABQDv/w4A/v/2/xoA8P/5/wcABQD6/wkAz/8AAAAA9P/7//n//v8MAPX/DwAIAPz/+P///6T/BQATAPX/8/8IAMf/BQACAPT/6f8JAPv/AQALAAAA8f/9/wwADAD///H/DgAIACMADAC1//v/+/8IAAQA9v/y/4P/+//+/wgABAD5/8X/+P8BAPj/BAD4/vn/0f8PAAEAAAAFAAUAAgDI//3/9P/6/wQACwDn//v/7//2/9f//v8JAN//DwDw//n/+P8CAAMA6f/z//j/2/8JAPL/AQDy//n/+v8QAPX/AgAOAPP/+P8UAPb//v/6/wIACQDw/+z/9f8RAAEAAgD8/+v/+f/7/wQA7/8eAPX//f/p/xMA7P8LAAcA8//q/wEADwD8/wwA9v9i/8v/AgDx/9f/CAAJAPv/8P/o/xIACQASAO/////5//f/BgANAAIA3/8WAAEA+v/z/+z/DwD3/wQADwD7/4L//f/4/w8ABQANABUA/P///wUA/f/3//b/EQD9//T/CgD6/5//CQDS/wEACQD///f/6P/l/53/BwDg/+//BQANAAEACQAGAPf/5/8TAMH/LwAPAPb/BAAAAOf///8FAAoA9P8CAP3/7P+X/+z//v8DAAcA/P82ACEABwDk//X//f/2/+f/7v8LAAgAFADt/+z/+/90//b/+/8DAO//CAD8//7/AADt/wcAFAABAP//BQCg/wIAAAD2//v/+P8AABUA6/8SABAA+v/9//X//v4LAA8A7f/y/xgA8f/6/wMA8v/r/wkA+P/3/wwAGADz/wAAAQARAPT/8//x/wwAIwAFAOf/+v/8/woAAgD0//P/kP/5//z/DgANAPj/AwDc//r/8f///9b+AwDW/w4A///y/wAACwD6/9r/AwD6//z/AgAnAOH/HQDz/+v/PwAFAAoAIwAMAOz/9P8QAP//AADk//T/+v/k/wIA6/8DAOj//P/9/xQA6v8FAA0A/v/6/wkA8f8GAOD//f8GAO3/9v/3/wgA+P8FAP7/6P/5////AQD6/yAA9P/5//D/CwDu/xAAAQDs/+7//f8NAPv/EwDn/9T/tv8GAHr/+/8LAAEA9v/w/1oADQAMABoA9P/q//P/EgAMAOz/AADd/w0AAwAKAPn/1/8TAPX/AAAAAAUAZP////n/CgABABQAAwD//wAA///6//f/9P8aAAMA9f8JAPT/eP8EAAAA/f8IAPz/9//r/+L/VP8EAPP/+P8AAA4ADgAAAAEA9//k//3/m/8sAAcA8/8GAAUA7P/7/wYAIADt//j/+v/v/9P/8f8EAAcACAD9/ysAMgAHALj/AAD8//P/4//h/woABwATAOP/6//+/2r/9P/m/wkA5v/9/wEA///9/+f/DgASAAIACAAHAPP+AAD+//j//f/t//n/GwDu/xIADwD4/wYA+//y/g4ADwD0/+3/EwADAPv/BgD6/+f/CAD6/+7/CQAnAOr//v8HABUA9v/1/+//DwAhAPr/9v80AAAACAABAND/8P+f//n//P8TABIA9f8NAJ3/9P/q//7/4f4OAE//CQAAAPb/+v8QANz/2v8AAPn////5/xYAFQD6/+7/7f/m/wEADAALAAwA7P/4/wgA/v/0/9f/CQD9//D/AgDk//r/3/////z/CwD4/wgABAD8//r/EwD0//P/GAD1/wQA8f/r//n/DwDt/wYA/f/g/+//AQABAP3/DQDz////7v8QAO3/BwD5/+j/5/8AAAcA/P8NANv/7f+k/xIAq/8CAAcAAADz//j/AQARAAwADwD0/+j/+P/E//7/AAAEALr//v8EAAcA+//R/xAA8f///+j/BwBz////9/8DAAAAEwAIAAMA/v/+//j/+//0/xkA/P/5/wgA+v8i//z/GQAAAPz/9P/6/+3/5f+A//3/IgD1//3/EAANAPj/AADV/+r//P+i/wkA9//x/wYAAwD1//P/CwAYAO7/8f/5//H/+f/u//f/AgAHAP3/KwA9AAQA0v8CAAAA/f/e/9L/DgACAEz/5P8BAAEAHP/x/9H/CgD6/wgAAAD///v/7v8AAOj/DwD9//X/BAAFADP/AwDz/wkADwBH/w0ACgCc/+T/EAAAAAMAaP8JAPv/+//Y/xUA9P/x/wMA3//g//P/IACt/xcA9P/8//r/+v/+//T/DAD7/xcA1//5/+v/+P9V//f/CwALABIAHwD7/woA+/8ZAPD/EADo/+j/DgAJAAYApv/1/+X+5v8AAKn////b//3/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AgD1/wYA/P/7/7X/+f/7//b///+6/zj//f8FAM3/6P/7/wcA7v/u//j/CgAVAP3/AgALAPb/BQAaAAMA5v8IAPb/+v/0/wwADgD0//3/AgBC//X/KQABAPn/8P/9//v/AAD0//j/+v8IAPr/BQDn//b/+//5//z/8//w//7////o//H//P/+//7/8P/d/xgA9//z/wUA0/4QAAIA9f/s/w8A/v8IAP7/3f/2//v/CQAFAPL/9f8WAAEAHQD///H/+v/3/wIABAACAPL/6P////7/DQD5//v/+P8CAPj/EQACAAX/7P/g/wUA9f/w/wIAAAALAOD/9f/r//n/AwD9/w0AAgDs/wUAc////wkAMv8IAPf/8//1/wYA///y/w4A/P/i/wAA3v8AAO//+v/4/xAA8f///wIAtP/2/wcA8f/6//j++v8KAAAAuv/0/wwA9/8GAP7/4//s//f/CgDx//r/AQD9/9n/DADt/+b/BAD9/+r//v8EAPv/AQDz/6//8//9/////P8CAAAABgD4/9P/EQADAA8A7v/5/wQABQD+/wUA///7/wQADAAEAOz/9v8YAPv/CQD2/wIAbv/8/wAADwAGAO//CAD0//v//P8DAPr/AAAOAPP/8v8NAPz/3v8UAOD/CQAOAPT/+v/6/+n/vv8LAFz/8P8KABIA2/8CAPH/+v/z/wIAvv/6////+/8FAO3/0f/7/wUABADw//L/BgDx/7f/6/8AAA8AAQD+/xEA+/8RAAgA///3/wMA8P/1//j/CQATAO7/+v/7/1T/+P/6/wYA+P8AAPz//f8BAO//BAD/////+f8GALv//P8AAPv/+//y//3/DgD7/xAAAwD7////+f+p/wIAFgDz//L/DgB//wUABQD8/+7/CwD//wUACQAYAO3//v8GAA4A9v/4/wMAAgAgAP//7P/w//b/BwACAAIA7/9S//z//v8RAAEA+P+z/+7/9v/2//P/yf74/9v/BQAAAAYAAgAPAOD/1v/+//D/+//9/xMA/P8XAO//+//v/wEACQDv/wgA8v/3//L/AAD9/9n//f/1/+D//v/q/wMA7v/5//z/AwDo/wIABgD1//j/CQDq/wEA7f8CAAUA9//O//f/BgD5/wEABQDo/+v/+P8GAOz/DQD6//n/6/8JAOn/+f8EAPf/8P8BAAEA+v8HAO7/vP/K//7/xv/6/wsAAgABAPf/5f8RAAgAGADw//P/CQAFAAgAAQD8//f/DQAUAAIA7f/7/xEA+/8NAPn/BgA0/wAAAQAMAAMADQADAPf//P/8/wAA9//2/xAA/f/0/xcA9//e/wIA5f/8/xAA+v/7//L/6P8Q/wcA4P/3/wUAEQD8//7/+P/9/+z//f+3/wQA+v/4/wIAAgDv//r/BQAlAO3/9/8AAOr/Sv/z/wEABAAFAPj/GAAAABIA9f/+//r//f/s/+r/+P8IABUA6//u//z/WP/0//j/CgDt//v/AQD+//3/7/8HAAIA+/8EAAYAKP8FAP7/+v/9//D//f8SAPv//P8NAP3/DgD//+L+CgASAPb/8/8SAOv//f8IAPb/5/8JAP3/+v8JAA8A7v/8/wQAFADw//P/CAAEAB8A/f/v//////8JAAAA9//0/4n/+//8/xYABgD5////zv/w/+7/+f/D/gAAQwAEAP3/+v/6/wkA4f/a//7/9v8CAP3/IgALAP//9f/3/9f/AAAJADAABQDx/+//DgD9//v/mgAAAPb/6v8AAPH//v/q////+/8JAOv/AgAJAPf/9v8KAPz/+f84AAQABADz/9n//P8HAPb/CQADAOz/7P/+////9f8XAPP/+v/y/wwA6//8/wEA8P/t//j/AgD5/w0A6//0/7D/BAAg//7/CwAFAPv/9//w/xUACwANAOv/8v8DAAUA+f/4//7/9f8PABIACwDv//T/DgD1/wcA+f8PAFf/AwD7/wkABAATAAoA9v/+//7/AwD3//f/CgADAPT/FAD3/87//P/4//f/DwD+//z//P/n/1n////4//r/BQATAAoA8//8//P/6f8DAPH/BQD9//r/AAAEAOn/+f8JADYA8//l////8P94//D/+f/5/wUA9P8SAAgAEQCw//7/CQD3/+L/4P/4////EgDr/+3//P8d//j/8P8MAOj/9P8EAAQAAwDs/wcAAgD9/wcABQCB/gEA/P/8//3/6v8AABkA8/8QABAA+/8XAP7/7P4KAA8A+P/x/xEAAgD1/wkABgDt/wcA+f/z/wcABADw/wEA9v8SAPL/+f8NAAUAHwD2/+z/+////woAAAD0//j/q//9//3/GAAIAPX///+o/+n/8f8DAMv+CQDs////8f/6//j/EQDY/97/BgD8/wcA+f8cABIAAwD0//f/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9//5/87/AwD5//P//v/2/wEA6v8DAPv/BADm/wcA+//4/+//BgD1/wAAGwAIAAEA9/+6//7/AgD5/wYACQDw/+f/9P/6//D/BAD2//r/7/8FAO3/BgAAAO3/8P/3//v/9/8FAOn/8/+q/xAAqf/9/wYACAABAPz/9f8RAAsACQD6//D/EAD9//f/+P8BAAYAAwAPAAoA6////wYA+f8HAP3/DgBC/wgA+/8SAP//GAAIAPX//f/3//n//v/w/woABgDx/xoA/P8iAAEAEwD4/w8AAwD3//3/6/8r/wAA8v/+//7/FwAKAOz/7P///+n///////7/+P/z/wAADADp//b/CQA+APH/AgACAPD/nP/5/wAAAAAEAO7//f8DABAA7//7/wIAAQDj/+b/+v/+/xYA8P/1/wEAuf76//7/DgDr//D/AwACAAAA7P8EAPH/AgABAAUAsf4HAAIA+////+b//v8hAPL///8TAP//GgAKAM7+DgAIAPn/7v8IAAIA/f8NAAcA6/8JAAAA9P///xIA6f/7//v/EADo//b/DAAFABcA8//w//T/AQAGAPr/9//1/6z//v8DAB0A9f/y//b/pf/a//L////U/gkA///s/+3/BwD5/woA1P/n/wYA/f8CAPj/DgAIAAcA7//1/9j/AgALAN7/DADw/+f/AAD4//3/z/8GAPv/9P////L/AADr/wIA8/8EAOX/BAD0//z/+P8JAPz/7P9UAAEAAgD3/6//+v8DAPT/BAAFAOv/6v/5//z/8/8RAPT//P/t/wMA7//w/wAA6f/t//j//v/1/wYA6f8AAIr/CwC4//v/CwAKAP3/BQD4/xIAAQAMAPb/8P8FAPz/9v8KAAcA/v/7/xEAEQDp//P/CQD0/wIA+v8UAEn/AgD4/xMA/P8VAAsA7v/7/+7//P///+//BgAHAPb/IAD8/zgA7P8ZAPj/CgAAAPj/AQDr/1r/9v8/APv///8aAA8A4v/w/+3/6P8AADwAAQD3//j//P8KANr/8P8MAD4A9/8VAAMA8//t//X/6/8CAAgA9/8FAAQADADu/wEAAwAJAOP/4v8BAAAATgCt/9f/6//B/7z/6f8XAMr/GAD4//T/AADN/yAAsv8BAM7/BQDN/wIAsf/q/7n/EgDY/1IA/P8zANP/vP8tAPT/uf+//5kAz//f//7/yP/+/9//0P+H/4wA0v8TAM7/GQDl/73/0f9eALT/yv9JABIAXQAWAKP/w//c//b/3f/1/+3/+/8lAM7//f8fAPn/0//k/+T/5v/n/97/IgCt/yQAov/E//b/6//a/6r/4/82ANv/yf8AAAMAOQC8/+H/vf/4/6MA9f+yAOH/uf/N/wwA9/+b/yIA3P+v//n/lv/3/9H/4f/P/0EAsf/q//X/xP+2/yEAtv8oAPX/8f/J/8//5v/U/ygAEwDn//D/k//2/xgA8/8VADoA9P+x/5j//P+Q/9b/EgDt/6H/z/8bAMH/FgDP/6b/OAAmAA8A8v8MAP//9f/W/8n/PAAyACMASv+8/y0A6f/d/+H/8v/v/xsAQwAUAOv/1/9eALz/9f/L/xwAov/y/+f/UQDv/93/SwDX/+//3//v/8//CgAlAP7/wP9iAAMAxv8gANL/6/9KANv/qP/T/7L/uf8zAOr/0/8HABoBzP+cAMP/+P8VAO3/tv///+D/3P8IAL//uf/t/wIAUACs/5//TACr/8//vf+2/xEA5f/b/zIA+//6/w8A2//T/wwAv/+t/9j/GwDq//7//v/C/wEA8v/6/wIAAwALAAAA/v/6/+n//v8jAAYAfwD2/xYA/v8LAAMACADR//7/AADm/wEAGQCV////AAAIAH8A5v////r/CAAYAAQADQAEAPj//v8nAAQA2v8BAAUA+P8qAP7/BgD6//7//f8EAA8A+/8FAAQAoP+B////EQDE//3/AABMAAAAEAABAAYAgf8NAO7/BQD9//7/SAD///7/fwACAPz/+f/8/wQACAAyAPr/BQD8/wYA//8KAAEA1P8DAO7/EQD9/wsAMAAGAP7/BAAEAPz/AgDt//z/9/8FAAUAAwAAAGsAgf8GAPX//f8cAAcAAQADABkA+v+B//z/BAD5/w4ACgABACAA//8PAPP/AAAxAO7/9//5/wQAEAAFAPv//P/6//r/CgAoAPf/3P8NAAAAAgACAPz//v/6/xsAAAAEAAEAAwCD//n/AAAHAA4AAwAFAAAAEQABAAEASAAFAAMA8v///wQACAC8////1/8BAOP/dAD+/wEAAQAPAAQA+v8RAAYA/v/t//j//P/5////CAADAP7/AgDS/wIA/f8TAAYAAwD+/wQAXwAKAIH/GAADAA8A/P/0//n//P/+/wMAEwBIAC4AfwAAAP3/CAABAP//BQAPAI7/AgB/AOb/BAD8//b/AQAAAAUAAADT/+3/BAD9/xoAAwD//0kAAAAEAAQA///9//j/AAABAAYAEgACAOb/+/+J/wkA5v8CAPL//v8KACwABAAAABQAAADu/38AAAABAAIAgf8ZAAIABgD4/+D//f/1//r/BwABANr/+/83AP//+v8KANr/AwD//wMAAQACAP3/6f8FAPz///9uAHYA/v/o/0AAAwABAIH/AADu//z/+v9FAPL/BwD8/wIAAwC+/xgAAACB//7/BgAFAAMA+//4/8b/BgD7/wMA+v8DAPX//v8sAPz/EQDA/wgA9v/K//r////8//z/BgD9/xkABAAOAPz/+//9////gf97AAMAEwADAOv/+f////3/6v8DAHUABQD7/wcA9f/3//7/4f8BAPX/CwAAANb/FAAKAAQA///5//z/BQACAA0ABgDp/9f/BwA3APT/AAD9/wEAAwACAAUA4P8AAPz////9/38ACgAAAPr/9P/+//r/AgDx////AADJ//v//f8OAAEA/P/3/3QAAQApAP//JgCB/wIAAAD///H//f8IAOv/+v8DABAACAAEAPX/AgD5//3/AQD//38A/v8CAPj/+v/+/wIA/P+t//b/fgDm//3/8P8EAA8ABwABAAIA/v/u/7n/2v+B/wEAAwAWAP/////6//f/fwD+/4H/FwD8/wQACgD+/wEA/P8BABYAEQD8/wMAuv/9/xEAof8HAMX/EAAZAAkAAgD2//D/7f/M//T/KwAWAE0A6/8zAOz/MAANAP3/uv/w//j/4//5/18Aq//0//P/RwDC/+7/8f/w/xoAQQAOAH8AHgDf/9D/KQAPAML/CQASAJj/MgDu//P/3f/2/+z/ewA0APb/DAAaAMD//v/o/ygAx//0//P/UwDv/zsA7P8RAIH/GAAtACgA7v/6/3YANAAgAH8A4v/z//P/CwD//xAALQDu/w4A9/8OAOr/HAANABUAEwDk/38A7f8eAF4AEgASABMAGwDp/xAAzv/y/9X/FAAMAAsA9f9/AIH/JwD+//P/HwAaAPj/EAArABAA0f/g/xIA8P8bABUADgAkABMA0//j//f/XgCG/+D/5P8dACAADwD1/+3/4//4/+j/KQDs/9z/JAD1/wkA7f/w//n/8P9BABEAEADO/w0Av//s//f/EQAZAAoA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';
}

//}}}

