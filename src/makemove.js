function make(node, move) {

  const b = g_board;
  const pl = g_pieces;
  const px = g_plix;
  const fr = (move >> 7) & 0x7F;
  const to = move & 0x7F;

  const stm = g_stm;
  const stmBase = (stm >>> 3) * 17;
  const oppBase = stmBase ^ 17;

  node.undoRights = g_rights;
  node.undoEp = g_ep;
  node.undoLoHash = g_loHash;
  node.undoHiHash = g_hiHash;

  // hash: update rights

  g_loHash ^= g_loRights[g_rights];
  g_hiHash ^= g_hiRights[g_rights];
  g_rights &= RIGHTS_TABLE[fr] & RIGHTS_TABLE[to];
  g_loHash ^= g_loRights[g_rights];
  g_hiHash ^= g_hiRights[g_rights];

  // hash: remove old ep

  if (g_ep) {
    g_loHash ^= g_loEP[g_ep];
    g_hiHash ^= g_hiEP[g_ep];
  }
  g_ep = 0;

  // hash: toggle stm

  g_loHash ^= g_loStm;
  g_hiHash ^= g_hiStm;

  if (move & MOVE_FLAG_SPECIAL) {

    if (move & MOVE_FLAG_PROMOTE) {

      if (move & MOVE_FLAG_CAPTURE) {
        g_loHash ^= g_loPieces[b[to]][to];
        g_hiHash ^= g_hiPieces[b[to]][to];
        const capIdx = px[to];
        const lastIdx = pl[oppBase];
        const lastSq = pl[oppBase + lastIdx];
        pl[oppBase + capIdx] = lastSq;
        px[lastSq] = capIdx;
        pl[oppBase]--;
        node.undoCaptured = b[to];
        node.undoCapIdx = capIdx;
      }

      g_loHash ^= g_loPieces[b[fr]][fr];
      g_hiHash ^= g_hiPieces[b[fr]][fr];

      const idx = px[fr];
      pl[stmBase + idx] = to;
      px[to] = idx;

      const promPiece = (move >> PROMOTE_SHIFT) | stm;
      g_loHash ^= g_loPieces[promPiece][to];
      g_hiHash ^= g_hiPieces[promPiece][to];

      b[to] = promPiece;
      b[fr] = 0;
      g_stm = stm ^ BLACK;
      return;
    }

    if (move & MOVE_FLAG_EPCAPTURE) {

      const capSq = to - 16 + (stm << 2);

      g_loHash ^= g_loPieces[b[capSq]][capSq];
      g_hiHash ^= g_hiPieces[b[capSq]][capSq];

      const capIdx = px[capSq];
      const lastIdx = pl[oppBase];
      const lastSq = pl[oppBase + lastIdx];
      pl[oppBase + capIdx] = lastSq;
      px[lastSq] = capIdx;
      pl[oppBase]--;
      node.undoCapIdx = capIdx;

      g_loHash ^= g_loPieces[b[fr]][fr];
      g_hiHash ^= g_hiPieces[b[fr]][fr];
      g_loHash ^= g_loPieces[b[fr]][to];
      g_hiHash ^= g_hiPieces[b[fr]][to];

      const idx = px[fr];
      pl[stmBase + idx] = to;
      px[to] = idx;

      b[to] = b[fr];
      b[fr] = 0;
      b[capSq] = 0;
      g_stm = stm ^ BLACK;
      return;
    }

    // castle

    g_loHash ^= g_loPieces[b[fr]][fr];
    g_hiHash ^= g_hiPieces[b[fr]][fr];
    g_loHash ^= g_loPieces[b[fr]][to];
    g_hiHash ^= g_hiPieces[b[fr]][to];

    pl[stmBase + 1] = to;
    px[to] = 1;

    b[to] = b[fr];
    b[fr] = 0;

    let rookFr, rookTo;

    if (to & 4) {
      rookFr = to + 1; rookTo = to - 1;
    }
    else {
      rookFr = to - 2; rookTo = to + 1;
    }

    const rookPiece = ROOK | stm;
    g_loHash ^= g_loPieces[rookPiece][rookFr];
    g_hiHash ^= g_hiPieces[rookPiece][rookFr];
    g_loHash ^= g_loPieces[rookPiece][rookTo];
    g_hiHash ^= g_hiPieces[rookPiece][rookTo];

    const rookIdx = px[rookFr];
    pl[stmBase + rookIdx] = rookTo;
    px[rookTo] = rookIdx;

    b[rookTo] = b[rookFr];
    b[rookFr] = 0;

    g_stm = stm ^ BLACK;
    return;
  }

  // quiet move or normal capture

  if ((b[fr] & 7) === PAWN && (to - fr === 32 || to - fr === -32)) {
    g_ep = (fr + to) >> 1;
    g_loHash ^= g_loEP[g_ep];
    g_hiHash ^= g_hiEP[g_ep];
  }

  if (move & MOVE_FLAG_CAPTURE) {
    g_loHash ^= g_loPieces[b[to]][to];
    g_hiHash ^= g_hiPieces[b[to]][to];
    const capIdx = px[to];
    const lastIdx = pl[oppBase];
    const lastSq = pl[oppBase + lastIdx];
    pl[oppBase + capIdx] = lastSq;
    px[lastSq] = capIdx;
    pl[oppBase]--;
    node.undoCaptured = b[to];
    node.undoCapIdx = capIdx;
  }

  g_loHash ^= g_loPieces[b[fr]][fr];
  g_hiHash ^= g_hiPieces[b[fr]][fr];
  g_loHash ^= g_loPieces[b[fr]][to];
  g_hiHash ^= g_hiPieces[b[fr]][to];

  const idx = px[fr];
  pl[stmBase + idx] = to;
  px[to] = idx;

  b[to] = b[fr];
  b[fr] = 0;

  g_stm = stm ^ BLACK;

  //checkHash();

}

