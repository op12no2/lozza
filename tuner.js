//
// copy lozza.js above here.
//
// REMEMBER TO:-
//
//   1. TURN OFF PAWN TT
//   2. COPY EV ASSIGNS TO EVALUATE.
//

//{{{  lozza globals

fs    = lozza.uci.nodefs;
uci   = lozza.uci;
board = lozza.board;

//}}}
//{{{  functions

var bestErr = 0;
var thisErr = 0;
var tries   = 0;  // num calls to calcErr() in a iter
var changes = 0;
var better  = false;
var changes = 0;

//{{{  sigmoid

var kkk = 1.603; //for quiet-labeled.epd

console.log('k =',kkk);

function sigmoid (qs) {
 var p = (kkk*qs) / 400.0;
 return 1.0 / (1.0 + Math.pow(10.0,-p));
}

//}}}
//{{{  calcErr

function calcErr () {

  tries++;

  process.stdout.write(tries+'\r');

  var err = 0;
  var num = epds.length;

  for (var i=0; i < num; i++) {

    var epd = epds[i];

    uci.spec.board    = epd.board;
    uci.spec.turn     = epd.turn;
    uci.spec.rights   = epd.rights;
    uci.spec.ep       = epd.ep;
    uci.spec.fmc      = epd.fmvn;
    uci.spec.hmc      = epd.hmvc;
    uci.spec.id       = 'id' + i;
    uci.spec.moves    = [];

    lozza.position();

    var p = epd.prob;
    var e = board.evaluate(board.turn);

    if (board.turn == BLACK)
      e = -e;  // undo negamax.

    var s = sigmoid(e);

    if (isNaN(p) || isNaN(s) || s > 1.0 || p > 1.0 || s < 0.0 || p < 0.0) {
      console.log('eek',p,s);
      process.exit();
   }

    err += (p-s)*(p-s);
  }

  return err / num;
}

//}}}
//{{{  clearpst

function clearpst (pst) {
  for (var i=0; i<144; i++)
    pst[i]=0|0;
}

//}}}
//{{{  getprob

function getprob (r) {
  if (r == '"1/2-1/2";')
    return 0.5;
  else if (r == '"1-0";')
    return 1.0;
  else if (r == '"0-1";')
    return 0.0;
  else
    console.log('unknown result',r);
}

//}}}
//{{{  try*

//{{{  tryarrayslice
//
// like tryarray but just an inclusive [lo,hi] slice.
//

function tryarrayslice (a,lo,hi,inc) {

  var inc2 = inc + inc;

  for (var p=lo; p<=hi; p++) {
    a[p] = a[p] + inc;
    thisErr = calcErr();
    if (thisErr < bestErr) {
      changes++;
      bestErr = thisErr;
      better  = true;
    }
    else {
      a[p] = a[p] - inc2;
      thisErr = calcErr();
      if (thisErr < bestErr) {
        changes++;
        bestErr = thisErr;
        better = true;
      }
      else {
        a[p] = a[p] + inc;
      }
    }
  }
}

//}}}
//{{{  tryarray

function tryarray (a,inc) {
  tryarrayslice(a,0,a.length-1,inc);
}

//}}}
//{{{  trypstsq
//
// try a single w b pst square;
//

function trypstsq(aw,ab,wi,inc) {

  var inc2 = inc + inc;
  var bi   = wbmap(wi);

  if (aw[wi] != ab[bi]) {
    console.log('pst outta sync');  // jic.
    process.exit();
  }

  aw[wi] = aw[wi] + inc;
  ab[bi] = ab[bi] + inc;
  thisErr = calcErr();
  if (thisErr < bestErr) {
    changes++;
    bestErr = thisErr;
    better  = true;
  }
  else {
    aw[wi] = aw[wi] - inc2;
    ab[bi] = ab[bi] - inc2;
    thisErr = calcErr();
    if (thisErr < bestErr) {
      changes++;
      bestErr = thisErr;
      better = true;
    }
    else {
      aw[wi] = aw[wi] + inc;
      ab[bi] = ab[bi] + inc;
    }
  }
}

//}}}
//{{{  trypst
//
// try [0,63] based w b squares from lo to hi invlusively.
//

function trypst (aw,ab,lo,hi,inc) {

  for (var sq=lo; sq<=hi; sq++) {

    var wi = B88[sq];  // map to [0,143] range

    trypstsq(aw,ab,wi,inc);
  }
}

//}}}
//{{{  trypst2
//
// a list of [0,143] based squares to try are in ai.
//

function trypst2(aw,ab,ai,inc) {

  for (var i=0; i<ai.length; i++) {

    var wi = ai[i];
    trypstsq(aw,ab,wi,inc);
  }
}

//}}}

//}}}
//{{{  wbmap

