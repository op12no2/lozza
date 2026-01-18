
#include "types.c"
#include "utils.c"
#include "tc.c"
#include "tt.c"
#include "net.c"
#include "history.c"
#include "magics.c"
#include "movegen.c"
#include "iterate.c"
#include "make.c"
#include "debug.c"
#include "board.c"
#include "search.c"
#include "thread.c"
#include "perft.c"
#include "init.c"
#include "uci.c"

/*{{{  main*/

int main(int argc, char **argv) {

  if (init_once()) {
    return 1;
  }

  uci_loop(argc, argv);

  free(tt);

  return 0;

}

/*}}}*/
