const WHITE = 0;
const BLACK = 8;

const PAWN = 1;
const KNIGHT = 2;
const BISHOP = 3;
const ROOK = 4;
const QUEEN = 5;
const KING = 6;

const PIECE_MAP = {
  'P': PAWN, 'N': KNIGHT, 'B': BISHOP, 'R': ROOK, 'Q': QUEEN, 'K': KING,
  'p': PAWN|BLACK, 'n': KNIGHT|BLACK, 'b': BISHOP|BLACK, 'r': ROOK|BLACK, 'q': QUEEN|BLACK, 'k': KING|BLACK
};

const RIGHTS_K = 1;
const RIGHTS_Q = 2;
const RIGHTS_k = 4;
const RIGHTS_q = 8;

class Pos {

  constructor() {
    this.board = new Uint8Array(128);
    this.kings = new Uint8Array(2);
    this.ep = 0;
    this.rights = 0;
    this.stm = 0;
  }
}

function posClear(pos) {
  pos.board.fill(0);
  pos.kings.fill(0);
  pos.ep = 0;
  pos.rights = 0;
  pos.stm = 0;
}

function posSet(pos, other) {
  pos.board.set(other.board);
  pos.kings.set(other.kings);
  pos.ep = other.ep;
  pos.rights = other.rights;
  pos.stm = other.stm;
}

function position(pos, fen) {
  posClear(pos);

  const parts = fen.split(' ');
  const ranks = parts[0].split('/');

  for (let rank = 7; rank >= 0; rank--) {
    const fenRank = ranks[7 - rank];
    let file = 0;
    for (let i = 0; i < fenRank.length; i++) {
      const c = fenRank[i];
      if (c >= '1' && c <= '8') {
        file += parseInt(c);
      }
      else {
        const sq = rank * 16 + file;
        const piece = PIECE_MAP[c];
        pos.board[sq] = piece;
        if (c === 'K') pos.kings[WHITE >> 3] = sq;
        if (c === 'k') pos.kings[BLACK >> 3] = sq;
        file++;
      }
    }
  }

  pos.stm = (parts[1] === 'w') ? WHITE : BLACK;

  const castling = parts[2] || '-';
  if (castling.includes('K')) pos.rights |= RIGHTS_K;
  if (castling.includes('Q')) pos.rights |= RIGHTS_Q;
  if (castling.includes('k')) pos.rights |= RIGHTS_k;
  if (castling.includes('q')) pos.rights |= RIGHTS_q;

  const epStr = parts[3] || '-';
  if (epStr !== '-') {
    const epFile = epStr.charCodeAt(0) - 97;
    const epRank = parseInt(epStr[1]) - 1;
    pos.ep = epRank * 16 + epFile;
  }
}

function posPrintBoard(pos) {
  const pieces = '.PNBRQK..pnbrqk';
  const files = 'abcdefgh';

  uciWrite('');
  for (let rank = 7; rank >= 0; rank--) {
    let line = (rank + 1) + '  ';
    for (let file = 0; file < 8; file++) {
      const sq = rank * 16 + file;
      const piece = pos.board[sq];
      line += pieces[piece] + ' ';
    }
    uciWrite(line);
  }
  uciWrite('');
  uciWrite('   a b c d e f g h');
  uciWrite('');

  const wKingSq = pos.kings[WHITE >> 3];
  const bKingSq = pos.kings[BLACK >> 3];
  const wKingCoord = files[wKingSq & 7] + ((wKingSq >> 4) + 1);
  const bKingCoord = files[bKingSq & 7] + ((bKingSq >> 4) + 1);

  let rightsStr = '';
  if (pos.rights & RIGHTS_K) rightsStr += 'K';
  if (pos.rights & RIGHTS_Q) rightsStr += 'Q';
  if (pos.rights & RIGHTS_k) rightsStr += 'k';
  if (pos.rights & RIGHTS_q) rightsStr += 'q';
  if (rightsStr === '') rightsStr = '-';

  uciWrite('kings: white=' + wKingCoord + ' black=' + bKingCoord);
  uciWrite('rights: ' + rightsStr);
  uciWrite('stm: ' + (pos.stm === WHITE ? 'white' : 'black'));
  uciWrite('');
}

const MAX_PLY = 64;
const MAX_MOVES = 256;

class Node {

  constructor() {
    this.pos = null;
    this.moves = new Uint32Array(MAX_MOVES);
    this.ranks = new Uint32Array(MAX_MOVES);
    this.numMoves = 0;
  }
}