function wbmap (sq) {
  var m = (143-sq)/12|0;
  return 12*m + sq%12;
}

//}}}

//}}}

console.log('hello world! wait...');

//{{{  check sigmoid

//for (var i=-600;i<=600;i+=100) {
  //console.log(i,sigmoid(i));
//}

//}}}
//{{{  get the epds
//
// quiet-labeled.epd
// rnb1kbnr/pp1pppp1/7p/2q5/5P2/N1P1P3/P2P2PP/R1BQKBNR w KQkq - c9 "1/2-1/2"
// 0                                                   1 2    3 4  5

var data  = fs.readFileSync('../testing/quiet-labeled.epd', 'utf8');
var lines = data.split('\n');
var epds  = [];

data = '';  //release.

for (var i=0; i < lines.length; i++) {

  if (i % 100000 == 0)
    process.stdout.write(i+'\r');

  var line = lines[i];

  line = line.replace(/(\r\n|\n|\r)/gm,'');
  line = line.trim();

  if (!line)
    continue;

  var parts = line.split(' ');

  epds.push({eval:   0,
             board:  parts[0],
             turn:   parts[1],
             rights: parts[2],
             ep:     parts[3],
             fmvn:   0,
             hmvc:   0,
             prob:   getprob(parts[5])});
}

lines = []; // release

console.log('positions =',epds.length);

//}}}
//{{{  count win, lose, draw
//
// Just to make sure the file has been parsed OK.
//

var wins = 0;
var loss = 0;
var draw = 0;

for (var i=0; i < epds.length; i++) {

  if (i % 100000 == 0)
    process.stdout.write(i+'\r');

  var epd = epds[i];

  if (epd.prob == 1.0)
    wins++;

  else if (epd.prob == 0.0)
    loss++;

  else if (epd.prob == 0.5)
    draw++;
  else {
    console.log('not a prob',epd.prob);
    process.exit();
  }
}

console.log('wins =',wins,'losses =',loss,'draws =',draw);
console.log('error check =',epds.length - wins - draw - loss,'(should be 0)');

//}}}
//{{{  find k
/*
var min = 100.0;

for (var x=1.59;x<1.62;x+=0.001) {
  kkk = x;
  var err = calcErr();
  if (err <  min) {
    console.log(kkk,err);
    min = err;
  }
  else
    console.log('found min');
}

process.exit();
*/
//}}}
//{{{  do the grunt

lozza.newGameInit();

//{{{  check eval

var t1 = Date.now();

bestErr = calcErr();

var t2 = Date.now();
var et = (t2-t1)/1000;
console.log('try time =',et,'secs (one pass of all positions)');

if (calcErr() != bestErr) {
  console.log('eval is unstable');
  process.exit();
}
else
  console.log('eval is stable'); // probably

//}}}

console.log('starting error =',bestErr);
console.log('**************');

//{{{  search

iter     = 1;          // num full iters (trying all params)
thisErr  = 0;
better   = true;
changes  = 0;          // num changes made in this iter
tries    = 0;          // num calls to calcErr() made in this iter

var nosq =[51,52,53,54,55,56,63,64,65,66,67,68,75,76,77,78,79,80]; //knight outpost squares

