


// stats

let statsStartTime = 0;
let statsNodes     = 0;
let statsMoveTime  = 0;
let statsMaxNodes  = 0;
let statsTimeOut   = 0;
let statsSelDepth  = 0;
let statsBestMove  = 0;
let statsBestScore = 0;

let multiPV      = 1;
let multiPVMoves = [];

// initStats

function initStats () {

  statsStartTime = now();
  statsNodes     = 0;
  statsMoveTime  = 0;
  statsMaxNodes  = 0;
  statsTimeOut   = 0;
  statsSelDepth  = 0;
  statsBestMove  = 0;
  statsBestScore = 0;

}

// checkTime

function checkTime () {

  if (statsBestMove && statsMoveTime > 0 && ((now() - statsStartTime) >= statsMoveTime))

    statsTimeOut = 1;

  if (statsBestMove && statsMaxNodes > 0 && statsNodes >= statsMaxNodes * 100)

    statsTimeOut = 1;

}

