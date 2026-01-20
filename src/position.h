#ifndef POSITION_H
#define POSITION_H

#include <stdint.h>

#define EMPTY 255

#define WHITE_RIGHTS_KING  1
#define WHITE_RIGHTS_QUEEN 2
#define BLACK_RIGHTS_KING  4
#define BLACK_RIGHTS_QUEEN 8
#define ALL_RIGHTS         15

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

static inline void pos_copy(const Position *const from_pos, Position *const to_pos) {

  *to_pos = *from_pos;

}

void position(Position *pos, const char *board_fen, const char *stm_str, const char *rights_str, const char *ep_str, int num_uci_moves, char **uci_moves);
void position_fen(Position *pos, const char *fen);
void print_board(const Position *pos);
int is_attacked(const Position *pos, const int sq, const int opp);

#endif