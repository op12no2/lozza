/*}}}*/
/*{{{  init_once*/

static int init_once(void) {

  assert(INT16_MIN < -(MAX_HISTORY + 10));

  memset(ss, 0, sizeof(ss));

#ifndef NDEBUG
  uint64_t start_ms = now_ms();
#endif

  init_line_masks();
  init_move_funcs();
  init_rights_masks();
  init_zob();

  init_pawn_attacks();
  init_knight_attacks();
  init_bishop_attacks();

  init_rook_attacks();
  init_king_attacks();

  init_all_attacks();

#ifndef NDEBUG
  uint64_t elapsed_ms = now_ms() - start_ms;
  printf("init %zu\n", elapsed_ms);
#endif

  if (init_weights())
    return 1;

  assert(sizeof(Node)%64 == 0);
  assert(sizeof(Position)%64 == 0);
  assert(sizeof(Attack)%64 == 0);

  ASSERT_ALIGNED64(raw_attacks);
  ASSERT_ALIGNED64(ss);
  ASSERT_ALIGNED64(ss[0].acc1);
  ASSERT_ALIGNED64(ss[0].acc2);
  ASSERT_ALIGNED64(ss[1].acc1);
  ASSERT_ALIGNED64(net_h1_w);
  ASSERT_ALIGNED64(net_h2_w);
  ASSERT_ALIGNED64(net_h1_b);
  ASSERT_ALIGNED64(net_o_w);

  return 0;

}

/*}}}*/