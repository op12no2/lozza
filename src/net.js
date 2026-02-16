
const NET_H1 = 256;
const NET_I = 768;
const NET_QA = 255;
const NET_QB = 64;
const NET_QAB = NET_QA * NET_QB;
const NET_SCALE = 400;

const net_h1_w = new Int16Array(NET_I * NET_H1);
const net_h2_w = new Int16Array(NET_I * NET_H1);
const net_h1_b = new Int16Array(NET_H1);
const net_o_w  = new Int32Array(NET_H1 * 2);
let net_o_b    = 0;

// lozza piece code -> cwtch net piece index (0-11)
// WPAWN=1->0, WKNIGHT=2->1, WBISHOP=3->2, WROOK=4->3, WQUEEN=5->4, WKING=6->5
// BPAWN=9->6, BKNIGHT=10->7, BBISHOP=11->8, BROOK=12->9, BQUEEN=13->10, BKING=14->11
const NET_PIECE = [0, 0, 1, 2, 3, 4, 5, 0, 0, 6, 7, 8, 9, 10, 11];

const net_base = new Int32Array(15 * 128);

function sq88to64(sq) {
  return (sq >> 4) * 8 + (sq & 7);
}

function initNetBase() {
  for (let piece = 1; piece <= 14; piece++) {
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) continue;
      net_base[piece * 128 + sq] = ((NET_PIECE[piece] << 6) | sq88to64(sq)) * NET_H1;
    }
  }
}

function getWeightsBuffer() {

  if (typeof Buffer !== 'undefined' && Buffer.from)
    return Buffer.from(WEIGHTS_B64, 'base64');

  const binStr = atob(WEIGHTS_B64);
  const bytes  = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++)
    bytes[i] = binStr.charCodeAt(i);
  return bytes;
}

function initWeights() {

  const buf = getWeightsBuffer();
  const dv  = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

  let off = 0;

  // h1 input weights: 768 * NET_H1_SIZE int16 (little-endian)

  const numH1W = NET_I * NET_H1;

  for (let i = 0; i < numH1W; i++) {
    const val = dv.getInt16(off, true);
    off += 2;

    net_h1_w[i] = val;

    // build flipped perspective weights
    const piece  = Math.trunc(i / (64 * NET_H1));
    const square = Math.trunc(i / NET_H1) % 64;
    const h      = i % NET_H1;

    const fSquare = square ^ 56;
    const fPiece  = (piece + 6) % 12;

    const fi = ((fPiece * 64) + fSquare) * NET_H1 + h;
    net_h2_w[fi] = val;
  }

  // h1 biases: NET_H1_SIZE int16

  for (let i = 0; i < NET_H1; i++) {
    net_h1_b[i] = dv.getInt16(off, true);
    off += 2;
  }

  // output weights: 768 int16 -> int32

  for (let i = 0; i < NET_H1 * 2; i++) {
    net_o_w[i] = dv.getInt16(off, true);
    off += 2;
  }

  // output bias: 1 int16 -> int32

  net_o_b = dv.getInt16(off, true);
}

function netSlowRebuild(node) {

  const a1 = node.acc1;
  const a2 = node.acc2;

  for (let i = 0; i < NET_H1; i++) {
    a1[i] = net_h1_b[i];
    a2[i] = net_h1_b[i];
  }

  for (let sq = 0; sq < 128; sq++) {

    if (sq & 0x88) {
      sq += 7;
      continue;
    }

    const piece = g_board[sq];

    if (!piece)
      continue;

    const base = net_base[piece * 128 + sq];

    for (let h = 0; h < NET_H1; h++) {
      a1[h] += net_h1_w[base + h];
      a2[h] += net_h2_w[base + h];
    }
  }
}

function netEval(node) {

  const a1 = g_stm === WHITE ? node.acc1 : node.acc2;
  const a2 = g_stm === WHITE ? node.acc2 : node.acc1;

  const w1 = 0;
  const w2 = NET_H1;

  let acc = 0;

  for (let i = 0; i < NET_H1; i++) {
    const v1 = a1[i] > 0 ? a1[i] : 0;
    const v2 = a2[i] > 0 ? a2[i] : 0;
    acc += net_o_w[w1 + i] * v1 * v1 + net_o_w[w2 + i] * v2 * v2;
  }

  acc = Math.trunc(acc / NET_QA);
  acc += net_o_b;
  acc *= NET_SCALE;
  acc = Math.trunc(acc / NET_QAB);

  return acc;

}

