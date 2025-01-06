
const ACTI_RELU   = 1;
const ACTI_CRELU  = 2;
const ACTI_SRELU  = 3;
const ACTI_SCRELU = 4;

const id_suffix       = 'flip';                                                               // to manually modify the weights filename.
const dataFiles       = ['data/gen3a.filtered','data/gen3b.filtered','data/gen3c.filtered'];  // list of files generated with filter.js.
const acti            = ACTI_SRELU;
const hiddenSize      = 128;   // size of each perspective's hidden layer
const shuffle         = true;
const batchSize       = 500;
const learningRate    = 0.001;
const interp          = 0.5;   // for weights file only - must be same as in filter.js.
const K               = 100;   // for weights file only - must be same as in filter.js.

const reportRate      = 50;
const epochs          = 10000;
const inputSize       = 768;   // number of binary inputs per perspective
const outputSize      = 1;
const maxActiveInputs = 32;
const beta1           = 0.9;
const beta2           = 0.999;
const epsilon         = 1e-7;

const fs       = require('fs');
const readline = require('readline');
const path     = require('path');
const child    = require('child_process');

const id = activationName() + '_' + hiddenSize + '_' + Math.trunc(interp * 10) + id_suffix;

console.log(id);
console.log(id, 'data files', dataFiles.toString());

function myround(x) {
  return Math.sign(x) * Math.round(Math.abs(x));
}

function shuffleFile(filePath) {
  var tempFile = filePath + '.tmp';
  return new Promise(function(resolve, reject) {
    // Shuffle the file and write it to a temporary file using 'shuf'
    child.exec('shuf ' + filePath + ' > ' + tempFile, function(err, stdout, stderr) {
      if (err) {
        reject('Error shuffling file: ' + stderr);
        return;
      }
      // After shuffling, move the temporary file to overwrite the original file
      child.exec('mv ' + tempFile + ' ' + filePath, function(err2, stdout2, stderr2) {
        if (err2) {
          reject('Error moving file: ' + stderr2);
        } else {
          resolve('Shuffled: ' + filePath);
        }
      });
    });
  });
}

function shuffleAllFiles(files) {
  return new Promise(function(resolve, reject) {
    var promises = [];
    for (var i = 0; i < files.length; i++) {
      promises.push(shuffleFile(files[i]));
    }
    Promise.all(promises).then(function(results) {
      resolve(results);
    }).catch(function(err) {
      reject(err);
    });
  });
}

async function* createLineStream(filenames) {
  for (var f = 0; f < filenames.length; f++) {
    var filename = filenames[f];
    var fileStream = fs.createReadStream(filename);
    var rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    for await (var line of rl) {
      yield line;
    }
    rl.close();
  }
}

function optiName() {
  return "adam";
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x / K));
}

function relu(x) {
  return Math.max(0, x);
}

function drelu(x) {
  return x > 0 ? 1 : 0;
}

function crelu(x) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function dcrelu(x) {
  if (x > 0 && x < 1) return 1;
  return 0;
}

function srelu(x) {
  var r = Math.max(0, x);
  return r * r;
}

function dsrelu(x) {
  if (x > 0) return 2 * x;
  return 0;
}

function screlu(x) {
  var r = x;
  if (r < 0) r = 0;
  if (r > 1) r = 1;
  return r * r;
}

function dscrelu(x) {
  if (x > 0 && x < 1) return 2 * x;
  return 0;
}

function activationFunction(x) {
  switch (acti) {
    case ACTI_RELU:   return relu(x);
    case ACTI_CRELU:  return crelu(x);
    case ACTI_SRELU:  return srelu(x);
    case ACTI_SCRELU: return screlu(x);
  }
}

function activationDerivative(x) {
  switch (acti) {
    case ACTI_RELU:   return drelu(x);
    case ACTI_CRELU:  return dcrelu(x);
    case ACTI_SRELU:  return dsrelu(x);
    case ACTI_SCRELU: return dscrelu(x);
  }
}

function activationName() {
  switch (acti) {
    case ACTI_RELU:   return "relu";
    case ACTI_CRELU:  return "crelu";
    case ACTI_SRELU:  return "srelu";
    case ACTI_SCRELU: return "screlu";
  }
}