function unmake (node, move) {

  const b = g_board;
  const pl = g_pieces;
  const px = g_plix;
  const fr = (move >> 7) & 0x7F;
  const to = move & 0x7F;

  // stm was flipped by make, so current stm is the opponent of the mover
  // the mover's colour is stm ^ BLACK
  const stm = g_stm ^ BLACK;
  const stmBase = (stm >>> 3) * 17;
  const oppBase = stmBase ^ 17;

  if (move & MOVE_FLAG_SPECIAL) {

    if (move & MOVE_FLAG_PROMOTE) {

      // move piece back as a pawn
      b[fr] = PAWN | stm;
      px[fr] = px[to];
      const idx = px[fr];
      pl[stmBase + idx] = fr;

      if (move & MOVE_FLAG_CAPTURE) {
        // un-swap-delete
        const capIdx = node.undoCapIdx;
        pl[oppBase]++;
        const lastSq = pl[oppBase + capIdx];
        pl[oppBase + pl[oppBase]] = lastSq;
        px[lastSq] = pl[oppBase];
        pl[oppBase + capIdx] = to;
        px[to] = capIdx;
        b[to] = node.undoCaptured;
      }
      else {
        b[to] = 0;
      }

      g_rights = node.undoRights;
      g_ep = node.undoEp;
      g_loHash = node.undoLoHash;
      g_hiHash = node.undoHiHash;
      g_stm = stm;
      return;
    }

    if (move & MOVE_FLAG_EPCAPTURE) {

      const capSq = to - 16 + (stm << 2);

      // move pawn back
      const idx = px[to];
      pl[stmBase + idx] = fr;
      px[fr] = idx;
      b[fr] = b[to];
      b[to] = 0;

      // restore captured pawn
      const capIdx = node.undoCapIdx;
      pl[oppBase]++;
      const lastSq = pl[oppBase + capIdx];
      pl[oppBase + pl[oppBase]] = lastSq;
      px[lastSq] = pl[oppBase];
      pl[oppBase + capIdx] = capSq;
      px[capSq] = capIdx;
      b[capSq] = PAWN | (stm ^ BLACK);

      g_rights = node.undoRights;
      g_ep = node.undoEp;
      g_loHash = node.undoLoHash;
      g_hiHash = node.undoHiHash;
      g_stm = stm;
      return;
    }

    // castle - move king back, move rook back

    pl[stmBase + 1] = fr;
    px[fr] = 1;
    b[fr] = b[to];
    b[to] = 0;

    let rookFr, rookTo;

    if (to & 4) {
      rookFr = to + 1; rookTo = to - 1;
    }
    else {
      rookFr = to - 2; rookTo = to + 1;
    }

    const rookIdx = px[rookTo];
    pl[stmBase + rookIdx] = rookFr;
    px[rookFr] = rookIdx;
    b[rookFr] = b[rookTo];
    b[rookTo] = 0;

    g_rights = node.undoRights;
    g_ep = node.undoEp;
    g_loHash = node.undoLoHash;
    g_hiHash = node.undoHiHash;
    g_stm = stm;
    return;
  }

  // quiet move or normal capture

  // move piece back
  const idx = px[to];
  pl[stmBase + idx] = fr;
  px[fr] = idx;
  b[fr] = b[to];

  if (move & MOVE_FLAG_CAPTURE) {
    // un-swap-delete
    const capIdx = node.undoCapIdx;
    pl[oppBase]++;
    const lastSq = pl[oppBase + capIdx];
    pl[oppBase + pl[oppBase]] = lastSq;
    px[lastSq] = pl[oppBase];
    pl[oppBase + capIdx] = to;
    px[to] = capIdx;
    b[to] = node.undoCaptured;
  }
  else {
    b[to] = 0;
  }

  g_rights = node.undoRights;
  g_ep = node.undoEp;
  g_loHash = node.undoLoHash;
  g_hiHash = node.undoHiHash;
  g_stm = stm;

  //checkHash();

}

