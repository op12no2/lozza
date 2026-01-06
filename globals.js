const IDLE      = 0;
const SCHEDULED = 1;
const GATED     = 2;
const RESTING   = 3;
const PLAYED    = 4;

const ALG_RANDOM  = 0;
const ALG_NEAREST = 1;

const BTN_SIZE           = 36;
const NODE_POOL          = 16;
const DEF_KEY            = 0;
const DEF_SCALE          = 0;
const DEF_BPM            = 60;
const WEIGHT_ALWAYS      = 11;
const WEIGHT_NEVER       = 0;
const FINISH_SAFELY_TIME = 2.5;

const algLabels   = [
  'random',
  'nearest'
];

const lengthLabels = [
  '1/16',
  '1/16\u00B7',
  '1/8',
  '1/8\u00B7',
  '1/4',
  '1/4\u00B7',
  '1/2',
  '1/2\u00B7',
  '1',
  '1\u00B7',
  '2',
  '4',
  '8',
  '16',
  '32',
  '64'
];

const lengthValues = [
  0.25,
  0.25 + 0.125,
  0.5,
  0.75,
  1.0,
  1.5,
  2.0,
  3.0,
  4.0,
  6.0,
  8.0,
  16.0,
  32.0,
  64.0,
  128.0,
  256.0
];

