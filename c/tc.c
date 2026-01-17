/*}}}*/
/*{{{  tc*/

/*{{{  tc_init*/

static void tc_init(int64_t wtime, int64_t winc, int64_t btime, int64_t binc, int64_t max_nodes, int64_t move_time, int max_depth, int moves_to_go) {

  if (wtime < 0)       wtime       = 0;
  if (winc < 0)        winc        = 0;
  if (btime < 0)       btime       = 0;
  if (binc < 0)        binc        = 0;
  if (max_nodes < 0)   max_nodes   = 0;
  if (move_time < 0)   move_time   = 0;
  if (moves_to_go < 0) moves_to_go = 0;
  if (max_depth < 0)   max_depth   = 0;

  tc = (TimeControl){0};

  int stm = ss[0].pos.stm;

  if (!max_nodes && !max_depth && !wtime && !winc && !btime && !binc && !move_time)
    move_time = 100;

  if (!moves_to_go)
    moves_to_go = 20;

  moves_to_go = max(2, moves_to_go); // thanks @eric

  if (!max_depth)
    max_depth = MAX_PLY;

  if (!move_time && stm == WHITE && wtime) {
    move_time = wtime / moves_to_go + winc / 2;
    if (!move_time)
      move_time = 1;
  }
  else if (!move_time && stm == BLACK && btime) {
    move_time = btime / moves_to_go + binc / 2;
    if (!move_time)
      move_time = 1;
  }

  tc.start_time = now_ms();

  if (move_time) {
    tc.finish_time = tc.start_time + move_time;
  }

  tc.max_nodes = max_nodes;
  tc.max_depth = max_depth;

  tc.bm = 0;

}

/*}}}*/
/*{{{  check_tc*/

static void check_tc(void) {

  if (tc.finished)
    return;

  if (tc.bm == 0)
    return;

  if (tc.finish_time) {
    if (now_ms() >= tc.finish_time) {
      tc.finished = 1;
      return;
    }
  }

  else if (tc.max_nodes) {
    if (tc.nodes >= tc.max_nodes) {
      tc.finished = 1;
      return;
    }
  }

}

/*}}}*/

/*}}}*/