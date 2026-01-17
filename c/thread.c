/*}}}*/
/*{{{  threads*/

static pthread_t search_thread;
static _Atomic int search_running = 0;

static void *go_thread_fn(void *arg) {
  (void)arg;
  go();
  atomic_store(&search_running, 0);
  return NULL;
}

static void join_search_if_running(void) {
  if (atomic_load(&search_running)) {
    atomic_store(&tc.finished, 1);
    pthread_join(search_thread, NULL);
    atomic_store(&search_running, 0);
  }
}

/*}}}*/