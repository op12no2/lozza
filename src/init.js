// init

const nodeHost = (typeof process) != 'undefined';

if (!nodeHost) {
  onmessage = function(e) {
    uciExec(e.data);
  }
}

const fs = (nodeHost) ? require('fs') : 0;


let silentMode = 0;

function initOnce () {

  // init ADJACENT
  
  ADJACENT[1]  = 1;
  ADJACENT[11] = 1;
  ADJACENT[12] = 1;
  ADJACENT[13] = 1;
  
  // init net
  //
  // IMAP is used to map a piece+colour to an offset in the flat weights array.
  // Used when updating the accumulators.
  //
  
  for (let i = 0; i < 64; i++) {
  
    const j = B88[i];
  
    IMAP[(W_PAWN << 8) + j]    =   (0 + (PAWN-1)   * 64 + i) * NET_H1_SIZE;
    IMAP[(W_KNIGHT << 8) + j]  =   (0 + (KNIGHT-1) * 64 + i) * NET_H1_SIZE;
    IMAP[(W_BISHOP << 8) + j]  =   (0 + (BISHOP-1) * 64 + i) * NET_H1_SIZE;
    IMAP[(W_ROOK << 8) + j]    =   (0 + (ROOK-1)   * 64 + i) * NET_H1_SIZE;
    IMAP[(W_QUEEN << 8) + j]   =   (0 + (QUEEN-1)  * 64 + i) * NET_H1_SIZE;
    IMAP[(W_KING << 8) + j]    =   (0 + (KING-1)   * 64 + i) * NET_H1_SIZE;
  
    IMAP[(B_PAWN << 8) + j]    = (384 + (PAWN-1)   * 64 + i) * NET_H1_SIZE;
    IMAP[(B_KNIGHT << 8) + j]  = (384 + (KNIGHT-1) * 64 + i) * NET_H1_SIZE;
    IMAP[(B_BISHOP << 8) + j]  = (384 + (BISHOP-1) * 64 + i) * NET_H1_SIZE;
    IMAP[(B_ROOK << 8) + j]    = (384 + (ROOK-1)   * 64 + i) * NET_H1_SIZE;
    IMAP[(B_QUEEN << 8) + j]   = (384 + (QUEEN-1)  * 64 + i) * NET_H1_SIZE;
    IMAP[(B_KING << 8) + j]    = (384 + (KING-1)   * 64 + i) * NET_H1_SIZE;
  
  }
  
  netLoad();
  
  // init nodes
  
  for (let i=0; i < nodes.length; i++) {
    nodes[i] = new nodeStruct();
    seal(nodes[i]);
    nodes[i].ply = i;
  }
  
  for (let i=0; i < nodes.length-1; i++)
    nodes[i].childNode = nodes[i+1];
  
  for (let i=1; i < nodes.length; i++)
    nodes[i].parentNode = nodes[i-1];
  
  for (let i=2; i < nodes.length; i++)
    nodes[i].grandparentNode = nodes[i-2];
  
  // init LMR_LOOKUP
  
  for (let p=0; p < MAX_PLY; p++) {
    for (let m=0; m < MAX_MOVES; m++) {
      LMR_LOOKUP[(p << 7) + m] = (1 + p/5 + m/20) | 0;
    }
  }
  
  // init ALIGNED
  
  for (var i=0; i < 144; i++) {
    ALIGNED[i] = new Int8Array(144).fill(EDGE);
    for (let j=0; j < 64; j++) {
      ALIGNED[i][B88[j]] = 0;
    }
  }
  
  for (let i=0; i < 64; i++) {
  
    const to = B88[i];
    const a  = ALIGNED[to];
  
    let dir = 1;
    let from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }
  
    dir = -1;
    from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }
  
    dir = 12;
    from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }
  
    dir = -12;
    from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }
  
    dir = 13;
    from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }
  
    dir = -13;
    from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }
  
    dir = 11;
    from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }
  
    dir = -11;
    from = to + dir;
    while (a[from] !== EDGE) {
      a[from] = dir;
      from += dir;
    }
  
  }
  

}

initOnce();


const rootNode = nodes[0];

