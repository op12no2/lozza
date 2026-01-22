#include "evaluate.h"
#include "types.h"
#include "builtins.h"
#include "weights.h"

// Global weights
Weights weights;

void init_weights(void) {
  weights.knight = W_KNIGHT;
  weights.bishop = W_BISHOP;
  weights.rook   = W_ROOK;
  weights.queen  = W_QUEEN;
}

void get_material_features(const Position *pos, int *pawn_diff, int *knight_diff, int *bishop_diff, int *rook_diff, int *queen_diff) {

  *pawn_diff   = popcount(pos->all[WPAWN])   - popcount(pos->all[BPAWN]);
  *knight_diff = popcount(pos->all[WKNIGHT]) - popcount(pos->all[BKNIGHT]);
  *bishop_diff = popcount(pos->all[WBISHOP]) - popcount(pos->all[BBISHOP]);
  *rook_diff   = popcount(pos->all[WROOK])   - popcount(pos->all[BROOK]);
  *queen_diff  = popcount(pos->all[WQUEEN])  - popcount(pos->all[BQUEEN]);

}

int16_t evaluate(const Position *pos) {

  int pawn_diff, knight_diff, bishop_diff, rook_diff, queen_diff;
  get_material_features(pos, &pawn_diff, &knight_diff, &bishop_diff, &rook_diff, &queen_diff);

  int score = pawn_diff   * W_PAWN
            + knight_diff * weights.knight
            + bishop_diff * weights.bishop
            + rook_diff   * weights.rook
            + queen_diff  * weights.queen;

  return (int16_t)score;

}
