function go() {

  clearQpth();

  let alpha = 0;
  let beta = 0;
  let score = 0;
  let delta = 0;
  let depth = 0;
  let bm = 0; // best move from last completed iteration

  for (let d=1; d <= g_maxDepth; d++) {
    
    alpha = -INF;
    beta  = INF;
    delta = 10;
    depth = d;
    
    if (depth >= 4) {
      alpha = Math.max(-INF, score - delta);
      beta  = Math.min(INF,  score + delta);
    }
    
    while (1) {
      
      score = search(0, depth, alpha, beta);
      
      if (g_finished)
        break;
      
      delta += delta/2 | 0;
      
      if (score <= alpha) {
        alpha = Math.max(-INF, alpha - delta);
      }
      
      else if (score >= beta) {
        beta = Math.min(INF, beta + delta);
      }
      
      else {
        bm = rootNode.pv[rootNode.pvLen-1];
        report(score, depth);
        break;
      }

    }

    if (g_finished)
      break;
    
  }

  if (!bm)
    console.log('NO BEST MOVE');

  uciSend('bestmove ' + formatMove(bm));

}

function newGame () {
  ttClear();  
}

