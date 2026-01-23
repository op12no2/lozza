#include <stdio.h>
#include "timecontrol.h"
#include"search.h"
#include "go.h"

void go(void) {

  char bm_str[6];
  TimeControl *tc = &time_control;
  int alpha = 0;
  int beta = 0;

  for (int depth=1; depth <= tc->max_depth; depth++) {

    const move_t bm = tc->best_move;

    alpha = -INF;
    beta  = INF;
    
    const int score = search(0, depth, alpha, beta);
    
    printf("info depth %d score %d\n", depth, score);

    if (tc->finished) {
      if (bm)
        tc->best_move = bm; // use bm from last com,pleted depth
      break;
    }

  }

  format_move(tc->best_move, bm_str);
  printf("bestmove %s\n", bm_str);

}
