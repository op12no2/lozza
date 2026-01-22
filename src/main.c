#include <stdio.h>
#include <string.h>
#include <time.h>
#include "uci.h"
#include "bitboard.h"
#include "nodes.h"
#include "evaluate.h"

#define INPUT_BUFFER_SIZE 8192

int main(int argc, char *argv[]) {

  setbuf(stdin, NULL);
  setbuf(stdout, NULL);

  //clock_t start = clock();
  init_attacks();
  init_weights();
  //clock_t end = clock();
  //double ms = (double)(end - start) / CLOCKS_PER_SEC * 1000.0;
  //printf("init_attacks: %.2f ms\n", ms);

  // If command-line arguments provided, execute them and exit
  if (argc > 1) {
    for (int i = 1; i < argc; i++) {
      if (!uci_exec(argv[i])) {
        break;
      }
    }
    return 0;
  }

  // Otherwise run interactive loop
  char input[INPUT_BUFFER_SIZE];

  while (fgets(input, sizeof(input), stdin)) {

    size_t len = strlen(input);
    if (len > 0 && input[len - 1] == '\n') {
      input[len - 1] = '\0';
    }

    if (!uci_exec(input)) {
      break;
    }
  }

  return 0;

}