const nodes = Array(MAX_PLY);

function nodeInitOnce() {
  for (let i=0; i < MAX_PLY; i++ ) {
    nodes[i] = new Node();
    nodes[i].pos = new Pos();
  }
}

const MOVE_FLAG_CAPTURE    = 0x10000;
const MOVE_FLAG_EPMAKE     = 0x20000;
const MOVE_FLAG_EPCAPTURE  = 0x40000;

const KNIGHT_OFFSETS = [-33, -31, -18, -14, 14, 18, 31, 33];
const BISHOP_OFFSETS = [-17, -15, 15, 17];
const ROOK_OFFSETS   = [-16, -1, 1, 16];
const QUEEN_OFFSETS  = [-17, -16, -15, -1, 1, 15, 16, 17];
const KING_OFFSETS   = [-17, -16, -15, -1, 1, 15, 16, 17];
const PAWN_CAP_WHITE = [15, 17];
const PAWN_CAP_BLACK = [-15, -17];

function genMoves(node) {
  node.numMoves = 0;

  const pos = node.pos;
  const board = pos.board;
  const stm = pos.stm;
  const enemy = stm ^ BLACK;

  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) continue;

    const piece = board[sq];
    if (!piece) continue;
    if ((piece & BLACK) !== stm) continue;

    const type = piece & 7;

    switch (type) {
      case PAWN: {
        const dir = stm === WHITE ? 16 : -16;
        const startRank = stm === WHITE ? 1 : 6;
        const rank = sq >> 4;

        // single push
        const to1 = sq + dir;
        if (!(to1 & 0x88) && !board[to1]) {
          node.moves[node.numMoves++] = to1 | (sq << 8);
          // double push
          if (rank === startRank) {
            const to2 = sq + dir + dir;
            if (!(to2 & 0x88) && !board[to2]) {
              node.moves[node.numMoves++] = to2 | (sq << 8) | MOVE_FLAG_EPMAKE;
            }
          }
        }

        // captures
        const capOffsets = stm === WHITE ? PAWN_CAP_WHITE : PAWN_CAP_BLACK;
        for (const off of capOffsets) {
          const to = sq + off;
          if (to & 0x88) continue;
          const target = board[to];
          if (target && (target & BLACK) === enemy) {
            node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
          }
          else if (to === pos.ep) {
            node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_EPCAPTURE;
          }
        }
        break;
      }

      case KNIGHT: {
        for (const off of KNIGHT_OFFSETS) {
          const to = sq + off;
          if (to & 0x88) continue;
          const target = board[to];
          if (!target) {
            node.moves[node.numMoves++] = to | (sq << 8);
          }
          else if ((target & BLACK) === enemy) {
            node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
          }
        }
        break;
      }

      case BISHOP: {
        for (const off of BISHOP_OFFSETS) {
          let to = sq + off;
          while (!(to & 0x88)) {
            const target = board[to];
            if (!target) {
              node.moves[node.numMoves++] = to | (sq << 8);
            }
            else {
              if ((target & BLACK) === enemy) {
                node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
              }
              break;
            }
            to += off;
          }
        }
        break;
      }

      case ROOK: {
        for (const off of ROOK_OFFSETS) {
          let to = sq + off;
          while (!(to & 0x88)) {
            const target = board[to];
            if (!target) {
              node.moves[node.numMoves++] = to | (sq << 8);
            }
            else {
              if ((target & BLACK) === enemy) {
                node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
              }
              break;
            }
            to += off;
          }
        }
        break;
      }

      case QUEEN: {
        for (const off of QUEEN_OFFSETS) {
          let to = sq + off;
          while (!(to & 0x88)) {
            const target = board[to];
            if (!target) {
              node.moves[node.numMoves++] = to | (sq << 8);
            }
            else {
              if ((target & BLACK) === enemy) {
                node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
              }
              break;
            }
            to += off;
          }
        }
        break;
      }

      case KING: {
        for (const off of KING_OFFSETS) {
          const to = sq + off;
          if (to & 0x88) continue;
          const target = board[to];
          if (!target) {
            node.moves[node.numMoves++] = to | (sq << 8);
          }
          else if ((target & BLACK) === enemy && (target & 7) !== KING) {
            node.moves[node.numMoves++] = to | (sq << 8) | MOVE_FLAG_CAPTURE;
          }
        }
        break;
      }
    }
  }

  // castling
  if (pos.rights) {
    if (stm === WHITE) {
      if ((pos.rights & RIGHTS_K) && !board[0x05] && !board[0x06] &&
          !isAttacked(pos, 0x04, BLACK) && !isAttacked(pos, 0x05, BLACK) && !isAttacked(pos, 0x06, BLACK)) {
        node.moves[node.numMoves++] = 0x06 | (0x04 << 8);
      }
      if ((pos.rights & RIGHTS_Q) && !board[0x03] && !board[0x02] && !board[0x01] &&
          !isAttacked(pos, 0x04, BLACK) && !isAttacked(pos, 0x03, BLACK) && !isAttacked(pos, 0x02, BLACK)) {
        node.moves[node.numMoves++] = 0x02 | (0x04 << 8);
      }
    }
    else {
      if ((pos.rights & RIGHTS_k) && !board[0x75] && !board[0x76] &&
          !isAttacked(pos, 0x74, WHITE) && !isAttacked(pos, 0x75, WHITE) && !isAttacked(pos, 0x76, WHITE)) {
        node.moves[node.numMoves++] = 0x76 | (0x74 << 8);
      }
      if ((pos.rights & RIGHTS_q) && !board[0x73] && !board[0x72] && !board[0x71] &&
          !isAttacked(pos, 0x74, WHITE) && !isAttacked(pos, 0x73, WHITE) && !isAttacked(pos, 0x72, WHITE)) {
        node.moves[node.numMoves++] = 0x72 | (0x74 << 8);
      }
    }
  }
}
const RIGHTS_MASK = new Uint8Array(128);
RIGHTS_MASK.fill(0xF);
RIGHTS_MASK[0x00] = 0xF ^ RIGHTS_Q;
RIGHTS_MASK[0x07] = 0xF ^ RIGHTS_K;
RIGHTS_MASK[0x70] = 0xF ^ RIGHTS_q;
RIGHTS_MASK[0x77] = 0xF ^ RIGHTS_k;
RIGHTS_MASK[0x04] = 0xF ^ RIGHTS_K ^ RIGHTS_Q;
RIGHTS_MASK[0x74] = 0xF ^ RIGHTS_k ^ RIGHTS_q;

