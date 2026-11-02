//
// https://github.com/op12no2/lozza
//

const BUILD = "12.0";

//{{{  constants

const MAX_PLY   = 128;
const MAX_MOVES = 256;

//{{{  magics
//
// cwtch4 magics.
//

const BISHOP_MAGICS = new BigUint64Array([
  0x0018911026004900n, 0x0020080106408600n, 0x0024282600400220n, 0x0c04104208021041n,
  0x1008484040000003n, 0x000202100420c800n, 0x8200808820500301n, 0x08108c00880c0200n,
  0x4000102608013c10n, 0x0430188108088904n, 0x0010900082014100n, 0x0006140400800200n,
  0x40001310c0000c29n, 0x0000020524200211n, 0x442840840c200cc0n, 0x008164c20084e000n,
  0x0040001111191900n, 0x008802102246c400n, 0x0102000402220a00n, 0x000800c38200c180n,
  0x0004024610220000n, 0x0c28a08202102204n, 0x010c410082101080n, 0x0002400021080829n,
  0x0008080005212808n, 0x0a722800a0052400n, 0x0002020091040400n, 0x2001004004040002n,
  0x0c81010100104000n, 0x8001120009008088n, 0x608b0049441e0804n, 0x0844008040404c00n,
  0x001006f040200400n, 0x808802a840020814n, 0x1005402800100040n, 0x4060420080480080n,
  0x0e020084001a0020n, 0x0002004200110080n, 0x080828810401a800n, 0x80320069000a0280n,
  0x49041c20040e4840n, 0x0005241004142220n, 0x0000b400a8020400n, 0x0000004010420202n,
  0x0008080208220400n, 0x4040880104080040n, 0x000809012a040420n, 0x0222145440806201n,
  0x1002008208400004n, 0xa004210412200002n, 0x280084cc040c2010n, 0x1008840084040010n,
  0x0000202020864040n, 0x0002202401820002n, 0x2008201484025204n, 0x00200b3901010000n,
  0x8000840400844408n, 0x0f004d0402069200n, 0x1404800300809000n, 0x4804000102050400n,
  0x0088000020020480n, 0xd800031060411100n, 0x008148480808dc00n, 0x0042200220a60081n
]);

const ROOK_MAGICS = new BigUint64Array([
  0x0180002040001083n, 0x0940004020041009n, 0x1300104102082000n, 0x210004e010010028n,
  0x0080080002800400n, 0x20800c0080012a00n, 0x8c00008410020801n, 0x0300020040842100n,
  0x0500802040008001n, 0x1101004000802100n, 0x0042002042059280n, 0x0429808030002800n,
  0x00e0800400080280n, 0x0090806200804400n, 0x0104000421820810n, 0x0012000200408134n,
  0x1884248000844000n, 0x0040008040802000n, 0x0820110040200500n, 0x0420808008001000n,
  0x0000050008010010n, 0xc002008004008002n, 0x8805440041183012n, 0x0c0002000081104cn,
  0x0240400c80208000n, 0x0320100440024020n, 0x8080200080801000n, 0x0000100080080080n,
  0x0a02000600205048n, 0x000a010200104408n, 0x3000080400213002n, 0x4428340200008843n,
  0x018140013180008cn, 0x2120442000401000n, 0x4180802008801000n, 0xa080081001002100n,
  0x0004040080800800n, 0x0204040080800200n, 0x01a0081504000670n, 0x00040040a2000401n,
  0x8880804000248000n, 0x0100400020008080n, 0x0030040028002001n, 0x000c10412202000an,
  0x0408000400088080n, 0x3102008004008002n, 0x4020c80190040002n, 0x0001040060820001n,
  0x000100204a008600n, 0x0100200040008080n, 0x2100804016002600n, 0x4030004400080040n,
  0x0107001108004500n, 0x000c817a00040080n, 0x2021008200040100n, 0x00402300840e4200n,
  0x2420208203004016n, 0x0504a09082044102n, 0x8410200041001209n, 0x1002004004200812n,
  0x008200201008ac5an, 0xc202000410080102n, 0x0000300801020094n, 0x0000022504008842n
]);

//}}}

//}}}
//{{{  utils

function now() {
  return performance.now() | 0;
}

//}}}
//{{{  bitboards

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

