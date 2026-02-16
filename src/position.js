function position (bd, turn, rights, ep, moves) {

  for (let i=0; i < nodes.length; i++)
    initNode(nodes[i]);

  loHash = 0;
  hiHash = 0;

  // turn
  
  if (turn == 'w')
    bdTurn = WHITE;
  
  else {
    bdTurn = BLACK;
    loHash ^= loTurn;
    hiHash ^= hiTurn;
  }
  
  // rights
  
  bdRights = 0;
  
  for (let i=0; i < rights.length; i++) {
  
    var ch = rights.charAt(i);
  
    if (ch == 'K') bdRights |= WHITE_RIGHTS_KING;
    if (ch == 'Q') bdRights |= WHITE_RIGHTS_QUEEN;
    if (ch == 'k') bdRights |= BLACK_RIGHTS_KING;
    if (ch == 'q') bdRights |= BLACK_RIGHTS_QUEEN;
  }
  
  loHash ^= loRights[bdRights];
  hiHash ^= hiRights[bdRights];
  
  // board
  
  bdB.fill(EDGE);
  
  for (var i=0; i < B88.length; i++)
    bdB[B88[i]] = 0;
  
  bdZ.fill(NO_Z);
  
  wCounts.fill(0);
  bCounts.fill(0);
  
  wList.fill(EMPTY);
  bList.fill(EMPTY);
  
  wCount = 1;
  bCount = 1;
  
  let sq = 0;
  
  for (let j=0; j < bd.length; j++) {
  
    const ch  = bd.charAt(j);
    const chn = parseInt(ch);
  
    while (bdB[sq] === EDGE)
      sq++;
  
    if (isNaN(chn)) {
  
      if (ch != '/') {
  
        const obj   = MAP[ch];
        const piece = obj & PIECE_MASK;
        const col   = obj & COLOR_MASK;
  
        bdB[sq] = obj;
  
        if (col === WHITE) {
          if (piece === KING) {
            wList[0] = sq;
            bdZ[sq] = 0;
            wCounts[KING]++;
          }
          else {
            wList[wCount] = sq;
            bdZ[sq] = wCount;
            wCounts[piece]++;
            wCount++;
          }
        }
  
        else {
          if (piece === KING) {
            bList[0] = sq;
            bdZ[sq] = 0;
            bCounts[KING]++;
          }
          else {
            bList[bCount] = sq;
            bdZ[sq] = bCount;
            bCounts[piece]++;
            bCount++;
          }
        }
  
        loHash ^= loObjPieces[(obj << 8) + sq];
        hiHash ^= hiObjPieces[(obj << 8) + sq];
  
        sq++;
      }
    }
  
    else {
  
      for (let k=0; k < chn; k++) {
        bdB[sq] = 0;
        sq++;
      }
    }
  
  }
  
  // ep
  
  if (ep.length === 2)
    bdEp = COORDS.indexOf(ep)
  else
    bdEp = 0;
  
  loHash ^= loEP[bdEp];
  hiHash ^= hiEP[bdEp];
  

  repLo = 0;
  repHi = 0;

  for (let i=0; i < moves.length; i++) {
    // play move
    
    const moveStr = moves[i];
    
    let move = 0;
    
    genMoves(rootNode, bdTurn);
    
    while ((move = getNextMove(rootNode)) !== 0) {
    
      const moveStr2 = formatMove(move);
    
      if (moveStr == moveStr2) {
        makeMoveA(rootNode, move);
        bdTurn ^= COLOR_MASK;
        break;
      }
    
    }
    
  }

  // compact
  
  const wList2 = new Uint8Array(16);
  const bList2 = new Uint8Array(16);
  
  let next = 0;
  
  for (let i=0; i < 16; i++) {
    const sq = wList[i];
    if (sq) {
      bdZ[sq] = next;
      wList2[next++] = sq;
    }
  }
  
  wList.set(wList2);
  
  next = 0;
  
  for (let i=0; i < 16; i++) {
    const sq = bList[i];
    if (sq) {
      bdZ[sq] = next;
      bList2[next++] = sq;
    }
  }
  
  bList.set(bList2);
  
  // ue
  
  net_h1_a.set(net_h1_b);
  net_h2_a.set(net_h1_b);
  
  for (let sq=0; sq < 64; sq++) {
  
    const fr    = B88[sq];
    const frObj = bdB[fr];
  
    if (frObj === 0)
      continue;
  
    const off1 = IMAP[(frObj << 8) + fr];
  
    for (let h=0; h < NET_H1_SIZE; h++) {
      const idx1 = off1 + h;
      net_h1_a[h] += net_h1_w_flat[idx1];
      net_h2_a[h] += net_h2_w_flat[idx1];
    }
  
  }
  

  initNode(rootNode);
  objHistory.fill(BASE_HISSLIDE);

}

