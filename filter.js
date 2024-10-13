//
// Filter and simplify FENs from datagen.js for trainer.js.
//

//{{{  lang fold
/*

*/

//}}}

const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rawFiles = ['data/x'];
const filterFile = 'data/y';

const interp = 0.5;
const K      = 100;

const PART_BOARD      = 0;
const PART_TURN       = 1;
const PART_RIGHTS     = 2;
const PART_EP         = 3;
const PART_GAME       = 4;
const PART_PLY        = 5;
const PART_SCORE      = 6;
const PART_INCHECK    = 7;
const PART_NOISY      = 8;
const PART_WDL        = 9;

var indexes = [];
var target = 0.0;
var o = '';
var n = 0;

fs.writeFileSync(filterFile,o);

//{{{  sigmoid

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x / K));
}

//}}}
//{{{  lerp

function lerp(eval, wdl, t) {
  let sg = sigmoid(eval);
  let l = sg + (wdl - sg) * t;
  return l;
}

//}}}
//{{{  decodeLine

//{{{  constants

const WHITE = 0;
const BLACK = 1;

const PAWN = 0;
const KNIGHT = 1;
const BISHOP = 2;
const ROOK = 3;
const QUEEN = 4;
const KING = 5;

const chPce = {
  'k': KING, 'q': QUEEN, 'r': ROOK, 'b': BISHOP, 'n': KNIGHT, 'p': PAWN,
  'K': KING, 'Q': QUEEN, 'R': ROOK, 'B': BISHOP, 'N': KNIGHT, 'P': PAWN
};

const chCol = {
  'k': BLACK, 'q': BLACK, 'r': BLACK, 'b': BLACK, 'n': BLACK, 'p': BLACK,
  'K': WHITE, 'Q': WHITE, 'R': WHITE, 'B': WHITE, 'N': WHITE, 'P': WHITE
};

const chNum = {'8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, '1': 1};

//}}}

function decodeLine(line) {

  const parts = line.split(' ');

  const board = parts[PART_BOARD].trim();
  const eval  = parseFloat(parts[PART_SCORE].trim());
  const wdl   = parseFloat(parts[PART_WDL].trim());

  indexes = [];
  target = 0;

  var x = 0;
  var sq = 0;

  if (!skipP(parts)) {

    //{{{  decode board
    
    for (var j = 0; j < board.length; j++) {
      var ch = board.charAt(j);
      if (ch == '/')
        continue;
      var num = chNum[ch];
      if (typeof (num) == 'undefined') {
        if (chCol[ch] == WHITE)
          x = 0 + chPce[ch] * 64 + sq;
        else if (chCol[ch] == BLACK)
          x = 384 + chPce[ch] * 64 + sq;
        else {
          console.log(j,board.length,'colour',board,ch.charCodeAt(0),chCol[ch],'                        ');
          console.log(j,board.length,'colour',board,ch.charCodeAt(0),chCol[ch]);
          console.log(line);
          process.exit();
        }
        if (x < 0 || x > 767 || isNaN(x)) {
          console.log('invalid index - skipping', x, line);
          indexes = [];
          return;
        }
        indexes.push(x);
        sq++;
      }
      else {
        sq += num;
      }
    }
    
    //}}}

    target = lerp(eval,wdl,interp);

    if (indexes.length > 32) {
      console.log('too many pieces - skipping',indexes.length, line);
      indexes = [];
      return;
    }

    if (indexes.length < 2) {
      console.log('too few pieces - skipping',indexes.length, line);
      indexes = [];
      return;
    }
  }
}

//}}}
//{{{  skipP

function skipP (parts) {

  const noisy = parts[PART_NOISY].trim();
  if (noisy == 'n')
    return true;

  const inCh  = parts[PART_INCHECK].trim();
  if (inCh == 'c')
    return true;

  return false;
}

//}}}
//{{{  createLineStream

async function* createLineStream() {
  for (const filename of rawFiles) {
    const fileStream = fs.createReadStream(filename);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    for await (const line of rl) {
      const cleanLine = line.replace(/[\0\r\n]/g, '');
      yield cleanLine;
    }
    rl.close();
  }
}

//}}}
//{{{  filter

async function filter() {

  const lineStream = createLineStream();

  for await (const line of lineStream) {

    decodeLine(line);

    if (indexes.length) {
      n++;
      const iStr = indexes.toString();
      const tStr = target.toString();
      //console.log(iStr,tStr);
      o += iStr + ',' + tStr + '\n';
      if (o.length > 10000000) {
        console.log('flush',n);
        fs.appendFileSync(filterFile,o);
        o = '';
      }
    }
  }

  if (o.length) {
    console.log('final flush',n);
    fs.appendFileSync(filterFile,o);
  }

  console.log('done');
}

//}}}

filter();

