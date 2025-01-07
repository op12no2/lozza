// create-base64.js

const fs = require('fs');

// Path to your NNUE weights file
const netWeightsFile = 'data/weights_srelu_128_89.bin';

// Read in the raw binary data
const data = fs.readFileSync(netWeightsFile);

// Convert to a Base64 string
const b64 = data.toString('base64');

// Print or write it to a file
console.log(b64);

