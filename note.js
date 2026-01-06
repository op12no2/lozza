function pitchToNote(pitch) {

  return pitch % 12;  // C based

}

function pitchToOct(pitch) {

  return Math.max(0, Math.floor(pitch / 12) - 1);  // C4 = 60 = oct 4

}

function octAndNoteToPitch(oct, note) {

  return (oct * 12) + note + 12;

}

function adjust(x, v, min, max) {

  const randomOffset = Math.floor(Math.random() * (2 * v + 1)) - v;
  const adjusted     = x + randomOffset;

  return Math.max(min, Math.min(max, adjusted));

}

function quantiseNote(midiNote, scale, rootNote) {

  const transposedNote = midiNote - rootNote;
  const octave         = Math.floor(transposedNote / 12);
  const noteInOctave   = transposedNote - (octave * 12);

  let quantised = scale[0];

  for (let i = 0; i < scale.length; i++) {
    if (scale[i] <= noteInOctave) {
      quantised = scale[i];
    }
    else {
      break;
    }
  }

  if (noteInOctave < scale[0]) {
    quantised = scale[scale.length - 1];
    octave--;
  }

  return rootNote + octave * 12 + quantised;

}
