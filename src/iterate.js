function removeTTMove(node) {

  const ttMov = node.ttMov;

  if (ttMov === 0)
    return;

  const moves = node.moves;
  const n = node.numMoves;

  for (let i = 0; i < n; i++) {
    if (moves[i] == ttMov) {
      moves[i] = moves[n - 1];
      node.numMoves--;
      return;
    }
  }

}

function getNextSortedMove(node) {

  const moves = node.moves;
  const ranks = node.ranks;
  const next = node.nextMove;
  const num = node.numMoves;
  let maxR = INT32_MIN;
  let maxI = 0;
  let maxM = 0;

  for (let i=next; i < num; i++) {
    if (ranks[i] > maxR) {
      maxR = ranks[i];
      maxI = i;
    }
  }

  maxM = moves[maxI];

  moves[maxI] = moves[next];
  ranks[maxI] = ranks[next];

  node.nextMove++;

  return maxM;

}

/*
void rank_quiets(Node *node) {

  const uint8_t *board = node->pos.board;
  const move_t *moves = node->moves;
  int16_t *ranks = node->ranks;
  const int n = node->num_moves;

  for (let i=0; i < n; i++) {

    const move_t m = moves[i];
    const int from = (m >> 6) & 0x3F;
    const int to = m & 0x3F;
    const int piece = board[from];

    ranks[i] = piece_to_history[piece][to];

  }
}

void rank_captures(Node *node) {

  const uint8_t *board = node->pos.board;
  const move_t *moves = node->moves;
  int16_t *ranks = node->ranks;
  const int n = node->num_moves;

  for (let i=0; i < n; i++) {

    const move_t m = moves[i];
    const int from = (m >> 6) & 0x3F;
    const int to = m & 0x3F;
    const int attacker = board[from] % 6;
    int victim = board[to];

    if (victim == EMPTY)  // ep
      victim = 0;
    else
      victim %= 6;

    ranks[i] = (victim << 3) | (5 - attacker);

  }
}

*/

function initNextSearchMove(node, inCheck, ttMov) {

  node.stage = 0;
  node.inCheck = inCheck;
  node.ttMov = ttMov;

}

function getNextSearchMove(node) {

  switch (node.stage) {

    case 0: {

      node.stage++;

      if (node.ttMov) {
        return node.ttMov;
      }

    }

    case 1: {

      node.stage++;
      node.nextMove = 0;
      node.numMoves = 0;
      genNoisy(node);
      removeTTMove(node);
      //rank_captures(node);

    }

    case 2: {

      if (node.nextMove < node.numMoves) {
        return getNextSortedMove(node);
      }

      node.stage++;

    }

    case 3: {

      node.stage++;
      node.nextMove = 0;
      node.numMoves = 0;
      genQuiets(node);
      if (!node.inCheck)
        genCastling(node);
      removeTTMove(node);
      //rank_quiets(node);

    }

    case 4: {

      if (node.nextMove < node.numMoves) {
        return getNextSortedMove(node);
      }

      return 0;

    }

    default:
      return 0;

  }
}

function initNextNoisyMove(node, ttMov) {

  node.stage = 0;
  node.ttMov = ttMov;

}

function getNextNoisyMove(node) {

  switch (node.stage) {

    case 0: {

      node.stage++;

      if (node.ttMov) {
        return node.ttMov;
      }

    }

    case 1: {

      node.stage++;
      node.nextMove = 0;
      node.numMoves = 0;
      genNoisy(node);
      removeTTMove(node);

    }

    case 2: {

      if (node.nextMove < node.numMoves) {
        return getNextSortedMove(node);
      }

      return 0;

    }

    default:
      return 0;

  }
}

