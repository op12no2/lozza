function removeTTMove(node) {

  const ttMove = node.ttMove;
  const moves = node.moves;
  const n = node.numMoves;

  for (let i = 0; i < n; i++) {
    if (moves[i] == ttMove) {
      moves[i] = moves[n - 1];
      node.numMoves--;
      return;
    }
  }

  console.log('MISSING TT MOVE');
}

function getNextSortedMove(node) {

  const moves = node.moves;
  const ranks = node.ranks;
  const next = node.nextMove;
  const num = node.numMoves;
  let maxR = INT32_MIN;
  let maxI = 0;
  let maxM = 0;

  for (let i=next; i < num; i++) {
    if (ranks[i] > maxR) {
      maxR = ranks[i];
      maxI = i;
    }
  }

  maxM = moves[maxI];

  moves[maxI] = moves[next];
  ranks[maxI] = ranks[next];

  node.nextMove++;

  return maxM;

}

function rankQuiets(node) {

  const b = g_board;
  const moves = node.moves;
  const ranks = node.ranks;
  const n = node.numMoves;

  for (let i=0; i < n; i++) {

    const m = moves[i];
    const fr = (m >> 7) & 0x7F;
    const to = m & 0x7F;
    const piece = b[fr];

    ranks[i] = g_qpth[piece][to];

    if (m & MOVE_FLAG_NOISY)
      console.log('NOISY MOVE IN QUIET LIST');
  }
}

function rankNoisy(node) {

  const b = g_board;
  const moves = node.moves;
  const ranks = node.ranks;
  const n = node.numMoves;

  for (let i = 0; i < n; i++) {

    const m = moves[i];
    const fr = (m >> 7) & 0x7F;
    const to = m & 0x7F;

    if (!(m & MOVE_FLAG_NOISY))
      console.log('QUIET MOVE IN NOISY LIST');
  
    let rank = 0;

    if (m & MOVE_FLAG_PROMOTE) {
      rank = 1000000 + ((m >> PROMOTE_SHIFT) & 7) * 100000;
      if (m & MOVE_FLAG_CAPTURE)
        rank += (b[to] & 7) * 100 - (b[fr] & 7);
    }
    else if (m & MOVE_FLAG_EPCAPTURE) {
      rank = PAWN * 100 - PAWN;
    }
    else {
      rank = (b[to] & 7) * 100 - (b[fr] & 7);
    }

    ranks[i] = rank;
  }
}

function initSearch(node, inCheck, ttMove, noisyOnly) {

  node.stage = 0;
  node.inCheck = inCheck;
  node.ttMove = ttMove;
  node.noisyOnly = noisyOnly;

}

function getNextMove(node) {

  switch (node.stage) {

    case 0: {

      node.stage++;

      if (node.ttMove) {
        return node.ttMove;
      }

    }

    case 1: {

      node.stage++;
      node.nextMove = 0;
      node.numMoves = 0;
      genNoisy(node);
      if (node.ttMove && (node.ttMove & MOVE_FLAG_NOISY))
        removeTTMove(node);
      rankNoisy(node);

    }

    case 2: {

      if (node.nextMove < node.numMoves) {
        return getNextSortedMove(node);
      }

      if (node.noisyOnly)
        return 0;

      node.stage++;

    }

    case 3: {

      node.stage++;
      node.nextMove = 0;
      node.numMoves = 0;
      genQuiets(node);
      if (g_rights && !node.inCheck)
        genCastling(node);
      if (node.ttMove && !(node.ttMove & MOVE_FLAG_NOISY))
        removeTTMove(node);
      rankQuiets(node);

    }

    case 4: {

      if (node.nextMove < node.numMoves) {
        return getNextSortedMove(node);
      }

      return 0;

    }

    default:
      return 0;

  }
}

