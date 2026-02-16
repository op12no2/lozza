function isDraw () {

  if (repHi - repLo > 100)
    return 1;

  for (let i=repHi-5; i >= repLo; i -= 2) {

    if (repLoHash[i] === loHash && repHiHash[i] === hiHash)
      return 1;

  }

  const numPieces = wCount + bCount;

  if (numPieces === 2)
    return 1;

  const wNumBishops = wCounts[BISHOP];
  const wNumKnights = wCounts[KNIGHT];

  const bNumBishops = bCounts[BISHOP];
  const bNumKnights = bCounts[KNIGHT];

  if (numPieces === 3 && (wNumKnights !== 0 || wNumBishops !== 0 || bNumKnights !== 0 || bNumBishops !== 0))
    return 1;

  return 0;

}

