/*}}}*/
/*{{{  search*/

/*{{{  collect_pv*/

static inline void collect_pv(Node *const this_node, const Node *const next_node, const move_t move) {

  memcpy(this_node->pv, next_node->pv, (size_t)next_node->pv_len * sizeof(move_t));

  this_node->pv_len                  = next_node->pv_len;
  this_node->pv[this_node->pv_len++] = move;

}

/*}}}*/
/*{{{  qsearch*/

static int qsearch(const int ply, int alpha, const int beta) {

  assert(ply < MAX_PLY);

  Node *const RESTRICT this_node = &ss[ply];
  const Position *const this_pos = &this_node->pos;
  this_node->pv_len              = 0;

  /*{{{  run out of ply*/
  
  if (ply >= SAFE_PLY) {
  
    return eval(this_node);
  
  }
  
  /*}}}*/
  /*{{{  run out of time*/
  
  tc.nodes++;
  
  if ((tc.nodes & 1023) == 0) {
  
    check_tc();
  
    if (tc.finished)
      return 0;
  
  }
  
  /*}}}*/
  /*{{{  stand pat*/
  
  const int ev = eval(this_node);
  
  if (ev >= beta)
    return beta;
  
  if (ev > alpha)
    alpha = ev;
  
  /*}}}*/
  /*{{{  tt*/
  
  const TT *const RESTRICT entry = tt_get(this_pos);
  
  if (entry) {
  
    const int flags = entry->flags;
    const int score = tt_get_adjusted_score(ply, entry->score);
  
    if (flags == TT_EXACT || (flags == TT_BETA && score >= beta) || (flags == TT_ALPHA && score <= alpha)) {
      return score;
    }
  
  }
  
  const move_t tt_move = entry ? probably_legal(this_pos, entry->move) : 0;
  
  /*}}}*/

  Node *const RESTRICT next_node          = &ss[ply+1];
  Position *const next_pos                = &next_node->pos;
  const int stm                           = this_pos->stm;
  const int opp                           = stm ^ 1;
  const int stm_king_idx                  = piece_index(KING, stm);
  const uint64_t *const next_stm_king_ptr = &next_pos->all[stm_king_idx];
  move_t move                             = 0;

  init_next_qsearch_move(this_node, tt_move);

  while ((move = get_next_qsearch_move(this_node))) {

    /*{{{  prune*/
    
    if (!see_ge(this_pos, move, -50)) {
    
      continue;
    
    }
    
    /*}}}*/
    /*{{{  copy make*/
    
    pos_copy(this_pos, next_pos);
    make_move_pre(next_pos, move);
    
    if (is_attacked(next_pos, bsf(*next_stm_king_ptr), opp))
      continue;
    
    make_move_post(next_pos);
    net_copy(this_node, next_node);
    net_update_accs(next_node);
    
    /*}}}*/

    const int score = -qsearch(ply+1, -beta, -alpha);

    if (score >= beta) {
      tt_put(this_pos, TT_BETA, 0, tt_put_adjusted_score(ply, score), move);
      return score;
    }

    if (score > alpha) {
      alpha = score;
    }
  }

  return alpha;

}

/*}}}*/
/*{{{  search*/

