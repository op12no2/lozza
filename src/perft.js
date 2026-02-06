function perft(ply, depth) {

  if (depth === 0)
    return 1;

  const node = g_ss[ply];
  const stm = g_stm;
  const nstm = stm ^ BLACK;
  const kix = (stm >>> 3) * 17 + 1; // our king square index in piece list
  const moves = node.moves;
  
  let total = 0;

  const numMoves = genMoves(node);

  for (let i = 0; i < numMoves; i++) {

    const move = moves[i];

    make(node, move);
    if (!isAttacked(g_pieces[kix], nstm))
      total += perft(ply + 1, depth - 1);
    unmake(node, move);
  }

  return total;
}

function perftTests(maxDepth) {

  let totalNodes = 0;
  let fails = 0;
  let count = 0;
  const t1 = Date.now();

  for (let i = 0; i < PERFTFENS.length; i++) {

    const entry = PERFTFENS[i];
    const depth = entry[1];

    if (maxDepth && depth > maxDepth)
      continue;

    const fen = entry[0].replace(/\s+/g, ' ').split(' ');
    const expect = entry[2];
    const id  = entry[3].trim();

    position(fen[1], fen[2], fen[3], fen[4]);

    const n = perft(0, depth);
    totalNodes += n;
    count++;

    const ok = n === expect;
    if (!ok)
      fails++;

    uciSend(id + ' depth ' + depth + ' ' + (ok ? 'ok' : '*** FAIL *** got ' + n + ' expected ' + expect));
  }

  const t2 = Date.now();
  const ms = t2 - t1;
  const nps = ms ? Math.floor(totalNodes / ms * 1000) : 0;

  uciSend('');
  uciSend(count + ' tests, ' + fails + ' fails, ' + totalNodes + ' nodes in ' + ms + ' ms ' + nps + ' nps');
}

