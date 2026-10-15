function formatMove (move) {

  let moveStr = '0000';  // UCI null move

  if (move !== 0) {

    const fr = (move & MOVE_FR_MASK) >>> MOVE_FR_BITS;
    const to = (move & MOVE_TO_MASK) >>> MOVE_TO_BITS;

    moveStr = COORDS[fr] + COORDS[to];

    if ((move & MOVE_PROMOTE_MASK) !== 0)
      moveStr = moveStr + PROMOTES[(move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS];

  }

  return moveStr;

}
