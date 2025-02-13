
{{{  features

const features  = {};
features.pieces = [0,0,0,0,0,0];
features.mg     = 0;
features.eg     = 0;
features.phase  = 0;

lozStruct.prototype.features = function () {

  const b  = this.board;
  const cx = colourMultiplier(this.turn)

  features.pieces.fill(0);

  let p = TPHASE;

  for (let sq=0; sq<64; sq++) {

    const fr    = B88[sq];
    const frObj = b[fr];

    if (!frObj)
      continue;

    const frPiece  = objPiece(frObj) - 1;
    const frColour = objColour(frObj);
    const frIndex  = colourIndex(frColour);
    const frMult   = colourMultiplier(frColour);

    p -= VPHASE[frPiece];

    features.pieces[frPiece] += frMult;
  }

  p = Math.max(p,0);

  features.mg = (TPHASE - p) / TPHASE;
  features.eg = p / TPHASE;
  features.phase = p;
}

}}}

TUNING = 1;

loz.newGame();

fs    = require('fs');
board = loz.board;

var epds   = [];
var params = [];

var gFiles = [
  {wdl: 5, file: 'quiet-labeled.epd'},
  {wdl: 6, file: 'lichess-big3-resolved.epd'}
];

var gK             = 1.60;
var gBatchSize     = 78786;
var gLearningRate  = 0.1;
var gDecayRate     = 1;
var gOutFile       = 'gdtuner.txt';
var gErrStep       = 1;               // update results and get loss rate.
var gMaxEpochs     = 20000;

