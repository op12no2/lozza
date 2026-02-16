function perft (node, depth, turn) {

  if (depth === 0)
    return 1;

  const nextTurn = turn ^ COLOR_MASK;
  const inCheck  = isKingAttacked(nextTurn);

  let totalNodes = 0;
  let move       = 0;

  node.inCheck = inCheck;

  node.rights = bdRights;
  node.ep     = bdEp;

  genMoves(node, turn);

  while ((move = getNextMove(node)) !== 0) {

    makeMoveA(node, move);

    // legal?
    
    if ((move & MOVE_LEGAL_MASK) === 0 && isKingAttacked(nextTurn) !== 0) {
    
      unmakeMove(node, move);
    
      bdRights = node.rights;
      bdEp     = node.ep;
    
      continue;
    
    }
    

    totalNodes += perft(node.childNode, depth-1, nextTurn);

    // unmake move
    
    unmakeMove(node, move);
    
    bdRights = node.rights;
    bdEp     = node.ep;
    

  }

  return totalNodes;

}

