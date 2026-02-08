function bench() {

  const depth = 6;

  let nodes = 0;
  let start = now();
  
  for (let i=0; i < BENCHFENS.length; i++) {
        
    const fen = BENCHFENS[i];
        
    uciExecLine('ucinewgame'); // clear tt (create on first call if not already created)
    uciExecLine('position fen ' + fen);
    uciExecLine('go depth ' + depth); // g_nodes cleared here
        
    nodes += g_nodes;
        
  }
        
  const elapsed = now() - start;
  const nps = nodes/elapsed * 1000 | 0;
        
  uciSend('nodes ' + nodes + ' elapsed ' + elapsed + ' nps ' + nps);
        
}  

