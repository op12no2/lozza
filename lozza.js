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
const PERFTFENS = [
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 0, 1,         'startpos-0'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 1, 20,        'startpos-1'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 2, 400,       'startpos-2'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 3, 8902,      'startpos-3'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 4, 197281,    'startpos-4'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 5, 4865609,   'startpos-5'],
  ['fen r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -  0 1', 1, 48,        'kiwipete-1'],
  ['fen r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -  0 1', 2, 2039,      'kiwipete-2'],
  ['fen r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -  0 1', 3, 97862,     'kiwipete-3'],
  ['fen r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -  0 1', 4, 4085603,   'kiwipete-4'],
  ['fen 4k3/8/8/8/8/8/R7/R3K2R                                  w Q    -  0 1', 3, 4729,      'castling-2'],
  ['fen 4k3/8/8/8/8/8/R7/R3K2R                                  w K    -  0 1', 3, 4686,      'castling-3'],
  ['fen 4k3/8/8/8/8/8/R7/R3K2R                                  w -    -  0 1', 3, 4522,      'castling-4'],
  ['fen r3k2r/r7/8/8/8/8/8/4K3                                  b kq   -  0 1', 3, 4893,      'castling-5'],
  ['fen r3k2r/r7/8/8/8/8/8/4K3                                  b q    -  0 1', 3, 4729,      'castling-6'],
  ['fen r3k2r/r7/8/8/8/8/8/4K3                                  b k    -  0 1', 3, 4686,      'castling-7'],
  ['fen r3k2r/r7/8/8/8/8/8/4K3                                  b -    -  0 1', 3, 4522,      'castling-8'],
  ['fen rnbqkb1r/pp1p1ppp/2p5/4P3/2B5/8/PPP1NnPP/RNBQK2R        w KQkq -  0 1', 1, 42,        'cpw-pos5-1'],
  ['fen rnbqkb1r/pp1p1ppp/2p5/4P3/2B5/8/PPP1NnPP/RNBQK2R        w KQkq -  0 1', 2, 1352,      'cpw-pos5-2'],
  ['fen rnbqkb1r/pp1p1ppp/2p5/4P3/2B5/8/PPP1NnPP/RNBQK2R        w KQkq -  0 1', 3, 53392,     'cpw-pos5-3'],
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
  ['fen r6r/1P4P1/2kPPP2/8/8/3ppp2/1p4p1/R3K2R                  w KQ   -  0 1', 6, 975944981, 'ob5       ']
];
function nodeStruct() {

  this.ply = 0;
  this.numMoves = 0;
  this.moves = new Uint32Array(MAX_MOVES);
  this.ranks = new Int32Array(MAX_MOVES);
  this.undoRights = 0;
  this.undoEp = 0;
  this.undoCaptured = 0;
  this.undoCapIdx = 0;

}

const nodes = Array(MAX_PLY);

let rootNode = null;

function initNodes () {
  for (let i=0; i < MAX_PLY; i++) {
    nodes[i] = new nodeStruct;
  }
  rootNode = nodes[0];
}

const pieceChar = [' ', 'P', 'N', 'B', 'R', 'Q', 'K', ' ', ' ', 'p', 'n', 'b', 'r', 'q', 'k'];

const charPiece = new Uint8Array(128);
charPiece[80] = WPAWN;    // P
charPiece[78] = WKNIGHT;  // N
charPiece[66] = WBISHOP;  // B
charPiece[82] = WROOK;    // R
charPiece[81] = WQUEEN;   // Q
charPiece[75] = WKING;    // K
charPiece[112] = BPAWN;   // p
charPiece[110] = BKNIGHT; // n
charPiece[98] = BBISHOP;  // b
charPiece[114] = BROOK;   // r
charPiece[113] = BQUEEN;  // q
charPiece[107] = BKING;   // k

