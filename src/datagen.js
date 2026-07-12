
// datagen
//
// Self play data generation in viriformat, mirroring cwtch's
// src/datagen.c so files from both engines can be mixed.  Node
// only.  Use bin/datagen to run multiple processes.
//

const DG_RANDOM_PLIES   = 10;
const DG_SEARCH_NODES   = 5000;
const DG_DRAW_SCORE     = 10;
const DG_DRAW_COUNT     = 10;
const DG_DRAW_PLY       = 40;
const DG_MAX_GAME_MOVES = 512;
const DG_REPORT_SECS    = 10;
const DG_FILE_PREFIX    = 'data';

// viriformat constants

const VIRI_TYPE_EP     = 1;
const VIRI_TYPE_CASTLE = 2;
const VIRI_TYPE_PROMO  = 3;

const VIRI_WDL_BLACK_WIN = 0;
const VIRI_WDL_DRAW      = 1;
const VIRI_WDL_WHITE_WIN = 2;

const dgLegal   = new Uint32Array(MAX_MOVES);
const dgGameBuf = new Uint8Array(32 + DG_MAX_GAME_MOVES * 4 + 4);

// rng (splitmix32, local to datagen, seeded per process)

let dgSeed = 0;

function dgSeedRng () {

  dgSeed = (Date.now() ^ Math.imul(process.pid, 0x9E3779B9)) | 0;

  if (dgSeed === 0)
    dgSeed = 1;

}

function dgRand () {

  dgSeed = (dgSeed + 0x9E3779B9) | 0;

  let z = dgSeed;

  z = Math.imul(z ^ (z >>> 16), 0x21F0AAAD);
  z = Math.imul(z ^ (z >>> 15), 0x735A2D97);
  z = z ^ (z >>> 15);

  return z >>> 0;

}

// dgTo64
//
// 144 board square to viriformat square; a1=0, h8=63.
//

function dgTo64 (sq) {

  return ((RANK[sq] - 1) << 3) | (FILE[sq] - 1);

}

// dgPackBoard
//
// viriformat PackedBoard from the current global board into buf[0..31].
// The wdl byte (30) is patched in at the end of the game.
//

function dgPackBoard (buf) {

  buf.fill(0, 0, 32);

  let occLo = 0;
  let occHi = 0;
  let idx   = 0;

  for (let i=0; i < 64; i++) {
    // a1, b1, ..., h8

    const sq  = B88[((7 - (i >>> 3)) << 3) | (i & 7)];
    const obj = bdB[sq];

    if (obj === 0)
      continue;

    if (i < 32)
      occLo |= 1 << i;
    else
      occHi |= 1 << (i - 32);

    let type = (obj & PIECE_MASK) - 1;  // PNBRQK = 0-5

    if (type === ROOK - 1) {
      // unmoved rook = 6
      if (sq === SQH1 && (bdRights & WHITE_RIGHTS_KING)  !== 0) type = 6;
      if (sq === SQA1 && (bdRights & WHITE_RIGHTS_QUEEN) !== 0) type = 6;
      if (sq === SQH8 && (bdRights & BLACK_RIGHTS_KING)  !== 0) type = 6;
      if (sq === SQA8 && (bdRights & BLACK_RIGHTS_QUEEN) !== 0) type = 6;
    }

    const nibble  = (((obj & COLOR_MASK) >>> 3) << 3) | type;
    const byteIdx = 8 + (idx >>> 1);

    if ((idx & 1) !== 0)
      buf[byteIdx] |= nibble << 4;
    else
      buf[byteIdx] = nibble;

    idx++;

  }

  // bytes 0-7 occupancy

  buf[0] = occLo         & 0xFF;
  buf[1] = (occLo >>> 8)  & 0xFF;
  buf[2] = (occLo >>> 16) & 0xFF;
  buf[3] = (occLo >>> 24) & 0xFF;
  buf[4] = occHi          & 0xFF;
  buf[5] = (occHi >>> 8)  & 0xFF;
  buf[6] = (occHi >>> 16) & 0xFF;
  buf[7] = (occHi >>> 24) & 0xFF;

  // byte 24 stm and ep

  const ep = bdEp !== 0 ? dgTo64(bdEp) : 64;

  buf[24] = ((bdTurn >>> 3) << 7) | ep;

  // byte 25 halfmove clock (see the rep comment in makemove.js)

  buf[25] = Math.min(repHi - repLo, 255);

  // bytes 26-29 fullmove and eval (0), byte 30 wdl (patched later), byte 31 extra (0)

}

