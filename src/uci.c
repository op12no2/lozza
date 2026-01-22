#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>
#include "types.h"
#include "uci.h"
#include "nodes.h"
#include "position.h"
#include "perft.h"
#include "timecontrol.h"
#include "go.h"
#include "tuner.h"
#include "evaluate.h"

#define MAX_TOKENS 1024

static bool str_eq(const char *a, const char *b, const char *c) {
  return (strcmp(a, b) == 0) || (strcmp(a, c) == 0);
}

static int tokenize(char *input, char *tokens[], int max_tokens) {
  int count = 0;
  char *token = strtok(input, " \t");
  while (token && count < max_tokens) {
    tokens[count++] = token;
    token = strtok(NULL, " \t");
  }
  return count;
}

bool uci_exec(char *input) {

  char *tokens[MAX_TOKENS];
  int ntokens = tokenize(input, tokens, MAX_TOKENS);

  if (ntokens == 0)
    return true;

  const char *cmd = tokens[0];

  if (str_eq(cmd, "uci", "")) {
    printf("id name Lozza %s\n", VERSION);
    printf("id author Colin Jenkins\n");
    printf("uciok\n");
  }
  
  else if (str_eq(cmd, "isready", "")) {
    printf("readyok\n");
  }
  
  else if (str_eq(cmd, "ucinewgame", "u")){
  }
  
  else if (str_eq(cmd, "position", "p")) {
    
    const char *fen_option = tokens[1];
    if (str_eq(fen_option, "startpos", "s")) {
      position(&nodes[0], "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", "w", "KQkq", "-", 0, NULL);
    }
    else if (str_eq(fen_option, "fen", "f")) {
      int num_moves = 0;
      char **moves_ptr = NULL;
      if (ntokens > 9) {
        num_moves = ntokens - 9;
        moves_ptr = &tokens[9];
      }
      position(&nodes[0], tokens[2], tokens[3], tokens[4], tokens[5], num_moves, moves_ptr);
    }
  }
  
  else if (str_eq(cmd, "go", "g")) {
    
    int64_t wtime = 0;
    int64_t winc = 0;
    int64_t btime = 0;
    int64_t binc = 0;
    int64_t max_nodes = 0;
    int64_t move_time = 0;
    int max_depth = 0;
    int moves_to_go = 0;
    
    int t = 1;
    
    while (t < ntokens) {

      const char *token = tokens[t];

      if (str_eq(token, "wtime", "") && t + 1 < ntokens) {
        t++;
        wtime = atoi(tokens[t]);
      }
      else if (str_eq(token, "winc", "") && t + 1 < ntokens) {
        t++;
        winc = atoi(tokens[t]);
      }
      else if (str_eq(token, "btime", "") && t + 1 < ntokens) {
        t++;
        btime = atoi(tokens[t]);
      }
      else if (str_eq(token, "binc", "") && t + 1 < ntokens) {
        t++;
        binc = atoi(tokens[t]);
      }
      else if (str_eq(token, "depth", "d") && t + 1 < ntokens) {
        t++;
        max_depth = atoi(tokens[t]);
      }
      else if (str_eq(token, "infinite", "i")) {
        max_depth = MAX_PLY;
      }
      else if (str_eq(token, "nodes", "n") && t + 1 < ntokens) {
        t++;
        max_nodes = atoi(tokens[t]);
      }
      else if (str_eq(token, "movetime", "m") && t + 1 < ntokens) {
        t++;
        move_time = atoi(tokens[t]);
      }
      else if (str_eq(token, "movestogo", "") && t + 1 < ntokens) {
        t++;
        moves_to_go = atoi(tokens[t]);
      }

      t++;

    }
    
    init_tc(wtime, winc, btime, binc, max_nodes, move_time, max_depth, moves_to_go);
    go();
  }
  
  else if (str_eq(cmd, "stop", "")) {
  }
  
  else if (str_eq(cmd, "quit", "q")) {
    return false;
  }
  
  else if (str_eq(cmd, "board", "b")) {
    print_board(&nodes[0].pos);
  }
  
  else if (str_eq(cmd, "eval", "e")) {
    int16_t score = evaluate(&nodes[0].pos);
    printf("eval: %d cp (white POV)\n", score);
  }
  
  else if (str_eq(cmd, "perft", "f")) {
    int depth = (ntokens > 1) ? atoi(tokens[1]) : 1;
    clock_t start = clock();
    uint64_t num_nodes = perft(depth, 0);
    clock_t end = clock();
    double secs = (double)(end - start) / CLOCKS_PER_SEC;
    uint64_t nps = secs > 0 ? (uint64_t)(num_nodes / secs) : 0;
    printf("perft %d: %lu (%.3fs, %lu nps)\n", depth, num_nodes, secs, nps);
  }

  else if (str_eq(cmd, "pt", "")) {
    int max_depth = (ntokens > 1) ? atoi(tokens[1]) : 0;
    perft_tests(max_depth);
  }

  else if (str_eq(cmd, "tune", "t")) {
    // tune <filename> [epochs] [learning_rate]
    if (ntokens < 2) {
      printf("usage: tune <filename> [epochs] [learning_rate]\n");
      printf("  epochs default: 100\n");
      printf("  learning_rate default: 10000\n");
    }
    else {
      const char *filename = tokens[1];
      int epochs = (ntokens > 2) ? atoi(tokens[2]) : 100;
      double lr = (ntokens > 3) ? atof(tokens[3]) : 10000.0;
      tune(filename, epochs, lr);
    }
  }

  else {
    printf("unknown command: %s\n", cmd);
  }

  return true;

}
