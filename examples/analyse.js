//
// analyse.js - use Lozza from a Node program.
//
//   node analyse.js              analyse the positions below
//   node analyse.js "<fen>" ...  analyse the positions given
//
// In Node the engine is a program that reads UCI commands from its standard input and
// writes its replies to its standard output, so it is run as a child process:
// node <engine file>. This starts one, asks it for the best move in each position and
// prints a line for each.
//

const {spawn}  = require('child_process');
const readline = require('readline');
const path     = require('path');

const ENGINE = path.join(__dirname, 'lozza_net256.js');
const DEPTH  = 12;

const POSITIONS = [
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
  '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
  '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
];

//{{{  startEngine
//
// Start the engine. Returns {bestMove(fen, depth), quit()}.
//

function startEngine (file) {

  const child = spawn(process.execPath, [file]);
  const lines = readline.createInterface({input: child.stdout});

  let waiting = null;   // {lines, until, resolve}: the request in progress

  lines.on('line', function (text) {

    const line = text.trim();

    if (waiting === null)
      return;

    waiting.lines.push(line);

    if (waiting.until.test(line)) {
      const done = waiting;
      waiting = null;
      done.resolve(done.lines);
    }

  });

  // send commands and resolve with the lines that come back, up to one matching until

  function request (commands, until) {
    return new Promise(function (resolve) {
      waiting = {lines: [], until: until, resolve: resolve};
      for (const command of commands)
        child.stdin.write(command + '\n');
    });
  }

  return {

    bestMove: async function (fen, depth) {

      const lines = await request(['position fen ' + fen, 'go depth ' + depth], /^bestmove/);

      // the last line of thinking with a line of play in it has the final score

      const info  = lines.filter(line => line.startsWith('info depth') && line.includes(' pv ')).pop() || '';
      const score = info.match(/score (cp|mate) (-?\d+)/);

      return {
        move:  lines[lines.length - 1].split(' ')[1],
        score: score ? (score[1] === 'mate' ? 'mate in ' + score[2] : (score[2] / 100).toFixed(2)) : '',
        pv:    info.includes(' pv ') ? info.split(' pv ')[1] : '',
      };

    },

    start: function () {
      return request(['uci', 'ucinewgame', 'isready'], /^readyok/);
    },

    quit: function () {
      child.stdin.write('quit\n');
    },

  };

}

//}}}

async function main () {

  const positions = process.argv.length > 2 ? process.argv.slice(2) : POSITIONS;
  const engine    = startEngine(ENGINE);

  await engine.start();

  for (const fen of positions) {
    const result = await engine.bestMove(fen, DEPTH);
    console.log(fen);
    console.log('  best ' + result.move + '  score ' + result.score + '  line ' + result.pv);
  }

  engine.quit();

}

main();
