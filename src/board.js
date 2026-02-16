const bdB = new Uint8Array(144);    // pieces
const bdZ = new Uint8Array(144);    // pointers to w|bList

let bdTurn   = 0;
let bdRights = 0;
let bdEp     = 0;

const wList = new Uint8Array(16);
const bList = new Uint8Array(16);

const wbList = [wList, bList];

const wCounts = new Uint8Array(7);
const bCounts = new Uint8Array(7);

let wCount = 0;
let bCount = 0;

// zobrists

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

twisterInit(0x9E3779B9);

let loTurn = twisterRand();
let hiTurn = twisterRand();

const loObjPieces = new Int32Array(15 * 256);
const hiObjPieces = new Int32Array(15 * 256);

for (let i=0; i < 15 * 256; i++) {
  loObjPieces[i] = twisterRand();
  hiObjPieces[i] = twisterRand();
}

const loRights = new Int32Array(16);
const hiRights = new Int32Array(16);

for (let i=0; i < 16; i++) {
  loRights[i] = twisterRand();
  hiRights[i] = twisterRand();
}

const loEP = new Int32Array(144);
const hiEP = new Int32Array(144);

for (let i=0; i < 144; i++) {
  loEP[i] = twisterRand();
  hiEP[i] = twisterRand();
}

// hash

let loHash = 0;
let hiHash = 0;

let repLo = 0;
let repHi = 0;

const repLoHash = new Int32Array(1024);
const repHiHash = new Int32Array(1024);
