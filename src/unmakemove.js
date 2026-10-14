function unmakeMove (node, move) {

  const b = bdB;
  const z = bdZ;

  const fr    = (move & MOVE_FR_MASK)    >>> MOVE_FR_BITS;
  const to    = (move & MOVE_TO_MASK)    >>> MOVE_TO_BITS;
  const toObj = (move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS;
  const frObj = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;
  const frCol = frObj & COLOR_MASK;

  b[fr] = frObj;
  b[to] = toObj;

  z[fr] = node.frZ;
  z[to] = node.toZ;

  wbList[frCol >>> 3][node.frZ] = fr;

  // capture?
  
  if (toObj !== 0) {
  
    const toPiece = toObj & PIECE_MASK;
    const toCol   = toObj & COLOR_MASK;
  
    if (toCol === WHITE) {
  
      wList[node.toZ] = to;
  
      wCounts[toPiece]++;
      wCount++;
    }
  
    else {
  
      bList[node.toZ] = to;
  
      bCounts[toPiece]++;
      bCount++;
    }
  
  }
  
  if ((move & MOVE_SPECIAL_MASK) !== 0) {
    // ikky stuff
    
    if ((frObj & COLOR_MASK) === WHITE) {
    
      const ep = to + 12;
    
      if (move & MOVE_EPTAKE_MASK) {
    
        b[ep] = B_PAWN;
        z[ep] = node.epZ;
    
        bList[node.epZ] = ep;
    
        bCounts[PAWN]++;
        bCount++;
    
      }
    
      else if (move & MOVE_PROMOTE_MASK) {
    
        const pro = ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS) + 2;  //NBRQ
    
        wCounts[PAWN]++;
        wCounts[pro]--;
    
      }
    
      else if (move === MOVE_E1G1) {
    
        b[H1] = W_ROOK;
        b[F1] = 0;
        z[H1] = z[F1];
        z[F1] = NO_Z;
    
        wList[z[H1]] = H1;
      }
    
      else if (move === MOVE_E1C1) {
    
        b[A1] = W_ROOK;
        b[D1] = 0;
        z[A1] = z[D1];
        z[D1] = NO_Z;
    
        wList[z[A1]] = A1;
      }
    }
    
    else {
    
      const ep = to - 12;
    
      if (move & MOVE_EPTAKE_MASK) {
    
        b[ep] = W_PAWN;
        z[ep] = node.epZ;
    
        wList[node.epZ] = ep;
    
        wCounts[PAWN]++;
        wCount++;
      }
    
      else if (move & MOVE_PROMOTE_MASK) {
    
        const pro = ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS) + 2;  //NBRQ
    
        bCounts[PAWN]++;
        bCounts[pro]--;
    
      }
    
      else if (move === MOVE_E8G8) {
    
        b[H8] = B_ROOK;
        b[F8] = 0;
        z[H8] = z[F8];
        z[F8] = NO_Z;
    
        bList[z[H8]] = H8;
      }
    
      else if (move === MOVE_E8C8) {
    
        b[A8] = B_ROOK;
        b[D8] = 0;
        z[A8] = z[D8];
        z[D8] = NO_Z;
    
        bList[z[A8]] = A8;
      }
    }
    
  }

}
