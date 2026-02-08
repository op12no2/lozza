function uciSend(s) {
  if (nodeHost) {
    console.log(s);
  }
  else {
    postMessage(s);
  }
}

function uciExecLine(line) {
  const tokens = line.trim().split(/\s+/);

  if (tokens.length === 0 || tokens[0] === '') {
    return;
  }

  const cmd = tokens[0];

  switch (cmd) {

    case 'isready': {
      uciSend('readyok');
      break;
    }

    case 'ucinewgame':
    case 'u': {
      if (g_ttMask === 0)
        ttResize(TT_DEFAULT);
      newGame();
      break;
    }    

    case 'uci': {
      uciSend('id name Lozza 11');
      uciSend('id author xyzzy');
      uciSend('option name Hash type spin default ' + TT_DEFAULT + ' min 1 max 1024');
      //uciSend('option name MultiPV type spin default 1 min 1 max 10');
      uciSend('uciok');
      break;
    }

    case 'p':
    case 'position': {
      const mi = tokens.indexOf('moves');
      const moves = mi >= 0 ? tokens.slice(mi + 1) : null;

      if (tokens[1] === 'startpos' || tokens[1] === 's') {
        position('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', 'w', 'KQkq', '-', moves);
      }
      else {
        position(tokens[2], tokens[3], tokens[4], tokens[5], moves);
      }
      break;
    }

    case 'b':
    case 'board': {
      printBoard();
      break;
    }

    case 'h':
    case 'bench': {
      bench();
      break;
    }

    case 'o':
    case 'setoption': {
      if (tokens[2].toLowerCase() === 'hash')
        ttResize(parseInt(tokens[4]));
      break;
    }

    case 'perft':
    case 'f': {
      const depth = parseInt(tokens[1]) || 0;
      const t1 = Date.now();
      const n = perft(0, depth);
      const t2 = Date.now();
      const ms = t2 - t1;
      const nps = ms ? Math.floor(n / ms * 1000) : 0;
      uciSend('perft ' + depth + ' = ' + n + ' in ' + ms + ' ms ' + nps + ' nps');
      break;
    }

    case 'pt': {
      perftTests(parseInt(tokens[1]) || 0);
      break;
    }

    case 'eval':
    case 'e': {
      uciSend('eval ' + evaluate());
      break;
    }

    case 'go':
    case 'g': {
      if (g_ttMask === 0)
        ttResize(TT_DEFAULT);
      initTimeControl(tokens);
      go();
      break;
    }

    case 'quit':
    case 'q': {
      if (nodeHost) {
        process.exit(0);
      }
      break;
    }

    default: {
      uciSend('?');
      break;
    }  
  }
}

