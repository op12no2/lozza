function boardCheck (turn) {

  const a1 = new Int32Array(NET_H1_SIZE);
  const a2 = new Int32Array(NET_H1_SIZE);

  // hash
  
  var loH = 0;
  var hiH = 0;
  
  if (turn) {
    loH ^= loTurn;
    hiH ^= hiTurn;
  }
  
  loH ^= loRights[bdRights];
  hiH ^= hiRights[bdRights];
  
  loH ^= loEP[bdEp];
  hiH ^= hiEP[bdEp];
  
  for (var sq=0; sq<144; sq++) {
  
    var obj = bdB[sq];
  
    if (obj === 0 || obj === EDGE)
      continue;
  
    var piece = obj & PIECE_MASK;
    var col   = obj & COLOR_MASK;
  
    loH ^= loObjPieces[(obj << 8) + sq];
    hiH ^= hiObjPieces[(obj << 8) + sq];
  
  }
  
  if (loH !== loHash)
    console.log('*************** LO',loH,loHash);
  
  if (hiH !== hiHash)
    console.log('*************** HI',hiH,hiHash);
  
  // accumulators
  
  a1.set(net_h1_b);
  a2.set(net_h1_b);
  
  for (let sq=0; sq < 64; sq++) {
  
    const fr    = B88[sq];
    const frObj = bdB[fr];
  
    if (frObj === 0)
      continue;
  
    const off1 = IMAP[(frObj << 8) + fr];
  
    for (let h=0; h < NET_H1_SIZE; h++) {
      const idx1 = off1 + h;
      a1[h] += net_h1_w_flat[idx1];
      a2[h] += net_h2_w_flat[idx1];
    }
  
  }
  
  for (let i=0; i < NET_H1_SIZE; i++) {
    if (a1[i] !== net_h1_a[i])
      console.log('****** A1', i, a1[i], net_h1_a[i]);
    if (a2[i] !== net_h2_a[i])
      console.log('****** A2', i, a2[i], net_h2_a[i]);
  }

}

