function nodeStruct() {

  //this.ply = 0;
  this.numMoves = 0;
  this.moves = new Uint32Array(MAX_MOVES);
  this.ranks = new Int32Array(MAX_MOVES);
  this.undoRights = 0;
  this.undoEp = 0;
  this.undoCaptured = 0;
  this.undoCapIdx = 0;

}

const g_ss = Array(MAX_PLY);

let rootNode = null;

function initNodes () {
  for (let i=0; i < MAX_PLY; i++) {
    g_ss[i] = new nodeStruct;
  }
  rootNode = g_ss[0];
}

function formatMove(move) {

  const fr = (move >> 7) & 0x7F;
  const to = move & 0x7F;

  let s = String.fromCharCode(97 + (fr & 7))
        + String.fromCharCode(49 + (fr >> 4))
        + String.fromCharCode(97 + (to & 7))
        + String.fromCharCode(49 + (to >> 4));

  if (move & MOVE_FLAG_PROMOTE)
    s += 'nbrq'[(move >> PROMOTE_SHIFT) - 2];

  return s;
}
