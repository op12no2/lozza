let g_seed = 1;

let g_loStm = 0;
let g_hiStm = 0;

const g_loPieces = Array(15);
const g_hiPieces = Array(15);

const g_loRights = new Int32Array(16);
const g_hiRights = new Int32Array(16);

const g_loEP = new Int32Array(128);
const g_hiEP = new Int32Array(128);

function rand32(seed) { // Mulberry32
  seed = seed + 0x6D2B79F5 | 0;
  var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
  return ((t ^ (t >>> 14)) >>> 0);
}

function initZobrist() {

  g_loStm = rand32(g_seed++);
  g_hiStm = rand32(g_seed++);

  for (let i=0; i < 15; i++) {
    g_loPieces[i] = new Int32Array(128);
    g_hiPieces[i] = new Int32Array(128);
    for (let j=0; j < 128; j++){
      g_loPieces[i][j] = rand32(g_seed++);
      g_hiPieces[i][j] = rand32(g_seed++);
    }
  }

  for (let i=0; i < 16; i++) {
    g_loRights[i] = rand32(g_seed++);
    g_hiRights[i] = rand32(g_seed++);
  }

  for (let i=0; i < 128; i++) {
    g_loEP[i] = rand32(g_seed++);
    g_hiEP[i] = rand32(g_seed++);
  }

}

const TT_EXACT = 1;
const TT_ALPHA = 2;
const TT_BETA = 3;
const TT_TYPE_MASK = 3;
const TT_INCHECK = 4;
const TT_DEFAULT = 16; // mb
const TT_WIDTH = 18; // bytes - see below

let g_ttSize = 1;
let g_ttMask = 0; // 0 implies tt not resized yet

let g_ttLoHash = new Int32Array(g_ttSize); // 4
let g_ttHiHash = new Int32Array(g_ttSize); // 4
let g_ttType = new Uint8Array(g_ttSize); // 1
let g_ttDepth = new Int8Array(g_ttSize); // 1
let g_ttMove = new Uint32Array(g_ttSize); // 4
let g_ttEval = new Int16Array(g_ttSize); // 2
let g_ttScore = new Int16Array(g_ttSize); // 2

function ttResize(mb) {

  const bytesPerEntry = TT_WIDTH;
  const requestedBytes = mb * 1024 * 1024;
  const entriesNeeded = requestedBytes / bytesPerEntry;
  const pow2 = Math.ceil(Math.log2(entriesNeeded));

  g_ttSize = 1 << pow2;
  g_ttMask = g_ttSize - 1;

  g_ttLoHash = new Int32Array(g_ttSize);
  g_ttHiHash = new Int32Array(g_ttSize);
  g_ttType = new Uint8Array(g_ttSize);
  g_ttDepth = new Int8Array(g_ttSize);
  g_ttMove = new Uint32Array(g_ttSize);
  g_ttEval = new Int16Array(g_ttSize);
  g_ttScore = new Int16Array(g_ttSize);

  uciSend('info tt bits ' + pow2 + ' entries ' + g_ttSize + ' (0x' + g_ttSize.toString(16) + ') mb ' + Math.trunc((TT_WIDTH * g_ttSize) / (1024 * 1024)));

}

function ttPut(type, depth, score, move, ev, inCheck) {

  const idx = g_loHash & g_ttMask;

  g_ttLoHash[idx] = g_loHash;
  g_ttHiHash[idx] = g_hiHash;
  g_ttType[idx] = inCheck ? type | TT_INCHECK : type;
  g_ttDepth[idx] = depth;
  g_ttScore[idx] = score;
  g_ttEval[idx] = ev;
  g_ttMove[idx] = move;

}

function ttGet() {

  const idx = g_loHash & g_ttMask;

  if (g_ttType[idx] && g_ttLoHash[idx] === g_loHash && g_ttHiHash[idx] === g_hiHash)
    return idx;

  return -1;

}

function ttClear() {

  g_ttType.fill(0);

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

