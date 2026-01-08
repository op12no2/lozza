const WHITE = 0;
const BLACK = 8;

const PAWN = 1;
const KNIGHT = 2;
const BISHOP = 3;
const ROOK = 4;
const QUEEN = 5;
const KING = 6;

const PIECE_MAP = {
  'P': PAWN, 'N': KNIGHT, 'B': BISHOP, 'R': ROOK, 'Q': QUEEN, 'K': KING,
  'p': PAWN|BLACK, 'n': KNIGHT|BLACK, 'b': BISHOP|BLACK, 'r': ROOK|BLACK, 'q': QUEEN|BLACK, 'k': KING|BLACK
};

const RIGHTS_K = 1;
const RIGHTS_Q = 2;
const RIGHTS_k = 4;
const RIGHTS_q = 8;

class Pos {

  constructor() {
    this.board = new Uint8Array(128);
    this.kings = new Uint8Array(2);
    this.ep = 0;
    this.rights = 0;
    this.stm = 0;
  }
}

function posClear(pos) {
  pos.board.fill(0);
  pos.kings.fill(0);
  pos.ep = 0;
  pos.rights = 0;
  pos.stm = 0;
}

function posSet(pos, other) {
  pos.board.set(other.board);
  pos.kings.set(other.kings);
  pos.ep = other.ep;
  pos.rights = other.rights;
  pos.stm = other.stm;
}

function position(pos, fen) {
  
  posClear(pos);

  const parts = fen.split(' ');
  const ranks = parts[0].split('/');

  for (let rank = 7; rank >= 0; rank--) {
    const fenRank = ranks[7 - rank];
    let file = 0;
    for (let i = 0; i < fenRank.length; i++) {
      const c = fenRank[i];
      if (c >= '1' && c <= '8') {
        file += parseInt(c);
      }
      else {
        const sq = rank * 16 + file;
        const piece = PIECE_MAP[c];
        pos.board[sq] = piece;
        if (c === 'K') pos.kings[WHITE >> 3] = sq;
        if (c === 'k') pos.kings[BLACK >> 3] = sq;
        file++;
      }
    }
  }

  pos.stm = (parts[1] === 'w') ? WHITE : BLACK;

  const castling = parts[2] || '-';
  if (castling.includes('K')) pos.rights |= RIGHTS_K;
  if (castling.includes('Q')) pos.rights |= RIGHTS_Q;
  if (castling.includes('k')) pos.rights |= RIGHTS_k;
  if (castling.includes('q')) pos.rights |= RIGHTS_q;

  const epStr = parts[3] || '-';
  if (epStr !== '-') {
    const epFile = epStr.charCodeAt(0) - 97;
    const epRank = parseInt(epStr[1]) - 1;
    pos.ep = epRank * 16 + epFile;
  }
}

function printBoard(pos) {
  
  const pieces = '.PNBRQK..pnbrqk';
  const files = 'abcdefgh';

  uciWrite('');
  for (let rank = 7; rank >= 0; rank--) {
    let line = (rank + 1) + '  ';
    for (let file = 0; file < 8; file++) {
      const sq = rank * 16 + file;
      const piece = pos.board[sq];
      line += pieces[piece] + ' ';
    }
    uciWrite(line);
  }
  uciWrite('');
  uciWrite('   a b c d e f g h');
  uciWrite('');

  const wKingSq = pos.kings[WHITE >> 3];
  const bKingSq = pos.kings[BLACK >> 3];
  const wKingCoord = files[wKingSq & 7] + ((wKingSq >> 4) + 1);
  const bKingCoord = files[bKingSq & 7] + ((bKingSq >> 4) + 1);

  let rightsStr = '';
  if (pos.rights & RIGHTS_K) rightsStr += 'K';
  if (pos.rights & RIGHTS_Q) rightsStr += 'Q';
  if (pos.rights & RIGHTS_k) rightsStr += 'k';
  if (pos.rights & RIGHTS_q) rightsStr += 'q';
  if (rightsStr === '') rightsStr = '-';

  uciWrite('kings: white=' + wKingCoord + ' black=' + bKingCoord);
  uciWrite('rights: ' + rightsStr);
  uciWrite('stm: ' + (pos.stm === WHITE ? 'white' : 'black'));
  uciWrite('');
}

const MAX_PLY = 64;
const MAX_MOVES = 256;

class Node {

  constructor() {
    this.pos = null;
    this.moves = new Uint32Array(MAX_MOVES);
    this.ranks = new Uint32Array(MAX_MOVES);
    this.numMoves = 0;
  }
}

const nodes = Array(MAX_PLY);

