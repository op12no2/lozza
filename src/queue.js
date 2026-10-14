// command queue
//
// All incoming commands go through cmdQueue and are run in order by uciDrain.
// While a search is in progress go yields after each rootSearch and
// pollQueue handles stop, isready and quit; everything else waits until
// the search finishes.
//

const cmdQueue = [];

let cmdBusy    = 0;
let stdinEnded = 0;

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

async function uciDrain () {

  cmdBusy = 1;

  while (cmdQueue.length)
    await uciExec(cmdQueue.shift(), 1);

  cmdBusy = 0;

  if (stdinEnded)
    process.exit();

}

function pollQueue () {

  for (let c=0; c < cmdQueue.length; c++) {

    const cmd = cmdQueue[c].split(/\s+/)[0];

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

// yieldToHost
//
// Must be a macrotask so stdin/onmessage events can run. In a web worker
// setTimeout(0) gets clamped to 4ms when nested, so use a MessageChannel.
//

const yieldChannel = nodeHost ? null : new MessageChannel();

let yieldResolve = null;

if (!nodeHost)
  yieldChannel.port1.onmessage = function() { yieldResolve(); };

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

async function checkStop () {

  await yieldToHost();

  pollQueue();

  return statsTimeOut;

}
