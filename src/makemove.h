#ifndef MAKEMOVE_H
#define MAKEMOVE_H

#include "nodes.h"
#include "move.h"

void make_move(Position *pos, const move_t move);
void play_move(Node *node, char *uci_move);

#endif
