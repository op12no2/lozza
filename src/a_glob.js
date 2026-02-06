const MAX_MOVES = 256;
const MAX_PLY = 64;
const MAX_LINE = 8192;
const MAX_TOKENS = 1024;

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
const MOVE_FLAG_EPCAPTURE = 2 << 14;  // may also have MOVE_FLAG_CAPTURE set 
const MOVE_FLAG_CASTLE = 4 << 14;   
const MOVE_FLAG_PROMOTE = 8 << 14; // may also have MOVE_FLAG_CAPTURE set
const MOVE_FLAG_SPECIAL = MOVE_FLAG_PROMOTE | MOVE_FLAG_EPCAPTURE | MOVE_FLAG_CASTLE;
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

// board globals

const board = new Uint8Array(128);
const pieceList = new Uint8Array(34);
let stm = 0;
let rights = 0;
let ep = 0;