function position(boardStr, stmStr, rightsStr, epStr) {

  board.fill(0);

  let rank = 7;
  let file = 0;

  for (let i = 0; i < boardStr.length; i++) {
    const cc = boardStr.charCodeAt(i);
    if (cc === 47) { // /
      rank--;
      file = 0;
    }
    else if (cc >= 49 && cc <= 56)
      file += cc - 48;
    else {
      board[rank * 16 + file] = charPiece[cc];
      file++;
    }
  }

  if (stmStr === 'w')
    stm = WHITE;
  else
    stm = BLACK;

  rights = 0;
  for (let i = 0; i < rightsStr.length; i++) {
    const cc = rightsStr.charCodeAt(i);
    if (cc === 75)       // K
      rights |= WHITE_RIGHTS_KING;
    else if (cc === 81)  // Q
      rights |= WHITE_RIGHTS_QUEEN;
    else if (cc === 107) // k
      rights |= BLACK_RIGHTS_KING;
    else if (cc === 113) // q
      rights |= BLACK_RIGHTS_QUEEN;
  }

  if (epStr === '-')
    ep = 0;
  else
    ep = (epStr.charCodeAt(1) - 49) * 16 + (epStr.charCodeAt(0) - 97);

  // build piece list

  const pl = pieceList;
  const b = board;

  pl.fill(0);

  let wCount = 1;
  let bCount = 1;

  for (let sq = 0; sq < 128; sq++) {

    if (sq & 0x88) {
      sq += 7;
      continue;
    }

    const piece = b[sq];

    if (!piece)
      continue;

    if (piece & BLACK) {
      if ((piece & 7) === KING) {
        pl[17 + 1] = sq;
        b[sq | 8]  = 1;
      }
      else {
        bCount++;
        pl[17 + bCount] = sq;
        b[sq | 8] = bCount;
      }
    }
    else {
      if ((piece & 7) === KING) {
        pl[0 + 1] = sq;
        b[sq | 8] = 1;
      }
      else {
        wCount++;
        pl[0 + wCount] = sq;
        b[sq | 8] = wCount;
      }
    }
  }

  pl[0]  = wCount;
  pl[17] = bCount;
}

function printBoard() {

  const sep = '  +---+---+---+---+---+---+---+---+';

  uciSend(sep);

  for (let rank = 7; rank >= 0; rank--) {
    let line = (rank + 1) + ' |';
    for (let file = 0; file < 8; file++) {
      const piece = board[rank * 16 + file];
      const ch = piece ? pieceChar[piece] : ' ';
      line += ' ' + ch + ' |';
    }
    uciSend(line);
    uciSend(sep);
  }

  uciSend('    a   b   c   d   e   f   g   h');

  let rightsStr = '';
  if (rights & WHITE_RIGHTS_KING)
    rightsStr += 'K';
  if (rights & WHITE_RIGHTS_QUEEN)
    rightsStr += 'Q';
  if (rights & BLACK_RIGHTS_KING)
    rightsStr += 'k';
  if (rights & BLACK_RIGHTS_QUEEN)
    rightsStr += 'q';
  if (!rightsStr)
    rightsStr = '-';

  let epStr = '-';
  if (ep) {
    const file = ep & 0x0F;
    const rank = ep >> 4;
    epStr = String.fromCharCode(97 + file) + String.fromCharCode(49 + rank);
  }

  uciSend('');
  uciSend('  stm: ' + (stm === WHITE ? 'w' : 'b') + ' rights: ' + rightsStr + ' ep: ' + epStr);
}

