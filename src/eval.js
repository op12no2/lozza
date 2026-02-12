
const PHASE_INC = new Uint8Array(7);
PHASE_INC[KNIGHT] = 1;
PHASE_INC[BISHOP] = 1;
PHASE_INC[ROOK]   = 2;
PHASE_INC[QUEEN]  = 4;

// sq88 to sq64 lookup: rank * 8 + file (a1=0 .. h8=63)
// pre-flipped W arrays mean both colours use the same mapping
const sq64 = new Uint8Array(128);
for (let r = 0; r < 8; r++)
  for (let f = 0; f < 8; f++)
    sq64[r * 16 + f] = r * 8 + f;

// weight array overlays
const matMgW    = new Int16Array(g_mgW.buffer, 0,       6);
const matEgW    = new Int16Array(g_egW.buffer, 0,       6);
const matMgB    = new Int16Array(g_mgB.buffer, 0,       6);
const matEgB    = new Int16Array(g_egB.buffer, 0,       6);

const pstMgW    = new Int16Array(g_mgW.buffer, 6 * 2,   384);
const pstEgW    = new Int16Array(g_egW.buffer, 6 * 2,   384);
const pstMgB    = new Int16Array(g_mgB.buffer, 6 * 2,   384);
const pstEgB    = new Int16Array(g_egB.buffer, 6 * 2,   384);

const ppMgW     = new Int16Array(g_mgW.buffer, 390 * 2, 6);
const ppEgW     = new Int16Array(g_egW.buffer, 390 * 2, 6);
const ppMgB     = new Int16Array(g_mgB.buffer, 390 * 2, 6);
const ppEgB     = new Int16Array(g_egB.buffer, 390 * 2, 6);

function evaluate() {

  const b  = g_board;
  const pl = g_pieces;

  let mgW = 0, mgB = 0, egW = 0, egB = 0;
  let phase = 0;

  // white pieces (base = 0)
  const wCount = pl[0];
  for (let i = 1; i <= wCount; i++) {
    const sq = pl[i];
    const pt = b[sq] & 7;
    const pst = (pt - 1) * 64 + sq64[sq];
    mgW += matMgW[pt - 1] + pstMgW[pst];
    egW += matEgW[pt - 1] + pstEgW[pst];
    phase += PHASE_INC[pt];
  }

  // black pieces (base = 17)
  const bCount = pl[17];
  for (let i = 1; i <= bCount; i++) {
    const sq = pl[17 + i];
    const pt = b[sq] & 7;
    const pst = (pt - 1) * 64 + sq64[sq];
    mgB += matMgB[pt - 1] + pstMgB[pst];
    egB += matEgB[pt - 1] + pstEgB[pst];
    phase += PHASE_INC[pt];
  }

  // passed pawns - white
  for (let i = 1; i <= wCount; i++) {
    const sq = pl[i];
    if ((b[sq] & 7) !== PAWN) continue;
    const rank = sq >> 4;
    const file = sq & 7;
    let passed = 1;
    for (let r = rank + 1; r <= 6; r++) {
      const rsq = r << 4;
      if (file > 0 && b[rsq + file - 1] === BPAWN) { passed = 0; break; }
      if (b[rsq + file] === BPAWN) { passed = 0; break; }
      if (file < 7 && b[rsq + file + 1] === BPAWN) { passed = 0; break; }
    }
    if (passed) {
      mgW += ppMgW[rank - 1];
      egW += ppEgW[rank - 1];
    }
  }

  // passed pawns - black
  for (let i = 1; i <= bCount; i++) {
    const sq = pl[17 + i];
    if ((b[sq] & 7) !== PAWN) continue;
    const rank = sq >> 4;
    const file = sq & 7;
    let passed = 1;
    for (let r = rank - 1; r >= 1; r--) {
      const rsq = r << 4;
      if (file > 0 && b[rsq + file - 1] === WPAWN) { passed = 0; break; }
      if (b[rsq + file] === WPAWN) { passed = 0; break; }
      if (file < 7 && b[rsq + file + 1] === WPAWN) { passed = 0; break; }
    }
    if (passed) {
      mgB += ppMgB[rank - 1];
      egB += ppEgB[rank - 1];
    }
  }

  // tapered eval
  const mgScore = g_stm === WHITE ? mgW - mgB : mgB - mgW;
  const egScore = g_stm === WHITE ? egW - egB : egB - egW;
  let mgPhase = phase;
  if (mgPhase > 24) mgPhase = 24;
  const egPhase = 24 - mgPhase;

  return (mgScore * mgPhase + egScore * egPhase) / 24 | 0;

}

