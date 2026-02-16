function genMoves (node, turn) {

  node.stage     = 0;
  node.numMoves  = 0;
  node.numMoves2 = 0;
  node.next      = 0;

  const b = bdB;
  const inCheck = node.inCheck;

  // colour based stuff
  
  if (turn === WHITE) {
  
    var offsetOrth  = -12;
    var offsetDiag1 = -13;
    var offsetDiag2 = -11;
    var homeRank    = 2;
    var promoteRank = 7;
    var rights      = bdRights & WHITE_RIGHTS;
    var pList       = wList;
    var theirKingSq = bList[0];
    var pCount      = wCount;
    var CAPTURE     = IS_BNK;
    var aligned     = ALIGNED[wList[0]];
  
    if (inCheck === 0 && rights !== 0) {
  
      if (((rights & WHITE_RIGHTS_KING) !== 0) && b[F1] === 0 && b[G1] === 0 && b[SQG2] !== B_KING && b[SQH2] !== B_KING && isAttacked(F1,BLACK) === 0)
        addCastle(node, MOVE_E1G1);
  
      if (((rights & WHITE_RIGHTS_QUEEN) !== 0) && b[B1] === 0 && b[C1] === 0 && b[D1] === 0 && b[SQB2] !== B_KING && b[SQC2] !== B_KING && isAttacked(D1,BLACK) === 0)
        addCastle(node, MOVE_E1C1);
    }
  
  }
  
  else {
  
    var offsetOrth  = 12;
    var offsetDiag1 = 13;
    var offsetDiag2 = 11;
    var homeRank    = 7;
    var promoteRank = 2;
    var rights      = bdRights & BLACK_RIGHTS;
    var pList       = bList;
    var theirKingSq = wList[0];
    var pCount      = bCount;
    var CAPTURE     = IS_WNK;
    var aligned     = ALIGNED[bList[0]];
  
    if (inCheck === 0 && rights !== 0) {
  
      if (((rights & BLACK_RIGHTS_KING) !== 0) && b[F8] === 0 && b[G8] === 0 && b[SQG7] !== B_KING && b[SQH7] !== B_KING && isAttacked(F8,WHITE) === 0)
        addCastle(node, MOVE_E8G8);
  
      if (((rights & BLACK_RIGHTS_QUEEN) !== 0) && b[B8] === 0 && b[C8] === 0 && b[D8] === 0 && b[SQB7] !== B_KING && b[SQC7] !== B_KING && isAttacked(D8,WHITE) === 0)
        addCastle(node, MOVE_E8C8);
    }
  
  }
  

  let next   = 0;
  let count  = 0;
  let to     = 0;
  let toObj  = 0;
  let myMove = 0;

  while (count < pCount) {

    const fr = pList[next];
    if (fr === 0) {
      next++;
      continue;
    }

    const frObj     = b[fr];
    const frPiece   = frObj & PIECE_MASK;
    const frMove    = (frObj << MOVE_FROBJ_BITS) | (fr << MOVE_FR_BITS);
    const frRank    = RANK[fr];
    const legalMask = inCheck === 0 && aligned[fr] === 0 ? MOVE_LEGAL_MASK : 0;

    switch (frPiece) {
      case 1: {
        // P
        
        // orth
        
        to    = fr + offsetOrth;
        toObj = b[to];
        
        if (toObj === 0) {
        
          if (frRank === promoteRank)
            addPromotion(node, frMove | to | legalMask);
        
          else {
            addSlide(node, frMove | to | legalMask);
        
            if (frRank === homeRank) {
        
              to += offsetOrth;
              if (b[to] === 0)
                addSlide(node, frMove | to | MOVE_EPMAKE_MASK | legalMask);
            }
          }
        
        }
        
        // diag1
        
        to    = fr + offsetDiag1;
        toObj = b[to];
        
        if (CAPTURE[toObj] !== 0) {
        
          if (frRank === promoteRank)
            addPromotion(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to | legalMask);
          else
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to | legalMask);
        }
        
        else if (toObj === 0 && to === bdEp)
          addEPTake(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to | MOVE_EPTAKE_MASK);
        
        // diag2
        
        to    = fr + offsetDiag2;
        toObj = b[to];
        
        if (CAPTURE[toObj] !== 0) {
        
          if (frRank === promoteRank)
            addPromotion(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to | legalMask);
          else
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to | legalMask);
        }
        
        else if (toObj === 0 && to === bdEp)
          addEPTake(node, frMove | to | MOVE_EPTAKE_MASK);
        
        
        break;
        
      }
      case 2: {
        // N
        
        myMove = frMove | legalMask;
        
        to = fr + 25;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 25;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 23;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 23;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 14;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 14;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 10;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 10;
        if ((toObj = b[to]) === 0)
          addSlide(node, myMove | to);
        else if (CAPTURE[toObj] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        break;
        
      }
      case 3: {
        // B
        
        myMove = frMove | legalMask;
        
        to = fr + 11;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 11;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 13;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 13;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        break;
        
      }
      case 4: {
        // R
        
        myMove = frMove | legalMask;
        
        to = fr + 1;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 1;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 12;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 12;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        break;
        
      }
      case 5: {
        // B
        
        myMove = frMove | legalMask;
        
        to = fr + 11;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 11;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 13;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 13;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        // R
        
        myMove = frMove | legalMask;
        
        to = fr + 1;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 1;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 12;
        while (b[to] === 0)
          addSlide(node, myMove | to), to += 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 12;
        while (b[to] === 0)
          addSlide(node, myMove | to), to -= 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addCapture(node, myMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        break;
        
      }
      case 6: {
        // K
        
        to = fr + 11;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }
        
        to = fr - 11;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }
        
        to = fr + 13;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }
        
        to = fr - 13;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }
        
        to = fr + 1;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }
        
        to = fr - 1;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }
        
        to = fr + 12;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }
        
        to = fr - 12;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0) {
          if ((toObj = b[to]) === 0)
            addSlide(node, frMove | to);
          else if (CAPTURE[toObj] !== 0)
            addCapture(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }
        
        break;
        
      }
    }

    next++;
    count++

  }
}

