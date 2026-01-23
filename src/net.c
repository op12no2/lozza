#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include "net.h"
#include "weights.h"

static int32_t net_h1_w[NET_I_SIZE * NET_H1_SIZE];
static int32_t net_h2_w[NET_I_SIZE * NET_H1_SIZE];  // flipped
static int32_t net_h1_b[NET_H1_SIZE];
static int32_t net_o_w [NET_H1_SIZE * 2];
static int32_t net_o_b;
static int32_t acc1[NET_H1_SIZE];  // us acc
static int32_t acc2[NET_H1_SIZE];  // them acc

static inline int32_t sqrelu(const int32_t x) {
  const int32_t y = x & ~(x >> 31);
  return y * y;
}

static int flip_index(const int index) {

  int piece  = index / (64 * NET_H1_SIZE);
  int square = (index / NET_H1_SIZE) % 64;
  int h      = index % NET_H1_SIZE;

  square ^= 56;
  piece = (piece + 6) % 12;

  return ((piece * 64) + square) * NET_H1_SIZE + h;

}

static int get_embedded_weights(int16_t **out, size_t *count_out) {

  size_t bytes = (size_t)lozza_weights_len;

  if (bytes % sizeof(int16_t) != 0)
    return 0;

  int16_t *buf = (int16_t*)malloc(bytes);
  if (!buf)
    return 0;

  memcpy(buf, lozza_weights, bytes);

  *out = buf;
  *count_out = bytes / sizeof(int16_t);

  return 1;

}

int init_weights(void) {

  int16_t *weights = NULL;
  size_t n = 0;

  if (!get_embedded_weights(&weights, &n)) {
    free(weights);
    fprintf(stderr, "cannot load embedded weights\n");
    return 1;
  }

  size_t offset = 0;

  for (int i=0; i < NET_I_SIZE * NET_H1_SIZE; i++) {
    net_h1_w[i]             = (int32_t)weights[i];  // us
    net_h2_w[flip_index(i)] = (int32_t)weights[i];  // them
  }

  offset += NET_I_SIZE * NET_H1_SIZE;
  for (int i=0; i < NET_H1_SIZE; i++) {
    net_h1_b[i] = (int32_t)weights[offset+i];
  }

  offset += NET_H1_SIZE;
  for (int i=0; i < NET_H1_SIZE * 2; i++) {
    net_o_w[i] = (int32_t)weights[offset+i];
  }

  offset += NET_H1_SIZE * 2;
  net_o_b = (int32_t)weights[offset];

  free(weights);

  return 0;

}

static void net_slow_rebuild_accs(Node *node) {

  memcpy(acc1, net_h1_b, sizeof net_h1_b);
  memcpy(acc2, net_h1_b, sizeof net_h1_b);

  for (int sq=0; sq < 64; sq++) {

    const int piece = node->pos.board[sq];

    if (piece == EMPTY)
      continue;

    for (int h=0; h < NET_H1_SIZE; h++) {
      const int idx1 = (piece * 64 + sq) * NET_H1_SIZE + h;
      acc1[h] += net_h1_w[idx1];
      acc2[h] += net_h2_w[idx1];
    }
  }

}

int net_eval(Node *node) {

  net_slow_rebuild_accs(node);

  const int stm = node->pos.stm;

  const int32_t *a1 = (stm == 0 ? acc1 : acc2);
  const int32_t *a2 = (stm == 0 ? acc2 : acc1);

  const int32_t *w1 = &net_o_w[0];
  const int32_t *w2 = &net_o_w[NET_H1_SIZE];

  int32_t acc = 0;

  for (int i=0; i < NET_H1_SIZE; i++) {  // autovec eval
    acc += w1[i] * sqrelu(a1[i]) + w2[i] * sqrelu(a2[i]);
  }

  acc /= NET_QA;
  acc += net_o_b;
  acc *= NET_SCALE;
  acc /= NET_QAB;

  return (int)acc;

}