function makeMove(move, pos) {
  const from = (move >> 8) & 0x7f;
  const to = move & 0x7f;

  pos.board[to] = pos.board[from];
  pos.board[from] = 0;

  const piece = pos.board[to];
  if ((piece & 7) === KING) {
    pos.kings[(piece & BLACK) >> 3] = to;
    // castling - king moved 2 squares
    const delta = to - from;
    if (delta === 2) {  // kingside
      pos.board[to - 1] = pos.board[to + 1];
      pos.board[to + 1] = 0;
    }
    else if (delta === -2) {  // queenside
      pos.board[to + 1] = pos.board[to - 2];
      pos.board[to - 2] = 0;
    }
  }

  // ep capture - remove the captured pawn
  if (move & MOVE_FLAG_EPCAPTURE) {
    const capSq = pos.stm === WHITE ? to - 16 : to + 16;
    pos.board[capSq] = 0;
  }

  // set ep square for double pawn push
  if (move & MOVE_FLAG_EPMAKE) {
    pos.ep = pos.stm === WHITE ? to - 16 : to + 16;
  }
  else {
    pos.ep = 0;
  }

  pos.rights &= RIGHTS_MASK[from] & RIGHTS_MASK[to];

  pos.stm ^= BLACK;
}function isAttacked(pos, sq, byColor) {
  const board = pos.board;

  // pawns
  const pawnDir = byColor === WHITE ? -16 : 16;
  const pawn = PAWN | byColor;
  const p1 = sq + pawnDir - 1;
  if (p1 >= 0 && !(p1 & 0x88) && board[p1] === pawn) return 1;
  const p2 = sq + pawnDir + 1;
  if (p2 >= 0 && !(p2 & 0x88) && board[p2] === pawn) return 1;

  // knights
  const knight = KNIGHT | byColor;
  for (let i = 0; i < 8; i++) {
    const to = sq + KNIGHT_OFFSETS[i];
    if (!(to & 0x88) && board[to] === knight) return 1;
  }

  // king
  const king = KING | byColor;
  for (let i = 0; i < 8; i++) {
    const to = sq + KING_OFFSETS[i];
    if (!(to & 0x88) && board[to] === king) return 1;
  }

  // bishops/queens (diagonals)
  const bishop = BISHOP | byColor;
  const queen = QUEEN | byColor;
  for (let i = 0; i < 4; i++) {
    const off = BISHOP_OFFSETS[i];
    let to = sq + off;
    while (to >= 0 && !(to & 0x88)) {
      const piece = board[to];
      if (piece) {
        if (piece === bishop || piece === queen) return 1;
        break;
      }
      to += off;
    }
  }

  // rooks/queens (straights)
  const rook = ROOK | byColor;
  for (let i = 0; i < 4; i++) {
    const off = ROOK_OFFSETS[i];
    let to = sq + off;
    while (to >= 0 && !(to & 0x88)) {
      const piece = board[to];
      if (piece) {
        if (piece === rook || piece === queen) return 1;
        break;
      }
      to += off;
    }
  }

  return 0;
}
function perft (depth, ply) {

  if (depth === 0)
    return 1;

  const node = nodes[ply];
  const nextNode = nodes[ply+1];
  const pos = node.pos;
  const nextPos = nextNode.pos;

  let tot = 0;

  genMoves(node);

  for (let i=0; i < node.numMoves; i++) {
    const move = node.moves[i];
    posSet(nextPos, pos);
    makeMove(move, nextPos);
    if (isAttacked(nextPos, nextPos.kings[pos.stm >> 3], nextPos.stm))
      continue;
    tot += perft(depth-1, ply+1);
  }

  return tot;

}function execString (cmd) {
  const tokens = cmd.trim().split(/\s+/).filter(t => t.length > 0);
  if (tokens.length > 0) {
    execTokens(tokens);
  }
}

