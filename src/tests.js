function bench () { 
        
  let nodes = 0;
  let start = now();
        
  for (let i=0; i < BENCHFENS.length; i++) {
        
    const fen = BENCHFENS[i];
        
    if (nodeHost)
      process.stdout.write(i.toString() + '\r');
        
    newGame();
    uciExec('position fen ' + fen);
    uciExec('go depth ' + 8);
        
    nodes += statsNodes;
      
  }
        
  const elapsed = now() - start;
  const nps = nodes/elapsed * 1000 | 0;
        
  uciSend('nodes', nodes, 'time', elapsed, 'nps', nps);

}

function perftTests (maxDepth) {

  const t1 = now();
  let errors = 0;
  let tot    = 0;
        
  for (let i=0; i < PERFTFENS.length; i++) {
        
    const p = PERFTFENS[i];
        
    const fen   = p[0];
    const depth = p[1];
    const moves = p[2];
    const id    = p[3];
        
    if (maxDepth && depth > maxDepth)
      continue;

    newGame();
    uciExec('position ' + fen);
        
    const nodes = perft(rootNode, depth, bdTurn);
        
    tot += nodes;
        
    const t2     = now();
    const sec    = Math.round((t2-t1)/100)/10;
    const secStr = sec.toString().padStart(6, ' ');
        
    let diff = nodes - moves;
        
    if (diff) {
      errors += Math.abs(diff);
      diff = '\x1b[1m' + diff + '\x1b[0m';
    }
        
    uciSend(secStr, id, fen, depth, diff, nodes, moves);
  }
          
  const elapsed = now() - t1;
  const nps = tot/elapsed * 1000 | 0;
        
  uciSend('errors', errors, 'nodes', tot, 'nps', nps);
        
}

function evalTests () {
        
  for (let i=0; i < BENCHFENS.length; i++) {
        
    uciSend();
        
    const fen = BENCHFENS[i];
        
    newGame();
    uciExec('position fen ' + fen);
    uciSend(fen, 'fen')
    uciExec('e');
        
    const flippedFen = flipFen(fen);
        
    newGame();
    uciExec('position fen ' + flippedFen);
    uciSend(flippedFen, 'flipped fen')
    uciExec('e');
        
  }

}

