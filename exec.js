function execString (cmd) {
  const tokens = cmd.trim().split(/\s+/).filter(t => t.length > 0);
  if (tokens.length > 0) {
    execTokens(tokens);
  }
}

function execTokens(tokens) {
  switch (tokens[0]) {
    case 'uci':
      uciWrite('id name Lozza 9');
      uciWrite('id author Colin Jenkins');
      uciWrite('uciok');
      break;
    case 'position':
    case 'p':
      if (tokens[1] === 'startpos' || tokens[1] === 's') {
        position(nodes[0].pos, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      }
      else if (tokens[1] === 'fen' || tokens[1] === 'f') {
        const fen = tokens.slice(2).join(' ');  // hack re moves
        position(nodes[0].pos, fen);
      }
      break;
    case 'board':
    case 'b':
      posPrintBoard(nodes[0].pos);
      break;
    case 'perft':
    case 'f':  
      const depth = parseInt(tokens[1]);
      const t1 = performance.now();
      const n = perft(depth, 0);
      let elapsed = performance.now() - t1;
      const nps = (n/elapsed * 1000) | 0;
      elapsed |= elapsed;
      uciWrite(`nodes ${n} elapsed ${elapsed} nps ${nps}`);
      break;  
  }
}