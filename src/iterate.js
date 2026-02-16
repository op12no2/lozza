
// getNextMove

function getNextMove (node) {

  switch (node.stage) {

    case 0: {
      // node.moves
      
      if (node.next !== node.numMoves) {
      
        let maxM = 0;
      
        const moves = node.moves;
        const ranks = node.ranks;
        const next  = node.next;
        const num   = node.numMoves;
      
        let maxR = -INF;
        let maxI = 0;
      
        for (let i=next; i < num; i++) {
          if (ranks[i] > maxR) {
            maxR = ranks[i];
            maxI = i;
          }
        }
      
        maxM = moves[maxI]
      
        moves[maxI] = moves[next];
        ranks[maxI] = ranks[next];
      
        node.base = maxR;
      
        node.next++;
      
        return maxM;
      
      }
      
      else {
      
        node.stage++;
        node.next = 0;
      
        rankSlides(node);
      
      }
      
    }

    case 1: {
      // node.moves2
      
      if (node.next !== node.numMoves2) {
      
        let maxM = 0;
      
        const moves = node.moves2;
        const ranks = node.ranks2;
        const next  = node.next;
        const num   = node.numMoves2;
      
        let maxR = -INF;
        let maxI = 0;
      
        for (let i=next; i < num; i++) {
          if (ranks[i] > maxR) {
            maxR = ranks[i];
            maxI = i;
          }
        }
      
        maxM = moves[maxI]
      
        moves[maxI] = moves[next];
        ranks[maxI] = ranks[next];
      
        node.base = maxR;
      
        node.next++;
      
        return maxM;
      
      }
      
      else {
      
        return 0;
      
      }
      
    }

  }
}

// rankSlides

function rankSlides (node) {

  for (let i=0; i < node.numMoves2; i++) {

    const move  = node.moves2[i];
    const to    = (move & MOVE_TO_MASK)    >>> MOVE_TO_BITS;
    const frObj = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;

    const hisScore = objHistory[(frObj << 8) + to];

    if (hisScore === BASE_HISSLIDE) {

      const fr          = (move & MOVE_FR_MASK) >>> MOVE_FR_BITS;
      const slideScores = SLIDE_SCORES[frObj];

      node.ranks2[i] = BASE_SLIDE + slideScores[to] - slideScores[fr];

    }

    else {

      node.ranks2[i] = hisScore;

    }
  }
}



// addSlide

function addSlide (node, move) {

  const m = move & MOVE_CLEAN_MASK;

  if (m === node.hashMove) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_HASH;
  }

  else if (m === node.mateKiller) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_MATEKILLER;
  }

  else if (m === node.killer1) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_MYKILLERS + 1;
  }

  else if (m === node.killer2) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_MYKILLERS;
  }

  else if (node.grandparentNode !== null && m === node.grandparentNode.killer1) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_GPKILLERS + 1;
  }

  else if (node.grandparentNode !== null && m === node.grandparentNode.killer2) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_GPKILLERS;
  }

  else {
    node.moves2[node.numMoves2++] = move;  // defer ranking until later
  }

}

// addCastle

function addCastle (node, move) {

  const m = move & MOVE_CLEAN_MASK;

  if (m === node.hashMove) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_HASH;
  }

  else if (m === node.mateKiller) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_MATEKILLER;
  }

  else if (m === node.killer1) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_MYKILLERS + 1;
  }

  else if (m === node.killer2) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_MYKILLERS;
  }

  else if (node.grandparentNode !== null && m === node.grandparentNode.killer1) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_GPKILLERS + 1;
  }

  else if (node.grandparentNode !== null && m === node.grandparentNode.killer2) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_GPKILLERS;
  }

  else {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_CASTLING;
  }

}

// addCapture

