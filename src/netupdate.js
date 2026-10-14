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
