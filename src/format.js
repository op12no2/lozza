function formatBoard (turn) {

  const pieces = '.PNBRQKx.pnbrqk';
  var s = '';

  s += '  +---+---+---+---+---+---+---+---+\n';

  for (var i=0; i < 8; i++) {
    s += (8 - i) + ' ';
    for (var j=0; j < 8; j++) {
      var obj = bdB[B88[i*8 + j]];
      s += '| ' + pieces[obj] + ' ';
    }
    s += '|\n';
    s += '  +---+---+---+---+---+---+---+---+\n';
  }

  s += '    a   b   c   d   e   f   g   h\n\n';

  s += 'stm: ' + (turn === WHITE ? 'white' : 'black');

  var rights = '';
  if (bdRights & WHITE_RIGHTS_KING)  rights += 'K';
  if (bdRights & WHITE_RIGHTS_QUEEN) rights += 'Q';
  if (bdRights & BLACK_RIGHTS_KING)  rights += 'k';
  if (bdRights & BLACK_RIGHTS_QUEEN) rights += 'q';
  if (!rights) rights = '-';

  s += '  rights: ' + rights;
  s += '  ep: ' + (bdEp ? COORDS[bdEp] : '-');

  return s;
}

function formatMove (move) {

  let moveStr = 'NULL';

  if (move !== 0) {

    const fr = (move & MOVE_FR_MASK) >>> MOVE_FR_BITS;
    const to = (move & MOVE_TO_MASK) >>> MOVE_TO_BITS;

    moveStr = COORDS[fr] + COORDS[to];

    if ((move & MOVE_PROMOTE_MASK) !== 0)
      moveStr = moveStr + PROMOTES[(move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS];

  }

  return moveStr;

}

