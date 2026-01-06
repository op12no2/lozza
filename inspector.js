function redrawInspectorSettings() {

  setText('inspector-title', 'settings');

  row1Container.innerHTML = '';
  row2Container.innerHTML = '';
  row3Container.innerHTML = '';
  row4Container.innerHTML = '';

  const bpmKnob = new Knob(row1Container, 'bpm-knob', {
    label: 'BPM',
    indicatorColor: themeSettingsKnob,
    min: 40,
    max: 240,
    value: selectedBpm,
    defaultValue: DEF_BPM,
    onChange: (v) => { selectedBpm = v; redrawCanvas(); }
  });
  
  const keyKnob = new Knob(row1Container, 'key-knob', {
    label: 'KEY',
    indicatorColor: themeSettingsKnob,
    min: 0,
    max: 11,
    value: selectedKey,
    defaultValue: DEF_KEY,
    stepLabels: pitchLabels,
    onChange: (v) => { selectedKey = v; redrawCanvas(); }
  });
  
  const scaleKnob = new Knob(row2Container, 'scale-knob', {
    size: 100,
    label: 'SCALE',
    indicatorColor: themeSettingsKnob,
    min: 0,
    max: scaleLabels.length - 1,
    value: selectedScale,
    defaultValue: DEF_SCALE,
    stepLabels: scaleLabels,
    sensitivity: 0.4,
    onChange: (v) => { selectedScale = v; redrawCanvas(); }
  });
  
  const spreadKnob = new Knob(row3Container, 'spread-knob', {
    label: 'SPREAD',
    indicatorColor: themeSettingsKnob,
    min: 0,
    max: 24,
    value: selectedSpread,
    defaultValue: 0,
    onChange: (v) => { selectedSpread = v; redrawCanvas(); }
  });
  
  const dynamicsKnob = new Knob(row3Container, 'dynamics-knob', {
    label: 'DYNAMICS',
    indicatorColor: themeSettingsKnob,
    min: 0,
    max: 64,
    value: selectedDynamics,
    defaultValue: 0,
    onChange: (v) => { selectedDynamics = v; redrawCanvas(); }
  });

  row4Container.innerHTML = `
    <div class="filename-container">
      <div class="knob-label">FILENAME</div>
      <input type="text" id="filename-input" class="filename-input" value="${selectedFilename}">
    </div>
  `;
  document.getElementById('filename-input').addEventListener('input', (e) => {
    selectedFilename = e.target.value || 'liminal';
  });

}

function redrawInspectorNode() {

  setText('inspector-title', 'note');

  row1Container.innerHTML = '';
  row2Container.innerHTML = '';
  row3Container.innerHTML = '';
  row4Container.innerHTML = '';

  const n = selectedNode;

  if (!n)
    return;

  const pitchNoteKnob = new Knob(row1Container, 'pitch-note-knob', {
    label: 'NOTE',
    indicatorColor: themeNodeKnob,
    min: 0,
    max: 11,
    value: pitchToNote(n.pitch),
    defaultValue: pitchToNote(n.pitch),
    stepLabels: pitchLabels,
    onChange: (v) => { n.pitch = octAndNoteToPitch(pitchToOct(n.pitch), v); redrawCanvas(); }
  });
  
  const pitchOctKnob = new Knob(row1Container, 'pitch-oct-knob', {
    label: 'OCTAVE',
    indicatorColor: themeNodeKnob,
    min: 0,
    max: 8,
    value: pitchToOct(n.pitch),
    defaultValue: pitchToOct(n.pitch),
    onChange: (v) => { n.pitch = octAndNoteToPitch(v, pitchToNote(n.pitch)); redrawCanvas(); }
  });
  
  const pitchVarKnob = new Knob(row1Container, 'pitch-var-knob', {
    label: 'SPREAD',
    indicatorColor: themeNodeKnob,
    min: 0,
    max: 24,
    value: n.pitchVar,
    defaultValue: defNode.pitchvar,
    onChange: (v) => { n.pitchvar = v; redrawCanvas(); }
  });
  
  const lenKnob = new Knob(row2Container, 'len-knob', {
    label: 'LENGTH',
    indicatorColor: themeNodeKnob,
    min: 0,
    max: 15,
    value: lengthValues.indexOf(n.dur),
    stepLabels: lengthLabels,
    defaultValue: lengthValues.indexOf(defNode.dur),
    onChange: (v) => { n.dur = lengthValues[v]; redrawCanvas(); }
  });
  
  const articKnob = new Knob(row2Container, 'artic-knob', {
    label: 'ARTIC.',
    indicatorColor: themeNodeKnob,
    min: 0,
    max: 9,
    value: articValues.indexOf(n.artic),
    stepLabels: articLabels,
    defaultValue: articValues.indexOf(defNode.artic),
    onChange: (v) => { n.artic = articValues[v]; redrawCanvas(); }
  });
  
  const chanKnob = new Knob(row3Container, 'chan-knob', {
    label: 'CHANNEL',
    indicatorColor: themeNodeKnob,
    min: 0,
    max: 15,
    value: n.chan,
    defaultValue: defNode.chan,
    onChange: (v) => { n.chan = v; redrawCanvas(); }
  });
  
  const velKnob = new Knob(row3Container, 'vel-knob', {
    label: 'VELOCITY',
    indicatorColor: themeNodeKnob,
    min: 0,
    max: 127,
    value: n.vel,
    defaultValue: defNode.vel,
    onChange: (v) => { n.vel = v; redrawCanvas(); }
  });
  
  const velVarKnob = new Knob(row3Container, 'vel-var-knob', {
    label: 'DYNAMICS',
    indicatorColor: themeNodeKnob,
    min: 0,
    max: 16,
    value: n.velVar,
    defaultValue: defNode.velvar,
    onChange: (v) => { n.velvar = v; redrawCanvas(); }
  });
  
}

function redrawInspectorLink() {

  setText('inspector-title', 'link');

  row1Container.innerHTML = '';
  row2Container.innerHTML = '';
  row3Container.innerHTML = '';
  row4Container.innerHTML = '';

  const link = selectedLink;

  if (!link)
    return;

  const weightLinkKnob = new Knob(row1Container, 'weight-link-knob', {
    label: 'WEIGHT',
    indicatorColor: themeNodeKnob,
    min: 0,
    max: 11,
    value: link.weight,
    defaultValue: 1,
    stepLabels: weightLabels,
    onChange: (v) => { link.weight = v; redrawCanvas(); }
  });
  
}