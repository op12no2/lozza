nodeInitOnce();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { perft, position, nodes, genMoves, makeMove, posSet };
}
else {
  uciRead(function(data) {
    const cmd = data.trim().toLowerCase();
    if (cmd === 'quit' || cmd === 'q') {
      uciQuit();
    }
    else {
      execString(data);
    }
  });
}