function nodeInitOnce() {
  for (let i=0; i < MAX_PLY; i++ ) {
    nodes[i] = new Node();
    nodes[i].pos = new Pos();
  }
}

const MOVE_FLAG_CAPTURE    = 0x10000;
const MOVE_FLAG_EPMAKE     = 0x20000;
const MOVE_FLAG_EPCAPTURE  = 0x40000;
const MOVE_FLAG_KCASTLE    = 0x80000;
const MOVE_FLAG_QCASTLE    = 0x100000;
const MOVE_FLAG_KING       = 0x200000;

const MOVE_PROMO_SHIFT = 22;
const MOVE_PROMO_MASK  = 0x7 << MOVE_PROMO_SHIFT;
const MOVE_PROMO_Q     = 5 << MOVE_PROMO_SHIFT;
const MOVE_PROMO_R     = 4 << MOVE_PROMO_SHIFT;
const MOVE_PROMO_B     = 3 << MOVE_PROMO_SHIFT;
const MOVE_PROMO_N     = 2 << MOVE_PROMO_SHIFT;

const MOVE_EXTRA_MASK = MOVE_FLAG_QCASTLE | MOVE_FLAG_KCASTLE | MOVE_FLAG_EPCAPTURE | MOVE_FLAG_EPMAKE | MOVE_FLAG_KING | MOVE_PROMO_MASK;
const MOVE_QS_MASK = MOVE_FLAG_CAPTURE | MOVE_FLAG_EPCAPTURE;

const KNIGHT_OFFSETS = [-33, -31, -18, -14, 14, 18, 31, 33];
const BISHOP_OFFSETS = [-17, -15, 15, 17];
const ROOK_OFFSETS   = [-16, -1, 1, 16];
const QUEEN_OFFSETS  = [-17, -16, -15, -1, 1, 15, 16, 17];
const KING_OFFSETS   = [-17, -16, -15, -1, 1, 15, 16, 17];
const PAWN_CAP_WHITE = [15, 17];
const PAWN_CAP_BLACK = [-15, -17];

