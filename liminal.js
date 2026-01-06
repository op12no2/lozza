function seqStart() {

  setStatus('');

  if (running || nodes.length == 0) 
    return;

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
  }

  finishTime = 0;
  activeBpm  = 0;
  loopSum    = 0;
  loopNum    = 0;

  for (let i=0; i < NODE_POOL; i++) {
    notes[i].state = IDLE;
  }

  let numLeadins = 0;
  let now        = audioContext.currentTime;

  for (let i=0; i < nodes.length; i++) {
    const node = nodes[i];
    node.gated = false;
    if (node.leadin) {
      const note = notes[numLeadins++];
      note.state = SCHEDULED;
      note.node  = node;
      performNode(now, node, note);
    }
  }

  if (numLeadins == 0) {
    setStatus('no lead-in notes');
    return;
  }

  btnPlay.turnOff();
  btnPlay.disable();
  btnStop.turnOn();
  btnStop.enable();

  running = true;

  seqLoop();

}

function seqStop() {

  console.log('bpm =', selectedBpm, 'budget(ms) =', budget, 'mean consumed fraction =', loopSum/loopNum, 'loops =', loopNum, 'nodes =', nodes.length);

  clearInterval(interval);

  running  = false;
  interval = null;

  btnPlay.turnOn();
  btnPlay.enable();
  btnStop.turnOff();
  btnStop.disable();

  for (let i=0; i < NODE_POOL; i++) {
  
    const n = notes[i];
  
    if (n.state == GATED) {
      midiNoteOff(n.chan, n.pitch, 0)
      n.node.gated = false;
    }
  
  }
  
  redrawCanvas();

}

function seqLoop() {

  if (activeBpm != selectedBpm) {
  
    clearInterval(interval);
  
    activeBpm = selectedBpm;
    budget    = Math.floor((60/selectedBpm/4/2) * 1000);  // 1/32 note
    interval  = setInterval(seqLoop, budget);
  
    console.log('bpm =', selectedBpm, 'budget(ms) =', budget);
  
  }
  
  const now    = audioContext.currentTime;
  let allQuiet = false;
  let iters    = 0;

  while (!allQuiet) {

    allQuiet = true;

    for (let i=0; i < NODE_POOL; i++) {
      
      const note = notes[i];

      if (note.state == IDLE)
        continue;

      iters++;
      
      if (note.state == GATED && note.finishAt <= now) {
        //console.log(now, 'GATED -> RESTING', note.finishAt);
        midiNoteOff(note.chan, note.pitch, 0);
        note.state      = RESTING;
        allQuiet        = false;
        note.node.gated = false;
      }
      
      if (note.state == SCHEDULED && note.startAt <= now) {
        if (note.node.gated) {
          //console.log(now, 'SCHEDULED -> MUTED');
          note.state = IDLE;
        }
        else {
          //console.log(now, 'SCHEDULED -> GATED');
          midiNoteOn(note.chan, note.pitch, note.vel);
          note.state      = GATED;
          allQuiet        = false;
          note.node.gated = true;
        }  
      }
      
      if (note.state == RESTING && note.restUntil <= now) {
        //console.log(now, 'RESTING -> PLAYED');
        note.state = PLAYED;
        allQuiet   = false;
      }
      
      if (note.state == PLAYED) {
        //console.log(now, 'PLAYED -> IDLE');
        scheduleNextAnd(now, note);
        scheduleNextOr(now, note);
        note.state = IDLE;
        allQuiet   = false;
      }
    }
  }

  redrawCanvas();

  loopSum += ((audioContext.currentTime - now) * 1000) / budget;
  loopNum++;

  if (iters == 0 && finishTime && (now - finishTime) > FINISH_SAFELY_TIME) {
    seqStop();
    seqStart()
  }
  else if (iters == 0 && finishTime == 0)
    finishTime = now;
  else if (iters)
    finishTime = 0;
}

function scheduleNextOr(now, note) {

  const lastNode = note.node;

  if (lastNode.links.length == 0)
    return;

  const r = selectWeightedLink(lastNode);

  if (r == -1)
    return;
  
  const nextNode = lastNode.links[r].destNode;
  const nextNote = getIdleNote();
      
  if (nextNote) {
      
    nextNote.state = SCHEDULED;
    nextNote.node  = nextNode;
      
    performNode(now, nextNode, nextNote);
      
  }
}

function scheduleNextAnd(now, note) {

  const lastNode = note.node;

  for (const link of lastNode.links) {

    if (link.weight == WEIGHT_ALWAYS) {

      const nextNode = link.destNode;
      const nextNote = getIdleNote();
    
      if (nextNote) {
      
        nextNote.state = SCHEDULED;
        nextNote.node  = nextNode;
      
        performNode(now, nextNode, nextNote);
      
      }
    }
  }  
}  

function getIdleNote() {

  for (let i=0; i < NODE_POOL; i++) {

    if (notes[i].state == IDLE) {
      return notes[i];
    }

  }

  setStatus('note overflow');

  return null;

}
