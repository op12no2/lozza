/*{{{  perft*/

/*{{{  perft*/

static uint64_t perft(const int ply, const int depth) {

  if (depth == 0)
    return 1;

  Node *const this_node                   = &ss[ply];
  Node *const next_node                   = &ss[ply+1];
  const Position *const this_pos          = &this_node->pos;
  Position *const next_pos                = &next_node->pos;
  const int stm                           = this_pos->stm;
  const int opp                           = stm ^ 1;
  const int stm_king_idx                  = piece_index(KING, stm);
  const int stm_king_sq                   = bsf(this_pos->all[stm_king_idx]);
  const int in_check                      = is_attacked(this_pos, stm_king_sq, opp);
  const uint64_t *const next_stm_king_ptr = &next_pos->all[stm_king_idx];
  uint64_t tot_nodes                      = 0;
  move_t move                             = 0;

  init_next_search_move(this_node, in_check, 0);

  while ((move = get_next_search_move(this_node))) {

    /*{{{  copy make*/
    
    pos_copy(this_pos, next_pos);
    make_move_pre(next_pos, move);
    
    if (is_attacked(next_pos, bsf(*next_stm_king_ptr), opp))
      continue;
    
    /*}}}*/

    lazy.post_func(next_pos);
    tot_nodes += perft(ply+1, depth-1);

  }

  return tot_nodes;

}

/*}}}*/
/*{{{  perft_tests*/

static void perft_tests (void) {

  const int num_tests  = perft_data_len;
  uint64_t start_ms    = now_ms();
  uint64_t total_nodes = 0;
  int errors           = 0;

  for (int i=0; i < num_tests; i++) {

    const Perft *p = &perft_data[i];

    position(&ss[0], p->fen, p->stm, p->rights, p->ep, 0, NULL);

    uint64_t num_nodes = perft(0, p->depth);
    total_nodes        += num_nodes;

    if (num_nodes != p->expected)
      errors += 1;

    printf("%s %s %d (%" PRIu64 ") %" PRIu64 " %" PRIu64 "\n",
      p->label,
      p->fen,
      p->depth,
      num_nodes - p->expected,
      num_nodes,
      p->expected
    );

  }

  uint64_t end_ms     = now_ms();
  uint64_t elapsed_ms = end_ms - start_ms;
  uint64_t nps        = (total_nodes * 1000ULL) / (elapsed_ms ? elapsed_ms : 1);

  printf("time %" PRIu64 " nps %" PRIu64 "\n", elapsed_ms, nps);
  printf("errors %d\n", errors);

}

/*}}}*/