//
// fuse.js - lozza specific 64 bit hash fusion for lozza2c.
//
// lozza keeps its 64 bit zobrist hashes as pairs of int32 (loHash/hiHash,
// loObjPieces/hiObjPieces, ttLo/ttHi ...) because JS has no 64 bit ints.
// The C build fuses each pair into one uint64: paired declarations, adjacent
// lo/hi statements, and lo/hi equality tests joined by && or || become a
// single 64 bit operation. The low int32 is the low word, so tt indexes
// (loHash & ttMask) and every key bit are unchanged and the search is
// identical. The JS is untouched.
//

'use strict';

const PAIRS = [
  ['loHash',      'hiHash',      'hash'],
  ['loTurn',      'hiTurn',      'hashTurn'],
  ['loObjPieces', 'hiObjPieces', 'hashObjPieces'],
  ['loRights',    'hiRights',    'hashRights'],
  ['loEP',        'hiEP',        'hashEP'],
  ['repLoHash',   'repHiHash',   'repHash'],
  ['ttLo',        'ttHi',        'ttKey'],
  ['lo',          'hi',          'key'],      // locals in ttGet
];

const LO2HI = new Map(PAIRS.map(p => [p[0], p[1]]));
const LO2F  = new Map(PAIRS.map(p => [p[0], p[2]]));
const HI    = new Set(PAIRS.map(p => p[1]));
const FUSED = new Set(PAIRS.map(p => p[2]));

// lo names that are globals or node fields: a pair must mention one of these
// (so that  var lo = 0; var hi = 0;  in uciGetArr is left alone)

const LO_GLOBAL = new Set(PAIRS.filter(p => p[0] !== 'lo').map(p => p[0]));

// the two random draws of a pair become one 64 bit draw

LO2F.set('twisterRand', 'twisterRand64');

function stripped (n) {
  return JSON.stringify(n, (k, v) => (k === 'start' || k === 'end' || k === 'loc' || k === 'raw') ? undefined : v);
}

function renamed (n, map) {
  if (Array.isArray(n)) return n.map(x => renamed(x, map));
  if (!n || typeof n !== 'object') return n;
  const o = {};
  for (const k of Object.keys(n)) o[k] = renamed(n[k], map);
  if (o.type === 'Identifier' && map.has(o.name)) o.name = map.get(o.name);
  return o;
}

function mentions (n, names) {
  if (Array.isArray(n)) return n.some(x => mentions(x, names));
  if (!n || typeof n !== 'object') return false;
  if (n.type === 'Identifier' && names.has(n.name)) return true;
  for (const k of Object.keys(n))
    if (k !== 'loc' && mentions(n[k], names)) return true;
  return false;
}

function isPair (a, b) {
  return mentions(a, LO_GLOBAL) && stripped(renamed(a, LO2HI)) === stripped(b);
}

const EQ = new Set(['===', '==']);
const NE = new Set(['!==', '!=']);

function isEqPair (op, a, b) {
  // lo === x && hi === y  |  lo !== x || hi !== y
  if (a.type !== 'BinaryExpression') return false;
  if (op === '&&' && !EQ.has(a.operator)) return false;
  if (op === '||' && !NE.has(a.operator)) return false;
  return isPair(a, b);
}

function fuseList (stmts) {
  const out = [];
  for (let i = 0; i < stmts.length; i++) {
    const a = stmts[i], b = stmts[i + 1];
    if (b && a.type === b.type && (a.type === 'ExpressionStatement' || a.type === 'VariableDeclaration') && isPair(a, b)) {
      out.push(renamed(a, LO2F));
      i++;
      continue;
    }
    out.push(a);
  }
  return out;
}

function flatten (n, op, out) {
  if (n.type === 'LogicalExpression' && n.operator === op) { flatten(n.left, op, out); flatten(n.right, op, out); }
  else out.push(n);
}

function fuseLogical (n) {
  const ops = [];
  flatten(n, n.operator, ops);
  const res = [];
  for (let i = 0; i < ops.length; i++) {
    if (i + 1 < ops.length && isEqPair(n.operator, ops[i], ops[i + 1])) { res.push(renamed(ops[i], LO2F)); i++; }
    else res.push(ops[i]);
  }
  if (res.length === ops.length) return n;
  let e = res[0];
  for (let i = 1; i < res.length; i++)
    e = {type: 'LogicalExpression', operator: n.operator, left: e, right: res[i], loc: n.loc, start: n.start, end: n.end};
  return e;
}

function fuseNode (n) {
  if (Array.isArray(n)) return n.map(fuseNode);
  if (!n || typeof n !== 'object') return n;
  if (Array.isArray(n.body)) n.body = fuseList(n.body);
  if (Array.isArray(n.consequent)) n.consequent = fuseList(n.consequent);
  for (const k of Object.keys(n))
    if (k !== 'loc') n[k] = fuseNode(n[k]);
  if (n.type === 'LogicalExpression') return fuseLogical(n);
  return n;
}

// remaining single lo references (loHash & ttMask) read the low word of the fused value

function renameLo (n) {
  if (Array.isArray(n)) { n.forEach(renameLo); return; }
  if (!n || typeof n !== 'object') return;
  if (n.type === 'Identifier' && LO_GLOBAL.has(n.name)) n.name = LO2F.get(n.name);
  for (const k of Object.keys(n))
    if (k !== 'loc') renameLo(n[k]);
}

function fuse (ast) {
  fuseNode(ast);
  renameLo(ast);
  return ast;
}

const HI_GLOBAL = new Set(PAIRS.filter(p => p[0] !== 'lo').map(p => p[1]));

module.exports = {fuse, HI: HI_GLOBAL, FUSED, PAIRS};
