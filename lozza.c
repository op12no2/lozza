
/*{{{  includes*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <ctype.h>
#include <assert.h>
#include <time.h>
#include <sys/time.h>

/*}}}*/
/*{{{  constants*/

#define MAX_PLY 128
#define MAX_MOVES 256

#define UCI_LINE_LENGTH 8192
#define UCI_TOKENS      8192

#define WHITE_RIGHTS_KING  1
#define WHITE_RIGHTS_QUEEN 2
#define BLACK_RIGHTS_KING  4
#define BLACK_RIGHTS_QUEEN 8

enum {PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING};
enum {WHITE, BLACK};

#define SQ_MASK 0x3F;

#define CAPTURE_FLAG    (1 << 18)
#define EPPUSH_FLAG     (1 << 19)
#define EPCAPTURE_FLAG  (1 << 20)
#define KCASTLE_FLAG    (1 << 21)
#define QCASTLE_FLAG    (1 << 22)
#define QPROMOTION_FLAG (1 << 23)
#define RPROMOTION_FLAG (1 << 24)
#define BPROMOTION_FLAG (1 << 25)
#define NPROMOTION_FLAG (1 << 26)

#define CASTLE_MASK (KCASTLE_FLAG | QCASTLE_FLAG)
#define PROMOTION_MASK (QPROMOTION_FLAG | RPROMOTION_FLAG | BPROMOTION_FLAG | NPROMOTION_FLAG)
#define EP_MASK (EPPUSH_FLAG | EPCAPTURE_FLAG)
#define SPECIAL_MASK (EP_MASK | CASTLE_MASK | PROMOTION_MASK)
#define NOISY_MASK (CAPTURE_FLAG | EPCAPTURE_FLAG | PROMOTION_MASK)

static const uint64_t rank_mask[8] = {
  0x00000000000000FFULL,  // rank 1
  0x000000000000FF00ULL,  // rank 2
  0x0000000000FF0000ULL,  // rank 3
  0x00000000FF000000ULL,  // rank 4
  0x000000FF00000000ULL,  // rank 5
  0x0000FF0000000000ULL,  // rank 6
  0x00FF000000000000ULL,  // rank 7
  0xFF00000000000000ULL   // rank 8
};

/*}}}*/
/*{{{  macros*/

#define decode_move(move, from, to, from_idx, cap_idx) \
  do { \
    (to)       =  (move)        & 0x3F; \
    (from)     = ((move) >> 6)  & 0x3F; \
    (cap_idx)  = ((move) >> 12) & 0x7;  \
    (from_idx) = ((move) >> 15) & 0x7;  \
  } while (0)

#define encode_move(from, to, from_idx, cap_idx, flags) \
  (((to)        & 0x3F)          | \
   (((from)     & 0x3F)   << 6)  | \
   (((cap_idx)  & 0x7)    << 12) | \
   (((from_idx) & 0x7)    << 15) | \
   (((flags)    & 0x3FFF) << 18))

/*}}}*/
/*{{{  structs*/

/*{{{  Position struct*/

typedef struct {

  uint64_t all[12];
  uint64_t colour[2];
  uint64_t occupied;

  uint8_t indexes[64]; // holds an all[] index (0 to 11) but can be stale

  uint8_t stm;
  uint8_t rights;
  uint8_t ep;
  uint8_t hmc;

} Position;

/*}}}*/
/*{{{  Node struct*/

typedef struct {

  Position pos;

  uint32_t moves[MAX_MOVES];
  int num_moves;

} Node;

/*}}}*/
/*{{{  Attack struct*/

typedef struct {

  int bits;
  int count;

  uint64_t mask;
  uint64_t magic;

  uint64_t *attacks;

} Attack;

/*}}}*/

/*}}}*/
/*{{{  globals*/

static Attack   rook_attacks[64];
static Attack   bishop_attacks[64];
static uint64_t knight_attacks[64];
static uint64_t king_attacks[64];

