#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include "types.h"
#include "bitboard.h"
#include "position.h"

void position(Position *pos, const char *board_fen, const char *stm_str, const char *rights_str, const char *ep_str, int num_uci_moves, char **uci_moves) {

  static const int char_to_piece[128] = {
    ['p'] = 0, ['n'] = 1, ['b'] = 2, ['r'] = 3, ['q'] = 4, ['k'] = 5,
  };

  memset(pos, 0, sizeof(Position));

  // board
  
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
      int piece  = char_to_piece[tolower(*p)];  // 0-5
      int index  = piece_index(piece, colour);  // 0-11
  
      uint64_t bb = 1ULL << sq;
  
      pos->all[index] |= bb;
      pos->occupied |= bb;
      pos->colour[colour] |= bb;
  
      pos->board[sq] = index;
  
      sq++;
  
    }
  }
  
  // stm
  
  pos->stm = (stm_str[0] == 'w') ? WHITE : BLACK;
  
  // rights
  
  pos->rights = 0;
  
  for (const char *p = rights_str; *p; ++p) {
    switch (*p) {
      case 'K': pos->rights |= WHITE_RIGHTS_KING;  break;
      case 'Q': pos->rights |= WHITE_RIGHTS_QUEEN; break;
      case 'k': pos->rights |= BLACK_RIGHTS_KING;  break;
      case 'q': pos->rights |= BLACK_RIGHTS_QUEEN; break;
    }
  }
  
  // ep
  
  if (ep_str[0] != '-') {
  
    int file = ep_str[0] - 'a';
    int rank = ep_str[1] - '1';
  
    pos->ep = rank * 8 + file;
  
  }
}

void position_fen(Position *pos, const char *fen) {

  static char buf[256];
  strncpy(buf, fen, sizeof(buf) - 1);
  buf[sizeof(buf) - 1] = '\0';

  char *board_fen = strtok(buf, " ");
  char *stm_str = strtok(NULL, " ");
  char *rights_str = strtok(NULL, " ");
  char *ep_str = strtok(NULL, " ");

  position(pos, board_fen, stm_str, rights_str, ep_str, 0, NULL);

}

void print_board(const Position *pos) {

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

  printf("\n   a b c d e f g h\n\n");
  printf("stm=%d\n", pos->stm);
  printf("rights=%d\n", pos->rights);
  printf("ep=%d\n", pos->ep);

}

int is_attacked(const Position *pos, const int sq, const int opp) {

  const uint64_t *all = pos->all;
  const int base = colour_index(opp);

  if (all[base+KNIGHT] & knight_attacks[sq])    
    return 1;
  if (all[base+PAWN]   & pawn_attacks[opp][sq]) 
    return 1;
  if (all[base+KING]   & king_attacks[sq])      
    return 1;

  const uint64_t occ = pos->occupied;
  const uint64_t all_q = all[base+QUEEN];

  {
    const uint64_t attackers  = all[base+ROOK] | all_q;
    const Attack *a = &rook_attacks[sq];
    const uint64_t blockers = occ & a->mask;
    const uint64_t attacks  = a->attacks[magic_index(blockers, a->magic, a->shift)];
    if (attacks & attackers) 
      return 1;
  }

  {
    const uint64_t attackers  = all[base+BISHOP] | all_q;
    const Attack *a = &bishop_attacks[sq];
    const uint64_t blockers = occ & a->mask;
    const uint64_t attacks = a->attacks[magic_index(blockers, a->magic, a->shift)];
    if (attacks & attackers) 
      return 1;
  }

  return 0;

}
