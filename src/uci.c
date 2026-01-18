/*{{{  uci*/

/*{{{  uci_tokens*/

static int uci_tokens(int num_tokens, char **tokens) {

  if (num_tokens == 0)
    return 0;

  if (strlen(tokens[0]) == 0)
    return 0;

  const char *cmd = tokens[0];
  const char *sub = tokens[num_tokens > 1 ? 1 : 0];

  if (!strcmp(cmd, "isready")) {
    /*{{{  isready*/
    
    uci_send("readyok\n");
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "position") || !strcmp(cmd, "p")) {
    /*{{{  position*/
    
    if (!tt) {
      uci_send("info run a ucinewgame command or setoption name Hash value 16 (etc) command first\n");
      return 0;
    }
    
    /*{{{  get pointer to moves and number of moves*/
    
    char **moves_pointer = NULL;
    int num_moves        = 0;
    int moves_index      = find_token("moves", num_tokens, tokens);
    
    if (moves_index != -1)
      num_moves = num_tokens - (moves_index + 1);
    
    if (num_moves > 0)
      moves_pointer = &tokens[moves_index + 1];
    
    else
      num_moves = 0;
    
    /*}}}*/
    
    if (!strcmp(sub, "startpos") || !strcmp(sub, "s"))
    
      position(&ss[0], "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", "w", "KQkq", "-", num_moves, moves_pointer);
    
    else if (!strcmp(sub, "fen") || !strcmp(sub, "f"))
    
      position(&ss[0], tokens[2], tokens[3], tokens[4], tokens[5], num_moves, moves_pointer);
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "go") || !strcmp(cmd, "g")) {
    /*{{{  go*/
    
    if (!tt) {
      uci_send("info run a ucinewgame command or setoption name Hash value 16 (etc) command first\n");
      return 0;
    }
    
    if (ss[0].pos.hash == 0) {
      uci_send("info run a position startpos (etc) command first\n");
      return 0;
    }
    
    int64_t wtime = 0;
    int64_t winc = 0;
    int64_t btime = 0;
    int64_t binc = 0;
    int64_t max_nodes = 0;
    int64_t move_time = 0;
    int max_depth = 0;
    int moves_to_go = 0;
    
    /*{{{  get the go params*/
    
    int t = 1;
    
    while (t < num_tokens - 1) {
    
      const char *token = tokens[t];
    
      if (!strcmp(token, "wtime")) {
        t++;
        wtime = atoi(tokens[t]);
      }
      else if (!strcmp(token, "winc")) {
        t++;
        winc = atoi(tokens[t]);
      }
      else if (!strcmp(token, "btime")) {
        t++;
        btime = atoi(tokens[t]);
      }
      else if (!strcmp(token, "binc")) {
        t++;
        binc = atoi(tokens[t]);
      }
      else if (!strcmp(token, "depth") || !strcmp(token, "d")) {
        t++;
        max_depth = atoi(tokens[t]);
      }
      else if (!strcmp(token, "nodes") || !strcmp(token, "n")) {
        t++;
        max_nodes = atoi(tokens[t]);
      }
      else if (!strcmp(token, "movetime") || !strcmp(token, "m")) {
        t++;
        move_time = atoi(tokens[t]);
      }
      else if (!strcmp(token, "movestogo")) {
        t++;
        moves_to_go = atoi(tokens[t]);
      }
    
      t++;
    
    }
    
    if (num_tokens == 2 && !strcmp(tokens[1], "infinite")) {
      max_depth = MAX_PLY;
    }
    
    /*}}}*/
    
    tc_init(wtime, winc, btime, binc, max_nodes, move_time, max_depth, moves_to_go);

    atomic_store(&tc.finished, 0);

#ifdef __EMSCRIPTEN__
    go();
#else
    join_search_if_running();

    if (pthread_create(&search_thread, NULL, go_thread_fn, NULL) == 0) {
      atomic_store(&search_running, 1);
    }
    else {
      go();
    }
#endif

    /*}}}*/
  }
  else if (!strcmp(cmd, "stop")) {
    /*{{{  stop*/

#ifndef __EMSCRIPTEN__
    atomic_store(&tc.finished, 1);
    join_search_if_running();
    tc.finished = 1;
#endif

    /*}}}*/
  }
  else if (!strcmp(cmd, "ucinewgame") || !strcmp(cmd, "u")) {
    /*{{{  ucinewgame*/
    
    ucinewgame();
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "uci")) {
    /*{{{  uci*/
    
    uci_send("id name Lozza %s\n", VERSION);
    uci_send("id author Colin Jenkins\n");
    uci_send("option name Hash type spin default %d min 1 max 1024\n", TT_DEFAULT);
    uci_send("uciok\n");
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "setoption")) {
    /*{{{  setoption*/
    
    if (!strcmp(tokens[2], "Hash")) {
    
      init_tt(atoi(tokens[4]));
    
    }
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "board") || !strcmp(cmd, "b")) {
    /*{{{  board*/
    
    print_board(&ss[0]);
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "hash") || !strcmp(cmd, "h")) {
    /*{{{  hash size*/
    
    const size_t mb = (tt_entries * sizeof(TT)) / (1024 * 2024);
    
    uci_send("%zu mb %zu slots %zu bytes/slot\n", mb, tt_entries, sizeof(TT));
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "eval") || !strcmp(cmd, "e")) {
    /*{{{  eval*/
    
    const int e = eval(&ss[0]);

    uci_send("%d\n", e);
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "net") || !strcmp(cmd, "n")) {
    /*{{{  net*/
    
    uci_send("(%d -> %d)x2 -> 1\n", NET_I_SIZE, NET_H1_SIZE);
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "build")) {
    /*{{{  build*/
    
    uci_send("%s\n", BUILD);
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "draw") || !strcmp(cmd, "d")) {
    /*{{{  draw*/
    
    uci_send("hmc %d num uci moves %d is draw %d\n", ss[0].pos.hmc, hh.num_uci_moves, is_draw(&ss[0].pos, 0));
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "perft") || !strcmp(cmd, "f")) {
    /*{{{  perft*/
    
    const int depth = atoi(sub);
    uint64_t start_ms = now_ms();
    uint64_t total_nodes = 0;
    
    uint64_t num_nodes = perft(0, depth);
    total_nodes += num_nodes;
    
    uint64_t end_ms     = now_ms();
    uint64_t elapsed_ms = end_ms - start_ms;
    uint64_t nps        = (total_nodes * 1000ULL) / (elapsed_ms ? elapsed_ms : 1);
    
    uci_send("time %" PRIu64 " nodes %" PRIu64 " nps %" PRIu64 "\n", elapsed_ms, total_nodes, nps);
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "bench") || !strcmp(cmd, "h")) {
    /*{{{  bench*/
    
    bench();
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "et")) {
    /*{{{  eval tests*/
    
    et();
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "pt")) {
    /*{{{  perft tests*/
    
    perft_tests();
    
    /*}}}*/
  }
  else if (!strcmp(cmd, "quit") || !strcmp(cmd, "q")) {
    /*{{{  quit*/

#ifndef __EMSCRIPTEN__
    atomic_store(&tc.finished, 1);
    join_search_if_running();
#endif

    return 1;

    /*}}}*/
  }
  else {
    uci_send("%s ?\n", cmd);
  }

  return 0;

}

