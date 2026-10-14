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
