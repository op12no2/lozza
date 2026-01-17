/*{{{  debug*/

/*{{{  debug_slow_board_check*/

static int debug_slow_board_check(Node *const n1) {

  Node n;
  Node *n2 = &n;

  Position *const pos = &n1->pos;

  /*{{{  check ue*/
  
  net_copy(n1, n2);                      // copy the ue accumulators into n2
  net_slow_rebuild_accs(n1);             // rebuild the n1 accumulators from scratch
  
  for (int i=0; i < NET_H1_SIZE; i++) {  // compare them
    if (n1->acc1[i] != n2->acc1[i]) {
      fprintf(stderr, "a1 %d\n", i);
      return 1;
    }
    if (n1->acc2[i] != n2->acc2[i]) {
      fprintf(stderr, "a2 %d\n", i);
      return 1;
    }
  }
  
  /*}}}*/
  /*{{{  check bb == board*/
  
  uint64_t all[12] = {0};
  uint64_t colour[2] = {0};
  uint64_t occupied = 0;
  
  for (int sq=0; sq < 64; sq++) {
    int piece = pos->board[sq];
    if (piece == EMPTY) continue;
    all[piece]                         |= (1ULL << sq);
    colour[piece >= 6 ? BLACK : WHITE] |= (1ULL << sq);
    occupied                           |= (1ULL << sq);
  }
  
  for (int p = 0; p < 12; p++) {
    if (all[p] != pos->all[p]) {
      fprintf(stderr, "verify_from_board: mismatch in all[%d]\n", p);
      return 1;
    }
  }
  
  if (colour[WHITE] != pos->colour[WHITE]) {
    fprintf(stderr, "verify_from_board: mismatch in colour[WHITE]\n");
    return 1;
  }
  
  if (colour[BLACK] != pos->colour[BLACK]) {
    fprintf(stderr, "verify_from_board: mismatch in colour[BLACK]\n");
    return 1;
  }
  
  if (occupied != pos->occupied) {
    fprintf(stderr, "verify_from_board: mismatch in occupied\n");
    return 1;
  }
  
  /*}}}*/
  /*{{{  check board == bb*/
  
  uint8_t board[64];
  
  for (int sq=0; sq < 64; sq++)
    board[sq] = EMPTY;
  
  for (int p=0; p < 12; p++) {
    uint64_t bb = pos->all[p];
    while (bb) {
      int sq = __builtin_ctzll(bb);
      board[sq] = p;
      bb &= bb - 1;
    }
  }
  
  for (int sq=0; sq < 64; sq++) {
    if (board[sq] != pos->board[sq]) {
      fprintf(stderr, "verify_from_bitboards: mismatch at square %d (expected %d got %d)\n",
                      sq, pos->board[sq], board[sq]);
      return 1;
    }
  }
  
  /*}}}*/
  /*{{{  check hash*/
  
  uint64_t hash = 0;
  
  for (int sq=0; sq < 64; sq++) {
    int piece = pos->board[sq];
    if (piece == EMPTY) continue;
    hash ^= zob_pieces[zob_index(piece, sq)];
  }
  
  hash ^= zob_rights[n1->pos.rights];
  hash ^= zob_ep[n1->pos.ep];
  
  if (n1->pos.stm == BLACK)
    hash ^= zob_stm;
  
  if (hash != n1->pos.hash) {
    return 1;
    fprintf(stderr, "inc %" PRIx64 " rebuilt %" PRIx64 "\n", n1->pos.hash, hash);
  }
  
  /*}}}*/

  return 0;

}

/*}}}*/