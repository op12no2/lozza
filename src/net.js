

// net

const net_h1_w_flat = new Int32Array(NET_I_SIZE * NET_H1_SIZE);  // us
const net_h2_w_flat = new Int32Array(NET_I_SIZE * NET_H1_SIZE);  // them
const net_h1_b      = new Int32Array(NET_H1_SIZE);
const net_o_w       = new Int32Array(NET_H1_SIZE*2);
let   net_o_b       = 0;
const net_h1_a      = new Int32Array(NET_H1_SIZE);
const net_h2_a      = new Int32Array(NET_H1_SIZE);
const net_a         = [[net_h1_a, net_h2_a], [net_h2_a, net_h1_a]];

let ueFunc  = myround;
let ueArgs0 = 0;
let ueArgs1 = 0;
let ueArgs2 = 0;
let ueArgs3 = 0;
let ueArgs4 = 0;
let ueArgs5 = 0;

// netEval
//
// squared relu.
//

function netEval(turn) {

  const w  = net_o_w;
  const a  = net_a[turn >>> 3];
  const a1 = a[0];
  const a2 = a[1];
  const N  = NET_H1_SIZE | 0;

  let e  = 0 | 0;
  let p1 = 0 | 0;
  let p2 = N | 0;

  while (p1 < N) {

    const x1 = a1[p1] | 0;
    const x2 = a2[p1] | 0;

    const y1 = (x1 + (x1 ^ (x1 >> 31)) - (x1 >> 31)) >> 1;
    const y2 = (x2 + (x2 ^ (x2 >> 31)) - (x2 >> 31)) >> 1;

    e = (e + Math.imul(w[p1], Math.imul(y1, y1)) + Math.imul(w[p2], Math.imul(y2, y2))) | 0;

    p1++; p2++;

  }

  let e2 = e;

  e2 = (e2 / NET_QA) | 0;
  e2 = (e2 + (net_o_b | 0)) | 0;
  e2 = Math.imul(e2, NET_SCALE | 0) | 0;
  e2 = (e2 / NET_QAB) | 0;

  return e2 | 0;

}

// netLoad

// getWeightsBuffer

function getWeightsBuffer() {

  if (WEIGHTS_B64 === '')
    return fs.readFileSync(NET_WEIGHTS_FILE);

  const b64 = WEIGHTS_B64.replace(/\s+/g, "");

  if (typeof Buffer !== 'undefined' && Buffer.from) {
    return Buffer.from(b64, 'base64');
  }

  const binStr = atob(b64);
  const n = binStr.length;
  const bytes = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }

  return bytes;

}


function netLoad () {

  let offset = 0;

  const buffer = getWeightsBuffer();

  const dataView = new Int16Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength >> 1
  );

  for (let i = 0; i < NET_I_SIZE; i++) {
    const lozIndex = bullet2lozza(i);
    const h = i * NET_H1_SIZE;
    for (let j = 0; j < NET_H1_SIZE; j++) {
      net_h1_w_flat[lozIndex            * NET_H1_SIZE + j] = dataView[h + j];  // us
      net_h2_w_flat[flipIndex(lozIndex) * NET_H1_SIZE + j] = dataView[h + j];  // them
    }
  }

  offset += NET_I_SIZE * NET_H1_SIZE;
  for (let i = 0; i < NET_H1_SIZE; i++) {
    net_h1_b[i] = dataView[offset + i];
  }

  offset += NET_H1_SIZE;
  for (let i = 0; i < NET_H1_SIZE * 2; i++) {
    net_o_w[i] = dataView[offset + i];
  }

  offset += NET_H1_SIZE * 2;
  net_o_b = dataView[offset];

}


// netMove

function netMove () {

  const frObj = ueArgs0 << 8;
  const from  = ueArgs1 | 0;
  const to    = ueArgs2 | 0;

  const map = IMAP;
  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const h1a = net_h1_a, h2a = net_h2_a;

  const N = NET_H1_SIZE | 0;

  let h  = 0;
  let p1 = map[frObj + from] | 0;
  let p2 = map[frObj + to]   | 0;

  while (h < N) {
    h1a[h] += h1w[p2] - h1w[p1];
    h2a[h] += h2w[p2] - h2w[p1];
    h++; p1++; p2++;
  }

}

// netCapture

