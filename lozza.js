//
// https://github.com/op12no2/lozza
//

const BUILD = "12.0";

//
// Each main fold may have an init*() func which is called by initOnce().
//

//{{{  constants

const MAX_PLY   = 128;
const MAX_MOVES = 256;

//{{{  colours and pieces

const WHITE = 0;
const BLACK = 1;

const PAWN   = 0;
const KNIGHT = 1;
const BISHOP = 2;
const ROOK   = 3;
const QUEEN  = 4;
const KING   = 5;

//
// piece + (colour * 6) indexes the piece bitboards and the zobrist keys
//

const WPAWN   = 0;
const WKNIGHT = 1;
const WBISHOP = 2;
const WROOK   = 3;
const WQUEEN  = 4;
const WKING   = 5;
const BPAWN   = 6;
const BKNIGHT = 7;
const BBISHOP = 8;
const BROOK   = 9;
const BQUEEN  = 10;
const BKING   = 11;

const EMPTY = 12;  // board[sq] when there is no piece on sq

//
// pos.all holds the 12 piece bitboards and then these.
//

const COLOUR   = 12;  // + WHITE/BLACK: all pieces of a colour
const OCCUPIED = 14;
const HASH     = 15;

const PIECE_CHARS = ['P','N','B','R','Q','K','p','n','b','r','q','k'];

const PIECE_MAP = Object.seal({
  'P': WPAWN,
  'N': WKNIGHT,
  'B': WBISHOP,
  'R': WROOK,
  'Q': WQUEEN,
  'K': WKING,
  'p': BPAWN,
  'n': BKNIGHT,
  'b': BBISHOP,
  'r': BROOK,
  'q': BQUEEN,
  'k': BKING
});

//}}}
//{{{  squares
//
// a1 = 0, h1 = 7, a8 = 56, h8 = 63. Rank is sq >> 3, file is sq & 7.
//

const A1 = 0;
const C1 = 2;
const D1 = 3;
const E1 = 4;
const F1 = 5;
const G1 = 6;
const H1 = 7;
const A8 = 56;
const C8 = 58;
const D8 = 59;
const E8 = 60;
const F8 = 61;
const G8 = 62;
const H8 = 63;

const COORDS = [
  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'
];

//}}}
//{{{  castling rights

const WHITE_RIGHTS_KING  = 1;
const WHITE_RIGHTS_QUEEN = 2;
const BLACK_RIGHTS_KING  = 4;
const BLACK_RIGHTS_QUEEN = 8;
const ALL_RIGHTS         = 15;

//}}}
//{{{  moves
//
// A move is an int32: to in bits 0-5, from in bits 6-11, the promotion piece
// (KNIGHT..QUEEN) in bits 12-14 and flag bits above that.
//

const MOVE_TO_MASK    = 0x3F;
const MOVE_FR_BITS    = 6;
const MOVE_FR_MASK    = 0x3F << MOVE_FR_BITS;
const MOVE_PROMO_BITS = 12;
const MOVE_PROMO_MASK = 0x7 << MOVE_PROMO_BITS;

const MOVE_PROMOTE   = 0x8  << 12;
const MOVE_CAPTURE   = 0x10 << 12;
const MOVE_EPCAPTURE = 0x20 << 12;  // MOVE_CAPTURE is also asserted for EP captures
const MOVE_PAWN2     = 0x40 << 12;
const MOVE_CASTLE    = 0x80 << 12;

const MOVE_EXTRA    = MOVE_PROMOTE | MOVE_CAPTURE | MOVE_EPCAPTURE | MOVE_PAWN2 | MOVE_CASTLE;  // extra work in makeMove()
const MOVE_PROMOCAP = MOVE_PROMOTE | MOVE_CAPTURE;

const MOVE_PROMOTE_N = KNIGHT << MOVE_PROMO_BITS;
const MOVE_PROMOTE_B = BISHOP << MOVE_PROMO_BITS;
const MOVE_PROMOTE_R = ROOK   << MOVE_PROMO_BITS;
const MOVE_PROMOTE_Q = QUEEN  << MOVE_PROMO_BITS;

const PROMOTES = ['?','n','b','r','q'];  // indexed by promotion piece

//}}}
//{{{  bitboard masks

const FULL       = 0xFFFFFFFFFFFFFFFFn;
const NOT_A_FILE = 0xFEFEFEFEFEFEFEFEn;
const NOT_H_FILE = 0x7F7F7F7F7F7F7F7Fn;

const RANK_1 = 0x00000000000000FFn;
const RANK_3 = 0x0000000000FF0000n;
const RANK_6 = 0x0000FF0000000000n;
const RANK_8 = 0xFF00000000000000n;

const NOT_RANK_1 = 0xFFFFFFFFFFFFFF00n;
const NOT_RANK_8 = 0x00FFFFFFFFFFFFFFn;

const WKS_PATH = 0x0000000000000060n;  // f1 g1
const WQS_PATH = 0x000000000000000En;  // b1 c1 d1
const BKS_PATH = 0x6000000000000000n;  // f8 g8
const BQS_PATH = 0x0E00000000000000n;  // b8 c8 d8

//}}}
//{{{  magics
//
// cwtch4 magics.
//

const BISHOP_MAGICS = new BigUint64Array([
  0x0018911026004900n, 0x0020080106408600n, 0x0024282600400220n, 0x0c04104208021041n,
  0x1008484040000003n, 0x000202100420c800n, 0x8200808820500301n, 0x08108c00880c0200n,
  0x4000102608013c10n, 0x0430188108088904n, 0x0010900082014100n, 0x0006140400800200n,
  0x40001310c0000c29n, 0x0000020524200211n, 0x442840840c200cc0n, 0x008164c20084e000n,
  0x0040001111191900n, 0x008802102246c400n, 0x0102000402220a00n, 0x000800c38200c180n,
  0x0004024610220000n, 0x0c28a08202102204n, 0x010c410082101080n, 0x0002400021080829n,
  0x0008080005212808n, 0x0a722800a0052400n, 0x0002020091040400n, 0x2001004004040002n,
  0x0c81010100104000n, 0x8001120009008088n, 0x608b0049441e0804n, 0x0844008040404c00n,
  0x001006f040200400n, 0x808802a840020814n, 0x1005402800100040n, 0x4060420080480080n,
  0x0e020084001a0020n, 0x0002004200110080n, 0x080828810401a800n, 0x80320069000a0280n,
  0x49041c20040e4840n, 0x0005241004142220n, 0x0000b400a8020400n, 0x0000004010420202n,
  0x0008080208220400n, 0x4040880104080040n, 0x000809012a040420n, 0x0222145440806201n,
  0x1002008208400004n, 0xa004210412200002n, 0x280084cc040c2010n, 0x1008840084040010n,
  0x0000202020864040n, 0x0002202401820002n, 0x2008201484025204n, 0x00200b3901010000n,
  0x8000840400844408n, 0x0f004d0402069200n, 0x1404800300809000n, 0x4804000102050400n,
  0x0088000020020480n, 0xd800031060411100n, 0x008148480808dc00n, 0x0042200220a60081n
]);

const ROOK_MAGICS = new BigUint64Array([
  0x0180002040001083n, 0x0940004020041009n, 0x1300104102082000n, 0x210004e010010028n,
  0x0080080002800400n, 0x20800c0080012a00n, 0x8c00008410020801n, 0x0300020040842100n,
  0x0500802040008001n, 0x1101004000802100n, 0x0042002042059280n, 0x0429808030002800n,
  0x00e0800400080280n, 0x0090806200804400n, 0x0104000421820810n, 0x0012000200408134n,
  0x1884248000844000n, 0x0040008040802000n, 0x0820110040200500n, 0x0420808008001000n,
  0x0000050008010010n, 0xc002008004008002n, 0x8805440041183012n, 0x0c0002000081104cn,
  0x0240400c80208000n, 0x0320100440024020n, 0x8080200080801000n, 0x0000100080080080n,
  0x0a02000600205048n, 0x000a010200104408n, 0x3000080400213002n, 0x4428340200008843n,
  0x018140013180008cn, 0x2120442000401000n, 0x4180802008801000n, 0xa080081001002100n,
  0x0004040080800800n, 0x0204040080800200n, 0x01a0081504000670n, 0x00040040a2000401n,
  0x8880804000248000n, 0x0100400020008080n, 0x0030040028002001n, 0x000c10412202000an,
  0x0408000400088080n, 0x3102008004008002n, 0x4020c80190040002n, 0x0001040060820001n,
  0x000100204a008600n, 0x0100200040008080n, 0x2100804016002600n, 0x4030004400080040n,
  0x0107001108004500n, 0x000c817a00040080n, 0x2021008200040100n, 0x00402300840e4200n,
  0x2420208203004016n, 0x0504a09082044102n, 0x8410200041001209n, 0x1002004004200812n,
  0x008200201008ac5an, 0xc202000410080102n, 0x0000300801020094n, 0x0000022504008842n
]);

