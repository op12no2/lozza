#include <stdint.h>
#include "iterate.h"
#include "move.h"
#include "nodes.h"
#include "pos.h"
#include "movegen.h"

static move_t get_next_sorted_move(Node *const node) {

  move_t max_m  = 0;
  move_t *moves = node->moves;
  int16_t *ranks = node->ranks;
  const int next = node->next_move;
  const int num = node->num_moves;
  int16_t max_r = INT16_MIN;
  int max_i;

  for (int i=next; i < num; i++) {
    if (ranks[i] > max_r) {
      max_r = ranks[i];
      max_i = i;
    }
  }

  max_m = moves[max_i];

  moves[max_i] = moves[next];
  ranks[max_i] = ranks[next];

  node->next_move++;

  return max_m;

}

static void rank_captures(Node *node) {

  const int num_moves = node->num_moves;
  int16_t *r = node->ranks;

  for (int i=0; i < num_moves; i++) {
    r[i] = i; // stub
  }
}

static void rank_quiets(Node *node) {

  const int num_moves = node->num_moves;
  int16_t *r = node->ranks;

  for (int i=0; i < num_moves; i++) {
    r[i] = i; // stub
  }
}

void init_next_search_move(Node *node, const int in_check, const move_t tt_move) {

  node->stage = 0;
  node->in_check = in_check;
  node->tt_move = tt_move;

}

move_t get_next_search_move(Node *node) {

  switch (node->stage) {

    case 0: {
      
      node->stage++;
      node->num_moves = 0;
      node->next_move = 0;
      
      if (node->tt_move)
        return node->tt_move;
      
    }

    /* fall through */

    case 1: {
      
      node->stage++;
      node->num_moves = 0;
      node->next_move = 0;
      
      gen_captures(node);
      rank_captures(node);

    }

    /* fall through */

    case 2: {
      
      if (node->next_move < node->num_moves) {
      
        return get_next_sorted_move(node);
      
      }
      
      node->stage++;
      node->num_moves = 0;
      node->next_move = 0;
      
      gen_quiets(node);
      rank_quiets(node);
      
    }

    /* fall through */

    case 3: {
      
      if (node->next_move < node->num_moves) {
      
        return get_next_sorted_move(node);
      
      }
      
      return 0;
      
    }

    default:
      return 0;

  }
}

void init_next_qsearch_move(Node *node, const int in_check, const move_t tt_move) {

  node->stage = 0;
  node->in_check = in_check; 
  node->tt_move = tt_move;

}

move_t get_next_qsearch_move(Node *node) {

  switch (node->stage) {

    case 0: {
      
      node->stage++;
      node->num_moves = 0;
      node->next_move = 0;
      
      if (node->tt_move)
        return node->tt_move;
      
    }

    /* fall through */

    case 1: {
      
      node->stage++;
      node->num_moves = 0;
      node->next_move = 0;
      
      gen_captures(node);
      rank_captures(node);
      
    }

    /* fall through */

    case 2: {
      
      if (node->next_move < node->num_moves) {
      
        return get_next_sorted_move(node);
      
      }
      
      return 0;
      
    }

    default:
      return 0;

  }
}