function genMoves(node) {

  node.numMoves = 0;

  const pos = node.pos;
  const board = pos.board;
  const stm = pos.stm;
  const nstm = stm ^ BLACK;

  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) continue;

    const piece = board[sq];
    if (!piece) continue;
    if ((piece & BLACK) !== stm) continue;

    const type = piece & 7;

    switch (type) {
      case PAWN: {
        const dir = stm === WHITE ? 16 : -16;
        const startRank = stm === WHITE ? 1 : 6;
        const promoRank = stm === WHITE ? 6 : 1;
        const rank = sq >> 4;
        const isPromo = rank === promoRank;

        // single push
        const to1 = sq + dir;
        if (!(to1 & 0x88) && !board[to1]) {
          if (isPromo) {
            node.moves[node.numMoves++] = to1 | (sq << 8) | MOVE_PROMO_Q;
            node.moves[node.numMoves++] = to1 | (sq << 8) | MOVE_PROMO_R;
            node.moves[node.numMoves++] = to1 | (sq << 8) | MOVE_PROMO_B;
            node.moves[node.numMoves++] = to1 | (sq << 8) | MOVE_PROMO_N;
          }
          else {
            node.moves[node.numMoves++] = to1 | (sq << 8);
            // double push
            if (rank === startRank) {
              const to2 = sq + dir + dir;
              if (!(to2 & 0x88) && !board[to2]) {
                node.moves[node.numMoves++] = to2 | (sq << 8) | MOVE_FLAG_EPMAKE;
              }
            }
          }
        }

        // captures
        const capOffsets = stm === WHITE ? PAWN_CAP_WHITE : PAWN_CAP_BLACK;
        for (const off of capOffsets) {
          const to = sq + off;
          if (to & 0x88) continue;
          const target = board[to];
          if (target && (target & BLACK) === nstm) {
            if (isPromo) {
              node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE | MOVE_PROMO_Q;
              node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE | MOVE_PROMO_R;
              node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE | MOVE_PROMO_B;
              node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE | MOVE_PROMO_N;
            }
            else {
              node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
            }
          }
          else if (to === pos.ep) {
            node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_EPCAPTURE;
          }
        }
        break;
      }

      case KNIGHT: {
        for (const off of KNIGHT_OFFSETS) {
          const to = sq + off;
          if (to & 0x88) continue;
          const target = board[to];
          if (!target) {
            node.moves[node.numMoves++] = to | (sq << 8);
          }
          else if ((target & BLACK) === nstm) {
            node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
          }
        }
        break;
      }

      case BISHOP: {
        for (const off of BISHOP_OFFSETS) {
          let to = sq + off;
          while (!(to & 0x88)) {
            const target = board[to];
            if (!target) {
              node.moves[node.numMoves++] = to | (sq << 8);
            }
            else {
              if ((target & BLACK) === nstm) {
                node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
              }
              break;
            }
            to += off;
          }
        }
        break;
      }

      case ROOK: {
        for (const off of ROOK_OFFSETS) {
          let to = sq + off;
          while (!(to & 0x88)) {
            const target = board[to];
            if (!target) {
              node.moves[node.numMoves++] = to | (sq << 8);
            }
            else {
              if ((target & BLACK) === nstm) {
                node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
              }
              break;
            }
            to += off;
          }
        }
        break;
      }

      case QUEEN: {
        for (const off of QUEEN_OFFSETS) {
          let to = sq + off;
          while (!(to & 0x88)) {
            const target = board[to];
            if (!target) {
              node.moves[node.numMoves++] = to | (sq << 8);
            }
            else {
              if ((target & BLACK) === nstm) {
                node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
              }
              break;
            }
            to += off;
          }
        }
        break;
      }

      case KING: {
        for (const off of KING_OFFSETS) {
          const to = sq + off;
          if (to & 0x88) continue;
          const target = board[to];
          if (!target) {
            node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_KING;
          }
          else if ((target & BLACK) === nstm && (target & 7) !== KING) {
            node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE | MOVE_FLAG_KING;
          }
        }
        break;
      }
    }
  }

  if (pos.rights) {
    if (stm === WHITE) {
      if ((pos.rights & RIGHTS_K) && !board[0x05] && !board[0x06] &&
          !isAttacked(pos, 0x04, BLACK) && !isAttacked(pos, 0x05, BLACK) && !isAttacked(pos, 0x06, BLACK)) {
        node.moves[node.numMoves++] = 0x06 | (0x04 << 8) | MOVE_FLAG_KCASTLE;
      }
      if ((pos.rights & RIGHTS_Q) && !board[0x03] && !board[0x02] && !board[0x01] &&
          !isAttacked(pos, 0x04, BLACK) && !isAttacked(pos, 0x03, BLACK) && !isAttacked(pos, 0x02, BLACK)) {
        node.moves[node.numMoves++] = 0x02 | (0x04 << 8) | MOVE_FLAG_QCASTLE;
      }
    }
    else {
      if ((pos.rights & RIGHTS_k) && !board[0x75] && !board[0x76] &&
          !isAttacked(pos, 0x74, WHITE) && !isAttacked(pos, 0x75, WHITE) && !isAttacked(pos, 0x76, WHITE)) {
        node.moves[node.numMoves++] = 0x76 | (0x74 << 8) | MOVE_FLAG_KCASTLE;
      }
      if ((pos.rights & RIGHTS_q) && !board[0x73] && !board[0x72] && !board[0x71] &&
          !isAttacked(pos, 0x74, WHITE) && !isAttacked(pos, 0x73, WHITE) && !isAttacked(pos, 0x72, WHITE)) {
        node.moves[node.numMoves++] = 0x72 | (0x74 << 8) | MOVE_FLAG_QCASTLE;
      }
    }
  }
}
const RIGHTS_MASK = new Uint8Array(128);
RIGHTS_MASK.fill(0xF);
RIGHTS_MASK[0x00] = 0xF ^ RIGHTS_Q;
RIGHTS_MASK[0x07] = 0xF ^ RIGHTS_K;
RIGHTS_MASK[0x70] = 0xF ^ RIGHTS_q;
RIGHTS_MASK[0x77] = 0xF ^ RIGHTS_k;
RIGHTS_MASK[0x04] = 0xF ^ RIGHTS_K ^ RIGHTS_Q;
RIGHTS_MASK[0x74] = 0xF ^ RIGHTS_k ^ RIGHTS_q;

