function qsearch(ply, alpha, beta) {

  timeControl.nodes++;
  
  const node = nodes[ply];
  const pos = node.pos;

  const standPat = evaluate(node);

  if (standPat >= beta)
    return standPat;

  if (standPat > alpha)
    alpha = standPat;

  const nextNode = nodes[ply + 1];
  const nextPos = nextNode.pos;
  const stmi = pos.stm >> 3;

  genMoves(node);

  for (let i = 0; i < node.numMoves; i++) {

    const move = node.moves[i];

    if (!(move & MOVE_QS_MASK))
      continue;

    posSet(nextPos, pos);
    makeMove(move, nextPos);

    if (isAttacked(nextPos, nextPos.kings[stmi], nextPos.stm))
      continue;

    const score = -qsearch(ply + 1, -beta, -alpha);

    if (score >= beta)
      return score;

    if (score > alpha)
      alpha = score;
  }

  return alpha;

}