function isAttacked(sq, byColour) {

  const b = board;

  // pawn

  const pawnDir = byColour === WHITE ? -16 : 16;
  const pawnPiece = PAWN | byColour;

  for (let i = -1; i <= 1; i += 2) {
    const from = sq + pawnDir + i;
    if (!(from & 0x88) && b[from] === pawnPiece)
      return 1;
  }

  // knight

  const knightPiece = KNIGHT | byColour;

  for (let i = 0; i < 8; i++) {
    const from = sq + KNIGHT_OFFSETS[i];
    if (!(from & 0x88) && b[from] === knightPiece)
      return 1;
  }

  // king

  const kingPiece = KING | byColour;

  for (let i = 0; i < 8; i++) {
    const from = sq + KING_OFFSETS[i];
    if (!(from & 0x88) && b[from] === kingPiece)
      return 1;
  }

  // diagonal rays (bishop, queen)

  for (let i = 0; i < 4; i++) {
    const dir = BISHOP_OFFSETS[i];
    for (let to = sq + dir; !(to & 0x88); to += dir) {
      const p = b[to];
      if (!p)
        continue;
      if ((p & BLACK) === byColour) {
        const type = p & 7;
        if (type === BISHOP || type === QUEEN)
          return 1;
      }
      break;
    }
  }

  // orthogonal rays (rook, queen)

  for (let i = 0; i < 4; i++) {
    const dir = ROOK_OFFSETS[i];
    for (let to = sq + dir; !(to & 0x88); to += dir) {
      const p = b[to];
      if (!p)
        continue;
      if ((p & BLACK) === byColour) {
        const type = p & 7;
        if (type === ROOK || type === QUEEN)
          return 1;
      }
      break;
    }
  }

  return 0;
}

function moveStr(move) {

  const fr = (move >> 7) & 0x7F;
  const to = move & 0x7F;

  let s = String.fromCharCode(97 + (fr & 7))
        + String.fromCharCode(49 + (fr >> 4))
        + String.fromCharCode(97 + (to & 7))
        + String.fromCharCode(49 + (to >> 4));

  if (move & MOVE_FLAG_PROMOTE)
    s += 'nbrq'[(move >> PROMOTE_SHIFT) - 2];

  return s;
}
function make(node, move) {

  const b = board;
  const pl = pieceList;
  const fr = (move >> 7) & 0x7F;
  const to = move & 0x7F;

  const curStm = stm;
  const stmBase = (curStm >>> 3) * 17;
  const oppBase = stmBase ^ 17;

  node.undoRights = rights;
  node.undoEp = ep;

  rights &= RIGHTS_TABLE[fr] & RIGHTS_TABLE[to];

  ep = 0;

  if (move & MOVE_FLAG_SPECIAL) {

    if (move & MOVE_FLAG_PROMOTE) {

      if (move & MOVE_FLAG_CAPTURE) {
        const capIdx = b[to | 8];
        const lastIdx = pl[oppBase];
        const lastSq = pl[oppBase + lastIdx];
        pl[oppBase + capIdx] = lastSq;
        b[lastSq | 8] = capIdx;
        pl[oppBase]--;
        node.undoCaptured = b[to];
        node.undoCapIdx = capIdx;
      }

      const idx = b[fr | 8];
      pl[stmBase + idx] = to;
      b[to | 8] = idx;

      b[to] = (move >> PROMOTE_SHIFT) | curStm;
      b[fr] = 0;
      stm = curStm ^ BLACK;
      return;
    }

    if (move & MOVE_FLAG_EPCAPTURE) {

      const capSq = to - 16 + (curStm << 2);

      const capIdx = b[capSq | 8];
      const lastIdx = pl[oppBase];
      const lastSq = pl[oppBase + lastIdx];
      pl[oppBase + capIdx] = lastSq;
      b[lastSq | 8] = capIdx;
      pl[oppBase]--;
      node.undoCapIdx = capIdx;

      const idx = b[fr | 8];
      pl[stmBase + idx] = to;
      b[to | 8] = idx;

      b[to] = b[fr];
      b[fr] = 0;
      b[capSq] = 0;
      stm = curStm ^ BLACK;
      return;
    }

    // castle

    pl[stmBase + 1] = to;
    b[to | 8] = 1;

    b[to] = b[fr];
    b[fr] = 0;

    let rookFr, rookTo;

    if (to & 4) {
      rookFr = to + 1; rookTo = to - 1;
    }
    else {
      rookFr = to - 2; rookTo = to + 1;
    }

    const rookIdx = b[rookFr | 8];
    pl[stmBase + rookIdx] = rookTo;
    b[rookTo | 8] = rookIdx;

    b[rookTo] = b[rookFr];
    b[rookFr] = 0;

    stm = curStm ^ BLACK;
    return;
  }

  // quiet move or normal capture

  if ((b[fr] & 7) === PAWN && (to - fr === 32 || to - fr === -32))
    ep = (fr + to) >> 1;

  if (move & MOVE_FLAG_CAPTURE) {
    const capIdx = b[to | 8];
    const lastIdx = pl[oppBase];
    const lastSq = pl[oppBase + lastIdx];
    pl[oppBase + capIdx] = lastSq;
    b[lastSq | 8] = capIdx;
    pl[oppBase]--;
    node.undoCaptured = b[to];
    node.undoCapIdx = capIdx;
  }

  const idx = b[fr | 8];
  pl[stmBase + idx] = to;
  b[to | 8] = idx;

  b[to] = b[fr];
  b[fr] = 0;

  stm = curStm ^ BLACK;
}