function makeMove(move, pos) {

  const from = (move >> 8) & 0x7f;
  const to = move & 0x7f;

  pos.board[to] = pos.board[from];
  pos.board[from] = 0;
  pos.ep = 0;
  
  if (move & MOVE_EXTRA_MASK) {

    const piece = pos.board[to];

    if (move & MOVE_FLAG_KING) {
      pos.kings[piece >> 3] = to;
    }

    else if (move & MOVE_PROMO_MASK) {
      pos.board[to] = pos.stm | (move & MOVE_PROMO_MASK) >> MOVE_PROMO_SHIFT;
    }

    else if (move & MOVE_FLAG_EPMAKE) {
      pos.ep = pos.stm === WHITE ? to - 16 : to + 16;
    }

    else if (move & MOVE_FLAG_EPCAPTURE) {
      const capSq = pos.stm === WHITE ? to - 16 : to + 16;
      pos.board[capSq] = 0;
    }
    
    else if (move & MOVE_FLAG_KCASTLE) {
      pos.kings[piece >> 3] = to;
      pos.board[to - 1] = pos.board[to + 1];
      pos.board[to + 1] = 0;
    }

    else if (move & MOVE_FLAG_QCASTLE) {
      pos.kings[piece >> 3] = to;
      pos.board[to + 1] = pos.board[to - 2];
      pos.board[to - 2] = 0;
    }
  }

  pos.rights &= RIGHTS_MASK[from] & RIGHTS_MASK[to];
  pos.stm ^= BLACK;

}function isAttacked(pos, sq, byColor) {
  const board = pos.board;

  // pawns
  const pawnDir = byColor === WHITE ? -16 : 16;
  const pawn = PAWN | byColor;
  const p1 = sq + pawnDir - 1;
  if (p1 >= 0 && !(p1 & 0x88) && board[p1] === pawn) return 1;
  const p2 = sq + pawnDir + 1;
  if (p2 >= 0 && !(p2 & 0x88) && board[p2] === pawn) return 1;

  // knights
  const knight = KNIGHT | byColor;
  for (let i = 0; i < 8; i++) {
    const to = sq + KNIGHT_OFFSETS[i];
    if (!(to & 0x88) && board[to] === knight) return 1;
  }

  // king
  const king = KING | byColor;
  for (let i = 0; i < 8; i++) {
    const to = sq + KING_OFFSETS[i];
    if (!(to & 0x88) && board[to] === king) return 1;
  }

  // bishops/queens (diagonals)
  const bishop = BISHOP | byColor;
  const queen = QUEEN | byColor;
  for (let i = 0; i < 4; i++) {
    const off = BISHOP_OFFSETS[i];
    let to = sq + off;
    while (to >= 0 && !(to & 0x88)) {
      const piece = board[to];
      if (piece) {
        if (piece === bishop || piece === queen) return 1;
        break;
      }
      to += off;
    }
  }

  // rooks/queens (straights)
  const rook = ROOK | byColor;
  for (let i = 0; i < 4; i++) {
    const off = ROOK_OFFSETS[i];
    let to = sq + off;
    while (to >= 0 && !(to & 0x88)) {
      const piece = board[to];
      if (piece) {
        if (piece === rook || piece === queen) return 1;
        break;
      }
      to += off;
    }
  }

  return 0;
}

const PHASE = new Int16Array([0, 0, 1, 1, 2, 4, 0]);

const MGW = Array(7);
const MGB = Array(7);
const EGW = Array(7);
const EGB = Array(7);

function evaluate(node) {

  const pos = node.pos;
  const board = pos.board;

  let mgW = 0, mgB = 0, egW = 0, egB = 0;
  let phase = 0;

  for (let sq = 0; sq < 128; sq++) {

    if (sq & 0x88)
      continue;

    const piece = board[sq];
    if (!piece)
      continue;

    const type = piece & 7;
    const col = piece & BLACK;

    phase += PHASE[type];

    if (col) {
      mgB += MGB[type][sq];
      egB += EGB[type][sq];
    }
    else {
      mgW += MGW[type][sq];
      egW += EGW[type][sq];
    }
  }

  const mgScore = pos.stm ? mgB - mgW : mgW - mgB;
  const egScore = pos.stm ? egB - egW : egW - egB;

  if (phase > 24)
    phase = 24;

  return Math.trunc((mgScore * phase + egScore * (24 - phase)) / 24);

}

