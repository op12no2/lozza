/*{{{  move generation*/

/*{{{  init_rights_masks*/

static void init_rights_masks(void) {

  for (int sq=0; sq < 64; ++sq)
    rights_masks[sq] = ALL_RIGHTS;

  rights_masks[A1] &= ~WHITE_RIGHTS_QUEEN;
  rights_masks[H1] &= ~WHITE_RIGHTS_KING;
  rights_masks[E1] &= ~(WHITE_RIGHTS_KING | WHITE_RIGHTS_QUEEN);

  rights_masks[A8] &= ~BLACK_RIGHTS_QUEEN;
  rights_masks[H8] &= ~BLACK_RIGHTS_KING;
  rights_masks[E8] &= ~(BLACK_RIGHTS_KING | BLACK_RIGHTS_QUEEN);

}

/*}}}*/
/*{{{  is_attacked*/

static int is_attacked(const Position *const pos, const int sq, const int opp) {

  const uint64_t *const RESTRICT all = pos->all;
  const int base                     = colour_index(opp);

  if (all[base+KNIGHT] & knight_attacks[sq])    return 1;
  if (all[base+PAWN]   & pawn_attacks[opp][sq]) return 1;
  if (all[base+KING]   & king_attacks[sq])      return 1;

  const uint64_t occ   = pos->occupied;
  const uint64_t all_q = all[base+QUEEN];

  {
    const uint64_t opp             = all[base+ROOK] | all_q;
    const Attack *const RESTRICT a = &rook_attacks[sq];
    const uint64_t blockers        = occ & a->mask;
    const uint64_t attacks         = a->attacks[magic_index(blockers, a->magic, a->shift)];
    if (attacks & opp) return 1;
  }

  {
    const uint64_t opp             = all[base+BISHOP] | all_q;
    const Attack *const RESTRICT a = &bishop_attacks[sq];
    const uint64_t blockers        = occ & a->mask;
    const uint64_t attacks         = a->attacks[magic_index(blockers, a->magic, a->shift)];
    if (attacks & opp) return 1;
  }

  return 0;

}

/*}}}*/

/*{{{  gen_pawns*/

/*{{{  gen_pawns_white_quiet*/

static void gen_pawns_white_quiet(Node *const node) {

  const Position *const pos = &node->pos;
  const uint64_t pawns      = pos->all[WPAWN];
  const uint64_t occupied   = pos->occupied;
  move_t *const RESTRICT m  = node->moves + node->num_moves;
  int n                     = 0;

  /*{{{  push 1*/
  
  const uint64_t one = (pawns << 8) & ~occupied;
  uint64_t quiet     = one & ~RANK_8;
  uint64_t promo     = one &  RANK_8;
  
  while (quiet) {
    const int to = bsf(quiet); quiet &= quiet - 1;
    m[n++]       = encode_move(to - 8, to, MT_PAWN_PUSH);
  }
  
  while (promo) {
  
    const int to   = bsf(promo); promo &= promo - 1;
    const int from = to - 8;
  
    m[n++] = encode_move(from, to, MT_PROMO_PUSH_Q);
    m[n++] = encode_move(from, to, MT_PROMO_PUSH_R);
    m[n++] = encode_move(from, to, MT_PROMO_PUSH_B);
    m[n++] = encode_move(from, to, MT_PROMO_PUSH_N);
  
  }
  
  /*}}}*/
  /*{{{  push 2*/
  
  uint64_t two = ((one & RANK_3) << 8) & ~occupied;
  
  while (two) {
    int to = bsf(two); two &= two - 1;
    m[n++] = encode_move(to - 16, to, MT_EP_PUSH);
  }
  
  /*}}}*/

  node->num_moves += n;

}

/*}}}*/
/*{{{  gen_pawns_white_noisy*/

