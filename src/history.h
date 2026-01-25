#ifndef HISTORY_H
#define HISTORY_H

#include <stdint.h>

#define MAX_HISTORY 1024

void history_reset(void);
void history_push(uint64_t hash);
void history_set_root(void);
void history_store(int search_ply, uint64_t hash);
int is_draw(int search_ply, uint64_t hash, int hmc);

#endif
