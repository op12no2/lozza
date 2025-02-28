
"use strict";

//{{{  stm

let stm = 0;

let stmWhite = 0;
let stmBlack = 1;

//}}}
//{{{  magic

const loRookMask    = new Uint32Array(64);
const hiRookMask    = new Uint32Array(64);
const rookIndexBits = new Int32Array(64);
const rookOffsets   = new Int32Array(64);
const loRookMagics  = new Uint32Array(64);
const hiRookMagics  = new Uint32Array(64);

const rookMagics    = new Array(64);

const loBishopMask    = new Uint32Array(64);
const hiBishopMask    = new Uint32Array(64);
const bishopIndexBits = new Int32Array(64);
const bishopOffsets   = new Int32Array(64);
const loBishopMagics  = new Uint32Array(64);
const hiBishopMagics  = new Uint32Array(64);


const occupied = new Uint32Array(2);

//{{{  genRookMasks

function genRookMasks() {

    for (let square = 0; square < 64; square++) {
        let file = square % 8;
        let rank = Math.floor(square / 8);

        let loMask = 0, hiMask = 0;

        for (let r = rank + 1; r < 7; r++) {
            let bitIndex = r * 8 + file;
            if (bitIndex < 32) loMask |= (1 << bitIndex);
            else hiMask |= (1 << (bitIndex - 32));
        }

        for (let f = file + 1; f < 7; f++) {
            let bitIndex = rank * 8 + f;
            if (bitIndex < 32) loMask |= (1 << bitIndex);
            else hiMask |= (1 << (bitIndex - 32));
        }

        loRookMask[square] = loMask;
        hiRookMask[square] = hiMask;
    }
}

//}}}
//{{{  genBishopMasks

function genBishopMasks() {
    for (let square = 0; square < 64; square++) {
        let file = square % 8;
        let rank = Math.floor(square / 8);

        let loMask = 0, hiMask = 0;

        for (let d = 1; d < 7; d++) {
            let upRight = (rank + d) * 8 + (file + d);
            let upLeft = (rank + d) * 8 + (file - d);
            let downRight = (rank - d) * 8 + (file + d);
            let downLeft = (rank - d) * 8 + (file - d);

            for (let bitIndex of [upRight, upLeft, downRight, downLeft]) {
                if (bitIndex >= 0 && bitIndex < 64) {
                    if (bitIndex < 32) loMask |= (1 << bitIndex);
                    else hiMask |= (1 << (bitIndex - 32));
                }
            }
        }

        loBishopMask[square] = loMask;
        hiBishopMask[square] = hiMask;
    }
}

//}}}

//{{{  genOffsets

function genOffsets(offsets, indexBits) {

    let offset = 0;

    for (let square = 0; square < 64; square++) {
        // Compute number of unique indices for the square
        let size = 1 << indexBits[square];   // 2^index_bits for rooks

        // Store the accumulated offset
        offsets[square] = offset;

        // Accumulate total size
        offset += size;
    }
}

//}}}
//{{{  genIndexBits

function genIndexBits(lo, hi, ib) {

    for (let square = 0; square < 64; square++) {
        let maskLow  = lo[square];  // Low 32 bits of the mask
        let maskHigh = hi[square]; // High 32 bits of the mask

        // Count the number of bits set (popcount)
        let indexBits = popcount(maskLow) + popcount(maskHigh);

        // Store in lookup table
        ib[square] = indexBits;
    }
}

//}}}
//{{{  genOccupied

//hack maintain in makemove

function genOccupied () {

  for (let i=0; i < pieceCount[stmWhite]; i++) {
    const e = pieceList[i];
    const sq = e & 0xFF;
    setBit(occupied, sq);
  }

  for (let i=0; i < pieceCount[stmBlack]; i++) {
    const e = pieceList[16+i];
    const sq = e & 0xFF;
    setBit(occupied, sq);
  }
}

//}}}

//{{{  popcount

function popcount(n) {
    let count = 0;
    while (n) {
        count += n & 1;
        n >>>= 1;
    }
    return count;
}

//}}}
//{{{  setBit

function setBit(bitboard, sq) {
  bitboard[sq >>> 5] |= (1 << (sq & 31));
}

//}}}
//{{{  printBitboard

