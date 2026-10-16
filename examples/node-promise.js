// Promise wrapper for Lozza under Node.
//
//   node node-promise.js
//
// The Node counterpart of promise.html. On the command line Lozza is a
// normal UCI engine reading commands from stdin and writing replies to
// stdout, so here it's run as a child process rather than a Web Worker.
//
// Some commands have a definite last line. uci ends with uciok, isready with
// readyok and go with bestmove. The wrapper below returns a promise for
// commands like that, which resolves when the last line arrives, so
// calling code can just await it:-
//
//   await engine.isReady();
//   const result = await engine.go('depth 10');
//   console.log(result.bestmove);
//
// Commands with no reply (position, ucinewgame, setoption, stop) are just
// written to the engine's stdin.

const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');

function createEngine (file) {

  const child   = spawn(process.execPath, [file]); // process.execPath is the running node
  const waiters = []; // pending promises {prefix, lines, resolve}

  const engine = {

    onLine: null, // optional callback, sees every line (handy for logging)

    // Send a command. If untilPrefix is given, return a promise that
    // resolves with all the lines received up to and including the first
    // line that starts with untilPrefix.

    send: function (cmd, untilPrefix) {

      let promise = null;

      if (untilPrefix) {
        promise = new Promise(function (resolve) {
          waiters.push({prefix: untilPrefix, lines: [], resolve: resolve});
        });
      }

      child.stdin.write(cmd + '\n'); // one command per line, as per UCI

      return promise;

    },

    uci: function () {
      return engine.send('uci', 'uciok');
    },

    isReady: function () {
      return engine.send('isready', 'readyok');
    },

    // go resolves with {bestmove, score, lines}, where score is the last
    // score reported, e.g. {cp: 31} or {mate: 2}; bestmove is '0000' if
    // there are no legal moves, with score {mate: 0} (mated) or {cp: 0}
    // (stalemate)

    go: function (params) {
      return engine.send('go ' + params, 'bestmove').then(function (lines) {
        return {
          bestmove: words(lines[lines.length-1])[1],
          score:    lastScore(lines),
          lines:    lines
        };
      });
    },

    stop: function () {
      engine.send('stop'); // the pending go promise resolves when bestmove arrives
    },

    // Unlike a Web Worker, the command line version understands quit and
    // the promise resolves when the process has exited.

    quit: function () {
      const exited = new Promise(function (resolve) {
        child.on('exit', resolve);
      });
      engine.send('quit');
      return exited;
    }

  };

  // stdout arrives in arbitrary chunks; readline splits it into lines.

  readline.createInterface({input: child.stdout}).on('line', function (line) {

    if (engine.onLine)
      engine.onLine(line);

    // Every waiter collects every line and the first one whose prefix
    // matches is resolved. It's not always the oldest, e.g. isready sent
    // during a search is answered before the search's bestmove.

    for (let i=0; i < waiters.length; i++)
      waiters[i].lines.push(line);

    for (let i=0; i < waiters.length; i++) {
      if (line.startsWith(waiters[i].prefix)) {
        const w = waiters.splice(i, 1)[0];
        w.resolve(w.lines);
        break;
      }
    }

  });

  return engine;

}

function words (line) {
  return line.trim().split(/\s+/);
}

function lastScore (lines) {

  for (let i=lines.length-1; i >= 0; i--) {

    const w = words(lines[i]);
    const j = w.indexOf('score');

    if (w[0] === 'info' && j >= 0)
      return {[w[j+1]]: parseInt(w[j+2])}; // {cp: n} or {mate: n}

  }

  return null;

}

//
// demo
//

async function demo () {

  const engine = createEngine(path.join(__dirname, 'lozza.js'));

  // Uncomment to see the raw UCI traffic as well
  // engine.onLine = function (line) { console.log('  < ' + line); };

  const id = await engine.uci();
  console.log(id[0]); // id name Lozza ...

  engine.send('setoption name Hash value 32');
  engine.send('ucinewgame');
  await engine.isReady(); // the standard way to wait until setup is done
  console.log('ready');

  // A fixed depth search.

  engine.send('position startpos');
  let r = await engine.go('depth 10');
  console.log('depth 10 from startpos: bestmove ' + r.bestmove + ' score ' + JSON.stringify(r.score));

  // Play that move and search the reply.

  engine.send('position startpos moves ' + r.bestmove);
  r = await engine.go('movetime 500');
  console.log('reply after 500ms: bestmove ' + r.bestmove + ' score ' + JSON.stringify(r.score));

  // An infinite search ended by stop. isready is answered mid-search.

  engine.send('position startpos');
  const search = engine.go('infinite');
  await engine.isReady();
  console.log('readyok arrived while searching');
  setTimeout(engine.stop, 1000);
  r = await search;
  console.log('infinite stopped after 1s: bestmove ' + r.bestmove + ' (' + r.lines.length + ' lines received)');

  // No legal moves.

  engine.send('position fen 3R2k1/5ppp/8/8/8/8/8/6K1 b - -');
  r = await engine.go('depth 5');
  console.log('checkmated: bestmove ' + r.bestmove + ' score ' + JSON.stringify(r.score));

  engine.send('position fen 7k/5Q2/6K1/8/8/8/8/8 b - -');
  r = await engine.go('depth 5');
  console.log('stalemated: bestmove ' + r.bestmove + ' score ' + JSON.stringify(r.score));

  await engine.quit();
  console.log('done');

}

demo();
