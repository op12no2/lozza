
"use strict";

//{{{  stm

let stm = 0;

let stmWhite = 0;
let stmBlack = 1;

//}}}
//{{{  magic

//{{{  moveList

function moveListEntry () {
  this.moves      = [];
  this.loBlockers = [];
  this.hiBlockers = [];
}

//{{{  moveList_FindMoves

function moveList_FindMoves(moveList, moves1) {

  for (let i=0; i < moveList.length; i++) {

    const moves2 = moveList[i].moves;

    if (moves2.length !== moves1.length) continue;

    let allMatch = true;

    for (let j=0; j < moves1.length; j++) {
      let match = false;
      for (let k=0; k < moves2.length; k++) {
        if (moves1[j] === moves2[k]) {
          match = true;
          break;
        }
      }
      if (!match) {
        allMatch = false;
        break;
      }
    }

    if (allMatch)
      return i;
  }

  return -1;
}

//}}}

//}}}

//{{{  initRookMasks

const loRookMasks = new Array(64);
const hiRookMasks = new Array(64);

function initRookMasks() {

  for (let sq=0; sq < 64; sq++) {

    const file = sq % 8;
    const rank = Math.floor(sq / 8);

    let loMask = 0;
    let hiMask = 0;

    for (let r = rank + 1; r < 7; r++) {
      const bitIndex = r * 8 + file;
      if (bitIndex < 32)
        loMask |= (1 << bitIndex);
      else
        hiMask |= (1 << (bitIndex - 32));
    }

    for (let r = rank - 1; r > 0; r--) {
      const bitIndex = r * 8 + file;
      if (bitIndex < 32)
        loMask |= (1 << bitIndex);
      else
        hiMask |= (1 << (bitIndex - 32));
    }

    for (let f = file + 1; f < 7; f++) {
      const bitIndex = rank * 8 + f;
      if (bitIndex < 32)
        loMask |= (1 << bitIndex);
      else
        hiMask |= (1 << (bitIndex - 32));
    }

    for (let f = file - 1; f > 0; f--) {
      const bitIndex = rank * 8 + f;
      if (bitIndex < 32)
        loMask |= (1 << bitIndex);
      else
        hiMask |= (1 << (bitIndex - 32));
    }

    loRookMasks[sq] = loMask;
    hiRookMasks[sq] = hiMask;
  }
}

//}}}
//{{{  initRookMoveList

const rookMoveList = [];

//{{{  initRookMoveList_GetMoves

function initRookMoveList_GetMoves(from, loBlocker, hiBlocker) {

  const moves = [];

  const file = from % 8;
  const rank = Math.floor(from / 8);

  let to = from;
  for (let i=rank; i < 7; i++) {
    to += 8;
    moves.push((from << 6) | to);
    if (isBitSet(to, loBlocker, hiBlocker))
      break;
  }

  to = from;
  for (let i=rank; i > 0; i--) {
    to -= 8;
    moves.push((from << 6) | to);
    if (isBitSet(to, loBlocker, hiBlocker))
      break;
  }

  to = from;
  for (let i=file; i < 7; i++) {
    to += 1;
    moves.push((from << 6) | to);
    if (isBitSet(to, loBlocker, hiBlocker))
      break;
  }

  to = from;
  for (let i=file; i > 0; i--) {
    to -= 1;
    moves.push((from << 6) | to);
    if (isBitSet(to, loBlocker, hiBlocker))
      break;
  }

  return moves;
}

//}}}

function initRookMoveList() {

  for (let sq=0; sq < 64; sq++) {
    //{{{  rook moves
    
    const loMask = loRookMasks[sq];
    const hiMask = hiRookMasks[sq];
    
    let bitPositions = [];
    
    for (let i=0; i < 32; i++) {
      if (loMask & (1 << i))
        bitPositions.push(i);
      if (hiMask & (1 << i))
        bitPositions.push(i + 32);
    }
    
    const numBlockers     = bitPositions.length;
    const numCombinations = 1 << numBlockers;
    
    for (let subset=0; subset < numCombinations; subset++) {
      let loBlocker = 0;
      let hiBlocker = 0;
      for (let i=0; i < numBlockers; i++) {
        if (subset & (1 << i)) {
          const bitIndex = bitPositions[i];
          if (bitIndex < 32)
            loBlocker |= (1 << bitIndex);
          else
            hiBlocker |= (1 << (bitIndex - 32));
        }
      }
    
      //{{{  add rook moves for this blocker
      
      const moves = initRookMoveList_GetMoves (sq, loBlocker, hiBlocker)
      const index = moveList_FindMoves(rookMoveList, moves);
      
      if (index >= 0) {
        const entry = rookMoveList[index];
        entry.loBlockers.push(loBlocker);
        entry.hiBlockers.push(hiBlocker);
      }
      
      else {
        const entry = new moveListEntry();
        rookMoveList.push(entry);
        entry.moves = moves;
        entry.loBlockers.push(loBlocker);
        entry.hiBlockers.push(hiBlocker);
      }
      
      //}}}
    }
    
    //}}}
  }

}

//}}}

//{{{  printBitboard

function printBitboard(lo, hi) {

  let board = "";

  for (let rank = 7; rank >= 0; rank--) {

    for (let file = 0; file < 8; file++) {

      let bitIndex = rank * 8 + file;
      let bitSet = bitIndex < 32
        ? (lo & (1 << bitIndex)) !== 0
        : (hi & (1 << (bitIndex - 32))) !== 0;

      board += bitSet ? "X" : ".";
    }

    board += "\n"; // New rank
  }

  console.log(board);
}

