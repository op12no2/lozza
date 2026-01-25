#include <string.h>
#include "types.h"
#include "builtins.h"
#include "nodes.h"
#include "pos.h"
#include "evaluate.h"
#include "search.h"
#include "makemove.h"
#include "timecontrol.h"
#include "iterate.h"
#include "move.h"
#include "qsearch.h"
#include "net.h"
#include "tt.h"
#include "hh.h"

int search(const int ply, int depth, int alpha, const int beta) {

  Node *node = &nodes[ply];
  const Position *pos = &node->pos;

  if (ply >= MAX_PLY-1) {
    return net_eval(node);
  }

  // store hash for repetition detection (ply 0 already in hh from position())
  if (ply > 0) {
    hh_store(ply, pos->hash);
    if (is_draw(ply, pos->hash, pos->hmc)) {
      return 0;
    }
  }

  const int stm = pos->stm;
  const int opp = stm ^ 1;
  const int stm_king_idx = piece_index(KING, stm);
  const int in_check = is_attacked(pos, bsf(pos->all[stm_king_idx]), opp);
  const int is_root = ply == 0;
  const int is_pv = is_root || (beta - alpha != 1);

  if (depth <= 0 && in_check == 0) {
    return qsearch(ply, alpha, beta);
  }
  if (depth < 0)
    depth = 0;

  TimeControl *tc = &time_control;
  tc->nodes++;
  if ((tc->nodes & 1023) == 0) {
    check_tc();
    if (tc->finished)
      return 0;
  }

  const TT *entry = tt_get(pos);
  if (!is_pv && entry && entry->depth >= depth) {
    const int tt_flags = entry->flags;
    const int tt_score = get_adjusted_score(ply, entry->score);
    if (tt_flags == TT_EXACT || (tt_flags == TT_BETA && tt_score >= beta) || (tt_flags == TT_ALPHA && tt_score <= alpha)) {
      return tt_score;
    }
  }

  Node *next_node = &nodes[ply + 1];
  Position *next_pos = &next_node->pos;
  move_t move = 0;
  move_t best_move = 0;
  int score = 0;
  int best_score = -INF;
  int num_legal_moves = 0;
  const uint64_t *next_stm_king_ptr = &next_pos->all[stm_king_idx];
  const int orig_alpha = alpha;

  init_next_search_move(node, in_check, 0);

  while ((move = get_next_search_move(node))) {

    pos_copy(pos, next_pos);
    memcpy(next_node->accs, node->accs, sizeof(node->accs));
    make_move(next_node, move);
    if (is_attacked(next_pos, bsf(*next_stm_king_ptr), opp))
      continue;

    num_legal_moves++;

    if (num_legal_moves == 1) {
      score = -search(ply+1, depth-1, -beta, -alpha);
    }
    else {
      score = -search(ply+1, depth-1, -alpha-1, -alpha);
      if (!tc->finished && score > alpha && score < beta) {
        score = -search(ply+1, depth-1, -beta, -alpha);
      }
    }

    if (tc->finished)
      return 0;

    if (score > best_score) {
      best_score = score;
      best_move = move;
      if (score > alpha) {
        alpha = score;
        if (is_root) {
          tc->best_move = best_move;
          tc->best_score = best_score;
        }
        if (score >= beta) {
          tt_put(pos, TT_BETA, depth, put_adjusted_score(ply, best_score), best_move);
          return score;
        }
      }
    }
  }

  if (num_legal_moves == 0) {
    return in_check ? (-MATE + ply) : 0;
  }

  tt_put(pos, (alpha > orig_alpha) ? TT_EXACT : TT_ALPHA, depth, put_adjusted_score(ply, best_score), best_move);

  return best_score;

}
