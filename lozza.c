
/*{{{  includes*/

#define _POSIX_C_SOURCE 200809L

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

#define EMPTY 255

#define RANK_2 0x000000000000FF00ULL
#define RANK_7 0x00FF000000000000ULL

#define NOT_A_FILE 0xfefefefefefefefeULL
#define NOT_H_FILE 0x7f7f7f7f7f7f7f7fULL

#define PAWN_PUSH  (1 << 12)
#define EP_CAPTURE (1 << 13)

#define SPECIAL (PAWN_PUSH | EP_CAPTURE)

/*}}}*/
/*{{{  macros*/


/*}}}*/
/*{{{  structs*/

/*{{{  Position struct*/

typedef struct {

  uint64_t all[12];
  uint64_t colour[2];
  uint64_t occupied;

  uint8_t board[64];

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
  int shift;

  uint64_t mask;
  uint64_t magic;

  uint64_t *attacks;

} Attack;

/*}}}*/

/*}}}*/
/*{{{  globals*/

static uint64_t pawn_attacks[2][64];
static uint64_t knight_attacks[64];
static Attack   bishop_attacks[64];
static Attack   rook_attacks[64];
static uint64_t king_attacks[64];

static Node ss[MAX_PLY];

/*}}}*/

/*{{{  get_ms*/

static inline double get_ms() {

  struct timespec ts;

  clock_gettime(CLOCK_MONOTONIC, &ts);

  return (ts.tv_sec * 1000.0) + (ts.tv_nsec / 1e6);

}

/*}}}*/
/*{{{  shift*/

//static inline uint64_t shift(const uint64_t bb, const int n) {
  //return n > 0 ? bb << n : bb >> -n;
//}

static inline __attribute__((always_inline)) uint64_t shift(uint64_t bb, int n) {
  const uint64_t left  = bb << (n & 63);         // if n = 0
  const uint64_t right = bb >> ((-n) & 63);      // if n < 0
  const uint64_t mask = -(n >= 0);               // 0xFFFFFFFFFFFFFFFF if n = 0, else 0
  return (left & mask) | (right & ~mask);  // select branchlessly
}

/*}}}*/
/*{{{  popcount*/

static inline __attribute__((always_inline)) int popcount(const uint64_t bb) {

  return __builtin_popcountll(bb);

}

/*}}}*/
/*{{{  encode_move*/

static inline __attribute__((always_inline)) uint32_t encode_move(const int from, const int to, const uint32_t flags) {

  return (from << 6) | to | flags;

}

/*}}}*/
/*{{{  bsf*/

static inline __attribute__((always_inline)) int bsf(const uint64_t bb) {

  assert(bb != 0 && "bsf called with zero");

  return __builtin_ctzll(bb);

}

/*}}}*/
/*{{{  xorshift64star*/

static uint64_t rand_seed = 0xDEADBEEFCAFEBABEULL;

