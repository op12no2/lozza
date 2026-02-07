function qsearch(ply, depth, alpha, beta) {

  g_nodes++;
  if ((g_nodes & 1023) == 0) {
    checkTime();
    if (g_finished)
      return 0;
  }

  if (ply >= MAX_PLY)
    return evaluate();

  // hack check for mat draw here

  const ttix = ttGet();

  if (ttix >= 0) {
    const type = ttType[ttix] & TT_TYPE_MASK;
    const score = getAdjustedScore(ply, ttScore[ttix]);
    if (type === TT_EXACT || (type === TT_BETA && score >= beta) || (type === TT_ALPHA && score <= alpha)) {
      return score;
    }
  }

  const node = g_ss[ply];
  const stm = g_stm;
  const nstm = stm ^ BLACK;
  const kix = (stm >>> 3) * 17 + 1;
  const realInCheck = ttix >= 0 ? (ttType[ttix] & TT_INCHECK) !== 0 : isAttacked(g_pieces[kix], nstm);
  const inCheck = depth > -10 ? realInCheck : 0; // safety net
  const ev = ttix >= 0 ? ttEval[ttix] : evaluate();
  const ttMov = ttix >= 0 ? ttMove[ttix] : 0;

  let bestScore = -INF;

  if (!inCheck) {
    bestScore = ev;
    if (ev >= beta)
      return ev;
    if (ev > alpha)
      alpha = ev;
  }

  let move = 0;
  let played = 0;
  let bestMove = 0;
  let score = 0;
  let origAlpha = alpha;

  initNextSearchMove(node, inCheck, ttMov, !inCheck);

  while ((move = getNextSearchMove(node))) {

    make(node, move);
    //checkHash();
    if (isAttacked(g_pieces[kix], nstm)) {
      unmake(node, move);
      //checkHash();
      continue;
    }

    played++;

    score = -qsearch(ply + 1, depth - 1, -beta, -alpha);

    if (g_finished)
      return 0;

    unmake(node, move);
    //checkHash();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
      if (bestScore > alpha) {
        alpha = bestScore;
        if (bestScore >= beta) {
          ttPut(TT_BETA, 0, putAdjustedScore(ply, bestScore), bestMove, ev, realInCheck);
          return bestScore;
        }
      }
    }
  }

  if (inCheck && played === 0) {
    return -MATE + ply;
  }

  //ttPut(alpha > origAlpha ? TT_EXACT : TT_ALPHA, 0, putAdjustedScore(ply, bestScore), bestMove, ev);

  return bestScore;

}

