
"use strict";

//{{{  prng
//
// https://en.wikipedia.org/wiki/Mersenne_Twister
//

let twisterList  = new Uint32Array(624);
let twisterIndex = 0;

function twisterInit(seed) {

  const mt = twisterList;

  mt[0] = seed >>> 0;

  for (let i = 1; i < 624; i++) {
    mt[i] = (0x6C078965 * (mt[i - 1] ^ (mt[i - 1] >>> 30)) + i) >>> 0;
  }
}

function twisterFill() {

  const mt = twisterList;

  for (let i = 0; i < 624; i++) {
    let y = (mt[i] & 0x80000000) + (mt[(i + 1) % 624] & 0x7FFFFFFF);
    mt[i] = mt[(i + 397) % 624] ^ (y >>> 1);
    if (y % 2 !== 0) {
      mt[i] ^= 0x9908B0DF;
    }
  }
}

function twisterRand() {

  const mt = twisterList;

  if (twisterIndex === 0)
    twisterFill();

  let y = mt[twisterIndex];
  y ^= y >>> 11;
  y ^= (y << 7)  & 0x9D2C5680;
  y ^= (y << 15) & 0xEFC60000;
  y ^= y >>> 18;

  twisterIndex = (twisterIndex + 1) % 624;

  return y >>> 0;
}

function twisterMagic() {

  let r1 = twisterRand() >>> 0;
  let r2 = twisterRand() >>> 0;
  let r3 = twisterRand() >>> 0;
  let r4 = twisterRand() >>> 0;

  // XOR Shift Mix - spreads randomness across all bits
  let magic = (r1 ^ (r2 << 11) ^ (r3 >>> 17) ^ (r4 << 5)) >>> 0;

  return magic;
}

twisterInit(0x9E3779B9);

//}}}
//{{{  stm

let stm = 0;

let stmWhite = 0;
let stmBlack = 1;

//}}}
//{{{  move list

//{{{  magicIndex

function magicIndex(loBlocker, hiBlocker, loMagic, hiMagic, ib) {
  let loProduct = Math.imul(loBlocker, loMagic) >>> 0;
  let hiProduct = Math.imul(hiBlocker, hiMagic) >>> 0;
  let index = (loProduct ^ hiProduct) >>> (64 - ib);
  return index & ((1 << ib) - 1);
}

//}}}

function moveListEntry () {
  this.square     = -1;
  this.moves      = [];
  this.loBlockers = [];
  this.hiBlockers = [];
}

//{{{  moveList_FindBlocker

function moveList_FindBlocker(sq, moveList, loBlocker, hiBlocker) {

  for (let i=0; i < moveList.length; i++) {
    const entry = moveList[i];
    if (entry.square != sq)
      continue;
    for (let j=0; j < entry.loBlockers.length; j++) {
      if (loBlocker == entry.loBlockers[j] && hiBlocker == entry.hiBlockers[j])
        return i;
    }
  }

  return -1;
}

//}}}
//{{{  moveList_FindMoves

