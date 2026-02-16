
function makeMoveA (node, move) {

  const b = bdB;
  const z = bdZ;

  const fr      = (move & MOVE_FR_MASK   ) >>> MOVE_FR_BITS;
  const to      = (move & MOVE_TO_MASK   ) >>> MOVE_TO_BITS;
  const toObj   = (move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS;
  const frObj   = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;
  const frPiece = frObj & PIECE_MASK;
  const frCol   = frObj & COLOR_MASK;

  // slide piece
  
  b[fr] = 0;
  b[to] = frObj;
  
  node.frZ = z[fr];
  node.toZ = z[to];
  
  z[fr] = NO_Z;
  z[to] = node.frZ;
  
  loHash ^= loObjPieces[(frObj << 8) + fr];
  hiHash ^= hiObjPieces[(frObj << 8) + fr];
  
  loHash ^= loObjPieces[(frObj << 8) + to];
  hiHash ^= hiObjPieces[(frObj << 8) + to];
  
  wbList[frCol >>> 3][node.frZ] = to;
  
  // clear rights?
  
  if (bdRights !== 0) {
  
    loHash ^= loRights[bdRights];
    hiHash ^= hiRights[bdRights];
  
    bdRights &= MASK_RIGHTS[fr] & MASK_RIGHTS[to];
  
    loHash ^= loRights[bdRights];
    hiHash ^= hiRights[bdRights];
  
  }
  
  // capture?
  
  if (toObj !== 0) {
  
    const toPiece = toObj & PIECE_MASK;
    const toCol   = toObj & COLOR_MASK;
  
    loHash ^= loObjPieces[(toObj << 8) + to];
    hiHash ^= hiObjPieces[(toObj << 8) + to];
  
    if (toCol === WHITE) {
  
      wList[node.toZ] = EMPTY;
  
      wCounts[toPiece]--;
      wCount--;
    }
  
    else {
  
      bList[node.toZ] = EMPTY;
  
      bCounts[toPiece]--;
      bCount--;
    }
  
    ueFunc  = netCapture;
    ueArgs0 = frObj;
    ueArgs1 = fr;
    ueArgs2 = toObj;
    ueArgs3 = to;
  
  }
  
  else {
  
    ueFunc  = netMove;
    ueArgs0 = frObj;
    ueArgs1 = fr;
    ueArgs2 = to;
  
  }
  
  // reset EP
  
  loHash ^= loEP[bdEp];
  hiHash ^= hiEP[bdEp];
  
  bdEp = 0;
  
  loHash ^= loEP[bdEp];
  hiHash ^= hiEP[bdEp];
  

  if ((move & MOVE_SPECIAL_MASK) !== 0) {
    // ikky stuff
    
    if (frCol === WHITE) {
    
      const ep = to + 12;
    
      if ((move & MOVE_EPMAKE_MASK) !== 0) {
    
        ueFunc  = netMove;
        ueArgs0 = frObj;
        ueArgs1 = fr;
        ueArgs2 = to;
    
        loHash ^= loEP[bdEp];
        hiHash ^= hiEP[bdEp];
    
        bdEp = ep;
    
        loHash ^= loEP[bdEp];
        hiHash ^= hiEP[bdEp];
      }
    
      else if ((move & MOVE_EPTAKE_MASK) !== 0) {
    
        ueFunc  = netEpCapture;
        ueArgs0 = frObj;
        ueArgs1 = fr;
        ueArgs2 = to;
        ueArgs3 = B_PAWN;
        ueArgs4 = ep;
    
        b[ep]    = 0;
        node.epZ = z[ep];
        z[ep]    = NO_Z;
    
        bList[node.epZ] = EMPTY;
    
        loHash ^= loObjPieces[(B_PAWN << 8) + ep];
        hiHash ^= hiObjPieces[(B_PAWN << 8) + ep];
    
        bCounts[PAWN]--;
        bCount--;
      }
    
      else if ((move & MOVE_PROMOTE_MASK) !== 0) {
    
        const pro = ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS) + 2;  //NBRQ
        b[to]     = WHITE | pro;
    
        ueFunc  = netPromote;
        ueArgs0 = W_PAWN;
        ueArgs1 = fr;
        ueArgs2 = to;
        ueArgs3 = toObj;
        ueArgs4 = pro|WHITE;
    
        loHash ^= loObjPieces[(W_PAWN << 8) + to];
        hiHash ^= hiObjPieces[(W_PAWN << 8) + to];
        loHash ^= loObjPieces[((WHITE|pro) << 8) + to];
        hiHash ^= hiObjPieces[((WHITE|pro) << 8) + to];
    
        wCounts[PAWN]--;
        wCounts[pro]++;
    
      }
    
      else if (move === MOVE_E1G1) {
    
        ueFunc  = netCastle;
        ueArgs0 = W_KING;
        ueArgs1 = fr;
        ueArgs2 = to;
        ueArgs3 = W_ROOK;
        ueArgs4 = H1;
        ueArgs5 = F1;
    
        b[H1] = 0;
        b[F1] = W_ROOK;
        z[F1] = z[H1];
        z[H1] = NO_Z;
    
        wList[z[F1]] = F1;
    
        loHash ^= loObjPieces[(W_ROOK << 8) + H1];
        hiHash ^= hiObjPieces[(W_ROOK << 8) + H1];
        loHash ^= loObjPieces[(W_ROOK << 8) + F1];
        hiHash ^= hiObjPieces[(W_ROOK << 8) + F1];
    
      }
    
      else if (move === MOVE_E1C1) {
    
        ueFunc  = netCastle;
        ueArgs0 = W_KING;
        ueArgs1 = fr;
        ueArgs2 = to;
        ueArgs3 = W_ROOK;
        ueArgs4 = A1;
        ueArgs5 = D1;
    
        b[A1] = 0;
        b[D1] = W_ROOK;
        z[D1] = z[A1];
        z[A1] = NO_Z;
    
        wList[z[D1]] = D1;
    
        loHash ^= loObjPieces[(W_ROOK << 8) + A1];
        hiHash ^= hiObjPieces[(W_ROOK << 8) + A1];
        loHash ^= loObjPieces[(W_ROOK << 8) + D1];
        hiHash ^= hiObjPieces[(W_ROOK << 8) + D1];
    
      }
    }
    
    else {
    
      const ep = to - 12;
    
      if ((move & MOVE_EPMAKE_MASK) !== 0) {
    
        ueFunc  = netMove;
        ueArgs0 = frObj;
        ueArgs1 = fr;
        ueArgs2 = to;
    
        loHash ^= loEP[bdEp];
        hiHash ^= hiEP[bdEp];
    
        bdEp = ep;
    
        loHash ^= loEP[bdEp];
        hiHash ^= hiEP[bdEp];
      }
    
      else if ((move & MOVE_EPTAKE_MASK) !== 0) {
    
        ueFunc  = netEpCapture;
        ueArgs0 = frObj;
        ueArgs1 = fr;
        ueArgs2 = to;
        ueArgs3 = W_PAWN;
        ueArgs4 = ep;
    
        b[ep]    = 0;
        node.epZ = z[ep];
        z[ep]    = NO_Z;
    
        wList[node.epZ] = EMPTY;
    
        loHash ^= loObjPieces[(W_PAWN << 8) + ep];
        hiHash ^= hiObjPieces[(W_PAWN << 8) + ep];
    
        wCounts[PAWN]--;
        wCount--;
      }
    
      else if ((move & MOVE_PROMOTE_MASK) !== 0) {
    
        const pro = ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS) + 2;  //NBRQ
        b[to]     = BLACK | pro;
    
        ueFunc  = netPromote;
        ueArgs0 = B_PAWN;
        ueArgs1 = fr;
        ueArgs2 = to;
        ueArgs3 = toObj;
        ueArgs4 = pro|BLACK;
    
        loHash ^= loObjPieces[(B_PAWN << 8) + to];
        hiHash ^= hiObjPieces[(B_PAWN << 8) + to];
        loHash ^= loObjPieces[((pro|BLACK) << 8) + to];
        hiHash ^= hiObjPieces[((pro|BLACK) << 8) + to];
    
        bCounts[PAWN]--;
        bCounts[pro]++;
    
      }
    
      else if (move === MOVE_E8G8) {
    
        ueFunc  = netCastle;
        ueArgs0 = B_KING;
        ueArgs1 = fr;
        ueArgs2 = to;
        ueArgs3 = B_ROOK;
        ueArgs4 = H8;
        ueArgs5 = F8;
    
        b[H8] = 0;
        b[F8] = B_ROOK;
        z[F8] = z[H8];
        z[H8] = NO_Z;
    
        bList[z[F8]] = F8;
    
        loHash ^= loObjPieces[(B_ROOK << 8) + H8];
        hiHash ^= hiObjPieces[(B_ROOK << 8) + H8];
        loHash ^= loObjPieces[(B_ROOK << 8) + F8];
        hiHash ^= hiObjPieces[(B_ROOK << 8) + F8];
    
      }
    
      else if (move === MOVE_E8C8) {
    
        ueFunc  = netCastle;
        ueArgs0 = B_KING;
        ueArgs1 = fr;
        ueArgs2 = to;
        ueArgs3 = B_ROOK;
        ueArgs4 = A8;
        ueArgs5 = D8;
    
        b[A8] = 0;
        b[D8] = B_ROOK;
        z[D8] = z[A8];
        z[A8] = NO_Z;
    
        bList[z[D8]] = D8;
    
        loHash ^= loObjPieces[(B_ROOK << 8) + A8];
        hiHash ^= hiObjPieces[(B_ROOK << 8) + A8];
        loHash ^= loObjPieces[(B_ROOK << 8) + D8];
        hiHash ^= hiObjPieces[(B_ROOK << 8) + D8];
    
      }
    
    }
    
  }

  // flip turn in hash
  
  loHash ^= loTurn;
  hiHash ^= hiTurn;
  
  // push rep hash
  //
  // Repetitions are cancelled by pawn moves, castling, captures, EP
  // and promotions; i.e. moves that are not reversible.  The nearest
  // repetition is 5 indexes back from the current one and then that
  // and every other one entry is a possible rep.  Can also check for
  // 50 move rule by testing hi-lo > 100 - it's not perfect because of
  // the pawn move reset but it's a type 2 error, so safe.
  //
  
  repLoHash[repHi] = loHash;
  repHiHash[repHi] = hiHash;
  
  repHi++;
  
  if ((move & (MOVE_SPECIAL_MASK | MOVE_TOOBJ_MASK)) || frPiece === PAWN)
    repLo = repHi;
  

}

// makeMoveB
//
// If the ue* data is moved into nodes, this could be deferred and
// done in evaluate().
//

function makeMoveB  () {

  ueFunc();

}

// unmakeMove

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

