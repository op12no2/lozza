
/*{{{  includes*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <ctype.h>
#include <assert.h>

/*}}}*/
/*{{{  constants*/

#define MAX_PLY 128

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
/*{{{  Ply struct*/

typedef struct {

  Position pos;

} Ply;

/*}}}*/

int ply = 0;
Ply ss[MAX_PLY];

/*{{{  magics*/

typedef struct {

  uint64_t mask;
  uint64_t magic;
  int shift;
  uint64_t *attacks;

} Magic;

static Magic bishop_magics[64];

static uint64_t bishop_masks[64];
static Magic bishop_magics[64];
static uint64_t *bishop_attack_table[64];
static int bishop_attack_table_size[64];

static uint64_t rook_masks[64];
static Magic rook_magics[64];
static uint64_t *rook_attack_table[64];
static int rook_attack_table_size[64];

/*}}}*/

/*}}}*/

/*{{{  magics*/

/*{{{  rand64*/

static uint64_t rand64(void) {

  return ((uint64_t)rand() & 0xFFFF)
       ^ ((uint64_t)rand() & 0xFFFF) << 16
       ^ ((uint64_t)rand() & 0xFFFF) << 32
       ^ ((uint64_t)rand() & 0xFFFF) << 48;

}

/*}}}*/
/*{{{  popcount*/

static int popcount(uint64_t bb) {

  int count = 0;

  while (bb) {
    bb &= bb - 1;
    count++;
  }

  return count;

}

/*}}}*/
/*{{{  magic_index*/

static inline int magic_index(uint64_t blockers, uint64_t magic, int shift) {

  return (int)((blockers * magic) >> shift);

}

/*}}}*/
/*{{{  get_blocker_permutations*/

static uint64_t *get_blocker_permutations(uint64_t mask, int *out_count) {

  int bits[64];
  int num_bits = 0;

  // Extract indices of set bits in mask
  for (int sq = 0; sq < 64; sq++) {
    if (mask & (1ULL << sq)) {
      bits[num_bits++] = sq;
    }
  }

  int count = 1 << num_bits; // 2^n combinations
  uint64_t *result = malloc(sizeof(uint64_t) * count);
  assert(result != NULL);

  for (int i = 0; i < count; i++) {
    uint64_t blockers = 0;
    for (int j = 0; j < num_bits; j++) {
      if (i & (1 << j)) {
        blockers |= 1ULL << bits[j];
      }
    }
    result[i] = blockers;
  }

  if (out_count) {
    *out_count = count;
  }

  return result;

}

/*}}}*/

/*{{{  init_bishop_masks*/

static void init_bishop_masks(void) {

  for (int sq = 0; sq < 64; sq++) {

    int rank = sq / 8;
    int file = sq % 8;

    uint64_t mask = 0;

    for (int r = rank + 1, f = file + 1; r <= 6 && f <= 6; r++, f++)
      mask |= SET_MASK(r * 8 + f);

    for (int r = rank + 1, f = file - 1; r <= 6 && f >= 1; r++, f--)
      mask |= SET_MASK(r * 8 + f);

    for (int r = rank - 1, f = file - 1; r >= 1 && f >= 1; r--, f--)
      mask |= SET_MASK(r * 8 + f);

    for (int r = rank - 1, f = file + 1; r >= 1 && f <= 6; r--, f++)
      mask |= SET_MASK(r * 8 + f);

    bishop_masks[sq] = mask;

  }
}

/*}}}*/
/*{{{  bishop_attacks*/

static uint64_t bishop_attacks(int sq, uint64_t blockers) {

  int rank = sq / 8;
  int file = sq % 8;

  uint64_t attacks = 0;

  // ? NE
  for (int r = rank + 1, f = file + 1; r <= 7 && f <= 7; r++, f++) {
    int s = r * 8 + f;
    attacks |= 1ULL << s;
    if (blockers & (1ULL << s)) {
      break;
    }
  }

  // ? NW
  for (int r = rank + 1, f = file - 1; r <= 7 && f >= 0; r++, f--) {
    int s = r * 8 + f;
    attacks |= 1ULL << s;
    if (blockers & (1ULL << s)) {
      break;
    }
  }

  // ? SW
  for (int r = rank - 1, f = file - 1; r >= 0 && f >= 0; r--, f--) {
    int s = r * 8 + f;
    attacks |= 1ULL << s;
    if (blockers & (1ULL << s)) {
      break;
    }
  }

  // ? SE
  for (int r = rank - 1, f = file + 1; r >= 0 && f <= 7; r--, f++) {
    int s = r * 8 + f;
    attacks |= 1ULL << s;
    if (blockers & (1ULL << s)) {
      break;
    }
  }

  return attacks;

}

