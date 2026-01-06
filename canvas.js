function primaryModifier(e) {
  return e.ctrlKey || e.metaKey;
}

function resizeCanvas() {

  const dpr     = window.devicePixelRatio || 1;
  const rect    = canvas.getBoundingClientRect();
  canvas.width  = Math.round(rect.width  * dpr);
  canvas.height = Math.round(rect.height * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  redrawCanvas();

}

function drawArrow(fromX, fromY, toX, toY, color, weight = 1) {
  // Draw line
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  ctx.stroke();
  
  // Arrow head at 1/3 distance
  const dx = toX - fromX;
  const dy = toY - fromY;
  const arrowX = fromX + dx * 0.5;
  const arrowY = fromY + dy * 0.5;
  
  // Perpendicular for arrow wings
  const angle = Math.atan2(dy, dx);
  const arrowSize = 6 + weight - 1;
  const arrowAngle = Math.PI / 6; // 30 degrees
  
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(
    arrowX - arrowSize * Math.cos(angle - arrowAngle),
    arrowY - arrowSize * Math.sin(angle - arrowAngle)
  );
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(
    arrowX - arrowSize * Math.cos(angle + arrowAngle),
    arrowY - arrowSize * Math.sin(angle + arrowAngle)
  );
  ctx.stroke();
}

function redrawCanvas() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw links

  let x1, x2,y1, y2;

  for (const node of nodes) {

    const color = node.leadin ? themeLeadin : node.color;

    for (const link of node.links) {
      const d = link.destNode;
      if (link != selectedLink)
        drawArrow(node.x, node.y, d.x, d.y, color, 1);
      else {
        x1=node.x, x2=d.x, y1=node.y, y2=d.y;
      }
    }
  }

  if (selectedLink)
    drawArrow(x1, y1, x2, y2, '#999', 1);

  // draw nodes

  for (const node of nodes) {

    const color = node.leadin ? themeLeadin : node.color;

    // draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // draw gate dot
    if (node.gated) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ccc';
      ctx.fill();
    }

    // draw selection ring on top
    if (selectedNode) {
      ctx.beginPath();
      ctx.arc(selectedNode.x, selectedNode.y, selectedNode.size, 0, Math.PI * 2);
      ctx.lineWidth   = 1;
      ctx.strokeStyle = '#999';
      ctx.stroke();
    }
  }  
}

function dblclickCanvas (e) {

  const rect = canvas.getBoundingClientRect();
  const x    = Math.max(0, e.clientX - rect.left);
  const y    = Math.max(0, e.clientY - rect.top);

  pointerdownNode = findNode(x,y);
  pointerdownX    = x;
  pointerdownY    = y;

  if (pointerdownNode) {
    selectedNode = pointerdownNode;
    selectedNode.leadin = selectedNode.leadin ? false : true;
    redrawCanvas();
    redrawInspectorNode();
  }

  pointerdownNode = null;
  pointerdownX    = 0;
  pointerdownY    = 0;

  pointerupNode = null;
  pointerupX    = 0;
  pointerupY    = 0;


}

function pointerdownCanvas (e) {

  const rect = canvas.getBoundingClientRect();
  const x    = Math.max(0, e.clientX - rect.left);
  const y    = Math.max(0, e.clientY - rect.top);

  pointerdownNode = findNode(x,y);
  if (!pointerdownNode)
    pointerdownLink = findLink(x, y);

  pointerdownX    = x;
  pointerdownY    = y;
  pointerdownPri  = primaryModifier(e);

  if (!pointerdownNode && !pointerdownLink && pointerdownPri) { // create node
    selectedNode = createNode(x, y);
    redrawCanvas();
    redrawInspectorNode();
  }
  else if (pointerdownNode) { // select node
    selectedNode = pointerdownNode;
    selectedLink = null;
    redrawCanvas();
    redrawInspectorNode();
  }
  else if (pointerdownLink) { // select link
    selectedNode = null;
    selectedLink = pointerdownLink;
    redrawCanvas();
    redrawInspectorLink();
  }
  else if (!pointerdownNode && selectedNode) { // clear selection
    selectedNode = null;
    redrawCanvas();
    redrawInspectorSettings();
  }
  else if (!pointerdownLink && selectedLink) { // clear selection
    selectedLink = null;
    redrawCanvas();
    redrawInspectorSettings();
  }

  pointerupNode  = null;
  pointerupX     = 0;
  pointerupY     = 0;
  pointerupPri   = false;

}

function pointerupCanvas (e) {

  const rect = canvas.getBoundingClientRect();
  const x    = Math.max(0, e.clientX - rect.left);
  const y    = Math.max(0, e.clientY - rect.top);

  pointerupNode = findNode(x,y);
  pointerupX    = x;
  pointerupY    = y;
  pointerupPri  = primaryModifier(e);

  if (pointerdownNode && pointerdownPri && pointerupNode && pointerupPri && pointerdownNode != pointerupNode && nodeIsLinkedTo(pointerdownNode, pointerupNode) == -1) { // link to node 
    pointerdownNode.links.push(createLink(pointerupNode));
    redrawCanvas();
  }

  else if (pointerdownNode && pointerdownPri && !pointerupNode && pointerupPri) { // create node and link
    selectedNode = createNode(x, y);
    pointerupNode = selectedNode;
    pointerdownNode.links.push(createLink(pointerupNode));
    redrawCanvas();
    redrawInspectorNode();
  }

  pointerdownNode = null;
  pointerdownX    = 0;
  pointerdownY    = 0;
  pointerdownPri  = false;
}

function pointermoveCanvas (e) {

  const rect = canvas.getBoundingClientRect();
  const x    = Math.max(0, e.clientX - rect.left);
  const y    = Math.max(0, e.clientY - rect.top);

  pointermoveX = x;
  pointermoveY = y;

  if (pointerdownNode && !pointerdownPri && !primaryModifier(e)) { // drag node
    pointerdownNode.x = x;
    pointerdownNode.y = y;
    redrawCanvas();
  }

}

function keydownCanvas(e) {

  if (e.key === 'Delete' || e.key === 'Backspace') {

    if (selectedNode) {
      const x = selectedNode.x;
      const y = selectedNode.y;
      deleteNode(selectedNode);
      selectedNode = findNode(x, y, 100000);
      redrawCanvas();
      if (selectedNode)
        redrawInspectorNode();
      else
        redrawInspectorSettings();
    }
    else if (selectedLink) {
      // Find midpoint of link before deleting
      let x = selectedLink.destNode.x;
      let y = selectedLink.destNode.y;
      for (const node of nodes) {
        if (node.links.indexOf(selectedLink) !== -1) {
          x = (node.x + selectedLink.destNode.x) / 2;
          y = (node.y + selectedLink.destNode.y) / 2;
          break;
        }
      }
      deleteLink(selectedLink);
      selectedLink = findLink(x, y, 100000);
      redrawCanvas();
      if (selectedLink)
        redrawInspectorLink();
      else
        redrawInspectorSettings();
    }
  }
}