function unmake (node, move) {

  const b = board;
  const pl = pieceList;
  const fr = (move >> 7) & 0x7F;
  const to = move & 0x7F;

  // stm was flipped by make, so current stm is the opponent of the mover
  // the mover's colour is stm ^ BLACK
  const mover = stm ^ BLACK;
  const stmBase = (mover >>> 3) * 17;
  const oppBase = stmBase ^ 17;

  if (move & MOVE_FLAG_SPECIAL) {

    if (move & MOVE_FLAG_PROMOTE) {

      // move piece back as a pawn
      b[fr] = PAWN | mover;
      b[fr | 8] = b[to | 8];
      const idx = b[fr | 8];
      pl[stmBase + idx] = fr;

      if (move & MOVE_FLAG_CAPTURE) {
        // un-swap-delete
        const capIdx = node.undoCapIdx;
        pl[oppBase]++;
        const lastSq = pl[oppBase + capIdx];
        pl[oppBase + pl[oppBase]] = lastSq;
        b[lastSq | 8] = pl[oppBase];
        pl[oppBase + capIdx] = to;
        b[to | 8] = capIdx;
        b[to] = node.undoCaptured;
      }
      else {
        b[to] = 0;
      }

      rights = node.undoRights;
      ep = node.undoEp;
      stm = mover;
      return;
    }

    if (move & MOVE_FLAG_EPCAPTURE) {

      const capSq = to - 16 + (mover << 2);

      // move pawn back
      const idx = b[to | 8];
      pl[stmBase + idx] = fr;
      b[fr | 8] = idx;
      b[fr] = b[to];
      b[to] = 0;

      // restore captured pawn
      const capIdx = node.undoCapIdx;
      pl[oppBase]++;
      const lastSq = pl[oppBase + capIdx];
      pl[oppBase + pl[oppBase]] = lastSq;
      b[lastSq | 8] = pl[oppBase];
      pl[oppBase + capIdx] = capSq;
      b[capSq | 8] = capIdx;
      b[capSq] = PAWN | (mover ^ BLACK);

      rights = node.undoRights;
      ep = node.undoEp;
      stm = mover;
      return;
    }

    // castle - move king back, move rook back

    pl[stmBase + 1] = fr;
    b[fr | 8] = 1;
    b[fr] = b[to];
    b[to] = 0;

    let rookFr, rookTo;

    if (to & 4) {
      rookFr = to + 1; rookTo = to - 1;
    }
    else {
      rookFr = to - 2; rookTo = to + 1;
    }

    const rookIdx = b[rookTo | 8];
    pl[stmBase + rookIdx] = rookFr;
    b[rookFr | 8] = rookIdx;
    b[rookFr] = b[rookTo];
    b[rookTo] = 0;

    rights = node.undoRights;
    ep = node.undoEp;
    stm = mover;
    return;
  }

  // quiet move or normal capture

  // move piece back
  const idx = b[to | 8];
  pl[stmBase + idx] = fr;
  b[fr | 8] = idx;
  b[fr] = b[to];

  if (move & MOVE_FLAG_CAPTURE) {
    // un-swap-delete
    const capIdx = node.undoCapIdx;
    pl[oppBase]++;
    const lastSq = pl[oppBase + capIdx];
    pl[oppBase + pl[oppBase]] = lastSq;
    b[lastSq | 8] = pl[oppBase];
    pl[oppBase + capIdx] = to;
    b[to | 8] = capIdx;
    b[to] = node.undoCaptured;
  }
  else {
    b[to] = 0;
  }

  rights = node.undoRights;
  ep = node.undoEp;
  stm = mover;
}
function genMoves(node) {

  const b = board;
  const moves = node.moves;
  const curStm = stm;
  const curEp = ep;
  const curRights = rights;

  let numMoves = 0;

  const enemy = curStm ^ BLACK;

  const pawnDir = curStm === WHITE ? 16 : -16;
  const pawnStartR = curStm === WHITE ? 0x10 : 0x60;
  const promoteR = curStm === WHITE ? 0x70 : 0x00;

  const pl = pieceList;
  const base = (curStm >>> 3) * 17;
  const count = pl[base];

  for (let i = 1; i <= count; i++) {

    const sq = pl[base + i];
    const piece = b[sq];
    const from = sq << 7;

    switch (piece & 7) {

      case PAWN: {

        const to1 = sq + pawnDir;

        // single push

        if (!b[to1]) {

          if ((to1 & 0x70) === promoteR) {
            moves[numMoves++] = from | to1 | MOVE_FLAG_PROMOTE | (QUEEN  << PROMOTE_SHIFT);
            moves[numMoves++] = from | to1 | MOVE_FLAG_PROMOTE | (ROOK   << PROMOTE_SHIFT);
            moves[numMoves++] = from | to1 | MOVE_FLAG_PROMOTE | (BISHOP << PROMOTE_SHIFT);
            moves[numMoves++] = from | to1 | MOVE_FLAG_PROMOTE | (KNIGHT << PROMOTE_SHIFT);
          }
          else {
            moves[numMoves++] = from | to1;

            // double push

            const to2 = sq + pawnDir * 2;

            if ((sq & 0x70) === pawnStartR && !b[to2])
              moves[numMoves++] = from | to2;
          }
        }

        // captures

        for (let i = -1; i <= 1; i += 2) {

          const to = to1 + i;

          if (to & 0x88)
            continue;

          if (b[to] && (b[to] & BLACK) === enemy) {

            if ((to & 0x70) === promoteR) {
              moves[numMoves++] = from | to | MOVE_FLAG_PROMOTE | MOVE_FLAG_CAPTURE | (QUEEN  << PROMOTE_SHIFT);
              moves[numMoves++] = from | to | MOVE_FLAG_PROMOTE | MOVE_FLAG_CAPTURE | (ROOK   << PROMOTE_SHIFT);
              moves[numMoves++] = from | to | MOVE_FLAG_PROMOTE | MOVE_FLAG_CAPTURE | (BISHOP << PROMOTE_SHIFT);
              moves[numMoves++] = from | to | MOVE_FLAG_PROMOTE | MOVE_FLAG_CAPTURE | (KNIGHT << PROMOTE_SHIFT);
            }
            else {
              moves[numMoves++] = from | to | MOVE_FLAG_CAPTURE;
            }
          }
          else if (curEp && to === curEp) { // ep=0 means no ep, but 0x00 (a1) is valid so guard with ep&&
            moves[numMoves++] = from | to | MOVE_FLAG_EPCAPTURE | MOVE_FLAG_CAPTURE;
          }
        }

        break;
      }

      case KNIGHT: {

        for (let i = 0; i < 8; i++) {

          const to = sq + KNIGHT_OFFSETS[i];

          if (to & 0x88)
            continue;

          if (!b[to])
            moves[numMoves++] = from | to;
          else if ((b[to] & BLACK) === enemy)
            moves[numMoves++] = from | to | MOVE_FLAG_CAPTURE;
        }

        break;
      }

      case BISHOP: {

        for (let i = 0; i < 4; i++) {

          const dir = BISHOP_OFFSETS[i];

          for (let to = sq + dir; !(to & 0x88); to += dir) {

            if (!b[to]) {
              moves[numMoves++] = from | to;
              continue;
            }

            if ((b[to] & BLACK) === enemy)
              moves[numMoves++] = from | to | MOVE_FLAG_CAPTURE;

            break;
          }
        }

        break;
      }

      case ROOK: {

        for (let i = 0; i < 4; i++) {

          const dir = ROOK_OFFSETS[i];

          for (let to = sq + dir; !(to & 0x88); to += dir) {

            if (!b[to]) {
              moves[numMoves++] = from | to;
              continue;
            }

            if ((b[to] & BLACK) === enemy)
              moves[numMoves++] = from | to | MOVE_FLAG_CAPTURE;

            break;
          }
        }

        break;
      }

      case QUEEN: {

        for (let i = 0; i < 8; i++) {

          const dir = QUEEN_OFFSETS[i];

          for (let to = sq + dir; !(to & 0x88); to += dir) {

            if (!b[to]) {
              moves[numMoves++] = from | to;
              continue;
            }

            if ((b[to] & BLACK) === enemy)
              moves[numMoves++] = from | to | MOVE_FLAG_CAPTURE;

            break;
          }
        }

        break;
      }

      case KING: {

        for (let i = 0; i < 8; i++) {

          const to = sq + KING_OFFSETS[i];

          if (to & 0x88)
            continue;

          if (!b[to])
            moves[numMoves++] = from | to;
          else if ((b[to] & BLACK) === enemy)
            moves[numMoves++] = from | to | MOVE_FLAG_CAPTURE;
        }

        // castling

        if (curStm === WHITE) {
          if ((curRights & WHITE_RIGHTS_KING) && !b[0x05] && !b[0x06]
              && !isAttacked(0x04, enemy) && !isAttacked(0x05, enemy) && !isAttacked(0x06, enemy))
            moves[numMoves++] = from | 0x06 | MOVE_FLAG_CASTLE;
          if ((curRights & WHITE_RIGHTS_QUEEN) && !b[0x03] && !b[0x02] && !b[0x01]
              && !isAttacked(0x04, enemy) && !isAttacked(0x03, enemy) && !isAttacked(0x02, enemy))
            moves[numMoves++] = from | 0x02 | MOVE_FLAG_CASTLE;
        }
        else {
          if ((curRights & BLACK_RIGHTS_KING) && !b[0x75] && !b[0x76]
              && !isAttacked(0x74, enemy) && !isAttacked(0x75, enemy) && !isAttacked(0x76, enemy))
            moves[numMoves++] = from | 0x76 | MOVE_FLAG_CASTLE;
          if ((curRights & BLACK_RIGHTS_QUEEN) && !b[0x73] && !b[0x72] && !b[0x71]
              && !isAttacked(0x74, enemy) && !isAttacked(0x73, enemy) && !isAttacked(0x72, enemy))
            moves[numMoves++] = from | 0x72 | MOVE_FLAG_CASTLE;
        }

        break;
      }
    }
  }

  node.numMoves = numMoves;
}
function perft(ply, depth) {

  if (depth === 0)
    return 1;

  const node = nodes[ply];
  const curStm = stm;
  const nstm = curStm ^ BLACK;
  const stmBase = (curStm >>> 3) * 17;

  genMoves(node);

  const moves = node.moves;
  const numMoves = node.numMoves;
  let total = 0;

  for (let i = 0; i < numMoves; i++) {

    const move = moves[i];

    make(node, move);

    const kingSq = pieceList[stmBase + 1];

    if (!isAttacked(kingSq, nstm))
      total += perft(ply + 1, depth - 1);

    unmake(node, move);
  }

  return total;
}