//}}}
//{{{  start position

const START_BOARD = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

//}}}

//}}}
//{{{  utils

//{{{  now

function now() {
  return performance.now() | 0;
}

//}}}
//}}}
//{{{  prng

let rand64Seed = 0xDEADBEEFCAFEBABEn;

//{{{  rand64
//
// xorshift64*
//

function rand64 () {

  let s = rand64Seed;

  s ^= s >> 12n;
  s ^= BigInt.asUintN(64, s << 25n);
  s ^= s >> 27n;

  rand64Seed = s;

  return BigInt.asUintN(64, s * 2685821657736338717n);

}

//}}}

//}}}
//{{{  bitboards
//
// A bitboard is a BigInt. Only <<, * and - can leave 64 bits; shifts are always
// masked by a 64 bit constant and the two multiplies and the one subtraction go
// through BigInt.asUintN(64, x). ~x is written as x ^ FULL. The transpiler maps
// it all to uint64_t and lsb() and popcnt() to intrinsics.
//
// V8 only keeps a BigInt in a machine word when it can see that it fits in
// 64 bits, and a value with bit 63 (h8) set never gets that from feedback, so
// bitboard code follows three rules or it allocates a heap BigInt per op:-
//
//   - a bitboard kept in a local or passed around a loop is written as
//     BigInt.asUintN(64, expr), literally, not via a helper (see clearLsb(),
//     which is fine because the asUintN is inside it);
//   - a bitboard is never converted with Number() or tested for truthiness
//     directly; it goes through scratch64/scratch32 below instead;
//   - bitboards that live in Position are typed array slots, not fields.
//
// scratch64 and scratch32 are two views of the same 8 bytes. Storing a
// bitboard in scratch64[0] and reading scratch32[0] and [1] gets its low and
// high 32 bits as ints.
//

const scratch   = new ArrayBuffer(8);
const scratch64 = new BigUint64Array(scratch);
const scratch32 = new Uint32Array(scratch);

//{{{  lsb
//
// Index of the lowest set bit. bb must not be 0.
//

function lsb (bb) {

  scratch64[0] = bb;

  const lo = scratch32[0];

  if (lo)
    return 31 - Math.clz32(lo & -lo);

  const hi = scratch32[1];

  return 63 - Math.clz32(hi & -hi);

}

//}}}
//{{{  clearLsb
//
// bb with its lowest set bit cleared.
//

function clearLsb (bb) {

  return BigInt.asUintN(64, bb & (bb - 1n));

}

//}}}
//{{{  popcnt

function popcnt (bb) {

  let n = 0;

  while (bb) {
    bb = clearLsb(bb);
    n++;
  }

  return n;

}

//}}}

const BIT = new BigUint64Array(64);  // BIT[sq] = 1n << sq

const pawnAttacks   = new BigUint64Array(128);  // squares from which a pawn of colour c attacks sq, (c << 6) | sq
const knightAttacks = new BigUint64Array(64);
const kingAttacks   = new BigUint64Array(64);

const allAttacks        = new BigUint64Array(64);  // knight | bishop mask | rook mask: where a check can be blocked
const allAttacksIncEdge = new BigUint64Array(64);  // knight | bishop rays | rook rays: where a checker can be

//{{{  sliders
//
// Fancy magics with one table per square packed into attackTable. For a
// slider on sq with board occupancy occ the attacks are:-
//
//   attackTable[base[sq] + ((occ & mask[sq]) * magic[sq] >> shift[sq])]
//
// The shifts are kept as BigInts so the lookup needs no conversion.
//

const bishopMask  = new BigUint64Array(64);
const bishopShift = new Int32Array(64);  // 32 - bits: shift of the high word of the product
const bishopBase  = new Int32Array(64);

const rookMask  = new BigUint64Array(64);
const rookShift = new Int32Array(64);
const rookBase  = new Int32Array(64);

const attackTable = new BigUint64Array(107648);  // 5248 bishop slots then 102400 rook slots

//{{{  bishopAttacks

function bishopAttacks (sq, occ) {

  scratch64[0] = (occ & bishopMask[sq]) * BISHOP_MAGICS[sq];

  return attackTable[bishopBase[sq] + (scratch32[1] >>> bishopShift[sq])];

}

//}}}
//{{{  rookAttacks

function rookAttacks (sq, occ) {

  scratch64[0] = (occ & rookMask[sq]) * ROOK_MAGICS[sq];

  return attackTable[rookBase[sq] + (scratch32[1] >>> rookShift[sq])];

}

//}}}

//}}}

//{{{  initBitboards

//{{{  rayAttacks
//
// Squares along one ray from sq up to and including the first occupied one.
//

function rayAttacks (sq, occ, dr, df) {

  let bb = 0n;
  let r  = (sq >> 3) + dr;
  let f  = (sq & 7) + df;

  while (r >= 0 && r <= 7 && f >= 0 && f <= 7) {
    const s = r * 8 + f;
    bb |= BIT[s];
    if (occ & BIT[s])
      break;
    r += dr;
    f += df;
  }

  return bb;

}

//}}}
//{{{  rayMask
//
// Squares along one ray from sq on an empty board, without the last one,
// which can never block anything.
//

function rayMask (sq, dr, df) {

  let bb = 0n;
  let r  = (sq >> 3) + dr;
  let f  = (sq & 7) + df;

  while (r + dr >= 0 && r + dr <= 7 && f + df >= 0 && f + df <= 7) {
    bb |= BIT[r * 8 + f];
    r += dr;
    f += df;
  }

  return bb;

}

//}}}
//{{{  bishopRays

function bishopRays (sq, occ) {

  return rayAttacks(sq, occ, 1, 1) | rayAttacks(sq, occ, 1, -1) | rayAttacks(sq, occ, -1, 1) | rayAttacks(sq, occ, -1, -1);

}

//}}}
//{{{  rookRays

function rookRays (sq, occ) {

  return rayAttacks(sq, occ, 1, 0) | rayAttacks(sq, occ, -1, 0) | rayAttacks(sq, occ, 0, 1) | rayAttacks(sq, occ, 0, -1);

}

//}}}
//{{{  fillAttacks
//
// Fill the table for one square by walking every subset of the mask.
//

function fillAttacks (sq, piece, mask, magic, shift, base) {

  let sub = 0n;

  do {

    const attacks = (piece == BISHOP) ? bishopRays(sq, sub) : rookRays(sq, sub);
    const index   = Number(BigInt.asUintN(64, sub * magic) >> shift);

    attackTable[base + index] = attacks;

    sub = BigInt.asUintN(64, sub - mask) & mask;  // next subset

  } while (sub);

}

//}}}

const KNIGHT_DR = new Int8Array([-2, -1, 1, 2, 2, 1, -1, -2]);
const KNIGHT_DF = new Int8Array([1, 2, 2, 1, -1, -2, -2, -1]);

//{{{  initBitboards

function initBitboards () {

  for (let sq=0; sq < 64; sq++)
    BIT[sq] = 1n << BigInt(sq);

  //{{{  pawns, knights and kings

  for (let sq=0; sq < 64; sq++) {

    const bb = BIT[sq];
    const r  = sq >> 3;
    const f  = sq & 7;

    //{{{  p

    pawnAttacks[(WHITE << 6) | sq] = ((bb >> 7n) & NOT_A_FILE) | ((bb >> 9n) & NOT_H_FILE);
    pawnAttacks[(BLACK << 6) | sq] = ((bb << 7n) & NOT_H_FILE) | ((bb << 9n) & NOT_A_FILE);
    //}}}
    //{{{  n

    let knights = 0n;

    for (let i=0; i < 8; i++) {
      const nr = r + KNIGHT_DR[i];
      const nf = f + KNIGHT_DF[i];
      if (nr >= 0 && nr <= 7 && nf >= 0 && nf <= 7)
        knights |= BIT[nr * 8 + nf];
    }

    knightAttacks[sq] = knights;
    //}}}
    //{{{  k

    let king = 0n;

    for (let dr=-1; dr <= 1; dr++) {
      for (let df=-1; df <= 1; df++) {
        const nr = r + dr;
        const nf = f + df;
        if ((dr || df) && nr >= 0 && nr <= 7 && nf >= 0 && nf <= 7)
          king |= BIT[nr * 8 + nf];
      }
    }

    kingAttacks[sq] = king;

    //}}}

  }

  //}}}
  //{{{  bishops, rooks

  let base = 0;

  //{{{  b

  for (let sq=0; sq < 64; sq++) {

    const mask = rayMask(sq, 1, 1) | rayMask(sq, 1, -1) | rayMask(sq, -1, 1) | rayMask(sq, -1, -1);
    const bits = popcnt(mask);

    bishopMask[sq]  = mask;
    bishopShift[sq] = 32 - bits;
    bishopBase[sq]  = base;

    fillAttacks(sq, BISHOP, mask, BISHOP_MAGICS[sq], BigInt(64 - bits), base);

    base += 1 << bits;

  }

  //}}}
  //{{{  r

  for (let sq=0; sq < 64; sq++) {

    const mask = rayMask(sq, 1, 0) | rayMask(sq, -1, 0) | rayMask(sq, 0, 1) | rayMask(sq, 0, -1);
    const bits = popcnt(mask);

    rookMask[sq]  = mask;
    rookShift[sq] = 32 - bits;
    rookBase[sq]  = base;

    fillAttacks(sq, ROOK, mask, ROOK_MAGICS[sq], BigInt(64 - bits), base);

    base += 1 << bits;

  }

  //}}}
  //}}}

  //{{{  all attacks

  for (let sq=0; sq < 64; sq++) {

    allAttacks[sq]        = knightAttacks[sq] | bishopMask[sq] | rookMask[sq];
    allAttacksIncEdge[sq] = knightAttacks[sq] | bishopRays(sq, 0n) | rookRays(sq, 0n);

  }

  //}}}

}

