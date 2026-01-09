// board

const bdB = new Uint8Array(144);    // pieces
const bdZ = new Uint8Array(144);    // pointers to w|bList

let bdTurn   = 0;
let bdRights = 0;
let bdEp     = 0;

const wList = new Uint8Array(16);
const bList = new Uint8Array(16);

const wbList = [wList, bList];

const wCounts = new Uint8Array(7);
const bCounts = new Uint8Array(7);

let wCount = 0;
let bCount = 0;

const objHistory = new Uint32Array(15 * 256);

