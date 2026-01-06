setStatus('initialising...');

const btnPlay = new Button({ icon: 'play', color: themeButton, size: BTN_SIZE, onClick: seqStart });
document.getElementById('btn-play').appendChild(btnPlay.render());
btnPlay.turnOn();
btnPlay.enable();

const btnStop = new Button({ icon: 'stop', color: themeButton, size: BTN_SIZE, onClick: seqStop });
document.getElementById('btn-stop').appendChild(btnStop.render());
btnStop.disable();

const btnSettings = new Button({ icon: 'cog', color: themeSettingsKnob, size: BTN_SIZE, onClick: redrawInspectorSettings });
document.getElementById('btn-settings').appendChild(btnSettings.render());
btnSettings.turnOn();

const btnOpen = new Button({ icon: 'open', color: themeFileKnob, size: BTN_SIZE, onClick: loadFromFile });
document.getElementById('btn-open').appendChild(btnOpen.render());
btnOpen.turnOn();

const btnSave = new Button({ icon: 'download', color: themeFileKnob, size: BTN_SIZE, onClick: saveToFile });
document.getElementById('btn-save').appendChild(btnSave.render());
btnSave.turnOn();

const btnHelp = new Button({icon: 'help', size: BTN_SIZE, color: themeButton, onClick: () => {
  window.open('https://github.com/op12no2/liminal', '_blank');
}});
document.getElementById('btn-help').appendChild(btnHelp.render());
btnHelp.turnOn();

const btnMidi = new Button({ icon: 'midi', color: themeButton, size: BTN_SIZE, onClick: () => midiStart(btnMidi) });
document.getElementById('btn-midi').appendChild(btnMidi.render());

window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('dblclick',    dblclickCanvas);
canvas.addEventListener('pointerdown', pointerdownCanvas);
canvas.addEventListener('pointerup',   pointerupCanvas);
canvas.addEventListener('pointermove', pointermoveCanvas);
canvas.addEventListener('keydown',     keydownCanvas);

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

for (let i=0; i < 12; i++) {
  quantiseLUT[i] = Array(scaleSpecs.length);
  for (let j=0; j < scaleSpecs.length; j++) {
    quantiseLUT[i][j] = Array(128);
    let notes = scaleSpecs[j].notes;
    for (let k=0; k < 128; k++) {
      quantiseLUT[i][j][k] = quantiseNote(k, notes, i);
    }
  }
}

for (let i=0; i < scaleSpecs.length; i++) {
  scaleLabels.push(scaleSpecs[i].name);
}

resizeCanvas();

canvas.tabIndex = 0;

midiStart(btnMidi);