static uint64_t xorshift64star(void) {

  rand_seed ^= rand_seed >> 12;
  rand_seed ^= rand_seed << 25;
  rand_seed ^= rand_seed >> 27;

  return rand_seed * 2685821657736338717ULL;

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

static inline __attribute__((always_inline)) int piece_index(const int piece, const int colour) {

  return piece + colour * 6;

}

/*}}}*/
/*{{{  toggle*/

static inline __attribute__((always_inline)) int toggle(const int stm) {

  return stm ^ 1;

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
/*{{{  pp_move*/

static void pp_move(const uint32_t move) {

  const char files[] = "abcdefgh";
  const char ranks[] = "12345678";

  int from = (move >> 6) & 0x3F;
  int to   = move & 0x3F;

  char buf[6];

  buf[0] = files[from % 8];
  buf[1] = ranks[from / 8];
  buf[2] = files[to % 8];
  buf[3] = ranks[to / 8];
  buf[4] = '\0';

  printf("%s\n", buf);

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

  printf("   a b c d e f g h\n");
  printf("ep=%d\n", pos->ep);

}

/*}}}*/

/*{{{  magic_index*/

static inline int magic_index(const uint64_t blockers, const uint64_t magic, const int shift) {

  return (int)((blockers * magic) >> shift);

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
        int index = magic_index(blocker, magic, a->shift);

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

/*{{{  init_pawn_attacks*/

// these are attacks *to* the sq and used in pawn_gen (ep) and is_attacked

static void init_pawn_attacks(void) {

  for (int sq = 0; sq < 64; sq++) {

    const uint64_t bb = 1ULL << sq;

    pawn_attacks[WHITE][sq] =
      ((bb >> 7) & NOT_A_FILE) | ((bb >> 9) & NOT_H_FILE);

    pawn_attacks[BLACK][sq] =
      ((bb << 7) & NOT_H_FILE) | ((bb << 9) & NOT_A_FILE);

  }
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
    a->shift = 64 - a->bits;
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
    a->shift = 64 - a->bits;
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
  
  for (int i=0; i < 64; i++)
    pos->board[i] = EMPTY;
  
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
  
      pos->all[index]     |= bb;
      pos->occupied       |= bb;
      pos->colour[colour] |= bb;
  
      pos->board[sq] = index;
  
      sq++;
  
    }
  }
  
  /*}}}*/
  /*{{{  stm*/
  
  pos->stm = (stm_str[0] == 'w') ? WHITE : BLACK;
  
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

static inline void gen_sliders(Node *node, Attack *attack_table, const int piece) {

  const Position *pos = &node->pos;
  const int stm = pos->stm;
  const uint64_t friends = pos->colour[stm];
  //const uint64_t enemies = pos->colour[toggle(stm)];
  const uint64_t opp_king = pos->all[piece_index(KING, toggle(stm))];

  uint64_t bb = pos->all[piece_index(piece, stm)];

  while (bb) {

    const int from = bsf(bb);
    bb &= bb - 1;

    const Attack *a = &attack_table[from];
    const uint64_t blockers = pos->occupied & a->mask;
    const int index = magic_index(blockers, a->magic, a->shift);

    uint64_t attacks = a->attacks[index] & ~friends & ~opp_king;

    while (attacks) {

      const int to = bsf(attacks);
      attacks &= attacks - 1;

      node->moves[node->num_moves++] = encode_move(from, to, 0);

    }
  }
}

/*}}}*/
/*{{{  gen_jumpers*/

static inline void gen_jumpers(Node *node, const uint64_t *attack_table, const int piece) {

  const Position *pos = &node->pos;
  const int stm = pos->stm;
  const uint64_t friends = pos->colour[stm];
  //const uint64_t enemies = pos->colour[toggle(stm)];
  const uint64_t opp_king = pos->all[piece_index(KING, toggle(stm))];

  uint64_t bb = pos->all[piece_index(piece, stm)];

  while (bb) {

    const int from = bsf(bb);
    bb &= bb - 1;

    uint64_t attacks = attack_table[from] & ~friends & ~opp_king;

    while (attacks) {

      const int to = bsf(attacks);
      attacks &= attacks - 1;

      node->moves[node->num_moves++] = encode_move(from, to, 0);

    }
  }
}

/*}}}*/
/*{{{  gen_pawns*/

static const uint64_t home_rank[2] = {RANK_2, RANK_7};
static const int orth_offset[2]    = {8, -8};
static const int left_offset[2]    = {7, -9};
static const int right_offset[2]   = {9, -7};

static void gen_pawns(Node *node) {

  const Position *pos = &node->pos;
  const int stm = pos->stm;
  const int opp = toggle(stm);

  const uint64_t pawns    = pos->all[piece_index(PAWN, stm)];
  const uint64_t occupied = pos->occupied;
  const uint64_t enemies  = pos->colour[opp];
  const uint64_t opp_king = pos->all[piece_index(KING, opp)];

  /*{{{  push 1*/
  
  int offset = orth_offset[stm];
  uint64_t bb = shift(pawns, offset) & ~occupied;
  
  while (bb) {
    const int to = bsf(bb);
    bb &= bb - 1;
    node->moves[node->num_moves++] = encode_move(to - offset, to, 0);
  }
  
  /*}}}*/
  /*{{{  push 2*/
  
  bb = pawns & home_rank[stm];
  bb = shift(bb, offset) & ~occupied;
  bb = shift(bb, offset) & ~occupied;
  
  offset += offset;
  
  while (bb) {
    const int to = bsf(bb);
    bb &= bb - 1;
    node->moves[node->num_moves++] = encode_move(to - offset, to, PAWN_PUSH);
  }
  
  /*}}}*/
  /*{{{  left*/
  
  offset = left_offset[stm];
  bb = shift(pawns, offset) & enemies & NOT_H_FILE & ~opp_king;
  
  while (bb) {
    const int to = bsf(bb);
    bb &= bb - 1;
    node->moves[node->num_moves++] = encode_move(to - offset, to, 0);
  }
  
  /*}}}*/
  /*{{{  right*/
  
  offset = right_offset[stm];
  bb = shift(pawns, offset) & enemies & NOT_A_FILE & ~opp_king;
  
  while (bb) {
    const int to = bsf(bb);
    bb &= bb - 1;
    node->moves[node->num_moves++] = encode_move(to - offset, to, 0);
  }
  
  /*}}}*/

  if (pos->ep) {
    /*{{{  ep*/
    
    bb = pawn_attacks[stm][pos->ep] & pawns;
    
    while (bb) {
      const int from = bsf(bb);
      bb &= bb - 1;
      node->moves[node->num_moves++] = encode_move(from, pos->ep, EP_CAPTURE);
    }
    
    /*}}}*/
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

/*{{{  make_move*/

static void make_move(Position * __restrict pos, const uint64_t move) {

  const int from = (move >> 6) & 0x3F;
  const int to   = move & 0x3F;

  const uint64_t from_bb = 1ULL << from;
  const uint64_t to_bb   = 1ULL << to;

  const int stm = pos->stm;
  const int opp = toggle(stm);

  const int from_piece = pos->board[from];
  const int to_piece   = pos->board[to];

  /*{{{  remove from piece*/
  
  pos->all[from_piece] &= ~from_bb;
  pos->colour[stm]     &= ~from_bb;
  
  pos->board[from] = EMPTY;
  
  /*}}}*/

  if (to_piece != EMPTY) {
    /*{{{  remove to piece*/
    
    pos->all[to_piece] &= ~to_bb;
    pos->colour[opp]   &= ~to_bb;
    
    /*}}}*/
  }

  /*{{{  move from piece*/
  
  pos->all[from_piece] |= to_bb;
  pos->colour[stm]     |= to_bb;
  
  pos->board[to] = from_piece;
  
  /*}}}*/

  pos->ep = 0;

  if (move & SPECIAL) {
    /*{{{  specials*/
    
    if (move & EP_CAPTURE) {
      /*{{{  ep*/
      
      const int pawn_sq = to + orth_offset[opp];
      const uint64_t pawn_bb = 1ULL << pawn_sq;
      
      pos->all[piece_index(PAWN, opp)] &= ~pawn_bb;
      pos->colour[opp] &= ~pawn_bb;
      pos->board[pawn_sq] = EMPTY;
      
      /*}}}*/
    }
    
    else if (move & PAWN_PUSH) {
      /*{{{  set ep*/
      
      pos->ep = from + orth_offset[stm];
      
      /*}}}*/
    }
    
    /*}}}*/
  }

  pos->occupied = pos->colour[WHITE] | pos->colour[BLACK];
  pos->stm = opp;

}

/*}}}*/
/*{{{  is_attacked*/

static inline int is_attacked(const Position * __restrict pos, int sq, const int opp) {

  if (pos->all[piece_index(PAWN, opp)] & pawn_attacks[opp][sq])
    return 1;

  if (pos->all[piece_index(KNIGHT, opp)] & knight_attacks[sq])
    return 1;

  if (pos->all[piece_index(KING, opp)] & king_attacks[sq])
    return 1;

  Attack *a = &bishop_attacks[sq];
  uint64_t blockers = pos->occupied & a->mask;
  int idx = magic_index(blockers, a->magic, a->shift);
  uint64_t attacks = a->attacks[idx];
  if (attacks & (pos->all[piece_index(BISHOP, opp)] | pos->all[piece_index(QUEEN, opp)]))
    return 1;

  a = &rook_attacks[sq];
  blockers = pos->occupied & a->mask;
  idx = magic_index(blockers, a->magic, a->shift);
  attacks = a->attacks[idx];
  if (attacks & (pos->all[piece_index(ROOK, opp)] | pos->all[piece_index(QUEEN, opp)]))
    return 1;

  return 0;

}

/*}}}*/

/*{{{  perft*/

static uint64_t perft(int ply, int depth) {

  if (depth == 0)
    return 1;

  Node *node = &ss[ply];
  Node *next = &ss[ply+1];

  gen_moves(node);

  const int stm = node->pos.stm;
  const int opp = toggle(stm);

  const int king = piece_index(KING, stm);

  uint64_t total_searched = 0;

  for (int i=0; i < node->num_moves; i++) {

    memcpy(&next->pos, &node->pos, sizeof(Position));

    make_move(&next->pos, node->moves[i]);

    int king_sq = bsf(next->pos.all[king]);
    if (is_attacked(&next->pos, king_sq, opp)) {
      continue;
    }

    uint64_t nodes_searched = perft(ply+1, depth-1);

    total_searched += nodes_searched;

  }

  return total_searched;

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
    
    if (!strcmp(sub, "startpos") || !strcmp(sub, "s")) {
    
      position(&ss[0].pos, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", "w", "KQkq", "-");
    
      //if (n > 2 && !strcmp(tokens[2],"moves")) {
        //for (int i=3; i < n; i++)
          //playMove(tokens[i]);
      //}
    }
    
    else if (!strcmp(sub, "fen") || !strcmp(sub, "f") ) {
    
      position(&ss[0].pos, tokens[2], tokens[3], tokens[4], tokens[5]);
    
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
    
    print_board(&ss[0].pos);
    
    /*}}}*/
  }

  else if (!strcmp(cmd, "m")) {
    /*{{{  moves*/
    
    Node *node = &ss[0];
    Node *next = &ss[1];
    
    gen_moves(node);
    
    const int stm = node->pos.stm;
    const int opp = toggle(stm);
    
    for (int i=0; i < node->num_moves; i++) {
    
      memcpy(&next->pos, &node->pos, sizeof(Position));
    
      uint32_t move = node->moves[i];
    
      make_move(&next->pos, move);
    
      int king_sq = bsf(next->pos.all[piece_index(KING, stm)]);
    
      if (is_attacked(&next->pos, king_sq, opp)) {
        continue;
      }
    
      pp_move(move);
    
    }
    
    /*}}}*/
  }

  else if (!strcmp(cmd, "perft") || !strcmp(cmd, "f")) {
    /*{{{  perft*/
    
    const int depth = atoi(sub);
    double start = get_ms();
    uint64_t total_nodes = 0;
    
    for (int d=0; d <= depth; d++) {
      uint64_t num_nodes = perft(0, d);
      total_nodes += num_nodes;
      printf("perft(%d) = %llu\n", d, (unsigned long long)num_nodes);
    }
    
    double end = get_ms();
    
    double elapsed_ms = end - start;
    double nps = (elapsed_ms > 0.0) ? (total_nodes / (elapsed_ms / 1000.0)) : 0;
    
    printf("time = %.2f ms,  nps = %.0f\n", elapsed_ms, nps);
    
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

  init_pawn_attacks();
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