while (better) {

  var t1 = Date.now();

  better = false;

  //{{{  try each param
  
  tryarrayslice(VALUE_VECTOR,KNIGHT,QUEEN,1);
  
  trypst(WPAWN_PSTS,  BPAWN_PSTS,  8,55,1);
  trypst(WPAWN_PSTE,  BPAWN_PSTE,  8,55,1);
  trypst(WKNIGHT_PSTS,BKNIGHT_PSTS,0,63,1);
  trypst(WKNIGHT_PSTE,BKNIGHT_PSTE,0,63,1);
  trypst(WBISHOP_PSTS,BBISHOP_PSTS,0,63,1);
  trypst(WBISHOP_PSTE,BBISHOP_PSTE,0,63,1);
  trypst(WROOK_PSTS,  BROOK_PSTS,  0,63,1);
  trypst(WROOK_PSTE,  BROOK_PSTE,  0,63,1);
  trypst(WQUEEN_PSTS, BQUEEN_PSTS, 0,63,1);
  trypst(WQUEEN_PSTE, BQUEEN_PSTE, 0,63,1);
  trypst(WKING_PSTS,  BKING_PSTS,  0,63,1);
  trypst(WKING_PSTE,  BKING_PSTE,  0,63,1);
  
  trypst2(WOUTPOST,BOUTPOST,nosq,1);
  
  tryarrayslice(imbalN_S,1,8,1);
  tryarrayslice(imbalN_E,1,8,1);
  tryarrayslice(imbalB_S,1,8,1);
  tryarrayslice(imbalB_E,1,8,1);
  tryarrayslice(imbalR_S,1,8,1);
  tryarrayslice(imbalR_E,1,8,1);
  tryarrayslice(imbalQ_S,1,8,1);
  tryarrayslice(imbalQ_E,1,8,1);
  
  tryarray(EV,1);
  
  tryarrayslice(PAWN_PASSED,1,7,0.1);
  
  tryarrayslice(ATT_W,1,7,0.01);
  
  tryarrayslice(WSHELTER,3,9,1);
  tryarrayslice(WSTORM,  3,9,1);
  
  //}}}
  //{{{  save to file
  
  var d   = new Date();
  var out = '';
  
  out = out + 'var VALUE_VECTOR = [' + VALUE_VECTOR.toString() + '];';
  out = out + '\r\n\r\n';
  
  out = out + 'var WPAWN_PSTS = [' + WPAWN_PSTS.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var WKNIGHT_PSTS = [' + WKNIGHT_PSTS.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var WBISHOP_PSTS = [' + WBISHOP_PSTS.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var WROOK_PSTS = [' + WROOK_PSTS.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var WQUEEN_PSTS = [' + WQUEEN_PSTS.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var WKING_PSTS = [' + WKING_PSTS.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var WPAWN_PSTE = [' + WPAWN_PSTE.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var WKNIGHT_PSTE = [' + WKNIGHT_PSTE.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var WBISHOP_PSTE = [' + WBISHOP_PSTE.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var WROOK_PSTE = [' + WROOK_PSTE.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var WQUEEN_PSTE = [' + WQUEEN_PSTE.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var WKING_PSTE = [' + WKING_PSTE.toString() + '];';
  out = out + '\r\n\r\n';
  
  out = out + 'var BPAWN_PSTS = [' + BPAWN_PSTS.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var BKNIGHT_PSTS = [' + BKNIGHT_PSTS.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var BBISHOP_PSTS = [' + BBISHOP_PSTS.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var BROOK_PSTS = [' + BROOK_PSTS.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var BQUEEN_PSTS = [' + BQUEEN_PSTS.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var BKING_PSTS = [' + BKING_PSTS.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var BPAWN_PSTE = [' + BPAWN_PSTE.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var BKNIGHT_PSTE = [' + BKNIGHT_PSTE.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var BBISHOP_PSTE = [' + BBISHOP_PSTE.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var BROOK_PSTE = [' + BROOK_PSTE.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var BQUEEN_PSTE = [' + BQUEEN_PSTE.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var BKING_PSTE = [' + BKING_PSTE.toString() + '];';
  out = out + '\r\n\r\n';
  
  out = out + 'var WOUTPOST = [' + WOUTPOST.toString() + '];';
  out = out + '\r\n\r\n';
  
  out = out + 'var BOUTPOST = [' + BOUTPOST.toString() + '];';
  out = out + '\r\n\r\n';
  
  out = out + 'var EV = [' + EV.toString() + '];';
  out = out + '\r\n\r\n';
  
  out = out + 'var imbalN_S = [' + imbalN_S.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var imbalN_E = [' + imbalN_E.toString() + '];';
  out = out + '\r\n\r\n';
  
  out = out + 'var imbalB_S = [' + imbalB_S.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var imbalB_E = [' + imbalB_E.toString() + '];';
  out = out + '\r\n\r\n';
  
  out = out + 'var imbalR_S = [' + imbalR_S.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var imbalR_E = [' + imbalR_E.toString() + '];';
  out = out + '\r\n\r\n';
  
  out = out + 'var imbalQ_S = [' + imbalQ_S.toString() + '];';
  out = out + '\r\n\r\n';
  out = out + 'var imbalQ_E = [' + imbalQ_E.toString() + '];';
  out = out + '\r\n\r\n';
  
  out = out + 'var WSHELTER = [' + WSHELTER.toString() + '];';
  out = out + '\r\n\r\n';
  
  out = out + 'var WSTORM = [' + WSTORM.toString() + '];';
  out = out + '\r\n\r\n';
  
  out = out + 'var ATT_W = [' + ATT_W.toString() + '];';
  out = out + '\r\n\r\n';
  
  out = out + 'var PAWN_PASSED = [' + PAWN_PASSED.toString() + '];';
  out = out + '\r\n\r\n';
  
  out = out + '// bestErr='+bestErr;
  out = out + '\r\n\r\n';
  
  out = out + '// last update '+d;
  out = out + '\r\n\r\n';
  
  fs.writeFileSync('texeltune.txt',out);
  
  //}}}

  var t2 = Date.now();

  console.log('iter =',iter,'tries =',tries,'changes =',changes,'min err =',bestErr,'iter time =',(t2-t1)/1000/60,'mins');

  tries   = 0;
  changes = 0;
  iter++;
}

//}}}

console.log('**************');
console.log('final error =',bestErr);

//}}}

process.exit();

