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