function perftTests(maxDepth) {

  let totalNodes = 0;
  let fails = 0;
  let count = 0;
  const t1 = Date.now();

  for (let i = 0; i < PERFTFENS.length; i++) {

    const entry = PERFTFENS[i];
    const depth = entry[1];

    if (maxDepth && depth > maxDepth)
      continue;

    const fen = entry[0].replace(/\s+/g, ' ').split(' ');
    const expect = entry[2];
    const id  = entry[3].trim();

    position(fen[1], fen[2], fen[3], fen[4]);

    const n = perft(0, depth);
    totalNodes += n;
    count++;

    const ok = n === expect;
    if (!ok)
      fails++;

    uciSend(id + ' depth ' + depth + ' ' + (ok ? 'ok' : '*** FAIL *** got ' + n + ' expected ' + expect));
  }

  const t2 = Date.now();
  const ms = t2 - t1;
  const nps = ms ? Math.floor(totalNodes / ms * 1000) : 0;

  uciSend('');
  uciSend(count + ' tests, ' + fails + ' fails, ' + totalNodes + ' nodes in ' + ms + ' ms ' + nps + ' nps');
}

function uciSend(s) {
  if (nodeHost) {
    console.log(s);
  }
  else {
    postMessage(s);
  }
}

// C-ish whitespace test: treats ASCII <= 32 as whitespace (space/tab/CR/LF/etc)
function isWsCode(c) {
  return c <= 32;
}

