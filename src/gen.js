const MOVE_FLAG_CAPTURE    = 0x10000;
const MOVE_FLAG_EPMAKE     = 0x20000;
const MOVE_FLAG_EPCAPTURE  = 0x40000;
const MOVE_FLAG_KCASTLE    = 0x80000;
const MOVE_FLAG_QCASTLE    = 0x100000;
const MOVE_FLAG_KING       = 0x200000;

const MOVE_PROMO_SHIFT = 22;
const MOVE_PROMO_MASK  = 0x7 << MOVE_PROMO_SHIFT;
const MOVE_PROMO_Q     = 5 << MOVE_PROMO_SHIFT;
const MOVE_PROMO_R     = 4 << MOVE_PROMO_SHIFT;
const MOVE_PROMO_B     = 3 << MOVE_PROMO_SHIFT;
const MOVE_PROMO_N     = 2 << MOVE_PROMO_SHIFT;

const MOVE_EXTRA_MASK = MOVE_FLAG_QCASTLE | MOVE_FLAG_KCASTLE | MOVE_FLAG_EPCAPTURE | MOVE_FLAG_EPMAKE | MOVE_FLAG_KING | MOVE_PROMO_MASK;
const MOVE_QS_MASK = MOVE_FLAG_CAPTURE | MOVE_FLAG_EPCAPTURE;

const KNIGHT_OFFSETS = [-33, -31, -18, -14, 14, 18, 31, 33];
const BISHOP_OFFSETS = [-17, -15, 15, 17];
const ROOK_OFFSETS   = [-16, -1, 1, 16];
const QUEEN_OFFSETS  = [-17, -16, -15, -1, 1, 15, 16, 17];
const KING_OFFSETS   = [-17, -16, -15, -1, 1, 15, 16, 17];
const PAWN_CAP_WHITE = [15, 17];
const PAWN_CAP_BLACK = [-15, -17];

function genMoves(node) {

  node.numMoves = 0;

  const pos = node.pos;
  const board = pos.board;
  const stm = pos.stm;
  const nstm = stm ^ BLACK;

  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) continue;

    const piece = board[sq];
    if (!piece) continue;
    if ((piece & BLACK) !== stm) continue;

    const type = piece & 7;

    switch (type) {
      case PAWN: {
        const dir = stm === WHITE ? 16 : -16;
        const startRank = stm === WHITE ? 1 : 6;
        const promoRank = stm === WHITE ? 6 : 1;
        const rank = sq >> 4;
        const isPromo = rank === promoRank;

        // single push
        const to1 = sq + dir;
        if (!(to1 & 0x88) && !board[to1]) {
          if (isPromo) {
            node.moves[node.numMoves++] = to1 | (sq << 8) | MOVE_PROMO_Q;
            node.moves[node.numMoves++] = to1 | (sq << 8) | MOVE_PROMO_R;
            node.moves[node.numMoves++] = to1 | (sq << 8) | MOVE_PROMO_B;
            node.moves[node.numMoves++] = to1 | (sq << 8) | MOVE_PROMO_N;
          }
          else {
            node.moves[node.numMoves++] = to1 | (sq << 8);
            // double push
            if (rank === startRank) {
              const to2 = sq + dir + dir;
              if (!(to2 & 0x88) && !board[to2]) {
                node.moves[node.numMoves++] = to2 | (sq << 8) | MOVE_FLAG_EPMAKE;
              }
            }
          }
        }

        // captures
        const capOffsets = stm === WHITE ? PAWN_CAP_WHITE : PAWN_CAP_BLACK;
        for (const off of capOffsets) {
          const to = sq + off;
          if (to & 0x88) continue;
          const target = board[to];
          if (target && (target & BLACK) === nstm) {
            if (isPromo) {
              node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE | MOVE_PROMO_Q;
              node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE | MOVE_PROMO_R;
              node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE | MOVE_PROMO_B;
              node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE | MOVE_PROMO_N;
            }
            else {
              node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
            }
          }
          else if (to === pos.ep) {
            node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_EPCAPTURE;
          }
        }
        break;
      }

      case KNIGHT: {
        for (const off of KNIGHT_OFFSETS) {
          const to = sq + off;
          if (to & 0x88) continue;
          const target = board[to];
          if (!target) {
            node.moves[node.numMoves++] = to | (sq << 8);
          }
          else if ((target & BLACK) === nstm) {
            node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
          }
        }
        break;
      }

      case BISHOP: {
        for (const off of BISHOP_OFFSETS) {
          let to = sq + off;
          while (!(to & 0x88)) {
            const target = board[to];
            if (!target) {
              node.moves[node.numMoves++] = to | (sq << 8);
            }
            else {
              if ((target & BLACK) === nstm) {
                node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
              }
              break;
            }
            to += off;
          }
        }
        break;
      }

      case ROOK: {
        for (const off of ROOK_OFFSETS) {
          let to = sq + off;
          while (!(to & 0x88)) {
            const target = board[to];
            if (!target) {
              node.moves[node.numMoves++] = to | (sq << 8);
            }
            else {
              if ((target & BLACK) === nstm) {
                node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
              }
              break;
            }
            to += off;
          }
        }
        break;
      }

      case QUEEN: {
        for (const off of QUEEN_OFFSETS) {
          let to = sq + off;
          while (!(to & 0x88)) {
            const target = board[to];
            if (!target) {
              node.moves[node.numMoves++] = to | (sq << 8);
            }
            else {
              if ((target & BLACK) === nstm) {
                node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
              }
              break;
            }
            to += off;
          }
        }
        break;
      }

      case KING: {
        for (const off of KING_OFFSETS) {
          const to = sq + off;
          if (to & 0x88) continue;
          const target = board[to];
          if (!target) {
            node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_KING;
          }
          else if ((target & BLACK) === nstm && (target & 7) !== KING) {
            node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE | MOVE_FLAG_KING;
          }
        }
        break;
      }
    }
  }

  if (pos.rights) {
    if (stm === WHITE) {
      if ((pos.rights & RIGHTS_K) && !board[0x05] && !board[0x06] &&
          !isAttacked(pos, 0x04, BLACK) && !isAttacked(pos, 0x05, BLACK) && !isAttacked(pos, 0x06, BLACK)) {
        node.moves[node.numMoves++] = 0x06 | (0x04 << 8) | MOVE_FLAG_KCASTLE;
      }
      if ((pos.rights & RIGHTS_Q) && !board[0x03] && !board[0x02] && !board[0x01] &&
          !isAttacked(pos, 0x04, BLACK) && !isAttacked(pos, 0x03, BLACK) && !isAttacked(pos, 0x02, BLACK)) {
        node.moves[node.numMoves++] = 0x02 | (0x04 << 8) | MOVE_FLAG_QCASTLE;
      }
    }
    else {
      if ((pos.rights & RIGHTS_k) && !board[0x75] && !board[0x76] &&
          !isAttacked(pos, 0x74, WHITE) && !isAttacked(pos, 0x75, WHITE) && !isAttacked(pos, 0x76, WHITE)) {
        node.moves[node.numMoves++] = 0x76 | (0x74 << 8) | MOVE_FLAG_KCASTLE;
      }
      if ((pos.rights & RIGHTS_q) && !board[0x73] && !board[0x72] && !board[0x71] &&
          !isAttacked(pos, 0x74, WHITE) && !isAttacked(pos, 0x73, WHITE) && !isAttacked(pos, 0x72, WHITE)) {
        node.moves[node.numMoves++] = 0x72 | (0x74 << 8) | MOVE_FLAG_QCASTLE;
      }
    }
  }
}
