function formatFen (turn) {

  var fen = '';
  var n   = 0;

  for (var i=0; i < 8; i++) {
    for (var j=0; j < 8; j++) {
      var sq  = B88[i*8 + j]
      var obj = bdB[sq];
      if (obj === 0)
        n++;
      else {
        if (n) {
          fen += '' + n;
          n = 0;
        }
        fen += UMAP[obj];
      }
    }
    if (n) {
      fen += '' + n;
      n = 0;
    }
    if (i < 7)
      fen += '/';
  }

  if (turn === WHITE)
    fen += ' w';
  else
    fen += ' b';

  if (bdRights) {
    fen += ' ';
    if (bdRights & WHITE_RIGHTS_KING)
      fen += 'K';
    if (bdRights & WHITE_RIGHTS_QUEEN)
      fen += 'Q';
    if (bdRights & BLACK_RIGHTS_KING)
      fen += 'k';
    if (bdRights & BLACK_RIGHTS_QUEEN)
      fen += 'q';
  }
  else
    fen += ' -';

  if (bdEp)
    fen += ' ' + COORDS[bdEp];
  else
    fen += ' -';

  fen += ' 0 1';

  return fen;

}

// formatMove

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

// flipFen
//
// flipFen is slow. Only use for init/test.
//

function flipFen (fen) {

  const [board, color, castling, enPassant, halfmove, fullmove] = fen.split(' ');

  const mirroredBoard = board.split('/').reverse().map(row => {
    return row.split('').map(char => {
      if (char === char.toUpperCase()) {
        return char.toLowerCase();
      } else if (char === char.toLowerCase()) {
        return char.toUpperCase();
      }
      return char;
    }).join('');
  }).join('/');

  const mirroredColor = color === 'w' ? 'b' : 'w';

  const mirrorCastling = castling.split('').map(right => {
    switch(right) {
      case 'K': return 'k';
      case 'Q': return 'q';
      case 'k': return 'K';
      case 'q': return 'Q';
      default: return right;
    }
  }).join('');

  const mirroredEnPassant = enPassant === '-' ? '-' :
    enPassant[0] + (9 - parseInt(enPassant[1]));

  const newFen = [
    mirroredBoard,
    mirroredColor,
    mirrorCastling || '-',
    mirroredEnPassant,
    halfmove,
    fullmove
  ].join(' ');

  return newFen;
};

