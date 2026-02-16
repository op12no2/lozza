


// collectPV

function collectPV(node, move) {

  const cNode = node.childNode;

  node.pv.set(cNode.pv.subarray(0, cNode.pvLen), 0);

  node.pvLen            = cNode.pvLen;
  node.pv[node.pvLen++] = move;

}

