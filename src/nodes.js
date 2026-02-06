function nodeStruct() {

  this.ply = 0;
  this.numMoves = 0;
  this.moves = new Uint32Array(MAX_MOVES);
  this.ranks = new Int32Array(MAX_MOVES);
  this.undoRights = 0;
  this.undoEp = 0;
  this.undoCaptured = 0;
  this.undoCapIdx = 0;

}

const nodes = Array(MAX_PLY);

let rootNode = null;

function initNodes () {
  for (let i=0; i < MAX_PLY; i++) {
    nodes[i] = new nodeStruct;
  }
  rootNode = nodes[0];
}
