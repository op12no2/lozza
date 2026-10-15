// go
//
// When canYield is set (commands from stdin/onmessage), go yields to the
// host after each rootSearch so stop/isready/quit can be picked up from
// the command queue. When not set (bench etc.) there are no awaits so go
// runs synchronously as before.
//

async function go (maxPly, canYield) {

  // MultiPV: each iteration searches the root once per line, excluding the
  // moves of the lines already found in that iteration; each line has its
  // own aspiration window based on its score from the previous iteration

  const numLines = multiPV > 1 ? Math.max(1, Math.min(multiPV, legalMoves().length)) : 1;

  let bestMoveStr = '';
  let alpha       = 0;
  let beta        = 0;
  let score       = 0;
  let delta       = 0;
  let depth       = 0;
  let iterDepth   = 0;  // reported depth; depth itself may be reduced after a fail high
  let iterLines   = []; // lines found so far in the current iteration

  multiPVLines    = []; // lines from the last complete iteration
  multiPVExcluded = [];

  for (let ply=1; ply <= maxPly; ply++) {
    // id

    iterLines = [];
    multiPVExcluded = [];

    for (let pvIdx=0; pvIdx < numLines; pvIdx++) {
      // multipv line

      alpha = -INF;
      beta  = INF;
      delta = 10;
      depth = ply;
      iterDepth = ply;

      if (numLines > 1 && pvIdx < multiPVLines.length)
        score = multiPVLines[pvIdx].score;

      if (ply >= 4) {
        alpha = Math.max(-INF, score - delta);
        beta  = Math.min(INF,  score + delta);
      }

      while (1) {
        // asp

        score = rootSearch(rootNode, depth, bdTurn, alpha, beta);

        if (statsTimeOut)
          break;

        delta += delta/2 | 0;

        if (score <= alpha) {
          // upper bound

          beta  = Math.min(INF, ((alpha + beta) / 2) | 0);
          alpha = Math.max(-INF, alpha - delta);

          if (numLines === 1)
            report(uciScore(score) + ' upperbound', iterDepth);

          if (!statsMaxNodes && pvIdx === 0)
            statsBestMove = 0;

        }

        else if (score >= beta) {
          // lower bound

          beta = Math.min(INF, beta + delta);

          if (numLines === 1)
            report(uciScore(score) + ' lowerbound', iterDepth);

          depth = Math.max(1, depth-1);

        }

        else {
          // exact

          iterLines.push({
            depth: iterDepth,
            move:  statsBestMove,
            score: score,
            pv:    rootNode.pv.slice(0, rootNode.pvLen),
            pvLen: rootNode.pvLen
          });

          multiPVExcluded.push(statsBestMove);

          if (numLines === 1)
            reportScore(score, iterDepth);

          if (statsBestMove && statsMaxNodes > 0 && statsNodes >= statsMaxNodes)
            statsTimeOut = 1;

          break;

        }

        if (canYield && await checkStop())
          break;

      }

      if (statsTimeOut)
        break;

      if (canYield && await checkStop())
        break;

    }

    // a complete iteration replaces the previous lines; keep them best first
    // (search instability can leave a later line scoring higher)

    if (iterLines.length === numLines) {

      iterLines.sort((a, b) => b.score - a.score);

      multiPVLines = iterLines;

      if (numLines > 1) {
        statsBestMove  = multiPVLines[0].move;
        statsBestScore = multiPVLines[0].score;
        reportMultiPV(multiPVLines);
      }

    }

    if (statsTimeOut)
      break;

    if (canYield && await checkStop())
      break;

  }

  // a move that became best in an iteration that then ran out of time has not
  // been reported yet; report it so that the last pv starts with the bestmove

  const pvMove = rootNode.pvLen > 0 ? rootNode.pv[rootNode.pvLen-1] : 0;

  if (numLines === 1 && statsBestMove !== 0 && statsBestMove !== reportedMove && pvMove === statsBestMove)
    reportScore(statsBestScore, iterDepth);

  // after a fail low statsBestMove is 0, so fall back to the last exact
  // result; with MultiPV, an unfinished iteration's first line is deeper than
  // the last complete one, otherwise statsBestMove may be from a later line

  let bestMove = statsBestMove || (multiPVLines.length ? multiPVLines[0].move : 0);

  // with MultiPV, an unfinished iteration's lines are deeper than the last
  // complete ones; report them, topped up with the previous iteration's lines
  // for moves not searched yet (as Stockfish does), and play the first

  if (numLines > 1) {

    if (iterLines.length > 0 && iterLines.length < numLines) {

      iterLines.sort((a, b) => b.score - a.score);

      const lines = iterLines.concat(multiPVLines.filter(l => !iterLines.some(m => m.move === l.move))).slice(0, numLines);

      reportMultiPV(lines);

      bestMove = lines[0].move;

    }

    else if (multiPVLines.length) {

      bestMove = multiPVLines[0].move;

    }

  }

  // no legal moves: report mate or stalemate before bestmove 0000 so a GUI can
  // tell them apart (lifted from Stockfish)

  if (bestMove === 0 && legalMoves().length === 0) {

    if (isKingAttacked(bdTurn ^ COLOR_MASK))
      uciSend('info depth 0 score mate 0');
    else
      uciSend('info depth 0 score cp 0');

  }

  bestMoveStr = formatMove(bestMove);

  uciSend('bestmove', bestMoveStr);

}
