#ifndef NODES_H
#define NODES_H

#include "types.h"
#include "position.h"
#include "move.h"

#define MAX_PLY 64
#define MAX_MOVES 256

typedef struct {

  Position pos;
  move_t moves[MAX_MOVES];
  int num_moves;
  int16_t ranks[MAX_MOVES];
  int next_move;
  int in_check;
  move_t tt_move;
  int stage;

} Node;

extern Node nodes[MAX_PLY];

void position(Node *node, const char *board_fen, const char *stm_str, const char *rights_str, const char *ep_str, int num_uci_moves, char **uci_moves);

#endif