function evalInitOnce() {

  const MAT_MG = new Int16Array([0, 82, 337, 365, 477, 1025, 0]);
  const MAT_EG = new Int16Array([0, 94, 281, 297, 512,  936, 0]);

  const PAWN_MG = new Int16Array([
      0,   0,   0,   0,   0,   0,   0,   0,   0, 0, 0, 0, 0, 0, 0, 0,
    -35,  -1, -20, -23, -15,  24,  38, -22,   0, 0, 0, 0, 0, 0, 0, 0,
    -26,  -4,  -4, -10,   3,   3,  33, -12,   0, 0, 0, 0, 0, 0, 0, 0,
    -27,  -2,  -5,  12,  17,   6,  10, -25,   0, 0, 0, 0, 0, 0, 0, 0,
    -14,  13,   6,  21,  23,  12,  17, -23,   0, 0, 0, 0, 0, 0, 0, 0,
     -6,   7,  26,  31,  65,  56,  25, -20,   0, 0, 0, 0, 0, 0, 0, 0,
     98, 134,  61,  95,  68, 126,  34, -11,   0, 0, 0, 0, 0, 0, 0, 0,
      0,   0,   0,   0,   0,   0,   0,   0,   0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const PAWN_EG = new Int16Array([
      0,   0,   0,   0,   0,   0,   0,   0,   0, 0, 0, 0, 0, 0, 0, 0,
     13,   8,   8,  10,  13,   0,   2,  -7,   0, 0, 0, 0, 0, 0, 0, 0,
      4,   7,  -6,   1,   0,  -5,  -1,  -8,   0, 0, 0, 0, 0, 0, 0, 0,
     13,   9,  -3,  -7,  -7,  -8,   3,  -1,   0, 0, 0, 0, 0, 0, 0, 0,
     32,  24,  13,   5,  -2,   4,  17,  17,   0, 0, 0, 0, 0, 0, 0, 0,
     94, 100,  85,  67,  56,  53,  82,  84,   0, 0, 0, 0, 0, 0, 0, 0,
    178, 173, 158, 134, 147, 132, 165, 187,   0, 0, 0, 0, 0, 0, 0, 0,
      0,   0,   0,   0,   0,   0,   0,   0,   0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const KNIGHT_MG = new Int16Array([
   -105, -21, -58, -33, -17, -28, -19, -23,   0, 0, 0, 0, 0, 0, 0, 0,
    -29, -53, -12,  -3,  -1,  18, -14, -19,   0, 0, 0, 0, 0, 0, 0, 0,
    -23,  -9,  12,  10,  19,  17,  25, -16,   0, 0, 0, 0, 0, 0, 0, 0,
    -13,   4,  16,  13,  28,  19,  21,  -8,   0, 0, 0, 0, 0, 0, 0, 0,
     -9,  17,  19,  53,  37,  69,  18,  22,   0, 0, 0, 0, 0, 0, 0, 0,
    -47,  60,  37,  65,  84, 129,  73,  44,   0, 0, 0, 0, 0, 0, 0, 0,
    -73, -41,  72,  36,  23,  62,   7, -17,   0, 0, 0, 0, 0, 0, 0, 0,
   -167, -89, -34, -49,  61, -97, -15,-107,   0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const KNIGHT_EG = new Int16Array([
    -29, -51, -23, -15, -22, -18, -50, -64,   0, 0, 0, 0, 0, 0, 0, 0,
    -42, -20, -10,  -5,  -2, -20, -23, -44,   0, 0, 0, 0, 0, 0, 0, 0,
    -23,  -3,  -1,  15,  10,  -3, -20, -22,   0, 0, 0, 0, 0, 0, 0, 0,
    -18,  -6,  16,  25,  16,  17,   4, -18,   0, 0, 0, 0, 0, 0, 0, 0,
    -17,   3,  22,  22,  22,  11,   8, -18,   0, 0, 0, 0, 0, 0, 0, 0,
    -24, -20,  10,   9,  -1,  -9, -19, -41,   0, 0, 0, 0, 0, 0, 0, 0,
    -25,  -8, -25,  -2,  -9, -25, -24, -52,   0, 0, 0, 0, 0, 0, 0, 0,
    -58, -38, -13, -28, -31, -27, -63, -99,   0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const BISHOP_MG = new Int16Array([
    -33,  -3, -14, -21, -13, -12, -39, -21,   0, 0, 0, 0, 0, 0, 0, 0,
      4,  15,  16,   0,   7,  21,  33,   1,   0, 0, 0, 0, 0, 0, 0, 0,
      0,  15,  15,  15,  14,  27,  18,  10,   0, 0, 0, 0, 0, 0, 0, 0,
     -6,  13,  13,  26,  34,  12,  10,   4,   0, 0, 0, 0, 0, 0, 0, 0,
     -4,   5,  19,  50,  37,  37,   7,  -2,   0, 0, 0, 0, 0, 0, 0, 0,
    -16,  37,  43,  40,  35,  50,  37,  -2,   0, 0, 0, 0, 0, 0, 0, 0,
    -26,  16, -18, -13,  30,  59,  18, -47,   0, 0, 0, 0, 0, 0, 0, 0,
    -29,   4, -82, -37, -25, -42,   7,  -8,   0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const BISHOP_EG = new Int16Array([
    -23,  -9, -23,  -5,  -9, -16,  -5, -17,   0, 0, 0, 0, 0, 0, 0, 0,
    -14, -18,  -7,  -1,   4,  -9, -15, -27,   0, 0, 0, 0, 0, 0, 0, 0,
    -12,  -3,   8,  10,  13,   3,  -7, -15,   0, 0, 0, 0, 0, 0, 0, 0,
     -6,   3,  13,  19,   7,  10,  -3,  -9,   0, 0, 0, 0, 0, 0, 0, 0,
     -3,   9,  12,   9,  14,  10,   3,   2,   0, 0, 0, 0, 0, 0, 0, 0,
      2,  -8,   0,  -1,  -2,   6,   0,   4,   0, 0, 0, 0, 0, 0, 0, 0,
     -8,  -4,   7, -12,  -3, -13,  -4, -14,   0, 0, 0, 0, 0, 0, 0, 0,
    -14, -21, -11,  -8,  -7,  -9, -17, -24,   0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const ROOK_MG = new Int16Array([
    -19, -13,   1,  17,  16,   7, -37, -26,   0, 0, 0, 0, 0, 0, 0, 0,
    -44, -16, -20,  -9,  -1,  11,  -6, -71,   0, 0, 0, 0, 0, 0, 0, 0,
    -45, -25, -16, -17,   3,   0,  -5, -33,   0, 0, 0, 0, 0, 0, 0, 0,
    -36, -26, -12,  -1,   9,  -7,   6, -23,   0, 0, 0, 0, 0, 0, 0, 0,
    -24, -11,   7,  26,  24,  35,  -8, -20,   0, 0, 0, 0, 0, 0, 0, 0,
     -5,  19,  26,  36,  17,  45,  61,  16,   0, 0, 0, 0, 0, 0, 0, 0,
     27,  32,  58,  62,  80,  67,  26,  44,   0, 0, 0, 0, 0, 0, 0, 0,
     32,  42,  32,  51,  63,   9,  31,  43,   0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const ROOK_EG = new Int16Array([
     -9,   2,   3,  -1,  -5, -13,   4, -20,   0, 0, 0, 0, 0, 0, 0, 0,
     -6,  -6,   0,   2,  -9,  -9, -11,  -3,   0, 0, 0, 0, 0, 0, 0, 0,
     -4,   0,  -5,  -1,  -7, -12,  -8, -16,   0, 0, 0, 0, 0, 0, 0, 0,
      3,   5,   8,   4,  -5,  -6,  -8, -11,   0, 0, 0, 0, 0, 0, 0, 0,
      4,   3,  13,   1,   2,   1,  -1,   2,   0, 0, 0, 0, 0, 0, 0, 0,
      7,   7,   7,   5,   4,  -3,  -5,  -3,   0, 0, 0, 0, 0, 0, 0, 0,
     11,  13,  13,  11,  -3,   3,   8,   3,   0, 0, 0, 0, 0, 0, 0, 0,
     13,  10,  18,  15,  12,  12,   8,   5,   0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const QUEEN_MG = new Int16Array([
     -1, -18,  -9,  10, -15, -25, -31, -50,   0, 0, 0, 0, 0, 0, 0, 0,
    -35,  -8,  11,   2,   8,  15,  -3,   1,   0, 0, 0, 0, 0, 0, 0, 0,
    -14,   2, -11,  -2,  -5,   2,  14,   5,   0, 0, 0, 0, 0, 0, 0, 0,
     -9, -26,  -9, -10,  -2,  -4,   3,  -3,   0, 0, 0, 0, 0, 0, 0, 0,
    -27, -27, -16, -16,  -1,  17,  -2,   1,   0, 0, 0, 0, 0, 0, 0, 0,
    -13, -17,   7,   8,  29,  56,  47,  57,   0, 0, 0, 0, 0, 0, 0, 0,
    -24, -39,  -5,   1, -16,  57,  28,  54,   0, 0, 0, 0, 0, 0, 0, 0,
    -28,   0,  29,  12,  59,  44,  43,  45,   0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const QUEEN_EG = new Int16Array([
    -33, -28, -22, -43,  -5, -32, -20, -41,   0, 0, 0, 0, 0, 0, 0, 0,
    -22, -23, -30, -16, -16, -23, -36, -32,   0, 0, 0, 0, 0, 0, 0, 0,
    -16, -27,  15,   6,   9,  17,  10,   5,   0, 0, 0, 0, 0, 0, 0, 0,
    -18,  28,  19,  47,  31,  34,  39,  23,   0, 0, 0, 0, 0, 0, 0, 0,
      3,  22,  24,  45,  57,  40,  57,  36,   0, 0, 0, 0, 0, 0, 0, 0,
    -20,   6,   9,  49,  47,  35,  19,   9,   0, 0, 0, 0, 0, 0, 0, 0,
    -17,  20,  32,  41,  58,  25,  30,   0,   0, 0, 0, 0, 0, 0, 0, 0,
     -9,  22,  22,  27,  27,  19,  10,  20,   0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const KING_MG = new Int16Array([
    -15,  36,  12, -54,   8, -28,  24,  14,   0, 0, 0, 0, 0, 0, 0, 0,
      1,   7,  -8, -64, -43, -16,   9,   8,   0, 0, 0, 0, 0, 0, 0, 0,
    -14, -14, -22, -46, -44, -30, -15, -27,   0, 0, 0, 0, 0, 0, 0, 0,
    -49,  -1, -27, -39, -46, -44, -33, -51,   0, 0, 0, 0, 0, 0, 0, 0,
    -17, -20, -12, -27, -30, -25, -14, -36,   0, 0, 0, 0, 0, 0, 0, 0,
     -9,  24,   2, -16, -20,   6,  22, -22,   0, 0, 0, 0, 0, 0, 0, 0,
     29,  -1, -20,  -7,  -8,  -4, -38, -29,   0, 0, 0, 0, 0, 0, 0, 0,
    -65,  23,  16, -15, -56, -34,   2,  13,   0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const KING_EG = new Int16Array([
    -53, -34, -21, -11, -28, -14, -24, -43,   0, 0, 0, 0, 0, 0, 0, 0,
    -27, -11,   4,  13,  14,   4,  -5, -17,   0, 0, 0, 0, 0, 0, 0, 0,
    -19,  -3,  11,  21,  23,  16,   7,  -9,   0, 0, 0, 0, 0, 0, 0, 0,
    -18,  -4,  21,  24,  27,  23,   9, -11,   0, 0, 0, 0, 0, 0, 0, 0,
     -8,  22,  24,  27,  26,  33,  26,   3,   0, 0, 0, 0, 0, 0, 0, 0,
     10,  17,  23,  15,  20,  45,  44,  13,   0, 0, 0, 0, 0, 0, 0, 0,
    -12,  17,  14,  17,  17,  38,  23,  11,   0, 0, 0, 0, 0, 0, 0, 0,
    -74, -35, -18, -18, -11,  15,   4, -17,   0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const PST_MG = [PAWN_MG, PAWN_MG, KNIGHT_MG, BISHOP_MG, ROOK_MG, QUEEN_MG, KING_MG];
  const PST_EG = [PAWN_EG, PAWN_EG, KNIGHT_EG, BISHOP_EG, ROOK_EG, QUEEN_EG, KING_EG];

  for (let piece = 1; piece <= 6; piece++) {
    MGW[piece] = new Int16Array(128);
    MGB[piece] = new Int16Array(128);
    EGW[piece] = new Int16Array(128);
    EGB[piece] = new Int16Array(128);
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88)
        continue;
      const flipped = sq ^ 0x70;
      MGW[piece][sq] = MAT_MG[piece] + PST_MG[piece][sq];
      MGB[piece][sq] = MAT_MG[piece] + PST_MG[piece][flipped];
      EGW[piece][sq] = MAT_EG[piece] + PST_EG[piece][sq];
      EGB[piece][sq] = MAT_EG[piece] + PST_EG[piece][flipped];
    }
  }
}
class TimeControl {

  constructor() {
    this.bestMove = 0;
    this.nodes = 0;
  }
}

const timeControl = new TimeControl();

function tcClear() {
  const tc = timeControl;
  tc.bestMove = 0;
  tc.nodes = 0;
}
function qsearch(ply, alpha, beta) {

  timeControl.nodes++;
  
  const node = nodes[ply];
  const pos = node.pos;

  const standPat = evaluate(node);

  if (standPat >= beta)
    return standPat;

  if (standPat > alpha)
    alpha = standPat;

  const nextNode = nodes[ply + 1];
  const nextPos = nextNode.pos;
  const stmi = pos.stm >> 3;

  genMoves(node);

  for (let i = 0; i < node.numMoves; i++) {

    const move = node.moves[i];

    if (!(move & MOVE_QS_MASK))
      continue;

    posSet(nextPos, pos);
    makeMove(move, nextPos);

    if (isAttacked(nextPos, nextPos.kings[stmi], nextPos.stm))
      continue;

    const score = -qsearch(ply + 1, -beta, -alpha);

    if (score >= beta)
      return score;

    if (score > alpha)
      alpha = score;
  }

  return alpha;

}

const MATE = 10000;

function search(depth, ply, alpha, beta) {

  if (depth <= 0)
    return qsearch(ply, alpha, beta);
  
  timeControl.nodes++;
  
  const node = nodes[ply];
  const nextNode = nodes[ply + 1];
  const pos = node.pos;
  const nextPos = nextNode.pos;
  const stmi = pos.stm >> 3;
  const nstm = pos.stm ^ BLACK;
  const inCheck = isAttacked(pos, pos.kings[stmi], nstm);

  genMoves(node);

  let bestScore = -Infinity;
  let bestMove = 0;

  let numMoves = 0;

  for (let i = 0; i < node.numMoves; i++) {

    const move = node.moves[i];

    posSet(nextPos, pos);
    makeMove(move, nextPos);

    if (isAttacked(nextPos, nextPos.kings[stmi], nstm))
      continue;

    numMoves++;

    const score = -search(depth - 1, ply + 1, -beta, -alpha);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    
    if (bestScore > alpha) {
      if (ply === 0) {
        timeControl.bestMove = bestMove;
      }
      alpha = bestScore;
    }

    if (alpha >= beta) {
      return bestScore;
    }
  }

  if (numMoves === 0)
    return inCheck ? -MATE + ply : 0;

  return bestScore;

}
function perft (depth, ply) {

  if (depth === 0)
    return 1;

  const node = nodes[ply];
  const nextNode = nodes[ply+1];
  const pos = node.pos;
  const nextPos = nextNode.pos;
  const stmi = pos.stm >> 3;

  let tot = 0;

  genMoves(node);

  for (let i=0; i < node.numMoves; i++) {
    const move = node.moves[i];
    posSet(nextPos, pos);
    makeMove(move, nextPos);
    if (isAttacked(nextPos, nextPos.kings[stmi], nextPos.stm))
      continue;
    tot += perft(depth-1, ply+1);
  }

  return tot;

}function execString (cmd) {
  const tokens = cmd.trim().split(/\s+/).filter(t => t.length > 0);
  if (tokens.length > 0) {
    execTokens(tokens);
  }
}

function execTokens(tokens) {
  switch (tokens[0]) {

    case 'uci':
      uciWrite('id name Lozza 9');
      uciWrite('id author Colin Jenkins');
      uciWrite('uciok');
      break;

    case 'position':
    case 'p':
      if (tokens[1] === 'startpos' || tokens[1] === 's') {
        position(nodes[0].pos, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      }
      else if (tokens[1] === 'fen' || tokens[1] === 'f') {
        const fen = tokens.slice(2).join(' ');  // hack re moves
        position(nodes[0].pos, fen);
      }
      break;
    
    case 'board':
    case 'b':
      printBoard(nodes[0].pos);
      break;
   
    case 'perft':
    case 'f': {  
        const depth = parseInt(tokens[1]);
        const t1 = performance.now();
        const n = perft(depth, 0);
        let elapsed = performance.now() - t1;
        const nps = (n/elapsed * 1000) | 0;
        elapsed |= elapsed;
        uciWrite(`nodes ${n} elapsed ${elapsed} nps ${nps}`);
        break;  
      }

    case 'eval':  
    case 'e':
      uciWrite(evaluate(nodes[0]));
      break;

  }
}const uciContext = (function() {
  if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    return 'worker';
  }
  if (typeof Deno !== 'undefined') {
    return 'deno';
  }
  if (typeof Bun !== 'undefined') {
    return 'bun';
  }
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return 'node';
  }
  if (typeof window !== 'undefined') {
    return 'browser';
  }
  return 'unknown';
})();

function uciWrite(data) {
  switch (uciContext) {
    case 'worker':
      self.postMessage(data);
      break;
    case 'node':
    case 'bun':
      process.stdout.write(data + '\n');
      break;
    case 'deno':
      Deno.stdout.writeSync(new TextEncoder().encode(data + '\n'));
      break;
    default:
      console.log(data);
  }
}

function uciQuit() {
  switch (uciContext) {
    case 'worker':
      self.close();
      break;
    case 'node':
    case 'bun':
      process.exit(0);
      break;
    case 'deno':
      Deno.exit(0);
      break;
    default:
      break;
  }
}

function uciRead(callback) {
  switch (uciContext) {
    case 'worker':
      self.onmessage = function(e) {
        callback(e.data);
      };
      break;

    case 'node':
    case 'bun':
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
      });
      rl.on('line', function(line) {
        callback(line);
      });
      break;

    case 'deno':
      (async function() {
        const decoder = new TextDecoder();
        const reader = Deno.stdin.readable.getReader();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            callback(line);
          }
        }
      })();
      break;

    default:
      break;
  }
}


nodeInitOnce();
evalInitOnce();

if (typeof module !== 'undefined') {
  module.exports = { perft, position, nodes, genMoves, makeMove, posSet, search, tcClear, timeControl };
}

if (typeof require === 'undefined' || require.main === module) {
  uciRead(function(data) {
    const cmd = data.trim().toLowerCase();
    if (cmd === 'quit' || cmd === 'q') {
      uciQuit();
    }
    else {
      execString(data);
    }
  });
}
