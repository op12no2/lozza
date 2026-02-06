function qsearch(ply, depth, alpha, beta) {

  g_nodes++;
  if ((g_nodes & 1023) == 0) {
    checkTime();
    if (g_finished)
      return 0;
  }

  const node = g_ss[ply];
  const stm = g_stm;
  const nstm = stm ^ BLACK;
  const moves = node.moves;
  const kix = (stm >>> 3) * 17 + 1;
  const inCheck = isAttacked(g_pieces[kix], nstm);
  const ev = evaluate();

  let played = 0;
  let bestMove = 0;
  let bestScore = -INF;
  let score = 0;
  
  if (!inCheck) {
    if (ev >= beta)
      return ev;
    if (ev >= alpha)
      alpha = ev;
  }

  const numMoves = genMoves(node);
  
  for (let i = 0; i < numMoves; i++) {

    const move = moves[i];

    if (!inCheck && !(move & MOVE_FLAG_NOISY)) {
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
          return bestScore;
        }  
      }
    }
  }

  if (inCheck && played === 0) {
    return -MATE + ply;
  }

  return bestScore;

}
