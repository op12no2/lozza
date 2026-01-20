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

} Node;

extern Node nodes[MAX_PLY];

#endif
