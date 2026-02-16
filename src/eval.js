function evaluate(node) {

  return netEval(node);

}

function evalTests() {

  let sum = 0;

  for (let i = 0; i < BENCHFENS.length; i++) {

    const fen = BENCHFENS[i];
    uciExecLine('position fen ' + fen);
    const ev = evaluate(rootNode);
    sum += ev;
    uciSend(ev + ' ' + fen);

  }

  uciSend('sum ' + sum);

}

