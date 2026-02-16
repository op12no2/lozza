// seal

function seal (o) {
  Object.seal(o);
}

// myround

function myround(x) {
  return Math.sign(x) * Math.round(Math.abs(x));
}

// now

function now() {
  return performance.now() | 0;
}