function initializeParameters() {
  var scale = Math.sqrt(2 / inputSize);

  var params = {
    // Non-flipped
    W1nf: new Float32Array(inputSize * hiddenSize),
    b1nf: new Float32Array(hiddenSize),
    // Flipped
    W1f:  new Float32Array(inputSize * hiddenSize),
    b1f:  new Float32Array(hiddenSize),
    // Output
    W2:   new Float32Array(hiddenSize * 2),
    b2:   0,

    // ADAM accumulators
    vW1nf: new Float32Array(inputSize * hiddenSize),
    vb1nf: new Float32Array(hiddenSize),
    vW1f:  new Float32Array(inputSize * hiddenSize),
    vb1f:  new Float32Array(hiddenSize),
    vW2:   new Float32Array(hiddenSize * 2),
    vb2:   0,

    sW1nf: new Float32Array(inputSize * hiddenSize),
    sb1nf: new Float32Array(hiddenSize),
    sW1f:  new Float32Array(inputSize * hiddenSize),
    sb1f:  new Float32Array(hiddenSize),
    sW2:   new Float32Array(hiddenSize * 2),
    sb2:   0
  };

  var i;
  // Initialize non-flipped weights
  for (i = 0; i < inputSize * hiddenSize; i++) {
    params.W1nf[i] = (Math.random() * 2 - 1) * scale;
  }
  for (i = 0; i < hiddenSize; i++) {
    params.b1nf[i] = 0;
  }

  // Initialize flipped weights
  for (i = 0; i < inputSize * hiddenSize; i++) {
    params.W1f[i] = (Math.random() * 2 - 1) * scale;
  }
  for (i = 0; i < hiddenSize; i++) {
    params.b1f[i] = 0;
  }

  // Initialize output weights
  for (i = 0; i < hiddenSize * 2; i++) {
    params.W2[i] = (Math.random() * 2 - 1) * scale;
  }
  params.b2 = 0;

  return params;
}

function saveModel(loss, params, ep, batches) {

  var actiName = activationName();
  var opt      = optiName();

  var o = '//{{{  weights\r\n';

  o += 'const net_h1_size     = '  + hiddenSize         + ';\r\n';
  o += 'const net_lr          = '  + learningRate       + ';\r\n';
  o += 'const net_activation  = '  + actiName           + ';\r\n';
  o += 'const net_stretch     = '  + K                  + ';\r\n';
  o += 'const net_interp      = '  + interp             + ';\r\n';
  o += 'const net_batch_size  = '  + batchSize          + ';\r\n';
  o += 'const net_batches     = '  + batches            + ';\r\n';
  o += 'const net_samples     = '  + (batches * batchSize)  + ';\r\n';
  o += 'const net_opt         = "' + opt                + '";\r\n';
  o += 'const net_shuffle     = "' + shuffle            + '";\r\n';
  o += 'const net_epochs      = '  + ep                 + ';\r\n';
  o += 'const net_loss        = '  + loss               + ';\r\n';

  o += '//{{{  weights\r\n';

  // non-flipped h1
  o += 'const net_h1_w = Array(' + (inputSize + 1) + ');\r\n';
  var i, j, row;
  for (i = 0; i < inputSize; i++) {
    row = [];
    var base = i * hiddenSize;
    for (j = 0; j < hiddenSize; j++) {
      row.push(params.W1nf[base + j]);
    }
    o += 'net_h1_w[' + i + '] = new Float32Array([';
    for (j = 0; j < hiddenSize; j++) {
      o += row[j];
      if (j < hiddenSize - 1) o += ',';
    }
    o += ']);\r\n';
  }
  o += 'net_h1_w[' + inputSize + '] = new Float32Array(' + hiddenSize + ').fill(0);\r\n';

  // non-flipped bias
  o += 'const net_h1_b = new Float32Array([';
  for (i = 0; i < hiddenSize; i++) {
    o += params.b1nf[i];
    if (i < hiddenSize - 1) o += ',';
  }
  o += ']);\r\n';

  // flipped h1
  o += 'const net_h2_w = Array(' + (inputSize + 1) + ');\r\n';
  for (i = 0; i < inputSize; i++) {
    row = [];
    var base2 = i * hiddenSize;
    for (j = 0; j < hiddenSize; j++) {
      row.push(params.W1f[base2 + j]);
    }
    o += 'net_h2_w[' + i + '] = new Float32Array([';
    for (j = 0; j < hiddenSize; j++) {
      o += row[j];
      if (j < hiddenSize - 1) o += ',';
    }
    o += ']);\r\n';
  }
  o += 'net_h2_w[' + inputSize + '] = new Float32Array(' + hiddenSize + ').fill(0);\r\n';

  // flipped bias
  o += 'const net_h2_b = new Float32Array([';
  for (i = 0; i < hiddenSize; i++) {
    o += params.b1f[i];
    if (i < hiddenSize - 1) o += ',';
  }
  o += ']);\r\n';

  // output weights
  o += 'const net_o_w = new Float32Array([';
  for (i = 0; i < hiddenSize * 2; i++) {
    o += params.W2[i];
    if (i < hiddenSize * 2 - 1) o += ',';
  }
  o += ']);\r\n';

  // output bias
  o += 'const net_o_b = ' + params.b2 + ';\r\n';

  o += '\r\n//}}}\r\n';
  o += '\r\n//}}}\r\n\r\n';

  var weightsFile = 'data/weights_' + id + '_' + ep + '.js';
  fs.writeFileSync(weightsFile, o);
}

