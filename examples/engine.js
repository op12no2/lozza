//
// engine.js - a small promise wrapper around Lozza running in a Web Worker.
//
//   const engine = lozzaEngine('lozza_net256.js');
//
//   const result = await engine.bestMove('position startpos moves e2e4', {movetime: 500});
//   console.log(result.move, result.score, result.depth, result.pv);
//
//   const moves = await engine.legalMoves('position startpos');   // ['a2a3', 'a2a4', ...]
//   const fen   = await engine.fen('position startpos moves e2e4');
//
//   engine.stop();   // makes a bestMove() in progress finish now
//   engine.quit();
//
// Lozza speaks UCI: you post it a line of text and it posts lines of text back. The
// only fiddly part is knowing when the answer to a command is complete, which is all
// this does: each request sends its commands and collects the replies up to a line
// that marks the end (bestmove for a search, readyok for anything else). Requests are
// queued, so they can be made without waiting for the one before.
//
// A position is given as a UCI position command, for example
//
//   'position startpos'
//   'position startpos moves e2e4 e7e5'
//   'position fen r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1'
//
// and moves are in UCI notation: from square, to square and a promotion piece if there
// is one, like e2e4 or a7a8q.
//

function lozzaEngine (url) {

  const worker = new Worker(url);

  let collect = null;                 // the request in progress: {lines, until, onLine, resolve}
  let queue   = Promise.resolve();    // requests run one after another

  worker.onmessage = function (e) {

    const line = String(e.data).trim();

    if (collect === null)
      return;

    collect.lines.push(line);

    if (collect.onLine)
      collect.onLine(line);

    if (collect.until.test(line)) {
      const done = collect;
      collect = null;
      done.resolve(done.lines);
    }

  };

  // send some commands and resolve with every line that comes back, up to and
  // including the first one that matches until

  function request (commands, until, onLine) {

    const run = () => new Promise(function (resolve) {
      collect = {lines: [], until: until, onLine: onLine, resolve: resolve};
      for (const command of commands)
        worker.postMessage(command);
    });

    queue = queue.then(run);

    return queue;

  }

  // 'info depth 10 seldepth 17 score cp 70 nodes 10171 ... pv e2e4 e7e5' -> the useful parts

  function parseInfo (line) {

    const words = line.split(' ');
    const info  = {};

    for (let i = 0; i < words.length; i++) {
      if (words[i] === 'depth')
        info.depth = parseInt(words[i + 1]);
      else if (words[i] === 'score')
        info.score = {type: words[i + 1], value: parseInt(words[i + 2])};   // type is cp (centipawns) or mate (moves)
      else if (words[i] === 'pv')
        info.pv = words.slice(i + 1);
    }

    return info;

  }

  request(['uci'], /^uciok/);
  request(['ucinewgame', 'isready'], /^readyok/);

  return {

    // Search a position. limits is {movetime: milliseconds}, {depth: plies} or
    // {nodes: count}. onInfo, if given, is called with each line of thinking as it
    // arrives. Resolves with {move, score, depth, pv}; move is null if there are no
    // legal moves (checkmate or stalemate).

    bestMove: function (position, limits, onInfo) {

      const how = Object.keys(limits || {}).map(k => k + ' ' + limits[k]).join(' ') || 'depth 10';

      let last = {};

      const onLine = function (line) {
        if (line.startsWith('info depth') && line.includes(' pv ')) {
          last = parseInfo(line);
          if (onInfo)
            onInfo(last);
        }
      };

      return request([position, 'go ' + how], /^bestmove/, onLine).then(function (lines) {
        const move = lines[lines.length - 1].split(' ')[1];
        return {
          move:  move === '0000' ? null : move,
          score: last.score || null,
          depth: last.depth || 0,
          pv:    last.pv    || [],
        };
      });

    },

    // the legal moves in a position

    legalMoves: function (position) {
      return request([position, 'moves', 'isready'], /^readyok/).then(function (lines) {
        return lines.filter(line => /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(line));
      });
    },

    // the position as a FEN string

    fen: function (position) {
      return request([position, 'board', 'isready'], /^readyok/).then(function (lines) {
        return lines.find(line => /^[pnbrqkPNBRQK1-8\/]+ [wb] /.test(line));
      });
    },

    // call at the start of a game: clears what the engine remembers of the last one

    newGame: function () {
      return request(['ucinewgame', 'isready'], /^readyok/);
    },

    // stop a search; its bestMove() then resolves with the best move found so far

    stop: function () {
      worker.postMessage('stop');
    },

    quit: function () {
      worker.terminate();
    },

  };

}
