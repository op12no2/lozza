function createNode (x, y) {

  const node = new Node();

  nodes.push(node);

  if (selectedNode) {
    const {x, y, links, ...rest} = selectedNode;
    Object.assign(node, rest);
  }
  else {
    Object.assign(node, defNode);
  }

  node.x     = x;
  node.y     = y;
  node.links = [];
  
  return node;

}

function createLink(destNode) {
  const link = new Link();
  link.destNode = destNode;
  link.weight   = 1;
  return link;
}

function selectWeightedLink(node) {

  if (node.links.length === 0)
    return -1;

  // Calculate total weight
  let totalWeight = 0;
  for (const link of node.links) {
    if (link.weight > WEIGHT_NEVER && link.weight < WEIGHT_ALWAYS) {
      totalWeight += link.weight;
    }  
  }

  // Pick random value in range [0, totalWeight)
  const rand = Math.random() * totalWeight;

  // Find which link this falls into
  let cumulative = 0;
  for (let i=0; i < node.links.length; i++) {
    const link = node.links[i];
    if (link.weight > WEIGHT_NEVER && link.weight < WEIGHT_ALWAYS) {
      cumulative += link.weight;
      if (rand < cumulative) {
        return i;
      }
    }  
  }

  return -1;

}

function nodeIsLinkedTo(srcNode, destNode) {
  for (let i=0; i < srcNode.links.length; i++) {
    const link = srcNode.links[i];
    if (link.destNode == destNode)
      return i;
  }
  return -1;
}

function findLink(x, y, slop = 7) {

  let closestLink = null;
  let closestNode = null;
  let bestDist = Infinity;
  let bestSrcDist = Infinity;

  for (const srcNode of nodes) {
    for (const link of srcNode.links) {
      const destNode = link.destNode;
      
      // Get line segment from srcNode to destNode
      const x1 = srcNode.x;
      const y1 = srcNode.y;
      const x2 = destNode.x;
      const y2 = destNode.y;
      
      // Calculate perpendicular distance from point to line segment
      const dist = pointToSegmentDistance(x, y, x1, y1, x2, y2);
      
      if (dist <= slop) {
        // Calculate distance to source node
        const dx = x - srcNode.x;
        const dy = y - srcNode.y;
        const srcDist = Math.sqrt(dx * dx + dy * dy);
        
        // Prefer link with closest source node (breaks ties for bidirectional links)
        if (dist < bestDist || (dist === bestDist && srcDist < bestSrcDist)) {
          bestDist = dist;
          bestSrcDist = srcDist;
          closestLink = link;
          closestNode = srcNode;
        }
      }
    }
  }

  return closestLink; // ? { link: closestLink, srcNode: closestNode } : null;

}

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  
  // Handle degenerate case where start and end are same point
  if (lengthSq === 0) {
    const dpx = px - x1;
    const dpy = py - y1;
    return Math.sqrt(dpx * dpx + dpy * dpy);
  }
  
  // Calculate projection of point onto line (clamped to segment)
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
  
  // Find closest point on segment
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  
  // Return distance to closest point
  const distX = px - closestX;
  const distY = py - closestY;
  return Math.sqrt(distX * distX + distY * distY);

}

function findNode(x, y, slop=2) {

  let closest    = null;
  let bestDistSq = Infinity;

  for (const node of nodes) {
    const dx = x - node.x;
    const dy = y - node.y;

    const r = node.size + slop;
    const distSq = dx * dx + dy * dy;

    if (distSq <= r * r && distSq < bestDistSq) {
      bestDistSq = distSq;
      closest = node;
    }
  }

  return closest;

}

function performNode (now, node, note) {

  if (!node)
    ('performNode, no node');

  const duration = 60/selectedBpm * node.dur;

  note.startAt   = now;
  note.finishAt  = now + duration * node.artic;
  note.restUntil = now + duration;
  note.pitch     = quantiseLUT[selectedKey][selectedScale][adjust(node.pitch, node.pitchvar + selectedSpread, 0, 127)];
  note.vel       = adjust(node.vel, node.velvar + selectedDynamics, 0, 127);
  note.chan      = node.chan;

}

function deleteNode(node) {

  // Remove this node from any other node's links
  for (const n of nodes) {
    const index = nodeIsLinkedTo(n, node);
    if (index != -1) {
      n.links.splice(index, 1);
    }
  }

  // Remove the node itself from the nodes array
  const nodeIndex = nodes.indexOf(node);
  if (nodeIndex !== -1) {
    nodes.splice(nodeIndex, 1);
  }
}

function deleteLink(link) {

  for (const node of nodes) {
    const index = node.links.indexOf(link);
    if (index !== -1) {
      node.links.splice(index, 1);
      return;
    }
  }
}

