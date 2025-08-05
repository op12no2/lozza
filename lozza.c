
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

#define WHITE 0
#define BLACK 8

#define WHITE_RIGHTS_KING  1
#define WHITE_RIGHTS_QUEEN 2
#define BLACK_RIGHTS_KING  4
#define BLACK_RIGHTS_QUEEN 8

enum {
  EMPTY = 0,

  PAWN = 1,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING,

  WPAWN = PAWN | WHITE,
  WKNIGHT,
  WBISHOP,
  WROOK,
  WQUEEN,
  WKING,

  BPAWN = PAWN | BLACK,
  BKNIGHT,
  BBISHOP,
  BROOK,
  BQUEEN,
  BKING
};

#define CAPTURE_FLAG (1 << 12)

static const uint8_t char_to_piece[128] = {
  ['P'] = WPAWN,
  ['N'] = WKNIGHT,
  ['B'] = WBISHOP,
  ['R'] = WROOK,
  ['Q'] = WQUEEN,
  ['K'] = WKING,
  ['p'] = BPAWN,
  ['n'] = BKNIGHT,
  ['b'] = BBISHOP,
  ['r'] = BROOK,
  ['q'] = BQUEEN,
  ['k'] = BKING
};

static const char piece_to_char[16] = {
  [WPAWN]   = 'P', [WKNIGHT] = 'N', [WBISHOP] = 'B',
  [WROOK]   = 'R', [WQUEEN]  = 'Q', [WKING]   = 'K',
  [BPAWN]   = 'p', [BKNIGHT] = 'n', [BBISHOP] = 'b',
  [BROOK]   = 'r', [BQUEEN]  = 'q', [BKING]   = 'k'
};

/*}}}*/
/*{{{  macros*/

#define SET_MASK(sq) (1ULL << (sq))

/*}}}*/
/*{{{  globals*/

/*{{{  Position struct*/

