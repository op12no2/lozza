
// quickSee

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

