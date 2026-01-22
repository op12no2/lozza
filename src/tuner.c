#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <ctype.h>
#include "tuner.h"
#include "evaluate.h"
#include "types.h"
#include "builtins.h"
#include "weights.h"

#define MAX_POSITIONS 10000000
#define MAX_LINE_LEN 256

// Sigmoid scaling constant (typical Texel value)
static double K = 1.13;

// Parse a single line from training data
// Format: "FEN [result]" where result is 0.0, 0.5, or 1.0
// Returns 1 on success, 0 on failure
// Modify this function to support different data formats
static int parse_tune_line(const char *line, TunePos *tp) {

  // Find the result in brackets at the end
  const char *bracket = strrchr(line, '[');
  if (!bracket)
    return 0;

  // Parse result
  float result;
  if (sscanf(bracket, "[%f]", &result) != 1)
    return 0;

  // Extract FEN (everything before the bracket, trimmed)
  int fen_len = bracket - line;
  while (fen_len > 0 && isspace(line[fen_len - 1]))
    fen_len--;

  if (fen_len <= 0)
    return 0;

  char fen[MAX_LINE_LEN];
  strncpy(fen, line, fen_len);
  fen[fen_len] = '\0';

  // Parse FEN into position
  // FEN format: board stm rights ep halfmove fullmove
  char board[128], stm[8], rights[8], ep[8];
  int hmc, fmc;

  int parsed = sscanf(fen, "%s %s %s %s %d %d", board, stm, rights, ep, &hmc, &fmc);
  if (parsed < 4)
    return 0;

  // Build position manually (similar to nodes.c position())
  static const int char_to_piece[128] = {
    ['p'] = 0, ['n'] = 1, ['b'] = 2, ['r'] = 3, ['q'] = 4, ['k'] = 5,
  };

  Position *pos = &tp->pos;
  memset(pos, 0, sizeof(Position));

  for (int i = 0; i < 64; i++)
    pos->board[i] = EMPTY;

  int sq = 56;
  for (const char *p = board; *p; ++p) {
    if (*p == '/') {
      sq -= 16;
    }
    else if (isdigit(*p)) {
      sq += *p - '0';
    }
    else {
      int colour = !!islower(*p);
      int piece  = char_to_piece[tolower(*p)];
      int index  = piece_index(piece, colour);

      uint64_t bb = 1ULL << sq;

      pos->all[index] |= bb;
      pos->occupied |= bb;
      pos->colour[colour] |= bb;
      pos->board[sq] = index;

      sq++;
    }
  }

  pos->stm = (stm[0] == 'w') ? WHITE : BLACK;

  pos->rights = 0;
  for (const char *p = rights; *p && *p != '-'; ++p) {
    switch (*p) {
      case 'K': pos->rights |= WHITE_RIGHTS_KING;  break;
      case 'Q': pos->rights |= WHITE_RIGHTS_QUEEN; break;
      case 'k': pos->rights |= BLACK_RIGHTS_KING;  break;
      case 'q': pos->rights |= BLACK_RIGHTS_QUEEN; break;
    }
  }

  pos->ep = 0;
  if (ep[0] != '-') {
    int file = ep[0] - 'a';
    int rank = ep[1] - '1';
    pos->ep = rank * 8 + file;
  }

  tp->result = result;
  return 1;

}

// Sigmoid function
static double sigmoid(double x) {
  return 1.0 / (1.0 + exp(-x));
}

// Floating point weights for tuning
static double w_knight, w_bishop, w_rook, w_queen;

// Compute eval using float weights (for tuning)
static double compute_eval_tune(const Position *pos) {
  int pawn_diff, knight_diff, bishop_diff, rook_diff, queen_diff;
  get_material_features(pos, &pawn_diff, &knight_diff, &bishop_diff, &rook_diff, &queen_diff);

  return W_PAWN * pawn_diff
       + w_knight * knight_diff
       + w_bishop * bishop_diff
       + w_rook   * rook_diff
       + w_queen  * queen_diff;
}

// Compute MSE over all positions (using float weights)
static double compute_mse(TunePos *positions, int count) {

  double total_error = 0.0;

  for (int i = 0; i < count; i++) {
    double eval = compute_eval_tune(&positions[i].pos);
    double predicted = sigmoid(K * eval / 400.0);  // Scale to pawn units
    double error = predicted - positions[i].result;
    total_error += error * error;
  }

  return total_error / count;

}

// Find optimal K value that minimizes MSE
static void tune_k(TunePos *positions, int count) {

  printf("Tuning K...\n");

  double best_k = K;
  double best_mse = compute_mse(positions, count);

  // Coarse search: 0.1 to 3.0 in steps of 0.1
  for (double test_k = 0.1; test_k <= 3.0; test_k += 0.1) {
    K = test_k;
    double mse = compute_mse(positions, count);
    if (mse < best_mse) {
      best_mse = mse;
      best_k = test_k;
    }
  }

  // Fine search: best_k ± 0.1 in steps of 0.01
  for (double test_k = best_k - 0.1; test_k <= best_k + 0.1; test_k += 0.01) {
    if (test_k <= 0) continue;
    K = test_k;
    double mse = compute_mse(positions, count);
    if (mse < best_mse) {
      best_mse = mse;
      best_k = test_k;
    }
  }

  K = best_k;
  printf("Optimal K = %.2f (MSE = %.6f)\n", K, best_mse);

}