// genQMoves

function genQMoves (node, turn) {

  node.stage     = 0;
  node.numMoves  = 0;
  node.numMoves2 = 0;
  node.next      = 0;

  const b = bdB;

  // colour based stuff
  
  if (turn === WHITE) {
  
    var offsetOrth  = -12;
    var offsetDiag1 = -13;
    var offsetDiag2 = -11;
    var promoteRank = 7;
    var pList       = wList;
    var theirKingSq = bList[0];
    var pCount      = wCount;
    var CAPTURE     = IS_BNK;
  
  }
  
  else {
  
    var offsetOrth  = 12;
    var offsetDiag1 = 13;
    var offsetDiag2 = 11;
    var promoteRank = 2;
    var pList       = bList;
    var theirKingSq = wList[0];
    var pCount      = bCount;
    var CAPTURE     = IS_WNK;
  
  }
  

  let next  = 0;
  let count = 0;
  let to    = 0;
  let toObj = 0;

  while (count < pCount) {

    const fr = pList[next];
    if (fr === 0) {
      next++;
      continue;
    }

    const frObj   = b[fr];
    const frPiece = frObj & PIECE_MASK;
    const frMove  = (frObj << MOVE_FROBJ_BITS) | (fr << MOVE_FR_BITS);
    const frRank  = RANK[fr];

    switch (frPiece) {
      case 1: {
        // P
        
        // orth
        
        to    = fr + offsetOrth;
        toObj = b[to];
        
        if (toObj === 0) {
        
          if (frRank === promoteRank)
            addQPromotion(node, MOVE_PROMOTE_MASK | frMove | to);
        
        }
        
        // diag1
        
        to    = fr + offsetDiag1;
        toObj = b[to];
        
        if (CAPTURE[toObj] !== 0) {
        
          if (frRank === promoteRank)
            addQPromotion(node, MOVE_PROMOTE_MASK | frMove | (toObj << MOVE_TOOBJ_BITS) | to);
          else
            addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }
        
        else if (toObj === 0 && to === bdEp)
          addQMove(node, MOVE_EPTAKE_MASK | frMove | to);
        
        // diag2
        
        to    = fr + offsetDiag2;
        toObj = b[to];
        
        if (CAPTURE[toObj] !== 0) {
        
          if (frRank === promoteRank)
            addQPromotion(node, MOVE_PROMOTE_MASK | frMove | (toObj << MOVE_TOOBJ_BITS) | to);
          else
            addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        }
        
        else if (toObj === 0 && to === bdEp)
          addQMove(node, MOVE_EPTAKE_MASK | frMove | to);
        
        
        break;
        
      }
      case 2: {
        // N
        
        to = fr + 25;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 25;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 23;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 23;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 14;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 14;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 10;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 10;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        break;
        
      }
      case 3: {
        // B
        
        to = fr + 11;
        while (b[to] === 0)
          to += 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 11;
        while (b[to] === 0)
          to -= 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 13;
        while (b[to] === 0)
          to += 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 13;
        while (b[to] === 0)
          to -= 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        break;
        
      }
      case 4: {
        // R
        
        to = fr + 1;
        while (b[to] === 0)
          to += 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 1;
        while (b[to] === 0)
          to -= 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 12;
        while (b[to] === 0)
          to += 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 12;
        while (b[to] === 0)
          to -= 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        break;
        
      }
      case 5: {
        // B
        
        to = fr + 11;
        while (b[to] === 0)
          to += 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 11;
        while (b[to] === 0)
          to -= 11;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 13;
        while (b[to] === 0)
          to += 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 13;
        while (b[to] === 0)
          to -= 13;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        // R
        
        to = fr + 1;
        while (b[to] === 0)
          to += 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 1;
        while (b[to] === 0)
          to -= 1;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 12;
        while (b[to] === 0)
          to += 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 12;
        while (b[to] === 0)
          to -= 12;
        if (CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        break;
        
      }
      case 6: {
        // K
        
        to = fr + 11;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 11;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 13;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 13;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 1;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 1;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr + 12;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        to = fr - 12;
        if (ADJACENT[Math.abs(to-theirKingSq)] === 0 && CAPTURE[toObj = b[to]] !== 0)
          addQMove(node, frMove | (toObj << MOVE_TOOBJ_BITS) | to);
        
        break;
        
      }
    }

    next++;
    count++
  }

}

