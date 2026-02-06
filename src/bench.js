function bench() {

  const depth = 1;

  let nodes = 0;
  let start = performance.now();
  
  for (let i=0; i < BENCHFENS.length; i++) {
        
    const fen = BENCHFENS[i];
        
    uciExecLine('position fen ' + fen);
    uciExecLine('go depth ' + depth);
        
    nodes += g_nodes;
        
  }
        
  const elapsed = (performance.now() - start) | 0;
  const nps = nodes/elapsed * 1000 | 0;
        
  uciSend('nodes ' + nodes + ' elapsed ' + elapsed + ' nps ' + nps);
        
}  
