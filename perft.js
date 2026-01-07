function perft (depth, ply) {

  if (depth === 0)
    return 1;

  const node = nodes[ply];
  const nextNode = nodes[ply+1];
  const pos = node.pos;
  const nextPos = nextNode.pos;

  let tot = 0;

  genMoves(node);

  for (let i=0; i < node.numMoves; i++) {
    const move = node.moves[i];
    posSet(nextPos, pos);
    makeMove(move, nextPos);
    if (isAttacked(nextPos, nextPos.kings[pos.stm >> 3], nextPos.stm))
      continue;
    tot += perft(depth-1, ply+1);
  }

  return tot;

}