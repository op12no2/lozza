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
const MAX_HH    = 1024;  // game plus search plies kept for repetition detection

const INF     = 32001;
const MATE    = 32000;
const MATEISH = 31000;  // scores beyond this are mates

const BENCH_DEPTH = 12;

//{{{  net
//
// (768->256)x2->1 with squared relu, quantised QA/QB and scaled to centipawns.
//

const NET_QA      = 255;
const NET_QB      = 64;
const NET_QAB     = NET_QA * NET_QB;
const NET_SCALE   = 400;
const NET_I_SIZE  = 768;
const NET_H1_SIZE = 256;

//}}}
//{{{  tt

const TT_EXACT = 1;
const TT_ALPHA = 2;
const TT_BETA  = 4;

//}}}
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
const MOVE_NOISY    = MOVE_PROMOTE | MOVE_CAPTURE;  // (move & MOVE_NOISY) == 0 is a quiet move

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
//{{{  net
//
// (768->256)x2->1 with squared relu: the Lozza 11 net and weights file, so that
// Lozza 11, junk/rewrite.js and this engine evaluate identically. A feature is
// piece * 64 + sq (WPAWN..BKING, a1 = 0), which is also the bullet index.
//
// Each node owns two accumulators (us, them) in netAcc, one flat array so that
// V8 sees a constant base: node.acc1 and node.acc2 are the offsets. makeMove()
// records what changed in the node (ueType, ueArgs*) and marks it dirty; nothing
// is computed until netEval() needs it, when netRefresh() walks up to the nearest
// clean ancestor and applies the recorded updates downwards, child = parent + delta.
// The root is made clean by position().
//

const NET_WEIGHTS_FILE = '/home/xyzzy/lozza/nets/blobby/lozza-200/quantised.bin';  // ignore - only relevant for dev version

const net_h1_w_flat = new Int32Array(NET_I_SIZE * NET_H1_SIZE);  // us: feature * NET_H1_SIZE
const net_h2_w_flat = new Int32Array(NET_I_SIZE * NET_H1_SIZE);  // them
const net_h1_b      = new Int32Array(NET_H1_SIZE);
const net_o_w       = new Int32Array(NET_H1_SIZE * 2);
let   net_o_b       = 0;

const netAcc = new Int32Array(MAX_PLY * 2 * NET_H1_SIZE);

const UE_MOVE      = 1;
const UE_CAPTURE   = 2;
const UE_EPCAPTURE = 3;
const UE_PROMOTE   = 4;  // with or without a capture
const UE_CASTLE    = 5;
const UE_COPY      = 6;  // null move

//{{{  getWeightsBuffer

function getWeightsBuffer() {

  const weightsB64 = getWeights();  // '' in the dev version, embedded at release time

  if (weightsB64 === '')
    return fs.readFileSync(NET_WEIGHTS_FILE);

  const b64 = weightsB64.replace(/\s+/g, "");

  if (typeof Buffer !== 'undefined' && Buffer.from) {
    // node
    return Buffer.from(b64, 'base64');
  }

  if (typeof atob !== 'undefined') {
    // browser
    const binStr = atob(b64);
    const n = binStr.length;
    const bytes = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return bytes;
  }

  // bare v8: decode by hand

  const T = new Uint8Array(128);
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  for (let i=0; i < 64; i++)
    T[A.charCodeAt(i)] = i;

  let len = b64.length;

  while (len > 0 && b64[len-1] === '=')
    len--;

  const bytes = new Uint8Array((len * 3) >>> 2);

  let o    = 0;
  let acc  = 0;
  let bits = 0;

  for (let i=0; i < len; i++) {
    acc  = ((acc << 6) | T[b64.charCodeAt(i)]) & 0xFFFF;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[o++] = (acc >>> bits) & 0xFF;
    }
  }

  return bytes;

}

//}}}
//{{{  netLoad
//
// The bullet layout: 768x256 int16 input weights, 256 biases, 2x256 output
// weights and the output bias. The them weights are the us weights with the
// feature flipped, so a position is seen from both sides with one table read.
//

function netLoad () {

  let offset = 0;

  const buffer = getWeightsBuffer();

  const dataView = new Int16Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength >> 1
  );

  for (let i = 0; i < NET_I_SIZE; i++) {
    const lozIndex = bullet2lozza(i);
    const h = i * NET_H1_SIZE;
    for (let j = 0; j < NET_H1_SIZE; j++) {
      net_h1_w_flat[lozIndex            * NET_H1_SIZE + j] = dataView[h + j];  // us
      net_h2_w_flat[flipIndex(lozIndex) * NET_H1_SIZE + j] = dataView[h + j];  // them
    }
  }

  offset += NET_I_SIZE * NET_H1_SIZE;
  for (let i = 0; i < NET_H1_SIZE; i++) {
    net_h1_b[i] = dataView[offset + i];
  }

  offset += NET_H1_SIZE;
  for (let i = 0; i < NET_H1_SIZE * 2; i++) {
    net_o_w[i] = dataView[offset + i];
  }

  offset += NET_H1_SIZE * 2;
  net_o_b = dataView[offset];

}

//}}}
//{{{  flipIndex
//
// The same feature from the other side's point of view: swap the colour and
// mirror the square vertically. Slow. Only use during init.
//

function flipIndex (index) {

  const piece = index >> 6;
  const sq    = index & 63;

  return ((piece + 6) % 12) * 64 + (sq ^ 56);

}

//}}}
//{{{  bullet2lozza
//
// Lozza features are the bullet features, so this is the identity. Kept so that
// netLoad() here and in the C runtime read the same way.
//

function bullet2lozza (index) {

  return index;

}

//}}}
//{{{  netEval
//
// Side to move relative eval in centipawns.
//

function netEval (node) {

  if (node.accDirty)
    netRefresh(node);

  if (node.pos.stm == WHITE)
    return netEval2(node.acc1, node.acc2);
  else
    return netEval2(node.acc2, node.acc1);

}

function netEval2 (o1, o2) {

  const w  = net_o_w;
  const a  = netAcc;
  const N  = NET_H1_SIZE | 0;

  let e  = 0 | 0;
  let p1 = 0 | 0;
  let p2 = N | 0;
  let i1 = o1 | 0;
  let i2 = o2 | 0;

  while (p1 < N) {

    const x1 = a[i1] | 0;
    const x2 = a[i2] | 0;
    i1++; i2++;

    const y1 = x1 & ~(x1 >> 31);  // relu
    const y2 = x2 & ~(x2 >> 31);

    e = (e + Math.imul(w[p1], Math.imul(y1, y1)) + Math.imul(w[p2], Math.imul(y2, y2))) | 0;  // squared

    p1++; p2++;

  }

  let e2 = e;

  e2 = (e2 / NET_QA) | 0;
  e2 = (e2 + (net_o_b | 0)) | 0;
  e2 = Math.imul(e2, NET_SCALE | 0) | 0;
  e2 = (e2 / NET_QAB) | 0;

  return e2 | 0;

}

//}}}
//{{{  netReset
//
// Compute a node's accumulators from its board.
//

function netReset (node) {

  const a     = netAcc;
  const o1    = node.acc1;
  const o2    = node.acc2;
  const board = node.pos.board;

  for (let h=0; h < NET_H1_SIZE; h++) {
    a[o1 + h] = net_h1_b[h];
    a[o2 + h] = net_h1_b[h];
  }

  for (let sq=0; sq < 64; sq++) {

    const piece = board[sq];

    if (piece == EMPTY)
      continue;

    const off = ((piece << 6) | sq) * NET_H1_SIZE;

    for (let h=0; h < NET_H1_SIZE; h++) {
      a[o1 + h] += net_h1_w_flat[off + h];
      a[o2 + h] += net_h2_w_flat[off + h];
    }

  }

  node.accDirty = 0;

}

//}}}
//{{{  netRefresh
//
// Bring a node's accumulators up to date. The parent must be clean first; the
// root is always clean after position(), so the walk up always terminates.
//

function netRefresh (node) {

  const parent = nodes[node.ply - 1];

  if (parent.accDirty)
    netRefresh(parent);

  switch (node.ueType) {
    case UE_MOVE: {
      netMove(parent, node);
      break;
    }
    case UE_CAPTURE: {
      netCapture(parent, node);
      break;
    }
    case UE_EPCAPTURE: {
      netEpCapture(parent, node);
      break;
    }
    case UE_PROMOTE: {
      netPromote(parent, node);
      break;
    }
    case UE_CASTLE: {
      netCastle(parent, node);
      break;
    }
    case UE_COPY: {
      netCopy(parent, node);
      break;
    }
  }

  node.accDirty = 0;

}

//}}}
//{{{  netCopy

function netCopy (parent, node) {

  const a = netAcc;
  const n = NET_H1_SIZE * 2;

  let c = node.acc1;
  let q = parent.acc1;

  for (let i=0; i < n; i++)
    a[c++] = a[q++];

}

//}}}
//{{{  netMove

function netMove (parent, node) {

  const piece = node.ueArgs0 << 6;
  const from  = node.ueArgs1 | 0;
  const to    = node.ueArgs2 | 0;

  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const a   = netAcc;
  let   c1  = node.acc1   | 0, c2 = node.acc2   | 0;
  let   q1  = parent.acc1 | 0, q2 = parent.acc2 | 0;

  const e1 = c1 + NET_H1_SIZE | 0;

  let p1 = (piece | from) * NET_H1_SIZE;
  let p2 = (piece | to)   * NET_H1_SIZE;

  while (c1 < e1) {
    a[c1] = a[q1] + h1w[p2] - h1w[p1];
    a[c2] = a[q2] + h2w[p2] - h2w[p1];
    c1++; c2++; q1++; q2++; p1++; p2++;
  }

}

//}}}
//{{{  netCapture

function netCapture (parent, node) {

  const piece    = node.ueArgs0 << 6;
  const from     = node.ueArgs1 | 0;
  const capPiece = node.ueArgs2 << 6;
  const to       = node.ueArgs3 | 0;

  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const a   = netAcc;
  let   c1  = node.acc1   | 0, c2 = node.acc2   | 0;
  let   q1  = parent.acc1 | 0, q2 = parent.acc2 | 0;

  const e1 = c1 + NET_H1_SIZE | 0;

  let p1 = (piece    | from) * NET_H1_SIZE;
  let p2 = (capPiece | to)   * NET_H1_SIZE;
  let p3 = (piece    | to)   * NET_H1_SIZE;

  while (c1 < e1) {
    a[c1] = a[q1] + h1w[p3] - h1w[p2] - h1w[p1];
    a[c2] = a[q2] + h2w[p3] - h2w[p2] - h2w[p1];
    c1++; c2++; q1++; q2++; p1++; p2++; p3++;
  }

}

//}}}
//{{{  netEpCapture

