// magics.js
// Binary loader + C-matching validator for magics.bin (rook first, bishop second).
// Per-square layout (little-endian u32):
//   bits, shift, magicLo, magicHi, maskLo, maskHi,
//   then 2*(1<<bits) u32s: attackLo[i], attackHi[i]

"use strict";

const fs = require("fs");

// ---------- 64-bit helpers (BigInt) ----------
function bbToBig(lo, hi) {
  return ((BigInt(hi >>> 0) << 32n) | BigInt(lo >>> 0)) & 0xffff_ffff_ffff_ffffn;
}
function bigToLoHi(x) {
  x &= 0xffff_ffff_ffff_ffffn;
  const lo = Number(x & 0xffff_ffffn) >>> 0;
  const hi = Number((x >> 32n) & 0xffff_ffffn) >>> 0;
  return [lo, hi];
}
// exact reference magic index
// exact reference magic index with 64-bit modular multiply (like C)
function magicIndexBigInt(bLo, bHi, mLo, mHi, shift) {
  const b = bbToBig(bLo, bHi);
  const m = bbToBig(mLo, mHi);
  const prod = (b * m) & 0xffff_ffff_ffff_ffffn;   // <-- wrap to 64 bits
  const idx  = prod >> BigInt(shift >>> 0);
  return Number(idx & 0xffff_ffffn) >>> 0;
}

// ---------- Attack record (JS mirror of C) ----------
function makeAttack(bits, shift, loMagic, hiMagic, loMask, hiMask) {
  const count = 1 << bits;
  return {
    bits: bits >>> 0,
    shift: shift >>> 0,
    loMagic: loMagic >>> 0,
    hiMagic: hiMagic >>> 0,
    loMask: loMask >>> 0,
    hiMask: hiMask >>> 0,
    count,
    loAttacks: new Uint32Array(count),
    hiAttacks: new Uint32Array(count),
  };
}

// ---------- Binary reader ----------
function readU32le(buf, off) { return [buf.readUInt32LE(off), off + 4]; }

function readOneTable(buf, off) {
  const table = new Array(64);
  for (let sq = 0; sq < 64; sq++) {
    let bits, shift, magicLo, magicHi, maskLo, maskHi;
    [bits, off]    = readU32le(buf, off);
    [shift, off]   = readU32le(buf, off);
    [magicLo, off] = readU32le(buf, off);
    [magicHi, off] = readU32le(buf, off);
    [maskLo, off]  = readU32le(buf, off);
    [maskHi, off]  = readU32le(buf, off);

    const a = makeAttack(bits, shift, magicLo, magicHi, maskLo, maskHi);
    for (let i = 0; i < a.count; i++) {
      let lo, hi;
      [lo, off] = readU32le(buf, off);
      [hi, off] = readU32le(buf, off);
      a.loAttacks[i] = lo >>> 0;
      a.hiAttacks[i] = hi >>> 0;
    }
    table[sq] = a;
  }
  return [table, off];
}

function loadMagics(path) {
  const buf = fs.readFileSync(path);
  let off = 0;
  const [rook_attacks, off1]    = readOneTable(buf, off);
  const [bishop_attacks, off2]  = readOneTable(buf, off1);
  if (off2 !== buf.length) {
    throw new Error(`Trailing bytes: consumed ${off2}, file size ${buf.length} (leftover ${buf.length - off2})`);
  }
  return { rook_attacks, bishop_attacks, bytes: off2 };
}

// ---------- Convenience printing ----------
function hex64_from_lohi(lo, hi) { return "0x" + bbToBig(lo, hi).toString(16).padStart(16, "0"); }

// ---------- Blocker subset enumeration from a mask (C order) ----------
function populateBlockersFromMask(loMask, hiMask) {
  const pos = [];
  for (let sq = 0; sq < 32; sq++)  if ((loMask >>> 0) & (1 << sq)) pos.push(sq);
  for (let sq = 32; sq < 64; sq++) if ((hiMask >>> 0) & (1 << (sq - 32))) pos.push(sq);
  const n = pos.length, total = 1 << n;
  const lo = new Uint32Array(total), hi = new Uint32Array(total);
  for (let idx = 0; idx < total; idx++) {
    let l = 0 >>> 0, h = 0 >>> 0;
    for (let k = 0; k < n; k++) if ((idx >>> k) & 1) {
      const sq = pos[k];
      if (sq < 32) l = (l | (1 << sq)) >>> 0; else h = (h | (1 << (sq - 32))) >>> 0;
    }
    lo[idx] = l; hi[idx] = h;
  }
  return { lo, hi };
}

