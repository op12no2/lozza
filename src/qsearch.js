// qsearch

function qSearch (node, depth, turn, alpha, beta) {

  // check depth
  
  node.pvLen = 0;
  
  if (node.ply > statsSelDepth)
    statsSelDepth = node.ply;
  
  if (node.childNode === null)
    return evaluate(turn);
  

  const nextTurn = turn ^ COLOR_MASK;

  if (isDraw() !== 0)
    return 0;

  let score = ttGet(node, 0, alpha, beta);  // sets/clears node.hashMove and node.hashEval

  if (score !== TTSCORE_UNKNOWN)
    return score;

  const ev = node.hashEval !== INF ? node.hashEval : evaluate(turn);

  if (ev >= beta)
    return ev;
  if (ev >= alpha)
    alpha = ev;

  node.inCheck = 0;  // but not used

  ttUpdateEval(ev);
  cache(node);
  genQMoves(node, turn);

  statsNodes++;

  let numLegalMoves = 0;
  let move          = 0;

  while ((move = getNextMove(node)) !== 0) {

    // prune?
    
    if ((wCount + bCount) > 6 && (move & MOVE_SPECIAL_MASK) === 0 && ev + 200 + MATERIAL[((move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS) & PIECE_MASK] < alpha)
      continue;
    
    if (quickSee(turn, move) < 0)
      continue;
    

    makeMoveA(node, move);

    // legal?
    
    if (isKingAttacked(nextTurn) !== 0) {
    
      unmakeMove(node, move);
    
      uncacheA(node);
    
      continue;
    
    }
    

    makeMoveB();

    numLegalMoves++;

    score = -qSearch(node.childNode, depth-1, nextTurn, -beta, -alpha);

    // unmake move
    
    unmakeMove(node, move);
    
    uncacheA(node);
    uncacheB(node);
    

    if (score > alpha) {
      if (score >= beta) {
        ttPut(TT_BETA, 0, beta, 0, node.ply, alpha, beta, ev);
        return score;
      }
      alpha = score;
    }
  }

  ttPut(TT_ALPHA, 0, alpha, 0, node.ply, alpha, beta, ev);

  return alpha;

}
