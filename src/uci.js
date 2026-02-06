function uciSend(s) {
  if (nodeHost) {
    console.log(s);
  }
  else {
    postMessage(s);
  }
}

// C-ish whitespace test: treats ASCII <= 32 as whitespace (space/tab/CR/LF/etc)
function isWsCode(c) {
  return c <= 32;
}

// Manual tokenizer: like a C loop filling argv[]
function tokenizeLine(line) {
  const tokens = [];
  const n = line.length;
  let i = 0;

  while (i < n && tokens.length < MAX_TOKENS) {
    while (i < n && isWsCode(line.charCodeAt(i))) {
      i++;
    }
    if (i >= n) {
      break;
    }

    const start = i;

    while (i < n && !isWsCode(line.charCodeAt(i))) {
      i++;
    }

    tokens.push(line.slice(start, i));
  }

  return tokens;
}

function uciExecLine(line) {
  if (line === null || line === undefined) {
    return;
  }

  line = String(line).trim();
  if (line.length === 0) {
    return;
  }

  const tokens = tokenizeLine(line);
  if (tokens.length === 0) {
    return;
  }

  const cmd = tokens[0];

  if (cmd === 'isready') {
    uciSend('readyok');
  }
  else if (cmd === 'uci') {
    uciSend('id name Lozza 11');
    uciSend('id author xyzzy');
    //uciSend('option name Hash type spin default ' + ttDefault + ' min 1 max 1024');
    //uciSend('option name MultiPV type spin default 1 min 1 max 10');
    uciSend('uciok');
  }
  else if (cmd === 'p' || cmd === 'position') {
    if (tokens[1] === 'startpos' || tokens[1] === 's') {
      position('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', 'w', 'KQkq', '-');
    }
    else {
      position(tokens[2], tokens[3], tokens[4], tokens[5]);
    }
  }
  else if (cmd === 'b' || cmd === 'board') {
    printBoard();
  }
  else if (cmd === 'perft' || cmd === 'f') {
    const depth = parseInt(tokens[1]) || 0;
    const t1 = Date.now();
    const n = perft(0, depth);
    const t2 = Date.now();
    const ms = t2 - t1;
    const nps = ms ? Math.floor(n / ms * 1000) : 0;
    uciSend('perft ' + depth + ' = ' + n + ' in ' + ms + ' ms ' + nps + ' nps');
  }
  else if (cmd === 'pt') {
    perftTests(parseInt(tokens[1]) || 0);
  }
  else if (cmd === 'quit' || cmd === 'q') {
    if (nodeHost) {
      process.exit(0);
    }
  }
  else {
    uciSend('?');
  }
}