// ---------- FNV-1a 64-bit (matches C) ----------
function fnv1a64Init() { return 0xcbf29ce484222325n; }
function fnv1a64Push(h, u32) { h ^= BigInt(u32 >>> 0); return (h * 0x100000001b3n) & 0xffff_ffff_ffff_ffffn; }
function hex64b(nBig) { return "0x" + nBig.toString(16).padStart(16, "0"); }

// Hash the table in the SAME order as C validate_table():
//   - push bits, shift, magicLo, magicHi
//   - enumerate blockers from mask (subset index order)
//   - compute idx = magicIndex(blocker, magic, shift)
//   - push a.loAttacks[idx], a.hiAttacks[idx]
function hashTableCStyle(table) {
  let H = fnv1a64Init();
  for (let sq = 0; sq < 64; sq++) {
    const a = table[sq];
    H = fnv1a64Push(H, a.bits);
    H = fnv1a64Push(H, a.shift);
    H = fnv1a64Push(H, a.loMagic);
    H = fnv1a64Push(H, a.hiMagic);

    const { lo: blo, hi: bhi } = populateBlockersFromMask(a.loMask, a.hiMask);
    const n = 1 << a.bits;
    for (let i = 0; i < n; i++) {
      const idx = magicIndexBigInt(blo[i], bhi[i], a.loMagic, a.hiMagic, a.shift);
      const alo = a.loAttacks[idx] >>> 0;
      const ahi = a.hiAttacks[idx] >>> 0;
      H = fnv1a64Push(H, alo);
      H = fnv1a64Push(H, ahi);
    }
  }
  return H;
}

// ---------- CLI driver ----------
if (require.main === module) {
  const file = process.argv[2] || "magics.bin";
  const { rook_attacks, bishop_attacks, bytes } = loadMagics(file);

  console.log("Loaded", file, "bytes:", bytes);
  const r0 = rook_attacks[0], r7 = rook_attacks[7], b27 = bishop_attacks[27];
  console.log("Rook sq 0:", { bits: r0.bits, shift: r0.shift, magic: hex64_from_lohi(r0.loMagic, r0.hiMagic), tableLen: r0.loAttacks.length });
  console.log("Rook sq 7:", { bits: r7.bits, shift: r7.shift, magic: hex64_from_lohi(r7.loMagic, r7.hiMagic), tableLen: r7.loAttacks.length });
  console.log("Bishop sq 27:", { bits: b27.bits, shift: b27.shift, magic: hex64_from_lohi(b27.loMagic, b27.hiMagic), tableLen: b27.loAttacks.length });

  // sanity sample
  const sampleBlo = 0x01234567 >>> 0, sampleBhi = 0x89abcdef >>> 0;
  const sampleIdx = magicIndexBigInt(sampleBlo, sampleBhi, r0.loMagic, r0.hiMagic, r0.shift);
  console.log("Sample idx for rook sq 0 with blocker", hex64_from_lohi(sampleBlo, sampleBhi), "=>", sampleIdx);

  // C-matching hashes (use your C outputs)
  const hR = hashTableCStyle(rook_attacks);
  const hB = hashTableCStyle(bishop_attacks);
  console.log("JS  Rook  hash:", hex64b(hR));
  console.log("JS  Bishop hash:", hex64b(hB));

  const EXPECT_R = 0xb8b015403aad55den; // from your C print
  const EXPECT_B = 0x807bfb40db19dd1fn; // from your C print
  console.log("Match Rook?  ", hR === EXPECT_R ? "yes ?" : "no ?");
  console.log("Match Bishop?", hB === EXPECT_B ? "yes ?" : "no ?");
}

// ---------- exports ----------
module.exports = { loadMagics, magicIndexBigInt };

