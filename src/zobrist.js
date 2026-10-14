let loTurn = twisterRand();
let hiTurn = twisterRand();

const loObjPieces = new Int32Array(15 * 256);
const hiObjPieces = new Int32Array(15 * 256);

for (let i=0; i < 15 * 256; i++) {
  loObjPieces[i] = twisterRand();
  hiObjPieces[i] = twisterRand();
}

const loRights = new Int32Array(16);
const hiRights = new Int32Array(16);

for (let i=0; i < 16; i++) {
  loRights[i] = twisterRand();
  hiRights[i] = twisterRand();
}

const loEP = new Int32Array(144);
const hiEP = new Int32Array(144);

for (let i=0; i < 144; i++) {
  loEP[i] = twisterRand();
  hiEP[i] = twisterRand();
}
