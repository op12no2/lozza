function collectPV(node, move) {

  const cNode = node.childNode;
  const src   = cNode.pv;
  const dst   = node.pv;
  const len   = cNode.pvLen;

  for (let i = 0; i < len; i++)
    dst[i] = src[i];

  dst[len]   = move;
  node.pvLen = len + 1;

}

function report (score, depth, bound) {

  let pvStr = 'pv';
  for (let i=rootNode.pvLen-1; i >= 0; i--)
    pvStr += ' ' + formatMove(rootNode.pv[i]);

  const tim     = now() - statsStartTime;
  const nps     = (statsNodes * 1000) / tim | 0;
  const nodeStr = 'nodes ' + statsNodes + ' time ' + tim + ' nps ' + nps;

  const depthStr = 'depth ' + depth + ' seldepth ' + statsSelDepth;

  let scoreStr;
  if (Math.abs(score) > MINMATE) {
    let mateScore = (MATE - Math.abs(score)) / 2 | 0;
    if (score < 0)
      mateScore = -mateScore;
    scoreStr = 'score mate ' + mateScore;
  }
  else {
    scoreStr = 'score cp ' + score;
  }

  if (bound)
    scoreStr += ' ' + bound;

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

