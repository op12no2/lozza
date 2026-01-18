/*}}}*/

/*}}}*/

/*{{{  utility*/

/*{{{  now_ms*/

static inline uint64_t now_ms(void) {

  struct timespec ts;

  clock_gettime(CLOCK_MONOTONIC, &ts);
  return (uint64_t)ts.tv_sec * 1000u + (uint64_t)(ts.tv_nsec / 1000000u);

}

/*}}}*/
/*{{{  popcount*/

static inline int popcount(const uint64_t bb) {

  return __builtin_popcountll(bb);

}

/*}}}*/
/*{{{  encode_move*/

static inline move_t encode_move(const int from, const int to, const int flags) {

  return (from << 6) | to | flags;

}

/*}}}*/
/*{{{  bsf*/

static inline int bsf(const uint64_t bb) {

  return __builtin_ctzll(bb);

}

/*}}}*/
/*{{{  rand64*/

static uint64_t rand64(void) {

  rand64_seed ^= rand64_seed >> 12;
  rand64_seed ^= rand64_seed << 25;
  rand64_seed ^= rand64_seed >> 27;

  return rand64_seed * 2685821657736338717ULL;

}

/*}}}*/
/*{{{  piece_index*/

static inline int piece_index(const int piece, const int colour) {

  return piece + colour * 6;

}

/*}}}*/
/*{{{  colour_index*/

static inline int colour_index(const int colour) {

  return colour * 6;

}

/*}}}*/
/*{{{  print_bb*/

static void print_bb(const uint64_t bb, const char *tag) {

  printf("%s\n", tag);

  for (int rank = 7; rank >= 0; rank--) {

    printf("%d  ", rank + 1);

    for (int file = 0; file < 8; file++) {

      int sq = rank * 8 + file;
      char c = (bb & (1ULL << sq)) ? 'x' : '.';

      printf("%c ", c);
    }

    printf("\n");
  }

  printf("\n   a b c d e f g h\n\n");

}

/*}}}*/
/*{{{  format_move*/

static int format_move(const move_t move, char *const buf) {

  static const char files[] = "abcdefgh";
  static const char ranks[] = "12345678";
  static const char promo[] = "nbrq";

  const int from = (move >> 6) & 0x3F;
  const int to   = move & 0x3F;

  buf[0] = files[from % 8];
  buf[1] = ranks[from / 8];
  buf[2] = files[to   % 8];
  buf[3] = ranks[to   / 8];
  buf[4] = '\0';
  buf[5] = '\0';

  if ((move >> 14) & 1) {
    buf[4] = promo[(move >> 12) & 3];
    return 5;
  }

  return 4;

}

/*}}}*/
/*{{{  print_board*/

static void print_board(Node *const node) {

  const Position *const pos = &node->pos;

  const char piece_chars[12] = {
    'P', 'N', 'B', 'R', 'Q', 'K',
    'p', 'n', 'b', 'r', 'q', 'k'
  };

  for (int rank=7; rank >= 0; rank--) {

    printf("%d  ", rank + 1);

    for (int file=0; file < 8; file++) {

      int sq = rank * 8 + file;
      uint64_t bb = 1ULL << sq;
      char c = '.';

      for (int i=0; i < 12; i++) {
        if (pos->all[i] & bb) {
          c = piece_chars[i];
          break;
        }
      }

      printf("%c ", c);
    }

    printf("\n");
  }

  printf("   a b c d e f g h\n");
  printf("stm=%d\n", pos->stm);
  printf("rights=%d\n", pos->rights);
  printf("ep=%d\n", pos->ep);
  printf("h=%" PRIx64 "\n", pos->hash);

}

/*}}}*/
/*{{{  find_token*/

static int find_token(const char *token, int n, char **tokens) {

  for (int i=0; i < n; i++) {
    if (!strcmp(token, tokens[i]))
      return i;
  }

  return -1;

}

/*}}}*/
/*{{{  zob_index*/

static inline int zob_index(const int piece, const int sq) {

  return (piece << 6) | sq;

}

/*}}}*/
/*{{{  sqrrelu*/

static inline int32_t sqrelu(const int32_t x) {

  const int32_t y = x & ~(x >> 31);

  return y * y;

}

/*}}}*/
/*{{{  init_line_masks*/

static void init_line_masks(void) {

  for (int sq=0; sq < 64; sq++) {

    int r       = sq >> 3;
    int f       = sq & 7;
    uint64_t rm = 0;
    uint64_t fm = 0;
    uint64_t dm = 0;
    uint64_t am = 0;

    for (int k=0; k < 8; k++) {
      rm |= 1ULL << (r * 8 + k);     // same rank
      fm |= 1ULL << (k * 8 + f);     // same file
    }

    for (int rr=r+1, ff=f+1; rr<8  && ff<8;  rr++, ff++) dm |= 1ULL << (rr*8+ff);
    for (int rr=r-1, ff=f-1; rr>=0 && ff>=0; rr--, ff--) dm |= 1ULL << (rr*8+ff);
    for (int rr=r+1, ff=f-1; rr<8  && ff>=0; rr++, ff--) am |= 1ULL << (rr*8+ff);
    for (int rr=r-1, ff=f+1; rr>=0 && ff<8;  rr--, ff++) am |= 1ULL << (rr*8+ff);

    rank_mask[sq] = rm;
    file_mask[sq] = fm;
    diag_mask[sq] = dm;
    anti_mask[sq] = am;

  }

}

/*}}}*/
/*{{{  lut*/

static inline uint8_t lut(const uint8_t *const this_lut, const move_t move) {

  return this_lut[(move >> 12) & 0xF];

}

/*}}}*/
/*{{{  uci_send*/

#ifdef __EMSCRIPTEN__
static void uci_send(const char *fmt, ...) {
  char buf[4096];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  EM_ASM({ postMessage(UTF8ToString($0)); }, buf);
}
#else
static void uci_send(const char *fmt, ...) {
  va_list args;
  va_start(args, fmt);
  vprintf(fmt, args);
  va_end(args);
}
#endif

/*}}}*/
