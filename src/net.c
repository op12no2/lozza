/*{{{  net*/

/*{{{  net_base*/

static int net_base(const int piece, const int sq) {

  return (((piece << 6) | sq) * NET_H1_SIZE);

}

/*}}}*/
/*{{{  init_weights*/

/*{{{  flip_index*/
//
// As defined by bullet.
// https://github.com/jw1912/bullet/blob/main/docs/1-basics.md
//

static int flip_index(const int index) {

  int piece  = index / (64 * NET_H1_SIZE);
  int square = (index / NET_H1_SIZE) % 64;
  int h      = index % NET_H1_SIZE;

  square ^= 56;
  piece = (piece + 6) % 12;

  return ((piece * 64) + square) * NET_H1_SIZE + h;

}

/*}}}*/
/*{{{  read_file*/

static uint8_t *read_file(const char *path, size_t *size_out) {

    *size_out = 0;
    FILE *f = fopen(path, "rb");

    if (!f)
      return NULL;

    if (fseek(f, 0, SEEK_END) != 0) {
      fclose(f);
      return NULL;
    }

    long sz = ftell(f);
    if (sz < 0) {
      fclose(f);
      return NULL;
    }
    rewind(f);

    uint8_t *buf = (uint8_t*)malloc((size_t)sz);
    if (!buf) {
      fclose(f);
      return NULL;
    }

    size_t got = fread(buf, 1, (size_t)sz, f);
    fclose(f);
    if (got != (size_t)sz) {
      free(buf);
      return NULL;
    }

    *size_out = (size_t)sz;

    return buf;

}

/*}}}*/
/*{{{  get_weights*/

static int get_weights(const char *path, int16_t **out, size_t *count_out) {

  size_t bytes = 0;

  uint8_t *raw = read_file(path, &bytes);
  if (!raw)
    return 0;

  if (bytes % sizeof(int16_t) != 0) {
    free(raw);
    return 0;
  }

  int16_t *w = (int16_t*)raw;
  size_t count = bytes / sizeof(int16_t);

  *out = w;            // caller must free(*out)
  *count_out = count;  // number of int16 weights

  return 1;

}

/*}}}*/
/*{{{  get_embedded_weights*/
//
// xxd -i -n cwtch_weights ../lozza/nets/farm1/lozza-500/quantised.bin > weights.h
//

static int get_embedded_weights(int16_t **out, size_t *count_out) {

  size_t bytes = (size_t)cwtch_weights_len;

  if (bytes % sizeof(int16_t) != 0)
    return 0;

  int16_t *buf = (int16_t*)malloc(bytes);
  if (!buf)
    return 0;

  memcpy(buf, cwtch_weights, bytes);

  *out = buf;
  *count_out = bytes / sizeof(int16_t);

  return 1;

}


/*}}}*/

static int init_weights(void) {

  int16_t *weights = NULL;
  size_t n = 0;

  if (!get_embedded_weights(&weights, &n)) {
    free(weights);
    fprintf(stderr, "cannot load embedded weights\n");
    return 1;
  }

  //if (get_weights("/home/xyzzy/lozza/nets/fujia/lozza-750/quantised.bin", &weights, &n) == 0) {
    //free(weights);
    //fprintf(stderr, "cannot load weights file\n");
    //return 1;
  //}

  size_t offset = 0;

  for (int i=0; i < NET_I_SIZE * NET_H1_SIZE; i++) {
    net_h1_w[i]             = (int32_t)weights[i];  // us
    net_h2_w[flip_index(i)] = (int32_t)weights[i];  // them
  }

  offset += NET_I_SIZE * NET_H1_SIZE;
  for (int i=0; i < NET_H1_SIZE; i++) {
    net_h1_b[i] = (int32_t)weights[offset+i];
  }

  offset += NET_H1_SIZE;
  for (int i=0; i < NET_H1_SIZE * 2; i++) {
    net_o_w[i] = (int32_t)weights[offset+i];
  }

  offset += NET_H1_SIZE * 2;
  net_o_b = (int32_t)weights[offset];

  free(weights);

  return 0;

}

/*}}}*/
/*{{{  net_copy*/

static inline void net_copy(const Node *const from_node, Node *const to_node) {

  memcpy(to_node->acc1, from_node->acc1, sizeof from_node->acc1);
  memcpy(to_node->acc2, from_node->acc2, sizeof from_node->acc2);

}

/*}}}*/
/*{{{  net_slow_rebuild_accs*/

