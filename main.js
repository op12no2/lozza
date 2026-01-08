
nodeInitOnce();
evalInitOnce();

if (typeof module !== 'undefined') {
  module.exports = { perft, position, nodes, genMoves, makeMove, posSet };
}

if (typeof require === 'undefined' || require.main === module) {
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
