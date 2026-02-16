function seal (o) {
  Object.seal(o);
}

function myround(x) {
  return Math.sign(x) * Math.round(Math.abs(x));
}

function now() {
  return performance.now() | 0;
}

