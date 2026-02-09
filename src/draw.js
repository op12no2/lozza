const g_loHH = new Int32Array(1024);
const g_hiHH = new Int32Array(1024);
let g_hhNext = 0;
let g_hmClock = 0;

function isDraw() {

  // 50-move rule

  if (g_hmClock >= 100)
    return 1;

  // 2-fold repetition

  const lo = g_loHash;
  const hi = g_hiHash;
  const stop = g_hhNext - g_hmClock;
  for (let i = g_hhNext - 2; i >= 0 && i >= stop; i -= 2) {
    if (g_loHH[i] === lo && g_hiHH[i] === hi)
      return 1;
  }

  // insufficient material

  const b  = g_board;
  const pl = g_pieces;
  const nw = pl[0];
  const nb = pl[17];
  const total = nw + nb;

  // KvK
  if (total === 2)
    return 1;

  // KvK+minor
  if (total === 3) {
    const sq = nw === 2 ? pl[2] : pl[19];
    const pt = b[sq] & 7;
    if (pt === KNIGHT || pt === BISHOP)
      return 1;
  }

  if (total === 4) {
    // KNvKN, KBvKB (same colour bishops), KNNvK
    if (nw === 2 && nb === 2) {
      const wpt = b[pl[2]] & 7;
      const bpt = b[pl[19]] & 7;
      if (wpt === KNIGHT && bpt === KNIGHT)
        return 1;
      if (wpt === BISHOP && bpt === BISHOP) {
        const wsq = pl[2];
        const bsq = pl[19];
        if (((wsq ^ (wsq >> 4)) & 1) === ((bsq ^ (bsq >> 4)) & 1))
          return 1;
      }
    }
    // KNNvK
    if (nw === 1 || nb === 1) {
      const base = nw === 3 ? 0 : 17;
      const pt1 = b[pl[base + 2]] & 7;
      const pt2 = b[pl[base + 3]] & 7;
      if (pt1 === KNIGHT && pt2 === KNIGHT)
        return 1;
    }
  }

  return 0;

}

function drawTests() {

  let fails = 0;
  let count = 0;

  function check(id, got, expect) {
    count++;
    if (got !== expect) {
      fails++;
      uciSend(id + ' *** FAIL *** got ' + got + ' expected ' + expect);
    }
    else {
      uciSend(id + ' ok');
    }
  }

  const sp = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  const kk = '4k3/8/8/8/8/8/8/4K3';

  // 2-fold repetition: Nf3 Nf6 Ng1 Ng8 returns to startpos
  position(sp, 'w', 'KQkq', '-', ['g1f3', 'g8f6', 'f3g1', 'f6g8']);
  check('rep-2fold', isDraw(), 1);

  // half the cycle is not a repetition
  position(sp, 'w', 'KQkq', '-', ['g1f3', 'g8f6']);
  check('rep-none', isDraw(), 0);

  // pawn move breaks repetition chain
  position(sp, 'w', 'KQkq', '-', ['g1f3', 'g8f6', 'e2e4', 'f6g8', 'f3g1']);
  check('rep-pawn-breaks', isDraw(), 0);

  // capture breaks repetition chain
  position(sp, 'w', 'KQkq', '-', ['e2e4', 'd7d5', 'e4d5', 'd8d5', 'g1f3', 'd5d8', 'f3g1']);
  check('rep-cap-breaks', isDraw(), 0);

  // double repetition (3 occurrences of the position)
  position(sp, 'w', 'KQkq', '-',
    ['g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1', 'f6g8']);
  check('rep-3fold', isDraw(), 1);

  // rook shuffle repetition in KRvKR
  position('4k3/8/8/8/8/8/8/R3K3', 'w', '-', '-',
    ['a1b1', 'e8d8', 'b1a1', 'd8e8']);
  check('rep-rook-shuffle', isDraw(), 1);

  // hmClock counts non-pawn non-capture moves
  position(sp, 'w', 'KQkq', '-', ['g1f3', 'g8f6', 'f3g1', 'f6g8']);
  check('hmclock-4', g_hmClock, 4);

  // hmClock resets on pawn move
  position(sp, 'w', 'KQkq', '-', ['g1f3', 'g8f6', 'e2e4']);
  check('hmclock-pawn', g_hmClock, 0);

  // hmClock resets on capture
  position(sp, 'w', 'KQkq', '-', ['e2e4', 'd7d5', 'e4d5']);
  check('hmclock-cap', g_hmClock, 0);

  // hmClock increments after capture reset
  position(sp, 'w', 'KQkq', '-', ['e2e4', 'd7d5', 'e4d5', 'g8f6', 'g1f3']);
  check('hmclock-after-cap', g_hmClock, 2);

  // 50-move rule at exactly 100 half-moves
  const kr = '4k3/8/8/8/8/8/8/R3K2R';
  position(kr, 'w', '-', '-');
  g_hmClock = 100;
  check('50move-100', isDraw(), 1);

  // 50-move rule at 99 is not yet a draw
  position(kr, 'w', '-', '-');
  g_hmClock = 99;
  check('50move-99', isDraw(), 0);

  // position() resets hhNext and hmClock
  position(sp, 'w', 'KQkq', '-', ['g1f3', 'g8f6']);
  position(sp, 'w', 'KQkq', '-');
  check('reset-hhNext', g_hhNext, 0);
  check('reset-hmClock', g_hmClock, 0);

  // no draw at startpos
  position(sp, 'w', 'KQkq', '-');
  check('startpos-no-draw', isDraw(), 0);

  // material draws
  position(kk, 'w', '-', '-');
  check('mat-KvK', isDraw(), 1);

  position('4k3/8/8/8/8/8/8/4K1N1', 'w', '-', '-');
  check('mat-KNvK', isDraw(), 1);

  position('4k3/8/8/8/8/8/8/4K1B1', 'w', '-', '-');
  check('mat-KBvK', isDraw(), 1);

  position('4k3/8/8/8/8/8/8/4K1R1', 'w', '-', '-');
  check('mat-KRvK-no', isDraw(), 0);

  uciSend('');
  uciSend(count + ' draw tests, ' + fails + ' fails');

}

