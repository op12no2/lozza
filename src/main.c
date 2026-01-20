#include <stdio.h>
#include <string.h>
#include <time.h>
#include "uci.h"
#include "bitboard.h"

#define INPUT_BUFFER_SIZE 8192

int main(void) {

  setbuf(stdin, NULL);
  setbuf(stdout, NULL);

  char input[INPUT_BUFFER_SIZE];

  clock_t start = clock();
  init_attacks();
  clock_t end = clock();
  double ms = (double)(end - start) / CLOCKS_PER_SEC * 1000.0;
  printf("init_attacks: %.2f ms\n", ms);

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