function moveList_FindMoves(sq, moveList, moves1) {

  for (let i=0; i < moveList.length; i++) {

    if (moveList[i].square != sq)
      continue;

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
//{{{  movelist_GetBlockers

function moveList_GetBlockers (sq, loMasks, hiMasks) {

  const loBlockers = [];
  const hiBlockers = [];

  const loMask = loMasks[sq];
  const hiMask = hiMasks[sq];

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

    loBlockers.push(loBlocker);
    hiBlockers.push(hiBlocker);
  }

  return {lo: loBlockers, hi: hiBlockers};
}

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

    for (let r=rank+1; r < 7; r++) {
      const bitIndex = r * 8 + file;
      if (bitIndex < 32)
        loMask |= (1 << bitIndex);
      else
        hiMask |= (1 << (bitIndex - 32));
    }

    for (let r=rank-1; r > 0; r--) {
      const bitIndex = r * 8 + file;
      if (bitIndex < 32)
        loMask |= (1 << bitIndex);
      else
        hiMask |= (1 << (bitIndex - 32));
    }

    for (let f=file+1; f < 7; f++) {
      const bitIndex = rank * 8 + f;
      if (bitIndex < 32)
        loMask |= (1 << bitIndex);
      else
        hiMask |= (1 << (bitIndex - 32));
    }

    for (let f=file-1; f > 0; f--) {
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
//{{{  initRookMoveList

function initRookMoveList() {

  for (let sq=0; sq < 64; sq++) {

    const blockers = moveList_GetBlockers(sq, loRookMasks, hiRookMasks)

    const loBlockers = blockers.lo;
    const hiBlockers = blockers.hi;

    for (let i=0; i < loBlockers.length; i++) {

      const loBlocker = loBlockers[i];
      const hiBlocker = hiBlockers[i];

      const moves = initRookMoveList_GetMoves (sq, loBlocker, hiBlocker)
      const index = moveList_FindMoves(sq, rookMoveList, moves);

      if (index >= 0) {
        const entry = rookMoveList[index];
        entry.loBlockers.push(loBlocker);
        entry.hiBlockers.push(hiBlocker);
        entry.square = sq;
      }

      else {
        const entry = new moveListEntry();
        rookMoveList.push(entry);
        entry.moves = moves;
        entry.loBlockers.push(loBlocker);
        entry.hiBlockers.push(hiBlocker);
        entry.square = sq;
      }

    }
  }
}

//}}}

//}}}
//{{{  findRookMagics

const rookIndexBits = 12;
const rookIndexSize = 4096;

//const loRookMagics = new Array(64);
//const hiRookMagics = new Array(64);

function findRookMagics () {

  const lut = Array(rookIndexSize);  // reused for each square

  let success = true;

  for (let sq=0; sq < 64; sq++) {

    const blockers = moveList_GetBlockers(sq, loRookMasks, hiRookMasks)

    const loBlockers = blockers.lo;
    const hiBlockers = blockers.hi;

    for (let t=0; t < 10000000; t++) {

      lut.fill(-1);

      let loMagic = twisterMagic() >>> 0;
      let hiMagic = twisterMagic() >>> 0;

      success = true;

      //{{{  test all blockers with this magic
      
      for (let i=0; i < loBlockers.length; i++) {
      
        const loBlocker = loBlockers[i];
        const hiBlocker = hiBlockers[i];
      
        const moveListEntry = moveList_FindBlocker(sq, rookMoveList, loBlocker, hiBlocker);
      
        if (moveListEntry == -1)
          console.log('blocker missing from move list');
      
        const lutIndex = magicIndex(loBlocker, hiBlocker, loMagic, hiMagic, rookIndexBits);
      
        if (lutIndex < 0 || lutIndex >= rookIndexSize)
          console.log('lut index out of range', lutIndex);
      
        const lutVal = lut[lutIndex];
      
        if (lutVal == -1) {
          lut[lutIndex] = moveListEntry;
        }
      
        else if (moveListEntry == lutVal) {
          ;
        }
      
        else {
          success = false;
          break;
        }
      }
      
      //}}}

      if (success) {
        console.log('found rook magic for square', sq, 'attempts', t+1);
        loRookMagics[sq] = loMagic;
        hiRookMagics[sq] = hiMagic;
        break;
      }
    }

    if (!success) {
      console.log('rook magic for failed for square', sq);
      break;
    }
  }
}

function logRookMagics() {
  console.log("const loRookMagics = [");
  for (let i = 0; i < 64; i++) {
    console.log(`  0x${loRookMagics[i].toString(16)},`);
  }
  console.log("];\n");

  console.log("const hiRookMagics = [");
  for (let i = 0; i < 64; i++) {
    console.log(`  0x${hiRookMagics[i].toString(16)},`);
  }
  console.log("];");
}

//}}}
//{{{  initRookLut

const rookLut = Array(64 * rookIndexSize);

function initRookLut () {

  for (let sq=0; sq < 64; sq++) {

    let loMagic = loRookMagics[sq];
    let hiMagic = hiRookMagics[sq];

    const blockers = moveList_GetBlockers(sq, loRookMasks, hiRookMasks)

    const loBlockers = blockers.lo;
    const hiBlockers = blockers.hi;

    for (let i=0; i < loBlockers.length; i++) {

      const loBlocker = loBlockers[i];
      const hiBlocker = hiBlockers[i];

      const moveListEntry = moveList_FindBlocker(sq, rookMoveList, loBlocker, hiBlocker);

      if (moveListEntry == -1)
        console.log('blocker missing from move list');

      const index = magicIndex(loBlocker, hiBlocker, loMagic, hiMagic, rookIndexBits);

      if (index < 0 || index >= rookIndexSize)
        console.log('index out of range', lutIndex);

      rookLut[sq * rookIndexSize + index] = moveListEntry;
    }
  }
}

//}}}

//{{{  initBishopMasks

const loBishopMasks = new Array(64);
const hiBishopMasks = new Array(64);

function initBishopMasks() {

  for (let sq=0; sq < 64; sq++) {

    const file = sq % 8;
    const rank = Math.floor(sq / 8);

    let loMask = 0;
    let hiMask = 0;

    for (let r=rank+1, f=file+1; r < 7 && f < 7; r++, f++) {
      const bitIndex = r * 8 + f;
      if (bitIndex < 32)
        loMask |= (1 << bitIndex);
      else
        hiMask |= (1 << (bitIndex - 32));
    }

    for (let r=rank+1, f=file-1; r < 7 && f > 0; r++, f--) {
      const bitIndex = r * 8 + f;
      if (bitIndex < 32)
        loMask |= (1 << bitIndex);
      else
        hiMask |= (1 << (bitIndex - 32));
    }

    for (let r=rank-1, f=file+1; r > 0 && f < 7; r--, f++) {
      const bitIndex = r * 8 + f;
      if (bitIndex < 32)
        loMask |= (1 << bitIndex);
      else
        hiMask |= (1 << (bitIndex - 32));
    }

    for (let r=rank-1, f=file-1; r > 0 && f > 0; r--, f--) {
      const bitIndex = r * 8 + f;
      if (bitIndex < 32)
        loMask |= (1 << bitIndex);
      else
        hiMask |= (1 << (bitIndex - 32));
    }

    loBishopMasks[sq] = loMask;
    hiBishopMasks[sq] = hiMask;
  }
}

//}}}
//{{{  initBishopMoveList

const bishopMoveList = [];

//{{{  initBishopMoveList_GetMoves

function initBishopMoveList_GetMoves(from, loBlocker, hiBlocker) {

  const moves = [];
  const file = from % 8;
  const rank = Math.floor(from / 8);

  let to = from;
  for (let r=rank+1, f=file+1; r < 8 && f < 8; r++, f++) {
    to += 9;
    moves.push((from << 6) | to);
    if (isBitSet(to, loBlocker, hiBlocker))
      break;
  }

  to = from;
  for (let r=rank+1, f=file-1; r < 8 && f >= 0; r++, f--) {
    to += 7;
    moves.push((from << 6) | to);
    if (isBitSet(to, loBlocker, hiBlocker))
      break;
  }

  to = from;
  for (let r=rank-1, f=file+1; r >= 0 && f < 8; r--, f++) {
    to -= 7;
    moves.push((from << 6) | to);
    if (isBitSet(to, loBlocker, hiBlocker))
      break;
  }

  to = from;
  for (let r=rank-1, f=file-1; r >= 0 && f >= 0; r--, f--) {
    to -= 9;
    moves.push((from << 6) | to);
    if (isBitSet(to, loBlocker, hiBlocker))
      break;
  }

  return moves;
}

//}}}
//{{{  initBishopMoveList

function initBishopMoveList() {

  for (let sq=0; sq < 64; sq++) {

    const blockers = moveList_GetBlockers(sq, loBishopMasks, hiBishopMasks)

    const loBlockers = blockers.lo;
    const hiBlockers = blockers.hi;

    for (let i=0; i < loBlockers.length; i++) {

      const loBlocker = loBlockers[i];
      const hiBlocker = hiBlockers[i];

      const moves = initBishopMoveList_GetMoves (sq, loBlocker, hiBlocker)
      const index = moveList_FindMoves(sq, bishopMoveList, moves);

      if (index >= 0) {
        const entry = bishopMoveList[index];
        entry.loBlockers.push(loBlocker);
        entry.hiBlockers.push(hiBlocker);
        entry.square = sq;
      }

      else {
        const entry = new moveListEntry();
        bishopMoveList.push(entry);
        entry.moves = moves;
        entry.loBlockers.push(loBlocker);
        entry.hiBlockers.push(hiBlocker);
        entry.square = sq;
      }

    }
  }
}

//}}}

//}}}
//{{{  findBishopMagics

const bishopIndexBits = 10;
const bishopIndexSize = 1024;

//const loBishopMagics = new Array(64);
//const hiBishopMagics = new Array(64);

function findBishopMagics () {

  const lut = Array(bishopIndexSize);

  let success = true;

  for (let sq=0; sq < 64; sq++) {

    const blockers = moveList_GetBlockers(sq, loBishopMasks, hiBishopMasks)

    const loBlockers = blockers.lo;
    const hiBlockers = blockers.hi;

    for (let t=0; t < 10000000; t++) {

      lut.fill(-1);

      let loMagic = twisterRand() >>> 0;
      let hiMagic = twisterRand() >>> 0;

      success = true;

      //{{{  test all blockers with this magic
      
      for (let i=0; i < loBlockers.length; i++) {
      
        const loBlocker = loBlockers[i];
        const hiBlocker = hiBlockers[i];
      
        const moveListEntry = moveList_FindBlocker(sq, bishopMoveList, loBlocker, hiBlocker);
      
        if (moveListEntry == -1)
          console.log('blocker missing from move list');
      
        const lutIndex = magicIndex(loBlocker, hiBlocker, loMagic, hiMagic, bishopIndexBits);
      
        if (lutIndex < 0 || lutIndex >= bishopIndexSize)
          console.log('lut index out of range', lutIndex);
      
        const lutVal = lut[lutIndex];
      
        if (lutVal == -1) {
          lut[lutIndex] = moveListEntry;
        }
      
        else if (moveListEntry == lutVal) {
          ;
        }
      
        else {
          success = false;
          break;
        }
      }
      
      //}}}

      if (success) {
        console.log('found bishop magic for square', sq, 'attempts', t+1);
        loBishopMagics[sq] = loMagic;
        hiBishopMagics[sq] = hiMagic;
        break;
      }
    }

    if (!success) {
      console.log('bishop magic for failed for square', sq);
      break;
    }
  }
}

function logBishopMagics() {
  console.log("const loBishopMagics = [");
  for (let i = 0; i < 64; i++) {
    console.log(`  0x${loBishopMagics[i].toString(16)},`);
  }
  console.log("];\n");

  console.log("const hiBishopMagics = [");
  for (let i = 0; i < 64; i++) {
    console.log(`  0x${hiBishopMagics[i].toString(16)},`);
  }
  console.log("];");
}

//}}}
//{{{  initBishopLut

const bishopLut = Array(64 * bishopIndexSize);

function initBishopLut () {

  for (let sq=0; sq < 64; sq++) {

    let loMagic = loBishopMagics[sq];
    let hiMagic = hiBishopMagics[sq];

    const blockers = moveList_GetBlockers(sq, loBishopMasks, hiBishopMasks)

    const loBlockers = blockers.lo;
    const hiBlockers = blockers.hi;

    for (let i=0; i < loBlockers.length; i++) {

      const loBlocker = loBlockers[i];
      const hiBlocker = hiBlockers[i];

      const moveListEntry = moveList_FindBlocker(sq, bishopMoveList, loBlocker, hiBlocker);

      if (moveListEntry == -1)
        console.log('blocker missing from move list');

      const index = magicIndex(loBlocker, hiBlocker, loMagic, hiMagic, bishopIndexBits);

      if (index < 0 || index >= bishopIndexSize)
        console.log('index out of range', lutIndex);

      bishopLut[sq * bishopIndexSize + index] = moveListEntry;
    }
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
    
      const lutIndex = magicIndex(loOccupied & loRookMasks[0],
                                  hiOccupied & hiRookMasks[0],
                                  loRookMagics[0],
                                  hiRookMagics[0],
                                  rookIndexBits);
    
      const moveListIndex = rookLut[lutIndex];
      const moves = rookMoveList[moveListIndex].moves;
    
      console.log('rook lut index', lutIndex,
                  'rook move index', moveListIndex,
                  'move list entry sq', rookMoveList[moveListIndex].square,
                  'num moves', moves.length);
    
      for (let i=0; i < moves.length; i++)
        console.log((moves[i] >>> 6) & 0x3F, moves[i] & 0x3F);
    
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

//{{{  magics

const loRookMagics = [
  0x6e001461,
  0xe2001152,
  0xc6000866,
  0x6000452,
  0xb2003052,
  0xbf8006cd,
  0x6e005c22,
  0xb5000ae7,
  0xef2400a8,
  0x50f0012e,
  0xaec02020,
  0xa03a040c,
  0xdd910023,
  0xfeafe01c,
  0xf5e90033,
  0xb14c408d,
  0xb8595b80,
  0x662ff008,
  0x68700208,
  0xcbcaa002,
  0x76142404,
  0xf90bb004,
  0xf9ab400a,
  0x62cb3ff1,
  0x2d8f05b1,
  0xd8d6afe,
  0xc604165b,
  0x12323d2a,
  0xffc5fe4e,
  0xde68dc2,
  0x8c7954ec,
  0x8a727d6a,
  0xcb04e417,
  0xd313eea0,
  0x4f540201,
  0x5f3a7ad0,
  0x645673bd,
  0x42084005,
  0x652714ee,
  0x5fad77a3,
  0x2d612204,
  0x828d225,
  0xd1399219,
  0x3c0e6,
  0x13ffa34,
  0x5a169d2e,
  0xa1ebae8e,
  0xa4052e29,
  0x63abf7c2,
  0x1a0441a0,
  0x804514c1,
  0xbd4fcc45,
  0x8c575a0c,
  0x5a7f1251,
  0xc6bb6c4a,
  0xbae84ec3,
  0xdebf00c6,
  0xc3341d0a,
  0x6f77d186,
  0xa1796f70,
  0x9872241a,
  0x92f5422c,
  0x2f33a06f,
  0x8ae5a2a7
];

const hiRookMagics = [
  0xab089226,
  0x9a99893a,
  0x74e775ca,
  0xc9a3080e,
  0x8996c8a0,
  0x6bcc2980,
  0xd40994a,
  0x3938b37e,
  0xbd1e6c3b,
  0x4b51ebd8,
  0xcac60017,
  0x52408013,
  0xed924756,
  0xe8d6c009,
  0x17fbd79c,
  0x4d488004,
  0xfb83a341,
  0x1694ce28,
  0xba24ef18,
  0x851eea92,
  0x6c125f5a,
  0xbbc781ab,
  0xa3076df2,
  0x3a879720,
  0x1b5e2c48,
  0x9b5a0dd8,
  0x570a561f,
  0x7850d233,
  0x83342863,
  0x1971e8ac,
  0x8a522579,
  0xd2949f4,
  0xa0024845,
  0xf6bffbec,
  0xc27c9,
  0x40127c,
  0x3b001631,
  0xd7c2a480,
  0x5e001794,
  0x95001766,
  0x5de80089,
  0x4f1dffeb,
  0x1880149,
  0xfe4a0006,
  0x1b3c8009,
  0xc107fdc,
  0xf2420201,
  0x25bff58,
  0x78bad200,
  0x2cc8f340,
  0x650da900,
  0x80ecc700,
  0xd7d25f80,
  0xfa18ef00,
  0x7497280,
  0xe24ee180,
  0xe8d38062,
  0xec84c7de,
  0xa637cd76,
  0xba3c2c39,
  0x4cc27546,
  0x25beaf29,
  0x4eec3e9d,
  0x14eec425
];

const loBishopMagics = [
  0x99f2d81,
  0xef504ea3,
  0x2357766c,
  0x201aa932,
  0xf5d01442,
  0xb9510a23,
  0x2cead1e3,
  0x5e0ed975,
  0x5973e0c2,
  0xc8d335c2,
  0x3c123a7a,
  0x2d57a8a9,
  0xb8bdb6e7,
  0x393b65fa,
  0x85bacf57,
  0x2a171c56,
  0x751e8c82,
  0x917735b3,
  0x537efa30,
  0x855c0426,
  0xb27341c2,
  0xbfda91a6,
  0xefe43c17,
  0x9c236905,
  0xc15c84c1,
  0xeef13a5e,
  0x809d79c3,
  0x275c2008,
  0x1c24afd5,
  0xdcb80304,
  0x871af3b4,
  0xce62c4dc,
  0x8f5df2bc,
  0x3e25bdb0,
  0x95075910,
  0xaf950218,
  0xbda44404,
  0xe6d21b5f,
  0xa2028b3a,
  0x434fb8a9,
  0x361d349b,
  0xc154b286,
  0x37261f61,
  0xc7e6f51d,
  0x5dd9a0d9,
  0x45d22310,
  0x221017ea,
  0x3ce28672,
  0xcbe3d349,
  0x2b2b5dda,
  0x676ca015,
  0x10581cb5,
  0xd5403ba7,
  0x1b681165,
  0x6616b5d8,
  0x98e6bf9e,
  0x104c202c,
  0x876684f4,
  0x393f9881,
  0xb8990058,
  0xe3491f0e,
  0xc97cd494,
  0xca34e99e,
  0x7efc6062
];

const hiBishopMagics = [
  0xa8ede275,
  0x7a92c056,
  0xc3b7b8ae,
  0xafa36ff6,
  0xd0d843b8,
  0x7e548afa,
  0xaf1367b7,
  0x63b71ee,
  0x12d1f70c,
  0x5547737a,
  0x28ed1b02,
  0x7c534849,
  0x2f37114,
  0x6919baf5,
  0x796a5a31,
  0x8b8ec150,
  0x99e3fe93,
  0x74eae933,
  0x6932fde9,
  0x637cf98,
  0xf85ebddd,
  0xa65f7260,
  0xd9674c25,
  0x3e81da4d,
  0x24b4bb7d,
  0x10db25ee,
  0xfaf8236,
  0xd0fcfd62,
  0x8c004061,
  0x21f46519,
  0x6bafad0d,
  0xba222416,
  0x9467fed,
  0x397758a8,
  0xa0363ef4,
  0xcfcc43b3,
  0x60d21034,
  0xce0cee59,
  0x129f57ee,
  0x5129c2ef,
  0xae7aa3d7,
  0xfaba75aa,
  0xd89d0d0e,
  0xf34edf39,
  0x756dfa20,
  0xdd6285dd,
  0x1b6d4441,
  0x852390d6,
  0xef35f78f,
  0x3022a444,
  0xe45e86bf,
  0x321b7cf9,
  0xb05e4e1d,
  0x47dff266,
  0xf0be9566,
  0x7d616166,
  0x7dc8c40c,
  0xe409389f,
  0x498f9291,
  0xfd065e2d,
  0x102c3a50,
  0xfad2b781,
  0xbd7fbbc,
  0x5c5b379c
];

//}}}

function initOnce () {

  const t1 = performance.now();

  initRookMasks();
  initBishopMasks();

  initRookMoveList();
  initBishopMoveList();

  console.log(rookMoveList.length, bishopMoveList.length);

  //findRookMagics();
  //findBishopMagics();

  //logRookMagics();
  //logBishopMagics();

  initRookLut();
  initBishopLut();

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

