//
// Generate FENs in bullet text format.
//

docmd("bench");

const fs = require('fs');

SILENT = 1;

const nodesLimit     = 10000;  // hard limit is x10
const gamesLimit     = 100000;
const bufferSize     = 100000 + Math.random() * 100000;  // randomise writes
const reportInterval = 10;

const fileName = 'data/datagen' + Math.trunc(Math.random()*100000000000) + '.txt';

let result = '';
let o = '';
let t = now();
let totalFens = 0;

fs.writeFileSync(fileName,o);

for (let g=0; g < gamesLimit; g++) {
  //{{{  log
  
  if ((g % reportInterval) == 0) {
    console.log(fileName,g,'games',(totalFens/((now()-t)/1000)),'fens/sec');
    t = now();
    totalFens = 0;
  }
  
  //}}}
  //{{{  play game
  
  let randLimit   = 10;
  let reportLimit = 16;
  
  if (Math.random() >= 0.5) {
    randLimit--;
    reportLimit--;
  }
  
  docmd('u');
  docmd('p s');
  
  let moves = '';
  let hmc = 0;
  let ply = 0;
  let fens = [];
  let scores = [];
  
  while (true) {
  
    ply++;
  
    const turn     = lozza.board.turn;
    const nextTurn = colourToggle(turn);
  
    //{{{  get a move
    
    if (ply <= randLimit)
      lozza.board.randomEval = 1;
    else
      lozza.board.randomEval = 0;
    
    docmd('go nodes ' + nodesLimit);
    
    if (ply <= randLimit)
      docmd('u');
    
    if (lozza.stats.bestMove == 0) {
      result = '0.5';
      break;
    }
    
    //}}}
  
    const move    = lozza.stats.bestMove;
    const frObj   = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;
    const frPiece = frObj & PIECE_MASK;
    const moveStr = formatMove(move,UCI_FMT);
    const inCheck = lozza.board.isKingAttacked(nextTurn);
    const noisy   = moveIsNoisy(move);
    const fen     = lozza.board.fen(lozza.board.turn);
    const score   = (turn == BLACK ? -lozza.stats.bestScore : lozza.stats.bestScore);
  
    if (ply > reportLimit && !inCheck && !noisy) {
      fens.push(fen);
      scores.push(score);
    }
  
    //{{{  end of game?
    
    let rep = 0;
    for (let i=0; i < fens.length; i++) {
      if (fen == fens[i])
        rep++;
    }
    
    if (rep > 2) {
      result = '0.5';
      break;
    }
    
    if (score >= MINMATE) {
      result = '1.0';
      break;
    }
    else if (score <= -MINMATE) {
      result = '0.0';
      break;
    }
    
    if (!noisy && (frPiece != PAWN))
      hmc++;
    else
      hmc = 0;
    
    if (hmc > 60) {
      result = '0.5';
      break;
    }
    
    //}}}
  
    moves += ' ' + moveStr;
  
    docmd('position fen ' + 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' + ' moves ' + moves)
  }
  
  //}}}
  //{{{  save it
  
  for (let i=0; i < fens.length; i++) {
  
    totalFens++;
  
    o += fens[i] + ' | ' + scores[i] + ' ' + ' | ' + result + '\r\n';
  
    if (o.length > bufferSize) {
      const flushStart = performance.now();
      fs.appendFileSync(fileName,o);
      console.log('flush',performance.now()-flushStart);
      o = '';
    }
  
  }
  
  //}}}
}

if (o.length) {
  fs.appendFileSync(fileName,o);
}

console.log('done');

process.exit();

