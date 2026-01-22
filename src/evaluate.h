#ifndef EVALUATE_H
#define EVALUATE_H

#include <stdint.h>
#include "position.h"
#include "types.h"

// Tunable piece weights (pawn fixed at 100)
typedef struct {
  int knight;
  int bishop;
  int rook;
  int queen;
} Weights;

// Global weights used by evaluate()
extern Weights weights;

// Initialize weights to default values
void init_weights(void);

// Evaluate position from white's perspective (centipawns)
int16_t evaluate(const Position *pos);

// Evaluate relative to side to move (for search)
static inline int16_t evaluate_stm(const Position *pos) {
  int16_t score = evaluate(pos);
  return pos->stm == WHITE ? score : -score;
}

// Get material count difference (white - black) for each piece type
// Used by tuner to compute gradients
void get_material_features(const Position *pos, int *pawn_diff, int *knight_diff, int *bishop_diff, int *rook_diff, int *queen_diff);

#endif
