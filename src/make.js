const RIGHTS_MASK = new Uint8Array(128);
RIGHTS_MASK.fill(0xF);
RIGHTS_MASK[0x00] = 0xF ^ RIGHTS_Q;
RIGHTS_MASK[0x07] = 0xF ^ RIGHTS_K;
RIGHTS_MASK[0x70] = 0xF ^ RIGHTS_q;
RIGHTS_MASK[0x77] = 0xF ^ RIGHTS_k;
RIGHTS_MASK[0x04] = 0xF ^ RIGHTS_K ^ RIGHTS_Q;
RIGHTS_MASK[0x74] = 0xF ^ RIGHTS_k ^ RIGHTS_q;

function makeMove(move, pos) {

  const from = (move >> 8) & 0x7f;
  const to = move & 0x7f;

  pos.board[to] = pos.board[from];
  pos.board[from] = 0;
  pos.ep = 0;
  
  if (move & MOVE_EXTRA_MASK) {

    const piece = pos.board[to];

    if (move & MOVE_FLAG_KING) {
      pos.kings[piece >> 3] = to;
    }

    else if (move & MOVE_PROMO_MASK) {
      pos.board[to] = pos.stm | (move & MOVE_PROMO_MASK) >> MOVE_PROMO_SHIFT;
    }

    else if (move & MOVE_FLAG_EPMAKE) {
      pos.ep = pos.stm === WHITE ? to - 16 : to + 16;
    }

    else if (move & MOVE_FLAG_EPCAPTURE) {
      const capSq = pos.stm === WHITE ? to - 16 : to + 16;
      pos.board[capSq] = 0;
    }
    
    else if (move & MOVE_FLAG_KCASTLE) {
      pos.kings[piece >> 3] = to;
      pos.board[to - 1] = pos.board[to + 1];
      pos.board[to + 1] = 0;
    }

    else if (move & MOVE_FLAG_QCASTLE) {
      pos.kings[piece >> 3] = to;
      pos.board[to + 1] = pos.board[to - 2];
      pos.board[to - 2] = 0;
    }
  }

  pos.rights &= RIGHTS_MASK[from] & RIGHTS_MASK[to];
  pos.stm ^= BLACK;

}