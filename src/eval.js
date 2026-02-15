function evaluate() {

  netSlowRebuild();
  return netEval();

}

function evalTests() {

  let sum = 0;

  for (let i = 0; i < BENCHFENS.length; i++) {

    const fen = BENCHFENS[i];
    uciExecLine('position fen ' + fen);
    const ev = evaluate();
    sum += ev;
    uciSend(ev + ' ' + fen);

  }

  uciSend('sum ' + sum);

}

