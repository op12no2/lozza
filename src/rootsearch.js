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