/*}}}*/
/*{{{  uci_exec*/

static int uci_exec(char *line) {

  char *tokens[UCI_TOKENS];
  char *token;

  int num_tokens = 0;

  token = strtok(line, " \t\n");

  while (token != NULL && num_tokens < UCI_TOKENS) {

    tokens[num_tokens++] = token;
    token = strtok(NULL, " \r\t\n");

  }

  return uci_tokens(num_tokens, tokens);

}

/*}}}*/
/*{{{  uci_input (Emscripten)*/

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
int uci_input(const char *cmd) {
  char buf[UCI_LINE_LENGTH];
  strncpy(buf, cmd, sizeof(buf) - 1);
  buf[sizeof(buf) - 1] = '\0';
  return uci_exec(buf);
}
#endif

/*}}}*/
/*{{{  uci_loop*/

static void uci_loop(int argc, char **argv) {

#ifndef __EMSCRIPTEN__
  setvbuf(stdout, NULL, _IONBF, 0);
#endif

  // Process command line args and exit
  if (argc > 1) {
    for (int i=1; i < argc; i++) {
      if (uci_exec(argv[i]))
        return;
    }
    return;
  }

  // Interactive mode: read from stdin
#ifndef __EMSCRIPTEN__
  char chunk[UCI_LINE_LENGTH];

  while (fgets(chunk, sizeof(chunk), stdin) != NULL) {
    if (uci_exec(chunk))
      return;
  }
#endif

}

/*}}}*/

/*}}}*/