static void gen_pawns_white_noisy(Node *const node) {

  const Position *const pos = &node->pos;
  const uint64_t pawns      = pos->all[WPAWN];
  const uint64_t enemies    = pos->colour[BLACK];
  move_t *const RESTRICT m  = node->moves + node->num_moves;
  int n                     = 0;

  /*{{{  captures*/
  
  const uint64_t left  = ((pawns << 7) & NOT_H_FILE) & enemies;
  const uint64_t right = ((pawns << 9) & NOT_A_FILE) & enemies;
  
  uint64_t cap   = left & ~RANK_8;
  uint64_t promo = left &  RANK_8;
  
  while (cap) {
    int to = bsf(cap); cap &= cap - 1;
    m[n++] = encode_move(to - 7, to, MT_PAWN_CAPTURE);
  }
  
  while (promo) {
  
    int to         = bsf(promo); promo &= promo - 1;
    const int from = to - 7;
  
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_Q);
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_R);
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_B);
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_N);
  
  }
  
  cap   = right & ~RANK_8;
  promo = right &  RANK_8;
  
  while (cap) {
    const int to = bsf(cap); cap &= cap - 1;
    m[n++]       = encode_move(to - 9, to, MT_PAWN_CAPTURE);
  }
  
  while (promo) {
  
    const int to   = bsf(promo); promo &= promo - 1;
    const int from = to - 9;
  
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_Q);
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_R);
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_B);
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_N);
  
  }
  
  /*}}}*/
  /*{{{  ep*/
  
  if (pos->ep) {
  
    uint64_t ep_from = pawn_attacks[WHITE][pos->ep] & pawns;
  
    while (ep_from) {
      const int from = bsf(ep_from); ep_from &= ep_from - 1;
      m[n++]         = encode_move(from, pos->ep, MT_EP_CAPTURE);
    }
  
  }
  
  /*}}}*/

  node->num_moves += n;

}

/*}}}*/

/*{{{  gen_pawns_black_quiet*/

static void gen_pawns_black_quiet(Node *const node) {

  const Position *const pos = &node->pos;
  const uint64_t pawns      = pos->all[BPAWN];
  const uint64_t occupied   = pos->occupied;
  move_t *const RESTRICT m  = node->moves + node->num_moves;
  int n                     = 0;

  /*{{{  push 1*/
  
  const uint64_t one = (pawns >> 8) & ~occupied;
  uint64_t quiet     = one & ~RANK_1;
  uint64_t promo     = one &  RANK_1;
  
  while (quiet) {
    const int to = bsf(quiet); quiet &= quiet - 1;
    m[n++]       = encode_move(to + 8, to, MT_PAWN_PUSH);
  }
  
  while (promo) {
  
    const int to   = bsf(promo); promo &= promo - 1;
    const int from = to + 8;
  
    m[n++] = encode_move(from, to, MT_PROMO_PUSH_Q);
    m[n++] = encode_move(from, to, MT_PROMO_PUSH_R);
    m[n++] = encode_move(from, to, MT_PROMO_PUSH_B);
    m[n++] = encode_move(from, to, MT_PROMO_PUSH_N);
  
  }
  
  /*}}}*/
  /*{{{  push 2*/
  
  uint64_t two = ((one & RANK_6) >> 8) & ~occupied;
  
  while (two) {
    int to = bsf(two); two &= two - 1;
    m[n++] = encode_move(to + 16, to, MT_EP_PUSH);
  }
  
  /*}}}*/

  node->num_moves += n;

}

/*}}}*/
/*{{{  gen_pawns_black_noisy*/

