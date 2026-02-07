let g_seed = 1;

let loStm = 0;
let hiStm = 0;

const loPieces = Array(15);
const hiPieces = Array(15);

const loRights = new Int32Array(16);
const hiRights = new Int32Array(16);

const loEP = new Int32Array(128);
const hiEP = new Int32Array(128);

function rand32(seed) { // Mulberry32
  seed = seed + 0x6D2B79F5 | 0;
  var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
  return ((t ^ (t >>> 14)) >>> 0);
}

function initZobrist() {

  loStm = rand32(g_seed++);
  hiStm = rand32(g_seed++);

  for (let i=0; i < 15; i++) {
    loPieces[i] = new Int32Array(128);
    hiPieces[i] = new Int32Array(128);
    for (let j=0; j < 128; j++){
      loPieces[i][j] = rand32(g_seed++);
      hiPieces[i][j] = rand32(g_seed++);
    }
  }

  for (let i=0; i < 16; i++) {
    loRights[i] = rand32(g_seed++);
    hiRights[i] = rand32(g_seed++);
  }

  for (let i=0; i < 128; i++) {
    loEP[i] = rand32(g_seed++);
    hiEP[i] = rand32(g_seed++);
  }

}

const TT_EXACT = 1;
const TT_ALPHA = 2;
const TT_BETA = 3;
const TT_TYPE_MASK = 3;
const TT_INCHECK = 4;
const TT_DEFAULT = 16; // mb
const TT_WIDTH = 18; // bytes - see below

let ttSize = 1;
let ttMask = 0; // 0 implies tt not resized yet

let ttLoHash = new Int32Array(ttSize); // 4
let ttHiHash = new Int32Array(ttSize); // 4
let ttType = new Uint8Array(ttSize); // 1
let ttDepth = new Int8Array(ttSize); // 1
let ttMove = new Uint32Array(ttSize); // 4
let ttEval = new Int16Array(ttSize); // 2
let ttScore = new Int16Array(ttSize); // 2

function ttResize(mb) {

  const bytesPerEntry = TT_WIDTH;
  const requestedBytes = mb * 1024 * 1024;
  const entriesNeeded = requestedBytes / bytesPerEntry;
  const pow2 = Math.ceil(Math.log2(entriesNeeded));

  ttSize = 1 << pow2;
  ttMask = ttSize - 1;

  ttLoHash = new Int32Array(ttSize);
  ttHiHash = new Int32Array(ttSize);
  ttType = new Uint8Array(ttSize);
  ttDepth = new Int8Array(ttSize);
  ttMove = new Uint32Array(ttSize);
  ttEval = new Int16Array(ttSize);
  ttScore = new Int16Array(ttSize);

  uciSend('info tt bits ' + pow2 + ' entries ' + ttSize + ' (0x' + ttSize.toString(16) + ') mb ' + Math.trunc((TT_WIDTH * ttSize) / (1024 * 1024)));

}

function ttPut(type, depth, score, move, ev, inCheck) {

  const idx = g_loHash & ttMask;

  ttLoHash[idx] = g_loHash;
  ttHiHash[idx] = g_hiHash;
  ttType[idx] = inCheck ? type | TT_INCHECK : type;
  ttDepth[idx] = depth;
  ttScore[idx] = score;
  ttEval[idx] = ev;
  ttMove[idx] = move;

}

function ttGet() {

  const idx = g_loHash & ttMask;

  if (ttType[idx] && ttLoHash[idx] === g_loHash && ttHiHash[idx] === g_hiHash)
    return idx;

  return -1;

}

function ttClear() {

  ttType.fill(0);

}

function putAdjustedScore(ply, score) {

  if (score < -MATEISH)
    return score - ply;

  else if (score > MATEISH)
    return score + ply;

  else
   return score;

}

function getAdjustedScore(ply, score) {

  if (score < -MATEISH)
    return score + ply;

  else if (score > MATEISH)
    return score - ply;

  else
    return score;

}