//}}}

//}}}

//}}}
//{{{  board
//
// A Position is copied to the next ply and the move made there (copy-make),
// see perft(). The fields are fixed in the constructor so the transpiler can
// make a struct of it.
//

//{{{  Position

function Position () {

  this.all      = new BigUint64Array(16);  // piece bitboards indexed WPAWN..BKING, then COLOUR, OCCUPIED, HASH
  this.board    = new Uint8Array(64);      // piece on each square or EMPTY
  this.stm      = 0;
  this.rights   = 0;
  this.ep       = 0;                       // ep square or 0 for none (a1 can never be one)
  this.hmc      = 0;

}

//}}}
//{{{  posCopy

function posCopy (from, to) {

  to.all.set(from.all);
  to.board.set(from.board);
  to.stm      = from.stm;
  to.rights   = from.rights;
  to.ep       = from.ep;
  to.hmc      = from.hmc;

}

//}}}
//{{{  zobrist

const zobPieces = new BigUint64Array(12 * 64);  // piece * 64 + sq
const zobStm    = new BigUint64Array(2);        // hack - simplify to scaler
const zobRights = new BigUint64Array(16);
const zobEp     = new BigUint64Array(64);

//{{{  initZobrist

function initZobrist () {

  for (let i=0; i < 12 * 64; i++)
    zobPieces[i] = rand64();

  zobStm[0] = 0n;
  zobStm[1] = rand64();

  for (let i=1; i < 16; i++)
    zobRights[i] = rand64();

  for (let i=1; i < 64; i++)
    zobEp[i] = rand64();

}

//}}}
//{{{  rebuildHash

function rebuildHash (pos) {

  let hash = 0n;

  for (let sq=0; sq < 64; sq++) {
    const piece = pos.board[sq];
    if (piece != EMPTY)
      hash ^= zobPieces[piece * 64 + sq];
  }

  hash ^= zobStm[pos.stm];
  hash ^= zobRights[pos.rights];
  hash ^= zobEp[pos.ep];

  return hash;

}

//}}}

//}}}
//{{{  isAttacked
//
// Is sq attacked by a piece of colour opp.
//

function isAttacked (pos, sq, opp) {

  const all  = pos.all;
  const base = opp * 6;

  scratch64[0] = all[base + KNIGHT] & knightAttacks[sq];
  if (scratch32[0] | scratch32[1])
    return 1;

  scratch64[0] = all[base + PAWN] & pawnAttacks[(opp << 6) | sq];
  if (scratch32[0] | scratch32[1])
    return 1;

  scratch64[0] = all[base + KING] & kingAttacks[sq];
  if (scratch32[0] | scratch32[1])
    return 1;

  const occ    = pos.all[OCCUPIED];
  const queens = all[base + QUEEN];

  scratch64[0] = rookAttacks(sq, occ) & (all[base + ROOK] | queens);
  if (scratch32[0] | scratch32[1])
    return 1;

  scratch64[0] = bishopAttacks(sq, occ) & (all[base + BISHOP] | queens);
  if (scratch32[0] | scratch32[1])
    return 1;

  return 0;

}

//}}}
//{{{  position
//
// Set up node.pos from the parts of a fen and play the uci moves.
//

function position (node, board, stm, rights, ep, moves) {

  const pos = node.pos;

  //{{{  board

  pos.all.fill(0n);
  pos.board.fill(EMPTY);
  pos.all[OCCUPIED] = 0n;

  let sq = A8;

  for (let i=0; i < board.length; i++) {

    const ch  = board.charAt(i);
    const chn = board.charCodeAt(i) - 48;  // '1'-'8' -> 1-8, anything else is out of range

    if (ch == '/')
      sq -= 16;

    else if (chn >= 1 && chn <= 8)
      sq += chn;

    else {

      const piece  = PIECE_MAP[ch];
      const colour = (piece >= BPAWN) ? BLACK : WHITE;
      const bb     = BIT[sq];

      pos.all[piece]           |= bb;
      pos.all[COLOUR + colour] |= bb;
      pos.all[OCCUPIED]        |= bb;
      pos.board[sq]             = piece;

      sq++;

    }
  }

  //}}}
  //{{{  stm

  pos.stm = (stm == 'w') ? WHITE : BLACK;

  //}}}
  //{{{  rights

  pos.rights = 0;

  for (let i=0; i < rights.length; i++) {

    const ch = rights.charAt(i);

    if (ch == 'K') pos.rights |= WHITE_RIGHTS_KING;
    if (ch == 'Q') pos.rights |= WHITE_RIGHTS_QUEEN;
    if (ch == 'k') pos.rights |= BLACK_RIGHTS_KING;
    if (ch == 'q') pos.rights |= BLACK_RIGHTS_QUEEN;

  }

  //}}}
  //{{{  ep
  //
  // Only set when a pawn can actually capture, so that the hash is the same
  // as reaching the position by moves.
  //

  pos.ep = 0;

  if (ep != '-') {

    const epSq    = (ep.charCodeAt(1) - 49) * 8 + (ep.charCodeAt(0) - 97);
    const pawnBB  = BIT[(pos.stm == WHITE) ? epSq - 8 : epSq + 8];  // the pawn that just moved
    const adj     = ((pawnBB & NOT_A_FILE) >> 1n) | ((pawnBB & NOT_H_FILE) << 1n);
    const capPawn = PAWN + pos.stm * 6;

    if (pos.all[capPawn] & adj)
      pos.ep = epSq;

  }

  //}}}

  pos.hmc       = 0;
  pos.all[HASH] = rebuildHash(pos);

  for (let i=0; i < moves.length; i++)
    playMove(node, moves[i]);

}

//}}}
//{{{  formatFen

function formatFen (pos) {

  let fen = '';

  for (let r=7; r >= 0; r--) {

    let n = 0;

    for (let f=0; f < 8; f++) {
      const piece = pos.board[r * 8 + f];
      if (piece == EMPTY)
        n++;
      else {
        if (n) {
          fen += '' + n;
          n = 0;
        }
        fen += PIECE_CHARS[piece];
      }
    }

    if (n)
      fen += '' + n;

    if (r)
      fen += '/';

  }

  fen += (pos.stm == WHITE) ? ' w' : ' b';

  if (pos.rights) {
    fen += ' ';
    if (pos.rights & WHITE_RIGHTS_KING)  fen += 'K';
    if (pos.rights & WHITE_RIGHTS_QUEEN) fen += 'Q';
    if (pos.rights & BLACK_RIGHTS_KING)  fen += 'k';
    if (pos.rights & BLACK_RIGHTS_QUEEN) fen += 'q';
  }
  else
    fen += ' -';

  if (pos.ep)
    fen += ' ' + COORDS[pos.ep];
  else
    fen += ' -';

  fen += ' ' + pos.hmc + ' 1';

  return fen;

}

//}}}

//{{{  initBoard

function initBoard () {

  initZobrist();

}

//}}}

//}}}
//{{{  nodes

//{{{  Node

function Node () {

  this.pos      = new Position();
  this.moves    = new Int32Array(MAX_MOVES);
  this.numMoves = 0;
  this.inCheck  = 0;

}

//}}}

const nodes = Array(MAX_PLY);

//{{{  initNodes

