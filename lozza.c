
/*{{{  includes*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <ctype.h>

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

/*}}}*/
/*{{{  globals*/

typedef struct {

  uint64_t wpawns, wknights, wbishops, wrooks, wqueens, wkings;
  uint64_t bpawns, bknights, bbishops, brooks, bqueens, bkings;
  uint64_t white, black, occupied;

  uint8_t stm;
  uint8_t rights;
  uint8_t ep;
  uint8_t hmc;

} Position;

typedef struct {

  Position pos;

} Ply;

int ply = 0;

Ply ss[MAX_PLY];

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

/*{{{  main*/

int main(int argc, char **argv) {

  uci_loop(argc, argv);

  return 0;

}

/*}}}*/