function netEpCapture (parent, node) {

  const pawn    = node.ueArgs0 << 6;
  const from    = node.ueArgs1 | 0;
  const to      = node.ueArgs2 | 0;
  const capPawn = node.ueArgs3 << 6;
  const capSq   = node.ueArgs4 | 0;

  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const a   = netAcc;
  let   c1  = node.acc1   | 0, c2 = node.acc2   | 0;
  let   q1  = parent.acc1 | 0, q2 = parent.acc2 | 0;

  const e1 = c1 + NET_H1_SIZE | 0;

  let p1 = (pawn    | from)  * NET_H1_SIZE;
  let p2 = (pawn    | to)    * NET_H1_SIZE;
  let p3 = (capPawn | capSq) * NET_H1_SIZE;

  while (c1 < e1) {
    a[c1] = a[q1] + h1w[p2] - h1w[p1] - h1w[p3];
    a[c2] = a[q2] + h2w[p2] - h2w[p1] - h2w[p3];
    c1++; c2++; q1++; q2++; p1++; p2++; p3++;
  }

}

//}}}
//{{{  netPromote

function netPromote (parent, node) {

  const pawn       = node.ueArgs0 << 6;
  const from       = node.ueArgs1 | 0;
  const to         = node.ueArgs2 | 0;
  const capPiece   = node.ueArgs3 | 0;  // EMPTY for a push
  const promoPiece = node.ueArgs4 << 6;

  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const a   = netAcc;
  let   c1  = node.acc1   | 0, c2 = node.acc2   | 0;
  let   q1  = parent.acc1 | 0, q2 = parent.acc2 | 0;

  const e1 = c1 + NET_H1_SIZE | 0;

  let p1 = (pawn       | from) * NET_H1_SIZE;
  let p2 = (promoPiece | to)   * NET_H1_SIZE;

  if (capPiece != EMPTY) {
    let p3 = ((capPiece << 6) | to) * NET_H1_SIZE;
    while (c1 < e1) {
      a[c1] = a[q1] + h1w[p2] - h1w[p1] - h1w[p3];
      a[c2] = a[q2] + h2w[p2] - h2w[p1] - h2w[p3];
      c1++; c2++; q1++; q2++; p1++; p2++; p3++;
    }
  }
  else {
    while (c1 < e1) {
      a[c1] = a[q1] + h1w[p2] - h1w[p1];
      a[c2] = a[q2] + h2w[p2] - h2w[p1];
      c1++; c2++; q1++; q2++; p1++; p2++;
    }
  }

}

//}}}
//{{{  netCastle

function netCastle (parent, node) {

  const king   = node.ueArgs0 << 6;
  const kingFr = node.ueArgs1 | 0;
  const kingTo = node.ueArgs2 | 0;
  const rook   = node.ueArgs3 << 6;
  const rookFr = node.ueArgs4 | 0;
  const rookTo = node.ueArgs5 | 0;

  const h1w = net_h1_w_flat, h2w = net_h2_w_flat;
  const a   = netAcc;
  let   c1  = node.acc1   | 0, c2 = node.acc2   | 0;
  let   q1  = parent.acc1 | 0, q2 = parent.acc2 | 0;

  const e1 = c1 + NET_H1_SIZE | 0;

  let p1 = (king | kingFr) * NET_H1_SIZE;
  let p2 = (king | kingTo) * NET_H1_SIZE;
  let p3 = (rook | rookFr) * NET_H1_SIZE;
  let p4 = (rook | rookTo) * NET_H1_SIZE;

  while (c1 < e1) {
    a[c1] = a[q1] + h1w[p2] - h1w[p1] + h1w[p4] - h1w[p3];
    a[c2] = a[q2] + h2w[p2] - h2w[p1] + h2w[p4] - h2w[p3];
    c1++; c2++; q1++; q2++; p1++; p2++; p3++; p4++;
  }

}

//}}}

//{{{  initNet

function initNet () {

  netLoad();

}

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
//{{{  repetitions
//
// Hashes of the positions played in the game then those on the current search
// path, as lo/hi int32 pairs. hhRootPly is the index of the root position, set
// by go(); search() stores each ply's hash at hhRootPly + ply before asking
// isDraw(). A repetition inside the search is a draw at once, a position seen
// before the root must occur three times.
//

const hhLo = new Int32Array(MAX_HH);
const hhHi = new Int32Array(MAX_HH);

let hhGamePly = 0;  // positions pushed by position()
let hhRootPly = 0;

//{{{  hhReset

function hhReset () {

  hhGamePly = 0;
  hhRootPly = 0;

}

//}}}
//{{{  hhPush

function hhPush (pos) {

  if (hhGamePly < MAX_HH) {
    scratch64[0] = pos.all[HASH];
    hhLo[hhGamePly] = scratch32[0] | 0;
    hhHi[hhGamePly] = scratch32[1] | 0;
    hhGamePly++;
  }

}

//}}}
//{{{  hhSetRoot

function hhSetRoot () {

  hhRootPly = hhGamePly - 1;

}

//}}}
//{{{  hhStore

function hhStore (searchPly, pos) {

  const i = hhRootPly + searchPly;

  if (i < MAX_HH) {
    scratch64[0] = pos.all[HASH];
    hhLo[i] = scratch32[0] | 0;
    hhHi[i] = scratch32[1] | 0;
  }

}

//}}}
//{{{  isDraw
//
// 50 move rule or repetition. hhStore() must have been called for this ply.
//