typedef struct {

  uint64_t wpawns, wknights, wbishops, wrooks, wqueens, wkings;
  uint64_t bpawns, bknights, bbishops, brooks, bqueens, bkings;
  uint64_t white, black, occupied;

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
  uint32_t num_moves;

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

static Attack rook_attacks[64];
static Attack bishop_attacks[64];

int ply = 0;
Node ss[MAX_PLY];

/*}}}*/

/*{{{  cleanup*/

static void cleanup() {

  for (int sq = 0; sq < 64; sq++) {
    free(rook_attacks[sq].attacks);
  }

}

/*}}}*/
/*{{{  print_bb*/

static void print_bb(uint64_t bb) {

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
/*{{{  select_bb*/

static inline uint64_t select_bb(int stm, uint64_t white_bb, uint64_t black_bb) {

  int s = stm >> 3;

  uint64_t mask = 0ULL - (uint64_t)s;

  return (white_bb & ~mask) | (black_bb & mask);

}

/*}}}*/
/*{{{  format_move*/

static const char *format_move(uint32_t move) {

  static char buf[5];

  const int from = (move >> 6) & 0x3F;
  const int to   = move & 0x3F;

  buf[0] = 'a' + (from % 8);
  buf[1] = '1' + (from / 8);
  buf[2] = 'a' + (to % 8);
  buf[3] = '1' + (to / 8);
  buf[4] = '\0';

  return buf;

}

/*}}}*/
/*{{{  format_flags*/

const char *format_flags(uint32_t move) {

  static char buf[8];
  int i = 0;

  if (move & CAPTURE_FLAG) buf[i++] = 'C';

  buf[i] = '\0';

  return buf;
}

/*}}}*/
/*{{{  new_move*/

static inline uint32_t new_move(int from, int to, uint32_t flags) {

  return (from << 6) | to | flags;

}

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
/*{{{  init_rook_attacks*/

static void init_rook_attacks(void) {

  for (int sq = 0; sq < 64; sq++) {

    Attack *a = &rook_attacks[sq];

    /*{{{  build mask*/
    
    int rank = sq / 8;
    int file = sq % 8;
    
    a->mask = 0;
    
    for (int f = file + 1; f <= 6; f++)
      a->mask |= SET_MASK(rank * 8 + f);
    
    for (int f = file - 1; f >= 1; f--)
      a->mask |= SET_MASK(rank * 8 + f);
    
    for (int r = rank + 1; r <= 6; r++)
      a->mask |= SET_MASK(r * 8 + file);
    
    for (int r = rank - 1; r >= 1; r--)
      a->mask |= SET_MASK(r * 8 + file);
    
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
      a->mask |= SET_MASK(r * 8 + f);
    
    for (int r = rank + 1, f = file - 1; r <= 6 && f >= 1; r++, f--)
      a->mask |= SET_MASK(r * 8 + f);
    
    for (int r = rank - 1, f = file + 1; r >= 1 && f <= 6; r--, f++)
      a->mask |= SET_MASK(r * 8 + f);
    
    for (int r = rank - 1, f = file - 1; r >= 1 && f >= 1; r--, f--)
      a->mask |= SET_MASK(r * 8 + f);
    
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
}

/*}}}*/

/*{{{  gen_sliders*/

typedef struct {

  const Attack *attacks;
  uint64_t pieces;
  uint64_t friendlies;
  uint64_t enemies;
  uint64_t occ;
  uint32_t *moves;
  int *num_moves;

} SliderGenParams;

static inline void gen_sliders(const SliderGenParams *p) {

  uint64_t bb = p->pieces;

  while (bb) {

    int from = bsf(bb);
    bb &= bb - 1;

    const Attack *a = &p->attacks[from];
    uint64_t blockers = p->occ & a->mask;
    int index = magic_index(blockers, a->magic, a->bits);
    uint64_t attacks = a->attacks[index] & ~p->friendlies;

    while (attacks) {

      int to = bsf(attacks);
      attacks &= attacks - 1;

      uint32_t flags = 0;
      flags |= !!((1ULL << to) & p->enemies) * CAPTURE_FLAG;

      p->moves[(*p->num_moves)++] = new_move(from, to, flags);

    }
  }
}

/*}}}*/
/*{{{  gen_moves*/

static void gen_moves(Node *node) {

  Position *pos = &node->pos;
  int stm = pos->stm;

  node->num_moves = 0;

  SliderGenParams args = {
    .friendlies = select_bb(stm, pos->white, pos->black),
    .enemies    = select_bb(stm, pos->black, pos->white),
    .occ        = pos->occupied,
    .moves      = node->moves,
    .num_moves  = &node->num_moves
  };

  args.pieces  = select_bb(stm, pos->wrooks, pos->brooks);
  args.attacks = rook_attacks;
  gen_sliders(&args);

  args.pieces  = select_bb(stm, pos->wbishops, pos->bbishops);
  args.attacks = bishop_attacks;
  gen_sliders(&args);

  args.pieces  = select_bb(stm, pos->wqueens, pos->bqueens);
  args.attacks = rook_attacks;
  gen_sliders(&args);

  args.attacks = bishop_attacks;
  gen_sliders(&args);

}


/*}}}*/
/*{{{  print_board*/

static void print_board(const Position *pos) {

  for (int rank = 7; rank >= 0; rank--) {

    printf("%d  ", rank + 1);

    for (int file = 0; file < 8; file++) {

      int sq = rank * 8 + file;
      uint64_t bb = 1ULL << sq;
      char c = '.';

      if (pos->wpawns   & bb)
        c = 'P';
      else if (pos->wknights & bb)
        c = 'N';
      else if (pos->wbishops & bb)
        c = 'B';
      else if (pos->wrooks   & bb)
        c = 'R';
      else if (pos->wqueens  & bb)
        c = 'Q';
      else if (pos->wkings   & bb)
        c = 'K';
      else if (pos->bpawns   & bb)
        c = 'p';
      else if (pos->bknights & bb)
        c = 'n';
      else if (pos->bbishops & bb)
        c = 'b';
      else if (pos->brooks   & bb)
        c = 'r';
      else if (pos->bqueens  & bb)
        c = 'q';
      else if (pos->bkings   & bb)
        c = 'k';

      printf("%c ", c);
    }

    printf("\n");
  }

  printf("\n   a b c d e f g h\n\n");

}

/*}}}*/
/*{{{  position*/

static void position(Position *pos, const char *board_fen, const char *stm_str, const char *rights_str, const char *ep_str) {

  memset(pos, 0, sizeof(Position));

  /*{{{  board*/
  
  int sq = 56;
  
  for (const char *p = board_fen; *p; ++p) {
  
    if (*p == '/') {
      sq -= 16; //
    }
  
    else if (isdigit(*p)) {
      sq += *p - '0';
    }
  
    else {
  
      int piece = char_to_piece[(int)*p];
      uint64_t bb = 1ULL << sq;
  
      switch (piece) {
        case WPAWN:    pos->wpawns   |= bb; break;
        case WKNIGHT:  pos->wknights |= bb; break;
        case WBISHOP:  pos->wbishops |= bb; break;
        case WROOK:    pos->wrooks   |= bb; break;
        case WQUEEN:   pos->wqueens  |= bb; break;
        case WKING:    pos->wkings   |= bb; break;
  
        case BPAWN:    pos->bpawns   |= bb; break;
        case BKNIGHT:  pos->bknights |= bb; break;
        case BBISHOP:  pos->bbishops |= bb; break;
        case BROOK:    pos->brooks   |= bb; break;
        case BQUEEN:   pos->bqueens  |= bb; break;
        case BKING:    pos->bkings   |= bb; break;
      }
  
      sq++;
    }
  }
  
  pos->white = pos->wpawns | pos->wknights | pos->wbishops | pos->wrooks | pos->wqueens  | pos->wkings;
  pos->black = pos->bpawns | pos->bknights | pos->bbishops | pos->brooks | pos->bqueens  | pos->bkings;
  pos->occupied = pos->white | pos->black;
  
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
    pos->ep = 0;
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
    
    const Position *pos = &node->pos;
    
    for (int i=0; i < node->num_moves; i++) {
    
      const uint32_t move = node->moves[i];
      const char *mstr = format_move(move);
      const char *fstr = format_flags(move);
    
      printf("%s %s\n", mstr, fstr);
    
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

  init_rook_attacks();
  init_bishop_attacks();

  find_magics(rook_attacks,   "R");
  find_magics(bishop_attacks, "B");

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

