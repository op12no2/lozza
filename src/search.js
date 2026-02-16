function rootSearch (node, depth, turn, alpha, beta) {

  // check time
  
  node.pvLen = 0;
  
  if (node.childNode === null) {
    statsTimeOut = 1;
    return 0;
  }

  statsNodes++;

  const nextTurn = turn ^ COLOR_MASK;
  const oAlpha   = alpha;
  const inCheck  = isKingAttacked(nextTurn);
  const doLMR    = (depth >= 3) | 0;

  let numLegalMoves = 0;
  let numPrunes     = 0;
  let move          = 0;
  let bestMove      = 0;
  let score         = 0;
  let bestScore     = -INF;
  let R             = 0;
  let E             = 0;

  score = ttGet(node, depth, alpha, beta);  // load hash move and hash eval

  node.inCheck = inCheck;
  node.ev      = node.hashEval !== INF ? node.hashEval : evaluate(turn);

  ttUpdateEval(node.ev);
  cache(node);
  genMoves(node, turn);

  while ((move = getNextMove(node)) !== 0) {

    makeMoveA(node, move);

    // legal?
    
    if ((move & MOVE_LEGAL_MASK) === 0 && isKingAttacked(nextTurn) !== 0) {
    
      unmakeMove(node, move);
    
      uncacheA(node);
    
      continue;
    
    }
    

    makeMoveB();

    numLegalMoves++;
    if (node.base <= BASE_PRUNABLE)
      numPrunes++;

    // send current move to UCI?
    
    if (statsNodes > 10000000)
      uciSend('info currmove ' + formatMove(move) + ' currmovenumber ' + numLegalMoves);
    
    // extend/reduce
    
    E = 0;
    R = 0;
    
    if (inCheck !== 0) {
      E = 1;
    }
    
    else if (doLMR !== 0 && numLegalMoves > 4) {
      R = LMR_LOOKUP[(depth << 7) + numPrunes];
    }
    

    const nullWindow = (numLegalMoves > 1 || R) | 0;

    score = alpha;

    if (nullWindow !== 0)
      score = -search(node.childNode, depth+E-R-1, nextTurn, -alpha-1, -alpha);

    if (statsTimeOut === 0 && (nullWindow === 0 || score > alpha))
      score = -search(node.childNode, depth+E-1, nextTurn, -beta, -alpha);

    // unmake move
    
    unmakeMove(node, move);
    
    uncacheA(node);
    uncacheB(node);
    

    if (statsTimeOut !== 0)
      return 0;

    if (score > bestScore) {

      bestScore = score;
      bestMove  = move;

      if (bestScore > alpha) {

        collectPV(node, move);

        alpha = bestScore;

        statsBestMove  = bestMove;
        statsBestScore = bestScore;

        if (bestScore >= beta) {
          addKiller(node, bestScore, bestMove);
          if ((move & MOVE_NOISY_MASK) === 0)
            addHistory(Math.imul(Math.imul(depth, depth), depth), bestMove);
          ttPut(TT_BETA, depth, bestScore, bestMove, node.ply, alpha, beta, INF);
          return bestScore;
        }

        else {
          if ((move & MOVE_NOISY_MASK) === 0)
            addHistory(Math.imul(depth, depth), bestMove);
        }
      }
    }

    else {
      if ((move & MOVE_NOISY_MASK) === 0)
        addHistory(-depth, move);
    }
  }

  // update tt etc
  
  if (numLegalMoves === 1)
    statsTimeOut = 1;  // only one legal move so don't waste any more time
  
  if (numLegalMoves === 0) {
    statsTimeOut = 1;  // silly position
    statsBestMove = 0;
    statsBestScore = 0;
  }
  
  if (bestScore > oAlpha) {
    ttPut(TT_EXACT, depth, bestScore, bestMove, node.ply, alpha, beta, node.ev);
    return bestScore;
  }
  else {
    ttPut(TT_ALPHA, depth, bestScore, bestMove, node.ply, alpha, beta, node.ev);
    return bestScore;
  }
  

}

