async function midiInit() {

  try {
    const access = await navigator.requestMIDIAccess();

    // Find first output port
    const outputs = Array.from(access.outputs.values());
    if (outputs.length === 0) {
      //console.warn('No MIDI outputs available');
      return null;
    }

    return outputs[0];
  }
  catch (error) {
    //console.error('MIDI access failed:', error);
    return null;
  }
}

function midiStart(btn) {

  if (midiOut)
    return;

  midiInit().then(output => {
    midiOut = output;
    if (midiOut) {
      btn.turnOn();
      setStatus('');
    }
    else {
      status ('midi not found');
    }
  });
}

function midiNoteOn(channel, pitch, velocity) {
  if (!midiOut)
    return;
  const status = 0x90 | (channel & 0x0F);
  midiOut.send([status, pitch & 0x7F, velocity & 0x7F]);
}

function midiNoteOff(channel, pitch, velocity) {
  if (!midiOut)
    return;
  const status = 0x80 | (channel & 0x0F);
  midiOut.send([status, pitch & 0x7F, velocity & 0x7F]);
}

function previewNote(channel, pitch, velocity) {
  midiNoteOn(channel, pitch, velocity);
  midiNoteOff(channel, pitch, 0);
}

