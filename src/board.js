
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

function position(boardStr, stmStr, rightsStr, epStr, moves) {

  g_board.fill(0);

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
      g_board[rank * 16 + file] = charPiece[cc];
      file++;
    }
  }

  if (stmStr === 'w')
    g_stm = WHITE;
  else
    g_stm = BLACK;

  g_rights = 0;
  for (let i = 0; i < rightsStr.length; i++) {
    const cc = rightsStr.charCodeAt(i);
    if (cc === 75)       // K
      g_rights |= WHITE_RIGHTS_KING;
    else if (cc === 81)  // Q
      g_rights |= WHITE_RIGHTS_QUEEN;
    else if (cc === 107) // k
      g_rights |= BLACK_RIGHTS_KING;
    else if (cc === 113) // q
      g_rights |= BLACK_RIGHTS_QUEEN;
  }

  if (epStr === '-')
    g_ep = 0;
  else
    g_ep = (epStr.charCodeAt(1) - 49) * 16 + (epStr.charCodeAt(0) - 97);

  // build piece list

  const pl = g_pieces;
  const b = g_board;
  const px = g_plix;

  pl.fill(0);
  px.fill(0);

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
        px[sq] = 1;
      }
      else {
        bCount++;
        pl[17 + bCount] = sq;
        px[sq] = bCount;
      }
    }
    else {
      if ((piece & 7) === KING) {
        pl[0 + 1] = sq;
        px[sq] = 1;
      }
      else {
        wCount++;
        pl[0 + wCount] = sq;
        px[sq] = wCount;
      }
    }
  }

  pl[0]  = wCount;
  pl[17] = bCount;

  // init hash

  g_loHash = 0;
  g_hiHash = 0;

  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const piece = b[sq];
    if (piece) {
      g_loHash ^= loPieces[piece][sq];
      g_hiHash ^= hiPieces[piece][sq];
    }
  }

  g_loHash ^= loRights[g_rights];
  g_hiHash ^= hiRights[g_rights];

  if (g_ep) {
    g_loHash ^= loEP[g_ep];
    g_hiHash ^= hiEP[g_ep];
  }

  if (g_stm === BLACK) {
    g_loHash ^= loStm;
    g_hiHash ^= hiStm;
  }

  if (moves) {
    for (let m = 0; m < moves.length; m++) {
      rootNode.numMoves = 0;
      genNoisy(rootNode);
      genQuiets(rootNode);
      genCastling(rootNode);
      let found = 0;
      for (let i = 0; i < rootNode.numMoves; i++) {
        if (formatMove(rootNode.moves[i]) === moves[m]) {
          make(rootNode, rootNode.moves[i]);
          found = 1;
          break;
        }
      }
      if (!found) {
        uciSend('info string illegal move ' + moves[m]);
        return;
      }
    }
  }
}

function printBoard() {

  const sep = '  +---+---+---+---+---+---+---+---+';

  uciSend(sep);

  for (let rank = 7; rank >= 0; rank--) {
    let line = (rank + 1) + ' |';
    for (let file = 0; file < 8; file++) {
      const piece = g_board[rank * 16 + file];
      const ch = piece ? pieceChar[piece] : ' ';
      line += ' ' + ch + ' |';
    }
    uciSend(line);
    uciSend(sep);
  }

  uciSend('    a   b   c   d   e   f   g   h');

  let rightsStr = '';
  if (g_rights & WHITE_RIGHTS_KING)
    rightsStr += 'K';
  if (g_rights & WHITE_RIGHTS_QUEEN)
    rightsStr += 'Q';
  if (g_rights & BLACK_RIGHTS_KING)
    rightsStr += 'k';
  if (g_rights & BLACK_RIGHTS_QUEEN)
    rightsStr += 'q';
  if (!rightsStr)
    rightsStr = '-';

  let epStr = '-';
  if (g_ep) {
    const file = g_ep & 0x0F;
    const rank = g_ep >> 4;
    epStr = String.fromCharCode(97 + file) + String.fromCharCode(49 + rank);
  }

  uciSend('');
  uciSend('  stm: ' + (g_stm === WHITE ? 'w' : 'b') + ' rights: ' + rightsStr + ' ep: ' + epStr);
}

function isAttacked(sq, byColour) {

  const b = g_board;

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
