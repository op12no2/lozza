function uciSend () {

  if (silentMode)
    return;

  var s = '';

  for (var i = 0; i < arguments.length; i++)
    s += arguments[i] + ' ';

  //fs.writeSync(1, s + '\n');

  if (nodeHost)
    console.log(s);
  else
    postMessage(s);

}

// uciGetInt

function uciGetInt (tokens, key, def) {

  for (let i=0; i < tokens.length; i++)
    if (tokens[i] == key)
      if (i < tokens.length - 1)
        return parseInt(tokens[i+1]);

  return def;

}

// uciGetStr

function uciGetStr (tokens, key, def) {

  const lkey = key.toLowerCase();

  for (let i=0; i < tokens.length; i++)
    if (tokens[i].toLowerCase() == key)
      if (i < tokens.length - 1)
        return tokens[i+1];

  return def;

}

// uciGetArr

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

  return {lo:lo, hi:hi};

}

// uciExec

function uciExec (commands) {

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

      case 'isready': {
        // isready
        
        uciSend('readyok');
        
        break;
        
      }

      case 'position':
      case 'p': {
        // position
        
        if (ttSize == 1) {
          uciSend('info do a ucinewgame or setoption name hash command first');
          break;
        }
        
        let bd     = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
        let turn   = 'w';
        let rights = 'KQkq';
        let ep     = '-';
        
        let arr = uciGetArr(tokens, 'fen', 'moves');
        
        if (arr.lo > 0) {
          if (arr.lo <= arr.hi) bd     = tokens[arr.lo]; arr.lo++;
          if (arr.lo <= arr.hi) turn   = tokens[arr.lo]; arr.lo++;
          if (arr.lo <= arr.hi) rights = tokens[arr.lo]; arr.lo++;
          if (arr.lo <= arr.hi) ep     = tokens[arr.lo]; arr.lo++;
        }
        
        const moves = [];
        
        arr = uciGetArr(tokens, 'moves', 'fen');
        
        if (arr.lo > 0) {
          for (var i=arr.lo; i <= arr.hi; i++)
            moves.push(tokens[i]);
        }
        
        position(bd, turn, rights, ep, moves);
        
        break;
        
      }

      case 'go':
      case 'g': {
        // go
        
        if (ttSize == 1) {
          uciSend('info do a ucinewgame or setoption name hash command first');
          break;
        }
        
        if (bdB[0] !== EDGE) {
          uciSend('info do a position command first');
          break;
        }
        
        
        initStats();
        
        let depth     = Math.max(uciGetInt(tokens, 'depth', 0), uciGetInt(tokens, 'd', 0));
        let moveTime  = uciGetInt(tokens, 'movetime', 0);
        let maxNodes  = uciGetInt(tokens, 'nodes', 0);
        let wTime     = uciGetInt(tokens, 'wtime', 0);
        let bTime     = uciGetInt(tokens, 'btime', 0);
        let wInc      = uciGetInt(tokens, 'winc', 0);
        let bInc      = uciGetInt(tokens, 'binc', 0);
        let movesToGo = uciGetInt(tokens, 'movestogo', 0);
        
        let totTime = 0;
        let movTime = 0;
        let incTime = 0;
        
        if (depth <= 0)
          depth = MAX_PLY;
        
        if (moveTime > 0)
          statsMoveTime = moveTime;
        
        if (maxNodes > 0)
          statsMaxNodes = maxNodes;
        
        if (moveTime === 0) {
        
          if (movesToGo > 0)
            movesToGo += 2;
          else
            movesToGo = 30;
        
          if (bdTurn === WHITE) {
            totTime = wTime;
            incTime = wInc;
          }
          else {
            totTime = bTime;
            incTime = bInc;
          }
        
          movTime = myround(totTime / movesToGo) + incTime;
          movTime = movTime * 0.95;
        
          if (movTime > 0)
            statsMoveTime = movTime | 0;
        
          if (statsMoveTime < 1 && (wTime || bTime))
            statsMoveTime = 1;
        }
        
        go(depth);
        break;
        
      }

      case 'ucinewgame':
      case 'u': {
        
        newGame();
        break;
        
      }

      case 'setoption':
      case 'o': {
        
        const opt = uciGetStr(tokens, 'name', '').toLowerCase();
        
        if (opt == 'hash') {
          const mb = Math.max(uciGetInt(tokens, 'value', ttDefault), 1);
          console.log(mb);
          ttResize(mb);
        }

        else if (opt == 'multipv') {
          multiPV = Math.max(uciGetInt(tokens, 'value', 1), 1);
        }

        break;
        
      }

      case 'quit':
      case 'q': {
        
        process.exit(0);
        
        break;
        
      }

      case 'stop': {
        
        break;
        
      }

      case 'uci': {
        
        uciSend('id name Lozza', BUILD);
        uciSend('id author op12no2');
        uciSend('option name Hash type spin default', ttDefault, 'min 1 max 1024');
        uciSend('option name MultiPV type spin default 1 min 1 max 5');
        uciSend('uciok');
        
        break;
        
      }

      case 'perft': 
      case 'f': {
        
        uciExec('b');
        
        const depth1 = uciGetInt(tokens, 'depth', 0);
        const depth2 = uciGetInt(tokens, 'to', depth1);
        const warm = uciGetInt(tokens, 'warm', 0);
        
        for (let w=0; w < warm; w++) {
          for (let depth=depth1; depth <= depth2; depth++) {
            const nodes = perft(rootNode, depth, bdTurn);
          }
        }
        
        for (let depth=depth1; depth <= depth2; depth++) {
          const start = now();
          const nodes = perft(rootNode, depth, bdTurn);
          const elapsed = now() - start;
          const nps = nodes / elapsed * 1000 | 0;
          uciSend('depth', depth, 'nodes', nodes, 'time', elapsed, 'nps', nps);
        }
        
        break;
        
      }

      case 'eval':
      case 'e': {
        
        const e = netEval(bdTurn);
        uciSend(e);
        
        break;
        
      }

      case 'board':
      case 'b': {
        
        uciSend(formatFen(bdTurn));
        
        break;
        
      }

      case 'bench': 
      case 'h': {
        
        bench();
        break;
        
      }

      case 'pt': {
        
        perftTests(uciGetInt(tokens, 'pt', 0));
        break;
        
      }

      case 'et': {
        
        evalTests();
        break;
        
      }

      case 'net':
      case 'n': {
        
        uciSend('i_size, h1_size', NET_I_SIZE, NET_H1_SIZE);
        uciSend('qa, qb', NET_QA, NET_QB);
        uciSend('scale', NET_SCALE);
        
        uciExec('u');
        uciExec('p s');
        uciExec('e');
        
        break;
        
      }

      case 'moves':
      case 'm': {
        
        initNode(rootNode);
        
        rootNode.inCheck = 1;
        
        let move = 0;
        
        genMoves(rootNode, bdTurn);
        
        while(move = getNextMove(rootNode))
          console.log(formatMove(move));
        
        initNode(rootNode);
        
        break;
        
      }

      default: {
        // ?
        
        uciSend('unknown command', cmd);
        
        break;
        
      }
    }
  }

}

