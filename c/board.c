/*}}}*/
/*{{{  board*/

/*{{{  ucinewgame*/

static void ucinewgame(void) {

  memset(ss, 0, sizeof(ss));

  if (!tt)
    init_tt(TT_DEFAULT);

  tt_reset();

}

/*}}}*/
/*{{{  init_zob*/

static void init_zob(void) {

  for (int i=0; i < 12*64; i++)
    zob_pieces[i] = rand64();

  zob_stm = rand64();

  for (int i=0; i < 16; i++)
    zob_rights[i] = rand64();

  for (int i=0; i < 64; i++)
    zob_ep[i] = rand64();

  zob_ep[0]     = 0;
  zob_rights[0] = 0;

}

/*}}}*/
/*{{{  mat_draw*/

static int mat_draw(const Position *const pos) {

  const uint64_t *const a = pos->all;
  const int num_pieces    = popcount(pos->occupied);

  if (num_pieces == 2)
    return 1;

  else if (num_pieces == 3 && (a[WKNIGHT] | a[BKNIGHT] | a[WBISHOP] | a[BBISHOP]))
    return 1;

  return 0;

}

/*}}}*/
/*{{{  eval*/

static inline int eval(Node *const node) {

  if (mat_draw(&node->pos))
    return 0;

  return net_eval(node);

}

/*}}}*/
/*{{{  play_move*/

static void play_move(Node *const node, char *uci_move) {

  char buf[6];

  Position *const pos   = &node->pos;
  const int stm         = pos->stm;
  const int opp         = stm ^ 1;
  const int stm_king_sq = piece_index(KING, stm);
  const int in_check    = is_attacked(pos, bsf(pos->all[stm_king_sq]), opp);
  move_t move           = 0;

  init_next_search_move(node, in_check, 0);

  while ((move = get_next_search_move(node))) {

    format_move(move, buf);
    if (!strcmp(uci_move, buf)) {
      make_move_pre(pos, move);
      make_move_post(pos);
      net_update_accs(node);
      return;
    }
  }

  fprintf(stderr, "info cannot find uci move %s\n", uci_move);

}

/*}}}*/
/*{{{  position*/

static void position(Node *const node, const char *board_fen, const char *stm_str, const char *rights_str, const char *ep_str, int num_uci_moves, char **uci_moves) {

  Position *const pos = &node->pos;

  static const int char_to_piece[128] = {
    ['p'] = 0, ['n'] = 1, ['b'] = 2, ['r'] = 3, ['q'] = 4, ['k'] = 5,
  };

  memset(pos, 0, sizeof(Position));

  /*{{{  board*/
  
  for (int i=0; i < 64; i++)
    pos->board[i] = EMPTY;
  
  int sq = 56;
  
  for (const char *p = board_fen; *p; ++p) {
  
    if (*p == '/') {
      sq -= 16;
    }
  
    else if (isdigit(*p)) {
      sq += *p - '0';
    }
  
    else {
  
      int colour = !!islower(*p);
      int piece  = char_to_piece[tolower(*p)];  // 0-5
      int index  = piece_index(piece, colour);  // 0-11
  
      uint64_t bb = 1ULL << sq;
  
      pos->all[index]     |= bb;
      pos->occupied       |= bb;
      pos->colour[colour] |= bb;
  
      pos->board[sq] = index;
  
      pos->hash ^= zob_pieces[zob_index(index, sq)];
  
      sq++;
  
    }
  }
  
  /*}}}*/
  /*{{{  stm*/
  
  pos->stm = (stm_str[0] == 'w') ? WHITE : BLACK;
  
  if (pos->stm == BLACK)
    pos->hash ^= zob_stm;
  
  /*}}}*/
  /*{{{  rights*/
  
  pos->rights = 0;
  
  for (const char *p = rights_str; *p; ++p) {
    switch (*p) {
      case 'K': pos->rights |= WHITE_RIGHTS_KING;  break;
      case 'Q': pos->rights |= WHITE_RIGHTS_QUEEN; break;
      case 'k': pos->rights |= BLACK_RIGHTS_KING;  break;
      case 'q': pos->rights |= BLACK_RIGHTS_QUEEN; break;
    }
  }
  
  pos->hash ^= zob_rights[pos->rights];
  
  /*}}}*/
  /*{{{  ep*/
  
  if (ep_str[0] == '-') {
    pos->ep = 0;  // 0 is not a legal ep square so this is ok
  }
  
  else {
  
    int file = ep_str[0] - 'a';
    int rank = ep_str[1] - '1';
  
    pos->ep = rank * 8 + file;
  
  }
  
  pos->hash ^= zob_ep[pos->ep];
  
  /*}}}*/

  net_slow_rebuild_accs(node);

  /*{{{  play the uci moves*/
  
  reset_hash_history(0);
  update_hash_history(pos, 0);
  
  for (int m=1; m <= num_uci_moves; m++) {
    play_move(node, uci_moves[m-1]);
    update_hash_history(pos, m);
  }
  
  reset_hash_history(num_uci_moves);
  
  /*}}}*/

  reset_piece_to_history();
  reset_killers();

}