const pitchLabels = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const articLabels = ['trig.', 'stacc.', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', 'legato'];
const articValues = [ 0.1,    0.2,       0.3,   0.4,   0.5,   0.6,   0.7,   0.8,   0.9,   1.0];
const weightLabels = ['never','1','2','3','4','5','6','7','8','9','10','always'];
const scaleSpecs = [
  { name: "chromatic", notes: [0,1,2,3,4,5,6,7,8,9,10,11] },
  { name: "major", notes: [0,2,4,5,7,9,11] },
  { name: "minor", notes: [0,2,3,5,7,8,10] },
  { name: "harmonic minor", notes: [0,2,3,5,7,8,11] },
  { name: "melodic minor", notes: [0,2,3,5,7,9,11] },
  { name: "major pentatonic", notes: [0,2,4,7,9] },
  { name: "minor pentatonic", notes: [0,3,5,7,10] },
  { name: "dorian", notes: [0,2,3,5,7,9,10] },
  { name: "phrygian", notes: [0,1,3,5,7,8,10] },
  { name: "phrygian dominant", notes: [0,1,4,5,7,8,10] },
  { name: "lydian", notes: [0,2,4,6,7,9,11] },
  { name: "lydian dominant", notes: [0,2,4,6,7,9,10] },
  { name: "lydian augmented", notes: [0,2,4,6,8,9,11] },
  { name: "mixolydian", notes: [0,2,4,5,7,9,10] },
  { name: "locrian", notes: [0,1,3,5,6,8,10] },
  { name: "super locrian", notes: [0,1,3,4,6,8,10] },
  { name: "wholetone", notes: [0,2,4,6,8,10] },
  { name: "diminished", notes: [0,2,3,5,6,8,9,11] },
  { name: "blues", notes: [0,3,5,6,7,10] },
  { name: "bebop major", notes: [0,2,4,5,7,8,9,11] },
  { name: "bebop minor", notes: [0,2,3,5,7,8,9,10,11] },
  { name: "bebop dominant", notes: [0,2,4,5,7,9,10,11] },
  { name: "bhairav", notes: [0,1,4,5,7,8,11] },
  { name: "kafi", notes: [0,2,3,5,7,9,10] },
  { name: "marwa", notes: [0,1,4,6,7,9,11] },
  { name: "hijaz", notes: [0,1,4,5,7,8,11] },
  { name: "bayati", notes: [0,1,3,5,7,8,10] },
  { name: "persian", notes: [0,1,4,5,6,8,11] },
  { name: "quartal", notes: [0,5,10] },
  { name: "hexatonic", notes: [0,1,4,5,8,9] },
  { name: "octatonic", notes: [0,1,3,4,6,7,9,10] },
  { name: "in sen", notes: [0,1,5,7,10] },
  { name: "hirajoshi", notes: [0,2,3,7,8] },
  { name: "iwato", notes: [0,1,5,6,10] },
  { name: "yo", notes: [0,2,5,7,9] },
  { name: "pelog", notes: [0,1,3,7,8] },
  { name: "slendro", notes: [0,2,5,7,10] },
  { name: "enigmatic", notes: [0,1,4,6,8,10,11] },
  { name: "hungarian minor", notes: [0,2,3,6,7,8,11] },
  { name: "gypsy minor", notes: [0,2,3,6,7,8,11] },
  { name: "kumoi", notes: [0,2,3,7,9] },
  { name: "akebono", notes: [0,2,3,7,10] },
  { name: "hon kumoi joshi", notes: [0,1,5,7,8] },
  { name: "messiaen 2", notes: [0,1,3,4,6,7,9,10] },
  { name: "messiaen 3", notes: [0,2,3,4,6,7,8,10,11] },
  { name: "messiaen 4", notes: [0,1,2,5,6,7,8,11] },
  { name: "messiaen 5", notes: [0,1,5,6,7,11] },
  { name: "messiaen 6", notes: [0,2,4,5,6,8,10,11] },
  { name: "messiaen 7", notes: [0,1,2,3,5,6,7,8,9,11] },
  { name: "augmented", notes: [0,3,4,7,8,11] },
  { name: "prometheus", notes: [0,2,4,6,9,10] },
  { name: "tritone", notes: [0,1,4,6,7,10] },
  { name: "egyptian", notes: [0,2,5,7,10] },
  { name: "scriabin", notes: [0,1,4,7,9] },
  { name: "fifths", notes: [0,7] }
];

const scaleLabels = [];

let activeBpm   = 0;
let running     = false;
let interval    = null;
let budget      = 0;
let loopSum     = 0.0;
let loopNum     = 0;
let finishTime  = 0;

let selectedScale    = DEF_SCALE;
let selectedKey      = DEF_KEY;
let selectedDynamics = 0;
let selectedSpread   = 0;
let selectedNode     = null;
let selectedLink     = null;
let selectedBpm      = DEF_BPM;
let selectedFilename = 'liminal';

let audioContext = null;

let pointerdownNode = null;
let pointerdownLink = null;
let pointerdownX    = 0;
let pointerdownY    = 0;
let pointerdownPri  = false;

let pointerupNode = null;
let pointerupLink = null;
let pointerupX    = 0;
let pointerupY    = 0;
let pointerupPri  = false;

let pointermoveX  = 0;
let pointermoveY  = 0;

const canvas = document.getElementById('seq-canvas');
const ctx    = canvas.getContext('2d');

let midiOut = null;

const quantiseLUT = Array(12);

function Link() {

    this.weight   = 0;
    this.destNode = null;

}

function Node() {

  this.x        = 0;
  this.y        = 0;
  this.pitch    = 0;    // midi value
  this.pitchvar = 0;    // +/- random semitones
  this.vel      = 0;    // midi value
  this.velvar   = 0;    // midi value
  this.dur      = 0.0;  // fraction of 1/4 note relative to bpm
  this.artic    = 0.0;  // fraction of length to gate on
  this.chan     = 0;    // midi value
  this.size     = 0;
  this.color    = 0;
  this.gated    = 0;
  this.leadin   = false;
  this.links    = [];

}

const nodes   = [];
const defNode = new Node();

defNode.pitch    = 60;
defNode.pitchvar = 0;
defNode.vel      = 64;
defNode.velvar   = 0;
defNode.dur      = 1.0;
defNode.artic    = 1.0;
defNode.repeat   = 0;
defNode.chan     = 0;

defNode.color = themeNode;
defNode.size  = 15;

function Note() {
  this.state     = 0;
  this.node      = null;
  this.startAt   = 0;
  this.finishAt  = 0;
  this.restUntil = 0;
  this.pitch     = 0;
  this.vel       = 0;
  this.chan      = 0;
}

const notes = Array.from({length: NODE_POOL}, () => new Note());

const row1Container = document.getElementById('row1-container');
const row2Container = document.getElementById('row2-container');
const row3Container = document.getElementById('row3-container');
const row4Container = document.getElementById('row4-container');