// dgMoveToViri

function dgMoveToViri (move) {

  const fr = (move & MOVE_FR_MASK) >>> MOVE_FR_BITS;
  let   to = (move & MOVE_TO_MASK) >>> MOVE_TO_BITS;

  let type  = 0;
  let promo = 0;

  if ((move & MOVE_EPTAKE_MASK) !== 0)
    type = VIRI_TYPE_EP;

  else if ((move & MOVE_CASTLE_MASK) !== 0) {
    // king takes rook
    type = VIRI_TYPE_CASTLE;
    if      (to === G1) to = H1;
    else if (to === C1) to = A1;
    else if (to === G8) to = H8;
    else if (to === C8) to = A8;
  }

  else if ((move & MOVE_PROMOTE_MASK) !== 0) {
    type  = VIRI_TYPE_PROMO;
    promo = (move & MOVE_PROMAS_MASK) >>> MOVE_PROMAS_BITS;  // NBRQ = 0-3
  }

  return dgTo64(fr) | (dgTo64(to) << 6) | (promo << 12) | (type << 14);

}

// dgLegalMoves

function dgLegalMoves (out) {

  const node     = rootNode;
  const turn     = bdTurn;
  const nextTurn = turn ^ COLOR_MASK;

  node.inCheck = isKingAttacked(nextTurn);

  cache(node);
  genMoves(node, turn);

  let n    = 0;
  let move = 0;

  while ((move = getNextMove(node)) !== 0) {

    makeMoveA(node, move);

    if ((move & MOVE_LEGAL_MASK) !== 0 || isKingAttacked(nextTurn) === 0)
      out[n++] = move;

    unmakeMove(node, move);

    uncacheA(node);

  }

  return n;

}

// dgPlayMove
//
// Make a move permanently at the root.  The accumulator update lands
// in the child node, so resolve it there and pull it back to the root.
//

function dgPlayMove (move) {

  const child = rootNode.childNode;

  makeMoveA(rootNode, move);

  resolveAccs(child);

  rootNode.net_h1_a.set(child.net_h1_a);
  rootNode.net_h2_a.set(child.net_h2_a);

  bdTurn ^= COLOR_MASK;

}

// dgPlayGame
//
// Play one game and write it to fd.  Returns the number of scored
// positions written; 0 means the game was discarded.
//