/*}}}*/
/*{{{  et*/

static void et (void) {

  const int num_fens = 50;

  for (int i=0; i < num_fens; i++) {

    const Bench *b = &bench_data[i];
    position(&ss[0], b->fen, b->stm, b->rights, b->ep, 0, NULL);
    int e = net_eval(&ss[0]);
    printf("%d %s %s %s %s\n", e, b->fen, b->stm, b->rights, b->ep);

  }
}

/*}}}*/
/*{{{  probably_legal*/

static move_t probably_legal(const Position *const pos, move_t move) {

  if (!move) {
    return 0;
  }

  const int from       = (move >> 6) & 0x3F;
  const int to         = move & 0x3F;
  const int from_piece = pos->board[from];
  const int to_piece   = pos->board[to];
  const int stm        = pos->stm;

  if (from_piece == EMPTY){
    return 0;
  }

  if (from_piece/6 != stm) {
    return 0;
  }

  if (to_piece != EMPTY && to_piece/6 == stm) {
    return 0;
  }

  return move;

}

/*}}}*/
/*{{{  is_draw*/

static int is_draw(const Position *const pos, const int ply) {

  const int hmc = pos->hmc;

  if (hmc >= 100) {
    return 1;
  }

  if (mat_draw(pos)) {
    return 1;
  }

  if (hmc < 4) {
    return 0;
  }

  const uint64_t *const h = hh.hash;
  const int n_uci         = hh.num_uci_moves;
  const int start         = n_uci + ply;
  const uint64_t h0       = h[start];
  const int limit         = start - hmc;
  int idx                 = start - 4;
  int reps                = 0;

  while (idx >= limit) {

    assert(idx >= 0);
    assert(idx < 1024);

    if (h0 == h[idx]) {
      /*{{{  rep*/
      
      if (idx > n_uci) {
        return 1;
      }
      
      reps++;
      
      if (reps == 2) {
        return 1;
      }
      
      /*}}}*/
    }

    idx -= 2;

  }

  return 0;

}

/*}}}*/
/*{{{  pos_copy*/

static inline void pos_copy(const Position *const from_pos, Position *const to_pos) {

  *to_pos = *from_pos;

}

/*}}}*/
/*{{{  see*/

/*{{{  get_least_valuable_piece*/

static uint64_t get_least_valuable_piece(const Position *const pos, const uint64_t attadef, const int by_side, int *piece) {

  const int base = by_side ? 6 : 0;

  if ((attadef & pos->colour[by_side]) == 0)
    return 0;

  for (int i=base; i < base + 6; i++) {
    uint64_t subset = attadef & pos->all[i];
    if (subset) {
      *piece = i;
      return subset & -subset;
    }
  }

  return 0;

}

/*}}}*/
/*{{{  rook_attackers_to*/