static void net_slow_rebuild_accs(Node *const node) {

  memcpy(node->acc1, net_h1_b, sizeof net_h1_b);
  memcpy(node->acc2, net_h1_b, sizeof net_h1_b);

  for (int sq=0; sq < 64; sq++) {

    const int piece = node->pos.board[sq];

    if (piece == EMPTY)
      continue;

    for (int h=0; h < NET_H1_SIZE; h++) {
      const int idx1 = (piece * 64 + sq) * NET_H1_SIZE + h;
      node->acc1[h] += net_h1_w[idx1];
      node->acc2[h] += net_h2_w[idx1];
    }
  }

}

/*}}}*/
/*{{{  net_update_accs*/

static void net_update_accs(Node *const node) {

  lazy.net_func(node);

}

/*}}}*/
/*{{{  net_eval*/

static int net_eval(Node *const node) {

  const int stm = node->pos.stm;

  const int32_t *const RESTRICT a1 = (stm == 0 ? node->acc1 : node->acc2);
  const int32_t *const RESTRICT a2 = (stm == 0 ? node->acc2 : node->acc1);

  const int32_t *const RESTRICT w1 = &net_o_w[0];
  const int32_t *const RESTRICT w2 = &net_o_w[NET_H1_SIZE];

  int32_t acc = 0;

  for (int i=0; i < NET_H1_SIZE; i++) {  // autovec eval
    acc += w1[i] * sqrelu(a1[i]) + w2[i] * sqrelu(a2[i]);
  }

  acc /= NET_QA;
  acc += net_o_b;
  acc *= NET_SCALE;
  acc /= NET_QAB;

  return (int)acc;

}

/*}}}*/

/*{{{  net_move*/

static void net_move(Node *const node) {

  const int fr_piece = lazy.arg0;
  const int fr       = lazy.arg1;
  const int to       = lazy.arg2;

  int32_t *const RESTRICT a1 = node->acc1;
  int32_t *const RESTRICT a2 = node->acc2;

  const int b1 = net_base(fr_piece, fr);
  const int b2 = net_base(fr_piece, to);

  const int32_t *const RESTRICT w1_b1 = &net_h1_w[b1];
  const int32_t *const RESTRICT w1_b2 = &net_h1_w[b2];

  const int32_t *const RESTRICT w2_b1 = &net_h2_w[b1];
  const int32_t *const RESTRICT w2_b2 = &net_h2_w[b2];

  for (int i=0; i < NET_H1_SIZE; i++) {  // autovec move
    a1[i] += w1_b2[i] - w1_b1[i];
    a2[i] += w2_b2[i] - w2_b1[i];
  }

}

/*}}}*/
/*{{{  net_capture*/

static void net_capture(Node *const node) {

  const int fr_piece = lazy.arg0;
  const int fr       = lazy.arg1;
  const int to       = lazy.arg2;
  const int to_piece = lazy.arg3;

  int32_t *const RESTRICT a1 = node->acc1;
  int32_t *const RESTRICT a2 = node->acc2;

  const int b1 = net_base(fr_piece, fr);
  const int b2 = net_base(to_piece, to);
  const int b3 = net_base(fr_piece, to);

  const int32_t *const RESTRICT w1_b1 = &net_h1_w[b1];
  const int32_t *const RESTRICT w1_b2 = &net_h1_w[b2];
  const int32_t *const RESTRICT w1_b3 = &net_h1_w[b3];

  const int32_t *const RESTRICT w2_b1 = &net_h2_w[b1];
  const int32_t *const RESTRICT w2_b2 = &net_h2_w[b2];
  const int32_t *const RESTRICT w2_b3 = &net_h2_w[b3];

  for (int i=0; i < NET_H1_SIZE; i++) {  // autovec cap
    a1[i] += w1_b3[i] - w1_b2[i] - w1_b1[i];
    a2[i] += w2_b3[i] - w2_b2[i] - w2_b1[i];
  }

}

/*}}}*/
/*{{{  net_promo_push*/

static void net_promo_push (Node *const node) {

  const int pawn_piece    = lazy.arg0;
  const int pawn_fr       = lazy.arg1;
  const int pawn_to       = lazy.arg2;
  const int promote_piece = lazy.arg4;

  int32_t *const RESTRICT a1 = node->acc1;
  int32_t *const RESTRICT a2 = node->acc2;

  const int b1 = net_base(pawn_piece, pawn_fr);
  const int b2 = net_base(promote_piece, pawn_to);

  const int32_t *const RESTRICT w1_b1 = &net_h1_w[b1];
  const int32_t *const RESTRICT w1_b2 = &net_h1_w[b2];

  const int32_t *const RESTRICT w2_b1 = &net_h2_w[b1];
  const int32_t *const RESTRICT w2_b2 = &net_h2_w[b2];

  for (int i=0; i < NET_H1_SIZE; i++) {  // autovec promo push
    a1[i] += w1_b2[i] - w1_b1[i];
    a2[i] += w2_b2[i] - w2_b1[i];
  }

}

