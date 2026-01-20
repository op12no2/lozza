#include "position.h"
#include "move.h"
#include "types.h"

// rook squares for castling indexed by king destination
static const int rook_from[64] = {
  [G1] = H1, [C1] = A1,
  [G8] = H8, [C8] = A8,
};

static const int rook_to[64] = {
  [G1] = F1, [C1] = D1,
  [G8] = F8, [C8] = D8,
};

// AND with rights to update - 15 means no change
static const uint8_t rights_mask[64] = {
  13, 15, 15, 15, 12, 15, 15, 14,  // A1=13, E1=12, H1=14
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
   7, 15, 15, 15,  3, 15, 15, 11,  // A8=7, E8=3, H8=11
};

static inline void remove_piece(Position *pos, int sq, int piece) {

  uint64_t bb = 1ULL << sq;

  pos->board[sq] = EMPTY;
  pos->all[piece] ^= bb;
  pos->colour[piece_colour(piece)] ^= bb;
  pos->occupied ^= bb;

}

static inline void place_piece(Position *pos, int sq, int piece) {

  uint64_t bb = 1ULL << sq;

  pos->board[sq] = piece;
  pos->all[piece] |= bb;
  pos->colour[piece_colour(piece)] |= bb;
  pos->occupied |= bb;

}

void make_move(Position *pos, const move_t move) {

  const int stm = pos->stm;
  const int opp = stm ^ 1;
  const int from = (move >> 6) & 0x3F;
  const int to = move & 0x3F;
  const int flags = move & 0xFFF000;
  const int piece = pos->board[from];

  // remove piece from source
  remove_piece(pos, from, piece);

  // handle capture (check EP first since EP moves have both flags set)
  if (flags & MOVE_FLAG_EPCAPTURE) {

    // captured pawn is behind the to square
    int ep_sq = to + (stm == WHITE ? -8 : 8);
    int opp_pawn = piece_index(PAWN, opp);
    remove_piece(pos, ep_sq, opp_pawn);
    pos->hmc = 0;

  }
  else if (flags & MOVE_FLAG_CAPTURE) {

    int captured = pos->board[to];
    remove_piece(pos, to, captured);
    pos->hmc = 0;

  }
  else {

    pos->hmc++;

  }

  // handle promotion or place the piece
  if (flags & MOVE_FLAG_PROMOTE) {

    int promo_piece = piece_index((move >> 12) & 0x7, stm);  // N=1,B=2,R=3,Q=4
    place_piece(pos, to, promo_piece);
    pos->hmc = 0;

  }
  else {

    place_piece(pos, to, piece);

  }

  // handle castling rook
  if (flags & MOVE_FLAG_CASTLE) {

    int rook = piece_index(ROOK, stm);
    int rf = rook_from[to];
    int rt = rook_to[to];
    remove_piece(pos, rf, rook);
    place_piece(pos, rt, rook);

  }

  // update EP square
  if (flags & MOVE_FLAG_PAWN2) {

    pos->ep = from + (stm == WHITE ? 8 : -8);

  }
  else {

    pos->ep = 0;

  }

  // update castling rights
  pos->rights &= rights_mask[from] & rights_mask[to];

  // pawn moves reset HMC
  if (piece_type(piece) == PAWN)
    pos->hmc = 0;

  // toggle side to move
  pos->stm ^= 1;

}
