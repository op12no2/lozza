function saveToJSON() {
  const data = {
    version: 1,
    globals: {
      selectedScale: selectedScale,
      selectedKey: selectedKey,
      selectedDynamics: selectedDynamics,
      selectedSpread: selectedSpread,
      selectedBpm: selectedBpm,
    },
    nodes: nodes.map(node => ({
      x: node.x,
      y: node.y,
      pitch: node.pitch,
      pitchvar: node.pitchvar,
      vel: node.vel,
      velvar: node.velvar,
      dur: node.dur,
      artic: node.artic,
      chan: node.chan,
      size: node.size,
      color: node.color,
      gated: false, // node.gated,
      leadin: node.leadin,
      links: node.links.map(link => ({
        weight: link.weight,
        destIndex: nodes.indexOf(link.destNode)
      }))
    }))
  };
  
  // Handle selectedLink if it exists
  if (selectedLink) {
    for (let i = 0; i < nodes.length; i++) {
      const linkIndex = nodes[i].links.indexOf(selectedLink);
      if (linkIndex !== -1) {
        data.globals.selectedLinkSrc = i;
        data.globals.selectedLinkDest = nodes.indexOf(selectedLink.destNode);
        break;
      }
    }
  }
  
  return JSON.stringify(data, null, 2);

}

function loadFromJSON(jsonString) {
 
  const data = JSON.parse(jsonString);
  
  // Restore globals
  selectedScale = data.globals.selectedScale;
  selectedKey = data.globals.selectedKey;
  selectedDynamics = data.globals.selectedDynamics;
  selectedSpread = data.globals.selectedSpread;
  selectedBpm = data.globals.selectedBpm;
  
  // Clear existing nodes
  nodes.length = 0;
  
  // First pass: create all nodes
  data.nodes.forEach(nodeData => {
    const node = new Node();
    node.x = nodeData.x;
    node.y = nodeData.y;
    node.pitch = nodeData.pitch;
    node.pitchvar = nodeData.pitchvar;
    node.vel = nodeData.vel;
    node.velvar = nodeData.velvar;
    node.dur = nodeData.dur;
    node.artic = nodeData.artic;
    node.chan = nodeData.chan;
    node.size = nodeData.size;
    node.color = nodeData.color;
    node.gated = nodeData.gated;
    node.leadin = nodeData.leadin;
    node.links = [];
    nodes.push(node);
  });
  
  // Second pass: recreate links with correct node references
  data.nodes.forEach((nodeData, nodeIndex) => {
    nodeData.links.forEach(linkData => {
      const link = new Link();
      link.weight = linkData.weight;
      link.destNode = nodes[linkData.destIndex];
      nodes[nodeIndex].links.push(link);
    });
  });
  
}

function saveToFile() {

  const jsonString = saveToJSON();
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
    
  const a = document.createElement('a');
  a.href = url;
  a.download = selectedFilename + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

}

function loadFromFile () {

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
    
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Extract filename without extension
    selectedFilename = file.name.replace(/\.json$/i, '');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        loadFromJSON(event.target.result);
        console.log('File loaded successfully');
        redrawCanvas();
      }
      catch (error) {
        console.error('Failed to load file:', error);
        alert('Failed to load file: ' + error.message);
      }
    };
    reader.readAsText(file);
  };
    
  input.click();

}
