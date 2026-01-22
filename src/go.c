#include <stdio.h>
#include "timecontrol.h"
#include"search.h"
#include "go.h"

void go(void) {

  TimeControl *tc = &time_control;

  char bm_str[6];

  int alpha = 0;
  int beta = 0;
  int score = 0;

  for (int depth=1; depth <= tc->max_depth; depth++) {

    alpha = -INF;
    beta  = INF;
    
    score = search(0, depth, alpha, beta);
    
    printf("info depth %d score %d\n", depth, score);

    if (tc->finished)
      break;

  }

  format_move(tc->best_move, bm_str);
  printf("bestmove %s\n", bm_str);

}