/*}}}*/
/*{{{  net_promo_capture*/

static void net_promo_capture (Node *const node) {

  const int pawn_piece    = lazy.arg0;
  const int pawn_fr       = lazy.arg1;
  const int pawn_to       = lazy.arg2;
  const int capture_piece = lazy.arg3;
  const int promote_piece = lazy.arg4;

  int32_t *const RESTRICT a1 = node->acc1;
  int32_t *const RESTRICT a2 = node->acc2;

  const int b1 = net_base(pawn_piece, pawn_fr);
  const int b2 = net_base(promote_piece, pawn_to);
  const int b3 = net_base(capture_piece, pawn_to);

  const int32_t *const RESTRICT w1_b1 = &net_h1_w[b1];
  const int32_t *const RESTRICT w1_b2 = &net_h1_w[b2];
  const int32_t *const RESTRICT w1_b3 = &net_h1_w[b3];

  const int32_t *const RESTRICT w2_b1 = &net_h2_w[b1];
  const int32_t *const RESTRICT w2_b2 = &net_h2_w[b2];
  const int32_t *const RESTRICT w2_b3 = &net_h2_w[b3];

  for (int i=0; i < NET_H1_SIZE; i++) {  // autovec promo cap
    a1[i] += w1_b2[i] - w1_b1[i] - w1_b3[i];
    a2[i] += w2_b2[i] - w2_b1[i] - w2_b3[i];
  }

}

/*}}}*/
/*{{{  net_ep_capture*/

static void net_ep_capture (Node *const node) {

  const int pawn_piece     = lazy.arg0;
  const int pawn_fr        = lazy.arg1;
  const int pawn_to        = lazy.arg2;
  const int opp_pawn_piece = lazy.arg3;
  const int opp_pawn_sq    = lazy.arg4;

  int32_t *const RESTRICT a1 = node->acc1;
  int32_t *const RESTRICT a2 = node->acc2;

  const int b1 = net_base(pawn_piece,     pawn_fr);
  const int b2 = net_base(pawn_piece,     pawn_to);
  const int b3 = net_base(opp_pawn_piece, opp_pawn_sq);

  const int32_t *const RESTRICT w1_b1 = &net_h1_w[b1];
  const int32_t *const RESTRICT w1_b2 = &net_h1_w[b2];
  const int32_t *const RESTRICT w1_b3 = &net_h1_w[b3];

  const int32_t *const RESTRICT w2_b1 = &net_h2_w[b1];
  const int32_t *const RESTRICT w2_b2 = &net_h2_w[b2];
  const int32_t *const RESTRICT w2_b3 = &net_h2_w[b3];

  for (int i=0; i < NET_H1_SIZE; i++) {  // autovec ep
    a1[i] += w1_b2[i] - w1_b1[i] - w1_b3[i];
    a2[i] += w2_b2[i] - w2_b1[i] - w2_b3[i];
  }

}


/*}}}*/
/*{{{  net_castle*/

static void net_castle (Node *const node) {

  const int king_piece = lazy.arg0;
  const int king_fr_sq = lazy.arg1;
  const int king_to_sq = lazy.arg2;
  const int rook_piece = lazy.arg3;
  const int rook_fr_sq = lazy.arg4;
  const int rook_to_sq = lazy.arg5;

  int32_t *const RESTRICT a1 = node->acc1;
  int32_t *const RESTRICT a2 = node->acc2;

  const int b1 = net_base(king_piece, king_fr_sq);
  const int b2 = net_base(king_piece, king_to_sq);
  const int b3 = net_base(rook_piece, rook_fr_sq);
  const int b4 = net_base(rook_piece, rook_to_sq);

  const int32_t *const RESTRICT w1_b1 = &net_h1_w[b1];
  const int32_t *const RESTRICT w1_b2 = &net_h1_w[b2];
  const int32_t *const RESTRICT w1_b3 = &net_h1_w[b3];
  const int32_t *const RESTRICT w1_b4 = &net_h1_w[b4];

  const int32_t *const RESTRICT w2_b1 = &net_h2_w[b1];
  const int32_t *const RESTRICT w2_b2 = &net_h2_w[b2];
  const int32_t *const RESTRICT w2_b3 = &net_h2_w[b3];
  const int32_t *const RESTRICT w2_b4 = &net_h2_w[b4];

  for (int i=0; i < NET_H1_SIZE; i++) {  // autovec_castle
    a1[i] += w1_b2[i] - w1_b1[i] + w1_b4[i] - w1_b3[i];
    a2[i] += w2_b2[i] - w2_b1[i] + w2_b4[i] - w2_b3[i];
  }

}

/*}}}*/

/*}}}*/