const objHistory = new Uint32Array(15 * 256);

function addHistory (bonus, move) {

  const frObj = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;
  const to    = (move & MOVE_TO_MASK)    >>> MOVE_TO_BITS;

  objHistory[(frObj << 8) + to] += bonus;

}