function initNodes () {

  for (let i=0; i < MAX_PLY; i++) {
    nodes[i] = new Node();
    Object.seal(nodes[i].pos);
    Object.seal(nodes[i]);
  }

}

//}}}

//}}}
//{{{  moves

//{{{  encodeMove

function encodeMove (from, to, flags) {

  return (from << MOVE_FR_BITS) | to | flags;

}

//}}}
//{{{  formatMove

function formatMove (move) {

  const from = (move & MOVE_FR_MASK) >> MOVE_FR_BITS;
  const to   = move & MOVE_TO_MASK;

  if (move & MOVE_PROMOTE)
    return COORDS[from] + COORDS[to] + PROMOTES[(move & MOVE_PROMO_MASK) >> MOVE_PROMO_BITS];

  return COORDS[from] + COORDS[to];

}

//}}}
//{{{  generation
//
// genNoisy() and genQuiets() append to node.moves. When in check the targets
// are cut down to the squares a checker can be on (captures) or a check can
// be blocked on (quiets); legality is still checked after the move is made.
// Kings never move adjacent.
//

//{{{  pawns

//{{{  genPawnsWhiteQuiets

function genPawnsWhiteQuiets (node, targets) {

  const pos    = node.pos;
  const pawns  = BigInt.asUintN(64, pos.all[WPAWN]);
  const notOcc = BigInt.asUintN(64, pos.all[OCCUPIED] ^ FULL);
  const moves  = node.moves;

  let n = node.numMoves;

  const one = BigInt.asUintN(64, (pawns << 8n) & notOcc);

  let quiet = BigInt.asUintN(64, one & NOT_RANK_8 & targets);

  while (quiet) {
    const to = lsb(quiet); quiet = clearLsb(quiet);
    moves[n++] = encodeMove(to - 8, to, 0);
  }

  let two = BigInt.asUintN(64, ((one & RANK_3) << 8n) & notOcc & targets);

  while (two) {
    const to = lsb(two); two = clearLsb(two);
    moves[n++] = encodeMove(to - 16, to, MOVE_PAWN2);
  }

  node.numMoves = n;

}

//}}}
//{{{  genPawnsWhitePushPromos

function genPawnsWhitePushPromos (node, targets) {

  const pos    = node.pos;
  const pawns  = BigInt.asUintN(64, pos.all[WPAWN]);
  const notOcc = BigInt.asUintN(64, pos.all[OCCUPIED] ^ FULL);
  const moves  = node.moves;

  let n = node.numMoves;

  let promo = BigInt.asUintN(64, (pawns << 8n) & notOcc & RANK_8 & targets);

  while (promo) {

    const to   = lsb(promo); promo = clearLsb(promo);
    const from = to - 8;

    moves[n++] = encodeMove(from, to, MOVE_PROMOTE | MOVE_PROMOTE_Q);
    moves[n++] = encodeMove(from, to, MOVE_PROMOTE | MOVE_PROMOTE_R);
    moves[n++] = encodeMove(from, to, MOVE_PROMOTE | MOVE_PROMOTE_B);
    moves[n++] = encodeMove(from, to, MOVE_PROMOTE | MOVE_PROMOTE_N);

  }

  node.numMoves = n;

}

//}}}
//{{{  genPawnsWhiteCaptures

function genPawnsWhiteCaptures (node, targets) {

  const pos   = node.pos;
  const pawns = BigInt.asUintN(64, pos.all[WPAWN]);
  const moves = node.moves;

  let n = node.numMoves;

  const left  = BigInt.asUintN(64, (pawns << 7n) & NOT_H_FILE & targets);
  const right = BigInt.asUintN(64, (pawns << 9n) & NOT_A_FILE & targets);

  let cap   = BigInt.asUintN(64, left & NOT_RANK_8);
  let promo = BigInt.asUintN(64, left & RANK_8);

  while (cap) {
    const to = lsb(cap); cap = clearLsb(cap);
    moves[n++] = encodeMove(to - 7, to, MOVE_CAPTURE);
  }

  while (promo) {

    const to   = lsb(promo); promo = clearLsb(promo);
    const from = to - 7;

    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_Q);
    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_R);
    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_B);
    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_N);

  }

  cap   = BigInt.asUintN(64, right & NOT_RANK_8);
  promo = BigInt.asUintN(64, right & RANK_8);

  while (cap) {
    const to = lsb(cap); cap = clearLsb(cap);
    moves[n++] = encodeMove(to - 9, to, MOVE_CAPTURE);
  }

  while (promo) {

    const to   = lsb(promo); promo = clearLsb(promo);
    const from = to - 9;

    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_Q);
    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_R);
    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_B);
    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_N);

  }

  if (pos.ep) {

    let epFrom = BigInt.asUintN(64, pawnAttacks[(WHITE << 6) | pos.ep] & pawns);

    while (epFrom) {
      const from = lsb(epFrom); epFrom = clearLsb(epFrom);
      moves[n++] = encodeMove(from, pos.ep, MOVE_CAPTURE | MOVE_EPCAPTURE);
    }

  }

  node.numMoves = n;

}

//}}}
//{{{  genPawnsBlackQuiets

function genPawnsBlackQuiets (node, targets) {

  const pos    = node.pos;
  const pawns  = BigInt.asUintN(64, pos.all[BPAWN]);
  const notOcc = BigInt.asUintN(64, pos.all[OCCUPIED] ^ FULL);
  const moves  = node.moves;

  let n = node.numMoves;

  const one = BigInt.asUintN(64, (pawns >> 8n) & notOcc);

  let quiet = BigInt.asUintN(64, one & NOT_RANK_1 & targets);

  while (quiet) {
    const to = lsb(quiet); quiet = clearLsb(quiet);
    moves[n++] = encodeMove(to + 8, to, 0);
  }

  let two = BigInt.asUintN(64, ((one & RANK_6) >> 8n) & notOcc & targets);

  while (two) {
    const to = lsb(two); two = clearLsb(two);
    moves[n++] = encodeMove(to + 16, to, MOVE_PAWN2);
  }

  node.numMoves = n;

}

//}}}
//{{{  genPawnsBlackPushPromos

function genPawnsBlackPushPromos (node, targets) {

  const pos    = node.pos;
  const pawns  = BigInt.asUintN(64, pos.all[BPAWN]);
  const notOcc = BigInt.asUintN(64, pos.all[OCCUPIED] ^ FULL);
  const moves  = node.moves;

  let n = node.numMoves;

  let promo = BigInt.asUintN(64, (pawns >> 8n) & notOcc & RANK_1 & targets);

  while (promo) {

    const to   = lsb(promo); promo = clearLsb(promo);
    const from = to + 8;

    moves[n++] = encodeMove(from, to, MOVE_PROMOTE | MOVE_PROMOTE_Q);
    moves[n++] = encodeMove(from, to, MOVE_PROMOTE | MOVE_PROMOTE_R);
    moves[n++] = encodeMove(from, to, MOVE_PROMOTE | MOVE_PROMOTE_B);
    moves[n++] = encodeMove(from, to, MOVE_PROMOTE | MOVE_PROMOTE_N);

  }

  node.numMoves = n;

}

//}}}
//{{{  genPawnsBlackCaptures

function genPawnsBlackCaptures (node, targets) {

  const pos   = node.pos;
  const pawns = BigInt.asUintN(64, pos.all[BPAWN]);
  const moves = node.moves;

  let n = node.numMoves;

  const left  = BigInt.asUintN(64, (pawns >> 9n) & NOT_H_FILE & targets);
  const right = BigInt.asUintN(64, (pawns >> 7n) & NOT_A_FILE & targets);

  let cap   = BigInt.asUintN(64, left & NOT_RANK_1);
  let promo = BigInt.asUintN(64, left & RANK_1);

  while (cap) {
    const to = lsb(cap); cap = clearLsb(cap);
    moves[n++] = encodeMove(to + 9, to, MOVE_CAPTURE);
  }

  while (promo) {

    const to   = lsb(promo); promo = clearLsb(promo);
    const from = to + 9;

    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_Q);
    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_R);
    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_B);
    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_N);

  }

  cap   = BigInt.asUintN(64, right & NOT_RANK_1);
  promo = BigInt.asUintN(64, right & RANK_1);

  while (cap) {
    const to = lsb(cap); cap = clearLsb(cap);
    moves[n++] = encodeMove(to + 7, to, MOVE_CAPTURE);
  }

  while (promo) {

    const to   = lsb(promo); promo = clearLsb(promo);
    const from = to + 7;

    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_Q);
    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_R);
    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_B);
    moves[n++] = encodeMove(from, to, MOVE_PROMOCAP | MOVE_PROMOTE_N);

  }

  if (pos.ep) {

    let epFrom = BigInt.asUintN(64, pawnAttacks[(BLACK << 6) | pos.ep] & pawns);

    while (epFrom) {
      const from = lsb(epFrom); epFrom = clearLsb(epFrom);
      moves[n++] = encodeMove(from, pos.ep, MOVE_CAPTURE | MOVE_EPCAPTURE);
    }

  }

  node.numMoves = n;

}