function execTokens(tokens) {
  switch (tokens[0]) {
    case 'uci':
      uciWrite('id name Lozza 9');
      uciWrite('id author Colin Jenkins');
      uciWrite('uciok');
      break;
    case 'position':
    case 'p':
      if (tokens[1] === 'startpos' || tokens[1] === 's') {
        position(nodes[0].pos, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      }
      else if (tokens[1] === 'fen' || tokens[1] === 'f') {
        const fen = tokens.slice(2).join(' ');  // hack re moves
        position(nodes[0].pos, fen);
      }
      break;
    case 'board':
    case 'b':
      posPrintBoard(nodes[0].pos);
      break;
    case 'perft':
    case 'f':  
      const depth = parseInt(tokens[1]);
      const t1 = performance.now();
      const n = perft(depth, 0);
      let elapsed = performance.now() - t1;
      const nps = (n/elapsed * 1000) | 0;
      elapsed |= elapsed;
      uciWrite(`nodes ${n} elapsed ${elapsed} nps ${nps}`);
      break;  
  }
}const uciContext = (function() {
  if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    return 'worker';
  }
  if (typeof Deno !== 'undefined') {
    return 'deno';
  }
  if (typeof Bun !== 'undefined') {
    return 'bun';
  }
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return 'node';
  }
  if (typeof window !== 'undefined') {
    return 'browser';
  }
  return 'unknown';
})();

function uciWrite(data) {
  switch (uciContext) {
    case 'worker':
      self.postMessage(data);
      break;
    case 'node':
    case 'bun':
      process.stdout.write(data + '\n');
      break;
    case 'deno':
      Deno.stdout.writeSync(new TextEncoder().encode(data + '\n'));
      break;
    default:
      console.log(data);
  }
}

function uciQuit() {
  switch (uciContext) {
    case 'worker':
      self.close();
      break;
    case 'node':
    case 'bun':
      process.exit(0);
      break;
    case 'deno':
      Deno.exit(0);
      break;
    default:
      break;
  }
}

function uciRead(callback) {
  switch (uciContext) {
    case 'worker':
      self.onmessage = function(e) {
        callback(e.data);
      };
      break;

    case 'node':
    case 'bun':
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
      });
      rl.on('line', function(line) {
        callback(line);
      });
      break;

    case 'deno':
      (async function() {
        const decoder = new TextDecoder();
        const reader = Deno.stdin.readable.getReader();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            callback(line);
          }
        }
      })();
      break;

    default:
      break;
  }
}

uciRead(function(data) {
  const cmd = data.trim().toLowerCase();
  if (cmd === 'quit' || cmd === 'q') {
    uciQuit();
  }
  else {
    execString(data);
  }
});
nodeInitOnce();