function forwardPropagation(nonFlipIndices, flipIndices, params) {
  var m = nonFlipIndices.length;
  // We store Z1nf, A1nf, Z1f, A1f for possible backprop usage
  var Z1nf = new Float32Array(m * hiddenSize);
  var A1nf = new Float32Array(m * hiddenSize);
  var Z1f  = new Float32Array(m * hiddenSize);
  var A1f  = new Float32Array(m * hiddenSize);

  var Z2 = new Float32Array(m);
  var A2 = new Float32Array(m);

  var i, j, idx;

  for (i = 0; i < m; i++) {
    // Non-flipped first
    for (j = 0; j < hiddenSize; j++) {
      var z = params.b1nf[j];
      var listNf = nonFlipIndices[i];
      for (var k = 0; k < listNf.length; k++) {
        idx = listNf[k];
        z += params.W1nf[idx * hiddenSize + j];
      }
      Z1nf[i * hiddenSize + j] = z;
      A1nf[i * hiddenSize + j] = activationFunction(z);
    }

    // Flipped next
    for (j = 0; j < hiddenSize; j++) {
      var zf = params.b1f[j];
      var listF = flipIndices[i];
      for (var k2 = 0; k2 < listF.length; k2++) {
        idx = listF[k2];
        zf += params.W1f[idx * hiddenSize + j];
      }
      Z1f[i * hiddenSize + j] = zf;
      A1f[i * hiddenSize + j] = activationFunction(zf);
    }

    // Output
    var sumZ2 = params.b2;
    // 256 = hiddenSize * 2
    // first 128 from A1nf, second 128 from A1f
    for (j = 0; j < hiddenSize; j++) {
      sumZ2 += A1nf[i * hiddenSize + j] * params.W2[j];
    }
    for (j = 0; j < hiddenSize; j++) {
      sumZ2 += A1f[i * hiddenSize + j] * params.W2[hiddenSize + j];
    }
    Z2[i] = sumZ2;
    A2[i] = sigmoid(sumZ2);
  }

  return {
    Z1nf: Z1nf,
    A1nf: A1nf,
    Z1f:  Z1f,
    A1f:  A1f,
    Z2:   Z2,
    A2:   A2
  };
}

