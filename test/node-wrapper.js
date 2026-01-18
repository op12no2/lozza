#!/usr/bin/env node

const readline = require('readline');

global.postMessage = function(msg) {
  process.stdout.write(msg);
};

const Module = require('../releases/lozza.js');

Module.onRuntimeInitialized = function() {
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
