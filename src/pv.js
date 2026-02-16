function collectPV(node, move) {

  const cNode = node.childNode;

  node.pv.set(cNode.pv.subarray(0, cNode.pvLen), 0);

  node.pvLen            = cNode.pvLen;
  node.pv[node.pvLen++] = move;

}

function report (units, value, depth) {

  let pvStr = 'pv';
  for (let i=rootNode.pvLen-1; i >= 0; i--)
    pvStr += ' ' + formatMove(rootNode.pv[i]);

  const tim     = now() - statsStartTime;
  const nps     = (statsNodes * 1000) / tim | 0;
  const nodeStr = 'nodes ' + statsNodes + ' time ' + tim + ' nps ' + nps;

  const depthStr = 'depth ' + depth + ' seldepth ' + statsSelDepth;
  const scoreStr = 'score ' + units + ' ' + value;
  const hashStr  = 'hashfull ' + (1000 * ttHashUsed / ttSize | 0);

  uciSend('info', depthStr, scoreStr, nodeStr, hashStr, pvStr);

}

function reportMultiPV (depth) {

  const tim     = now() - statsStartTime;
  const nps     = (statsNodes * 1000) / tim | 0;
  const nodeStr = 'nodes ' + statsNodes + ' time ' + tim + ' nps ' + nps;

  const depthStr = 'depth ' + depth + ' seldepth ' + statsSelDepth;
  const hashStr  = 'hashfull ' + (1000 * ttHashUsed / ttSize | 0);

  const n = Math.min(multiPV, multiPVMoves.length);

  for (let i = 0; i < n; i++) {

    const entry = multiPVMoves[i];

    let pvStr = 'pv';
    for (let j = entry.pvLen - 1; j >= 0; j--)
      pvStr += ' ' + formatMove(entry.pv[j]);

    let scoreStr;
    if (Math.abs(entry.score) > MINMATE) {
      let mateScore = (MATE - Math.abs(entry.score)) / 2 | 0;
      if (entry.score < 0)
        mateScore = -mateScore;
      scoreStr = 'score mate ' + mateScore;
    }
    else {
      scoreStr = 'score cp ' + entry.score;
    }

    uciSend('info', depthStr, 'multipv', (i + 1), scoreStr, nodeStr, hashStr, pvStr);
  }
}

