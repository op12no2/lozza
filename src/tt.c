/*{{{  tt*/

/*{{{  init_tt*/

static int init_tt(size_t megabytes) {

  if (megabytes < 1)
    megabytes = 1;

  if (megabytes > 1024)
    megabytes = 1024;

  if (tt) {
    free(tt);
    tt = NULL;
  }

  const size_t bytes = megabytes * 1024ULL * 1024ULL;

  tt_entries = bytes / sizeof(TT);
  tt_entries = 1ULL << (63 - __builtin_clzll(tt_entries));
  tt_mask    = tt_entries - 1;
  tt         = calloc(tt_entries, sizeof(TT));

  if (!tt) {
    fprintf(stderr, "info failed to allocate tt\n");
    return 1;
  }

  uci_send("info tt entries %zu (%zu MB)\n", tt_entries, (tt_entries * sizeof(TT)) / 1024 / 1024);

  return 0;

}

/*}}}*/
/*{{{  tt_reset*/

static void tt_reset(void) {

  memset(tt, 0, tt_entries * sizeof(*tt));

}

/*}}}*/
/*{{{  tt_put_adjusted_score*/

static int tt_put_adjusted_score(const int ply, const int score) {

  if (score < -MATE_LIMIT)
    return score - ply;

  else if (score > MATE_LIMIT)
    return score + ply;

  else
   return score;

}

/*}}}*/
/*{{{  tt_get_adjusted_score*/

static int tt_get_adjusted_score(const int ply, const int score) {

  if (score < -MATE_LIMIT)
    return score + ply;

  else if (score > MATE_LIMIT)
    return score - ply;

  else
    return score;

}

/*}}}*/
/*{{{  tt_put*/

static void tt_put(const Position *const pos, const int flags, const int depth, const int score, const move_t move) {

  const size_t idx         = pos->hash & tt_mask;
  TT *const RESTRICT entry = &tt[idx];

  if (entry->flags && entry->hash == pos->hash && entry->depth > depth)
    return;

  entry->depth = depth;
  entry->score = score;
  entry->move  = move;
  entry->hash  = pos->hash;
  entry->flags = flags;

}

/*}}}*/
/*{{{  tt_get*/

static TT *tt_get(const Position *const pos) {

  const size_t idx         = pos->hash & tt_mask;
  TT *const RESTRICT entry = &tt[idx];

  if (!entry->flags)
    return NULL;

  if (entry->hash != pos->hash)
    return NULL;

  return entry;

}

/*}}}*/

/*}}}*/