//}}}

//}}}
//{{{  genJumpers
//
// Knights and kings from a 64 entry attack table.
//

function genJumpers (node, attacks, piece, targets, flags) {

  const pos   = node.pos;
  const moves = node.moves;

  let n  = node.numMoves;
  let bb = BigInt.asUintN(64, pos.all[piece + pos.stm * 6]);

  while (bb) {

    const from = lsb(bb); bb = clearLsb(bb);

    let to = BigInt.asUintN(64, attacks[from] & targets);

    while (to) {
      const t = lsb(to); to = clearLsb(to);
      moves[n++] = encodeMove(from, t, flags);
    }

  }

  node.numMoves = n;

}

//}}}
//{{{  genBishops
//
// Bishops or queens along the diagonals.
//

function genBishops (node, piece, targets, flags) {

  const pos   = node.pos;
  const occ   = BigInt.asUintN(64, pos.all[OCCUPIED]);
  const moves = node.moves;

  let n  = node.numMoves;
  let bb = BigInt.asUintN(64, pos.all[piece + pos.stm * 6]);

  while (bb) {

    const from = lsb(bb); bb = clearLsb(bb);

    let to = BigInt.asUintN(64, bishopAttacks(from, occ) & targets);

    while (to) {
      const t = lsb(to); to = clearLsb(to);
      moves[n++] = encodeMove(from, t, flags);
    }

  }

  node.numMoves = n;

}

//}}}
//{{{  genRooks
//
// Rooks or queens along the ranks and files.
//

function genRooks (node, piece, targets, flags) {

  const pos   = node.pos;
  const occ   = BigInt.asUintN(64, pos.all[OCCUPIED]);
  const moves = node.moves;

  let n  = node.numMoves;
  let bb = BigInt.asUintN(64, pos.all[piece + pos.stm * 6]);

  while (bb) {

    const from = lsb(bb); bb = clearLsb(bb);

    let to = BigInt.asUintN(64, rookAttacks(from, occ) & targets);

    while (to) {
      const t = lsb(to); to = clearLsb(to);
      moves[n++] = encodeMove(from, t, flags);
    }

  }

  node.numMoves = n;

}

//}}}
//{{{  genCastling

function genCastling (node) {

  const pos    = node.pos;
  const stm    = pos.stm;
  const opp    = stm ^ 1;
  const rights = pos.rights;
  const occ    = BigInt.asUintN(64, pos.all[OCCUPIED]);
  const moves  = node.moves;

  let n = node.numMoves;

  if (stm == WHITE) {

    if ((rights & WHITE_RIGHTS_KING) && !(occ & WKS_PATH) && !isAttacked(pos, F1, opp) && !isAttacked(pos, G1, opp))
      moves[n++] = encodeMove(E1, G1, MOVE_CASTLE);

    if ((rights & WHITE_RIGHTS_QUEEN) && !(occ & WQS_PATH) && !isAttacked(pos, D1, opp) && !isAttacked(pos, C1, opp))
      moves[n++] = encodeMove(E1, C1, MOVE_CASTLE);

  }

  else {

    if ((rights & BLACK_RIGHTS_KING) && !(occ & BKS_PATH) && !isAttacked(pos, F8, opp) && !isAttacked(pos, G8, opp))
      moves[n++] = encodeMove(E8, G8, MOVE_CASTLE);

    if ((rights & BLACK_RIGHTS_QUEEN) && !(occ & BQS_PATH) && !isAttacked(pos, D8, opp) && !isAttacked(pos, C8, opp))
      moves[n++] = encodeMove(E8, C8, MOVE_CASTLE);

  }

  node.numMoves = n;

}

//}}}
//{{{  genNoisy
//
// Captures and promotions.
//

function genNoisy (node) {

  const pos         = node.pos;
  const stm         = pos.stm;
  const opp         = stm ^ 1;
  const oppKingBB   = BigInt.asUintN(64, pos.all[KING + opp * 6]);
  const oppKingNear = BigInt.asUintN(64, kingAttacks[lsb(oppKingBB)]);
  const enemies     = BigInt.asUintN(64, pos.all[COLOUR + opp] ^ oppKingBB);

  let capTargets  = BigInt.asUintN(64, enemies);
  let pushTargets = BigInt.asUintN(64, pos.all[OCCUPIED] ^ FULL);

  if (node.inCheck) {
    const kingSq = lsb(pos.all[KING + stm * 6]);
    capTargets  = BigInt.asUintN(64, capTargets & allAttacksIncEdge[kingSq]);
    pushTargets = BigInt.asUintN(64, pushTargets & allAttacks[kingSq]);
  }

  if (stm == WHITE) {
    genPawnsWhiteCaptures(node, capTargets);
    genPawnsWhitePushPromos(node, pushTargets);
  }
  else {
    genPawnsBlackCaptures(node, capTargets);
    genPawnsBlackPushPromos(node, pushTargets);
  }

  genJumpers(node, knightAttacks, KNIGHT, capTargets, MOVE_CAPTURE);
  genBishops(node, BISHOP, capTargets, MOVE_CAPTURE);
  genRooks(node, ROOK, capTargets, MOVE_CAPTURE);
  genBishops(node, QUEEN, capTargets, MOVE_CAPTURE);
  genRooks(node, QUEEN, capTargets, MOVE_CAPTURE);
  genJumpers(node, kingAttacks, KING, enemies & (oppKingNear ^ FULL), MOVE_CAPTURE);

}

//}}}
//{{{  genQuiets
//
// Slides except promotions.
//

function genQuiets (node) {

  const pos         = node.pos;
  const stm         = pos.stm;
  const opp         = stm ^ 1;
  const oppKingNear = BigInt.asUintN(64, kingAttacks[lsb(pos.all[KING + opp * 6])]);
  const notOcc      = BigInt.asUintN(64, pos.all[OCCUPIED] ^ FULL);

  let targets = BigInt.asUintN(64, notOcc);

  if (node.inCheck)
    targets = BigInt.asUintN(64, targets & allAttacks[lsb(pos.all[KING + stm * 6])]);

  if (stm == WHITE)
    genPawnsWhiteQuiets(node, targets);
  else
    genPawnsBlackQuiets(node, targets);

  genJumpers(node, knightAttacks, KNIGHT, targets, 0);
  genBishops(node, BISHOP, targets, 0);
  genRooks(node, ROOK, targets, 0);
  genBishops(node, QUEEN, targets, 0);  // hack optimise maybe
  genRooks(node, QUEEN, targets, 0);
  genJumpers(node, kingAttacks, KING, notOcc & (oppKingNear ^ FULL), 0);

  if (pos.rights && !node.inCheck)
    genCastling(node);

}

//}}}
//{{{  genMoves
//
// All pseudo-legal moves.
//

function genMoves (node) {

  const pos = node.pos;

  node.inCheck  = isAttacked(pos, lsb(pos.all[KING + pos.stm * 6]), pos.stm ^ 1);
  node.numMoves = 0;

  genNoisy(node);
  genQuiets(node);

}

//}}}

//}}}
//{{{  makeMove
//
// Make move on node.pos in place. Legality is not checked; see perft().
//

const ROOK_FROM = new Uint8Array(64);
const ROOK_TO   = new Uint8Array(64);

const RIGHTS_MASK = new Uint8Array([
  13, 15, 15, 15, 12, 15, 15, 14,  // a1 h1 e1
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
   7, 15, 15, 15,  3, 15, 15, 11   // a8 h8 e8
]);