// search

function search (node, depth, turn, alpha, beta) {

  // check time
  
  node.pvLen = 0;
  
  if (node.childNode === null) {
    statsTimeOut = 1;
    return 0;
  }
  
  checkTime();
  if (statsTimeOut !== 0)
    return 0;
  
  if (node.ply > statsSelDepth)
    statsSelDepth = node.ply;
  
  const nextTurn = turn ^ COLOR_MASK;
  const pvNode   = (beta !== (alpha + 1)) | 0;

  // mate distance pruning
  
  const matingValue1 = MATE - node.ply;
  
  if (matingValue1 < beta) {
     beta = matingValue1;
     if (alpha >= matingValue1)
       return matingValue1;
  }
  
  const matingValue2 = -MATE + node.ply;
  
  if (matingValue2 > alpha) {
     alpha = matingValue2;
     if (beta <= matingValue2)
       return matingValue2;
  }
  
  // check for draws
  
  if (isDraw() !== 0)
    return 0;
  
  const inCheck = isKingAttacked(nextTurn);

  // horizon
  
  if (inCheck === 0 && depth <= 0)
    return qSearch(node, -1, turn, alpha, beta);

  statsNodes++;
  
  depth = Math.max(depth,0);
  

  let score = 0;

  // try tt
  
  score = ttGet(node, depth, alpha, beta);  // sets/clears node.hashMove and node.hashEval
  
  if (pvNode === 0 && score !== TTSCORE_UNKNOWN)
    return score;
  

  const doBeta = ((pvNode === 0 && inCheck === 0 && beta < MINMATE)) | 0;

  let R = 0;
  let E = 0;

  const ev = node.hashEval !== INF ? node.hashEval : evaluate(turn);

  // improving
  
  var improving = 0;
  
  if (inCheck === 0) {
    const n2 = node.grandparentNode;
    if (n2 !== null) {
      if (n2.inCheck === 0 && ev > n2.ev)
        improving = 1;
      else if (n2.inCheck !== 0) {
        const n4 = n2.grandparentNode;
        if (n4 !== null && n4.inCheck === 0 && ev > n4.ev)
          improving = 1;
      }
    }
  }
  
  // beta prune
  
  if (doBeta !== 0 && depth <= 8 && (ev - Math.imul(depth, 100)) >= (beta - Math.imul(improving, 50)))
    return ev;
  
  // alpha prune
  
  // hack if (pvNode == 0 && inCheck === 0 && alpha > -MINMATE && depth <= 4 && (ev + 900 * depth) <= alpha) {
    //const qs = qSearch(node, -1, turn, alpha, alpha + 1);
    //if (qs <= alpha) {
      //return qs;
    //}
  //}
  

  node.inCheck = inCheck;
  node.ev      = ev;

  cache(node);

  // NMP
  
  //const isPawnEG = (wCount == wCounts[PAWN]+1 && bCount == bCounts[PAWN]+1) | 0;
  
  if (doBeta !== 0 && depth > 2 && ev > beta) {
  
    R = 3 + improving;
  
    loHash ^= loEP[bdEp];
    hiHash ^= hiEP[bdEp];
  
    bdEp = 0;
  
    loHash ^= loEP[bdEp];
    hiHash ^= hiEP[bdEp];
  
    loHash ^= loTurn;
    hiHash ^= hiTurn;
  
    repLo = repHi;
  
    score = -search(node.childNode, depth-R-1, nextTurn, -beta, -beta+1);
  
    uncacheA(node);
    //uncacheB(node);
  
    if (score >= beta) {
      if (score > MINMATE)
        score = beta;
      return score;
    }
  
    if (statsTimeOut !== 0)
      return 0;
  }
  

  const oAlpha = alpha;
  const doFP   = (inCheck === 0 && depth <= 4) | 0;
  const doLMR  = (inCheck === 0 && depth >= 3) | 0;
  const doLMP  = (pvNode === 0 && inCheck === 0 && depth <= 2) | 0;
  const doIIR  = (node.hashMove === 0 && pvNode !== 0 && depth > 3) | 0;

  let bestScore     = -INF;
  let move          = 0;
  let bestMove      = 0;
  let numLegalMoves = 0;
  let numPrunes     = 0;

  // IIR
  //
  // https://www.talkchess.com/forum3/viewtopic.php?f=7&t=74769
  //
  
  if (doIIR !== 0) {
  
    depth -= 1;
  
  }
  
  ttUpdateEval(ev);
  genMoves(node, turn);

  while ((move = getNextMove(node)) !== 0) {

    // prune
    
    const prune = (numLegalMoves > 0 && node.base <= BASE_PRUNABLE && alpha > -MINMATE) | 0;
    
    if (doLMP !== 0 && prune !== 0 && numPrunes > Math.imul(depth, 5))
      continue;
    
    if (doFP !== 0 && prune !== 0 && (ev + Math.imul(depth, 120)) < alpha)
      continue;
    

    makeMoveA(node, move);

    // legal
    
    if ((move & MOVE_LEGAL_MASK) === 0 && isKingAttacked(nextTurn) !== 0) {
    
      unmakeMove(node, move);
    
      uncacheA(node);
    
      continue;
    
    }
    

    makeMoveB();

    numLegalMoves++;
    if (node.base <= BASE_PRUNABLE)
      numPrunes++;

    // extend/reduce
    
    E = 0;
    R = 0;
    
    if (inCheck !== 0 && (pvNode !== 0 || depth < 5)) {
      E = 1;
    }
    
    else if (doLMR !== 0 && numLegalMoves > 4) {
      R = LMR_LOOKUP[(depth << 7) + numPrunes];
    }
    

    const nullWindow = ((pvNode !== 0 && numLegalMoves > 1) || R) | 0;

    score = alpha;

    if (nullWindow !== 0)
      score = -search(node.childNode, depth+E-R-1, nextTurn, -alpha-1, -alpha);

    if (statsTimeOut === 0 && (nullWindow === 0 || score > alpha))
      score = -search(node.childNode, depth+E-1, nextTurn, -beta, -alpha);

    // unmake move
    
    unmakeMove(node, move);
    
    uncacheA(node);
    uncacheB(node);
    

    if (statsTimeOut !== 0)
      return 0;

    if (score > bestScore) {

      bestScore = score;
      bestMove  = move;

      if (bestScore > alpha) {

        if (pvNode !== 0)
          collectPV(node, move);

        alpha = bestScore;

        if (bestScore >= beta) {
          addKiller(node, bestScore, bestMove);
          if ((move & MOVE_NOISY_MASK) === 0)
            addHistory(Math.imul(Math.imul(depth, depth), depth), bestMove);
          ttPut(TT_BETA, depth, bestScore, bestMove, node.ply, alpha, beta, ev);
          return bestScore;
        }

        else {
          if ((move & MOVE_NOISY_MASK) === 0)
            addHistory(Math.imul(depth, depth), bestMove);
        }
      }
    }

    else {
      if ((move & MOVE_NOISY_MASK) === 0)
        addHistory(-depth, move);
    }
  }

  // mate
  
  if (numLegalMoves === 0) {
  
    if (inCheck !== 0) {
      //ttPut(TT_EXACT, depth, -MATE + node.ply, 0, node.ply, alpha, beta, ev);
      return -MATE + node.ply;
    }
  
    else {
      //ttPut(TT_EXACT, depth, 0, 0, node.ply, alpha, beta, ev);
      return 0;
    }
  
  }
  

  if (bestScore > oAlpha) {
    ttPut(TT_EXACT, depth, bestScore, bestMove, node.ply, alpha, beta, ev);
    return bestScore;
  }
  else {
    ttPut(TT_ALPHA, depth, bestScore, bestMove, node.ply, alpha, beta, ev);
    return bestScore;
  }

}