// Manual tokenizer: like a C loop filling argv[]
function tokenizeLine(line) {
  const tokens = [];
  const n = line.length;
  let i = 0;

  while (i < n && tokens.length < MAX_TOKENS) {
    while (i < n && isWsCode(line.charCodeAt(i))) {
      i++;
    }
    if (i >= n) {
      break;
    }

    const start = i;

    while (i < n && !isWsCode(line.charCodeAt(i))) {
      i++;
    }

    tokens.push(line.slice(start, i));
  }

  return tokens;
}

function uciExecLine(line) {
  if (line === null || line === undefined) {
    return;
  }

  line = String(line).trim();
  if (line.length === 0) {
    return;
  }

  const tokens = tokenizeLine(line);
  if (tokens.length === 0) {
    return;
  }

  const cmd = tokens[0];

  if (cmd === 'isready') {
    uciSend('readyok');
  }
  else if (cmd === 'uci') {
    uciSend('id name Lozza 11');
    uciSend('id author xyzzy');
    //uciSend('option name Hash type spin default ' + ttDefault + ' min 1 max 1024');
    //uciSend('option name MultiPV type spin default 1 min 1 max 10');
    uciSend('uciok');
  }
  else if (cmd === 'p' || cmd === 'position') {
    if (tokens[1] === 'startpos' || tokens[1] === 's') {
      position('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', 'w', 'KQkq', '-');
    }
    else {
      position(tokens[2], tokens[3], tokens[4], tokens[5]);
    }
  }
  else if (cmd === 'b' || cmd === 'board') {
    printBoard();
  }
  else if (cmd === 'perft' || cmd === 'f') {
    const depth = parseInt(tokens[1]) || 0;
    const t1 = Date.now();
    const n = perft(0, depth);
    const t2 = Date.now();
    const ms = t2 - t1;
    const nps = ms ? Math.floor(n / ms * 1000) : 0;
    uciSend('perft ' + depth + ' = ' + n + ' in ' + ms + ' ms ' + nps + ' nps');
  }
  else if (cmd === 'pt') {
    perftTests(parseInt(tokens[1]) || 0);
  }
  else if (cmd === 'quit' || cmd === 'q') {
    if (nodeHost) {
      process.exit(0);
    }
  }
  else {
    uciSend('?');
  }
}
initNodes();

const nodeHost = typeof process !== 'undefined' && process.versions?.node;

let feedBuf = '';

function feed(chunk) {
  if (chunk === null || chunk === undefined) {
    return;
  }

  feedBuf += String(chunk);

  while (true) {
    const nl = feedBuf.indexOf('\n');
    if (nl < 0) {
      break;
    }

    let line = feedBuf.slice(0, nl);
    feedBuf = feedBuf.slice(nl + 1);

    // strip optional CR for Windows CRLF
    if (line.length && line.charCodeAt(line.length - 1) === 13) {
      line = line.slice(0, -1);
    }

    uciExecLine(line);
  }
}

if (!nodeHost) {
  onmessage = function(e) {
    feed(e.data);
  };
}
else {
  if (process.argv.length > 2) {
    for (let i = 2; i < process.argv.length; i++) {
      uciExecLine(process.argv[i]);
    }
    process.exit(0);
  }

  process.stdin.setEncoding('utf8');

  process.stdin.on('data', function(chunk) {
    feed(chunk);
  });

  process.stdin.on('end', function() {
    process.exit(0);
  });
}
