function qsearch(ply, depth, alpha, beta) {

  g_nodes++;
  if ((g_nodes & 1023) == 0) {
    checkTime();
    if (g_finished)
      return 0;
  }

  if (ply >= MAX_PLY)
    return evaluate();

  const node = g_ss[ply]; 
  node.pvLen = 0;

  if (isDraw()) {
    return 0;
  }

  const ttix = ttGet();

  if (ttix >= 0) {
    const type = g_ttType[ttix] & TT_TYPE_MASK;
    const score = getAdjustedScore(ply, g_ttScore[ttix]);
    if (type === TT_EXACT || (type === TT_BETA && score >= beta) || (type === TT_ALPHA && score <= alpha)) {
      return score;
    }
  }

  const stm = g_stm;
  const nstm = stm ^ BLACK;
  const kix = (stm >>> 3) * 17 + 1;
  const inCheck = ttix >= 0 ? (g_ttType[ttix] & TT_INCHECK) !== 0 : isAttacked(g_pieces[kix], nstm);
  const ev = ttix >= 0 ? g_ttEval[ttix] : evaluate();
  const ttMove = ttix >= 0 && isProbablyLegal(g_ttMove[ttix]) && (inCheck || (g_ttMove[ttix] & MOVE_FLAG_NOISY)) ? g_ttMove[ttix] : 0;

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

  initSearch(node, inCheck, ttMove, inCheck ^ 1);

  while ((move = getNextMove(node))) {

    // delta pruning

    if (!inCheck && !(move & MOVE_FLAG_PROMOTE)) {
      const captured = (move & MOVE_FLAG_EPCAPTURE) ? PAWN : (g_board[move & 0x7F] & 7);
      if (ev + DELTA_VALS[captured] + 200 < alpha)
        continue;
    }

    make(node, move);
    if (isAttacked(g_pieces[kix], nstm)) {
      unmake(node, move);
      continue;
    }

    played++;

    score = -qsearch(ply + 1, depth - 1, -beta, -alpha);

    if (g_finished)
      return 0;

    unmake(node, move);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
      if (bestScore > alpha) {
        alpha = bestScore;
        if (bestScore >= beta) {
          ttPut(TT_BETA, 0, putAdjustedScore(ply, bestScore), bestMove, ev, inCheck);
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

