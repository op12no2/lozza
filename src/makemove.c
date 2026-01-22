#include <string.h>
#include "builtins.h"
#include "nodes.h"
#include "move.h"
#include "types.h"
#include "iterate.h"

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


void make_move(Position *pos, const move_t move) {

  uint8_t *board = pos->board;
  uint64_t *all = pos->all;
  uint64_t *colour = pos->colour;
  const int stm = pos->stm;
  const int opp = stm ^ 1;
  const int flags = move & 0xFFF000;
  const int from = (move >> 6) & 0x3F;
  const int from_piece = board[from];
  const uint64_t from_bb = 1ULL << from;
  const int to = move & 0x3F;
  const uint64_t to_bb = 1ULL << to;
  
  board[from] = EMPTY;
  all[from_piece] ^= from_bb;
  colour[stm] ^= from_bb;
  
  pos->ep = 0;
  
  if (flags & MOVE_FLAG_EXTRA) {
    
    if (flags & MOVE_FLAG_CAPTURE) {
      if (flags & MOVE_FLAG_EPCAPTURE) {
        const int ep = to + (stm ? 8 : -8);
        const uint64_t cap_bb = 1ULL << ep;
        const int cap_piece = board[ep];
        board[ep] = EMPTY;
        all[cap_piece] ^= cap_bb;
        colour[opp] ^= cap_bb;
      }
      else {
        const int to_piece = board[to];
        all[to_piece] ^= to_bb;
        colour[opp] ^= to_bb;
      }
    }

    if (flags & MOVE_FLAG_PROMOTE) {
      const int promo_piece = piece_index((flags >> 12) & 7, stm);
      board[to] = promo_piece;
      all[promo_piece] ^= to_bb;
      colour[stm] ^= to_bb;
    }
    else {
      board[to] = from_piece;
      all[from_piece] ^= to_bb;
      colour[stm] ^= to_bb;

      if (flags & MOVE_FLAG_CASTLE) {
        const int rf = rook_from[to];
        const int rt = rook_to[to];
        const uint64_t rf_bb = 1ULL << rf;
        const uint64_t rt_bb = 1ULL << rt;
        const int rook_piece = board[rf];
        board[rf] = EMPTY;
        board[rt] = rook_piece;
        all[rook_piece] ^= rf_bb ^ rt_bb;
        colour[stm] ^= rf_bb ^ rt_bb;
      }
      else if (flags & MOVE_FLAG_PAWN2) {
        pos->ep = (from + to) >> 1;
      }
    }

  }
  else {
    board[to] = from_piece;
    all[from_piece] ^= to_bb;
    colour[stm] ^= to_bb;
  }

  pos->rights &= rights_mask[from] & rights_mask[to];
  pos->occupied = colour[WHITE] | colour[BLACK];
  pos->stm = opp;

}

void play_move(Node *node, char *uci_move) {

  char buf[6];

  Position *pos = &node->pos;
  const int stm = pos->stm;
  const int opp = stm ^ 1;
  const int stm_king_sq = piece_index(KING, stm);
  const int in_check = is_attacked(pos, bsf(pos->all[stm_king_sq]), opp);
  move_t move ;

  init_next_search_move(node, in_check, 0);

  while ((move = get_next_search_move(node))) {

    format_move(move, buf);
    if (!strcmp(uci_move, buf)) {
      make_move(pos, move);
      return;
    }
  }

  return;

}
