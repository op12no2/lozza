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

      case 'isready': {
        
        uciSend('readyok');
        
        break;
        
      }

      case 'position':
      case 'p': {
        
        if (ttSize == 1) {
          newGame();
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
        
        if (ttSize == 1) {
          newGame();
        }
        
        if (bdB[0] !== EDGE) {
          position('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR','w','KQkq','-',[]);
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
        
        if (moveTime > 0) {
          statsSoftTime = moveTime;
          statsHardTime = moveTime;  // movetime is a hard limit
        }
        
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
        
          if (movTime > 0) {
            statsSoftTime = movTime | 0;
            statsHardTime = Math.max(statsSoftTime, Math.min(statsSoftTime * 4, totTime / 2)) | 0;
          }
        
          if (statsSoftTime < 1 && (wTime || bTime)) {
            statsSoftTime = 1;
            statsHardTime = 1;
          }
        }
        
        statsMoveTime = statsSoftTime;
        
        if (canYield)
          return go(depth, 1);
        
        go(depth, 0);
        
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

          ttResize(mb);

        }

        else if (opt == 'multipv') {

          multiPV = Math.max(uciGetInt(tokens, 'value', 1), 1);

        }

        break;
        
      }

      case 'quit':
      case 'q': {
        
        process.exit();
        
        break;
        
      }

      case 'stop': {
        
        break;
        
      }

      case 'uci': {
        
        uciSend('id name Lozza', BUILD);
        uciSend('id author Colin Jenkins');
        uciSend('option name Hash type spin default', ttDefault, 'min 1 max 1024');
        uciSend('option name MultiPV type spin default 1 min 1 max 10');
        uciSend('uciok');
        
        break;
        
      }

      case 'perft': {
        
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
        
        const depth = uciGetInt(tokens, 'depth', BENCH_DEPTH);
        const warm  = uciGetInt(tokens, 'warm', 1);
        
        bench (depth, warm);

        break;
        
      }

      case 'qb': {
        
        uciExec('bench warm 0');
        
        break;
        
      }

      case 'pt': {
        
        let n = uciGetInt(tokens, 'n', PERFTFENS.length);
        pt(n);

        break;
        
      }

      case 'et': {
        
        et();

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
        
        const moves = legalMoves();
        
        for (let i=0; i < moves.length; i++)
          uciSend(formatMove(moves[i]));
        
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

function legalMoves () {

  // the legal moves in the current position, using the same legality test as rootSearch

  const moves    = [];
  const nextTurn = bdTurn ^ COLOR_MASK;

  let move = 0;

  initNode(rootNode);

  rootNode.inCheck = isKingAttacked(nextTurn);

  cache(rootNode);
  genMoves(rootNode, bdTurn);

  while ((move = getNextMove(rootNode)) !== 0) {

    makeMoveA(rootNode, move);

    if ((move & MOVE_LEGAL_MASK) !== 0 || isKingAttacked(nextTurn) === 0)
      moves.push(move);

    unmakeMove(rootNode, move);
    uncacheA(rootNode);

  }

  initNode(rootNode);

  return moves;

}