static uint64_t rook_attackers_to(const Position *const pos, const uint64_t occ, const int to_sq) {

  const Attack *const RESTRICT a = &rook_attacks[to_sq];
  uint64_t rays                  = a->attacks[magic_index(occ & a->mask, a->magic, a->shift)];

  return rays & (pos->all[ROOK] | pos->all[6+ROOK] | pos->all[QUEEN] | pos->all[6+QUEEN]);

}

/*}}}*/
/*{{{  bishop_attackers_to*/

static uint64_t bishop_attackers_to(const Position *const pos, const uint64_t occ, const int to_sq) {

  const Attack *const RESTRICT a = &bishop_attacks[to_sq];
  uint64_t rays                  = a->attacks[magic_index(occ & a->mask, a->magic, a->shift)];

  return rays & (pos->all[BISHOP] | pos->all[6+BISHOP] | pos->all[QUEEN] | pos->all[6+QUEEN]);

}

/*}}}*/
/*{{{  static_attackers_to*/

static uint64_t static_attackers_to(const Position *const pos, const int to_sq) {

  uint64_t attackers = 0ULL;

  const uint64_t kn = knight_attacks[to_sq];

  attackers |= pos->all[KNIGHT]   & kn;
  attackers |= pos->all[6+KNIGHT] & kn;

  const uint64_t k = king_attacks[to_sq];

  attackers |= pos->all[KING]   & k;
  attackers |= pos->all[6+KING] & k;

  attackers |= pos->all[PAWN]   & pawn_attacks[WHITE][to_sq];
  attackers |= pos->all[6+PAWN] & pawn_attacks[BLACK][to_sq];

  return attackers;

}

/*}}}*/
/*{{{  see_ge*/

static int see_ge(const Position *const pos, const move_t move, int threshold) {

  if (!lut(lut_see, move))
    return 1;

  const int stm     = pos->stm;
  const int from_sq = (move >> 6) & 0x3F;
  const int to_sq   = move & 0x3F;
  int attacker      = pos->board[from_sq];
  const int target  = pos->board[to_sq];

  assert(target != EMPTY);

  if (see_values[target] - see_values[attacker] >= threshold)
    return 1;

  uint64_t used           = 0ULL;
  uint64_t occ            = pos->occupied;
  uint64_t from_set       = 1ULL << from_sq;
  const uint64_t stat_atk = static_attackers_to(pos, to_sq);
  uint64_t rook_atk       = rook_attackers_to(pos, occ, to_sq);
  uint64_t bish_atk       = bishop_attackers_to(pos, occ, to_sq);
  uint64_t attadef        = (stat_atk | rook_atk | bish_atk);

  if ((attadef & from_set) == 0)
    return 0;

  int gain[32], d = 0;
  gain[0] = see_values[target] - threshold;

  do {

    d++;
    gain[d] = see_values[attacker] - gain[d-1];

    if ((gain[d] < 0) && (-gain[d-1] < 0))
      break;

    used    |= from_set;
    attadef ^= from_set;
    occ     ^= from_set;

    const uint64_t moved_bb = from_set;

    if (moved_bb & (rank_mask[to_sq] | file_mask[to_sq]))
      rook_atk = rook_attackers_to(pos, occ, to_sq);

    if (moved_bb & (diag_mask[to_sq] | anti_mask[to_sq]))
      bish_atk = bishop_attackers_to(pos, occ, to_sq);

    attadef  = (stat_atk | rook_atk | bish_atk) & ~used;
    from_set = get_least_valuable_piece(pos, attadef, (stm ^ (d & 1)), &attacker);

  } while (from_set);

  while (--d)
    gain[d-1] = -(( -gain[d-1] > gain[d]) ? -gain[d-1] : gain[d]);

  return gain[0] >= 0;

}

/*}}}*/

/*}}}*/
/*{{{  is_pawn_endgame*/

static inline int is_pawn_endgame(const Position *const pos) {

  const uint64_t *const a = pos->all;

  return pos->occupied == (a[WKING] | a[WPAWN] | a[BKING] | a[BPAWN]);

}

/*}}}*/
