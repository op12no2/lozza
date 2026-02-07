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

  const isPV = beta !== (alpha + 1);
  const ttix = ttGet();
  
  if (!isPV && ttix >= 0 && ttDepth[ttix] >= depth) {
    const type = ttType[ttix];
    const score = getAdjustedScore(ply, ttScore[ttix]);
    if (type === TT_EXACT || (type === TT_BETA && score >= beta) || (type === TT_ALPHA && score <= alpha)) {
      return score;
    }
  }

  const node = g_ss[ply];
  const stm = g_stm;
  const nstm = stm ^ BLACK;
  const isRoot = ply === 0;
  const moves = node.moves;
  const kix = (stm >>> 3) * 17 + 1;
  const inCheck = isAttacked(g_pieces[kix], nstm);
  const origAlpha = alpha;
  const ev = ttix >= 0 ? ttEval[ttix] : evaluate();

  let played = 0;
  let bestMove = 0;
  let bestScore = -INF;
  let score = 0;
  let reductions = 0;
  let extensions = 0;
  
  const numMoves = genMoves(node);
  
  for (let i = 0; i < numMoves; i++) {

    const move = moves[i];

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
          ttPut(TT_BETA, depth, putAdjustedScore(ply, bestScore), bestMove, ev);
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

  ttPut(alpha > origAlpha ? TT_EXACT : TT_ALPHA, depth, putAdjustedScore(ply, bestScore), bestMove, ev);

  return bestScore;

}

