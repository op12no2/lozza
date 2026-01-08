
const MATE = 10000;

function search(depth, ply, alpha, beta) {

  if (depth <= 0)
    return qsearch(ply, alpha, beta);
  
  timeControl.nodes++;
  
  const node = nodes[ply];
  const nextNode = nodes[ply + 1];
  const pos = node.pos;
  const nextPos = nextNode.pos;
  const stmi = pos.stm >> 3;
  const nstm = pos.stm ^ BLACK;
  const inCheck = isAttacked(pos, pos.kings[stmi], nstm);

  genMoves(node);

  let bestScore = -Infinity;
  let bestMove = 0;

  let numMoves = 0;

  for (let i = 0; i < node.numMoves; i++) {

    const move = node.moves[i];

    posSet(nextPos, pos);
    makeMove(move, nextPos);

    if (isAttacked(nextPos, nextPos.kings[stmi], nstm))
      continue;

    numMoves++;

    const score = -search(depth - 1, ply + 1, -beta, -alpha);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    
    if (bestScore > alpha) {
      if (ply === 0) {
        timeControl.bestMove = bestMove;
      }
      alpha = bestScore;
    }

    if (alpha >= beta) {
      return bestScore;
    }
  }

  if (numMoves === 0)
    return inCheck ? -MATE + ply : 0;

  return bestScore;

}
