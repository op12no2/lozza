#include <stdint.h>
#include "types.h"
#include "builtins.h"
#include "nodes.h"
#include "position.h"
#include "move.h"
#include "movegen.h"
#include "bitboard.h"

static void gen_pawns_white_quiets(Node *node) {

  const Position *pos = &node->pos;
  const uint64_t pawns = pos->all[WPAWN];
  const uint64_t occupied = pos->occupied;
  move_t *m = node->moves + node->num_moves;
  int n = 0;

  // push 1
  
  const uint64_t one = (pawns << 8) & ~occupied;
  uint64_t quiet = one & ~RANK_8;
  uint64_t promo = one & RANK_8;
  
  while (quiet) {
    const int to = bsf(quiet); quiet &= quiet - 1;
    m[n++] = encode_move(to - 8, to, 0);
  }
  
  while (promo) {
  
    const int to = bsf(promo); promo &= promo - 1;
    const int from = to - 8;
  
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_Q);
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_R);
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_B);
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_N);
  
  }
  
  // push 2

  uint64_t two = ((one & RANK_3) << 8) & ~occupied;
  
  while (two) {
    int to = bsf(two); two &= two - 1;
    m[n++] = encode_move(to - 16, to, MOVE_FLAG_PAWN2);
  }
  
  node->num_moves += n;

}

static void gen_pawns_white_captures(Node *node) {

  const Position *pos = &node->pos;
  const uint64_t pawns = pos->all[WPAWN];
  const uint64_t enemies = pos->colour[BLACK];
  move_t *m = node->moves + node->num_moves;
  int n = 0;

  const uint64_t left = ((pawns << 7) & NOT_H_FILE) & enemies;
  const uint64_t right = ((pawns << 9) & NOT_A_FILE) & enemies;
  
  uint64_t cap = left & ~RANK_8;
  uint64_t promo = left &  RANK_8;
  
  while (cap) {
    int to = bsf(cap); cap &= cap - 1;
    m[n++] = encode_move(to - 7, to, MOVE_FLAG_CAPTURE);
  }
  
  while (promo) {
  
    int to = bsf(promo); promo &= promo - 1;
    const int from = to - 7;
  
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_Q | MOVE_FLAG_CAPTURE);
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_R | MOVE_FLAG_CAPTURE);
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_B | MOVE_FLAG_CAPTURE);
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_N | MOVE_FLAG_CAPTURE);

  }

  cap = right & ~RANK_8;
  promo = right &  RANK_8;
  
  while (cap) {
    const int to = bsf(cap); cap &= cap - 1;
    m[n++] = encode_move(to - 9, to, MOVE_FLAG_CAPTURE);
  }
  
  while (promo) {
  
    const int to = bsf(promo); promo &= promo - 1;
    const int from = to - 9;
  
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_Q | MOVE_FLAG_CAPTURE);
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_R | MOVE_FLAG_CAPTURE);
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_B | MOVE_FLAG_CAPTURE);
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_N | MOVE_FLAG_CAPTURE);
  
  }
  
  if (pos->ep) {
  
    uint64_t ep_from = pawn_attacks[WHITE][pos->ep] & pawns;
  
    while (ep_from) {
      const int from = bsf(ep_from); ep_from &= ep_from - 1;
      m[n++] = encode_move(from, pos->ep, MOVE_FLAG_CAPTURE | MOVE_FLAG_EPCAPTURE);
    }
  
  }
  
  node->num_moves += n;

}

static void gen_pawns_black_quiets(Node *node) {

  const Position *pos = &node->pos;
  const uint64_t pawns = pos->all[BPAWN];
  const uint64_t occupied = pos->occupied;
  move_t *m = node->moves + node->num_moves;
  int n = 0;

  const uint64_t one = (pawns >> 8) & ~occupied;
  uint64_t quiet = one & ~RANK_1;
  uint64_t promo = one & RANK_1;
  
  while (quiet) {
    const int to = bsf(quiet); quiet &= quiet - 1;
    m[n++]  = encode_move(to + 8, to, 0);
  }
  
  while (promo) {
  
    const int to = bsf(promo); promo &= promo - 1;
    const int from = to + 8;
  
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_Q);
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_R);
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_B);
    m[n++] = encode_move(from, to, MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_N);
  
  }
  
  uint64_t two = ((one & RANK_6) >> 8) & ~occupied;
  
  while (two) {
    int to = bsf(two); two &= two - 1;
    m[n++] = encode_move(to + 16, to, MOVE_FLAG_PAWN2);
  }
  
  node->num_moves += n;

}

