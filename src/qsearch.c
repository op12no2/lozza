#include <string.h>
#include "types.h"
#include "builtins.h"
#include "nodes.h"
#include "pos.h"
#include "evaluate.h"
#include "qsearch.h"
#include "makemove.h"
#include "timecontrol.h"
#include "iterate.h"
#include "move.h"
#include "net.h"
#include "tt.h"

int qsearch(const int ply, int alpha, const int beta) {

  Node *node = &nodes[ply];
  const Position *pos = &node->pos;

  if (ply >= MAX_PLY-1) {
    return net_eval(node);
  }

  const int stm = pos->stm;
  const int opp = stm ^ 1;
  const int stm_king_idx = piece_index(KING, stm);
  const int in_check = 0; //hackis_attacked(pos, bsf(pos->all[stm_king_idx]), opp);

  int stand_pat = net_eval(node);

  if (in_check == 0) {
    if (stand_pat >= beta) {
      return beta;
    }
    if (stand_pat > alpha) {
      alpha = stand_pat;
    }
  }

  TimeControl *tc = &time_control;
  tc->nodes++;
  if ((tc->nodes & 1023) == 0) {
    check_tc();
    if (tc->finished)
      return 0;
  }

  Node *next_node = &nodes[ply + 1];
  Position *next_pos = &next_node->pos;
  move_t move;
  int score;
  int best_score = in_check ? -INF : stand_pat;
  int num_legal_moves = 0;
  const uint64_t *next_stm_king_ptr = &next_pos->all[stm_king_idx];
  
  init_next_qsearch_move(node, in_check, 0);

  while ((move = get_next_qsearch_move(node))) {

    pos_copy(pos, next_pos);
    memcpy(next_node->accs, node->accs, sizeof(node->accs));
    make_move(next_node, move);
    if (is_attacked(next_pos, bsf(*next_stm_king_ptr), opp))
      continue;

    num_legal_moves++;

    score = -qsearch(ply+1, -beta, -alpha);

    if (tc->finished)
      return 0;

    if (score > best_score) {
      best_score = score;
      if (score > alpha) {
        alpha = score;
        if (score >= beta) {
          return score;
        }
      }
    }
  }

  if (in_check && num_legal_moves == 0) {
    return -MATE + ply;
  }

  return best_score;

}