function makeMove (node, move) {

  const pos       = node.pos;
  const board     = pos.board;
  const all       = pos.all;
  const stm       = pos.stm;
  const opp       = stm ^ 1;
  const flags     = move & MOVE_EXTRA;
  const from      = (move & MOVE_FR_MASK) >> MOVE_FR_BITS;
  const to        = move & MOVE_TO_MASK;
  const fromPiece = board[from];
  const toPiece   = board[to];
  const fromBB    = BigInt.asUintN(64, BIT[from]);
  const toBB      = BigInt.asUintN(64, BIT[to]);
  const moveBB    = BigInt.asUintN(64, fromBB ^ toBB);

  all[HASH] ^= zobPieces[fromPiece * 64 + from] ^ zobEp[pos.ep] ^ zobRights[pos.rights];

  pos.ep = 0;

  if (flags == 0) {
    //{{{  quiet

    board[from] = EMPTY;
    board[to]   = fromPiece;

    all[fromPiece] ^= moveBB;
    all[COLOUR + stm]    ^= moveBB;

    all[HASH] ^= zobPieces[fromPiece * 64 + to];

    //}}}
  }

  else if (flags == MOVE_CAPTURE) {  // ==
    //{{{  capture

    board[from] = EMPTY;
    board[to]   = fromPiece;

    all[fromPiece] ^= moveBB;
    all[toPiece]   ^= toBB;
    all[COLOUR + stm]    ^= moveBB;
    all[COLOUR + opp]    ^= toBB;

    all[HASH] ^= zobPieces[fromPiece * 64 + to] ^ zobPieces[toPiece * 64 + to];

    //}}}
  }

  else if (flags & MOVE_EPCAPTURE) {
    //{{{  ep capture

    const capSq    = (stm == WHITE) ? to - 8 : to + 8;
    const capBB    = BIT[capSq];
    const capPiece = board[capSq];

    board[from]  = EMPTY;
    board[to]    = fromPiece;
    board[capSq] = EMPTY;

    all[fromPiece] ^= moveBB;
    all[capPiece]  ^= capBB;
    all[COLOUR + stm]    ^= moveBB;
    all[COLOUR + opp]    ^= capBB;

    all[HASH] ^= zobPieces[fromPiece * 64 + to] ^ zobPieces[capPiece * 64 + capSq];

    //}}}
  }

  else if ((flags & MOVE_PROMOCAP) == MOVE_PROMOCAP) {
    //{{{  promotion with capture

    const promoPiece = ((move & MOVE_PROMO_MASK) >> MOVE_PROMO_BITS) + stm * 6;

    board[from] = EMPTY;
    board[to]   = promoPiece;

    all[fromPiece]  ^= fromBB;
    all[toPiece]    ^= toBB;
    all[promoPiece] ^= toBB;
    all[COLOUR + stm]     ^= moveBB;
    all[COLOUR + opp]     ^= toBB;

    all[HASH] ^= zobPieces[toPiece * 64 + to] ^ zobPieces[promoPiece * 64 + to];

    //}}}
  }

  else if (flags & MOVE_PROMOTE) {
    //{{{  promotion

    const promoPiece = ((move & MOVE_PROMO_MASK) >> MOVE_PROMO_BITS) + stm * 6;

    board[from] = EMPTY;
    board[to]   = promoPiece;

    all[fromPiece]  ^= fromBB;
    all[promoPiece] ^= toBB;
    all[COLOUR + stm]     ^= moveBB;

    all[HASH] ^= zobPieces[promoPiece * 64 + to];

    //}}}
  }

  else if (flags & MOVE_CASTLE) {
    //{{{  castle

    const rf        = ROOK_FROM[to];
    const rt        = ROOK_TO[to];
    const rookBB    = BIT[rf] ^ BIT[rt];
    const rookPiece = board[rf];

    board[from] = EMPTY;
    board[to]   = fromPiece;
    board[rf]   = EMPTY;
    board[rt]   = rookPiece;

    all[fromPiece] ^= moveBB;
    all[rookPiece] ^= rookBB;
    all[COLOUR + stm]    ^= moveBB ^ rookBB;

    all[HASH] ^= zobPieces[fromPiece * 64 + to] ^ zobPieces[rookPiece * 64 + rf] ^ zobPieces[rookPiece * 64 + rt];

    //}}}
  }

  else {
    //{{{  pawn push 2
    //
    // ep is only set if a pawn can capture, so the hash is the same however
    // the position is reached. A mistake only made once!
    //

    board[from] = EMPTY;
    board[to]   = fromPiece;

    all[fromPiece] ^= moveBB;
    all[COLOUR + stm]    ^= moveBB;

    all[HASH] ^= zobPieces[fromPiece * 64 + to];

    const adj = ((toBB & NOT_A_FILE) >> 1n) | ((toBB & NOT_H_FILE) << 1n);

    scratch64[0] = all[PAWN + opp * 6] & adj;
    if (scratch32[0] | scratch32[1])
      pos.ep = (from + to) >> 1;

    //}}}
  }

  pos.rights  &= RIGHTS_MASK[from] & RIGHTS_MASK[to];
  pos.all[OCCUPIED] = all[COLOUR + WHITE] | all[COLOUR + BLACK];
  pos.stm      = opp;
  all[HASH]   ^= zobRights[pos.rights] ^ zobEp[pos.ep] ^ zobStm[1];

  if (fromPiece == WPAWN || fromPiece == BPAWN || (flags & MOVE_CAPTURE))
    pos.hmc = 0;
  else
    pos.hmc++;

}

//}}}
//{{{  playMove
//
// Make a uci move on node.pos in place. Assume it's legal.
//

function playMove (node, uciMove) {

  const pos = node.pos;
  const stm = pos.stm;

  genMoves(node);

  for (let i=0; i < node.numMoves; i++) {

    const move = node.moves[i];

    if (formatMove(move) == uciMove) {

      makeMove(node, move);

      //if (isAttacked(pos, lsb(pos.all[KING + stm * 6]), stm ^ 1))
        //return 0;

      //return 1;

    }
  }

  //return 0;

}

//}}}
//{{{  initMoves

function initMoves () {

  ROOK_FROM[G1] = H1;
  ROOK_TO[G1]   = F1;
  ROOK_FROM[C1] = A1;
  ROOK_TO[C1]   = D1;
  ROOK_FROM[G8] = H8;
  ROOK_TO[G8]   = F8;
  ROOK_FROM[C8] = A8;
  ROOK_TO[C8]   = D8;

}

//}}}

//}}}
//{{{  perft

//{{{  perft

function perft (depth, ply) {

  if (depth == 0)
    return 1;

  const node      = nodes[ply];
  const nextNode  = nodes[ply + 1];
  const pos       = node.pos;
  const nextPos   = nextNode.pos;
  const stm       = pos.stm;
  const opp       = stm ^ 1;
  const kingIndex = KING + stm * 6;

  let total = 0;  // @i64

  genMoves(node);

  for (let i=0; i < node.numMoves; i++) {

    posCopy(pos, nextPos);
    makeMove(nextNode, node.moves[i]);

    if (isAttacked(nextPos, lsb(nextPos.all[kingIndex]), opp))
      continue;

    total += perft(depth-1, ply+1);

  }

  return total;

}

//}}}
//{{{  perftTests

function perftTests (n) {

  const t1 = now();

  let errors = 0;
  let tot    = 0;  // @i64

  for (let i=0; i < n; i++) {

    const p = PERFTFENS[i];

    const fen      = p[0];
    const depth    = p[1];
    const expected = p[2];
    const id       = p[3];

    uciExec('position ' + fen);

    const nodes = perft(depth, 0);

    tot += nodes;

    const t2     = now();
    const sec    = Math.round((t2-t1)/100)/10;
    const secStr = sec.toString().padStart(6, ' ');

    const diff = nodes - expected;

    let diffStr = '' + diff;

    if (diff) {
      errors += Math.abs(diff);
      diffStr = '\x1b[1m' + diff + '\x1b[0m';
    }

    uciSend(secStr, id, fen, depth, diffStr, nodes, expected);

  }

  const elapsed = now() - t1;
  const nps     = tot / elapsed * 1000 | 0;

  uciSend('errors', errors, 'nodes', tot, 'nps', nps);

}

//}}}

//{{{  PERFTFENS

