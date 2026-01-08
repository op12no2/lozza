const fs = require('fs');
const path = require('path');
const { search, position, nodes, tcClear, timeControl } = require('../lozza.js');

const DEPTH = 3;

const csvFile = path.join(__dirname, 'bench.csv');
const lines = fs.readFileSync(csvFile, 'utf8').split('\n').filter(l => l.trim());

const positions = [];
for (const line of lines) {
  const match = line.match(/"([^"]+)"/);
  if (match) {
    positions.push(match[1]);
  }
}

console.log(`Bench: ${positions.length} positions, depth ${DEPTH}\n`);

let totalNodes = 0;
const t1 = performance.now();

for (let i = 0; i < positions.length; i++) {
  const fen = positions[i];
  position(nodes[0].pos, fen);
  tcClear();
  const score = search(DEPTH, 0, -Infinity, Infinity);
  totalNodes += timeControl.nodes;
  console.log(`${i + 1}. ${fen.substring(0, 40)}... score: ${score}, nodes: ${timeControl.nodes}`);
}

const elapsed = performance.now() - t1;
const nps = Math.round(totalNodes / (elapsed / 1000));

console.log(`\nelapsed: ${(elapsed / 1000).toFixed(2)}s, nodes: ${totalNodes.toLocaleString()}, nps: ${nps.toLocaleString()}`);