function backwardPropagation(nonFlipIndices, flipIndices, targets, params, fwd) {
  var m = nonFlipIndices.length;

  var dZ2 = new Float32Array(m);
  var dW2 = new Float32Array(hiddenSize * 2);
  var db2 = 0;

  var dA1nf = new Float32Array(m * hiddenSize);
  var dA1f  = new Float32Array(m * hiddenSize);

  var dZ1nf = new Float32Array(m * hiddenSize);
  var dZ1f  = new Float32Array(m * hiddenSize);

  var dW1nf = new Float32Array(inputSize * hiddenSize);
  var dW1f  = new Float32Array(inputSize * hiddenSize);

  var db1nf = new Float32Array(hiddenSize);
  var db1f  = new Float32Array(hiddenSize);

  var i, j, idx;

  for (i = 0; i < m; i++) {
    // dZ2 = (A2 - y)
    dZ2[i] = fwd.A2[i] - targets[i];
    db2 += dZ2[i];

    // Update dW2 for each perspective
    for (j = 0; j < hiddenSize; j++) {
      dW2[j] += dZ2[i] * fwd.A1nf[i * hiddenSize + j];
      dW2[hiddenSize + j] += dZ2[i] * fwd.A1f[i * hiddenSize + j];
    }
  }

  // Now compute the partial derivatives w.r.t. A1nf and A1f
  for (i = 0; i < m; i++) {
    for (j = 0; j < hiddenSize; j++) {
      dA1nf[i * hiddenSize + j] = dZ2[i] * params.W2[j];
      dA1f[i * hiddenSize + j]  = dZ2[i] * params.W2[hiddenSize + j];
    }
  }

  // Next, we get dZ1nf, dZ1f by multiplying dA1? with activation derivative
  for (i = 0; i < m; i++) {
    for (j = 0; j < hiddenSize; j++) {
      dZ1nf[i * hiddenSize + j] = dA1nf[i * hiddenSize + j] *
                                  activationDerivative(fwd.Z1nf[i * hiddenSize + j]);
      dZ1f[i * hiddenSize + j]  = dA1f[i * hiddenSize + j] *
                                  activationDerivative(fwd.Z1f[i * hiddenSize + j]);
    }
  }

  // Finally, accumulate dW1nf, dW1f and db1nf, db1f
  for (i = 0; i < m; i++) {
    var listNf = nonFlipIndices[i];
    var listF  = flipIndices[i];

    for (j = 0; j < hiddenSize; j++) {
      db1nf[j] += dZ1nf[i * hiddenSize + j];
      db1f[j]  += dZ1f[i * hiddenSize + j];

      var ddnf = dZ1nf[i * hiddenSize + j];
      var ddf  = dZ1f[i * hiddenSize + j];

      // update W1nf for each active index
      for (var k = 0; k < listNf.length; k++) {
        idx = listNf[k];
        dW1nf[idx * hiddenSize + j] += ddnf;
      }

      // update W1f for each active index
      for (var k2 = 0; k2 < listF.length; k2++) {
        idx = listF[k2];
        dW1f[idx * hiddenSize + j] += ddf;
      }
    }
  }

  // Average by m
  for (j = 0; j < hiddenSize * 2; j++) {
    dW2[j] /= m;
  }
  db2 /= m;

  for (j = 0; j < hiddenSize; j++) {
    db1nf[j] /= m;
    db1f[j]  /= m;
  }

  for (i = 0; i < inputSize * hiddenSize; i++) {
    dW1nf[i] /= m;
    dW1f[i]  /= m;
  }

  return {
    dW1nf: dW1nf,
    db1nf: db1nf,
    dW1f:  dW1f,
    db1f:  db1f,
    dW2:   dW2,
    db2:   db2
  };
}

function updateParameters(params, grads, t) {
  function updateParam(param, grad, v, s, i) {
    v[i] = beta1 * v[i] + (1 - beta1) * grad[i];
    s[i] = beta2 * s[i] + (1 - beta2) * grad[i] * grad[i];
    var vCorr = v[i] / (1 - Math.pow(beta1, t));
    var sCorr = s[i] / (1 - Math.pow(beta2, t));
    var upd   = learningRate * vCorr / (Math.sqrt(sCorr) + epsilon);
    return param[i] - upd;
  }

  var i;

  // Update W1nf
  for (i = 0; i < inputSize * hiddenSize; i++) {
    params.W1nf[i] = updateParam(params.W1nf, grads.dW1nf, params.vW1nf, params.sW1nf, i);
  }
  // Update b1nf
  for (i = 0; i < hiddenSize; i++) {
    params.b1nf[i] = updateParam(params.b1nf, grads.db1nf, params.vb1nf, params.sb1nf, i);
  }

  // Update W1f
  for (i = 0; i < inputSize * hiddenSize; i++) {
    params.W1f[i] = updateParam(params.W1f, grads.dW1f, params.vW1f, params.sW1f, i);
  }
  // Update b1f
  for (i = 0; i < hiddenSize; i++) {
    params.b1f[i] = updateParam(params.b1f, grads.db1f, params.vb1f, params.sb1f, i);
  }

  // Update W2
  for (i = 0; i < hiddenSize * 2; i++) {
    params.W2[i] = updateParam(params.W2, grads.dW2, params.vW2, params.sW2, i);
  }

  // Update b2
  var bb = [params.b2];
  var gg = [grads.db2];
  var vv = [params.vb2];
  var ss = [params.sb2];
  vv[0] = beta1 * vv[0] + (1 - beta1) * gg[0];
  ss[0] = beta2 * ss[0] + (1 - beta2) * gg[0] * gg[0];
  var vC = vv[0] / (1 - Math.pow(beta1, t));
  var sC = ss[0] / (1 - Math.pow(beta2, t));
  var u  = learningRate * vC / (Math.sqrt(sC) + epsilon);
  bb[0] = bb[0] - u;
  params.b2  = bb[0];
  params.vb2 = vv[0];
  params.sb2 = ss[0];

  return params;
}

