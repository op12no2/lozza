#ifndef TUNER_H
#define TUNER_H

#include "position.h"

// Training position: position + game result
typedef struct {
  Position pos;
  float result;  // 1.0 = white win, 0.5 = draw, 0.0 = black win
} TunePos;

// Run the tuner
// filename: path to training data file
// epochs: number of gradient descent iterations
// lr: learning rate
void tune(const char *filename, int epochs, double lr);

#endif
