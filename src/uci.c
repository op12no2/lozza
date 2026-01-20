#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>
#include "types.h"
#include "uci.h"
#include "nodes.h"
#include "position.h"
#include "perft.h"

#define MAX_TOKENS 1024

static bool str_eq(const char *a, const char *b) {
  return strcmp(a, b) == 0;
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

  if (str_eq(cmd, "uci")) {
    printf("id name Lozza %s\n", VERSION);
    printf("id author Colin Jenkins\n");
    printf("uciok\n");
  }
  
  else if (str_eq(cmd, "isready")) {
    printf("readyok\n");
  }
  
  else if (str_eq(cmd, "ucinewgame") || str_eq(cmd, "u")) {
  }
  
  else if (str_eq(cmd, "position") || str_eq(cmd, "p")) {
    const char *fen_option = tokens[1];
    if (str_eq(fen_option, "startpos") || str_eq(fen_option, "s")) {
      position(&nodes[0].pos, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", "w", "KQkq", "-", 0, NULL);
    }
  }
  
  else if (str_eq(cmd, "go") || str_eq(cmd, "g")) {
  }
  
  else if (str_eq(cmd, "stop")) {
  }
  
  else if (str_eq(cmd, "quit") || str_eq(cmd, "q")) {
    return false;
  }
  
  else if (str_eq(cmd, "board") || str_eq(cmd, "b")) {
    print_board(&nodes[0].pos);
  }
  
  else if (str_eq(cmd, "eval") || str_eq(cmd, "e")) {
  }
  
  else if (str_eq(cmd, "perft") || str_eq(cmd, "f")) {
    int depth = (ntokens > 1) ? atoi(tokens[1]) : 1;
    clock_t start = clock();
    uint64_t num_nodes = perft(depth, 0);
    clock_t end = clock();
    double secs = (double)(end - start) / CLOCKS_PER_SEC;
    uint64_t nps = secs > 0 ? (uint64_t)(num_nodes / secs) : 0;
    printf("perft %d: %lu (%.3fs, %lu nps)\n", depth, num_nodes, secs, nps);
  }

  else if (str_eq(cmd, "pt")) {
    int max_depth = (ntokens > 1) ? atoi(tokens[1]) : 0;
    perft_tests(max_depth);
  }

  else {
    printf("unknown command: %s\n", cmd);
  }

  return true;

}