static void gen_pawns_black_captures(Node *node) {

  const Position *pos = &node->pos;
  const uint64_t pawns = pos->all[BPAWN];
  const uint64_t enemies = pos->colour[WHITE];
  move_t *m = node->moves + node->num_moves;
  int n = 0;

  const uint64_t left = ((pawns >> 9) & NOT_H_FILE) & enemies;
  const uint64_t right = ((pawns >> 7) & NOT_A_FILE) & enemies;
  
  uint64_t cap = left & ~RANK_1;
  uint64_t promo = left &  RANK_1;
  
  while (cap) {
    const int to = bsf(cap); cap &= cap - 1;
    m[n++] = encode_move(to + 9, to, MOVE_FLAG_CAPTURE);
  }
  
  while (promo) {
  
    const int to = bsf(promo); promo &= promo - 1;
    const int from = to + 9;
  
    m[n++] = encode_move(from, to, MOVE_FLAG_CAPTURE | MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_Q);
    m[n++] = encode_move(from, to, MOVE_FLAG_CAPTURE | MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_R);
    m[n++] = encode_move(from, to, MOVE_FLAG_CAPTURE | MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_B);
    m[n++] = encode_move(from, to, MOVE_FLAG_CAPTURE | MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_N);
  
  }
  
  cap = right & ~RANK_1;
  promo = right &  RANK_1;
  
  while (cap) {
    const int to = bsf(cap); cap &= cap - 1;
    m[n++] = encode_move(to + 7, to, MOVE_FLAG_CAPTURE);
  }
  
  while (promo) {
  
    const int to = bsf(promo); promo &= promo - 1;
    const int from = to + 7;
  
    m[n++] = encode_move(from, to, MOVE_FLAG_CAPTURE | MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_Q);
    m[n++] = encode_move(from, to, MOVE_FLAG_CAPTURE | MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_R);
    m[n++] = encode_move(from, to, MOVE_FLAG_CAPTURE | MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_B);
    m[n++] = encode_move(from, to, MOVE_FLAG_CAPTURE | MOVE_FLAG_PROMOTE | MOVE_FLAG_PROMOTE_N);
  
  }
  
  if (pos->ep) {
  
    uint64_t ep_from = pawn_attacks[BLACK][pos->ep] & pawns;
  
    while (ep_from) {
      const int from = bsf(ep_from); ep_from &= ep_from - 1;
      m[n++] = encode_move(from, pos->ep, MOVE_FLAG_CAPTURE | MOVE_FLAG_EPCAPTURE);
    }

  }

  node->num_moves += n;

}

static inline void gen_pawns_quiets(Node *const node) {
  if (node->pos.stm == WHITE)
    gen_pawns_white_quiets(node);
  else
    gen_pawns_black_quiets(node);
}

static inline void gen_pawns_captures(Node *const node) {
  if (node->pos.stm == WHITE)
    gen_pawns_white_captures(node);
  else
    gen_pawns_black_captures(node);
}

static void gen_jumpers(Node *node, const uint64_t *attack_table, const int piece, const uint64_t targets, const uint32_t flags) {

  const Position *pos = &node->pos;
  const int stm = pos->stm;
  move_t *m = node->moves + node->num_moves;
  int n = 0;
  uint64_t bb = pos->all[piece_index(piece, stm)];

  while (bb) {

    const int from = bsf(bb); bb &= bb - 1;
    uint64_t attacks = attack_table[from] & targets;

    while (attacks) {
      const int to = bsf(attacks); attacks &= attacks - 1;
      m[n++] = encode_move(from, to, flags);
    }

  }

  node->num_moves += n;

}

static void gen_sliders(Node *node, const Attack *attack_table, const int piece, const uint64_t targets, const uint32_t flags) {

  const Position *pos = &node->pos;
  const int stm = pos->stm;
  const uint64_t occ = pos->occupied;
  move_t *m  = node->moves + node->num_moves;
  int n = 0;
  uint64_t bb = pos->all[piece_index(piece, stm)];

  while (bb) {

    const int from  = bsf(bb); bb &= bb - 1;
    const Attack *a = &attack_table[from];
    const uint64_t blockers = occ & a->mask;
    const int index = magic_index(blockers, a->magic, a->shift);
    uint64_t attacks = a->attacks[index] & targets;

    while (attacks) {
      const int to = bsf(attacks); attacks &= attacks - 1;
      m[n++] = encode_move(from, to, flags);
    }

  }

  node->num_moves += n;

}