static int ply = 0;
static Node ss[MAX_PLY];

/*}}}*/

/*{{{  popcount*/

static inline int popcount(uint64_t bb) {

  return __builtin_popcountll(bb);

}

/*}}}*/
/*{{{  bsf*/

static inline int bsf(uint64_t bb) {

  assert(bb != 0 && "bsf called with zero");

  return __builtin_ctzll(bb);

}

/*}}}*/
/*{{{  xorshift64star*/

static uint64_t seed = 0xDEADBEEFCAFEBABEULL;

static uint64_t xorshift64star(void) {

  seed ^= seed >> 12;
  seed ^= seed << 25;
  seed ^= seed >> 27;

  return seed * 2685821657736338717ULL;

}

/*}}}*/
/*{{{  cleanup*/

static void cleanup() {

  for (int sq = 0; sq < 64; sq++) {
    free(rook_attacks[sq].attacks);
    free(bishop_attacks[sq].attacks);
  }

}

/*}}}*/
/*{{{  piece_index*/

static inline int piece_index(int piece, int colour) {

  return piece + colour * 6;

}

/*}}}*/
/*{{{  toggle*/

static inline int toggle(int stm) {

  return stm ^ 1;

}

/*}}}*/
/*{{{  print_bb*/

static void print_bb(uint64_t bb, char *tag) {

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
/*{{{  print_board*/

static void print_board(const Position *pos) {

  const char piece_chars[12] = {
    'P', 'N', 'B', 'R', 'Q', 'K',
    'p', 'n', 'b', 'r', 'q', 'k'
  };

  for (int rank = 7; rank >= 0; rank--) {

    printf("%d  ", rank + 1);

    for (int file = 0; file < 8; file++) {

      int sq = rank * 8 + file;
      uint64_t bb = 1ULL << sq;
      char c = '.';

      for (int i = 0; i < 12; i++) {
        if (pos->all[i] & bb) {
          c = piece_chars[i];
          break;
        }
      }

      printf("%c ", c);
    }

    printf("\n");
  }

  printf("\n   a b c d e f g h\n\n");

}

/*}}}*/
/*{{{  pp_move*/

static const char *pp_move(uint32_t move) {

  static char buf[32];

  int from, to, from_idx, cap_idx;
  decode_move(move, from, to, from_idx, cap_idx);

  char from_file = 'a' + (from % 8);
  char from_rank = '1' + (from / 8);
  char to_file   = 'a' + (to % 8);
  char to_rank   = '1' + (to / 8);

  const char piece_chars[] = {'P', 'N', 'B', 'R', 'Q', 'K',
                              'p', 'n', 'b', 'r', 'q', 'k'};

  char from_piece = piece_chars[from_idx];  // can be stale
  char cap_piece  = piece_chars[cap_idx];   // can be stale

  char flags[16];
  int f = 0;

  if (move & CAPTURE_FLAG)    flags[f++] = 'C';
  if (move & EPPUSH_FLAG)     flags[f++] = 'E';
  if (move & EPCAPTURE_FLAG)  flags[f++] = 'c';
  if (move & KCASTLE_FLAG)    flags[f++] = 'K';
  if (move & QCASTLE_FLAG)    flags[f++] = 'Q';
  if (move & QPROMOTION_FLAG) flags[f++] = 'q';
  if (move & RPROMOTION_FLAG) flags[f++] = 'r';
  if (move & BPROMOTION_FLAG) flags[f++] = 'b';
  if (move & NPROMOTION_FLAG) flags[f++] = 'n';
  flags[f] = '\0';

  if (move & CAPTURE_FLAG || move & EPCAPTURE_FLAG)
    snprintf(buf, sizeof(buf), "%c%c%c%c %-5s %c x %c",
             from_file, from_rank, to_file, to_rank,
             flags, from_piece, cap_piece);
  else
    snprintf(buf, sizeof(buf), "%c%c%c%c %-5s %c",
             from_file, from_rank, to_file, to_rank,
             flags, from_piece);

  return buf;

}

/*}}}*/

/*{{{  magic_index*/

static inline int magic_index(uint64_t blockers, uint64_t magic, int bits) {

  return (int)((blockers * magic) >> (64 - bits));

}

/*}}}*/
/*{{{  get_blockers*/

static void get_blockers(Attack *a, uint64_t *blockers) {

  int bits[64];
  int num_bits = 0;

  for (int b = 0; b < 64; b++) {
    if (a->mask & (1ULL << b)) {
      bits[num_bits++] = b;
    }
  }

  assert(a->bits == num_bits && "wrong bits");

  for (int i = 0; i < a->count; i++) {

    uint64_t blocker = 0;

    for (int j = 0; j < a->bits; j++) {
      if (i & (1 << j)) {
        blocker |= 1ULL << bits[j];
      }
    }

    blockers[i] = blocker;

  }
}

/*}}}*/
/*{{{  find_magics*/

static void find_magics(Attack attacks[64], const char *label) {

  int total_tries = 0;

  printf("\n%-2s %3s %12s %5s  %-18s %6s\n", "T", "Sq", "Tries", "Bits", "Magic", "Fill");
  printf("---------------------------------------------------------------\n");

  for (int sq = 0; sq < 64; sq++) {

    Attack *a = &attacks[sq];

    uint64_t blockers[a->count];
    get_blockers(a, blockers);

    int tries = 0;

    while (1) {

      tries++;

      uint64_t magic = xorshift64star() & xorshift64star() & xorshift64star();

      if (popcount((a->mask * magic) >> (64 - a->bits)) < a->bits - 2)
        continue;

      uint64_t *attacks = calloc(a->count, sizeof(uint64_t));
      if (!attacks) {
        fprintf(stderr, "calloc failed for attacks[%d]\n", sq);
        exit(1);
      }

      int fail = 0, populated = 0;

      for (int i = 0; i < a->count; i++) {
        uint64_t blocker = blockers[i];
        uint64_t attack = a->attacks[i];
        int index = magic_index(blocker, magic, a->bits);

        if (attacks[index] == 0) {
          attacks[index] = attack;
          populated++;
        }

        else if (attacks[index] != attack) {
          fail = 1;
          free(attacks);
          break;
        }
      }

      if (!fail) {
        a->magic = magic;
        free(a->attacks);
        a->attacks = attacks;

        int percent = (100 * populated) / a->count;
        printf("%-2s %3d %12d %5d  0x%016llx %5d%%\n",
               label, sq, tries, a->bits, (unsigned long long)magic, percent);

        total_tries += tries;
        break;
      }
    }
  }

  printf("---------------------------------------------------------------\n");
  printf("Total tries for %s: %d\n\n", label, total_tries);

}

/*}}}*/

/*{{{  init_knight_attacks*/

static void init_knight_attacks(void) {

  for (int sq = 0; sq < 64; sq++) {

    int r = sq / 8, f = sq % 8;
    uint64_t bb = 0;

    int dr[8] = {-2, -1, 1, 2, 2, 1, -1, -2};
    int df[8] = {1, 2, 2, 1, -1, -2, -2, -1};

    for (int i = 0; i < 8; i++) {
      int nr = r + dr[i], nf = f + df[i];
      if (nr >= 0 && nr < 8 && nf >= 0 && nf < 8)
        bb |= 1ULL << (nr * 8 + nf);
    }

    knight_attacks[sq] = bb;

  }
}

/*}}}*/
/*{{{  init_bishop_attacks*/

static void init_bishop_attacks(void) {

  for (int sq = 0; sq < 64; sq++) {

    Attack *a = &bishop_attacks[sq];

    /*{{{  build mask*/
    
    int rank = sq / 8;
    int file = sq % 8;
    
    a->mask = 0;
    
    for (int r = rank + 1, f = file + 1; r <= 6 && f <= 6; r++, f++)
      a->mask |= 1ULL << (r * 8 + f);
    
    for (int r = rank + 1, f = file - 1; r <= 6 && f >= 1; r++, f--)
      a->mask |= 1ULL << (r * 8 + f);
    
    for (int r = rank - 1, f = file + 1; r >= 1 && f <= 6; r--, f++)
      a->mask |= 1ULL << (r * 8 + f);
    
    for (int r = rank - 1, f = file - 1; r >= 1 && f >= 1; r--, f--)
      a->mask |= 1ULL << (r * 8 + f);
    
    /*}}}*/

    a->bits = popcount(a->mask);
    a->count = 1 << a->bits;

    a->attacks = malloc(a->count * sizeof(uint64_t));
    if (!a->attacks) {
      fprintf(stderr, "malloc failed for bishop_attacks[%d]\n", sq);
      cleanup();
      exit(1);
    }

    uint64_t blockers[a->count];
    get_blockers(a, blockers);

    for (int i = 0; i < a->count; i++) {
      /*{{{  build attacks[i]*/
      
      uint64_t blocker = blockers[i];
      uint64_t attack = 0;
      
      for (int r = rank + 1, f = file + 1; r <= 7 && f <= 7; r++, f++) {
        int s = r * 8 + f;
        attack |= 1ULL << s;
        if (blocker & (1ULL << s))
          break;
      }
      
      for (int r = rank + 1, f = file - 1; r <= 7 && f >= 0; r++, f--) {
        int s = r * 8 + f;
        attack |= 1ULL << s;
        if (blocker & (1ULL << s))
          break;
      }
      
      for (int r = rank - 1, f = file + 1; r >= 0 && f <= 7; r--, f++) {
        int s = r * 8 + f;
        attack |= 1ULL << s;
        if (blocker & (1ULL << s))
          break;
      }
      
      for (int r = rank - 1, f = file - 1; r >= 0 && f >= 0; r--, f--) {
        int s = r * 8 + f;
        attack |= 1ULL << s;
        if (blocker & (1ULL << s))
          break;
      }
      
      a->attacks[i] = attack;
      
      /*}}}*/
    }
  }

  find_magics(bishop_attacks, "B");

}

/*}}}*/
/*{{{  init_rook_attacks*/

static void init_rook_attacks(void) {

  for (int sq = 0; sq < 64; sq++) {

    Attack *a = &rook_attacks[sq];

    /*{{{  build mask*/
    
    int rank = sq / 8;
    int file = sq % 8;
    
    a->mask = 0;
    
    for (int f = file + 1; f <= 6; f++)
      a->mask |= 1ULL << (rank * 8 + f);
    
    for (int f = file - 1; f >= 1; f--)
      a->mask |= 1ULL << (rank * 8 + f);
    
    for (int r = rank + 1; r <= 6; r++)
      a->mask |= 1ULL << (r * 8 + file);
    
    for (int r = rank - 1; r >= 1; r--)
      a->mask |= 1ULL << (r * 8 + file);
    
    /*}}}*/

    a->bits = popcount(a->mask);
    a->count = 1 << a->bits;

    a->attacks = malloc(a->count * sizeof(uint64_t));
    if (!a->attacks) {
      fprintf(stderr, "malloc failed for attacks[%d]\n", sq);
      cleanup();
      exit(1);
    }

    uint64_t blockers[a->count];
    get_blockers(a, blockers);

    for (int i = 0; i < a->count; i++) {
      /*{{{  build attacks[i]*/
      
      uint64_t blocker = blockers[i];
      uint64_t attack = 0;
      
      // North
      for (int r = rank + 1; r <= 7; r++) {
        int s = r * 8 + file;
        attack |= 1ULL << s;
        if (blocker & (1ULL << s)) {
          break;
        }
      }
      
      // South
      for (int r = rank - 1; r >= 0; r--) {
        int s = r * 8 + file;
        attack |= 1ULL << s;
        if (blocker & (1ULL << s)) {
          break;
        }
      }
      
      // East
      for (int f = file + 1; f <= 7; f++) {
        int s = rank * 8 + f;
        attack |= 1ULL << s;
        if (blocker & (1ULL << s)) {
          break;
        }
      }
      
      // West
      for (int f = file - 1; f >= 0; f--) {
        int s = rank * 8 + f;
        attack |= 1ULL << s;
        if (blocker & (1ULL << s)) {
          break;
        }
      }
      
      a->attacks[i] = attack;
      
      /*}}}*/
    }
  }

  find_magics(rook_attacks, "R");

}

/*}}}*/
/*{{{  init_king_attacks*/

static void init_king_attacks(void) {

  for (int sq = 0; sq < 64; sq++) {

    int r = sq / 8, f = sq % 8;
    uint64_t bb = 0;

    for (int dr = -1; dr <= 1; dr++) {
      for (int df = -1; df <= 1; df++) {
        if (dr == 0 && df == 0) continue;
        int nr = r + dr, nf = f + df;
        if (nr >= 0 && nr < 8 && nf >= 0 && nf < 8)
          bb |= 1ULL << (nr * 8 + nf);
      }
    }

    king_attacks[sq] = bb;

  }
}

/*}}}*/

/*{{{  position*/

static void position(Position *pos, const char *board_fen, const char *stm_str, const char *rights_str, const char *ep_str) {

  const int char_to_piece[128] = {
    ['p'] = 0, ['n'] = 1, ['b'] = 2, ['r'] = 3, ['q'] = 4, ['k'] = 5,
  };

  memset(pos, 0, sizeof(Position));

  /*{{{  board*/
  
  int sq = 56;
  
  for (const char *p = board_fen; *p; ++p) {
  
    if (*p == '/') {
      sq -= 16;
    }
  
    else if (isdigit(*p)) {
      sq += *p - '0';
    }
  
    else {
  
      int colour = !!islower(*p);
      int piece = char_to_piece[tolower(*p)];
      int index = piece_index(piece, colour);
  
      uint64_t bb = 1ULL << sq;
  
      pos->indexes[sq] = index; // 0 to 11
  
      pos->all[index]     |= bb;
      pos->occupied       |= bb;
      pos->colour[colour] |= bb;
  
      sq++;
  
    }
  }
  
  /*}}}*/
  /*{{{  stm*/
  
  pos->stm = (stm_str[0] == 'w') ? 0 : 1;
  
  /*}}}*/
  /*{{{  rights*/
  
  pos->rights = 0;
  
  for (const char *p = rights_str; *p; ++p) {
    switch (*p) {
      case 'K': pos->rights |= WHITE_RIGHTS_KING; break;
      case 'Q': pos->rights |= WHITE_RIGHTS_QUEEN; break;
      case 'k': pos->rights |= BLACK_RIGHTS_KING; break;
      case 'q': pos->rights |= BLACK_RIGHTS_QUEEN; break;
    }
  }
  
  /*}}}*/
  /*{{{  ep*/
  
  if (ep_str[0] == '-') {
    pos->ep = 0;  // 0 is not a legal ep square so this is ok
  }
  
  else {
  
    int file = ep_str[0] - 'a';
    int rank = ep_str[1] - '1';
  
    pos->ep = rank * 8 + file;
  }
  
  /*}}}*/
  /*{{{  hmc*/
  
  pos->hmc = 0;
  
  /*}}}*/

}

/*}}}*/

/*{{{  gen_sliders*/

static inline void gen_sliders(Node *node, Attack *attack_table, int piece) {

  const Position *pos = &node->pos;
  const int stm = pos->stm;
  const uint64_t friends = pos->colour[stm];
  const uint64_t enemies = pos->colour[toggle(stm)];

  uint64_t bb = pos->all[piece_index(piece, stm)];

  while (bb) {

    const int from = bsf(bb);
    bb &= bb - 1;

    const Attack *a = &attack_table[from];
    const uint64_t blockers = pos->occupied & a->mask;
    const int index = magic_index(blockers, a->magic, a->bits);
    const int from_idx = pos->indexes[from];

    uint64_t attacks = a->attacks[index] & ~friends;

    while (attacks) {

      int to = bsf(attacks);
      attacks &= attacks - 1;

      int cap_idx = pos->indexes[to];

      uint32_t flags = 0;
      if ((1ULL << to) & enemies)
        flags |= CAPTURE_FLAG;

      node->moves[node->num_moves++] = encode_move(from, to, from_idx, cap_idx, flags);

    }
  }
}

/*}}}*/
/*{{{  gen_jumpers*/

static inline void gen_jumpers(Node *node, uint64_t *attack_table, int piece) {

  const Position *pos = &node->pos;
  const int stm = pos->stm;
  const uint64_t friends = pos->colour[stm];
  const uint64_t enemies = pos->colour[toggle(stm)];

  uint64_t bb = pos->all[piece_index(piece, stm)];

  while (bb) {

    const int from = bsf(bb);
    bb &= bb - 1;

    const int from_idx = pos->indexes[from];

    uint64_t attacks = attack_table[from] & ~friends;

    while (attacks) {

      int to = bsf(attacks);
      attacks &= attacks - 1;

      int cap_idx = pos->indexes[to];

      uint32_t flags = 0;
      if ((1ULL << to) & enemies)
        flags |= CAPTURE_FLAG;

      node->moves[node->num_moves++] = encode_move(from, to, from_idx, cap_idx, flags);

    }
  }
}

/*}}}*/
/*{{{  gen_pawns*/

static void gen_pawns(Node *node) {

  const Position *pos = &node->pos;
  const int stm = pos->stm;
  const uint64_t pawns = pos->all[piece_index(PAWN, stm)];
  const uint64_t occ = pos->occupied;
  const uint64_t friends = pos->colour[stm];
  const uint64_t enemies = pos->colour[toggle(stm)];
  const uint8_t *indexes = pos->indexes;
  const int ep = pos->ep;

  const int is_white = (stm == WHITE);
  const int up = is_white ? 8 : -8;
  const uint64_t rank7 = rank_mask[6];

  const uint64_t empty = ~occ;

  // Single pushes
  uint64_t single_push = is_white ? (pawns << 8) : (pawns >> 8);
  single_push &= empty;

  uint64_t promo_push = single_push & rank7;
  uint64_t quiet_push = single_push & ~rank7;

  while (promo_push) {
    int to = bsf(promo_push);
    promo_push &= promo_push - 1;
    int from = to - up;
    int from_idx = indexes[from];

    for (int i = 0; i < 4; i++) {
      uint32_t flag = (QPROMOTION_FLAG >> i);
      node->moves[node->num_moves++] = encode_move(from, to, from_idx, 0, flag);
    }
  }

  while (quiet_push) {
    int to = bsf(quiet_push);
    quiet_push &= quiet_push - 1;
    int from = to - up;
    int from_idx = indexes[from];

    node->moves[node->num_moves++] = encode_move(from, to, from_idx, 0, 0);
  }

  // Double pushes
  uint64_t dbl_push_pawns = pawns & (is_white ? rank_mask[1] : rank_mask[6]);
  uint64_t dbl_one_step = is_white ? (dbl_push_pawns << 8) : (dbl_push_pawns >> 8);
  dbl_one_step &= empty;
  uint64_t dbl_push = is_white ? (dbl_one_step << 8) : (dbl_one_step >> 8);
  dbl_push &= empty;

  while (dbl_push) {
    int to = bsf(dbl_push);
    dbl_push &= dbl_push - 1;
    int from = to - (is_white ? 16 : -16);
    int from_idx = indexes[from];

    node->moves[node->num_moves++] = encode_move(from, to, from_idx, 0, EPPUSH_FLAG);
  }

  // Captures
  const uint64_t not_a_file = 0xfefefefefefefefeULL;
  const uint64_t not_h_file = 0x7f7f7f7f7f7f7f7fULL;

  uint64_t left_cap  = is_white ? (pawns << 7) : (pawns >> 9);
  uint64_t right_cap = is_white ? (pawns << 9) : (pawns >> 7);

  left_cap  &= enemies & (is_white ? not_a_file : not_h_file);
  right_cap &= enemies & (is_white ? not_h_file : not_a_file);

  uint64_t promo_left  = left_cap & rank7;
  uint64_t promo_right = right_cap & rank7;
  left_cap  &= ~rank7;
  right_cap &= ~rank7;

  while (promo_left) {
    int to = bsf(promo_left);
    promo_left &= promo_left - 1;
    int from = to - (is_white ? 7 : -9);
    int from_idx = indexes[from];
    int cap_idx = indexes[to];

    for (int i = 0; i < 4; i++) {
      uint32_t flag = (QPROMOTION_FLAG >> i) | CAPTURE_FLAG;
      node->moves[node->num_moves++] = encode_move(from, to, from_idx, cap_idx, flag);
    }
  }

  while (promo_right) {
    int to = bsf(promo_right);
    promo_right &= promo_right - 1;
    int from = to - (is_white ? 9 : -7);
    int from_idx = indexes[from];
    int cap_idx = indexes[to];

    for (int i = 0; i < 4; i++) {
      uint32_t flag = (QPROMOTION_FLAG >> i) | CAPTURE_FLAG;
      node->moves[node->num_moves++] = encode_move(from, to, from_idx, cap_idx, flag);
    }
  }

  while (left_cap) {
    int to = bsf(left_cap);
    left_cap &= left_cap - 1;
    int from = to - (is_white ? 7 : -9);
    int from_idx = indexes[from];
    int cap_idx = indexes[to];

    node->moves[node->num_moves++] = encode_move(from, to, from_idx, cap_idx, CAPTURE_FLAG);
  }

  while (right_cap) {
    int to = bsf(right_cap);
    right_cap &= right_cap - 1;
    int from = to - (is_white ? 9 : -7);
    int from_idx = indexes[from];
    int cap_idx = indexes[to];

    node->moves[node->num_moves++] = encode_move(from, to, from_idx, cap_idx, CAPTURE_FLAG);
  }

  // En passant
  assert(ep == 0 || (ep >= 16 && ep <= 23) || (ep >= 40 && ep <= 47));
  if (ep != 0) {
    uint64_t ep_mask = 1ULL << ep;
    int from_left  = ep - (is_white ? 7 : -9);
    int from_right = ep - (is_white ? 9 : -7);

    if ((pawns & (1ULL << from_left)) && (ep_mask & (is_white ? not_a_file : not_h_file))) {
      int from_idx = indexes[from_left];
      node->moves[node->num_moves++] = encode_move(from_left, ep, from_idx, 0, EPCAPTURE_FLAG);
    }

    if ((pawns & (1ULL << from_right)) && (ep_mask & (is_white ? not_h_file : not_a_file))) {
      int from_idx = indexes[from_right];
      node->moves[node->num_moves++] = encode_move(from_right, ep, from_idx, 0, EPCAPTURE_FLAG);
    }

  }
}

/*}}}*/
/*{{{  gen_moves*/

static void gen_moves(Node *node) {

  node->num_moves = 0;

  gen_pawns(node);
  gen_jumpers(node, knight_attacks, KNIGHT);
  gen_sliders(node, bishop_attacks, BISHOP);
  gen_sliders(node, rook_attacks,   ROOK);
  gen_sliders(node, rook_attacks,   QUEEN);
  gen_sliders(node, bishop_attacks, QUEEN);
  gen_jumpers(node, king_attacks,   KING);

}

/*}}}*/

/*{{{  uci_tokens*/

static int uci_tokens(int n, char **tokens) {

  if (n == 0)
    return 0;

  const char *cmd = tokens[0];
  const char *sub = tokens[1];

  if (!strcmp(cmd, "isready")) {
    /*{{{  isready*/
    
    printf("readyok\n");
    
    /*}}}*/
  }

  if (!strcmp(cmd, "position") || !strcmp(cmd, "p")) {
    /*{{{  position*/
    
    ply = 0;
    
    if (!strcmp(sub, "startpos") || !strcmp(sub, "s")) {
    
      position(&ss[ply].pos, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", "w", "KQkq", "-");
    
      //if (n > 2 && !strcmp(tokens[2],"moves")) {
        //for (int i=3; i < n; i++)
          //playMove(tokens[i]);
      //}
    }
    
    else if (!strcmp(sub, "fen") || !strcmp(sub, "f") ) {
    
      position(&ss[ply].pos, tokens[2], tokens[3], tokens[4], tokens[5]);
    
      //if (n > 8 && !strcmp(tokens[8],"moves")) {
        //for (int i=9; i < n; i++)
          //playMove(tokens[i]);
      //}
    }
    
    /*}}}*/
  }

  else if (!strcmp(cmd, "uci")) {
    /*{{{  uci*/
    
    printf("id name Lozza 8c\n");
    printf("id author Colin Jenkins\n");
    printf("uciok\n");
    
    /*}}}*/
  }

  else if (!strcmp(cmd, "b")) {
    /*{{{  board*/
    
    print_board(&ss[ply].pos);
    
    /*}}}*/
  }

  else if (!strcmp(cmd, "m")) {
    /*{{{  moves*/
    
    Node *node = &ss[ply];
    
    gen_moves(node);
    
    for (int i=0; i < node->num_moves; i++) {
    
      const uint32_t move = node->moves[i];
      const char *pp = pp_move(move);
    
      printf("%s\n", pp);
    
    }
    
    /*}}}*/
  }

  else if (!strcmp(cmd, "q")) {
    /*{{{  quit*/
    
    return 1;
    
    /*}}}*/
  }

  else {
    printf("?\n");
  }

  return 0;

}

/*}}}*/
/*{{{  uci_exec*/

static int uci_exec(char *line) {

  char *tokens[UCI_TOKENS];
  char *token;

  int num_tokens = 0;

  token = strtok(line, " \t\n");

  while (token != NULL && num_tokens < UCI_TOKENS) {

    tokens[num_tokens++] = token;

    token = strtok(NULL, " \r\t\n");
  }

  return uci_tokens(num_tokens, tokens);

}

/*}}}*/
/*{{{  uci_loop*/

static void uci_loop(int argc, char **argv) {

  setvbuf(stdout, NULL, _IONBF, 0);

  char chunk[UCI_LINE_LENGTH];

  for (int i=1; i < argc; i++) {
    if (uci_exec(argv[i]))
      return;
  }

  while (fgets(chunk, sizeof(chunk), stdin) != NULL) {
    if (uci_exec(chunk))
      return;
  }

}

/*}}}*/

/*{{{  init_once*/

static void init_once() {

  struct timeval start, end;
  gettimeofday(&start, NULL);

  memset(ss, 0, sizeof(ss));

  init_knight_attacks();
  init_bishop_attacks();
  init_rook_attacks();
  init_king_attacks();

  gettimeofday(&end, NULL);

  long ms = (end.tv_sec - start.tv_sec) * 1000 +
            (end.tv_usec - start.tv_usec) / 1000;

  printf("init_once: total time = %ld ms\n", ms);

}

/*}}}*/

/*{{{  main*/

int main(int argc, char **argv) {

  init_once();
  uci_loop(argc, argv);

  cleanup();

  return 0;

}

/*}}}*/

