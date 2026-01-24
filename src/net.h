#ifndef NET_H
#define NET_H

#include "nodes.h"

#define NET_H1_SIZE 384
#define NET_I_SIZE 768
#define NET_QA 255
#define NET_QB 64
#define NET_QAB (NET_QA * NET_QB)
#define NET_SCALE 400

int init_weights(void);
int net_eval(Node *node);

inline int net_base(const int piece, const int sq) {
  return (((piece << 6) | sq) * NET_H1_SIZE);
}

#endif
