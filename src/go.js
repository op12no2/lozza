// go
//
// When canYield is set (commands from stdin/onmessage), go yields to the
// host after each rootSearch so stop/isready/quit can be picked up from
// the command queue. When not set (bench etc.) there are no awaits so go
// runs synchronously as before.
//

async function go (maxPly, canYield) {

  let bestMoveStr = '';
  let alpha       = 0;
  let beta        = 0;
  let score       = 0;
  let delta       = 0;
  let depth       = 0;

  multiPVMoves = [];

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
        
        report('upperbound', score, depth);
        
        if (!statsMaxNodes)
          statsBestMove = 0;
        
      }
      
      else if (score >= beta) {
        // lower bound
        
        beta = Math.min(INF, beta + delta);
        
        report('lowerbound', score, depth);
        
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

        if (multiPV > 1) {

          reportMultiPV(depth);

        }

        else {

          reportScore(score, depth);

        }

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

  // a move that became best in an iteration that then ran out of time has not
  // been reported yet; report it so that the last pv starts with the bestmove

  const pvMove = rootNode.pvLen > 0 ? rootNode.pv[rootNode.pvLen-1] : 0;

  if (multiPV === 1 && statsBestMove !== 0 && statsBestMove !== reportedMove && pvMove === statsBestMove)
    reportScore(statsBestScore, depth);

  // after a fail low statsBestMove is 0, so fall back to the last exact result

  const bestMove = statsBestMove || (multiPVMoves.length ? multiPVMoves[0].move : 0);

  bestMoveStr = formatMove(bestMove);

  uciSend('bestmove', bestMoveStr);

}
