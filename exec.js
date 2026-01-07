function execString (cmd) {
  const tokens = cmd.trim().split(/\s+/).filter(t => t.length > 0);
  if (tokens.length > 0) {
    execTokens(tokens);
  }
}

function execTokens(tokens) {
  switch (tokens[0]) {
    case 'uci':
      uci.write('id name Lozza 9');
      uci.write('id author Colin Jenkins');
      uci.write('uciok');
      break;
  }
}