static void gen_pawns_black_noisy(Node *const node) {

  const Position *const pos = &node->pos;
  const uint64_t pawns      = pos->all[BPAWN];
  const uint64_t enemies    = pos->colour[WHITE];
  move_t *const RESTRICT m  = node->moves + node->num_moves;
  int n                     = 0;

  /*{{{  captures*/
  
  const uint64_t left  = ((pawns >> 9) & NOT_H_FILE) & enemies;
  const uint64_t right = ((pawns >> 7) & NOT_A_FILE) & enemies;
  
  uint64_t cap   = left & ~RANK_1;
  uint64_t promo = left &  RANK_1;
  
  while (cap) {
    const int to = bsf(cap); cap &= cap - 1;
    m[n++]       = encode_move(to + 9, to, MT_PAWN_CAPTURE);
  }
  
  while (promo) {
  
    const int to   = bsf(promo); promo &= promo - 1;
    const int from = to + 9;
  
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_Q);
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_R);
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_B);
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_N);
  
  }
  
  cap   = right & ~RANK_1;
  promo = right &  RANK_1;
  
  while (cap) {
    const int to = bsf(cap); cap &= cap - 1;
    m[n++]       = encode_move(to + 7, to, MT_PAWN_CAPTURE);
  }
  
  while (promo) {
  
    const int to   = bsf(promo); promo &= promo - 1;
    const int from = to + 7;
  
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_Q);
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_R);
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_B);
    m[n++] = encode_move(from, to, MT_PROMO_CAPTURE_N);
  
  }
  
  /*}}}*/
  /*{{{  ep*/
  
  if (pos->ep) {
  
    uint64_t ep_from = pawn_attacks[BLACK][pos->ep] & pawns;
  
    while (ep_from) {
      const int from = bsf(ep_from); ep_from &= ep_from - 1;
      m[n++]         = encode_move(from, pos->ep, MT_EP_CAPTURE);
    }
  
  }
  
  /*}}}*/

  node->num_moves += n;

}

/*}}}*/

static inline void gen_pawns_quiet(Node *const node) {
  if (node->pos.stm == WHITE)
    gen_pawns_white_quiet(node);
  else
    gen_pawns_black_quiet(node);
}

static inline void gen_pawns_noisy(Node *const node) {
  if (node->pos.stm == WHITE)
    gen_pawns_white_noisy(node);
  else
    gen_pawns_black_noisy(node);
}

/*}}}*/
/*{{{  gen_jumpers*/

static void gen_jumpers(Node *const node, const uint64_t *const attack_table, const int piece, const uint64_t targets, const int flag) {

  const Position *const pos = &node->pos;
  const int stm             = pos->stm;
  move_t *const RESTRICT m  = node->moves + node->num_moves;
  int n                     = 0;
  uint64_t bb               = pos->all[piece_index(piece, stm)];

  while (bb) {

    const int from   = bsf(bb); bb &= bb - 1;
    uint64_t attacks = attack_table[from] & targets;

    while (attacks) {
      const int to = bsf(attacks); attacks &= attacks - 1;
      m[n++]       = encode_move(from, to, flag);
    }

  }

  node->num_moves += n;

}

/*}}}*/
/*{{{  gen_sliders*/

static void gen_sliders(Node *const node, const Attack *const RESTRICT attack_table, const int piece, const uint64_t targets, const int flag) {

  const Position *const pos = &node->pos;
  const int stm             = pos->stm;
  const uint64_t occ        = pos->occupied;
  move_t *const RESTRICT m  = node->moves + node->num_moves;
  int n                     = 0;
  uint64_t bb               = pos->all[piece_index(piece, stm)];

  while (bb) {

    const int from                 = bsf(bb); bb &= bb - 1;
    const Attack *const RESTRICT a = &attack_table[from];
    const uint64_t blockers        = occ & a->mask;
    const int index                = magic_index(blockers, a->magic, a->shift);
    uint64_t attacks               = a->attacks[index] & targets;

    while (attacks) {
      const int to = bsf(attacks); attacks &= attacks - 1;
      m[n++]       = encode_move(from, to, flag);
    }

  }

  node->num_moves += n;

}

/*}}}*/
/*{{{  gen_castling*/