static int search(const int ply, int depth, int alpha, const int beta) {

  assert(ply < MAX_PLY);

  Node *const RESTRICT this_node = &ss[ply];
  const Position *const this_pos = &this_node->pos;
  this_node->pv_len              = 0;

  /*{{{  run out of ply*/
  
  if (ply >= SAFE_PLY) {
  
    return eval(this_node);
  
  }
  
  /*}}}*/

  const int stm          = this_pos->stm;
  const int opp          = stm ^ 1;
  const int stm_king_idx = piece_index(KING, stm);
  const int in_check     = is_attacked(this_pos, bsf(this_pos->all[stm_king_idx]), opp);
  const int is_root      = ply == 0;
  const int is_pv        = is_root || (beta - alpha != 1);

  this_node->in_check = in_check;

  /*{{{  horizon*/
  
  if (depth <= 0 && in_check == 0) {
  
    return qsearch(ply, alpha, beta);
  
  }
  
  depth = max(0, depth);
  
  /*}}}*/
  /*{{{  run out of time*/
  
  tc.nodes++;
  
  if ((tc.nodes & 1023) == 0) {
  
    check_tc();
  
    if (tc.finished)
      return 0;
  
  }
  
  /*}}}*/
  /*{{{  draw*/
  
  if (!is_root && is_draw(this_pos, ply)) {
  
    return 0;
  
  }
  
  /*}}}*/
  /*{{{  tt*/
  
  const TT *const RESTRICT entry = tt_get(this_pos);
  
  if (!is_pv && entry && entry->depth >= depth) {
  
    const int flags = entry->flags;
    const int score = tt_get_adjusted_score(ply, entry->score);
  
    if (flags == TT_EXACT || (flags == TT_BETA && score >= beta) || (flags == TT_ALPHA && score <= alpha)) {
      return score;
    }
  
  }
  
  const move_t tt_move = entry ? probably_legal(this_pos, entry->move) : 0;
  
  /*}}}*/
  /*{{{  iir*/
  /*
  if (!is_root && is_pv && !tt_move && depth > 9) {
  
    depth--;  // https://www.talkchess.com/forum3/viewtopic.php?f=7&t=74769
  
  }
  */
  /*}}}*/

  Node *const RESTRICT next_node = &ss[ply + 1];
  Position *const next_pos       = &next_node->pos;
  const int orig_alpha           = alpha;
  const int ev                   = eval(this_node);
  this_node->ev                  = ev;
  int r                          = 0;
  int e                          = 0;
  const int improving            = (ply >= 2 && !ss[ply-2].in_check) ? ev > ss[ply-2].ev : 0;

  /*{{{  beta prune*/
  
  if (!is_pv && !in_check && depth <= 8 && (ev - depth * 100) >= (beta - improving * 50)) {
  
    return ev;
  
  }
  
  /*}}}*/
  /*{{{  nmp*/
  
  if (!is_pv && !in_check && depth > 2 && ev > beta && !is_pawn_endgame(this_pos)) {
  
    r = 3;
  
    pos_copy(this_pos, next_pos);
    make_null_move(next_pos);
    net_copy(this_node, next_node);
  
    const int score = -search(ply+1, depth-1-r, -beta, -beta+1);
  
    if (score >= beta)
      return score > MATE_LIMIT ? beta : score;
  
    if (tc.finished)
      return 0;
  
  }
  
  /*}}}*/
  /*{{{  alpha prune*/
  
  if (!is_root && !in_check && depth <= 4 && alpha > -MATE_LIMIT && ev + 500 * depth <= alpha) {
  
    const int score = qsearch(ply, alpha, alpha + 1);
  
    if (score <= alpha) {
      return score;
    }
  
    this_node->pv_len = 0;
    this_node->ev     = ev;
  
  }
  
  /*}}}*/

  move_t move                             = 0;
  move_t best_move                        = 0;
  int score                               = alpha;
  int best_score                          = alpha;
  int num_legal_moves                     = 0;
  int num_prunable_moves                  = 0;
  const uint64_t *const next_stm_king_ptr = &next_pos->all[stm_king_idx];

  init_next_search_move(this_node, in_check, tt_move);

  while ((move = get_next_search_move(this_node))) {

    const int prunable = lut(lut_prune, move);

    /*{{{  prune*/
    
    if (prunable && !is_pv && !in_check && alpha > -MATE_LIMIT) {
    
      if (depth <= 2 && num_prunable_moves > 5 * depth) {
        continue;
      }
    
      if (num_legal_moves > 0 && depth <= 4 && (ev + depth * 120) < alpha) {
        continue;
      }
    
    }
    
    /*}}}*/
    /*{{{  copy make*/
    
    pos_copy(this_pos, next_pos);
    make_move_pre(next_pos, move);
    
    if (is_attacked(next_pos, bsf(*next_stm_king_ptr), opp))
      continue;
    
    make_move_post(next_pos);
    net_copy(this_node, next_node);
    net_update_accs(next_node);
    update_hash_history(next_pos, ply+1);
    
    /*}}}*/

    num_legal_moves++;
    if (prunable)
      num_prunable_moves++;

    /*{{{  search*/
    
    /*{{{  e/r*/
    
    e = 0;
    r = 0;
    
    if (in_check) {
    
      e = 1;
    
    }
    
    else if (depth >= 3 && num_legal_moves >= 6) {
    
      r = depth / 5 + num_legal_moves / 20;
    
    }
    
    /*}}}*/
    
    const int null_window = (is_pv && num_legal_moves > 1) || r;
    score                 = alpha;
    
    if (null_window) {
      score = -search(ply+1, depth+e-1-r, -alpha-1, -alpha);
    }
    
    if (tc.finished)
      return 0;
    
    if (score > alpha || !null_window) {
      score = -search(ply+1, depth+e-1, -beta, -alpha);
    }
    
    if (tc.finished)
      return 0;
    
    /*}}}*/
    /*{{{  alpha raise*/
    
    if (score > alpha) {
    
      alpha      = score;
      best_score = score;
      best_move  = move;
    
      if (is_root) {
    
        tc.bm = best_move;
        tc.bs = best_score;
    
      }
    
      if (is_pv) {
    
        collect_pv(this_node, next_node, move);
    
      }
    
    }
    
    /*}}}*/
    /*{{{  beta raise*/
    
    if (score >= beta) {
    
      /*{{{  update piece-to history*/
      
      if (lut(lut_history, move)) {
      
        const int bonus = depth * depth;
        const int limit = this_node->next_move - 1;
      
        update_piece_to_history(this_pos, move, bonus);
      
        for (int i=0; i < limit; i++) {
      
          const move_t pmove = this_node->moves[i];
      
          assert(move != pmove && "search: last move in limit");
      
          if (lut(lut_history, pmove)) {
            update_piece_to_history(this_pos, pmove, -bonus);
          }
      
        }
      
      }
      
      /*}}}*/
      /*{{{  update killers*/
      
      if (move != tt_move && lut(lut_killer, move)) {
      
        update_killer(this_node, move);
      
      }
      
      /*}}}*/
    
      tt_put(this_pos, TT_BETA, depth, tt_put_adjusted_score(ply, best_score), best_move);
    
      return score;
    
    }
    
    /*}}}*/

  }

  /*{{{  only one move*/
  
  if (is_root && num_legal_moves == 1) {
  
    tc.finished = 1;
  
  }
  
  /*}}}*/
  /*{{{  mate or slatemate*/
  
  if (num_legal_moves == 0) {
  
    return this_node->in_check ? (-MATE + ply) : 0;
  
  }
  
  /*}}}*/

  tt_put(this_pos, (alpha > orig_alpha ? TT_EXACT : TT_ALPHA), depth, tt_put_adjusted_score(ply, best_score), best_move);

  return best_score;

}

