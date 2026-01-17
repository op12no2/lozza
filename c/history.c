/*{{{  history*/

/*{{{  reset_hash_history*/

static inline void reset_hash_history(const int n) {

  hh.num_uci_moves = n;

}

/*}}}*/
/*{{{  update_hash_history*/

static inline void update_hash_history(const Position *const pos, const int ply) {

  hh.hash[min(1023, hh.num_uci_moves + ply)] = pos->hash;

}

/*}}}*/

/*{{{  reset_killers*/

static inline void reset_killers(void) {

  for (int i=0; i < MAX_PLY; i++) {
    ss[i].killer1 = 0;
    ss[i].killer2 = 0;
  }

}

/*}}}*/

/*{{{  reset_piece_to_history*/

static inline void reset_piece_to_history(void) {

  memset(piece_to_history, 0, sizeof(piece_to_history));

}

/*}}}*/
/*{{{  age_piece_to_history*/

static void age_piece_to_history() {

  for (int i=0; i < 12; i++) {
    for (int j=0; j < 64; j++) {
      piece_to_history[i][j] /= 2;
    }
  }

}

/*}}}*/
/*{{{  update_piece_to_history*/

static inline void update_piece_to_history(const Position *const pos, const move_t move, const int16_t bonus) {

  const int from       = (move >> 6) & 0x3F;
  const int to         = move & 0x3F;
  const int from_piece = pos->board[from];

  piece_to_history[from_piece][to] += bonus - piece_to_history[from_piece][to] * abs(bonus) / MAX_HISTORY;

  if (abs(piece_to_history[from_piece][to]) >= MAX_HISTORY) {
    age_piece_to_history();
  }

}

/*}}}*/

/*{{{  update_killer*/

static inline void update_killer(Node *const node, const move_t move) {

  if (move == node->tt_move || move == node->killer1)
    return;

  node->killer2 = node->killer1;
  node->killer1 = move;

}

/*}}}*/

/*{{{  rank_noisy*/

static void rank_noisy(Node *const node) {

  const uint8_t *const board = node->pos.board;
  const move_t *const moves  = node->moves;
  int16_t *const ranks       = node->ranks;
  const int n                = node->num_moves;

  for (int i=0; i < n; i++) {

    const move_t m     = moves[i];
    const int from     = (m >> 6) & 0x3F;
    const int to       =  m & 0x3F;
    const int attacker = board[from] % 6;
    int victim         = board[to];

    if (victim == EMPTY)  // ep
      victim = 0;
    else
      victim %= 6;

    ranks[i] = (victim << 3) | (5 - attacker);

  }
}

/*}}}*/
/*{{{  rank_quiet*/

static void rank_quiet(Node *const node) {

  const move_t killer1       = node->killer1;
  const move_t killer2       = node->killer2;
  const uint8_t *const board = node->pos.board;
  const move_t *const moves  = node->moves;
  int16_t *const ranks       = node->ranks;
  const int n                = node->num_moves;

  for (int i=0; i < n; i++) {

    const move_t move = moves[i];

    if (move == killer1) {
      ranks[i] = MAX_HISTORY + 2;
    }
    else if (move == killer2) {
      ranks[i] = MAX_HISTORY + 1;
    }
    else {
      const int from       = (move >> 6) & 0x3F;
      const int to         = move & 0x3F;
      const int from_piece = board[from];

      ranks[i] = piece_to_history[from_piece][to];
    }
  }
}


/*}}}*/

/*}}}*/