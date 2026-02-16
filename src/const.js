const BUILD = "9";

const BENCH_DEPTH      = 12;

const INT32_MAX =  2147483647;
const INT32_MIN = -2147483648;

const UINT32_MAX = 4294967295;

const NET_QA      = 255;
const NET_QB      = 64;
const NET_QAB     = NET_QA * NET_QB;
const NET_SCALE   = 400;
const NET_I_SIZE  = 768;
const NET_H1_SIZE = 256;

const IMAP = new Uint32Array(15 * 256);

const MATERIAL = new Int32Array([0,100,394,388,588,1207,10000]);
const ADJACENT = new Uint8Array(144);

const MAX_PLY         = 128;
const MAX_MOVES       = 256;
const LMR_LOOKUP      = new Uint8Array(MAX_PLY * MAX_MOVES);
const INF             = 32000;
const MATE            = 31000;
const MINMATE         = 30000;
const TTSCORE_UNKNOWN = INF + 1;
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
const BASE_SLIDE      = 100;
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
// E === EMPTY, X = OFF BOARD, - === CANNOT HAPPEN
//
// 0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15
// E  W  W  W  W  W  W  X  -  B  B  B  B  B  B  -
// E  P  N  B  R  Q  K  X  -  P  N  B  R  Q  K  -
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
  
const ALIGNED = Array(144);
  
