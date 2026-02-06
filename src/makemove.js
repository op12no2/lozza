function make(node, move) {

  const b = board;
  const pl = pieceList;
  const fr = (move >> 7) & 0x7F;
  const to = move & 0x7F;

  const curStm = stm;
  const stmBase = (curStm >>> 3) * 17;
  const oppBase = stmBase ^ 17;

  node.undoRights = rights;
  node.undoEp = ep;

  rights &= RIGHTS_TABLE[fr] & RIGHTS_TABLE[to];

  ep = 0;

  if (move & MOVE_FLAG_SPECIAL) {

    if (move & MOVE_FLAG_PROMOTE) {

      if (move & MOVE_FLAG_CAPTURE) {
        const capIdx = b[to | 8];
        const lastIdx = pl[oppBase];
        const lastSq = pl[oppBase + lastIdx];
        pl[oppBase + capIdx] = lastSq;
        b[lastSq | 8] = capIdx;
        pl[oppBase]--;
        node.undoCaptured = b[to];
        node.undoCapIdx = capIdx;
      }

      const idx = b[fr | 8];
      pl[stmBase + idx] = to;
      b[to | 8] = idx;

      b[to] = (move >> PROMOTE_SHIFT) | curStm;
      b[fr] = 0;
      stm = curStm ^ BLACK;
      return;
    }

    if (move & MOVE_FLAG_EPCAPTURE) {

      const capSq = to - 16 + (curStm << 2);

      const capIdx = b[capSq | 8];
      const lastIdx = pl[oppBase];
      const lastSq = pl[oppBase + lastIdx];
      pl[oppBase + capIdx] = lastSq;
      b[lastSq | 8] = capIdx;
      pl[oppBase]--;
      node.undoCapIdx = capIdx;

      const idx = b[fr | 8];
      pl[stmBase + idx] = to;
      b[to | 8] = idx;

      b[to] = b[fr];
      b[fr] = 0;
      b[capSq] = 0;
      stm = curStm ^ BLACK;
      return;
    }

    // castle

    pl[stmBase + 1] = to;
    b[to | 8] = 1;

    b[to] = b[fr];
    b[fr] = 0;

    let rookFr, rookTo;

    if (to & 4) {
      rookFr = to + 1; rookTo = to - 1;
    }
    else {
      rookFr = to - 2; rookTo = to + 1;
    }

    const rookIdx = b[rookFr | 8];
    pl[stmBase + rookIdx] = rookTo;
    b[rookTo | 8] = rookIdx;

    b[rookTo] = b[rookFr];
    b[rookFr] = 0;

    stm = curStm ^ BLACK;
    return;
  }

  // quiet move or normal capture

  if ((b[fr] & 7) === PAWN && (to - fr === 32 || to - fr === -32))
    ep = (fr + to) >> 1;

  if (move & MOVE_FLAG_CAPTURE) {
    const capIdx = b[to | 8];
    const lastIdx = pl[oppBase];
    const lastSq = pl[oppBase + lastIdx];
    pl[oppBase + capIdx] = lastSq;
    b[lastSq | 8] = capIdx;
    pl[oppBase]--;
    node.undoCaptured = b[to];
    node.undoCapIdx = capIdx;
  }

  const idx = b[fr | 8];
  pl[stmBase + idx] = to;
  b[to | 8] = idx;

  b[to] = b[fr];
  b[fr] = 0;

  stm = curStm ^ BLACK;
}

function unmake (node, move) {

  const b = board;
  const pl = pieceList;
  const fr = (move >> 7) & 0x7F;
  const to = move & 0x7F;

  // stm was flipped by make, so current stm is the opponent of the mover
  // the mover's colour is stm ^ BLACK
  const mover = stm ^ BLACK;
  const stmBase = (mover >>> 3) * 17;
  const oppBase = stmBase ^ 17;

  if (move & MOVE_FLAG_SPECIAL) {

    if (move & MOVE_FLAG_PROMOTE) {

      // move piece back as a pawn
      b[fr] = PAWN | mover;
      b[fr | 8] = b[to | 8];
      const idx = b[fr | 8];
      pl[stmBase + idx] = fr;

      if (move & MOVE_FLAG_CAPTURE) {
        // un-swap-delete
        const capIdx = node.undoCapIdx;
        pl[oppBase]++;
        const lastSq = pl[oppBase + capIdx];
        pl[oppBase + pl[oppBase]] = lastSq;
        b[lastSq | 8] = pl[oppBase];
        pl[oppBase + capIdx] = to;
        b[to | 8] = capIdx;
        b[to] = node.undoCaptured;
      }
      else {
        b[to] = 0;
      }

      rights = node.undoRights;
      ep = node.undoEp;
      stm = mover;
      return;
    }

    if (move & MOVE_FLAG_EPCAPTURE) {

      const capSq = to - 16 + (mover << 2);

      // move pawn back
      const idx = b[to | 8];
      pl[stmBase + idx] = fr;
      b[fr | 8] = idx;
      b[fr] = b[to];
      b[to] = 0;

      // restore captured pawn
      const capIdx = node.undoCapIdx;
      pl[oppBase]++;
      const lastSq = pl[oppBase + capIdx];
      pl[oppBase + pl[oppBase]] = lastSq;
      b[lastSq | 8] = pl[oppBase];
      pl[oppBase + capIdx] = capSq;
      b[capSq | 8] = capIdx;
      b[capSq] = PAWN | (mover ^ BLACK);

      rights = node.undoRights;
      ep = node.undoEp;
      stm = mover;
      return;
    }

    // castle - move king back, move rook back

    pl[stmBase + 1] = fr;
    b[fr | 8] = 1;
    b[fr] = b[to];
    b[to] = 0;

    let rookFr, rookTo;

    if (to & 4) {
      rookFr = to + 1; rookTo = to - 1;
    }
    else {
      rookFr = to - 2; rookTo = to + 1;
    }

    const rookIdx = b[rookTo | 8];
    pl[stmBase + rookIdx] = rookFr;
    b[rookFr | 8] = rookIdx;
    b[rookFr] = b[rookTo];
    b[rookTo] = 0;

    rights = node.undoRights;
    ep = node.undoEp;
    stm = mover;
    return;
  }

  // quiet move or normal capture

  // move piece back
  const idx = b[to | 8];
  pl[stmBase + idx] = fr;
  b[fr | 8] = idx;
  b[fr] = b[to];

  if (move & MOVE_FLAG_CAPTURE) {
    // un-swap-delete
    const capIdx = node.undoCapIdx;
    pl[oppBase]++;
    const lastSq = pl[oppBase + capIdx];
    pl[oppBase + pl[oppBase]] = lastSq;
    b[lastSq | 8] = pl[oppBase];
    pl[oppBase + capIdx] = to;
    b[to | 8] = capIdx;
    b[to] = node.undoCaptured;
  }
  else {
    b[to] = 0;
  }

  rights = node.undoRights;
  ep = node.undoEp;
  stm = mover;
}
