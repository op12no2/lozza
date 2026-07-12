async function go (maxPly) {

  let bestMoveStr = '';
  let alpha       = 0;
  let beta        = 0;
  let score       = 0;
  let delta       = 0;
  let depth       = 0;
  let reported    = 0;

  multiPVMoves = [];

  while (statsSearching)
    await new Promise(resolve => setTimeout(resolve, 0));

  statsTimeOut   = 0;
  statsStop      = 0;
  statsSearching = 1;

  for (let ply=1; ply <= maxPly; ply++) {
    // id
    
    alpha = -INF;
    beta  = INF;
    delta = 10;
    depth = ply;
    
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

        report(score, depth, 'upperbound');
        reported = 1;

        if (!statsMaxNodes)
          statsBestMove = 0;

      }

      else if (score >= beta) {
        // lower bound

        beta = Math.min(INF, beta + delta);

        report(score, depth, 'lowerbound');
        reported = 1;

        depth = Math.max(1, depth-1);

      }

      else {
        // exact

        // track for MultiPV

        if (statsBestMove) {
          multiPVMoves = multiPVMoves.filter(m => m.move !== statsBestMove);
          multiPVMoves.unshift({
            move:  statsBestMove,
            score: score,
            pv:    rootNode.pv.slice(0, rootNode.pvLen),
            pvLen: rootNode.pvLen
          });
        }


        if (multiPV > 1)
          reportMultiPV(depth);
        else
          report(score, depth, '');

        reported = 1;

        if (statsBestMove && statsMaxNodes > 0 && statsNodes >= statsMaxNodes)
          statsTimeOut = 1;

        break;

      }

      await new Promise(resolve => setTimeout(resolve, 0));

      if (statsStop) {
        statsTimeOut = 1;
        break;
      }

    }

    if (statsTimeOut)
      break;

    await new Promise(resolve => setTimeout(resolve, 0));

    if (statsStop) {
      statsTimeOut = 1;
      break;
    }

  }

  if (reported === 0)
    report(statsBestScore, depth || 1, '');

  bestMoveStr = formatMove(statsBestMove);

  statsSearching = 0;

  uciSend('bestmove', bestMoveStr);

}

function newGame() {

  if (ttSize == 1)
    ttResize(ttDefault);

  ttInit();

}

