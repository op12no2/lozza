#ifndef PV_H
#define PV_H

#include "nodes.h"

inline void collect_pv(Node *const this_node, const Node *const next_node, const move_t move) {

  memcpy(this_node->pv, next_node->pv, (size_t)next_node->pv_len * sizeof(move_t));

  this_node->pv_len                  = next_node->pv_len;
  this_node->pv[this_node->pv_len++] = move;

}

#endif
