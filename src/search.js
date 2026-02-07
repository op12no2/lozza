function search(ply, depth, alpha, beta) {

  if (depth <= 0)
    return qsearch(ply, 0, alpha, beta);

  g_nodes++;
  if ((g_nodes & 1023) == 0) {
    checkTime();
    if (g_finished)
      return 0;
  }

  if (ply >= MAX_PLY)
    return evaluate();

  // hack check for draws here

  const isPV = beta !== (alpha + 1);
  const ttix = ttGet();
  
  if (!isPV && ttix >= 0 && ttDepth[ttix] >= depth) {
    const type = ttType[ttix] & TT_TYPE_MASK;
    const score = getAdjustedScore(ply, ttScore[ttix]);
    if (type === TT_EXACT || (type === TT_BETA && score >= beta) || (type === TT_ALPHA && score <= alpha)) {
      return score;
    }
  }

  const node = g_ss[ply];
  const stm = g_stm;
  const nstm = stm ^ BLACK;
  const isRoot = ply === 0;
  const kix = (stm >>> 3) * 17 + 1;
  const origAlpha = alpha;
  const inCheck = ttix >= 0 ? (ttType[ttix] & TT_INCHECK) !== 0 : isAttacked(g_pieces[kix], nstm);
  const ev = ttix >= 0 ? ttEval[ttix] : evaluate();
  const ttMov = ttix >= 0 ? ttMove[ttix] : 0; // check for legalityish

  let move = 0;
  let played = 0;
  let bestMove = 0;
  let bestScore = -INF;
  let score = 0;
  let reductions = 0; // hack for use with lmr
  let extensions = 0; // ditto
  
  initNextSearchMove(node, inCheck, ttMov);

  while ((move = getNextSearchMove(node))) {

    make(node, move);
    //checkHash();
    if (isAttacked(g_pieces[kix], nstm)) {
      unmake(node, move);
      //checkHash();
      continue;
    }

    played++;

    if (isPV) {
      if (played === 1) {
        score = -search(ply + 1, depth - 1, -beta, -alpha);
      }
      else {
        score = -search(ply + 1, depth - 1, -alpha - 1, -alpha);
        if (!g_finished && score > alpha)
          score = -search(ply + 1, depth - 1, -beta, -alpha);
      }  
    }
    else {
      score = -search(ply + 1, depth - 1, -beta, -alpha);
    }

    if (g_finished)
      return 0;

    unmake(node, move);
    //checkHash();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
      if (isRoot) {
        g_bestMove = bestMove;
      }  
      if (bestScore > alpha) {
        alpha = bestScore;
        if (bestScore >= beta) {
          ttPut(TT_BETA, depth, putAdjustedScore(ply, bestScore), bestMove, ev, inCheck);
          return bestScore;
        }  
      }
    }
  }

  if (played === 0) {
    if (inCheck)
      return -MATE + ply;
    else
      return 0;
  }

  ttPut(alpha > origAlpha ? TT_EXACT : TT_ALPHA, depth, putAdjustedScore(ply, bestScore), bestMove, ev, inCheck);

  return bestScore;

}