const PERFTFENS = [
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 2, 400,       'cpw-pos1-2'],
  ['fen 4k3/8/8/8/8/8/R7/R3K2R                                  w Q    -  0 1', 3, 4729,      'castling-2'],
  ['fen 4k3/8/8/8/8/8/R7/R3K2R                                  w K    -  0 1', 3, 4686,      'castling-3'],
  ['fen 4k3/8/8/8/8/8/R7/R3K2R                                  w -    -  0 1', 3, 4522,      'castling-4'],
  ['fen r3k2r/r7/8/8/8/8/8/4K3                                  b kq   -  0 1', 3, 4893,      'castling-5'],
  ['fen r3k2r/r7/8/8/8/8/8/4K3                                  b q    -  0 1', 3, 4729,      'castling-6'],
  ['fen r3k2r/r7/8/8/8/8/8/4K3                                  b k    -  0 1', 3, 4686,      'castling-7'],
  ['fen r3k2r/r7/8/8/8/8/8/4K3                                  b -    -  0 1', 3, 4522,      'castling-8'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 0, 1,         'cpw-pos1-0'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 1, 20,        'cpw-pos1-1'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 3, 8902,      'cpw-pos1-3'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 4, 197281,    'cpw-pos1-4'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 5, 4865609,   'cpw-pos1-5'],
  ['fen rnbqkb1r/pp1p1ppp/2p5/4P3/2B5/8/PPP1NnPP/RNBQK2R        w KQkq -  0 1', 1, 42,        'cpw-pos5-1'],
  ['fen rnbqkb1r/pp1p1ppp/2p5/4P3/2B5/8/PPP1NnPP/RNBQK2R        w KQkq -  0 1', 2, 1352,      'cpw-pos5-2'],
  ['fen rnbqkb1r/pp1p1ppp/2p5/4P3/2B5/8/PPP1NnPP/RNBQK2R        w KQkq -  0 1', 3, 53392,     'cpw-pos5-3'],
  ['fen r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -  0 1', 1, 48,        'cpw-pos2-1'],
  ['fen r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -  0 1', 2, 2039,      'cpw-pos2-2'],
  ['fen r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -  0 1', 3, 97862,     'cpw-pos2-3'],
  ['fen 8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8                         w -    -  0 1', 5, 674624,    'cpw-pos3-5'],
  ['fen n1n5/PPPk4/8/8/8/8/4Kppp/5N1N                           b -    -  0 1', 1, 24,        'prom-1    '],
  ['fen 8/5bk1/8/2Pp4/8/1K6/8/8                                 w -    d6 0 1', 6, 824064,    'ccc-1     '],
  ['fen 8/8/1k6/8/2pP4/8/5BK1/8                                 b -    d3 0 1', 6, 824064,    'ccc-2     '],
  ['fen 8/8/1k6/2b5/2pP4/8/5K2/8                                b -    d3 0 1', 6, 1440467,   'ccc-3     '],
  ['fen 8/5k2/8/2Pp4/2B5/1K6/8/8                                w -    d6 0 1', 6, 1440467,   'ccc-4     '],
  ['fen 5k2/8/8/8/8/8/8/4K2R                                    w K    -  0 1', 6, 661072,    'ccc-5     '],
  ['fen 4k2r/8/8/8/8/8/8/5K2                                    b k    -  0 1', 6, 661072,    'ccc-6     '],
  ['fen 3k4/8/8/8/8/8/8/R3K3                                    w Q    -  0 1', 6, 803711,    'ccc-7     '],
  ['fen r3k3/8/8/8/8/8/8/3K4                                    b q    -  0 1', 6, 803711,    'ccc-8     '],
  ['fen r3k2r/1b4bq/8/8/8/8/7B/R3K2R                            w KQkq -  0 1', 4, 1274206,   'ccc-9     '],
  ['fen r3k2r/7b/8/8/8/8/1B4BQ/R3K2R                            b KQkq -  0 1', 4, 1274206,   'ccc-10    '],
  ['fen r3k2r/8/3Q4/8/8/5q2/8/R3K2R                             b KQkq -  0 1', 4, 1720476,   'ccc-11    '],
  ['fen r3k2r/8/5Q2/8/8/3q4/8/R3K2R                             w KQkq -  0 1', 4, 1720476,   'ccc-12    '],
  ['fen 2K2r2/4P3/8/8/8/8/8/3k4                                 w -    -  0 1', 6, 3821001,   'ccc-13    '],
  ['fen 3K4/8/8/8/8/8/4p3/2k2R2                                 b -    -  0 1', 6, 3821001,   'ccc-14    '],
  ['fen 8/8/1P2K3/8/2n5/1q6/8/5k2                               b -    -  0 1', 5, 1004658,   'ccc-15    '],
  ['fen 5K2/8/1Q6/2N5/8/1p2k3/8/8                               w -    -  0 1', 5, 1004658,   'ccc-16    '],
  ['fen 4k3/1P6/8/8/8/8/K7/8                                    w -    -  0 1', 6, 217342,    'ccc-17    '],
  ['fen 8/k7/8/8/8/8/1p6/4K3                                    b -    -  0 1', 6, 217342,    'ccc-18    '],
  ['fen 8/P1k5/K7/8/8/8/8/8                                     w -    -  0 1', 6, 92683,     'ccc-19    '],
  ['fen 8/8/8/8/8/k7/p1K5/8                                     b -    -  0 1', 6, 92683,     'ccc-20    '],
  ['fen K1k5/8/P7/8/8/8/8/8                                     w -    -  0 1', 6, 2217,      'ccc-21    '],
  ['fen 8/8/8/8/8/p7/8/k1K5                                     b -    -  0 1', 6, 2217,      'ccc-22    '],
  ['fen 8/k1P5/8/1K6/8/8/8/8                                    w -    -  0 1', 7, 567584,    'ccc-23    '],
  ['fen 8/8/8/8/1k6/8/K1p5/8                                    b -    -  0 1', 7, 567584,    'ccc-24    '],
  ['fen 8/8/2k5/5q2/5n2/8/5K2/8                                 b -    -  0 1', 4, 23527,     'ccc-25    '],
  ['fen 8/5k2/8/5N2/5Q2/2K5/8/8                                 w -    -  0 1', 4, 23527,     'ccc-26    '],
  ['fen 4k2r/6K1/8/8/8/8/8/8                                    b k    -  0 1', 4, 2219,      'castling-9'],
  ['fen r3k3/2K5/8/8/8/8/8/8                                    b q    -  0 1', 4, 4999,      'castling-10'],
  ['fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR             w KQkq -  0 1', 6, 119060324, 'cpw-pos1-6'],
  ['fen 8/p7/8/1P6/K1k3p1/6P1/7P/8                              w -    -  0 1', 8, 8103790,   'jvm-7     '],
  ['fen n1n5/PPPk4/8/8/8/8/4Kppp/5N1N                           b -    -  0 1', 6, 71179139,  'jvm-8     '],
  ['fen r3k2r/p6p/8/B7/1pp1p3/3b4/P6P/R3K2R                     w KQkq -  0 1', 6, 77054993,  'jvm-9     '],
  ['fen 8/5p2/8/2k3P1/p3K3/8/1P6/8                              b -    -  0 1', 8, 64451405,  'jvm-11    '],
  ['fen r3k2r/pb3p2/5npp/n2p4/1p1PPB2/6P1/P2N1PBP/R3K2R         w KQkq -  0 1', 5, 29179893,  'jvm-12    '],
  ['fen 8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8                         w -    -  0 1', 7, 178633661, 'jvm-10    '],
  ['fen r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -  0 1', 5, 193690690, 'jvm-6     '],
  ['fen 8/2pkp3/8/RP3P1Q/6B1/8/2PPP3/rb1K1n1r                   w -    -  0 1', 6, 181153194, 'ob1       '],
  ['fen rnbqkb1r/ppppp1pp/7n/4Pp2/8/8/PPPP1PPP/RNBQKBNR         w KQkq f6 0 1', 6, 244063299, 'jvm-5     '],
  ['fen 8/2ppp3/8/RP1k1P1Q/8/8/2PPP3/rb1K1n1r                   w -    -  0 1', 6, 205552081, 'ob2       '],
  ['fen 8/8/3q4/4r3/1b3n2/8/3PPP2/2k1K2R                        w K    -  0 1', 6, 207139531, 'ob3       '],
  ['fen 4r2r/RP1kP1P1/3P1P2/8/8/3ppp2/1p4p1/4K2R                b K    -  0 1', 6, 314516438, 'ob4       '],
  ['fen r3k2r/8/8/8/3pPp2/8/8/R3K1RR                            b KQkq e3 0 1', 6, 485647607, 'jvm-1     '],
  ['fen 8/3K4/2p5/p2b2r1/5k2/8/8/1q6                            b -    -  0 1', 7, 493407574, 'jvm-4     '],
  ['fen r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1   w kq   -  0 1', 6, 706045033, 'jvm-2     '],
  ['fen r6r/1P4P1/2kPPP2/8/8/3ppp2/1p4p1/R3K2R                  w KQ   -  0 1', 6, 975944981, 'ob5       ']
];

//}}}

//}}}
//{{{  uci

const nodeHost = (typeof process) != 'undefined';  // node, otherwise a web worker

const fs = (nodeHost) ? require('fs') : 0;

//{{{  uciSend

function uciSend () {

  var s = '';

  for (var i = 0; i < arguments.length; i++)
    s += arguments[i] + ' ';

  if (nodeHost)
    console.log(s);
  else
    postMessage(s);

}

//}}}
//{{{  uciGetInt

function uciGetInt (tokens, key, def) {

  for (let i=0; i < tokens.length; i++)
    if (tokens[i] == key)
      if (i < tokens.length - 1)
        return parseInt(tokens[i+1]);

  return def;

}

//}}}
//{{{  uciGetStr

function uciGetStr (tokens, key, def) {  // @types tokens:strarr key:str def:str

  const lkey = key.toLowerCase();

  for (let i=0; i < tokens.length; i++)
    if (tokens[i].toLowerCase() == lkey)
      if (i < tokens.length - 1)
        return tokens[i+1];

  return def;

}

