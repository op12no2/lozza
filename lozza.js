//
// https://github.com/op12no2/lozza
//

const BUILD = "12.0";

//{{{  constants

const MAX_PLY   = 128;
const MAX_MOVES = 256;


//}}}
//{{{  utils

function now() {
  return performance.now() | 0;
}

//}}}
//{{{  uci

const nodeHost = (typeof process) != 'undefined';  // node, otherwise a web worker

const fs = (nodeHost) ? require('fs') : 0;

//{{{  uciSend

function uciSend () {

  var s = '';

  for (var i = 0; i < arguments.length; i++)
    s += arguments[i] + ' ';

  if (nodeHost)
    console.log(s);
  else
    postMessage(s);

}

//}}}
//{{{  uciGetInt

function uciGetInt (tokens, key, def) {

  for (let i=0; i < tokens.length; i++)
    if (tokens[i] == key)
      if (i < tokens.length - 1)
        return parseInt(tokens[i+1]);

  return def;

}

//}}}
//{{{  uciGetStr

function uciGetStr (tokens, key, def) {

  const lkey = key.toLowerCase();

  for (let i=0; i < tokens.length; i++)
    if (tokens[i].toLowerCase() == lkey)
      if (i < tokens.length - 1)
        return tokens[i+1];

  return def;

}

//}}}
//{{{  uciGetArr

let uciArrLo = 0;  // set by uciGetArr
let uciArrHi = 0;

function uciGetArr (tokens, key, to) {

  var lo = 0;
  var hi = 0;

  for (let i=0; i < tokens.length; i++) {
    if (tokens[i] == key) {
      lo = i + 1;  //assumes at least one item
      hi = lo;
      for (let j=lo; j < tokens.length; j++) {
        if (tokens[j] == to)
          break;
        hi = j;
      }
    }
  }

  uciArrLo = lo;
  uciArrHi = hi;

}

//}}}
//{{{  uciExec
//
// canYield is only set by uciDrain. A go then returns its promise so the
// drain waits for the search to finish before running the next command.
//

function uciExec (commands, canYield) {

  const cmdList = commands.split('\n');

  for (let c=0; c < cmdList.length; c++ ) {

    let cmdStr = cmdList[c].replace(/(\r\n|\n|\r)/gm,"");

    cmdStr = cmdStr.trim();
    cmdStr = cmdStr.replace(/\s+/g,' ');

    const tokens = cmdStr.split(' ');

    let cmd = tokens[0];

    if (!cmd)
      continue;

    switch (cmd) {

      //{{{  isready

      case 'isready': {

        uciSend('readyok');

        break;

      }
      //}}}
      //{{{  quit

      case 'quit':
      case 'q': {

        hostExit();

        break;

      }

      //}}}
      //{{{  stop

      case 'stop': {

        break;

      }
      //}}}
      //{{{  uci

      case 'uci': {

        if (getWeights() === '')
          uciSend('id name Lozza', BUILD, '(dev)');
        else
          uciSend('id name Lozza', BUILD);
        uciSend('id author Colin Jenkins');
        uciSend('uciok');

        break;

      }
      //}}}

      default: {
        break;
      }
    }

  }
}

//}}}
//{{{  hostExit

function hostExit () {

  if (nodeHost)
    process.exit();
  else
    close();

}

//}}}
//{{{  command queue
//
// All incoming commands go through cmdQueue and are run in order by uciDrain.
// While a search is in progress go yields after each rootSearch and
// pollQueue handles stop, isready and quit; everything else waits until
// the search finishes.
//

let statsTimeOut = 0;  // set by pollQueue on stop

const cmdQueue = [];

let cmdBusy    = 0;
let stdinEnded = 0;

//{{{  uciQueue

function uciQueue (commands) {

  const cmdList = commands.split('\n');

  for (let c=0; c < cmdList.length; c++) {
    const cmdStr = cmdList[c].trim();
    if (cmdStr)
      cmdQueue.push(cmdStr);
  }

  if (!cmdBusy)
    uciDrain();

}

//}}}
//{{{  uciDrain

async function uciDrain () {

  cmdBusy = 1;

  while (cmdQueue.length)
    await uciExec(cmdQueue.shift(), 1);

  cmdBusy = 0;

  if (stdinEnded)
    hostExit();

}

//}}}
//{{{  pollQueue

function pollQueue () {

  for (let c=0; c < cmdQueue.length; c++) {

    const cmd = cmdQueue[c].split(' ')[0];

    if (cmd == 'stop') {  // stop based an idea by @InSys, extended with a command queue
      // anything after the stop runs after bestmove has been sent
      statsTimeOut = 1;
      cmdQueue.splice(c, 1);
      return;
    }

    if (cmd == 'isready' || cmd == 'quit' || cmd == 'q')
      uciExec(cmd);
    else
      continue;

    cmdQueue.splice(c--, 1);

  }

}

//}}}
//{{{  yeildToHost
//
// Must be a macrotask so stdin/onmessage events can run. In a web worker
// setTimeout(0) gets clamped to 4ms when nested, so use a MessageChannel.
// Node provides setImmediate.
//

const yieldChannel = (nodeHost) ? null : new MessageChannel();

let yieldResolve = null;

function yieldToHost () {

  return new Promise(function(resolve) {
    if (nodeHost)
      setImmediate(resolve);
    else {
      yieldResolve = resolve;
      yieldChannel.port2.postMessage(0);
    }
  });

}

//}}}
//{{{  checkStop

async function checkStop () {

  await yieldToHost();

  pollQueue();

  return statsTimeOut;

}
//}}}

//}}}

//{{{  initUci

function initUci () {

  if (nodeHost) {
    //{{{  node

    process.stdin.setEncoding('utf8');

    let stdinBuf = '';  // partial line carried over between chunks

    //{{{  on readable

    process.stdin.on('readable', function() {
      const chunk = process.stdin.read();
      process.stdin.resume();
      if (chunk !== null) {
        stdinBuf += chunk;
        const nl = stdinBuf.lastIndexOf('\n');
        if (nl >= 0) {
          uciQueue(stdinBuf.slice(0, nl));
          stdinBuf = stdinBuf.slice(nl + 1);
        }
      }
    });
    //}}}
    //{{{  on end

    process.stdin.on('end', function() {
      // let any queued commands (inc. a running search) finish first
      stdinEnded = 1;
      if (stdinBuf)
        uciQueue(stdinBuf);
      if (!cmdBusy)
        hostExit();
    });

    //}}}
    //}}}
  }

  else {
    //{{{  web

    onmessage = function(e) {
      uciQueue(e.data);
    };

    yieldChannel.port1.onmessage = function() { yieldResolve(); };

    //}}}
  }

}

//}}}

//}}}
//{{{  init

function initOnce () {

  initUci();

}

initOnce();

//{{{  process command line and quit
//
// command line arguments are commands, e.g. node lozza.js "go depth 10";
// they go through the queue so a go completes before the exit.
//

if (nodeHost) {

  const argv = process.argv.slice(2);

  if (argv.length) {
    stdinEnded = 1;
    uciQueue(argv.join('\n'));
  }
}

//}}}
//}}}
//{{{  weights

function getWeights() {
  return '';
}

//}}}

