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

function posPrintBoard(pos) {
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
