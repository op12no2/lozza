const g_lmr = Array(MAX_PLY);

function initLMR() {
  for (let d = 0; d < MAX_PLY; d++) {
    g_lmr[d] = Array(MAX_MOVES);
    for (let m = 0; m < MAX_MOVES; m++) {
      g_lmr[d][m] = Math.floor(0.75 + Math.log(d) * Math.log(m) / 2.25);
     }
  }
}

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

  const node = g_ss[ply]; 
  const cNode = ply <= MAX_PLY - 2 ? g_ss[ply + 1] : 0;
  
  node.pvLen = 0;
  
  // mate distance pruning

  const matingScore = MATE - ply;
  if (matingScore < beta) {
    beta = matingScore;
    if (alpha >= matingScore)
      return matingScore;
  }
  const matedScore = -MATE + ply;
  if (matedScore > alpha) {
    alpha = matedScore;
    if (beta <= matedScore)
      return matedScore;
  }

  const isRoot = ply === 0;

  if (!isRoot && isDraw()) {
    return 0;
  }

  const isPV = beta !== (alpha + 1);
  const ttix = ttGet();
  
  if (!isPV && ttix >= 0 && g_ttDepth[ttix] >= depth) {
    const type = g_ttType[ttix] & TT_TYPE_MASK;
    const score = getAdjustedScore(ply, g_ttScore[ttix]);
    if (type === TT_EXACT || (type === TT_BETA && score >= beta) || (type === TT_ALPHA && score <= alpha)) {
      return score;
    }
  }

  const stm = g_stm;
  const nstm = stm ^ BLACK;
  const kix = (stm >>> 3) * 17 + 1;
  const origAlpha = alpha;
  const inCheck = ttix >= 0 ? (g_ttType[ttix] & TT_INCHECK) !== 0 : isAttacked(g_pieces[kix], nstm);
  const ev = ttix >= 0 ? g_ttEval[ttix] : evaluate();
  const ttMove = ttix >= 0 && isProbablyLegal(g_ttMove[ttix]) ? g_ttMove[ttix] : 0;
  const playedMoves = node.playedMoves;

  // https://www.talkchess.com/forum3/viewtopic.php?f=7&t=74769
  if (depth > 5 && isPV && !ttMove)
    depth--;

  let move = 0;
  let played = 0;
  let bestMove = 0;
  let bestScore = -INF;
  let score = 0;
  
  if (!isPV && !inCheck && beta < MATEISH && depth <= 8 && (ev - depth * 100) >= beta)
    return ev;

  initSearch(node, inCheck, ttMove, 0);

  while ((move = getNextMove(node))) {

    const noisy = move & MOVE_FLAG_NOISY;

    // late move pruning
    if (depth > 1 && !inCheck && !noisy && alpha > -MATEISH && played > depth * depth * depth)
      continue;

    // futility pruning
    if (played && !inCheck && depth <= 1 && !noisy && alpha > -MATEISH && ev + 100 < alpha)
      continue;

    make(node, move);
    if (isAttacked(g_pieces[kix], nstm)) {
      unmake(node, move);
      continue;
    }

    playedMoves[played++] = move;

    // late move reductions 
    let R = 0;
    if (depth >= 3 && played > 3) {
      R = g_lmr[depth][played];
      R -= inCheck;
      if (isPV)
        R -= 1;
      if (R > depth - 2)
        R = depth - 2;
    }

    if (isPV) {
      if (played === 1) {
        score = -search(ply + 1, depth - 1, -beta, -alpha);
      }
      else {
        score = -search(ply + 1, depth - 1 - R, -alpha - 1, -alpha);
        if (!g_finished && score > alpha)
          score = -search(ply + 1, depth - 1, -beta, -alpha);
      }  
    }
    else {
      score = -search(ply + 1, depth - 1 - R, -beta, -alpha);
      if (!g_finished && score > alpha)
        score = -search(ply + 1, depth - 1, -beta, -alpha);
    }

    if (g_finished)
      return 0;

    unmake(node, move);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
      if (bestScore > alpha) {
        alpha = bestScore;
        if (isPV) {
          collectPV(node, cNode, bestMove);
        }  
        if (bestScore >= beta) {
          if (!(bestMove & MOVE_FLAG_NOISY)) {
            const bonus = depth * depth;
            updateQpth(bestMove, bonus);
            for (let i = 0; i < played - 1; i++) {
              const pm = playedMoves[i];
              if (!(pm & MOVE_FLAG_NOISY)) {
                updateQpth(playedMoves[i], -bonus);
              }  
            }  
          }  
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

