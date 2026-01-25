#ifndef POS_H
#define POS_H

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
  uint64_t hash;

} Position;

static inline void pos_copy(const Position *const from_pos, Position *const to_pos) {
  *to_pos = *from_pos;
}

void print_board(const Position *pos);
int is_attacked(const Position *pos, const int sq, const int opp);
int is_mat_draw(const Position *pos);

#endif