//}}}
//{{{  isBitSet

function isBitSet(square, loMask, hiMask) {
  if (square < 32) {
    return (loMask & (1 << square)) !== 0 ? 1 : 0;
  }
  else {
    return (hiMask & (1 << (square - 32))) !== 0 ? 1 : 0;
  }
}

//}}}

//{{{  setOccupied

let loOccupied = 0;
let hiOccupied = 0;

function setOccupied () {

  for (let i=0; i < pieceCount[stmWhite]; i++) {
    const e  = pieceList[i];
    const sq = e & 0xFF;
    if (sq < 32)
      loOccupied |= 1 << sq;
    else
      hiOccupied |= 1 << (sq-32);
  }

  for (let i=0; i < pieceCount[stmBlack]; i++) {
    const e  = pieceList[16+i];
    const sq = e & 0xFF;
    if (sq < 32)
      loOccupied |= 1 << sq;
    else
      hiOccupied |= 1 << (sq-32);
  }
}

//}}}

//}}}
//{{{  piece list

let pieceList  = new Int32Array(32);
let pieceCount = new Int32Array(2);

//{{{  printBoard

const itoaPiece = {
  1: 'P', 2: 'N', 3: 'B', 4: 'R', 5: 'Q', 6: 'K'
};

function printBoard () {

  console.log('white', pieceCount[stmWhite]);

  for (let i=0; i < pieceCount[stmWhite]; i++) {
    const e  = pieceList[i];
    const sq = e & 0xFF;
    const p  = (e & 0xFF00) >>> 8;
    console.log('piece#', p, 'piece', itoaPiece[p], 'square', sq);
  }

  console.log('black', pieceCount[stmBlack]);

  for (let i=0; i < pieceCount[stmBlack]; i++) {
    const e  = pieceList[16+i];
    const sq = e & 0xFF;
    const p  = (e & 0xFF00) >>> 8;
    console.log('piece#', p, 'piece', itoaPiece[p].toLowerCase(), 'square', sq);
  }

}

//}}}
//{{{  position

const atoiPiece = {
  'P': 1, 'N': 2, 'B': 3, 'R': 4, 'Q': 5, 'K': 6,
  'p': 1, 'n': 2, 'b': 3, 'r': 4, 'q': 5, 'k': 6,
  '1': -1, '2': -2, '3': -3, '4': -4, '5': -5, '6': -6, '7': -7, '8': -8
};

const atoiIndex = {
  'P': 0, 'N': 0, 'B': 0, 'R': 0, 'Q': 0, 'K': 0,
  'p': 1, 'n': 1, 'b': 1, 'r': 1, 'q': 1, 'k': 1,
};

function position(board,stm,rights,ep) {

  pieceList.fill(0);
  pieceCount.fill(1);

  let sq = 0;

  for (let i=0; i < board.length; i++) {
    const ch = board[i];
    if (ch == '/')
      continue;
    const p = atoiPiece[ch];
    if (p < 0)
      sq -= p;
    else {
      const index = atoiIndex[ch];
      if (p == 6) {
        pieceList[index<<4] = (sq ^ 56) | (p << 8);
      }
      else {
        pieceList[(index<<4) + pieceCount[index]] = (sq ^ 56) | (p << 8);
        pieceCount[index] = pieceCount[index] + 1;
      }
      sq++;
    }
  }

}

//}}}

//}}}

let rights = 0;
let ep     = 0;
let ply    = 0;

//{{{  uciExec

function uciExec(command) {

  const args = command.split(' ');

  switch (args[0]) {

    //{{{  isready
    
    case 'isready':
    
      console.log('readyok');
    
      break;
    
    //}}}
    //{{{  position
    
    case 'position':
    case 'p':
    
      if (args[1] == 'startpos' || args[1] == 's')
        position('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', 'w', 'KQkq', '-');
      else
        position(args[2], args[3], args[4], args[5]);
    
      break;
    
    //}}}
    //{{{  ucinewgame
    
    case 'usenewgame':
    case 'u':
    
      break;
    
    //}}}
    //{{{  board
    
    case 'board':
    case 'b':
    
      printBoard();
    
      break;
    
    //}}}
    //{{{  t
    
    case 't':
    
      position('8/8/k1b5/p7/8/2K5/8/R4N1r', 'w', '-', '-');
      printBoard()
      setOccupied();
      console.log('occupied');
      printBitboard(loOccupied,hiOccupied);
      console.log('rook mask sq 0');
      printBitboard(loRookMasks[0],hiRookMasks[0]);
      console.log('r moves seqs',rookMoveList.length);
    
      break;
    
    //}}}
    //{{{  q
    
    case 'q':
    
      process.exit();
    
    //}}}

    default:
      console.log('?');
  }

}

//}}}
//{{{  initOnce

function initOnce () {

  const t1 = performance.now();

  initRookMasks();
  initRookMoveList();

  const t2 = performance.now();
  const d = t2 - t1;

  console.log('initOnce',d,'ms');

}

//}}}

initOnce();

//{{{  read/write stdin/stdout

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on("line", (line) => {
  uciExec(line.trim());
});

//}}}