function flipIndex (index) {
  const section = Math.floor(index / 64);
  const square = index % 64;
  const flippedSquare = square ^ 56;
  const flippedSection = (section + 6) % 12;
  const flippedIndex = flippedSection * 64 + flippedSquare;
  return flippedIndex;
}

function decodeLine(line) {

  var parts = line.split(',');
  var n = parts.length;

  if (!n)
    console.log('null line');

  if (n < 3)
    console.log('short line',n);

  var targetVal = parseFloat(parts[n-1]);

  if (targetVal > 1.0)
    console.log('big target',targetVal);
  if (targetVal < 0.0)
    console.log('small target',targetVal);

  var arrNF = [];
  var arrF  = [];

  for (let i = 0; i < n-1; i++) {
    arrNF.push(parseInt(parts[i], 10));
    arrF.push(flipIndex(parseInt(parts[i], 10)));
  }

  return {
    nonFlip: arrNF,
    flip:    arrF,
    target:  targetVal
  };
}

async function train(filenames) {
  // Randomize the random generator based on time-of-day
  var now = new Date();
  var midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  var n = Math.floor((now - midnight) / 1000);
  var i;
  for (i = 0; i < n; i++) {
    Math.random();
  }

  // Initialize
  var params = initializeParameters();

  // Save once at the start
  saveModel(0, params, 0, 0);

  console.log(id, 'hidden', hiddenSize, 'acti', activationName(), 'stretch', K, 'shuffle', shuffle, 'batchsize', batchSize, 'lr', learningRate, 'interp', interp);

  var t = 0;

  // Outer training loop
  for (var epoch = 0; epoch < epochs; epoch++) {

    var lineStream = createLineStream(filenames);

    var batchNF = [];
    var batchF  = [];
    var batchT  = [];

    var totalLoss = 0;
    var batchCount = 0;

    for await (var line of lineStream) {
      var decoded = decodeLine(line);
      var nfIdx   = decoded.nonFlip;
      var fIdx    = decoded.flip;
      var tVal    = decoded.target;

      if (nfIdx.length) {
        batchNF.push(nfIdx);
        batchF.push(fIdx);
        batchT.push(tVal);

        if (batchNF.length === batchSize) {
          t++;
          // Forward
          var fwd = forwardPropagation(batchNF, batchF, params);

          // Backward
          var grads = backwardPropagation(batchNF, batchF, batchT, params, fwd);

          // Update
          params = updateParameters(params, grads, t);

          // Compute batch MSE
          var localLoss = 0;
          var b;
          for (b = 0; b < batchSize; b++) {
            var diff = fwd.A2[b] - batchT[b];
            localLoss += diff * diff;
          }
          localLoss /= batchSize;

          totalLoss += localLoss;
          batchCount++;

          batchNF = [];
          batchF  = [];
          batchT  = [];

          if (batchCount % reportRate === 0) {
            var partialLoss = totalLoss / batchCount;
            process.stdout.write(id + " epoch " + (epoch + 1) + " batch " + batchCount + " loss " + partialLoss + "\r");
          }
        }
      }
    }

    var avgLoss = 0;
    if (batchCount > 0) {
      avgLoss = totalLoss / batchCount;
    }

    // Save after each epoch
    saveModel(avgLoss, params, epoch + 1, batchCount);

    console.log(id, 'epoch', (epoch + 1), 'batch', batchCount, 'bloss', avgLoss);

    if (shuffle) {
      await shuffleAllFiles(dataFiles);
    }
  }

  return params;
}

train(dataFiles).then(function(params) {
  console.log('Training completed.');
}).catch(function(error) {
  console.error('Error during training:', error);
});

