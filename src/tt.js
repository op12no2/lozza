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
