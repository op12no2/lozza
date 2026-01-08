const fs = require('fs');
const path = require('path');
const { perft, position, nodes } = require('../lozza.js');

const epdFile = path.join(__dirname, 'standard.epd');
const lines = fs.readFileSync(epdFile, 'utf8').split('\n').filter(l => l.trim());

let passed = 0;
let failed = 0;
let totalNodes = 0n;

const t1 = performance.now();

for (const line of lines) {
  const parts = line.split(';');
  const fen = parts[0].trim();

  position(nodes[0].pos, fen);

  for (let i = 1; i < parts.length; i++) {
    const match = parts[i].trim().match(/D(\d+)\s+(\d+)/);
    if (!match) continue;

    const depth = parseInt(match[1]);
    const expected = parseInt(match[2]);

    //if (depth > 4) continue;  // skip deep depths for speed

    const result = perft(depth, 0);
    totalNodes += BigInt(result);

    if (result === expected) {
      passed++;
      console.log(fen, depth, result, expected)
    }
    else {
      failed++;
      console.log(`FAIL: ${fen}`);
      console.log(`  D${depth}: got ${result}, expected ${expected}`);
      //process.exit();
    }
  }
}

const elapsed = performance.now() - t1;
const nps = Number(totalNodes * 1000n / BigInt(Math.round(elapsed)));

console.log(`\nPassed: ${passed}, Failed: ${failed}`);
console.log(`Total nodes: ${totalNodes}, Elapsed: ${(elapsed / 1000).toFixed(1)}s, NPS: ${nps.toLocaleString()}`);

process.exit(failed > 0 ? 1 : 0);