/*}}}*/
/*{{{  init_bishop_attack_table*/

static void init_bishop_attack_table(void) {

  for (int sq = 0; sq < 64; sq++) {

    uint64_t mask = bishop_masks[sq];
    int num_bits = popcount(mask);
    int count = 1 << num_bits;

    bishop_attack_table_size[sq] = count;
    bishop_attack_table[sq] = malloc(sizeof(uint64_t) * count);

    uint64_t *blockers = get_blocker_permutations(mask, NULL);

    for (int i = 0; i < count; i++) {
      bishop_attack_table[sq][i] = bishop_attacks(sq, blockers[i]);
    }

    free(blockers);
  }

}

/*}}}*/
/*{{{  find_bishop_magic*/

static uint64_t find_bishop_magic(int sq) {

  uint64_t mask = bishop_masks[sq];
  int shift = 64 - popcount(mask);
  int table_size = 1 << popcount(mask);

  uint64_t *blockers = get_blocker_permutations(mask, NULL);
  uint64_t *attacks  = bishop_attack_table[sq];

  uint64_t *used = malloc(sizeof(uint64_t) * table_size);
  assert(used != NULL);

  for (;;) {

    uint64_t magic = rand64() & rand64() & rand64(); // sparse candidate

    memset(used, 0xFF, sizeof(uint64_t) * table_size);

    int fail = 0;

    for (int i = 0; i < table_size; i++) {
      int index = magic_index(blockers[i], magic, shift);
      if (used[index] == ~0ULL) {
        used[index] = attacks[i];
      }
      else if (used[index] != attacks[i]) {
        fail = 1;
        break;
      }
    }

    if (!fail) {
      free(used);
      printf("B sq %2d: success shift=%2d magic=0x%016llx\n", sq, shift, (unsigned long long)magic);
      return magic;
    }
  }

}

/*}}}*/
/*{{{  init_bishop_magics*/

static void init_bishop_magics(void) {

  for (int sq = 0; sq < 64; sq++) {

    bishop_magics[sq].mask    = bishop_masks[sq];
    bishop_magics[sq].shift   = 64 - popcount(bishop_masks[sq]);
    bishop_magics[sq].attacks = bishop_attack_table[sq];
    bishop_magics[sq].magic   = find_bishop_magic(sq);

  }
}

/*}}}*/

/*{{{  init_rook_masks*/

static void init_rook_masks(void) {

  for (int sq = 0; sq < 64; sq++) {

    int rank = sq / 8;
    int file = sq % 8;

    uint64_t mask = 0;

    for (int f = file + 1; f <= 6; f++)
      mask |= SET_MASK(rank * 8 + f);

    for (int f = file - 1; f >= 1; f--)
      mask |= SET_MASK(rank * 8 + f);

    for (int r = rank + 1; r <= 6; r++)
      mask |= SET_MASK(r * 8 + file);

    for (int r = rank - 1; r >= 1; r--)
      mask |= SET_MASK(r * 8 + file);

    rook_masks[sq] = mask;

  }
}

/*}}}*/
/*{{{  rook_attacks*/

