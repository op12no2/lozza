function checkHash() {

  const b = g_board;

  let lo = 0;
  let hi = 0;

  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const piece = b[sq];
    if (piece) {
      lo ^= loPieces[piece][sq];
      hi ^= hiPieces[piece][sq];
    }
  }

  lo ^= loRights[g_rights];
  hi ^= hiRights[g_rights];

  if (g_ep) {
    lo ^= loEP[g_ep];
    hi ^= hiEP[g_ep];
  }

  if (g_stm === BLACK) {
    lo ^= loStm;
    hi ^= hiStm;
  }

  if (lo !== g_loHash || hi !== g_hiHash) {
    uciSend('info string HASH MISMATCH lo ' + g_loHash + ' expected ' + lo + ' hi ' + g_hiHash + ' expected ' + hi);
  }

}