/*}}}*/
/*{{{  go*/
//
// This is Clockwork shaped with different magic numbers.
//

static void go(void) {

  char bm_str[6];
  char pv_str[MAX_PLY * 6 + 1];

  int alpha        = 0;
  int beta         = 0;
  int score        = 0;
  int delta        = 0;
  move_t *const pv = ss[0].pv;
  int pv_len       = ss[0].pv_len;
  int next_pv_char = 0;

  for (int depth=1; depth <= tc.max_depth; depth++) {

    alpha = -INF;
    beta  = INF;
    delta = 20;

    if (depth >= 4) {
      alpha = score - delta;
      beta  = score + delta;
    }

    /*{{{  asp window*/
    
    while (1) {
    
      score = search(0, depth, alpha, beta);
    
      if (tc.finished)
        break;
    
      if (score <= alpha) {
        alpha = score - delta;
      }
      else if (score >= beta) {
        beta  = score + delta;
      }
      else {
        break;
      }
    
      delta += delta;
    
    }
    
    /*}}}*/
    /*{{{  uci report*/
    
    pv_len       = ss[0].pv_len;
    next_pv_char = 0;
    
    for (int i=pv_len-1; i >= 0; i--) {
      next_pv_char += format_move(pv[i], &pv_str[next_pv_char]);
      pv_str[next_pv_char++] = ' ';
    }
    
    pv_str[next_pv_char] = '\0';
    
    uint64_t end_ms     = now_ms();
    uint64_t elapsed_ms = end_ms - tc.start_time;
    uint64_t nps        = (tc.nodes * 1000ULL) / (elapsed_ms ? elapsed_ms : 1);
    
    if (!uci_quiet) {
      if (abs(tc.bs) < MATE_LIMIT)
        uci_send("info depth %d score cp %d time %" PRIu64 " nodes %" PRIu64 " nps %" PRIu64 " pv %s\n", depth, tc.bs, elapsed_ms, tc.nodes, nps, pv_str);
      else {
        const int mate_score = max(1, (tc.bs < 0) ? (tc.bs - MATE) / 2 : (MATE - tc.bs) / 2);
        uci_send("info depth %d score mate %d time %" PRIu64 " nodes %" PRIu64 " nps %" PRIu64 " pv %s\n", depth, mate_score, elapsed_ms, tc.nodes, nps, pv_str);
      }
    }
    
    /*}}}*/

    if (tc.finished)
      break;

    age_piece_to_history();

  }

  format_move(tc.bm, bm_str);
  if (!uci_quiet)
    uci_send("bestmove %s\n", bm_str);

}

/*}}}*/
/*{{{  bench*/

static void bench (void) {

  ucinewgame();

  const int num_fens   = bench_data_len;
  uint64_t start_ms    = now_ms();
  uint64_t total_nodes = 0;

  uci_quiet = true;

  for (int i=0; i < num_fens; i++) {

    const Bench *b = &bench_data[i];

    position(&ss[0], b->fen, b->stm, b->rights, b->ep, 0, NULL);

    tc           = (TimeControl){0};
    tc.max_depth = 11;

    go();

    total_nodes += tc.nodes;

  }

  uci_quiet = false;

  uint64_t end_ms     = now_ms();
  uint64_t elapsed_ms = end_ms - start_ms;
  uint64_t nps        = (total_nodes * 1000ULL) / (elapsed_ms ? elapsed_ms : 1);

  uci_send("time %" PRIu64 " nodes %" PRIu64 " nps %" PRIu64 "\n", elapsed_ms, total_nodes, nps);

}

/*}}}*/