#ifndef ZOBRIST_H
#define ZOBRIST_H

#include <stdint.h>

uint64_t rand64(void);

static ALIGN64 uint64_t zob_pieces[12 * 64];
static ALIGN64 uint64_t zob_stm;
static ALIGN64 uint64_t zob_rights[16];
static ALIGN64 uint64_t zob_ep[64];

#endif