function printBitboard(low, high) {

    let board = "";

    for (let rank = 7; rank >= 0; rank--) { // Start from rank 8 (index 7) to rank 1 (index 0)
        for (let file = 0; file < 8; file++) { // A to H
            let bitIndex = rank * 8 + file;
            let bitSet = bitIndex < 32
                ? (low & (1 << bitIndex)) !== 0
                : (high & (1 << (bitIndex - 32))) !== 0;

            board += bitSet ? "X" : ".";
        }
        board += "\n"; // New rank
    }

    console.log(board);
}

//}}}

//{{{  

function genBishopMagics() {
    for (let square = 0; square < 64; square++) {
        console.log(`Finding magic for bishop on square ${square}...`);
        let [magicLow, magicHigh] = findMagicNumber(square, false);
        loBishopMagics[square] = magicLow;
        hiBishopMagics[square] = magicHigh;
        console.log(square);
    }
}

function genRookMagics() {
    for (let square = 0; square < 64; square++) {
        console.log(`Finding magic for rook on square ${square}...`);
        let [magicLow, magicHigh] = findMagicNumber(square, true);
        loRookMagics[square] = magicLow;
        hiRookMagics[square] = magicHigh;
    }
}

function findMagicNumber(square, isRook) {
    let indexBits = isRook ? rookIndexBits[square] : bishopIndexBits[square];
    let numBlockerConfigs = 1 << indexBits;
    let maskLow = isRook ? loRookMask[square] : loBishopMask[square];
    let maskHigh = isRook ? hiRookMask[square] : hiBishopMask[square];

    let blockerConfigs = [];
    let subsetLow = 0, subsetHigh = 0;
    do {
        blockerConfigs.push([subsetLow, subsetHigh]);
        subsetLow = (subsetLow - maskLow) & maskLow;
        subsetHigh = (subsetHigh - maskHigh) & maskHigh;
    } while (subsetLow || subsetHigh);

    let attempt = 0;
    while (attempt < 50_000_000) { // Increase attempts for difficult squares
        let [magicLow, magicHigh] = generate64BitMagic();

        let usedIndices = new Set();
        let collision = false;

        for (let [blockersLow, blockersHigh] of blockerConfigs) {
            let index = getMagicIndex(blockersLow, blockersHigh, magicLow, magicHigh, indexBits);
            if (usedIndices.has(index)) {
                collision = true;
                break;
            }
            usedIndices.add(index);
        }

        if (!collision) return [magicLow, magicHigh]; // Found a valid magic number
        attempt++;
    }

    console.error(`Failed to find magic for square ${square} after ${attempt} attempts!`);
    return [0, 0]; // Fallback case (should rarely happen)
}

// ? Computes the magic index using full 64-bit multiplication
function getMagicIndex(blockersLow, blockersHigh, magicLow, magicHigh, indexBits) {
    let productLow = (blockersLow * magicLow) >>> 0;
    let productHigh = (blockersHigh * magicHigh) >>> 0;
    return (productLow ^ productHigh) >>> (64 - indexBits);
}

// ? Generates a strong 64-bit magic number as two 32-bit values
function generate64BitMagic() {
    let low = (Math.random() * 0xFFFFFFFF) >>> 0;
    let high = (Math.random() * 0xFFFFFFFF) >>> 0;

    // Apply known constraints to improve bit spreading
    low |= 0x0000000080000001;   // Ensure at least one important bit is set
    high |= 0x0000000080000001;  // Ensure upper 32 bits contribute

    return [low, high];
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
//{{{  genMoves

function genMoves () {

  genOccupied();

  const offset = stm << 4;
  const count  = pieceCount[stm];

  for (let i=0; i < count; i++) {

    const e     = pieceList[offset + i];
    const sq    = e & 0xFF;
    const piece = (e & 0xFF00) >>> 8;

    // hack finish
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
      printBitboard(loRookMask[0],hiRookMask[0]);
      console.log(rookIndexBits[0]);
      genOccupied();
      printBitboard(occupied[0],occupied[1]);
    
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

  genRookMasks();
  genBishopMasks();

  genIndexBits(loRookMask,   hiRookMask,   rookIndexBits);
  genIndexBits(loBishopMask, hiBishopMask, bishopIndexBits);

  genOffsets(rookOffsets,   rookIndexBits);
  genOffsets(bishopOffsets, bishopIndexBits);

  genRookMagics();
  genBishopMagics();

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