function isDraw (searchPly, pos) {

  if (pos.hmc >= 100)
    return 1;

  const current = hhRootPly + searchPly;

  if (current >= MAX_HH)
    return 0;

  // only positions since the last irreversible move can repeat

  let earliest = current - pos.hmc;

  if (earliest < 0)
    earliest = 0;

  scratch64[0] = pos.all[HASH];

  const lo = scratch32[0] | 0;
  const hi = scratch32[1] | 0;

  let count = 0;

  for (let i = current - 2; i >= earliest; i -= 2) {  // same side to move only
    if (hhLo[i] == lo && hhHi[i] == hi) {
      count++;
      if (i >= hhRootPly)
        return 1;  // twofold within the search
      if (count >= 2)
        return 1;  // threefold overall
    }
  }

  return 0;

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
// Set up node.pos from the parts of a fen and play the uci moves. node is the
// root; its accumulators and the repetition history are rebuilt.
//

function position (node, board, stm, rights, ep, hmc, moves) {

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

  pos.hmc       = hmc;
  pos.all[HASH] = rebuildHash(pos);

  hhReset();
  hhPush(pos);

  for (let i=0; i < moves.length; i++) {
    playMove(node, moves[i]);
    hhPush(pos);
  }

  netReset(node);
  node.contBase = CONT_NONE;

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
//
// One per ply. The fields are fixed in the constructor so the transpiler can
// make a struct of it.
//

function Node () {

  this.ply = 0;
  this.pos = new Position();

  // move picking, see the iterator fold

  this.moves    = new Int32Array(MAX_MOVES);
  this.ranks    = new Int32Array(MAX_MOVES);
  this.played   = new Int32Array(MAX_MOVES);  // legal moves searched at this node, for the history updates
  this.numMoves = 0;
  this.nextMove = 0;
  this.stage    = 0;
  this.inCheck  = 0;
  this.ttMove   = 0;
  this.killer   = 0;
  this.contBase = 0;  // offset of the previous move's block in contHistory, CONT_NONE at the root and after a null move

  // search

  this.excludedMove = 0;  // singular extension verification
  this.dextensions  = 0;  // double extensions on the path
  this.ev           = 0;  // static eval
  this.pv           = new Int32Array(MAX_PLY);
  this.pvLen        = 0;

  // net

  this.acc1     = 0;  // offsets of this node's accumulators in netAcc
  this.acc2     = 0;
  this.accDirty = 0;
  this.ueType   = 0;
  this.ueArgs0  = 0;
  this.ueArgs1  = 0;
  this.ueArgs2  = 0;
  this.ueArgs3  = 0;
  this.ueArgs4  = 0;
  this.ueArgs5  = 0;

}

//}}}

const nodes = Array(MAX_PLY);

//{{{  clearNodes
//
// Between searches.
//

function clearNodes () {

  for (let i=0; i < MAX_PLY; i++) {

    const node = nodes[i];

    node.killer       = 0;
    node.contBase     = CONT_NONE;
    node.excludedMove = 0;
    node.dextensions  = 0;
    node.ev           = 0;

  }

}

//}}}
//{{{  initNodes

function initNodes () {

  for (let i=0; i < MAX_PLY; i++) {
    nodes[i] = new Node();
    Object.seal(nodes[i].pos);
    Object.seal(nodes[i]);
    nodes[i].ply  = i;
    nodes[i].acc1 = i * 2 * NET_H1_SIZE;
    nodes[i].acc2 = i * 2 * NET_H1_SIZE + NET_H1_SIZE;
  }

  clearNodes();

}

//}}}

//}}}
//{{{  tt
//
// Four int32 words per entry: the two hash words, the move and
// flags | depth << 8 | score << 16. The low hash word picks the entry.
//

let ttDefault = 16;  // mb
let ttSize    = 1;   // entries
let ttMask    = 0;

const ttWords = 4;
const ttWidth = ttWords * 4;  // bytes

let tt = new Int32Array(ttSize * ttWords);

let ttHashUsed = 0;

// set by ttProbe()

let ttMove  = 0;
let ttFlags = 0;
let ttDepth = 0;
let ttScore = 0;  // as stored, see getAdjustedScore()

//{{{  ttResize

function ttResize (mb) {

  if (mb < 1)
    mb = 1;

  if (mb > 1024)
    mb = 1024;

  const entriesNeeded = mb * 1024 * 1024 / ttWidth;
  const pow2          = Math.floor(Math.log2(entriesNeeded));

  ttSize = 1 << pow2;
  ttMask = ttSize - 1;

  tt = new Int32Array(ttSize * ttWords);

  ttHashUsed = 0;

  const sm   = silentMode;
  silentMode = 0;

  uciSend('info string tt bits', pow2, 'entries', ttSize, 'bytes', ttWidth * ttSize);

  silentMode = sm;

}

//}}}
//{{{  ttClear

function ttClear () {

  tt.fill(0);

  ttHashUsed = 0;

}

//}}}
//{{{  mate score adjustment
//
// Mate scores are stored relative to the node so they are right from any ply.
//

function putAdjustedScore (ply, score) {

  if (score < -MATEISH)
    return score - ply;

  else if (score > MATEISH)
    return score + ply;

  else
    return score;

}

function getAdjustedScore (ply, score) {

  if (score < -MATEISH)
    return score + ply;

  else if (score > MATEISH)
    return score - ply;

  else
    return score;

}

//}}}
//{{{  ttPut
//
// A deeper entry for the same position is kept.
//

function ttPut (pos, flags, depth, score, move) {

  scratch64[0] = pos.all[HASH];

  const lo = scratch32[0] | 0;
  const hi = scratch32[1] | 0;
  const i  = Math.imul(lo & ttMask, ttWords);

  const info     = tt[i+3];
  const oldFlags = info & 0xFF;

  if (oldFlags != 0 && tt[i] == lo && tt[i+1] == hi && ((info >> 8) & 0xFF) > depth)
    return;

  if (oldFlags == 0)
    ttHashUsed++;

  tt[i]   = lo;
  tt[i+1] = hi;
  tt[i+2] = move;
  tt[i+3] = flags | (depth << 8) | (score << 16);

}

//}}}
//{{{  ttProbe
//
// 1 and the tt* globals set if the position is in the table.
//

function ttProbe (pos) {

  scratch64[0] = pos.all[HASH];

  const lo = scratch32[0] | 0;
  const hi = scratch32[1] | 0;
  const i  = Math.imul(lo & ttMask, ttWords);

  const info = tt[i+3];

  ttFlags = info & 0xFF;

  if (ttFlags == 0 || tt[i] != lo || tt[i+1] != hi) {
    ttFlags = 0;
    ttMove  = 0;
    ttDepth = 0;
    ttScore = 0;
    return 0;
  }

  ttMove  = tt[i+2];
  ttDepth = (info >> 8) & 0xFF;
  ttScore = info >> 16;

  if (ttMove && !ttMoveOk(pos, ttMove))
    ttMove = 0;

  return 1;

}

//}}}
//{{{  ttMoveOk
//
// The tt move is made without being generated, so guard makeMove() against a
// hash collision: the pieces the move names must be where it says.
//

function ttMoveOk (pos, move) {

  const board     = pos.board;
  const stm       = pos.stm;
  const from      = (move & MOVE_FR_MASK) >> MOVE_FR_BITS;
  const to        = move & MOVE_TO_MASK;
  const fromPiece = board[from];
  const toPiece   = board[to];

  if (fromPiece == EMPTY || ((fromPiece >= BPAWN) | 0) != stm)
    return 0;

  if (move & MOVE_EPCAPTURE)
    return (toPiece == EMPTY && to == pos.ep) | 0;

  if (move & MOVE_CAPTURE)
    return (toPiece != EMPTY && ((toPiece >= BPAWN) | 0) != stm) | 0;

  if (toPiece != EMPTY)
    return 0;

  if (move & MOVE_CASTLE)
    return (fromPiece == KING + stm * 6 && board[ROOK_FROM[to]] == ROOK + stm * 6) | 0;

  return 1;

}

//}}}
//{{{  newGame

function newGame () {

  if (ttSize == 1)
    ttResize(ttDefault);

  ttClear();

  pieceToHistory.fill(0);
  contHistory.fill(0);
  captureHistory.fill(0);
  pawnCorr.fill(0);

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
//{{{  iterator
//
// Staged move picking for search and qsearch: the tt move, then the noisy moves
// ranked by mvv/lva and capture history, then the quiets ranked by the killer
// and the piece-to and continuation histories. Selection sort: the best
// remaining move is swapped to the front each time. From cwtch 6 (iterate.c).
//

const MVV_AUGMENT = new Int32Array([0, 4800, 4800, 9600, 19200, 0]);  // P N B R Q K

//{{{  removeTTMove
//
// The tt move was returned at stage 0 so take it out of the generated list.
//

function removeTTMove (node) {

  const ttMove = node.ttMove;

  if (ttMove == 0)
    return;

  const moves = node.moves;
  const n     = node.numMoves;

  for (let i=0; i < n; i++) {
    if (moves[i] == ttMove) {
      moves[i] = moves[n-1];
      node.numMoves--;
      return;
    }
  }

}

//}}}
//{{{  getNextSortedMove

function getNextSortedMove (node) {

  const moves = node.moves;
  const ranks = node.ranks;
  const next  = node.nextMove;
  const num   = node.numMoves;

  let maxR = ranks[next];
  let maxI = next;

  for (let i=next+1; i < num; i++) {
    if (ranks[i] > maxR) {
      maxR = ranks[i];
      maxI = i;
    }
  }

  const maxM = moves[maxI];

  moves[maxI] = moves[next];
  ranks[maxI] = ranks[next];

  node.nextMove++;

  return maxM;

}

//}}}
//{{{  rankQuiets

function rankQuiets (node) {

  const board    = node.pos.board;
  const moves    = node.moves;
  const ranks    = node.ranks;
  const killer   = node.killer;
  const contBase = node.contBase;
  const n        = node.numMoves;

  for (let i=0; i < n; i++) {

    const m = moves[i];

    if (m == killer) {
      ranks[i] = KILLER;
    }

    else {

      const from = (m & MOVE_FR_MASK) >> MOVE_FR_BITS;
      const to   = m & MOVE_TO_MASK;
      const pt   = (board[from] << 6) | to;

      // the average keeps the sum below KILLER

      if (contBase == CONT_NONE)
        ranks[i] = pieceToHistory[pt];
      else
        ranks[i] = ((pieceToHistory[pt] + contHistory[contBase + pt]) / 2) | 0;

    }

  }

}

//}}}
//{{{  rankNoisy

function rankNoisy (node) {

  const board = node.pos.board;
  const moves = node.moves;
  const ranks = node.ranks;
  const n     = node.numMoves;

  for (let i=0; i < n; i++) {

    const m    = moves[i];
    const from = (m & MOVE_FR_MASK) >> MOVE_FR_BITS;
    const to   = m & MOVE_TO_MASK;

    if (m & MOVE_CAPTURE) {

      const piece = board[from];

      let victim = board[to];

      victim = (victim == EMPTY) ? PAWN : victim % 6;  // ep -> pawn

      // mvv + lva tiebreak + capture history

      ranks[i] = 64000 + MVV_AUGMENT[victim] + (5 - piece % 6) + captureHistory[Math.imul((piece << 6) | to, 6) + victim];

    }

    else {

      // non-capture promotion

      const promoPiece = (m & MOVE_PROMO_MASK) >> MOVE_PROMO_BITS;

      ranks[i] = 64000 + MVV_AUGMENT[promoPiece];

    }

  }

}

//}}}
//{{{  initNextSearchMove

function initNextSearchMove (node, inCheck, ttMove) {

  node.stage   = 0;
  node.inCheck = inCheck;
  node.ttMove  = ttMove;

}

//}}}
//{{{  getNextSearchMove

function getNextSearchMove (node) {

  switch (node.stage) {

    case 0: {

      node.stage++;
      node.numMoves = 0;
      node.nextMove = 0;

      if (node.ttMove)
        return node.ttMove;

    }

    case 1: {

      node.stage++;
      node.numMoves = 0;
      node.nextMove = 0;

      genNoisy(node);
      removeTTMove(node);
      rankNoisy(node);

    }

    case 2: {

      if (node.nextMove < node.numMoves)
        return getNextSortedMove(node);

      node.stage++;
      node.numMoves = 0;
      node.nextMove = 0;

      genQuiets(node);
      removeTTMove(node);
      rankQuiets(node);

    }

    case 3: {

      if (node.nextMove < node.numMoves)
        return getNextSortedMove(node);

      return 0;

    }

  }

  return 0;

}

//}}}
//{{{  initNextQSearchMove

function initNextQSearchMove (node, inCheck, ttMove) {

  node.stage   = 0;
  node.inCheck = inCheck;
  node.ttMove  = ttMove;

}

//}}}
//{{{  getNextQSearchMove

function getNextQSearchMove (node) {

  switch (node.stage) {

    case 0: {

      node.stage++;
      node.numMoves = 0;
      node.nextMove = 0;

      if (node.ttMove)
        return node.ttMove;

    }

    case 1: {

      node.stage++;
      node.numMoves = 0;
      node.nextMove = 0;

      genNoisy(node);
      removeTTMove(node);
      rankNoisy(node);

    }

    case 2: {

      if (node.nextMove < node.numMoves)
        return getNextSortedMove(node);

      return 0;

    }

  }

  return 0;

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

    node.ueType  = UE_MOVE;
    node.ueArgs0 = fromPiece;
    node.ueArgs1 = from;
    node.ueArgs2 = to;

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

    node.ueType  = UE_CAPTURE;
    node.ueArgs0 = fromPiece;
    node.ueArgs1 = from;
    node.ueArgs2 = toPiece;
    node.ueArgs3 = to;

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

    node.ueType  = UE_EPCAPTURE;
    node.ueArgs0 = fromPiece;
    node.ueArgs1 = from;
    node.ueArgs2 = to;
    node.ueArgs3 = capPiece;
    node.ueArgs4 = capSq;

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

    node.ueType  = UE_PROMOTE;
    node.ueArgs0 = fromPiece;
    node.ueArgs1 = from;
    node.ueArgs2 = to;
    node.ueArgs3 = toPiece;
    node.ueArgs4 = promoPiece;

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

    node.ueType  = UE_PROMOTE;
    node.ueArgs0 = fromPiece;
    node.ueArgs1 = from;
    node.ueArgs2 = to;
    node.ueArgs3 = EMPTY;
    node.ueArgs4 = promoPiece;

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

    node.ueType  = UE_CASTLE;
    node.ueArgs0 = fromPiece;
    node.ueArgs1 = from;
    node.ueArgs2 = to;
    node.ueArgs3 = rookPiece;
    node.ueArgs4 = rf;
    node.ueArgs5 = rt;

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

    node.ueType  = UE_MOVE;
    node.ueArgs0 = fromPiece;
    node.ueArgs1 = from;
    node.ueArgs2 = to;

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

  node.accDirty = 1;

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
      return;
    }
  }

}

//}}}
//{{{  makeNull
//
// Pass the turn on node.pos in place: no ep square, same pieces (so the node
// inherits its parent's accumulators) and nothing matchable on the rep stack.
//

function makeNull (node) {

  const pos = node.pos;
  const all = pos.all;

  all[HASH] ^= zobEp[pos.ep] ^ zobEp[0] ^ zobStm[1];

  pos.ep   = 0;
  pos.stm ^= 1;
  pos.hmc  = 0;

  node.ueType   = UE_COPY;
  node.accDirty = 1;
  node.contBase = CONT_NONE;

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
//{{{  evaluate

//{{{  isMatDraw
//
// Insufficient material: bare kings, one minor, or same coloured bishops.
//

const LIGHT_SQUARES = 0x55AA55AA55AA55AAn;

function isMatDraw (pos) {

  const all = pos.all;

  scratch64[0] = all[WPAWN] | all[BPAWN] | all[WROOK] | all[BROOK] | all[WQUEEN] | all[BQUEEN];
  if (scratch32[0] | scratch32[1])
    return 0;

  const knights = BigInt.asUintN(64, all[WKNIGHT] | all[BKNIGHT]);
  const bishops = BigInt.asUintN(64, all[WBISHOP] | all[BBISHOP]);
  const minors  = BigInt.asUintN(64, knights | bishops);

  scratch64[0] = minors;
  if (!(scratch32[0] | scratch32[1]))
    return 1;  // K v K

  scratch64[0] = clearLsb(minors);
  if (!(scratch32[0] | scratch32[1]))
    return 1;  // one minor

  scratch64[0] = knights;
  if (!(scratch32[0] | scratch32[1]) && popcnt(bishops) == 2) {
    const onLight = BigInt.asUintN(64, bishops & LIGHT_SQUARES);
    scratch64[0] = onLight;
    if (!(scratch32[0] | scratch32[1]))
      return 1;  // both dark
    scratch64[0] = onLight ^ bishops;
    if (!(scratch32[0] | scratch32[1]))
      return 1;  // both light
  }

  return 0;

}

//}}}
//{{{  isPawnEndgame

function isPawnEndgame (pos) {

  const all = pos.all;

  scratch64[0] = all[OCCUPIED] ^ (all[WKING] | all[WPAWN] | all[BKING] | all[BPAWN]);

  return ((scratch32[0] | scratch32[1]) == 0) | 0;

}

//}}}
//{{{  evaluate
//
// Side to move relative static eval.
//

function evaluate (node) {

  return netEval(node);

}

//}}}

//}}}
//{{{  search
//
// A port of cwtch 6 (search.c, qsearch.c, go.c, timecontrol.c, history.c,
// corrhist.c, see.c) with the position in nodes[ply].pos and copy-make.
//

//{{{  lmr

const LMR = new Int32Array((MAX_PLY + 4) * MAX_MOVES);  // [depth << 8 | moves played], see initSearch()

//}}}
//{{{  history
//
// Piece-to, continuation (the previous move's piece-to then this move's) and
// capture (piece, to, victim type) histories, int16 with gravity so that a
// score settles in [-MAX_HISTORY, MAX_HISTORY]. The killer ranks above them all.
// node.contBase is the offset of the previous move's block in contHistory, or
// CONT_NONE (a block of zeros) at the root and after a null move. Cleared by
// newGame().
//

const MAX_HISTORY = 32766;
const KILLER      = 32767;

const CONT_NONE = 12 * 64 * 12 * 64;

const pieceToHistory = new Int16Array(12 * 64);              // piece << 6 | to
const contHistory    = new Int16Array(CONT_NONE + 12 * 64);  // (prevPiece << 6 | prevTo) * 768 + (piece << 6 | to)
const captureHistory = new Int16Array(12 * 64 * 6);          // (piece << 6 | to) * 6 + victim type (ep -> pawn)

//{{{  updatePieceToHistory

function updatePieceToHistory (pos, move, bonus) {

  const from = (move & MOVE_FR_MASK) >> MOVE_FR_BITS;
  const to   = move & MOVE_TO_MASK;
  const i    = (pos.board[from] << 6) | to;
  const h    = pieceToHistory[i];

  pieceToHistory[i] = h + bonus - ((Math.imul(h, Math.abs(bonus)) / MAX_HISTORY) | 0);

}

//}}}
//{{{  updateContHistory

function updateContHistory (node, pos, move, bonus) {

  if (node.contBase == CONT_NONE)
    return;

  const from = (move & MOVE_FR_MASK) >> MOVE_FR_BITS;
  const to   = move & MOVE_TO_MASK;
  const i    = node.contBase + ((pos.board[from] << 6) | to);
  const h    = contHistory[i];

  contHistory[i] = h + bonus - ((Math.imul(h, Math.abs(bonus)) / MAX_HISTORY) | 0);

}

//}}}
//{{{  updateCaptureHistory

function updateCaptureHistory (pos, move, bonus) {

  const from  = (move & MOVE_FR_MASK) >> MOVE_FR_BITS;
  const to    = move & MOVE_TO_MASK;
  const piece = pos.board[from];

  let victim = pos.board[to];

  victim = (victim == EMPTY) ? PAWN : victim % 6;  // ep -> pawn

  const i = Math.imul((piece << 6) | to, 6) + victim;
  const h = captureHistory[i];

  captureHistory[i] = h + bonus - ((Math.imul(h, Math.abs(bonus)) / MAX_HISTORY) | 0);

}

//}}}

//}}}
//{{{  corrhist
//
// Pawn structure correction history: how the search has differed from the
// static eval in positions with this pawn structure, in CORR_GRAIN units per cp.
//

const CORR_SIZE         = 16384;  // power of two
const CORR_GRAIN        = 256;
const CORR_LIMIT        = 32 * CORR_GRAIN;
const CORR_WEIGHT_MAX   = 16;
const CORR_WEIGHT_SCALE = 256;

const pawnCorr = new Int16Array(2 * CORR_SIZE);  // stm * CORR_SIZE + key

//{{{  pawnCorrIndex
//
// A hash of the two pawn bitboards mixed down to CORR_SIZE.
//

function pawnCorrIndex (pos) {

  scratch64[0] = pos.all[WPAWN];

  const lo1 = scratch32[0] | 0;
  const hi1 = scratch32[1] | 0;

  scratch64[0] = pos.all[BPAWN];

  const lo2 = scratch32[0] | 0;
  const hi2 = scratch32[1] | 0;

  let h = Math.imul(lo1 ^ 0x2545F491, 0x45D9F3B);

  h = Math.imul(h ^ hi1, 0x45D9F3B);
  h = Math.imul(h ^ lo2, 0x45D9F3B);
  h = Math.imul(h ^ hi2, 0x45D9F3B);
  h ^= h >>> 16;

  return Math.imul(pos.stm, CORR_SIZE) + (h & (CORR_SIZE - 1));

}

//}}}
//{{{  correctEval

function correctEval (pos, ev) {

  const corrected = ev + ((pawnCorr[pawnCorrIndex(pos)] / CORR_GRAIN) | 0);

  if (corrected <= -MATEISH)
    return -MATEISH + 1;

  if (corrected >= MATEISH)
    return MATEISH - 1;

  return corrected;

}

//}}}
//{{{  updateCorrhist

function updateCorrhist (pos, depth, diff) {

  const i = pawnCorrIndex(pos);
  const w = Math.min(depth + 1, CORR_WEIGHT_MAX);

  let v = ((Math.imul(pawnCorr[i], CORR_WEIGHT_SCALE - w) + Math.imul(Math.imul(diff, CORR_GRAIN), w)) / CORR_WEIGHT_SCALE) | 0;

  if (v < -CORR_LIMIT)
    v = -CORR_LIMIT;

  if (v > CORR_LIMIT)
    v = CORR_LIMIT;

  pawnCorr[i] = v;

}

//}}}

//}}}
//{{{  see
//
// Static exchange evaluation: does capturing on the move's to square win at
// least threshold, with every attacker and defender taking part in value order.
//

const SEE_VALUES = new Int32Array([100, 325, 325, 500, 1000, 0, 100, 325, 325, 500, 1000, 0, 0]);  // WPAWN..BKING, EMPTY

const rankMask = new BigUint64Array(64);  // the squares on the same rank, file, diagonal and anti diagonal as sq
const fileMask = new BigUint64Array(64);
const diagMask = new BigUint64Array(64);
const antiMask = new BigUint64Array(64);

const seeGain = new Int32Array(32);

let seePiece = 0;  // set by leastValuablePiece()

//{{{  initLineMasks

function initLineMasks () {

  for (let sq=0; sq < 64; sq++) {

    const r = sq >> 3;
    const f = sq & 7;

    let rm = 0n;
    let fm = 0n;
    let dm = 0n;
    let am = 0n;

    for (let k=0; k < 8; k++) {
      rm |= BIT[r * 8 + k];
      fm |= BIT[k * 8 + f];
    }

    for (let rr=r+1, ff=f+1; rr < 8  && ff < 8;  rr++, ff++) dm |= BIT[rr * 8 + ff];
    for (let rr=r-1, ff=f-1; rr >= 0 && ff >= 0; rr--, ff--) dm |= BIT[rr * 8 + ff];
    for (let rr=r+1, ff=f-1; rr < 8  && ff >= 0; rr++, ff--) am |= BIT[rr * 8 + ff];
    for (let rr=r-1, ff=f+1; rr >= 0 && ff < 8;  rr--, ff++) am |= BIT[rr * 8 + ff];

    rankMask[sq] = rm;
    fileMask[sq] = fm;
    diagMask[sq] = dm;
    antiMask[sq] = am;

  }

}

//}}}
//{{{  leastValuablePiece
//
// The lowest valued piece of colour bySide in attadef as a one bit bitboard, or 0.
// Its index is left in seePiece.
//

function leastValuablePiece (pos, attadef, bySide) {

  const all  = pos.all;
  const base = bySide * 6;

  scratch64[0] = attadef & all[COLOUR + bySide];
  if (!(scratch32[0] | scratch32[1]))
    return 0n;

  for (let i=base; i < base + 6; i++) {
    scratch64[0] = attadef & all[i];
    if (scratch32[0] | scratch32[1]) {
      seePiece = i;
      return BIT[lsb(scratch64[0])];
    }
  }

  return 0n;

}

//}}}
//{{{  attackers

function rookAttackersTo (pos, occ, to) {

  const all = pos.all;

  return BigInt.asUintN(64, rookAttacks(to, occ) & (all[WROOK] | all[BROOK] | all[WQUEEN] | all[BQUEEN]));

}

function bishopAttackersTo (pos, occ, to) {

  const all = pos.all;

  return BigInt.asUintN(64, bishopAttacks(to, occ) & (all[WBISHOP] | all[BBISHOP] | all[WQUEEN] | all[BQUEEN]));

}

function staticAttackersTo (pos, to) {

  const all = pos.all;

  return BigInt.asUintN(64, ((all[WKNIGHT] | all[BKNIGHT]) & knightAttacks[to])
                          | ((all[WKING]   | all[BKING])   & kingAttacks[to])
                          | (all[WPAWN] & pawnAttacks[(WHITE << 6) | to])
                          | (all[BPAWN] & pawnAttacks[(BLACK << 6) | to]));

}

//}}}
//{{{  seeGe

function seeGe (pos, move, threshold) {

  // ep and promotions are not filtered

  if (move & (MOVE_EPCAPTURE | MOVE_PROMOTE))
    return 1;

  const board  = pos.board;
  const stm    = pos.stm;
  const from   = (move & MOVE_FR_MASK) >> MOVE_FR_BITS;
  const to     = move & MOVE_TO_MASK;
  const target = board[to];

  let attacker = board[from];

  if (SEE_VALUES[target] - SEE_VALUES[attacker] >= threshold)
    return 1;

  let used    = BigInt.asUintN(64, 0n);
  let occ     = BigInt.asUintN(64, pos.all[OCCUPIED]);
  let fromSet = BigInt.asUintN(64, BIT[from]);

  const statAtk = BigInt.asUintN(64, staticAttackersTo(pos, to));

  let rookAtk = BigInt.asUintN(64, rookAttackersTo(pos, occ, to));
  let bishAtk = BigInt.asUintN(64, bishopAttackersTo(pos, occ, to));
  let attadef = BigInt.asUintN(64, statAtk | rookAtk | bishAtk);

  scratch64[0] = attadef & fromSet;
  if (!(scratch32[0] | scratch32[1]))
    return 0;

  const lines = BigInt.asUintN(64, rankMask[to] | fileMask[to]);
  const diags = BigInt.asUintN(64, diagMask[to] | antiMask[to]);
  const gain  = seeGain;

  let d = 0;

  gain[0] = SEE_VALUES[target] - threshold;

  while (1) {

    d++;
    gain[d] = SEE_VALUES[attacker] - gain[d-1];

    if (gain[d] < 0 && -gain[d-1] < 0)
      break;

    used    = BigInt.asUintN(64, used | fromSet);
    attadef = BigInt.asUintN(64, attadef ^ fromSet);
    occ     = BigInt.asUintN(64, occ ^ fromSet);

    scratch64[0] = fromSet & lines;
    if (scratch32[0] | scratch32[1])
      rookAtk = BigInt.asUintN(64, rookAttackersTo(pos, occ, to));

    scratch64[0] = fromSet & diags;
    if (scratch32[0] | scratch32[1])
      bishAtk = BigInt.asUintN(64, bishopAttackersTo(pos, occ, to));

    attadef  = BigInt.asUintN(64, (statAtk | rookAtk | bishAtk) & (used ^ FULL));
    fromSet  = BigInt.asUintN(64, leastValuablePiece(pos, attadef, stm ^ (d & 1)));
    attacker = seePiece;

    scratch64[0] = fromSet;
    if (!(scratch32[0] | scratch32[1]))
      break;

  }

  d--;

  while (d > 0) {
    gain[d-1] = -Math.max(-gain[d-1], gain[d]);
    d--;
  }

  return (gain[0] >= 0) | 0;

}

//}}}

//}}}
//{{{  stats
//
// Time control and search statistics.
//

let statsStartTime  = 0;
let statsFinishTime = 0;  // 0 for none
let statsMaxDepth   = 0;
let statsMaxNodes   = 0;  // stop between iterations once reached
let statsHardNodes  = 0;  // stop mid search once reached
let statsTimeOut    = 0;  // also set by pollQueue() on stop
let statsNodes      = 0;  // @i64
let statsBestMove   = 0;
let statsBestScore  = 0;
let statsSelDepth   = 0;

//{{{  initTC

function initTC (wtime, winc, btime, binc, maxNodes, moveTime, maxDepth, movesToGo) {

  if (wtime < 0)     wtime = 0;
  if (winc < 0)      winc = 0;
  if (btime < 0)     btime = 0;
  if (binc < 0)      binc = 0;
  if (maxNodes < 0)  maxNodes = 0;
  if (moveTime < 0)  moveTime = 0;
  if (movesToGo < 0) movesToGo = 0;
  if (maxDepth < 0)  maxDepth = 0;

  const stm = nodes[0].pos.stm;

  if (!maxNodes && !maxDepth && !wtime && !winc && !btime && !binc && !moveTime)
    moveTime = 100;

  if (!movesToGo)
    movesToGo = 20;

  if (movesToGo < 2)  // stops losses on time
    movesToGo = 2;

  if (!maxDepth || maxDepth >= MAX_PLY)
    maxDepth = MAX_PLY - 1;

  if (!moveTime && stm == WHITE && (wtime || winc)) {
    moveTime = ((wtime / movesToGo) | 0) + ((winc / 2) | 0);
    if (!moveTime)
      moveTime = 1;
  }
  else if (!moveTime && stm == BLACK && (btime || binc)) {
    moveTime = ((btime / movesToGo) | 0) + ((binc / 2) | 0);
    if (!moveTime)
      moveTime = 1;
  }

  statsStartTime  = now();
  statsFinishTime = moveTime ? statsStartTime + moveTime : 0;
  statsMaxNodes   = maxNodes;
  statsHardNodes  = maxNodes ? maxNodes * 100 : 0;
  statsMaxDepth   = maxDepth;
  statsTimeOut    = 0;
  statsNodes      = 0;
  statsBestMove   = 0;
  statsBestScore  = 0;
  statsSelDepth   = 0;

}

//}}}
//{{{  checkTime
//
// Called every 1024 nodes.
//

function checkTime () {

  if (statsTimeOut)
    return;

  if (statsFinishTime && now() >= statsFinishTime) {
    statsTimeOut = 1;
    return;
  }

  if (statsHardNodes && statsNodes >= statsHardNodes) {
    statsTimeOut = 1;
    return;
  }

}

//}}}
//{{{  checkNodes
//
// Called between iterations.
//

function checkNodes () {

  if (statsMaxNodes && statsNodes >= statsMaxNodes)
    statsTimeOut = 1;

}

//}}}

//}}}
//{{{  pv

//{{{  collectPV
//
// node.pv is the child's pv with move appended, so it reads backwards.
//

function collectPV (node, move) {

  const child = nodes[node.ply + 1];
  const pv    = node.pv;
  const cpv   = child.pv;
  const n     = child.pvLen;

  for (let i=0; i < n; i++)
    pv[i] = cpv[i];

  pv[n] = move;

  node.pvLen = n + 1;

}

//}}}
//{{{  report

let reportedMove = 0;  // the first move of the last pv sent

function report (depth) {

  const root  = nodes[0];
  const score = statsBestScore;

  reportedMove = root.pvLen > 0 ? root.pv[root.pvLen-1] : 0;

  let pvStr = 'pv';

  for (let i=root.pvLen-1; i >= 0; i--)
    pvStr += ' ' + formatMove(root.pv[i]);

  let scoreStr = '';

  if (Math.abs(score) > MATEISH) {
    let mateScore = ((MATE - Math.abs(score) + 1) / 2) | 0;
    if (score < 0)
      mateScore = -mateScore;
    scoreStr = 'score mate ' + mateScore;
  }
  else {
    scoreStr = 'score cp ' + score;
  }

  const tim = Math.max(1, now() - statsStartTime);
  const nps = (statsNodes * 1000) / tim | 0;

  uciSend('info depth', depth, 'seldepth', statsSelDepth, scoreStr, 'nodes', statsNodes, 'time', tim, 'nps', nps, 'hashfull', (1000 * ttHashUsed / ttSize) | 0, pvStr);

}

//}}}

//}}}
//{{{  go
//
// Iterative deepening with an aspiration window from depth 4. When canYield is
// set (commands from stdin/onmessage) go() yields to the host between searches
// so stop/isready/quit can be picked up from the command queue. When not set
// (bench etc.) there are no awaits so go() runs synchronously.
//

async function go (canYield) {

  let alpha = 0;
  let beta  = 0;
  let delta = 0;
  let score = 0;
  let depth = 0;

  hhSetRoot();
  clearNodes();

  reportedMove = 0;

  for (depth=1; depth <= statsMaxDepth; depth++) {

    alpha = -INF;
    beta  = INF;
    delta = 10;

    if (depth >= 4) {
      alpha = score - delta;
      beta  = score + delta;
    }

    while (1) {

      score = search(0, depth, alpha, beta);

      if (statsTimeOut)
        break;

      if (score <= alpha)
        alpha = score - delta;

      else if (score >= beta)
        beta = score + delta;

      else
        break;

      delta += delta;

      if (canYield && await checkStop())
        break;

    }

    if (statsTimeOut)
      break;

    report(depth);

    checkNodes();

    if (statsTimeOut)
      break;

    if (canYield && await checkStop())
      break;

  }

  // a move that became best in an iteration that then ran out of time has not
  // been reported yet; report it so the last pv starts with the bestmove

  if (statsBestMove && statsBestMove != reportedMove)
    report(Math.min(depth, statsMaxDepth));

  if (statsBestMove)
    uciSend('bestmove', formatMove(statsBestMove));
  else
    uciSend('bestmove 0000');

}

//}}}
//{{{  search

function search (ply, depth, alpha, beta) {

  const node = nodes[ply];
  const pos  = node.pos;

  node.pvLen = 0;

  if (ply >= MAX_PLY - 1)
    return evaluate(node);

  if (ply > statsSelDepth)
    statsSelDepth = ply;

  // store the hash for repetition detection (ply 0 is already there from position())

  if (ply > 0) {
    hhStore(ply, pos);
    if (isDraw(ply, pos) || isMatDraw(pos))
      return 0;
  }

  const stm       = pos.stm;
  const opp       = stm ^ 1;
  const kingIndex = KING + stm * 6;
  const inCheck   = isAttacked(pos, lsb(pos.all[kingIndex]), opp);
  const isRoot    = (ply == 0) | 0;
  const isPV      = (isRoot || beta - alpha != 1) | 0;
  const excluded  = node.excludedMove;

  node.dextensions = isRoot ? 0 : nodes[ply-1].dextensions;

  if (depth <= 0 && !inCheck)
    return qsearch(ply, alpha, beta);

  if (depth < 0)
    depth = 0;

  statsNodes++;

  if ((statsNodes & 1023) == 0) {
    checkTime();
    if (statsTimeOut)
      return 0;
  }

  //{{{  mate distance pruning

  if (alpha < -MATE + ply)
    alpha = -MATE + ply;

  if (beta > MATE - ply - 1)
    beta = MATE - ply - 1;

  if (alpha >= beta)
    return alpha;

  //}}}
  //{{{  tt

  const ttHit = ttProbe(pos);

  if (!isPV && !excluded && ttHit && ttDepth >= depth) {
    const score = getAdjustedScore(ply, ttScore);
    if (ttFlags == TT_EXACT || (ttFlags == TT_BETA && score >= beta) || (ttFlags == TT_ALPHA && score <= alpha))
      return score;
  }

  // keep the tt fields before the null move search overwrites them

  const ttMove0  = ttMove;
  const ttDepth0 = ttDepth;
  const ttFlags0 = ttFlags;
  const ttScore0 = ttHit ? getAdjustedScore(ply, ttScore) : 0;

  //}}}
  //{{{  iir

  if (!inCheck && !excluded && depth >= 4 && (!ttMove0 || (ttHit && ttDepth0 + 4 < depth)))
    depth--;

  //}}}

  const ev = correctEval(pos, evaluate(node));

  node.ev = ev;

  const improving = (!inCheck && (ply < 2 || ev > nodes[ply-2].ev)) | 0;

  //{{{  beta pruning

  if (!isPV && !excluded && !inCheck && depth <= 8 && ev >= beta + Math.imul(98, depth - improving))
    return ev;

  //}}}

  const nextNode = nodes[ply + 1];
  const nextPos  = nextNode.pos;

  //{{{  null move pruning

  if (!isPV && !excluded && !inCheck && depth > 2 && ev > beta && !isPawnEndgame(pos)) {

    posCopy(pos, nextPos);
    makeNull(nextNode);

    const score = -search(ply+1, depth - 4, -beta, -beta+1);

    if (score >= beta)
      return score > MATEISH ? beta : score;

    if (statsTimeOut)
      return 0;

  }

  //}}}

  let move      = 0;
  let bestMove  = 0;
  let score     = 0;
  let bestScore = -INF;
  let played    = 0;

  const origAlpha = alpha;

  initNextSearchMove(node, inCheck, ttMove0);

  while ((move = getNextSearchMove(node)) != 0) {

    if (move == excluded)
      continue;

    const isQuiet = ((move & MOVE_NOISY) == 0) | 0;

    //{{{  prune

    // lmp

    if (isQuiet && !isPV && !inCheck && alpha > -MATEISH && depth <= 2 && played > Math.imul(6, depth))
      continue;

    // futility

    if (isQuiet && !isPV && !inCheck && alpha > -MATEISH && depth <= 4 && played && (ev + Math.imul(depth, 129)) < alpha)
      continue;

    // see

    if (!isQuiet && !isPV && !inCheck && alpha > -MATEISH && depth <= 2 && played && !seeGe(pos, move, 0))
      continue;

    //}}}
    //{{{  singular extensions

    let extension = 0;

    if (!isRoot && !excluded && depth >= 8 && move == ttMove0 && ttDepth0 + 4 >= depth && ttFlags0 != TT_ALPHA && ttScore0 > -MATEISH && ttScore0 < MATEISH) {

      const sBeta  = ttScore0 - Math.imul(4, depth);
      const sDepth = (depth - 1) >> 1;

      node.excludedMove = ttMove0;
      const sScore = search(ply, sDepth, sBeta - 1, sBeta);
      node.excludedMove = 0;
      node.stage  = 1;        // the tt move has been returned; noisy moves next
      node.ttMove = ttMove0;  // defensive

      if (statsTimeOut)
        return 0;

      if (sScore < sBeta) {       // singular
        extension = 1;
        if (!isPV && sScore < sBeta - 16 && node.dextensions <= 6)
          extension = 2;          // double extend
      }
      else if (sBeta >= beta)     // multicut
        return sBeta;
      else if (ttScore0 >= beta)  // negative extension
        extension = -1;

    }

    //}}}

    const from       = (move & MOVE_FR_MASK) >> MOVE_FR_BITS;
    const to         = move & MOVE_TO_MASK;
    const movedPiece = pos.board[from];
    const hist       = isQuiet ? pieceToHistory[(movedPiece << 6) | to] : 0;

    posCopy(pos, nextPos);
    makeMove(nextNode, move);

    if (isAttacked(nextPos, lsb(nextPos.all[kingIndex]), opp))
      continue;

    nextNode.contBase = Math.imul((movedPiece << 6) | to, 12 * 64);

    node.played[played++] = move;

    const newDepth = depth - 1 + extension;

    if (extension == 2)
      node.dextensions++;

    //{{{  search the move

    if (isPV) {

      if (played == 1) {
        score = -search(ply+1, newDepth, -beta, -alpha);
      }

      else {

        let d = newDepth;

        if (depth >= 3 && played >= 3 && isQuiet && !inCheck) {
          d -= LMR[(depth << 8) | played];
          d += (hist > 0) | 0;
          if (d < 1)
            d = 1;
        }

        score = -search(ply+1, d, -alpha-1, -alpha);

        if (!statsTimeOut && score > alpha)
          score = -search(ply+1, newDepth, -beta, -alpha);

      }

    }

    else {

      let d = newDepth;

      if (depth >= 3 && played >= 2 && isQuiet && !inCheck) {
        d -= LMR[(depth << 8) | played] + 1;
        d += (hist > 0) | 0;
        if (d < 1)
          d = 1;
      }

      score = -search(ply+1, d, -beta, -alpha);

      if (!statsTimeOut && score > alpha && d < newDepth)
        score = -search(ply+1, newDepth, -beta, -alpha);

    }

    //}}}

    if (extension == 2)
      node.dextensions--;  // restore for siblings

    if (statsTimeOut)
      return 0;

    if (score > bestScore) {

      bestScore = score;
      bestMove  = move;

      if (score > alpha) {

        alpha = score;

        if (isRoot) {
          statsBestMove  = bestMove;
          statsBestScore = bestScore;
        }

        if (isPV)
          collectPV(node, bestMove);

        if (score >= beta) {
          //{{{  beta cutoff

          const bonus = Math.min(Math.imul(18, Math.imul(depth, depth)), 2020);

          // capture history

          for (let i=0; i < played; i++) {
            const pm = node.played[i];
            if (pm & MOVE_CAPTURE)
              updateCaptureHistory(pos, pm, pm == bestMove ? bonus : -bonus);
          }

          if (!(bestMove & MOVE_NOISY)) {
            node.killer = bestMove;
            updatePieceToHistory(pos, bestMove, bonus);
            updateContHistory(node, pos, bestMove, bonus);
            for (let i=0; i < played-1; i++) {
              const pm = node.played[i];
              if (!(pm & MOVE_NOISY)) {
                updatePieceToHistory(pos, pm, -bonus);
                updateContHistory(node, pos, pm, -bonus);
              }
            }
          }

          if (!excluded && !inCheck && bestScore < MATEISH && bestScore > ev && !(bestMove & MOVE_NOISY))
            updateCorrhist(pos, depth, bestScore - ev);

          if (!excluded)
            ttPut(pos, TT_BETA, depth, putAdjustedScore(ply, bestScore), bestMove);

          return score;

          //}}}
        }

      }

    }

  }

  if (played == 0)
    return inCheck ? -MATE + ply : 0;

  if (!excluded && !inCheck && bestScore > -MATEISH && bestScore < MATEISH && !(bestMove & MOVE_NOISY) && !(alpha == origAlpha && bestScore >= ev))
    updateCorrhist(pos, depth, bestScore - ev);

  if (!excluded)
    ttPut(pos, (alpha > origAlpha) ? TT_EXACT : TT_ALPHA, depth, putAdjustedScore(ply, bestScore), bestMove);

  return bestScore;

}

//}}}
//{{{  qsearch

function qsearch (ply, alpha, beta) {

  const node = nodes[ply];
  const pos  = node.pos;

  node.pvLen = 0;

  if (ply >= MAX_PLY - 1)
    return evaluate(node);

  if (ply > statsSelDepth)
    statsSelDepth = ply;

  const stm       = pos.stm;
  const opp       = stm ^ 1;
  const kingIndex = KING + stm * 6;

  const standPat = correctEval(pos, evaluate(node));

  if (standPat >= beta)
    return standPat;

  if (standPat > alpha)
    alpha = standPat;

  statsNodes++;

  if ((statsNodes & 1023) == 0) {
    checkTime();
    if (statsTimeOut)
      return 0;
  }

  //{{{  tt

  const ttHit = ttProbe(pos);

  if (ttHit) {
    const score = getAdjustedScore(ply, ttScore);
    if (ttFlags == TT_EXACT || (ttFlags == TT_BETA && score >= beta) || (ttFlags == TT_ALPHA && score <= alpha))
      return score;
  }

  const ttMove0 = (ttHit && (ttMove & MOVE_CAPTURE)) ? ttMove : 0;

  //}}}

  const nextNode = nodes[ply + 1];
  const nextPos  = nextNode.pos;

  let move      = 0;
  let bestMove  = 0;
  let score     = 0;
  let bestScore = standPat;

  const origAlpha = alpha;

  initNextQSearchMove(node, 0, ttMove0);

  while ((move = getNextQSearchMove(node)) != 0) {

    posCopy(pos, nextPos);
    makeMove(nextNode, move);

    if (isAttacked(nextPos, lsb(nextPos.all[kingIndex]), opp))
      continue;

    score = -qsearch(ply+1, -beta, -alpha);

    if (statsTimeOut)
      return 0;

    if (score > bestScore) {
      bestScore = score;
      bestMove  = move;
      if (score > alpha) {
        alpha = score;
        if (score >= beta) {
          ttPut(pos, TT_BETA, 0, putAdjustedScore(ply, bestScore), bestMove);
          return score;
        }
      }
    }

  }

  ttPut(pos, (alpha > origAlpha) ? TT_EXACT : TT_ALPHA, 0, putAdjustedScore(ply, bestScore), bestMove);

  return bestScore;

}

//}}}

//{{{  initSearch

function initSearch () {

  // lmr: 0.73 + ln(depth) * ln(played) / 2.36, via log2 for the transpiler

  for (let d=1; d < MAX_PLY + 4; d++) {
    for (let m=1; m < MAX_MOVES; m++) {
      LMR[(d << 8) | m] = (0.73 + Math.log2(d) * Math.log2(m < 64 ? m : 63) * 0.4804530139182014 / 2.36) | 0;
    }
  }

  initLineMasks();

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

let silentMode = 0;  // bench and eval tests

//{{{  bench fens
//
// From https://github.com/AndyGrant/Ethereal
//

const BENCHFENS = [

"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkQ - 0 1",
"r3k2r/2pb1ppp/2pp1q2/p7/1nP1B3/1P2P3/P2N1PPP/R2QK2R w KQkq a6 0 14",
"4rrk1/2p1b1p1/p1p3q1/4p3/2P2n1p/1P1NR2P/PB3PP1/3R1QK1 b - - 2 24",
"r3qbrk/6p1/2b2pPp/p3pP1Q/PpPpP2P/3P1B2/2PB3K/R5R1 w - - 16 42",
"6k1/1R3p2/6p1/2Bp3p/3P2q1/P7/1P2rQ1K/5R2 b - - 4 44",
"8/8/1p2k1p1/3p3p/1p1P1P1P/1P2PK2/8/8 w - - 3 54",
"7r/2p3k1/1p1p1qp1/1P1Bp3/p1P2r1P/P7/4R3/Q4RK1 w - - 0 36",
"r1bq1rk1/pp2b1pp/n1pp1n2/3P1p2/2P1p3/2N1P2N/PP2BPPP/R1BQ1RK1 b - - 2 10",
"3r3k/2r4p/1p1b3q/p4P2/P2Pp3/1B2P3/3BQ1RP/6K1 w - - 3 87",
"2r4r/1p4k1/1Pnp4/3Qb1pq/8/4BpPp/5P2/2RR1BK1 w - - 0 42",
"4q1bk/6b1/7p/p1p4p/PNPpP2P/KN4P1/3Q4/4R3 b - - 0 37",
"2q3r1/1r2pk2/pp3pp1/2pP3p/P1Pb1BbP/1P4Q1/R3NPP1/4R1K1 w - - 2 34",
"1r2r2k/1b4q1/pp5p/2pPp1p1/P3Pn2/1P1B1Q1P/2R3P1/4BR1K b - - 1 37",
"r3kbbr/pp1n1p1P/3ppnp1/q5N1/1P1pP3/P1N1B3/2P1QP2/R3KB1R b KQkq b3 0 17",
"8/6pk/2b1Rp2/3r4/1R1B2PP/P5K1/8/2r5 b - - 16 42",
"1r4k1/4ppb1/2n1b1qp/pB4p1/1n1BP1P1/7P/2PNQPK1/3RN3 w - - 8 29",
"8/p2B4/PkP5/4p1pK/4Pb1p/5P2/8/8 w - - 29 68",
"3r4/ppq1ppkp/4bnp1/2pN4/2P1P3/1P4P1/PQ3PBP/R4K2 b - - 2 20",
"5rr1/4n2k/4q2P/P1P2n2/3B1p2/4pP2/2N1P3/1RR1K2Q w - - 1 49",
"1r5k/2pq2p1/3p3p/p1pP4/4QP2/PP1R3P/6PK/8 w - - 1 51",
"q5k1/5ppp/1r3bn1/1B6/P1N2P2/BQ2P1P1/5K1P/8 b - - 2 34",
"r1b2k1r/5n2/p4q2/1ppn1Pp1/3pp1p1/NP2P3/P1PPBK2/1RQN2R1 w - - 0 22",
"r1bqk2r/pppp1ppp/5n2/4b3/4P3/P1N5/1PP2PPP/R1BQKB1R w KQkq - 0 5",
"r1bqr1k1/pp1p1ppp/2p5/8/3N1Q2/P2BB3/1PP2PPP/R3K2n b Q - 1 12",
"r1bq2k1/p4r1p/1pp2pp1/3p4/1P1B3Q/P2B1N2/2P3PP/4R1K1 b - - 2 19",
"r4qk1/6r1/1p4p1/2ppBbN1/1p5Q/P7/2P3PP/5RK1 w - - 2 25",
"r7/6k1/1p6/2pp1p2/7Q/8/p1P2K1P/8 w - - 0 32",
"r3k2r/ppp1pp1p/2nqb1pn/3p4/4P3/2PP4/PP1NBPPP/R2QK1NR w KQkq - 1 5",
"3r1rk1/1pp1pn1p/p1n1q1p1/3p4/Q3P3/2P5/PP1NBPPP/4RRK1 w - - 0 12",
"5rk1/1pp1pn1p/p3Brp1/8/1n6/5N2/PP3PPP/2R2RK1 w - - 2 20",
"8/1p2pk1p/p1p1r1p1/3n4/8/5R2/PP3PPP/4R1K1 b - - 3 27",
"8/4pk2/1p1r2p1/p1p4p/Pn5P/3R4/1P3PP1/4RK2 w - - 1 33",
"8/5k2/1pnrp1p1/p1p4p/P6P/4R1PK/1P3P2/4R3 b - - 1 38",
"8/8/1p1kp1p1/p1pr1n1p/P6P/1R4P1/1P3PK1/1R6 b - - 15 45",
"8/8/1p1k2p1/p1prp2p/P2n3P/6P1/1P1R1PK1/4R3 b - - 5 49",
"8/8/1p4p1/p1p2k1p/P2npP1P/4K1P1/1P6/3R4 w - - 6 54",
"8/8/1p4p1/p1p2k1p/P2n1P1P/4K1P1/1P6/6R1 b - - 6 59",
"8/5k2/1p4p1/p1pK3p/P2n1P1P/6P1/1P6/4R3 b - - 14 63",
"8/1R6/1p1K1kp1/p6p/P1p2P1P/6P1/1Pn5/8 w - - 0 67",
"1rb1rn1k/p3q1bp/2p3p1/2p1p3/2P1P2N/PP1RQNP1/1B3P2/4R1K1 b - - 4 23",
"4rrk1/pp1n1pp1/q5p1/P1pP4/2n3P1/7P/1P3PB1/R1BQ1RK1 w - - 3 22",
"r2qr1k1/pb1nbppp/1pn1p3/2ppP3/3P4/2PB1NN1/PP3PPP/R1BQR1K1 w - - 4 12",
"2r2k2/8/4P1R1/1p6/8/P4K1N/7b/2B5 b - - 0 55",
"6k1/5pp1/8/2bKP2P/2P5/p4PNb/B7/8 b - - 1 44",
"2rqr1k1/1p3p1p/p2p2p1/P1nPb3/2B1P3/5P2/1PQ2NPP/R1R4K w - - 3 25",
"r1b2rk1/p1q1ppbp/6p1/2Q5/8/4BP2/PPP3PP/2KR1B1R b - - 2 14",
"6r1/5k2/p1b1r2p/1pB1p1p1/1Pp3PP/2P1R1K1/2P2P2/3R4 w - - 1 36",
"rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2",
"2rr2k1/1p4bp/p1q1p1p1/4Pp1n/2PB4/1PN3P1/P3Q2P/2RR2K1 w - f6 0 20",
"3br1k1/p1pn3p/1p3n2/5pNq/2P1p3/1PN3PP/P2Q1PB1/4R1K1 w - - 0 23",
"2r2b2/5p2/5k2/p1r1pP2/P2pB3/1P3P2/K1P3R1/7R w - - 23 93"
];

//}}}
//{{{  uciSend

function uciSend () {

  if (silentMode)
    return;

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
//{{{  uciHas

function uciHas (tokens, key) {  // @types tokens:strarr key:str

  for (let i=0; i < tokens.length; i++)
    if (tokens[i] == key)
      return 1;

  return 0;

}

//}}}
//{{{  flipFen
//
// The position with the colours swapped and the board mirrored. Slow. Only
// use for tests.
//

function flipFen (fen) {  // @types fen:str

  const parts = fen.split(' ');

  // board: reverse the rows and swap case

  const rows = parts[0].split('/');

  let board = '';

  for (let i=rows.length-1; i >= 0; i--) {

    const row = rows[i];

    for (let j=0; j < row.length; j++) {
      const c = row.charCodeAt(j);
      if (c >= 65 && c <= 90)
        board += String.fromCharCode(c + 32);
      else if (c >= 97 && c <= 122)
        board += String.fromCharCode(c - 32);
      else
        board += row.charAt(j);
    }

    if (i > 0)
      board += '/';
  }

  // colour

  const colour = parts[1] == 'w' ? 'b' : 'w';

  // castling

  let castling = '';

  for (let i=0; i < parts[2].length; i++) {
    const ch = parts[2].charAt(i);
    if (ch == 'K')
      castling += 'k';
    else if (ch == 'Q')
      castling += 'q';
    else if (ch == 'k')
      castling += 'K';
    else if (ch == 'q')
      castling += 'Q';
    else
      castling += ch;
  }

  // ep

  let ep = '-';

  if (parts[3] != '-')
    ep = parts[3].charAt(0) + (9 - parseInt(parts[3].charAt(1)));

  return board + ' ' + colour + ' ' + castling + ' ' + ep + ' ' + parts[4] + ' ' + parts[5];

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
        uciSend('option name Hash type spin default', ttDefault, 'min 1 max 1024');
        uciSend('uciok');

        break;

      }
      //}}}
      //{{{  ucinewgame

      case 'ucinewgame':
      case 'u': {

        newGame();

        break;

      }

      //}}}
      //{{{  setoption

      case 'setoption':
      case 'o': {

        const opt = uciGetStr(tokens, 'name', '').toLowerCase();

        if (opt == 'hash')
          ttResize(uciGetInt(tokens, 'value', ttDefault));

        break;

      }

      //}}}
      //{{{  go

      case 'go':
      case 'g': {

        if (ttSize == 1)
          newGame();

        const depth     = Math.max(uciGetInt(tokens, 'depth', 0), uciGetInt(tokens, 'd', 0));
        const moveTime  = uciGetInt(tokens, 'movetime', 0);
        const maxNodes  = uciGetInt(tokens, 'nodes', 0);
        const wTime     = uciGetInt(tokens, 'wtime', 0);
        const bTime     = uciGetInt(tokens, 'btime', 0);
        const wInc      = uciGetInt(tokens, 'winc', 0);
        const bInc      = uciGetInt(tokens, 'binc', 0);
        const movesToGo = uciGetInt(tokens, 'movestogo', 0);
        const infinite  = uciHas(tokens, 'infinite');

        initTC(wTime, wInc, bTime, bInc, maxNodes, moveTime, infinite ? MAX_PLY - 1 : depth, movesToGo);

        if (canYield)
          return go(1);

        go(0);

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
        let hmc    = '0';

        uciGetArr(tokens, 'fen', 'moves');

        let lo = uciArrLo;
        let hi = uciArrHi;

        if (lo > 0) {
          if (lo <= hi) board  = tokens[lo]; lo++;
          if (lo <= hi) stm    = tokens[lo]; lo++;
          if (lo <= hi) rights = tokens[lo]; lo++;
          if (lo <= hi) ep     = tokens[lo]; lo++;
          if (lo <= hi) hmc    = tokens[lo]; lo++;
        }

        const moves = [];

        uciGetArr(tokens, 'moves', 'fen');

        if (uciArrLo > 0) {
          for (let i=uciArrLo; i <= uciArrHi; i++)
            moves.push(tokens[i]);
        }

        position(nodes[0], board, stm, rights, ep, parseInt(hmc), moves);

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
      //{{{  bench
      //
      // bench [depth n] [warm n]. qb is bench warm 0, the quick bench oracle.
      //

      case 'bench':
      case 'h': {

        silentMode = 1;

        const depth = uciGetInt(tokens, 'depth', BENCH_DEPTH);
        const warm  = uciGetInt(tokens, 'warm', 1);

        for (let w=0; w < warm; w++) {
          for (let i=0; i < BENCHFENS.length; i++) {
            newGame();
            uciExec('position fen ' + BENCHFENS[i]);
            uciExec('go depth ' + depth);
          }
        }

        let nodes = 0;  // @i64
        let start = now();

        for (let i=0; i < BENCHFENS.length; i++) {

          if (nodeHost)
            process.stdout.write(i.toString() + '\r');

          newGame();
          uciExec('position fen ' + BENCHFENS[i]);
          uciExec('go depth ' + depth);

          nodes += statsNodes;

        }

        silentMode = 0;

        const elapsed = Math.max(1, now() - start);
        const nps     = nodes / elapsed * 1000 | 0;

        uciSend('warm', warm, 'depth', depth, 'nodes', nodes, 'time', elapsed, 'nps', nps);

        break;

      }

      case 'qb': {

        uciExec('bench warm 0');

        break;

      }

      //}}}
      //{{{  eval

      case 'eval':
      case 'e': {

        uciSend(evaluate(nodes[0]));

        break;

      }

      //}}}
      //{{{  et
      //
      // Eval tests: the static eval of each bench fen and its mirror.
      //

      case 'et': {

        for (let i=0; i < BENCHFENS.length; i++) {

          const fen        = BENCHFENS[i];
          const flippedFen = flipFen(fen);

          uciSend();

          uciExec('position fen ' + fen);
          uciSend(fen, 'fen');
          uciExec('e');

          uciExec('position fen ' + flippedFen);
          uciSend(flippedFen, 'flipped fen');
          uciExec('e');

        }

        break;

      }

      //}}}
      //{{{  net

      case 'net':
      case 'n': {

        if (getWeights() === '')
          uciSend('weights file', NET_WEIGHTS_FILE);

        uciSend('i_size, h1_size', NET_I_SIZE, NET_H1_SIZE);
        uciSend('qa, qb', NET_QA, NET_QB);
        uciSend('scale', NET_SCALE);

        uciExec('position startpos');
        uciExec('e');

        break;

      }

      //}}}
      //{{{  id
      //
      // Ignored. Labels searches in scripts.
      //

      case 'id': {

        break;

      }

      //}}}
      //{{{  datagen

      case 'datagen': {

        datagen(tokens);

        break;

      }

      //}}}

      default: {
        uciSend('unknown command', cmd);
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
// While a search is in progress go() yields between searches and pollQueue
// handles stop, isready and quit; everything else waits until the search
// finishes.
//

const cmdQueue = [];

let cmdBusy     = 0;
let stdinEnded  = 0;
let cmdLineMode = 0;  // the commands came from the command line, see the init fold

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

    if (cmd == 'quit' || cmd == 'q') {
      // stop the search; the quit itself runs from the queue after bestmove has
      // been sent. from the command line the search completes first
      if (!cmdLineMode)
        statsTimeOut = 1;
      return;
    }

    if (cmd == 'isready')
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
//{{{  datagen
//
// datagen [games n] [nodes n] [randply n] [dir d] [book file]
//
// Self play at a fixed node count from random book positions, writing
// "fen | white score | result" lines in bullet text format. See bin/datagen.sh.
// The file access is in the host functions fold (node) and runtime_uci.c (C).
//

const DG_RESIGN_SCORE = 600;  // cp, white relative
const DG_RESIGN_PLIES = 5;    // consecutive plies at or beyond DG_RESIGN_SCORE
const DG_DRAW_SCORE   = 5;    // cp, white relative
const DG_DRAW_PLIES   = 8;    // consecutive plies within DG_DRAW_SCORE
const DG_DRAW_MINPLY  = 80;   // no draw adjudication before this ply
const DG_MAX_PLIES    = 500;  // then adjudicate as a draw
const DG_FLUSH_GAMES  = 10;   // write to disk every n games
const DG_REPORT_GAMES = 100;  // log progress every n games

let dgGameFens = 0;  // fens written by the last dgPlayGame()

//{{{  host functions (node)
//
// dgOpenBook(name)   open an EPD book, 1 if ok, 0 if none or it cannot be opened
// dgBookLine()       a random complete line from the book, '' if there is no book
// dgOpenOut(dir,tag) create dir and a new uniquely named file in it; its name, '' on failure
// dgWrite(s)         append s to the file (buffered)
// dgFlush()          write buffered output to disk
// dgClose()          flush and close the file and the book
//
// dgBookLine seeks to a random offset and takes the first complete line after
// it, so big books are never read into memory.
//

let dgBookFd   = -1;
let dgBookSize = 0;
let dgOutName  = '';
let dgOutBuf   = '';

function dgOpenBook (name) {

  if (name === '' || !nodeHost)
    return 0;

  dgBookFd   = fs.openSync(name, 'r');
  dgBookSize = fs.fstatSync(dgBookFd).size;

  return 1;

}

function dgBookLine () {

  if (dgBookFd < 0)
    return '';

  const buf = Buffer.alloc(4096);
  const off = Math.floor(Math.random() * Math.max(1, dgBookSize - buf.length));
  const n   = fs.readSync(dgBookFd, buf, 0, buf.length, off);

  const lines = buf.toString('utf8', 0, n).split('\n');

  // the first line is partial unless we started at 0 and the last is probably partial

  for (let i = (off === 0 ? 0 : 1); i < lines.length - 1; i++) {
    if (lines[i].trim() !== '')
      return lines[i];
  }

  return '';

}

function dgOpenOut (dir, tag) {

  if (!nodeHost)
    return '';

  fs.mkdirSync(dir, {recursive: true});

  dgOutName = dir + '/dg_' + tag + '_' + process.pid + '_' + Math.trunc(Math.random() * 1000000000) + '.txt';
  dgOutBuf  = '';

  fs.writeFileSync(dgOutName, '');

  return dgOutName;

}

function dgWrite (s) {

  dgOutBuf += s;

}

function dgFlush () {

  if (dgOutBuf.length) {
    fs.appendFileSync(dgOutName, dgOutBuf);
    dgOutBuf = '';
  }

}

function dgClose () {

  dgFlush();

  if (dgBookFd >= 0)
    fs.closeSync(dgBookFd);

  dgBookFd = -1;

}

//}}}
//{{{  dgLog
//
// Progress goes to stdout even though the searches run in silent mode.
//

function dgLog (s) {

  const sm = silentMode;

  silentMode = 0;
  uciSend(s);
  silentMode = sm;

}

//}}}
//{{{  dgIsDraw
//
// Is the root position a draw by repetition, the 50 move rule or material.
//

function dgIsDraw () {

  const pos = nodes[0].pos;

  hhSetRoot();

  return (isDraw(0, pos) || isMatDraw(pos)) | 0;

}

//}}}
//{{{  dgRandomMove
//
// A random legal move string for the side to move, or '' if there are none.
//

function dgRandomMove () {

  const node     = nodes[0];
  const nextNode = nodes[1];
  const pos      = node.pos;
  const stm      = pos.stm;
  const legal    = nextNode.moves;  // scratch

  let numLegal = 0;

  genMoves(node);

  for (let i=0; i < node.numMoves; i++) {
    posCopy(pos, nextNode.pos);
    makeMove(nextNode, node.moves[i]);
    if (!isAttacked(nextNode.pos, lsb(nextNode.pos.all[KING + stm * 6]), stm ^ 1))
      legal[numLegal++] = node.moves[i];
  }

  if (numLegal == 0)
    return '';

  return formatMove(legal[(Math.random() * numLegal) | 0]);

}

//}}}
//{{{  dgPlayGame
//
// Play one game from a random book position (or the start position without a
// book) with randPly or randPly+1 random plies. Writes the quiet positions and
// returns the result as '1.0', '0.5' or '0.0', or '' if the game was abandoned
// because it ended during the random move phase.
//

function dgPlayGame (maxNodes, randPly) {

  const book  = dgBookLine().replace(/\s+/g, ' ').trim().split(' ');
  const moves = [];
  const lines = [];

  let bd     = START_BOARD;
  let stm    = 'w';
  let rights = 'KQkq';
  let ep     = '-';
  let result = '';

  dgGameFens = 0;

  if (book.length >= 4) {
    bd     = book[0];
    stm    = book[1];
    rights = book[2];
    ep     = book[3];
  }

  newGame();
  position(nodes[0], bd, stm, rights, ep, 0, moves);

  //{{{  random moves

  const randPlies = randPly + ((Math.random() < 0.5) ? 1 : 0);

  for (let i=0; i < randPlies; i++) {

    const m = dgRandomMove();

    if (m === '')
      return '';

    moves.push(m);
    position(nodes[0], bd, stm, rights, ep, 0, moves);

    if (dgIsDraw())
      return '';

  }

  //}}}
  //{{{  play

  let resignCount = 0;
  let drawCount   = 0;

  while (true) {

    const pos  = nodes[0].pos;
    const side = pos.stm;
    const ply  = moves.length;

    if (dgIsDraw() || ply >= DG_MAX_PLIES) {
      result = '0.5';
      break;
    }

    uciExec('go nodes ' + maxNodes);

    const move    = statsBestMove;
    const score   = statsBestScore;
    const inCheck = isAttacked(pos, lsb(pos.all[KING + side * 6]), side ^ 1);

    if (move == 0) {
      // no legal moves
      if (inCheck)
        result = (side == WHITE) ? '0.0' : '1.0';
      else
        result = '0.5';
      break;
    }

    const wScore = (side == WHITE) ? score : -score;
    const noisy  = (move & MOVE_NOISY) != 0;

    if (!inCheck && !noisy && Math.abs(score) < MATEISH)
      lines.push(formatFen(pos) + ' | ' + wScore);

    //{{{  adjudicate

    if (wScore >= MATEISH) {
      result = '1.0';
      break;
    }

    if (wScore <= -MATEISH) {
      result = '0.0';
      break;
    }

    if (Math.abs(wScore) >= DG_RESIGN_SCORE)
      resignCount++;
    else
      resignCount = 0;

    if (resignCount >= DG_RESIGN_PLIES) {
      result = (wScore > 0) ? '1.0' : '0.0';
      break;
    }

    if (ply >= DG_DRAW_MINPLY && Math.abs(wScore) <= DG_DRAW_SCORE)
      drawCount++;
    else
      drawCount = 0;

    if (drawCount >= DG_DRAW_PLIES) {
      result = '0.5';
      break;
    }

    //}}}

    moves.push(formatMove(move));
    position(nodes[0], bd, stm, rights, ep, 0, moves);

  }

  //}}}

  for (let i=0; i < lines.length; i++)
    dgWrite(lines[i] + ' | ' + result + '\n');

  dgGameFens = lines.length;

  return result;

}

//}}}
//{{{  datagen

function datagen (tokens) {

  const games   = uciGetInt(tokens, 'games',   1000);
  const maxNodes = uciGetInt(tokens, 'nodes',  5000);
  const randPly = uciGetInt(tokens, 'randply', 8);
  const dir     = uciGetStr(tokens, 'dir',     'data');
  const book    = uciGetStr(tokens, 'book',    '');

  if (book !== '' && dgOpenBook(book) === 0) {
    uciSend('datagen cannot open book', book);
    return;
  }

  const fileName = dgOpenOut(dir, BUILD + '_' + maxNodes + 'n');

  if (fileName === '') {
    uciSend('datagen cannot create a file in', dir, '(datagen needs node or the C build)');
    return;
  }

  dgLog('datagen ' + fileName + ' games ' + games + ' nodes ' + maxNodes + ' randply ' + randPly + ' dir ' + dir + ' book ' + book);

  let wins       = 0;
  let draws      = 0;
  let losses     = 0;
  let totalFens  = 0;
  let totalGames = 0;
  let abandoned  = 0;
  let fensSince  = 0;
  let t          = now();

  silentMode = 1;

  for (let g=1; g <= games; g++) {

    const result = dgPlayGame(maxNodes, randPly);

    if (result === '')
      abandoned++;
    else {
      totalGames++;
      totalFens += dgGameFens;
      fensSince += dgGameFens;
      if (result === '1.0')
        wins++;
      else if (result === '0.5')
        draws++;
      else
        losses++;
    }

    if ((g % DG_FLUSH_GAMES) === 0)
      dgFlush();

    if ((g % DG_REPORT_GAMES) === 0) {
      const secs = Math.max(1, now() - t) / 1000;
      dgLog(fileName + ' games ' + totalGames + ' fens ' + totalFens + ' fens/sec ' + ((fensSince / secs) | 0) + ' wdl ' + wins + ' ' + draws + ' ' + losses + ' abandoned ' + abandoned);
      t         = now();
      fensSince = 0;
    }

  }

  dgClose();

  silentMode = 0;

  dgLog('done ' + fileName + ' games ' + totalGames + ' fens ' + totalFens + ' wdl ' + wins + ' ' + draws + ' ' + losses + ' abandoned ' + abandoned);

}

//}}}

//}}}

//{{{  init once

function initOnce () {

  initBitboards();
  initNet();
  initBoard();
  initNodes();
  initMoves();
  initSearch();
  initUci();

  position(nodes[0], START_BOARD, 'w', 'KQkq', '-', 0, []);

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
    stdinEnded  = 1;
    cmdLineMode = 1;
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