function addCapture (node, move) {

  const m = move & MOVE_CLEAN_MASK;

  if (m === node.hashMove) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_HASH;
  }

  else {

    const victim = RANK_VECTOR[((move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS) & PIECE_MASK];
    const attack = RANK_VECTOR[((move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS) & PIECE_MASK];

    if (victim > attack) {
      node.moves[node.numMoves]   = move;
      node.ranks[node.numMoves++] = BASE_GOODTAKES + (victim << 6) - attack;
    }

    else if (victim === attack) {
      node.moves[node.numMoves]   = move;
      node.ranks[node.numMoves++] = BASE_EVENTAKES + (victim << 6) - attack;
    }

    else {

      if (m === node.mateKiller) {
        node.moves[node.numMoves]   = move;
        node.ranks[node.numMoves++] = BASE_MATEKILLER;
      }

      else if (m === node.killer1) {
        node.moves[node.numMoves]   = move;
        node.ranks[node.numMoves++] = BASE_MYKILLERS + 1;
      }

      else if (m === node.killer2) {
        node.moves[node.numMoves]   = move;
        node.ranks[node.numMoves++] = BASE_MYKILLERS;
      }

      else if (node.grandparentNode !== null && m === node.grandparentNode.killer1) {
        node.moves[node.numMoves]   = move;
        node.ranks[node.numMoves++] = BASE_GPKILLERS + 1;
      }

      else if (node.grandparentNode !== null && m === node.grandparentNode.killer2) {
        node.moves[node.numMoves]   = move;
        node.ranks[node.numMoves++] = BASE_GPKILLERS;
      }

      else {
        node.moves[node.numMoves]   = move;
        node.ranks[node.numMoves++] = BASE_BADTAKES + (victim << 6) - attack;
      }

    }
  }
}

// addPromotion

function addPromotion (node, move) {

  const m = move & MOVE_CLEAN_MASK;

  if ((m | QPRO) === node.hashMove) {
    node.moves[node.numMoves]   = move | QPRO;
    node.ranks[node.numMoves++] = BASE_HASH;
  }
  else {
    node.moves[node.numMoves]   = move | QPRO;
    node.ranks[node.numMoves++] = BASE_PROMOTES + QUEEN;
  }

  if ((m | RPRO) === node.hashMove) {
    node.moves[node.numMoves]   = move | RPRO;
    node.ranks[node.numMoves++] = BASE_HASH;
  }
  else {
    node.moves[node.numMoves]   = move | RPRO;
    node.ranks[node.numMoves++] = BASE_PROMOTES + ROOK;
  }

  if ((m | BPRO) === node.hashMove) {
    node.moves[node.numMoves]   = move | BPRO;
    node.ranks[node.numMoves++] = BASE_HASH;
  }
  else {
    node.moves[node.numMoves]   = move | BPRO;
    node.ranks[node.numMoves++] = BASE_PROMOTES + BISHOP;
  }

  if ((m | NPRO) === node.hashMove) {
    node.moves[node.numMoves]   = move | NPRO;
    node.ranks[node.numMoves++] = BASE_HASH;
  }
  else {
    node.moves[node.numMoves]   = move | NPRO;
    node.ranks[node.numMoves++] = BASE_PROMOTES + KNIGHT;
  }

}

// addEPTake

function addEPTake (node, move) {

  const m = move & MOVE_CLEAN_MASK;

  if ((m | MOVE_EPTAKE_MASK) === node.hashMove) {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_HASH;
  }

  else {
    node.moves[node.numMoves]   = move;
    node.ranks[node.numMoves++] = BASE_EPTAKES;
  }

}

// addQMove

function addQMove (node, move) {

  const m = move & MOVE_CLEAN_MASK;
  const n = node.numMoves++;

  node.moves[n] = move;

  if (m === node.hashMove)
    node.ranks[n] = BASE_HASH;

  else if ((move & MOVE_PROMOTE_MASK) !== 0) {
    if ((move & MOVE_NOISY_MASK) !== 0)
      node.ranks[n] = BASE_PROMOTES + ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS) + 8;  // QRBN capture
    else
      node.ranks[n] = BASE_PROMOTES + ((move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS);      // QRBN slide (allowed in qs)
  }

  else if ((move & MOVE_EPTAKE_MASK) !== 0)
    node.ranks[n] = BASE_EPTAKES;

  else {
    const victim = RANK_VECTOR[((move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS) & PIECE_MASK];
    const attack = RANK_VECTOR[((move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS) & PIECE_MASK];

    if (victim > attack)
      node.ranks[n] = BASE_GOODTAKES + (victim << 6) - attack;

    else if (victim === attack)
      node.ranks[n] = BASE_EVENTAKES + (victim << 6) - attack;

    else
      node.ranks[n] = BASE_BADTAKES + (victim << 6) - attack;
  }

}

// addQPromotion

function addQPromotion (node, move) {

  addQMove (node, move | (QUEEN-2)  << MOVE_PROMAS_BITS);
  addQMove (node, move | (ROOK-2)   << MOVE_PROMAS_BITS);
  addQMove (node, move | (BISHOP-2) << MOVE_PROMAS_BITS);
  addQMove (node, move | (KNIGHT-2) << MOVE_PROMAS_BITS);

}

// addKiller

function addKiller (node, score, move) {

  move = move & MOVE_CLEAN_MASK;

  if (move === node.hashMove)
    return;

  if ((move & (MOVE_EPTAKE_MASK | MOVE_PROMOTE_MASK)) !== 0)
    return;  // before killers in move ordering.

  if ((move & MOVE_TOOBJ_MASK) !== 0) {

    const victim = RANK_VECTOR[((move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS) & PIECE_MASK];
    const attack = RANK_VECTOR[((move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS) & PIECE_MASK];

    if (victim >= attack)
      return; // before killers in move ordering.
  }

  if (score >= MINMATE && score <= MATE) {
    node.mateKiller = move;
    if (node.killer1 === move)
      node.killer1 = 0;
    if (node.killer2 === move)
      node.killer2 = 0;
    return;
  }

  if (node.killer1 === move || node.killer2 === move) {
    return;
  }

  if (node.killer1 === 0) {
    node.killer1 = move;
    return;
  }

  if (node.killer2 === 0) {
    node.killer2 = move;
    return;
  }

  const tmp    = node.killer1;
  node.killer1 = move;
  node.killer2 = tmp;

}

