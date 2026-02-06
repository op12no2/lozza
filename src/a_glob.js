const INF = 31000;
const MATE = 30000;
const MATEISH = 29000;
const MAX_MOVES = 256;
const MAX_PLY = 64;

const WHITE = 0;
const BLACK = 8;

const PAWN = 1;
const KNIGHT = 2;
const BISHOP = 3;
const ROOK = 4;
const QUEEN = 5;
const KING = 6;

const WPAWN = PAWN | WHITE;
const WKNIGHT = KNIGHT | WHITE;
const WBISHOP = BISHOP | WHITE;
const WROOK = ROOK | WHITE;
const WQUEEN = QUEEN | WHITE;
const WKING = KING | WHITE;

const BPAWN = PAWN | BLACK;
const BKNIGHT = KNIGHT | BLACK;
const BBISHOP = BISHOP | BLACK;
const BROOK = ROOK | BLACK;
const BQUEEN = QUEEN | BLACK;
const BKING = KING | BLACK;

const WHITE_RIGHTS_KING = 1;
const WHITE_RIGHTS_QUEEN = 2;
const BLACK_RIGHTS_KING = 4;
const BLACK_RIGHTS_QUEEN = 8;

const MOVE_FLAG_CAPTURE = 1 << 14;
const MOVE_FLAG_EPCAPTURE = 2 << 14;  // will also have MOVE_FLAG_CAPTURE set 
const MOVE_FLAG_CASTLE = 4 << 14;   
const MOVE_FLAG_PROMOTE = 8 << 14; // may also have MOVE_FLAG_CAPTURE set
const MOVE_FLAG_SPECIAL = MOVE_FLAG_PROMOTE | MOVE_FLAG_EPCAPTURE | MOVE_FLAG_CASTLE;
const MOVE_FLAG_NOISY = MOVE_FLAG_PROMOTE | MOVE_FLAG_CAPTURE;
const PROMOTE_SHIFT = 20; // KNIGHT, BISHOP, ROOK, QUEEN

const RIGHTS_TABLE = new Uint8Array(128);
RIGHTS_TABLE.fill(15);
RIGHTS_TABLE[0x00] = 15 & ~WHITE_RIGHTS_QUEEN;                        // a1
RIGHTS_TABLE[0x04] = 15 & ~(WHITE_RIGHTS_KING | WHITE_RIGHTS_QUEEN);  // e1
RIGHTS_TABLE[0x07] = 15 & ~WHITE_RIGHTS_KING;                         // h1
RIGHTS_TABLE[0x70] = 15 & ~BLACK_RIGHTS_QUEEN;                        // a8
RIGHTS_TABLE[0x74] = 15 & ~(BLACK_RIGHTS_KING | BLACK_RIGHTS_QUEEN);  // e8
RIGHTS_TABLE[0x77] = 15 & ~BLACK_RIGHTS_KING;                         // h8

const KNIGHT_OFFSETS = new Int8Array([-33, -31, -18, -14, 14, 18, 31, 33]);
const BISHOP_OFFSETS = new Int8Array([-17, -15, 15, 17]);
const ROOK_OFFSETS = new Int8Array([-16, -1, 1, 16]);
const QUEEN_OFFSETS = new Int8Array([-17, -16, -15, -1, 1, 15, 16, 17]);
const KING_OFFSETS = new Int8Array([-17, -16, -15, -1, 1, 15, 16, 17]);

// board globals - maintained throughout search via make and unmake funcs

const g_board = new Uint8Array(128);
const g_plix = new Uint8Array(128);  // piece list index per square
const g_pieces = new Uint8Array(34);
let g_stm = 0;
let g_rights = 0;
let g_ep = 0;

// time control globals

let g_nodes = 0; // node counter (init to 0)
let g_maxNodes = 0; // node target if given (else 0)
let g_maxDepth = 0; // target depth if given (set to MAX_PLY otherwise)
let g_startTime = 0; // always set via performance.now()
let g_finishTime = 0; // finish tiem if appropriate (else 0)
let g_finished = 0; // 1 when time/nodes reached (else 0)
let g_bestMove = 0;
