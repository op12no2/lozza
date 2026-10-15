let multiPV         = 1;
let multiPVLines    = [];  // {depth, move, score, pv, pvLen} from the last complete iteration, best first
let multiPVExcluded = [];  // root moves rootSearch skips (lines already found this iteration)

let reportedMove = 0;  // the first move of the last pv sent

function uciScore (score) {

  if (Math.abs(score) > MINMATE) {

    let mateScore = (MATE - Math.abs(score) + 1) / 2 | 0;
    if (score < 0)
      mateScore = -mateScore;

    return 'score mate ' + mateScore;

  }

  return 'score cp ' + score;

}

function report (scoreStr, depth) {

  reportedMove = rootNode.pvLen > 0 ? rootNode.pv[rootNode.pvLen-1] : 0;

  let pvStr = 'pv';
  for (let i=rootNode.pvLen-1; i >= 0; i--)
    pvStr += ' ' + formatMove(rootNode.pv[i]);

  const tim     = now() - statsStartTime;
  const nps     = (statsNodes * 1000) / tim | 0;
  const nodeStr = 'nodes ' + statsNodes + ' time ' + tim + ' nps ' + nps;

  const depthStr = 'depth ' + depth + ' seldepth ' + statsSelDepth;
  const hashStr  = 'hashfull ' + (1000 * ttHashUsed / ttSize | 0);

  uciSend('info', depthStr, scoreStr, nodeStr, hashStr, pvStr);

}

function reportScore (score, depth) {

  report(uciScore(score), depth);

}

function reportMultiPV (lines) {

  const tim     = now() - statsStartTime;
  const nps     = (statsNodes * 1000) / tim | 0;
  const nodeStr = 'nodes ' + statsNodes + ' time ' + tim + ' nps ' + nps;

  const hashStr  = 'hashfull ' + (1000 * ttHashUsed / ttSize | 0);

  const n = lines.length;

  for (let i = 0; i < n; i++) {

    const entry    = lines[i];
    const depthStr = 'depth ' + entry.depth + ' seldepth ' + statsSelDepth;

    let pvStr = 'pv';
    for (let j = entry.pvLen - 1; j >= 0; j--)
      pvStr += ' ' + formatMove(entry.pv[j]);

    uciSend('info', depthStr, 'multipv', (i + 1), uciScore(entry.score), nodeStr, hashStr, pvStr);
  }
}