static void gen_castling(Node *node) {

  const Position *pos = &node->pos;
  const int stm = pos->stm;
  const int opp = stm ^ 1;
  const uint8_t rights = pos->rights;
  const uint64_t occupied = pos->occupied;
  move_t *m = node->moves + node->num_moves;
  int n = 0;

  if (stm == WHITE) {

    if ((rights & WHITE_RIGHTS_KING) &&
         !(occupied & 0x0000000000000060ULL) &&
         !is_attacked(pos, F1, opp) &&
         !is_attacked(pos, G1, opp)) {
      m[n++] = encode_move(E1, G1, MOVE_FLAG_CASTLE);
    }

    if ((rights & WHITE_RIGHTS_QUEEN) &&
         !(occupied & 0x000000000000000EULL) &&
         !is_attacked(pos, D1, opp) &&
         !is_attacked(pos, C1, opp)) {
      m[n++] = encode_move(E1, C1, MOVE_FLAG_CASTLE);
    }

  }

  else {

    if ((rights & BLACK_RIGHTS_KING) &&
         !(occupied & 0x6000000000000000ULL) &&
         !is_attacked(pos, F8, opp) &&
         !is_attacked(pos, G8, opp)) {
      m[n++] = encode_move(E8, G8, MOVE_FLAG_CASTLE);
    }

    if ((rights & BLACK_RIGHTS_QUEEN) &&
         !(occupied & 0x0E00000000000000ULL) &&
         !is_attacked(pos, D8, opp) &&
         !is_attacked(pos, C8, opp)) {
      m[n++] = encode_move(E8, C8, MOVE_FLAG_CASTLE);
    }

  }

  node->num_moves += n;

}

void gen_captures(Node *node, const int in_check) {

  const Position *pos = &node->pos;
  const int stm = pos->stm;
  const int opp = stm ^ 1;
  const uint64_t opp_king_bb = pos->all[piece_index(KING, opp)];
  const uint64_t opp_king_near = king_attacks[bsf(opp_king_bb)];
  const uint64_t enemies = pos->colour[opp] & ~opp_king_bb;
  uint64_t targets = enemies;

  if (in_check) {
    const int our_king_sq = bsf(pos->all[piece_index(KING, stm)]);
    targets &= all_attacks_inc_edge[our_king_sq];
  }

  gen_pawns_captures(node);
  gen_jumpers(node, knight_attacks, KNIGHT, targets, MOVE_FLAG_CAPTURE);
  gen_sliders(node, bishop_attacks, BISHOP, targets, MOVE_FLAG_CAPTURE);
  gen_sliders(node, rook_attacks, ROOK, targets, MOVE_FLAG_CAPTURE);
  gen_sliders(node, bishop_attacks, QUEEN, targets, MOVE_FLAG_CAPTURE);
  gen_sliders(node, rook_attacks, QUEEN, targets, MOVE_FLAG_CAPTURE);
  gen_jumpers(node, king_attacks, KING, enemies & ~opp_king_near, MOVE_FLAG_CAPTURE);

}

void gen_quiets(Node *node, const int in_check) {

  const Position *pos = &node->pos;
  const int stm = pos->stm;
  const int opp = stm ^ 1;
  const uint64_t occ = pos->occupied;
  const uint64_t opp_king_bb = pos->all[piece_index(KING, opp)];
  const uint64_t opp_king_near = king_attacks[bsf(opp_king_bb)];
  uint64_t targets = ~occ;

  if (in_check) {
    const int our_king_sq = bsf(pos->all[piece_index(KING, stm)]);
    targets &= all_attacks[our_king_sq];
  }

  gen_pawns_quiets(node);
  gen_jumpers(node, knight_attacks, KNIGHT, targets, 0);
  gen_sliders(node, bishop_attacks, BISHOP, targets, 0);
  gen_sliders(node, rook_attacks, ROOK, targets, 0);
  gen_sliders(node, bishop_attacks, QUEEN, targets, 0);
  gen_sliders(node, rook_attacks, QUEEN, targets, 0);
  gen_jumpers(node, king_attacks, KING, ~occ & ~opp_king_near, 0);

  if (node->pos.rights && !in_check)
    gen_castling(node);

}