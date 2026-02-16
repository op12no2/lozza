let ttDefault = 16;  // mb
let ttSize    = 1;
let ttMask    = 0;

let ttLo    = new Int32Array(ttSize);
let ttHi    = new Int32Array(ttSize);
let ttType  = new Uint8Array(ttSize);
let ttDepth = new Int8Array(ttSize);
let ttMove  = new Uint32Array(ttSize);
let ttEval  = new Int16Array(ttSize);
let ttScore = new Int16Array(ttSize);
// ===
const ttWidth = 18;
// ===

let ttHashUsed = 0;

function ttResize(N_MB) {

  const bytesPerEntry  = ttWidth;
  const requestedBytes = N_MB * 1024 * 1024;
  const entriesNeeded  = requestedBytes / bytesPerEntry;
  const pow2           = Math.ceil(Math.log2(entriesNeeded));

  ttSize = 1 << pow2;
  ttMask = ttSize - 1;

  ttLo    = new Int32Array(ttSize);
  ttHi    = new Int32Array(ttSize);
  ttType  = new Uint8Array(ttSize);
  ttDepth = new Int8Array(ttSize);
  ttMove  = new Uint32Array(ttSize);
  ttEval  = new Int16Array(ttSize);
  ttScore = new Int16Array(ttSize);

  const sm   = silentMode;
  silentMode = 0;

  uciSend('info tt bits', pow2, 'entries', ttSize, '(0x' + ttSize.toString(16) + ')', 'mb', ttWidth * ttSize);

  silentMode = sm;

}

function ttPut (type, depth, score, move, ply, alpha, beta, ev) {

  const idx = loHash & ttMask;

  if (depth === 0 && ttType[idx] !== TT_EMPTY && ttDepth[idx] > 0)
    return;

  if (ttType[idx] === TT_EMPTY)
    ttHashUsed++;

  if (score <= -MINMATE && score >= -MATE)
    score -= ply;

  else if (score >= MINMATE && score <= MATE)
    score += ply;

  ttLo[idx]    = loHash;
  ttHi[idx]    = hiHash;
  ttType[idx]  = type;
  ttDepth[idx] = depth;
  ttScore[idx] = score;
  ttEval[idx]  = ev;

  if (move !== 0)
    ttMove[idx] = move & MOVE_CLEAN_MASK;

}

// ttGet

function ttGet (node, depth, alpha, beta) {

  const idx   = loHash & ttMask;
  const type  = ttType[idx];

  node.hashMove = 0;
  node.hashEval = INF;

  if (type === TT_EMPTY)
    return TTSCORE_UNKNOWN;

  const lo = ttLo[idx];
  const hi = ttHi[idx];

  if (lo !== loHash || hi !== hiHash)
    return TTSCORE_UNKNOWN;

  //
  // Set the hash move before the depth check
  // so that iterative deepening works.
  //

  if (ttValidate(ttMove[idx]) !== 0)
    node.hashMove = ttMove[idx];

  node.hashEval = ttEval[idx];

  if (ttDepth[idx] < depth)
    return TTSCORE_UNKNOWN;

  var score = ttScore[idx];

  if (score <= -MINMATE && score >= -MATE)
    score += node.ply;

  else if (score >= MINMATE && score <= MATE)
    score -= node.ply;

  if (type === TT_EXACT)
    return score;

  if (type === TT_ALPHA && score <= alpha)
    return score;

  if (type === TT_BETA && score >= beta)
    return score;

  return TTSCORE_UNKNOWN;

}

// ttUpdateEval

function ttUpdateEval (ev) {

  const idx = loHash & ttMask;

  if (ttType[idx] !== TT_EMPTY && ttLo[idx] === loHash && ttHi[idx] === hiHash)
    ttEval[idx] = ev;

}

// ttInit

function ttInit () {

  ttType.fill(TT_EMPTY);
  ttMove.fill(0);

  ttHashUsed = 0;

}

// ttValidate

function ttValidate (move) {

  const b = bdB;

  const fr    = (move & MOVE_FR_MASK   ) >>> MOVE_FR_BITS;
  const frObj = (move & MOVE_FROBJ_MASK) >>> MOVE_FROBJ_BITS;

  if (b[fr] !== frObj)
    return 0;

  const to    = (move & MOVE_TO_MASK   ) >>> MOVE_TO_BITS;
  const toObj = (move & MOVE_TOOBJ_MASK) >>> MOVE_TOOBJ_BITS;

  if (b[to] !== toObj)
    return 0;

  return 1;

}