static void gen_castling(Node *const node) {

  const Position *const pos = &node->pos;
  const int stm             = pos->stm;
  const int opp             = stm ^ 1;
  const uint8_t rights      = pos->rights;
  const uint64_t occupied   = pos->occupied;
  move_t *const RESTRICT m  = node->moves + node->num_moves;
  int n                     = 0;

  if (stm == WHITE) {

    if ((rights & WHITE_RIGHTS_KING) &&
         !(occupied & 0x0000000000000060ULL) &&
         !is_attacked(pos, F1, opp) &&
         !is_attacked(pos, G1, opp)) {
      m[n++] = encode_move(E1, G1, MT_CASTLE);
    }

    if ((rights & WHITE_RIGHTS_QUEEN) &&
         !(occupied & 0x000000000000000EULL) &&
         !is_attacked(pos, D1, opp) &&
         !is_attacked(pos, C1, opp)) {
      m[n++] = encode_move(E1, C1, MT_CASTLE);
    }

  }

  else {

    if ((rights & BLACK_RIGHTS_KING) &&
         !(occupied & 0x6000000000000000ULL) &&
         !is_attacked(pos, F8, opp) &&
         !is_attacked(pos, G8, opp)) {
      m[n++] = encode_move(E8, G8, MT_CASTLE);
    }

    if ((rights & BLACK_RIGHTS_QUEEN) &&
         !(occupied & 0x0E00000000000000ULL) &&
         !is_attacked(pos, D8, opp) &&
         !is_attacked(pos, C8, opp)) {
      m[n++] = encode_move(E8, C8, MT_CASTLE);
    }

  }

  node->num_moves += n;

}

/*}}}*/

/*{{{  gen_noisy*/

static void gen_noisy(Node *const node) {

  const Position *const pos    = &node->pos;
  const int stm                = pos->stm;
  const int opp                = stm ^ 1;
  const uint64_t opp_king_bb   = pos->all[piece_index(KING, opp)];
  const uint64_t opp_king_near = king_attacks[bsf(opp_king_bb)];
  const uint64_t enemies       = pos->colour[opp] & ~opp_king_bb;
  uint64_t targets             = enemies;

  if (node->in_check) {
    const int our_king_sq = bsf(pos->all[piece_index(KING, stm)]);
    targets               &= all_attacks_inc_edge[our_king_sq];
  }

  gen_pawns_noisy(node);
  gen_jumpers(node, knight_attacks, KNIGHT, targets,                  MT_CAPTURE);
  gen_sliders(node, bishop_attacks, BISHOP, targets,                  MT_CAPTURE);
  gen_sliders(node, rook_attacks,   ROOK,   targets,                  MT_CAPTURE);
  gen_sliders(node, bishop_attacks, QUEEN,  targets,                  MT_CAPTURE);
  gen_sliders(node, rook_attacks,   QUEEN,  targets,                  MT_CAPTURE);
  gen_jumpers(node, king_attacks,   KING,   enemies & ~opp_king_near, MT_CAPTURE);

}

/*}}}*/
/*{{{  gen_quiet*/

static void gen_quiet(Node *const node) {

  const Position *const pos    = &node->pos;
  const int stm                = pos->stm;
  const int opp                = stm ^ 1;
  const uint64_t occ           = pos->occupied;
  const uint64_t opp_king_bb   = pos->all[piece_index(KING, opp)];
  const uint64_t opp_king_near = king_attacks[bsf(opp_king_bb)];
  uint64_t targets             = ~occ;

  if (node->in_check) {
    const int our_king_sq = bsf(pos->all[piece_index(KING, stm)]);
    targets               &= all_attacks[our_king_sq];
  }

  gen_pawns_quiet(node);
  gen_jumpers(node, knight_attacks, KNIGHT, targets,               MT_NON_PAWN_PUSH);
  gen_sliders(node, bishop_attacks, BISHOP, targets,               MT_NON_PAWN_PUSH);
  gen_sliders(node, rook_attacks,   ROOK,   targets,               MT_NON_PAWN_PUSH);
  gen_sliders(node, bishop_attacks, QUEEN,  targets,               MT_NON_PAWN_PUSH);
  gen_sliders(node, rook_attacks,   QUEEN,  targets,               MT_NON_PAWN_PUSH);
  gen_jumpers(node, king_attacks,   KING,   ~occ & ~opp_king_near, MT_NON_PAWN_PUSH);

  if (node->pos.rights && !node->in_check)
    gen_castling(node);

}
