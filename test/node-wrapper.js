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
  // Command line args are handled by C main(argc, argv)
  // Only set up interactive stdin if no args were passed
  if (process.argv.length > 2) {
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', (line) => {
    const quit = Module.ccall('uci_input', 'number', ['string'], [line]);
    if (quit) rl.close();
  });
};