async function dgPlayGame (fd) {

  const buf = dgGameBuf;

  newGame();
  position('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', 'w', 'KQkq', '-', []);

  // random opening; + 0 or 1 extra ply to randomise stm

  const numRandom = DG_RANDOM_PLIES + (dgRand() & 1);

  for (let i=0; i < numRandom; i++) {

    const n = dgLegalMoves(dgLegal);

    if (n === 0)
      return 0;

    dgPlayMove(dgLegal[dgRand() % n]);

  }

  if (isDraw() !== 0)
    return 0;

  // save the starting position (after random plies)

  dgPackBoard(buf);

  // scored play

  let numEntries = 0;
  let drawCount  = 0;
  let wdl        = VIRI_WDL_DRAW;

  for (let ply=0; ply < DG_MAX_GAME_MOVES; ply++) {

    const stm     = bdTurn;
    const inCheck = isKingAttacked(stm ^ COLOR_MASK);
    const n       = dgLegalMoves(dgLegal);

    if (n === 0) {
      if (inCheck !== 0)
        wdl = stm === WHITE ? VIRI_WDL_BLACK_WIN : VIRI_WDL_WHITE_WIN;
      break;
    }

    // search

    initStats();

    statsMaxNodes = DG_SEARCH_NODES;

    await go(MAX_PLY);

    let best = statsBestMove;

    const score = statsBestScore;

    if (best === 0)
      best = dgLegal[0];

    const whiteScore = stm === WHITE ? score : -score;

    // record move + score

    const viri = dgMoveToViri(best);
    const off  = 32 + numEntries * 4;

    buf[off]   = viri            & 0xFF;
    buf[off+1] = (viri >>> 8)    & 0xFF;
    buf[off+2] = whiteScore      & 0xFF;
    buf[off+3] = (whiteScore >> 8) & 0xFF;

    numEntries++;

    // adjudication

    if (Math.abs(score) <= DG_DRAW_SCORE)
      drawCount++;
    else
      drawCount = 0;

    if (drawCount >= DG_DRAW_COUNT && ply >= DG_DRAW_PLY) {
      wdl = VIRI_WDL_DRAW;
      break;
    }

    // play the move

    dgPlayMove(best);

    // draw checks

    if (isDraw() !== 0) {
      wdl = VIRI_WDL_DRAW;
      break;
    }

  }

  if (numEntries === 0)
    return 0;

  buf[30] = wdl;

  // terminator

  let len = 32 + numEntries * 4;

  buf[len]   = 0;
  buf[len+1] = 0;
  buf[len+2] = 0;
  buf[len+3] = 0;

  len += 4;

  fs.writeSync(fd, buf, 0, len);

  return numEntries;

}

// dgEta

function dgEta (ms) {

  const s = ms / 1000 | 0;
  const d = s / 86400 | 0;
  const h = (s % 86400) / 3600 | 0;
  const m = (s % 3600) / 60 | 0;

  const mm = (m < 10 ? '0' : '') + m;

  if (d > 0)
    return d + 'd ' + (h < 10 ? '0' : '') + h + ':' + mm;

  return h + ':' + mm;

}

// datagen

async function datagen (directory, targetPositions) {

  dgSeedRng();

  const filename = directory + '/' + DG_FILE_PREFIX + dgRand() + '.vf';

  let fd = 0;

  try {
    fd = fs.openSync(filename, 'w');
  }
  catch (e) {
    console.log('error: cannot open ' + filename);
    return;
  }

  console.log('datagen: writing to ' + filename + ', target ' + targetPositions + ' positions');

  silentMode = 1;

  const startTime = Date.now();

  let totalPositions = 0;
  let totalGames     = 0;
  let lastReport     = startTime;

  // stop once the target position count is reached; the current game always
  // completes, so the final file slightly overshoots the target.

  while (totalPositions < targetPositions) {

    totalPositions += await dgPlayGame(fd);
    totalGames++;

    const timeNow = Date.now();

    if (timeNow - lastReport >= DG_REPORT_SECS * 1000) {

      const elapsed   = timeNow - startTime;
      const pps       = elapsed ? (totalPositions * 1000 / elapsed | 0) : 0;
      const remaining = Math.max(targetPositions - totalPositions, 0);
      const etaMs     = pps ? (remaining * 1000 / pps) : 0;
      const pct       = (100 * totalPositions / targetPositions).toFixed(1);

      console.log('datagen: ' + totalPositions + '/' + targetPositions + ' positions (' + pct + '%) ' + totalGames + ' games ' + pps + ' pos/s [' + dgEta(etaMs) + ' left]');

      lastReport = timeNow;

    }

  }

  silentMode = 0;

  fs.closeSync(fd);

  console.log('datagen: done. ' + totalPositions + ' positions ' + totalGames + ' games written to ' + filename);

}
