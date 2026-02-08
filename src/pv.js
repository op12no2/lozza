function collectPV(node, cNode, move) {

  if (cNode) {
    node.pv.set(cNode.pv.subarray(0, cNode.pvLen), 0);
    node.pvLen  = cNode.pvLen;
    node.pv[node.pvLen++] = move;
  }
  else {
    node.pv[0] = move;
    node.pvLen = 1;
  }

}

function report (value, depth) {

  let pvStr = 'pv';
  for (let i=rootNode.pvLen-1; i >= 0; i--)
    pvStr += ' ' + formatMove(rootNode.pv[i]);

  const elapsed = now() - g_startTime;
  const nps = (g_nodes * 1000) / elapsed | 0;
  const nodeStr = 'nodes ' + g_nodes + ' time ' + elapsed + ' nps ' + nps + ' ';
  const depthStr = 'depth ' + depth + ' ';
  const scoreStr = 'score cp ' + value + ' ';

  uciSend('info ' + depthStr + scoreStr + nodeStr + pvStr);

}

