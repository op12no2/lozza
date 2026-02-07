const qpth = Array(15); // quiet piece to history

function updateQpth(move, bonus) {

  const to = move & 0x7F;
  const fr = (move >> 7) & 0x7F;
  const piece = g_board[fr];

  qpth[piece][to] += bonus;

}

function initQpth () {

    for (let i=0; i < 15; i++) {
      qpth[i] = new Int32Array(128)
    }

}

function clearQpth () {

    for (let i=0; i < 15; i++) {
      qpth[i].fill(0);
    }

}

