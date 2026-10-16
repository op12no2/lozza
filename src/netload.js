const WEIGHTS_B64 = getWeights();

function getWeightsBuffer() {

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
