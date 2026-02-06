function genMoves(node) {

  const b = g_board;
  const moves = node.moves;
  const stm = g_stm;
  const curEp = g_ep;
  const curRights = g_rights;

  let numMoves = 0;

  const enemy = stm ^ BLACK;

  const pawnDir = stm === WHITE ? 16 : -16;
  const pawnStartR = stm === WHITE ? 0x10 : 0x60;
  const promoteR = stm === WHITE ? 0x70 : 0x00;

  const pl = g_pieces;
  const base = (stm >>> 3) * 17;
  const count = pl[base];

  for (let i = 1; i <= count; i++) {

    const sq = pl[base + i];
    const piece = b[sq];
    const from = sq << 7;

    switch (piece & 7) {

      case PAWN: {

        const to1 = sq + pawnDir;

        // single push

        if (!b[to1]) {

          if ((to1 & 0x70) === promoteR) {
            moves[numMoves++] = from | to1 | MOVE_FLAG_PROMOTE | (QUEEN  << PROMOTE_SHIFT);
            moves[numMoves++] = from | to1 | MOVE_FLAG_PROMOTE | (ROOK   << PROMOTE_SHIFT);
            moves[numMoves++] = from | to1 | MOVE_FLAG_PROMOTE | (BISHOP << PROMOTE_SHIFT);
            moves[numMoves++] = from | to1 | MOVE_FLAG_PROMOTE | (KNIGHT << PROMOTE_SHIFT);
          }
          else {
            moves[numMoves++] = from | to1;

            // double push

            const to2 = sq + pawnDir * 2;

            if ((sq & 0x70) === pawnStartR && !b[to2])
              moves[numMoves++] = from | to2;
          }
        }

        // captures

        for (let i = -1; i <= 1; i += 2) {

          const to = to1 + i;

          if (to & 0x88)
            continue;

          if (b[to] && (b[to] & BLACK) === enemy) {

            if ((to & 0x70) === promoteR) {
              moves[numMoves++] = from | to | MOVE_FLAG_PROMOTE | MOVE_FLAG_CAPTURE | (QUEEN  << PROMOTE_SHIFT);
              moves[numMoves++] = from | to | MOVE_FLAG_PROMOTE | MOVE_FLAG_CAPTURE | (ROOK   << PROMOTE_SHIFT);
              moves[numMoves++] = from | to | MOVE_FLAG_PROMOTE | MOVE_FLAG_CAPTURE | (BISHOP << PROMOTE_SHIFT);
              moves[numMoves++] = from | to | MOVE_FLAG_PROMOTE | MOVE_FLAG_CAPTURE | (KNIGHT << PROMOTE_SHIFT);
            }
            else {
              moves[numMoves++] = from | to | MOVE_FLAG_CAPTURE;
            }
          }
          else if (curEp && to === curEp) { // ep=0 means no ep, but 0x00 (a1) is valid so guard with ep&&
            moves[numMoves++] = from | to | MOVE_FLAG_EPCAPTURE | MOVE_FLAG_CAPTURE;
          }
        }

        break;
      }

      case KNIGHT: {

        for (let i = 0; i < 8; i++) {

          const to = sq + KNIGHT_OFFSETS[i];

          if (to & 0x88)
            continue;

          if (!b[to])
            moves[numMoves++] = from | to;
          else if ((b[to] & BLACK) === enemy)
            moves[numMoves++] = from | to | MOVE_FLAG_CAPTURE;
        }

        break;
      }

      case BISHOP: {

        for (let i = 0; i < 4; i++) {

          const dir = BISHOP_OFFSETS[i];

          for (let to = sq + dir; !(to & 0x88); to += dir) {

            if (!b[to]) {
              moves[numMoves++] = from | to;
              continue;
            }

            if ((b[to] & BLACK) === enemy)
              moves[numMoves++] = from | to | MOVE_FLAG_CAPTURE;

            break;
          }
        }

        break;
      }

      case ROOK: {

        for (let i = 0; i < 4; i++) {

          const dir = ROOK_OFFSETS[i];

          for (let to = sq + dir; !(to & 0x88); to += dir) {

            if (!b[to]) {
              moves[numMoves++] = from | to;
              continue;
            }

            if ((b[to] & BLACK) === enemy)
              moves[numMoves++] = from | to | MOVE_FLAG_CAPTURE;

            break;
          }
        }

        break;
      }

      case QUEEN: {

        for (let i = 0; i < 8; i++) {

          const dir = QUEEN_OFFSETS[i];

          for (let to = sq + dir; !(to & 0x88); to += dir) {

            if (!b[to]) {
              moves[numMoves++] = from | to;
              continue;
            }

            if ((b[to] & BLACK) === enemy)
              moves[numMoves++] = from | to | MOVE_FLAG_CAPTURE;

            break;
          }
        }

        break;
      }

      case KING: {

        for (let i = 0; i < 8; i++) {

          const to = sq + KING_OFFSETS[i];

          if (to & 0x88)
            continue;

          if (!b[to])
            moves[numMoves++] = from | to;
          else if ((b[to] & BLACK) === enemy)
            moves[numMoves++] = from | to | MOVE_FLAG_CAPTURE;
        }

        // castling

        if (stm === WHITE) {
          if ((curRights & WHITE_RIGHTS_KING) && !b[0x05] && !b[0x06]
              && !isAttacked(0x04, enemy) && !isAttacked(0x05, enemy) && !isAttacked(0x06, enemy))
            moves[numMoves++] = from | 0x06 | MOVE_FLAG_CASTLE;
          if ((curRights & WHITE_RIGHTS_QUEEN) && !b[0x03] && !b[0x02] && !b[0x01]
              && !isAttacked(0x04, enemy) && !isAttacked(0x03, enemy) && !isAttacked(0x02, enemy))
            moves[numMoves++] = from | 0x02 | MOVE_FLAG_CASTLE;
        }
        else {
          if ((curRights & BLACK_RIGHTS_KING) && !b[0x75] && !b[0x76]
              && !isAttacked(0x74, enemy) && !isAttacked(0x75, enemy) && !isAttacked(0x76, enemy))
            moves[numMoves++] = from | 0x76 | MOVE_FLAG_CASTLE;
          if ((curRights & BLACK_RIGHTS_QUEEN) && !b[0x73] && !b[0x72] && !b[0x71]
              && !isAttacked(0x74, enemy) && !isAttacked(0x73, enemy) && !isAttacked(0x72, enemy))
            moves[numMoves++] = from | 0x72 | MOVE_FLAG_CASTLE;
        }

        break;
      }
    }
  }

  node.numMoves = numMoves;
}