{{{  add weights to output

function saveparams (err, epochs) {

  var d    = new Date();
  var out1 = '//{{{  weights\r\n';

  out1 += '//';
  out1 += '\r\n';
  out1 += '// num positions = ' + epds.length;
  out1 += '\r\n';
  out1 += '// num features = ' + params.length;
  out1 += '\r\n';
  out1 += '// k = ' + gK;
  out1 += '\r\n';
  out1 += '// loss = ' + err;
  out1 += '\r\n';
  out1 += '// epochs = ' + epochs;
  out1 += '\r\n';
  out1 += '// last update = ' + d;
  out1 += '\r\n';
  out1 += '//';
  out1 += '\r\n\r\n';

  var out = '';

  out += loga(MATERIAL_MID, 'MATERIAL_MID');
  out += loga(MATERIAL_END, 'MATERIAL_END');

  out += '\r\n';

  out += logpst(WPAWN_MID,     'WPAWN_MID');
  out += logpst(WPAWN_END,     'WPAWN_END');
  out += logpst(WKNIGHT_MID,   'WKNIGHT_MID');
  out += logpst(WKNIGHT_END,   'WKNIGHT_END');
  out += logpst(WBISHOP_MID,   'WBISHOP_MID');
  out += logpst(WBISHOP_END,   'WBISHOP_END');
  out += logpst(WROOK_MID,     'WROOK_MID');
  out += logpst(WROOK_END,     'WROOK_END');
  out += logpst(WQUEEN_MID,    'WQUEEN_MID');
  out += logpst(WQUEEN_END,    'WQUEEN_END');
  out += logpst(WKING_MID,     'WKING_MID');
  out += logpst(WKING_END,     'WKING_END');

  out = out + '\r\n//}}}\r\n';

  fs.writeFileSync(gOutFile, out1+out);
}

}}}
{{{  functions

{{{  getprob

function getprob (r) {
  if (r == '1/2-1/2')
    return 0.5;
  else if (r == '1-0')
    return 1.0;
  else if (r == '0-1')
    return 0.0;
  else if (r == '"1/2-1/2"')
    return 0.5;
  else if (r == '"1-0"')
    return 1.0;
  else if (r == '"0-1"')
    return 0.0;
  else if (r == '[0.5]')
    return 0.5;
  else if (r == '[1.0]')
    return 1.0;
  else if (r == '[0.0]')
    return 0.0;
  else {
    console.log('unknown result',r);
    process.exit();
  }
}

}}}
{{{  is

function is (p,sq,g) {
  const w = (board[sq]       == p)       | 0;
  const b = (board[flip(sq)] == p|BLACK) | 0;
  return (w - b) * g;
}

}}}
{{{  findK
//
// https://github.com/AndyGrant/Ethereal/blob/master/src/tuner.c#L300
//

function findK () {

    console.log('finding K...');

    var start = -10;
    var finish = 10;
    var step = 1;
    var err = 0;
    var best = 99999;

    for (var i = 0; i < 3; i++) {

      gK = start - step;
      while (gK < finish) {
        gK += step;
        err = calcErr();
        if (err <= best) {
          best = err,
          start = gK;
        }
      }

      console.log(start, best);

      finish = start + step;
      start = start - step;
      step  = step  / 10.0;
    }
}

}}}
{{{  addp

function addp (s,a,i,coeff) {
  params.push({s: s, a: a, i: i, coeff: coeff, gr: 0, m: 0, v: 0});
}

}}}
{{{  myround

function myround(x) {
  return Math.sign(x) * Math.round(Math.abs(x));
}

}}}
{{{  sigmoid

function sigmoid (x) {
  return 1.0 / (1.0 + Math.pow(10.0,-gK*x/400.0));
}

}}}
{{{  calcErr

function calcErr () {

  {{{  sync to black (jic)
  
  for (let i=0; i < 144; i++) {
  
    let j = flip(i);
  
    BPAWN_MID[j]   = WPAWN_MID[i];
    BKNIGHT_MID[j] = WKNIGHT_MID[i];
    BBISHOP_MID[j] = WBISHOP_MID[i];
    BROOK_MID[j]   = WROOK_MID[i];
    BQUEEN_MID[j]  = WQUEEN_MID[i];
    BKING_MID[j]   = WKING_MID[i];
  
    BPAWN_END[j]   = WPAWN_END[i];
    BKNIGHT_END[j] = WKNIGHT_END[i];
    BBISHOP_END[j] = WBISHOP_END[i];
    BROOK_END[j]   = WROOK_END[i];
    BQUEEN_END[j]  = WQUEEN_END[i];
    BKING_END[j]   = WKING_END[i];
  }
  
  }}}

  var err = 0;
  var num = epds.length;

  for (var i=0; i < num; i++) {

    var epd = epds[i];

    loz.position(epd.board,epd.turn,epd.rights,epd.ep);

    var pr = epd.prob;
    var ev = loz.evaluate();
    var sg = sigmoid(ev);

    if (isNaN(ev)) {
      console.log('nan-ev',ev,pr,sg);
      process.exit();
    }

    err += (pr-sg) * (pr-sg);
  }

  return err / num;
}

}}}
{{{  loga

function loga (p,s) {

  var a = Array(p.length);

  for (var i=0; i < p.length; i++)
    a[i] = myround(p[i]) | 0;

  return 'const ' + s + ' = [' + a.toString() + '];\r\n';
}

}}}
{{{  logpst

function logpst (p,s) {

  var a = Array(p.length);

  for (var i=0; i < p.length; i++)
    a[i] = myround(p[i]) | 0;

  var o = '';

  o = o + s + ' = [';

  for (var i=0; i < 144; i++) {
    if ((i % 12) == 0)
      o = o + '\r\n  ';
    o = o + a[i].toString().padStart(4,' ');
    if (i < 143)
      o = o + ', ';
  }

  o = o + '\r\n];\r\n';

  return o;
}

}}}
{{{  shuffle

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

}}}
{{{  grunt

function grunt () {

  //findK();
  //process.exit();

  console.log('creating params...');

  {{{  create params
  
  addp('nm',MATERIAL_MID, KNIGHT-1, function (dummy,mg,eg) {return mg*features.pieces[KNIGHT-1];});
  addp('bm',MATERIAL_MID, BISHOP-1, function (dummy,mg,eg) {return mg*features.pieces[BISHOP-1];});
  addp('rm',MATERIAL_MID, ROOK-1,   function (dummy,mg,eg) {return mg*features.pieces[ROOK-1];});
  addp('qm',MATERIAL_MID, QUEEN-1,  function (dummy,mg,eg) {return mg*features.pieces[QUEEN-1];});
  
  addp('pe',MATERIAL_END, PAWN-1,   function (dummy,mg,eg) {return eg*features.pieces[PAWN-1];});
  addp('ne',MATERIAL_END, KNIGHT-1, function (dummy,mg,eg) {return eg*features.pieces[KNIGHT-1];});
  addp('be',MATERIAL_END, BISHOP-1, function (dummy,mg,eg) {return eg*features.pieces[BISHOP-1];});
  addp('re',MATERIAL_END, ROOK-1,   function (dummy,mg,eg) {return eg*features.pieces[ROOK-1];});
  addp('qe',MATERIAL_END, QUEEN-1,  function (dummy,mg,eg) {return eg*features.pieces[QUEEN-1];});
  
  for (var i=8; i < 56; i++) {
    var sq = B88[i];
    addp('ppstm',WPAWN_MID, sq, function (sq,mg,eg) {return is(W_PAWN,sq,mg);});
    addp('ppste',WPAWN_END, sq, function (sq,mg,eg) {return is(W_PAWN,sq,eg);});
  }
  
  for (var i=0; i < 64; i++) {
    var sq = B88[i];
    addp('npstm',WKNIGHT_MID, sq, function (sq,mg,eg) {return is(W_KNIGHT,sq,mg);});
    addp('npste',WKNIGHT_END, sq, function (sq,mg,eg) {return is(W_KNIGHT,sq,eg);});
    addp('bpstm',WBISHOP_MID, sq, function (sq,mg,eg) {return is(W_BISHOP,sq,mg);});
    addp('bpste',WBISHOP_END, sq, function (sq,mg,eg) {return is(W_BISHOP,sq,eg);});
    addp('rpstm',WROOK_MID,   sq, function (sq,mg,eg) {return is(W_ROOK,  sq,mg);});
    addp('rpste',WROOK_END,   sq, function (sq,mg,eg) {return is(W_ROOK,  sq,eg);});
    addp('qpstm',WQUEEN_MID,  sq, function (sq,mg,eg) {return is(W_QUEEN, sq,mg);});
    addp('qpste',WQUEEN_END,  sq, function (sq,mg,eg) {return is(W_QUEEN, sq,eg);});
    addp('kpstm',WKING_MID,   sq, function (sq,mg,eg) {return is(W_KING,  sq,mg);});
    addp('kpste',WKING_END,   sq, function (sq,mg,eg) {return is(W_KING,  sq,eg);});
  }
  
  }}}

  console.log('tuning...');

  {{{  tune params
  
  console.log('positions =',epds.length);
  console.log('params =',params.length);
  console.log('k =',gK);
  console.log('lr =',gLearningRate);
  console.log('decay =',gDecayRate);
  console.log('batch size =',gBatchSize);
  
  var epoch      = 0;
  var numParams  = params.length;
  var numBatches = epds.length / gBatchSize | 0;
  var err        = 0;
  var lastErr    = 0;
  
  var beta1   = 0.9;
  
  var beta2   = 0.999;
  
  var epsilon = 1e-8;
  
  console.log('num batches =',numBatches);
  console.log('waste =',epds.length-(gBatchSize*numBatches));
  
  while (gMaxEpochs--) {
  
    if (epoch % gErrStep == 0) {
      {{{  report loss
      
      err = calcErr();
      
      console.log(epoch, gLearningRate, err, err-lastErr);
      
      lastErr = err;
      
      saveparams(err,epoch);
      
      }}}
    }
    else {
      process.stdout.write(epoch+'\r');
    }
  
    epoch++;
  
    for (var batch=0; batch < numBatches; batch++) {
      process.stdout.write(epoch+' '+batch+'\r');
      {{{  reset gradient sums
      
      for (var i=0; i < numParams; i++)
        params[i].gr = 0;
      
      }}}
      {{{  accumulate gradients
      
      for (var i=batch*gBatchSize; i < (batch+1)*gBatchSize; i++) {
      
        var epd = epds[i];
      
        loz.position(epd.board,epd.turn,epd.rights,epd.ep);
      
        var pr = epd.prob;
        var ev = loz.evaluate();
        var sg = sigmoid(ev);
      
        loz.features();
      
        var mg = features.mg;
        var eg = features.eg;
      
        for (var j=0; j < numParams; j++) {
          var p = params[j];
          p.gr += p.coeff(p.i,mg,eg) * (sg * (1 - sg)) * (sg - pr);
        }
      }
      
      }}}
      {{{  apply mean gradient
      
      for (var i=0; i < numParams; i++) {
      
        var p  = params[i];
        var gr = p.gr / gBatchSize;
      
        // Update biased first moment estimate
        p.m = beta1 * p.m + (1 - beta1) * gr;
      
        // Update biased second moment estimate
        p.v = beta2 * p.v + (1 - beta2) * (gr * gr);
      
        // Compute bias-corrected first moment estimate
        var mHat = p.m / (1 - Math.pow(beta1, batch + 1));
      
        // Compute bias-corrected second moment estimate
        var vHat = p.v / (1 - Math.pow(beta2, batch + 1));
      
        p.a[p.i] -= gLearningRate * mHat / (Math.sqrt(vHat) + epsilon);
      }
      
      }}}
      {{{  sync to black
      
      for (let i=0; i < 144; i++) {
      
        let j = flip(i);
      
        BPAWN_MID[j]   = WPAWN_MID[i];
        BKNIGHT_MID[j] = WKNIGHT_MID[i];
        BBISHOP_MID[j] = WBISHOP_MID[i];
        BROOK_MID[j]   = WROOK_MID[i];
        BQUEEN_MID[j]  = WQUEEN_MID[i];
        BKING_MID[j]   = WKING_MID[i];
      
        BPAWN_END[j]   = WPAWN_END[i];
        BKNIGHT_END[j] = WKNIGHT_END[i];
        BBISHOP_END[j] = WBISHOP_END[i];
        BROOK_END[j]   = WROOK_END[i];
        BQUEEN_END[j]  = WQUEEN_END[i];
        BKING_END[j]   = WKING_END[i];
      }
      
      }}}
    }
  
    epds          = shuffle(epds);
    gLearningRate = gLearningRate * gDecayRate;
  }
  
  console.log('Done',err);
  
  }}}

  process.exit();
}

}}}

}}}
{{{  load the epds

epds = [];

for (var j=0; j < gFiles.length; j++) {

  var f = gFiles[j];

  console.log('loading',f.file);

  var data  = fs.readFileSync('data/' + f.file, 'utf8');
  var lines = data.split('\n');

  data = '';

  for (var i=0; i < lines.length; i++) {

    var line = lines[i];

    line = line.replace(/(\r\n|\n|\r|"|;)/gm,'');
    line = line.trim();

    if (!line.length)
      continue;

    var parts = line.split(' ');

    if (!parts.length)
      continue;

    epds.push({board:   parts[0],
               turn:    parts[1],
               rights:  parts[2],
               ep:      parts[3],
               prob:    getprob(parts[f.wdl])});
  }

  lines = [];
}

}}}

grunt();


