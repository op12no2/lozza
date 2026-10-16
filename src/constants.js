//
// https://github.com/op12no2/lozza
//

const BUILD = "12.0";

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

const nodeHost = (typeof process) != 'undefined';
