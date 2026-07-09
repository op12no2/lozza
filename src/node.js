const nodes = Array(MAX_PLY);

function nodeStruct () {

  this.ply             = 0;
  this.childNode       = null;
  this.parentNode      = null;
  this.grandparentNode = null;

  this.moves  = new Uint32Array(MAX_MOVES);
  this.ranks  = new Int32Array(MAX_MOVES);
  this.moves2 = new Uint32Array(MAX_MOVES);
  this.ranks2 = new Int32Array(MAX_MOVES);

  this.killer1     = 0;
  this.killer2     = 0;
  this.mateKiller  = 0;
  this.stage       = 0;
  this.numMoves    = 0;
  this.numMoves2   = 0;
  this.next        = 0;
  this.hashMove    = 0;
  this.hashEval    = 0;
  this.base        = 0;
  this.inCheck     = 0;
  this.ev          = 0;

  this.rights = 0;
  this.ep     = 0;
  this.repLo  = 0;
  this.repHi  = 0;
  this.loHash = 0;
  this.hiHash = 0;

  this.net_h1_a  = new Int32Array(NET_H1_SIZE);
  this.net_h2_a  = new Int32Array(NET_H1_SIZE);
  this.net_a     = [[this.net_h1_a, this.net_h2_a], [this.net_h2_a, this.net_h1_a]];
  this.accsDirty = 0;

  this.toZ = 0;
  this.frZ = 0;
  this.epZ = 0;

  this.pv    = new Uint32Array(MAX_MOVES);
  this.pvLen = 0;

}


// initNode

function initNode (node) {

  node.killer1    = 0;
  node.killer2    = 0;
  node.mateKiller = 0;
  node.numMoves   = 0;
  node.next       = 0;
  node.hashMove   = 0;
  node.base       = 0;
  node.inCheck    = 0;

  node.toZ = 0;
  node.frZ = 0;
  node.epZ = 0;

  node.accsDirty = 0;

}

// cache
//
// The accumulators are not cached/uncached; each node owns the
// accumulators for its position, written lazily by resolveAccs()
// in net.js.
//

function cache (node) {

  node.rights = bdRights;
  node.ep     = bdEp;
  node.repLo  = repLo;
  node.repHi  = repHi;
  node.loHash = loHash;
  node.hiHash = hiHash;

}

// uncacheA

function uncacheA (node) {

  bdRights = node.rights;
  bdEp     = node.ep;
  repLo    = node.repLo;
  repHi    = node.repHi;
  loHash   = node.loHash;
  hiHash   = node.hiHash;

}

