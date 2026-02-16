
function evaluate (turn) {

  // init
  
  const numPieces = wCount + bCount;
  
  const wNumQueens  = wCounts[QUEEN];
  const wNumRooks   = wCounts[ROOK];
  const wNumBishops = wCounts[BISHOP];
  const wNumKnights = wCounts[KNIGHT];
  const wNumPawns   = wCounts[PAWN];
  
  const bNumQueens  = bCounts[QUEEN];
  const bNumRooks   = bCounts[ROOK];
  const bNumBishops = bCounts[BISHOP];
  const bNumKnights = bCounts[KNIGHT];
  const bNumPawns   = bCounts[PAWN];
  
  // draw?
  
  if (numPieces === 2)
    return 0;
  
  if (numPieces === 3 && (wNumKnights !== 0 || wNumBishops !== 0 || bNumKnights !== 0 || bNumBishops !== 0))
    return 0;
  
  if (numPieces === 4 && (wNumKnights !== 0 || wNumBishops !== 0) && (bNumKnights !== 0 || bNumBishops !== 0))
    return 0;
  
  if (numPieces === 4 && (wNumKnights === 2 || bNumKnights === 2))
    return 0;
  
  if (numPieces === 5 && wNumKnights === 2 && (bNumKnights !== 0 || bNumBishops !== 0))
    return 0;
  
  if (numPieces === 5 && bNumKnights === 2 && (wNumKnights !== 0 || wNumBishops !== 0))
    return 0;
  
  if (numPieces === 5 && wNumBishops === 2 && bNumBishops !== 0)
    return 0;
  
  if (numPieces === 5 && bNumBishops === 2 && wNumBishops !== 0)
    return 0;
  
  if (numPieces === 4 && wNumRooks !== 0 && bNumRooks !== 0)
    return 0;
  
  if (numPieces === 4 && wNumQueens !== 0 && bNumQueens !== 0)
    return 0;

  return netEval(turn);

}