function netCopyAccs(src, dst) {
  dst.acc1.set(src.acc1);
  dst.acc2.set(src.acc2);
}

function netMove(node, piece, fr, to) {

  const a1 = node.acc1;
  const a2 = node.acc2;

  const b1 = net_base[piece * 128 + fr];
  const b2 = net_base[piece * 128 + to];

  for (let i = 0; i < NET_H1; i++) {
    a1[i] += net_h1_w[b2 + i] - net_h1_w[b1 + i];
    a2[i] += net_h2_w[b2 + i] - net_h2_w[b1 + i];
  }

}

function netCapture(node, frPiece, fr, capPiece, to) {

  const a1 = node.acc1;
  const a2 = node.acc2;

  const b1 = net_base[frPiece * 128 + fr];
  const b2 = net_base[capPiece * 128 + to];
  const b3 = net_base[frPiece * 128 + to];

  for (let i = 0; i < NET_H1; i++) {
    a1[i] += net_h1_w[b3 + i] - net_h1_w[b2 + i] - net_h1_w[b1 + i];
    a2[i] += net_h2_w[b3 + i] - net_h2_w[b2 + i] - net_h2_w[b1 + i];
  }

}

function netEpCapture(node, frPawn, fr, to, capPawn, capSq) {

  const a1 = node.acc1;
  const a2 = node.acc2;

  const b1 = net_base[frPawn * 128 + fr];
  const b2 = net_base[frPawn * 128 + to];
  const b3 = net_base[capPawn * 128 + capSq];

  for (let i = 0; i < NET_H1; i++) {
    a1[i] += net_h1_w[b2 + i] - net_h1_w[b1 + i] - net_h1_w[b3 + i];
    a2[i] += net_h2_w[b2 + i] - net_h2_w[b1 + i] - net_h2_w[b3 + i];
  }

}

function netCastle(node, kingPiece, kingFr, kingTo, rookPiece, rookFr, rookTo) {

  const a1 = node.acc1;
  const a2 = node.acc2;

  const b1 = net_base[kingPiece * 128 + kingFr];
  const b2 = net_base[kingPiece * 128 + kingTo];
  const b3 = net_base[rookPiece * 128 + rookFr];
  const b4 = net_base[rookPiece * 128 + rookTo];

  for (let i = 0; i < NET_H1; i++) {
    a1[i] += net_h1_w[b2 + i] - net_h1_w[b1 + i] + net_h1_w[b4 + i] - net_h1_w[b3 + i];
    a2[i] += net_h2_w[b2 + i] - net_h2_w[b1 + i] + net_h2_w[b4 + i] - net_h2_w[b3 + i];
  }

}

function netPromoPush(node, pawnPiece, fr, to, promPiece) {

  const a1 = node.acc1;
  const a2 = node.acc2;

  const b1 = net_base[pawnPiece * 128 + fr];
  const b2 = net_base[promPiece * 128 + to];

  for (let i = 0; i < NET_H1; i++) {
    a1[i] += net_h1_w[b2 + i] - net_h1_w[b1 + i];
    a2[i] += net_h2_w[b2 + i] - net_h2_w[b1 + i];
  }

}

function netPromoCap(node, pawnPiece, fr, to, capPiece, promPiece) {

  const a1 = node.acc1;
  const a2 = node.acc2;

  const b1 = net_base[pawnPiece * 128 + fr];
  const b2 = net_base[promPiece * 128 + to];
  const b3 = net_base[capPiece * 128 + to];

  for (let i = 0; i < NET_H1; i++) {
    a1[i] += net_h1_w[b2 + i] - net_h1_w[b1 + i] - net_h1_w[b3 + i];
    a2[i] += net_h2_w[b2 + i] - net_h2_w[b1 + i] - net_h2_w[b3 + i];
  }

}

