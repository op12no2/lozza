
const PHASE_INC = new Uint8Array(7);
PHASE_INC[KNIGHT] = 1;
PHASE_INC[BISHOP] = 1;
PHASE_INC[ROOK]   = 2;
PHASE_INC[QUEEN]  = 4;

// sq88 to sq64 lookup: sq64 = rank * 8 + file (a1=0 .. h8=63)
// pre-flipped W arrays mean both colours use the same mapping
const g_sq64 = new Uint8Array(128);
for (let r = 0; r < 8; r++)
  for (let f = 0; f < 8; f++)
    g_sq64[r * 16 + f] = r * 8 + f;

function evaluate() {

  const b  = g_board;
  const pl = g_pieces;

  let mgS_W = 0, mgS_B = 0, egS_W = 0, egS_B = 0;
  let phase = 0;

  // white pieces (base = 0)
  const wCount = pl[0];
  for (let i = 1; i <= wCount; i++) {
    const sq = pl[i];
    const pt = b[sq] & 7;
    const matIdx = pt - 1;
    const pstIdx = pt * 64 - 58 + g_sq64[sq];
    mgS_W += g_mgW[matIdx] + g_mgW[pstIdx];
    egS_W += g_egW[matIdx] + g_egW[pstIdx];
    phase += PHASE_INC[pt];
  }

  // black pieces (base = 17)
  const bCount = pl[17];
  for (let i = 1; i <= bCount; i++) {
    const sq = pl[17 + i];
    const pt = b[sq] & 7;
    const matIdx = pt - 1;
    const pstIdx = pt * 64 - 58 + g_sq64[sq];
    mgS_B += g_mgB[matIdx] + g_mgB[pstIdx];
    egS_B += g_egB[matIdx] + g_egB[pstIdx];
    phase += PHASE_INC[pt];
  }

  // tapered eval
  const mgScore = g_stm === WHITE ? mgS_W - mgS_B : mgS_B - mgS_W;
  const egScore = g_stm === WHITE ? egS_W - egS_B : egS_B - egS_W;
  let mgPhase = phase;
  if (mgPhase > 24) mgPhase = 24;
  const egPhase = 24 - mgPhase;

  return (mgScore * mgPhase + egScore * egPhase) / 24 | 0;
}