//}}}
//{{{  uciGetArr

let uciArrLo = 0;  // set by uciGetArr
let uciArrHi = 0;

function uciGetArr (tokens, key, to) {

  var lo = 0;
  var hi = 0;

  for (let i=0; i < tokens.length; i++) {
    if (tokens[i] == key) {
      lo = i + 1;  //assumes at least one item
      hi = lo;
      for (let j=lo; j < tokens.length; j++) {
        if (tokens[j] == to)
          break;
        hi = j;
      }
    }
  }

  uciArrLo = lo;
  uciArrHi = hi;

}

//}}}
//{{{  uciExec
//
// canYield is only set by uciDrain. A go then returns its promise so the
// drain waits for the search to finish before running the next command.
//

function uciExec (commands, canYield) {

  const cmdList = commands.split('\n');

  for (let c=0; c < cmdList.length; c++ ) {

    let cmdStr = cmdList[c].replace(/(\r\n|\n|\r)/gm,"");

    cmdStr = cmdStr.trim();
    cmdStr = cmdStr.replace(/\s+/g,' ');

    const tokens = cmdStr.split(' ');

    let cmd = tokens[0];

    if (!cmd)
      continue;

    switch (cmd) {

      //{{{  isready

      case 'isready': {

        uciSend('readyok');

        break;

      }
      //}}}
      //{{{  quit

      case 'quit':
      case 'q': {

        hostExit();

        break;

      }

      //}}}
      //{{{  stop

      case 'stop': {

        break;

      }
      //}}}
      //{{{  uci

      case 'uci': {

        if (getWeights() === '')
          uciSend('id name Lozza', BUILD, '(dev)');
        else
          uciSend('id name Lozza', BUILD);
        uciSend('id author Colin Jenkins');
        uciSend('uciok');

        break;

      }
      //}}}
      //{{{  ucinewgame

      case 'ucinewgame':
      case 'u': {

        break;

      }

      //}}}
      //{{{  position

      case 'position':
      case 'p': {

        let board  = START_BOARD;
        let stm    = 'w';
        let rights = 'KQkq';
        let ep     = '-';

        uciGetArr(tokens, 'fen', 'moves');

        let lo = uciArrLo;
        let hi = uciArrHi;

        if (lo > 0) {
          if (lo <= hi) board  = tokens[lo]; lo++;
          if (lo <= hi) stm    = tokens[lo]; lo++;
          if (lo <= hi) rights = tokens[lo]; lo++;
          if (lo <= hi) ep     = tokens[lo]; lo++;
        }

        const moves = [];

        uciGetArr(tokens, 'moves', 'fen');

        if (uciArrLo > 0) {
          for (let i=uciArrLo; i <= uciArrHi; i++)
            moves.push(tokens[i]);
        }

        position(nodes[0], board, stm, rights, ep, moves);

        break;

      }

      //}}}
      //{{{  board

      case 'board':
      case 'b': {

        uciSend(formatFen(nodes[0].pos));

        break;

      }

      //}}}
      //{{{  moves

      case 'm': {

        const node     = nodes[0];
        const nextNode = nodes[1];
        const pos      = node.pos;
        const stm      = pos.stm;

        genMoves(node);

        for (let i=0; i < node.numMoves; i++) {
          posCopy(pos, nextNode.pos);
          makeMove(nextNode, node.moves[i]);
          if (!isAttacked(nextNode.pos, lsb(nextNode.pos.all[KING + stm * 6]), stm ^ 1))
            uciSend(formatMove(node.moves[i]));
        }

        break;

      }

      //}}}
      //{{{  perft

      case 'perft':
      case 'f': {

        uciExec('b');

        const depth1 = uciGetInt(tokens, 'depth', 0);
        const depth2 = uciGetInt(tokens, 'to', depth1);

        for (let depth=depth1; depth <= depth2; depth++) {
          const start   = now();
          const nodes   = perft(depth, 0);
          const elapsed = now() - start;
          const nps     = nodes / elapsed * 1000 | 0;
          uciSend('depth', depth, 'nodes', nodes, 'time', elapsed, 'nps', nps);
        }

        break;

      }

      //}}}
      //{{{  pt
      //
      // Perft tests. pt n 20 runs the first 20.
      //

      case 'pt': {

        const n = uciGetInt(tokens, 'n', PERFTFENS.length);

        perftTests(n);

        break;

      }

      //}}}


      default: {
        break;
      }
    }

  }
}

//}}}
//{{{  hostExit

function hostExit () {

  if (nodeHost)
    process.exit();
  else
    close();

}

//}}}
//{{{  command queue
//
// All incoming commands go through cmdQueue and are run in order by uciDrain.
// While a search is in progress go yields after each rootSearch() hack and
// pollQueue handles stop, isready and quit; everything else waits until
// the search finishes.
//

let statsTimeOut = 0;  // set by pollQueue on stop hack

const cmdQueue = [];

let cmdBusy    = 0;
let stdinEnded = 0;

//{{{  uciQueue

function uciQueue (commands) {

  const cmdList = commands.split('\n');

  for (let c=0; c < cmdList.length; c++) {
    const cmdStr = cmdList[c].trim();
    if (cmdStr)
      cmdQueue.push(cmdStr);
  }

  if (!cmdBusy)
    uciDrain();

}

//}}}
//{{{  uciDrain

async function uciDrain () {

  cmdBusy = 1;

  while (cmdQueue.length)
    await uciExec(cmdQueue.shift(), 1);

  cmdBusy = 0;

  if (stdinEnded)
    hostExit();

}

//}}}
//{{{  pollQueue

function pollQueue () {

  for (let c=0; c < cmdQueue.length; c++) {

    const cmd = cmdQueue[c].split(' ')[0];

    if (cmd == 'stop') {  // stop based an idea by @InSys, extended with a command queue
      // anything after the stop runs after bestmove has been sent
      statsTimeOut = 1;
      cmdQueue.splice(c, 1);
      return;
    }

    if (cmd == 'isready' || cmd == 'quit' || cmd == 'q')
      uciExec(cmd);
    else
      continue;

    cmdQueue.splice(c--, 1);

  }

}

//}}}
//{{{  yeildToHost
//
// Must be a macrotask so stdin/onmessage events can run. In a web worker
// setTimeout(0) gets clamped to 4ms when nested, so use a MessageChannel.
// Node provides setImmediate.
//

const yieldChannel = (nodeHost) ? null : new MessageChannel();

let yieldResolve = null;

function yieldToHost () {

  return new Promise(function(resolve) {
    if (nodeHost)
      setImmediate(resolve);
    else {
      yieldResolve = resolve;
      yieldChannel.port2.postMessage(0);
    }
  });

}

//}}}
//{{{  checkStop

async function checkStop () {

  await yieldToHost();

  pollQueue();

  return statsTimeOut;

}
//}}}

//}}}

//{{{  initUci

function initUci () {

  if (nodeHost) {
    //{{{  node

    process.stdin.setEncoding('utf8');

    let stdinBuf = '';  // partial line carried over between chunks

    //{{{  on readable

    process.stdin.on('readable', function() {
      const chunk = process.stdin.read();
      process.stdin.resume();
      if (chunk !== null) {
        stdinBuf += chunk;
        const nl = stdinBuf.lastIndexOf('\n');
        if (nl >= 0) {
          uciQueue(stdinBuf.slice(0, nl));
          stdinBuf = stdinBuf.slice(nl + 1);
        }
      }
    });
    //}}}
    //{{{  on end

    process.stdin.on('end', function() {
      // let any queued commands (inc. a running search) finish first
      stdinEnded = 1;
      if (stdinBuf)
        uciQueue(stdinBuf);
      if (!cmdBusy)
        hostExit();
    });

    //}}}
    //}}}
  }

  else {
    //{{{  web

    onmessage = function(e) {
      uciQueue(e.data);
    };

    yieldChannel.port1.onmessage = function() { yieldResolve(); };

    //}}}
  }

}

//}}}

//}}}

//{{{  init once

function initOnce () {

  initBitboards();
  initBoard();
  initNodes();
  initMoves();
  initUci();

  position(nodes[0], START_BOARD, 'w', 'KQkq', '-', []);

}

initOnce();

//{{{  process command line and quit
//
// command line arguments are commands, e.g. node lozza.js "go depth 10";
// they go through the queue so a go completes before the exit.
//

if (nodeHost) {

  const argv = process.argv.slice(2);

  if (argv.length) {
    stdinEnded = 1;
    uciQueue(argv.join('\n'));
  }
}

//}}}
//}}}

//{{{  weights

function getWeights() {
  return '';
}

//}}}