static uint64_t rook_attacks(int sq, uint64_t blockers) {

  int rank = sq / 8;
  int file = sq % 8;

  uint64_t attacks = 0;

  // North
  for (int r = rank + 1; r <= 7; r++) {
    int s = r * 8 + file;
    attacks |= 1ULL << s;
    if (blockers & (1ULL << s)) {
      break;
    }
  }

  // South
  for (int r = rank - 1; r >= 0; r--) {
    int s = r * 8 + file;
    attacks |= 1ULL << s;
    if (blockers & (1ULL << s)) {
      break;
    }
  }

  // East
  for (int f = file + 1; f <= 7; f++) {
    int s = rank * 8 + f;
    attacks |= 1ULL << s;
    if (blockers & (1ULL << s)) {
      break;
    }
  }

  // West
  for (int f = file - 1; f >= 0; f--) {
    int s = rank * 8 + f;
    attacks |= 1ULL << s;
    if (blockers & (1ULL << s)) {
      break;
    }
  }

  return attacks;

}

/*}}}*/
/*{{{  init_rook_attack_table*/

static void init_rook_attack_table(void) {

  for (int sq = 0; sq < 64; sq++) {

    uint64_t mask = rook_masks[sq];
    int num_bits = popcount(mask);
    int count = 1 << num_bits;

    rook_attack_table_size[sq] = count;
    rook_attack_table[sq] = malloc(sizeof(uint64_t) * count);

    uint64_t *blockers = get_blocker_permutations(mask, NULL);

    for (int i = 0; i < count; i++) {
      uint64_t b = blockers[i];
      rook_attack_table[sq][i] = rook_attacks(sq, b);
    }

    free(blockers);
  }

}

/*}}}*/
/*{{{  find_rook_magic*/

static uint64_t find_rook_magic(int sq) {

  uint64_t mask = rook_masks[sq];
  int shift = 64 - popcount(mask);
  int table_size = 1 << popcount(mask);

  uint64_t *blockers = get_blocker_permutations(mask, NULL);
  uint64_t *attacks  = rook_attack_table[sq];

  uint64_t *used = malloc(sizeof(uint64_t) * table_size);
  assert(used != NULL);

  for (;;) {

    uint64_t magic = rand64() & rand64() & rand64(); // filter down to sparse bits

    memset(used, 0xFF, sizeof(uint64_t) * table_size); // use 0xFF to catch reuse

    int fail = 0;

    for (int i = 0; i < table_size; i++) {

      int index = magic_index(blockers[i], magic, shift);

      if (used[index] == ~0ULL) {
        used[index] = attacks[i];
      }
      else if (used[index] != attacks[i]) {
        fail = 1;
        break;
      }
    }

    if (!fail) {
      free(used);
      printf("sq %2d: success shift=%2d magic=0x%016llx\n", sq, shift, (unsigned long long)magic);
      return magic;
    }
  }

}

/*}}}*/
/*{{{  init_rook_magics*/

static void init_rook_magics(void) {

  for (int sq = 0; sq < 64; sq++) {

    rook_magics[sq].mask    = rook_masks[sq];
    rook_magics[sq].shift   = 64 - popcount(rook_masks[sq]);
    rook_magics[sq].attacks = rook_attack_table[sq];
    rook_magics[sq].magic   = find_rook_magic(sq);

  }
}

/*}}}*/

/*}}}*/

/*{{{  position*/

static void position(const char *board_fen, const char *stm_str, const char *rights_str, const char *ep_str) {

  ply = 0;

  Position *pos = &ss[ply].pos;

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
/*{{{  print_bitboard*/

static void print_bitboard(uint64_t bb) {

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

/*{{{  uci_tokens*/

static int uci_tokens(int n, char **tokens) {

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
    
      position("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", "w", "KQkq", "-");
    
      //if (n > 2 && !strcmp(tokens[2],"moves")) {
        //for (int i=3; i < n; i++)
          //playMove(tokens[i]);
      //}
    }
    
    else if (!strcmp(sub, "fen") || !strcmp(sub, "f") ) {
    
      position(tokens[2], tokens[3], tokens[4], tokens[5]);
    
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

  srand(0x4C6F7A7A);

  init_bishop_masks();
  init_bishop_attack_table();
  init_bishop_magics();

  init_rook_masks();
  init_rook_attack_table();
  init_rook_magics();

}

/*}}}*/

/*{{{  main*/

int main(int argc, char **argv) {

  init_once();
  uci_loop(argc, argv);

  return 0;

}

/*}}}*/

