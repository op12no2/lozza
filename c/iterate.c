/*}}}*/
/*{{{  move iterators*/

/*{{{  remove_tt_move*/

static void remove_tt_move(Node *const node) {

  const int n                  = node->num_moves;
  move_t *const RESTRICT moves = node->moves;
  move_t tt_move               = node->tt_move;

  for (int i=0; i < n; i++) {

    if (moves[i] == tt_move) {
      moves[i] = moves[n-1];
      node->num_moves--;
      break;
    }

  }
}

/*}}}*/
/*{{{  get_next_sorted_move*/

static move_t get_next_sorted_move(Node *const node) {

  move_t max_m         = 0;
  move_t *const moves  = node->moves;
  int16_t *const ranks = node->ranks;
  const int next       = node->next_move;
  const int num        = node->num_moves;
  int16_t max_r        = INT16_MIN;  // must be < -MAX_HISTORY
  int max_i            = 0;

  for (int i=next; i < num; i++) {
    if (ranks[i] > max_r) {
      max_r = ranks[i];
      max_i = i;
    }
  }

  max_m = moves[max_i];

  moves[max_i] = moves[next];
  ranks[max_i] = ranks[next];
  moves[next]  = max_m;  // for history penalties

  node->next_move++;

  return max_m;

}

/*}}}*/

/*{{{  init_next_search_move*/

static void init_next_search_move(Node *const node, const uint8_t in_check, const move_t tt_move) {

  node->stage    = 0;
  node->in_check = in_check;
  node->tt_move  = tt_move;

}

/*}}}*/
/*{{{  get_next_search_move*/

static move_t get_next_search_move(Node *const node) {

  switch (node->stage) {

    case 0: {
      /*{{{  tt*/
      
      node->stage++;
      node->num_moves = 0;
      node->next_move = 0;
      
      if (node->tt_move)
        return node->tt_move;
      
      /*}}}*/
    }

    /* fall through */

    case 1: {
      /*{{{  gen noisy*/
      
      node->stage++;
      node->num_moves = 0;
      node->next_move = 0;
      
      gen_noisy(node);
      
      if (node->tt_move && lut(lut_noisy, node->tt_move))
        remove_tt_move(node);
      
      rank_noisy(node);
      
      /*}}}*/
    }

    /* fall through */

    case 2: {
      /*{{{  next noisy / gen quiet*/
      
      if (node->next_move < node->num_moves) {
      
        return get_next_sorted_move(node);
      
      }
      
      node->stage++;
      node->num_moves = 0;
      node->next_move = 0;
      
      gen_quiet(node);
      
      if (node->tt_move && lut(lut_quiet, node->tt_move))
        remove_tt_move(node);
      
      rank_quiet(node);
      
      /*}}}*/
    }

    /* fall through */

    case 3: {
      /*{{{  next quiet*/
      
      if (node->next_move < node->num_moves) {
      
        return get_next_sorted_move(node);
      
      }
      
      return 0;
      
      /*}}}*/
    }

    default:
      assert(0 && "get_next_search_move: stage problem");
      return 0;

  }
}

/*}}}*/

/*{{{  init_next_qsearch_move*/

static void init_next_qsearch_move(Node *const node, const move_t tt_move) {

  node->stage    = 0;
  node->in_check = 0;  //unused
  node->tt_move  = tt_move;

}

/*}}}*/
/*{{{  get_next_qsearch_move*/

static move_t get_next_qsearch_move(Node *const node) {

  switch (node->stage) {

    case 0: {
      /*{{{  tt*/
      
      node->stage++;
      node->num_moves = 0;
      node->next_move = 0;
      
      if (node->tt_move)
        return node->tt_move;
      
      /*}}}*/
    }

    /* fall through */

    case 1: {
      /*{{{  gen noisy*/
      
      node->stage++;
      node->num_moves = 0;
      node->next_move = 0;
      
      gen_noisy(node);
      
      if (node->tt_move)
        remove_tt_move(node);
      
      rank_noisy(node);
      
      /*}}}*/
    }

    /* fall through */

    case 2: {
      /*{{{  next noisy*/
      
      if (node->next_move < node->num_moves) {
      
        return get_next_sorted_move(node);
      
      }
      
      return 0;
      
      /*}}}*/
    }

    default:
      assert(0 && "get_next_search_move: stage problem");
      return 0;

  }
}

/*}}}*/