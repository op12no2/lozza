#ifndef HISTORY_H
#define HISTORY_H

#include "types.h"
#include "pos.h"
#include "move.h"

#define MAX_HISTORY 32766
#define KILLER 32767

extern int16_t piece_to_history[12][64];

inline void clear_piece_to_history(void);
void update_piece_to_history(const Position *pos, const move_t move, int bonus);

#endif