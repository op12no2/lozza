#include "zobrist.h"

static ALIGN64 uint64_t zob_pieces[12 * 64];
static ALIGN64 uint64_t zob_stm;
static ALIGN64 uint64_t zob_rights[16];
static ALIGN64 uint64_t zob_ep[64];
static uint64_t rand64_seed = 0xDEADBEEFCAFEBABEULL;

uint64_t rand64(void) {

  rand64_seed ^= rand64_seed >> 12;
  rand64_seed ^= rand64_seed << 25;
  rand64_seed ^= rand64_seed >> 27;

  return rand64_seed * 2685821657736338717ULL;

}