function netCapture () {

  const frObj = ueArgs0 << 8;
  const fr    = ueArgs1 | 0;
  const toObj = ueArgs2 << 8;
  const to    = ueArgs3 | 0;

  const map = IMAP;
  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const h1a = net_h1_a, h2a = net_h2_a;

  const N = NET_H1_SIZE | 0;

  let h  = 0;
  let p1 = map[frObj + fr] | 0;
  let p2 = map[toObj + to] | 0;
  let p3 = map[frObj + to] | 0;

  while (h < N) {
    h1a[h] += h1w[p3] - h1w[p2] - h1w[p1];
    h2a[h] += h2w[p3] - h2w[p2] - h2w[p1];
    h++; p1++; p2++; p3++;
  }

}

// netPromote

function netPromote () {

  const pawnObj    = ueArgs0 << 8;
  const pawnFr     = ueArgs1 | 0;
  const pawnTo     = ueArgs2 | 0;
  const captureObj = ueArgs3 << 8;
  const promoteObj = ueArgs4 << 8;

  const map = IMAP;
  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const h1a = net_h1_a, h2a = net_h2_a;

  const N = NET_H1_SIZE | 0;

  let h  = 0;
  let p1 = map[pawnObj    + pawnFr] | 0;
  let p2 = map[promoteObj + pawnTo] | 0;

  if (captureObj !== 0) {
    let p3 = map[captureObj + pawnTo] | 0;
    while (h < N) {
      h1a[h] += h1w[p2] - h1w[p1] - h1w[p3];
      h2a[h] += h2w[p2] - h2w[p1] - h2w[p3];
      h++; p1++; p2++; p3++;
    }
  }
  else {
    while (h < N) {
      h1a[h] += h1w[p2] - h1w[p1];
      h2a[h] += h2w[p2] - h2w[p1];
      h++; p1++; p2++;
    }
  }

}

// netEpCapture

function netEpCapture () {

  const pawnObj        = ueArgs0 << 8;
  const pawnFr         = ueArgs1 | 0;
  const pawnTo         = ueArgs2 | 0;
  const pawnCaptureObj = ueArgs3 << 8;
  const ep             = ueArgs4 | 0;

  const map = IMAP;
  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const h1a = net_h1_a, h2a = net_h2_a;

  const N = NET_H1_SIZE | 0;

  let h  = 0;
  let p1 = map[pawnObj        + pawnFr] | 0;
  let p2 = map[pawnObj        + pawnTo] | 0;
  let p3 = map[pawnCaptureObj + ep] | 0;

  while (h < N) {
    h1a[h] += h1w[p2] - h1w[p1] - h1w[p3];
    h2a[h] += h2w[p2] - h2w[p1] - h2w[p3];
    h++; p1++; p2++; p3++;
  }

}

// netCastle

function netCastle () {

  const kingObj = ueArgs0 << 8;
  const kingFr  = ueArgs1 | 0;
  const kingTo  = ueArgs2 | 0;
  const rookObj = ueArgs3 << 8;
  const rookFr  = ueArgs4 | 0;
  const rookTo  = ueArgs5 | 0;

  const map = IMAP;
  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const h1a = net_h1_a, h2a = net_h2_a;

  const N = NET_H1_SIZE | 0;

  let h  = 0;
  let p1 = map[kingObj + kingFr] | 0;
  let p2 = map[kingObj + kingTo] | 0;
  let p3 = map[rookObj + rookFr] | 0;
  let p4 = map[rookObj + rookTo] | 0;

  while (h < N) {
    h1a[h] += h1w[p2] - h1w[p1] + h1w[p4] - h1w[p3];
    h2a[h] += h2w[p2] - h2w[p1] + h2w[p4] - h2w[p3];
    h++; p1++; p2++; p3++; p4++;
  }

}


// flipIndex
//
// Slow. Only use during init.
//

function flipIndex (index) {

  const piece         = Math.floor(index / 64);
  const square        = index % 64;
  const flippedSquare = square ^ 56;
  const flippedPiece  = (piece + 6) % 12;
  const flippedIndex  = flippedPiece * 64 + flippedSquare;

  return flippedIndex;

}

// bullet2lozza
//
// bullet index 0 is a1. Lozza index 0 is a8.
// The piece order is the same.
// Apply this when loading the weights from the bullet .bin file.
//
// Slow. Only use during init.
//

function bullet2lozza (index) {

  const piece        = Math.floor(index / 64);
  const bulletSquare = index % 64;
  const lozzaSquare  = bulletSquare ^ 56;          // map a1 to a8 etc
  const lozzaIndex   = piece * 64 + lozzaSquare;

  return lozzaIndex;

}

