#ifndef NET_H
#define NET_H

#include "nodes.h"

int init_weights(void);
int net_eval(Node *node);

inline int net_base(const int piece, const int sq) {
  return (((piece << 6) | sq) * NET_H1_SIZE);
}

#endif
