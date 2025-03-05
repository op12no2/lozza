
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
  return twisterRand();
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
  this.moves      = [];
  this.loBlockers = [];
  this.hiBlockers = [];
}

//{{{  moveList_FindBlocker

function moveList_FindBlocker(moveList, loBlocker, hiBlocker) {

  for (let i=0; i < moveList.length; i++) {
    const entry = moveList[i];
    for (let j=0; j < entry.loBlockers.length; j++) {
      if (loBlocker == entry.loBlockers[j] && hiBlocker == entry.hiBlockers[j])
        return i;
    }
  }

  return -1;
}

//}}}
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

    }
  }
}

//}}}

//}}}
//{{{  findRookMagics

const rookIndexBits = 13;
const rookIndexSize = 8192;

//const loRookMagics = new Array(64);
//const hiRookMagics = new Array(64);

function findRookMagics () {

  const lut = Array(rookIndexSize);  // reused for each square

  let success = true;

  for (let sq=0; sq < 64; sq++) {

    const blockers = moveList_GetBlockers(sq, loRookMasks, hiRookMasks)

    const loBlockers = blockers.lo;
    const hiBlockers = blockers.hi;

    for (let t=0; t < 1000000; t++) {

      lut.fill(-1);

      let loMagic = twisterMagic() >>> 0;
      let hiMagic = twisterMagic() >>> 0;

      success = true;

      //{{{  test all blockers with this magic
      
      for (let i=0; i < loBlockers.length; i++) {
      
        const loBlocker = loBlockers[i];
        const hiBlocker = hiBlockers[i];
      
        const moveListEntry = moveList_FindBlocker(rookMoveList, loBlocker, hiBlocker);
      
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
      const index = moveList_FindMoves(bishopMoveList, moves);

      if (index >= 0) {
        const entry = bishopMoveList[index];
        entry.loBlockers.push(loBlocker);
        entry.hiBlockers.push(hiBlocker);
      }

      else {
        const entry = new moveListEntry();
        bishopMoveList.push(entry);
        entry.moves = moves;
        entry.loBlockers.push(loBlocker);
        entry.hiBlockers.push(hiBlocker);
      }

    }
  }
}

//}}}

//}}}
//{{{  findBishopMagics

const bishopIndexBits = 11;
const bishopIndexSize = 2048;

//const loBishopMagics = new Array(64);
//const hiBishopMagics = new Array(64);

function findBishopMagics () {

  const lut = Array(bishopIndexSize);

  let success = true;

  for (let sq=0; sq < 64; sq++) {

    const blockers = moveList_GetBlockers(sq, loBishopMasks, hiBishopMasks)

    const loBlockers = blockers.lo;
    const hiBlockers = blockers.hi;

    for (let t=0; t < 1000000; t++) {

      lut.fill(-1);

      let loMagic = twisterRand() >>> 0;
      let hiMagic = twisterRand() >>> 0;

      success = true;

      //{{{  test all blockers with this magic
      
      for (let i=0; i < loBlockers.length; i++) {
      
        const loBlocker = loBlockers[i];
        const hiBlocker = hiBlockers[i];
      
        const moveListEntry = moveList_FindBlocker(bishopMoveList, loBlocker, hiBlocker);
      
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
      console.log('bishop mask sq 20');
      printBitboard(loBishopMasks[20],hiBishopMasks[20]);
    
      console.log('r moves seqs',rookMoveList.length);
      console.log('r moves seqs',bishopMoveList.length);
    
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
  initBishopMasks();

  initRookMoveList();
  initBishopMoveList();

  //{{{  rook magics
  
  //findRookMagics();
  //logRookMagics();
  
  const loRookMagics = [
    0x51c00046,
    0x40024024,
    0x48004762,
    0x20fff29f,
    0x2f0000f7,
    0x4d800b8c,
    0x8d000142,
    0xa0fffcef,
    0xe9e0040,
    0xb36bff77,
    0xa0981ff9,
    0x245d8008,
    0x4b96fbfc,
    0x52003f7e,
    0x1558b52e,
    0x5ab0029d,
    0x895780c0,
    0xf734020,
    0x5dfe601e,
    0x4876001,
    0xe3e95ffc,
    0xd88b6801,
    0xfa8057ff,
    0xc106b801,
    0x6893f66,
    0xfe8699fb,
    0x34e56b4a,
    0x4b9b0285,
    0x1a291971,
    0xfef68d86,
    0xd8eaead6,
    0x2c821b2e,
    0xe188dd08,
    0x282acde9,
    0xd1942030,
    0xee48c778,
    0x268aadb8,
    0x8f169d22,
    0x88baf93,
    0xa8dca001,
    0x6c48a5f0,
    0x850ca01c,
    0xe9cacb71,
    0xb0904050,
    0x116263ea,
    0xcf388d74,
    0xeffd2cc2,
    0x695a9083,
    0xb592bc41,
    0x3822800c,
    0x1acc2de1,
    0xada04e11,
    0xc660816,
    0x35d0be4c,
    0x57eb6de,
    0xe996eec5,
    0x7e3d609d,
    0xd931465a,
    0x6cf48a2,
    0x2168b0ef,
    0x7793f75f,
    0xb9a8389d,
    0x3c409e89,
    0x147a16cb
  ];
  
  const hiRookMagics = [
    0x63130921,
    0xe771ed47,
    0xf84a1100,
    0x810a442,
    0x2fe9d814,
    0x704e6a05,
    0xa63f173,
    0xba9e327a,
    0x2928810a,
    0xb64da001,
    0x1899c340,
    0x20ed8e0f,
    0x89c1f637,
    0x93a877d2,
    0xd380800e,
    0x2757f880,
    0x361703d,
    0x722d0c7c,
    0x9db7cb80,
    0x4aef914a,
    0xfb3c5001,
    0x5a44555e,
    0x59698b2a,
    0xe300fcfa,
    0xa721b348,
    0xe637b61e,
    0xbcab3c9b,
    0x9899b3c4,
    0x595c13e3,
    0xee62fc57,
    0x71cdbe45,
    0xc7f859c1,
    0xeeffe6b6,
    0x5a100102,
    0xf009a07a,
    0xdff973f3,
    0x49000bcd,
    0x4a1f3e06,
    0x5b0015bf,
    0xdb4b6f9e,
    0x38882005,
    0xd2d801f3,
    0x5f050008,
    0x57bc5750,
    0x1b0a0009,
    0x5e3f0054,
    0xefff8206,
    0x181ff7c,
    0xaef74600,
    0x84ebbc3b,
    0x8e6caf00,
    0x7b26025b,
    0x759e9998,
    0x976b2300,
    0x693b6700,
    0x756c2700,
    0x3808829e,
    0x56368bbe,
    0xfb6d5b3a,
    0xfe0c767f,
    0x402db043,
    0x5caf0cc7,
    0xc605572d,
    0x501e8e55
  ];
  
  //}}}
  //{{{  bishop magics
  
  //findBishopMagics();
  //logBishopMagics();
  
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
    0xabda89f7,
    0x6f2af5f9,
    0xbdfdbc34,
    0x27c3fa3a,
    0xd54dd13c,
    0x4ab9fdcd,
    0x628b0aaa,
    0xc62a843d,
    0xda94022,
    0x41e10042,
    0x12ba0200,
    0x4f9c0c0b,
    0x72658271,
    0xcc09be38,
    0x535c07ad,
    0xd8597783,
    0xc92af131,
    0x218b0101,
    0xeaa40144,
    0x8508b04d,
    0xca2babaa,
    0x149262fb,
    0x6e57e436,
    0x95106a1a,
    0x3515c7b8,
    0xc95ddd24,
    0xac8c0267,
    0x2e42d3cb,
    0x936c6dc9,
    0xb3f6a83a,
    0x506cf5ed,
    0xf0680bc9,
    0x636b2de4,
    0x855c138e,
    0xdad1b60a,
    0xda93e397,
    0x4d54ded5,
    0x659ba305,
    0xfe7d86a8,
    0x2dc3c9ae,
    0x235ca3ce,
    0xc44354d1,
    0xe8572559,
    0xbfa2a147,
    0x5d9ba072,
    0x3c1f9592
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
    0x80145755,
    0x1f67d28c,
    0x2366b2c3,
    0x572457dd,
    0xf3fcc8aa,
    0x88047a46,
    0xe5c64a81,
    0xc9834d5d,
    0x291133cc,
    0x376a71f8,
    0x2fb67eeb,
    0xc17106d4,
    0x37c6c0a7,
    0xca713686,
    0x9f0f848e,
    0x9720500c,
    0x41af6598,
    0x12a82308,
    0x4fb0501b,
    0x7f60faf,
    0xbd08f017,
    0x4d0bb2bc,
    0x417886ea,
    0x1ade6279,
    0xf3a79ff0,
    0xc3e645e,
    0xdb0f2e86,
    0xffcfcfb5,
    0x6a7b3cd8,
    0x50e4ba7b,
    0x8bb086e3,
    0xb055b11e,
    0x832e97fb,
    0x8c4454ee,
    0xc858d024,
    0xd28d6b3f,
    0x438b9429,
    0xfc062897,
    0x117d5396,
    0x604cb7,
    0x157d76d9,
    0x4d8202f8,
    0xf7ac57e3,
    0x3676dc9c,
    0xd58eb35a,
    0x1da6c972
  ];
  
  //}}}

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