// Main tuning function
void tune(const char *filename, int epochs, double lr) {

  printf("Loading positions from %s...\n", filename);

  FILE *f = fopen(filename, "r");
  if (!f) {
    printf("Error: cannot open %s\n", filename);
    return;
  }

  // Allocate positions array
  TunePos *positions = malloc(MAX_POSITIONS * sizeof(TunePos));
  if (!positions) {
    printf("Error: cannot allocate memory for positions\n");
    fclose(f);
    return;
  }

  // Load positions
  char line[MAX_LINE_LEN];
  int count = 0;

  while (fgets(line, sizeof(line), f) && count < MAX_POSITIONS) {
    if (parse_tune_line(line, &positions[count])) {
      count++;
    }
  }

  fclose(f);
  printf("Loaded %d positions\n", count);

  if (count == 0) {
    printf("Error: no valid positions found\n");
    free(positions);
    return;
  }

  // Initialize float weights from current engine weights
  init_weights();
  w_knight = weights.knight;
  w_bishop = weights.bishop;
  w_rook   = weights.rook;
  w_queen  = weights.queen;

  printf("Initial weights: N=%.1f B=%.1f R=%.1f Q=%.1f\n",
         w_knight, w_bishop, w_rook, w_queen);

  // Auto-tune K for current weight scale
  tune_k(positions, count);

  double prev_mse = compute_mse(positions, count);
  printf("Initial MSE: %.6f\n", prev_mse);
  printf("Learning rate = %.1f\n", lr);
  printf("Running %d epochs...\n\n", epochs);

  // Gradient descent loop
  for (int epoch = 0; epoch < epochs; epoch++) {

    // Compute gradients
    double grad_knight = 0.0;
    double grad_bishop = 0.0;
    double grad_rook   = 0.0;
    double grad_queen  = 0.0;

    for (int i = 0; i < count; i++) {

      Position *pos = &positions[i].pos;
      double result = positions[i].result;

      // Get features
      int pawn_diff, knight_diff, bishop_diff, rook_diff, queen_diff;
      get_material_features(pos, &pawn_diff, &knight_diff, &bishop_diff, &rook_diff, &queen_diff);

      // Compute prediction
      double eval = compute_eval_tune(pos);
      double sig_input = K * eval / 400.0;
      double sig = sigmoid(sig_input);

      // Gradient of MSE: 2 * (sig - result) * sig * (1 - sig) * K/400 * feature
      double common = 2.0 * (sig - result) * sig * (1.0 - sig) * K / 400.0;

      grad_knight += common * knight_diff;
      grad_bishop += common * bishop_diff;
      grad_rook   += common * rook_diff;
      grad_queen  += common * queen_diff;

    }

    // Update weights (averaged gradient, large lr)
    grad_knight /= count;
    grad_bishop /= count;
    grad_rook   /= count;
    grad_queen  /= count;

    w_knight -= lr * grad_knight;
    w_bishop -= lr * grad_bishop;
    w_rook   -= lr * grad_rook;
    w_queen  -= lr * grad_queen;

    // Progress report
    double mse = compute_mse(positions, count);
    printf("Epoch %4d: MSE=%.6f  N=%.1f B=%.1f R=%.1f Q=%.1f%s\n",
           epoch + 1, mse, w_knight, w_bishop, w_rook, w_queen,
           mse > prev_mse ? " *" : "");
    prev_mse = mse;

  }

  // Copy tuned weights to global weights
  weights.knight = (int)(w_knight + 0.5);
  weights.bishop = (int)(w_bishop + 0.5);
  weights.rook   = (int)(w_rook + 0.5);
  weights.queen  = (int)(w_queen + 0.5);

  printf("\nFinal weights: N=%.1f B=%.1f R=%.1f Q=%.1f\n",
         w_knight, w_bishop, w_rook, w_queen);
  printf("Rounded:       N=%d B=%d R=%d Q=%d\n",
         weights.knight, weights.bishop, weights.rook, weights.queen);
  printf("Final MSE: %.6f\n", compute_mse(positions, count));

  // Write tuned weights to file
  FILE *out = fopen("src/tuned_weights.h", "w");
  if (out) {
    fprintf(out, "#ifndef TUNED_WEIGHTS_H\n");
    fprintf(out, "#define TUNED_WEIGHTS_H\n\n");
    fprintf(out, "// Tuned weights - copy to weights.h to use\n\n");
    fprintf(out, "#define W_KNIGHT %d\n", weights.knight);
    fprintf(out, "#define W_BISHOP %d\n", weights.bishop);
    fprintf(out, "#define W_ROOK   %d\n", weights.rook);
    fprintf(out, "#define W_QUEEN  %d\n", weights.queen);
    fprintf(out, "\n#endif\n");
    fclose(out);
    printf("\nWrote tuned weights to src/tuned_weights.h\n");
  }

  free(positions);

}
