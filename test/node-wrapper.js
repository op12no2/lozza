#!/usr/bin/env node
//
// Node.js wrapper to test lozza WASM via stdin/stdout
//
// Usage: node test/node-wrapper.js              # interactive
//    or: node test/node-wrapper.js uci q        # command line args
//    or: echo -e "uci\nquit" | node test/node-wrapper.js
//

const readline = require('readline');

// Capture postMessage calls and redirect to stdout
global.postMessage = function(msg) {
  process.stdout.write(msg);
};

// Load the Node-compatible WASM build
const Module = require('./lozza-node.js');

// Wait for WASM to initialize
Module.onRuntimeInitialized = function() {
  // Process command line args first (if any)
  const args = process.argv.slice(2);
  if (args.length > 0) {
    for (const arg of args) {
      Module.ccall('uci_input', null, ['string'], [arg]);
    }
    return; // Exit after processing args
  }

  // Otherwise, set up interactive stdin
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', (line) => {
    Module.ccall('uci_input', null, ['string'], [line]);
  });

  rl.on('close', () => {
    // Keep process alive for async operations
  });
};
