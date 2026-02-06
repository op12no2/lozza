function search(ply, depth, alpha, beta) {

  if (depth <= 0)
    return evaluate();

  const node = g_ss[ply];
  const stm = g_stm;
  const nstm = stm ^ BLACK;
  const stmBase = (stm >>> 3) * 17;

  genMoves(node);

  const moves = node.moves;
  const numMoves = node.numMoves;
  let legalMoves = 0;
  let bestMove = 0;

  for (let i = 0; i < numMoves; i++) {

    const move = moves[i];

    make(node, move);

    const kingSq = g_pieces[stmBase + 1];

    if (isAttacked(kingSq, nstm)) {
      unmake(node, move);
      continue;
    }

    legalMoves++;

    let score;

    if (legalMoves === 1) {
      score = -search(ply + 1, depth - 1, -beta, -alpha);
    }
    else {
      score = -search(ply + 1, depth - 1, -alpha - 1, -alpha);
      if (score > alpha && score < beta)
        score = -search(ply + 1, depth - 1, -beta, -alpha);
    }

    unmake(node, move);

    if (score > alpha) {
      alpha = score;
      bestMove = move;
      if (alpha >= beta)
        return alpha;
    }
  }

  if (legalMoves === 0) {
    const kingSq = g_pieces[stmBase + 1];
    if (isAttacked(kingSq, nstm))
      return -MATE + ply;
    return 0;
  }

  return alpha;
}
