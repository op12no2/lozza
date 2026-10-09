#!/usr/bin/env python3

# strict viriformat checker: replays every game with python-chess, run from anywhere:
#   bin/vfcheck.py <file.vf | directory> ...
# needs python-chess (pip install chess). about 100k positions/s, so 10M takes a minute or two.
#
# checks every move is legal with the right type flag (ep, castle, promotion), the start board is
# valid with castling rights that match its unmoved rooks and a fullmove of at least 1 (viriformat
# derives the ply from it), and the result agrees with how the game ended. exits 1 on any error.

import sys, os, glob, mmap, struct
import chess

PIECES = [chess.PAWN, chess.KNIGHT, chess.BISHOP, chess.ROOK, chess.QUEEN, chess.KING, chess.ROOK]  # 6 = unmoved rook
PROMOS = [chess.KNIGHT, chess.BISHOP, chess.ROOK, chess.QUEEN]
CASTLE = {chess.H1: chess.G1, chess.A1: chess.C1, chess.H8: chess.G8, chess.A8: chess.C8}  # rook square -> king's

MAX_MESSAGES = 20  # per file

def unpack(b, off):
    # a PackedBoard: occupancy, a nibble per piece, stm|ep, halfmove, fullmove, eval, wdl, extra
    occ = struct.unpack_from('<Q', b, off)[0]
    board = chess.Board(None)
    idx = 0
    rights = 0
    for sq in range(64):
        if occ >> sq & 1:
            nib = (b[off + 8 + idx // 2] >> (4 * (idx & 1))) & 15
            idx += 1
            t = nib & 7
            if t > 6:
                return None, 0, f'bad piece code {t}'
            board.set_piece_at(sq, chess.Piece(PIECES[t], chess.BLACK if nib >> 3 else chess.WHITE))
            if t == 6:
                rights |= chess.BB_SQUARES[sq]
    board.castling_rights = rights
    stm_ep = b[off + 24]
    board.turn = chess.BLACK if stm_ep >> 7 else chess.WHITE
    ep = stm_ep & 127
    board.ep_square = None if ep == 64 else ep
    board.halfmove_clock = b[off + 25]
    board.fullmove_number = struct.unpack_from('<H', b, off + 26)[0]
    return board, b[off + 30], None

def check(path):

    errors = 0
    messages = 0

    def error(msg):
        nonlocal errors, messages
        errors += 1
        if messages < MAX_MESSAGES:
            print(f'  {msg}')
            messages += 1
            if messages == MAX_MESSAGES:
                print('  (further errors not shown)')

    size = os.path.getsize(path)
    if size == 0:
        print(f'{path}: empty')
        return 0

    with open(path, 'rb') as fh:
        b = mmap.mmap(fh.fileno(), 0, access=mmap.ACCESS_READ)

    off = 0
    games = positions = 0
    results = [0, 0, 0]
    endings = {}
    flips = pairs = agree = decisive = 0
    next_report = 1_000_000

    while off < size:

        g = games

        if off + 32 > size:
            error(f'game {g}: truncated board at byte {off}')
            break

        board, wdl, bad = unpack(b, off)
        off += 32

        if bad:
            error(f'game {g}: {bad}')
            break
        if board.status() != chess.STATUS_VALID:
            error(f'game {g}: invalid start board {board.fen()}')
        if board.castling_rights != board.clean_castling_rights():
            error(f'game {g}: unmoved rooks are not castling rights {board.fen()}')
        if board.fullmove_number < 1:
            error(f'game {g}: fullmove {board.fullmove_number}')
        if wdl > 2:
            error(f'game {g}: bad wdl {wdl}')
            wdl = 1

        scores = []
        ended = False
        broken = False  # after a bad move the game can't be replayed, so skip to its end

        while off + 4 <= size:
            mv, sc = struct.unpack_from('<Hh', b, off)
            off += 4
            if mv == 0 and sc == 0:
                ended = True
                break
            if broken:
                continue
            fr, to, promo, typ = mv & 63, (mv >> 6) & 63, (mv >> 12) & 3, mv >> 14
            if typ == 2:
                if to not in CASTLE:
                    error(f'game {g}: castle to {chess.square_name(to)}')
                    broken = True
                    continue
                to = CASTLE[to]
            m = chess.Move(fr, to, promotion=PROMOS[promo] if typ == 3 else None)
            if not board.is_legal(m):
                error(f'game {g} move {len(scores)}: illegal {m.uci()} (type {typ}) in {board.fen()}')
                broken = True
                continue
            if (typ == 1) != board.is_en_passant(m) or (typ == 2) != board.is_castling(m):
                error(f'game {g}: {m.uci()} has type {typ} in {board.fen()}')
            if typ != 3 and promo != 0:
                error(f'game {g}: promotion bits on {m.uci()}')
            scores.append(sc)
            board.push(m)

        if not ended:
            error(f'game {g}: truncated, the file ends mid-game')
            break

        games += 1

        if broken:
            continue
        positions += len(scores)
        results[wdl] += 1

        # the final position should explain the result: mate for a decisive game, else a draw

        if board.is_checkmate():
            kind = 'mate'
            if wdl != (0 if board.turn == chess.WHITE else 2):
                error(f'game {g}: checkmate but wdl {wdl}')
        else:
            if board.is_stalemate():
                kind = 'stalemate'
            elif board.is_insufficient_material():
                kind = 'insufficient'
            elif board.is_fifty_moves():
                kind = 'fifty'
            elif board.is_repetition(3):
                kind = '3-fold'
            elif board.is_repetition(2):
                kind = '2-fold'
            else:
                kind = 'adjudicated'
            if wdl != 1:
                error(f'game {g}: ended {kind} but wdl {wdl} {board.fen()}')
        endings[kind] = endings.get(kind, 0) + 1

        # scores are white relative, so consecutive big ones rarely change sign, and a decisive
        # game's last scores favour the winner

        for x, y in zip(scores, scores[1:]):
            if abs(x) > 50 and abs(y) > 50:
                pairs += 1
                flips += (x > 0) != (y > 0)
        if wdl != 1 and scores:
            decisive += 1
            agree += (sum(scores[-6:]) > 0) == (wdl == 2)

        if positions >= next_report:
            print(f'  {path}: {positions:,} positions...', file=sys.stderr)
            next_report += 1_000_000

    b.close()

    print(f'{path}: {games:,} games, {positions:,} positions, {errors} errors')
    print(f'  results (black/draw/white) {results[0]:,}/{results[1]:,}/{results[2]:,}, endings ' +
          ', '.join(f'{k} {v:,}' for k, v in sorted(endings.items(), key=lambda kv: -kv[1])))
    print(f'  score sign flips {flips:,}/{pairs:,}, decisive games whose last scores favour the winner {agree:,}/{decisive:,}')

    return errors

def main():

    if len(sys.argv) < 2:
        print('usage: bin/vfcheck.py <file.vf | directory> ...')
        sys.exit(1)

    paths = []
    for a in sys.argv[1:]:
        if os.path.isdir(a):
            paths += sorted(glob.glob(os.path.join(a, '*.vf')))
        else:
            paths.append(a)

    errors = sum(check(p) for p in paths)

    if len(paths) > 1:
        print(f'{len(paths)} files, {errors} errors')

    sys.exit(1 if errors else 0)

main()
