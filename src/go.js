function report (units, value, depth) {

  let pvStr = 'pv';
  for (let i=rootNode.pvLen-1; i >= 0; i--)
    pvStr += ' ' + formatMove(rootNode.pv[i]);

  const tim     = now() - statsStartTime;
  const nps     = (statsNodes * 1000) / tim | 0;
  const nodeStr = 'nodes ' + statsNodes + ' time ' + tim + ' nps ' + nps;

  const depthStr = 'depth ' + depth + ' seldepth ' + statsSelDepth;
  const scoreStr = 'score ' + units + ' ' + value;
  const hashStr  = 'hashfull ' + (1000 * ttHashUsed / ttSize | 0);

  uciSend('info', depthStr, scoreStr, nodeStr, hashStr, pvStr);

}

function reportMultiPV (depth) {

  const tim     = now() - statsStartTime;
  const nps     = (statsNodes * 1000) / tim | 0;
  const nodeStr = 'nodes ' + statsNodes + ' time ' + tim + ' nps ' + nps;

  const depthStr = 'depth ' + depth + ' seldepth ' + statsSelDepth;
  const hashStr  = 'hashfull ' + (1000 * ttHashUsed / ttSize | 0);

  const n = Math.min(multiPV, multiPVMoves.length);

  for (let i = 0; i < n; i++) {

    const entry = multiPVMoves[i];

    let pvStr = 'pv';
    for (let j = entry.pvLen - 1; j >= 0; j--)
      pvStr += ' ' + formatMove(entry.pv[j]);

    let scoreStr;
    if (Math.abs(entry.score) > MINMATE) {
      let mateScore = (MATE - Math.abs(entry.score)) / 2 | 0;
      if (entry.score < 0)
        mateScore = -mateScore;
      scoreStr = 'score mate ' + mateScore;
    }
    else {
      scoreStr = 'score cp ' + entry.score;
    }

    uciSend('info', depthStr, 'multipv', (i + 1), scoreStr, nodeStr, hashStr, pvStr);
  }
}

function go (maxPly) {

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

        else if (Math.abs(score) > MINMATE) {

          let mateScore = (MATE - Math.abs(score)) / 2 | 0;
          if (score < 0)
            mateScore = -mateScore;

          report('mate', mateScore, depth);

        }

        else {

          report('cp', score, depth);

        }

        if (statsBestMove && statsMaxNodes > 0 && statsNodes >= statsMaxNodes)
          statsTimeOut = 1;

        break;

      }
      
    }
    
    if (statsTimeOut)
      break;
    
  }

  bestMoveStr = formatMove(statsBestMove);

  uciSend('bestmove', bestMoveStr);

}

function newGame() {

  if (ttSize == 1)
    ttResize(ttDefault);

  ttInit();

}

