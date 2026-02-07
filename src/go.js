function go() {

  clearQpth();
  
  let alpha = 0;
  let beta = 0;
  let score = 0;
  let delta = 0;
  let depth = 0;

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
        uciSend(depth); // hack extend to pv
        break;
      }
      
    }
    
    if (g_finished)
      break;
    
  }

  uciSend('bestmove ' + formatMove(g_bestMove));

}

function newGame () {
  ttClear();  
}

