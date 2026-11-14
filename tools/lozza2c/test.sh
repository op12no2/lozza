#!/bin/bash
#
# test.sh [source.js] - checks the C build here (./lozza and ./lozza.exe, see build.sh)
# against node running the source it was built from (default ../../lozza.js), and
# checks that the binaries have the SIMD they should have (the simd checks at the end)
#

L=$(realpath "${1:-$(dirname "$0")/../../lozza.js}")
cd "$(dirname "$0")"
fail=0
same () { if [ "$1" = "$2" ]; then echo "ok   $3"; else echo "FAIL $3"; diff <(echo "$1") <(echo "$2") | head -6; fail=1; fi; }
strip () { sed 's/ time [0-9]* nps [0-9]*//' | grep -v '^info tt'; }

A=$(./lozza uci q | grep -c 'id name Lozza'); same "$A" "1" "uci id"
A=$(./lozza qb q | grep -o 'nodes [0-9]*'); B=$(node $L qb q 2>&1 | tr '\r' '\n' | grep -o 'nodes [0-9]*' | tail -1); same "$A" "$B" "bench nodes"
A=$(printf 'uci\nisready\nposition startpos moves e2e4 e7e5\ngo depth 8\n' | ./lozza | grep -E '^(uciok|readyok|bestmove)' | wc -l); same "$A" "3" "pipe uci/isready/go"
A=$(printf 'position startpos\ngo depth 6\n' | ./lozza | grep -c '^bestmove'); same "$A" "1" "eof without quit"
A=$( (echo "go infinite"; sleep 1; echo stop; echo quit) | timeout 10 ./lozza | grep -c '^bestmove'); same "$A" "1" "stop during go infinite"
A=$( (echo "go movetime 1500"; sleep 0.3; echo isready; sleep 2; echo quit) | timeout 10 ./lozza | grep -E '^(readyok|bestmove)' | cut -d' ' -f1 | tr '\n' ' '); same "$A" "readyok bestmove " "isready during search"
# timed with /proc/uptime, which never goes backwards; the wall clock (date) can be stepped under WSL
up () { awk '{ printf "%d", $1 * 1000 }' /proc/uptime; }
s=$(up); ./lozza "position startpos" "go movetime 500" q > /dev/null; e=$(up); ms=$(( e - s )); [ $ms -ge 450 ] && [ $ms -le 900 ] && echo "ok   movetime ($ms ms)" || { echo "FAIL movetime ($ms ms)"; fail=1; }
F="r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"
A=$(./lozza "position fen $F moves e1g1 a6e2" b q | tail -1); B=$(node $L "position fen $F moves e1g1 a6e2" b q | tail -1); same "$A" "$B" "position moves + board"
# a move list longer than 1024 chars (the old string buffer size dropped the last move)
LP="position startpos moves$(for i in $(seq 60); do printf " g1f3 g8f6 f3g1 f6g8"; done) e2e4"
A=$(./lozza "$LP" b q | tail -1); B=$(node $L "$LP" b q | tail -1); same "$A" "$B" "long position (${#LP} chars)"
A=$(./lozza "position startpos" "go depth 10" q | grep -E '^(info depth|bestmove)' | strip); B=$(node $L "position startpos" "go depth 10" q | grep -E '^(info depth|bestmove)' | strip); same "$A" "$B" "info lines depth 10"
A=$(./lozza "setoption name MultiPV value 3" "position fen $F" "go depth 6" q | grep -E 'multipv|bestmove' | strip); B=$(node $L "setoption name MultiPV value 3" "position fen $F" "go depth 6" q | grep -E 'multipv|bestmove' | strip); same "$A" "$B" "multipv"
A=$(./lozza et q | grep -v '^info tt'); B=$(node $L et q | grep -v '^info tt'); same "$A" "$B" "eval tests"
A=$(./lozza "position fen $F" "perft depth 3" q | grep -o 'nodes [0-9]*'); same "$A" "nodes 97862" "perft"
A=$(./lozza "setoption name Hash value 64" "position startpos" "go depth 8" q | grep -c bestmove); same "$A" "1" "hash resize"
A=$(./lozza n q | grep -c 'i_size'); same "$A" "1" "net cmd"
A=$(./lozza "position startpos" m q | grep -c '^[a-h][1-8][a-h][1-8]'); same "$A" "20" "moves cmd"
A=$(./lozza "pt n 12" q | tail -1 | grep -o 'errors [0-9]*'); same "$A" "errors 0" "perft tests (12)"
if [ -f lozza.exe ]; then
  A2=$(./lozza.exe qb q | tr -d '\r' | grep -o 'nodes [0-9]*'); B2=$(./lozza qb q | grep -o 'nodes [0-9]*'); same "$A2" "$B2" "windows bench nodes"
  A=$( (echo "go infinite"; sleep 1; echo stop; echo quit) | timeout 20 ./lozza.exe | tr -d '\r' | grep -c '^bestmove'); same "$A" "1" "windows stop during search"
  A=$(printf 'position startpos moves e2e4\r\ngo depth 5\r\n' | ./lozza.exe | tr -d '\r' | grep -c '^bestmove'); same "$A" "1" "windows crlf input"
fi

# SIMD. The speed of the binaries comes from clang turning the net loops into 256 bit
# SIMD on 16 bit values, 16 at a time (see @i16 in lozza2c.js). Nothing in the search
# shows if a change to lozza.js or the converter quietly loses that, the binary is just
# slower, so check for it: the instructions must be there, and they must pay.

# count <mnemonic regex> <objdump args>: how many such instructions use 256 bit (ymm) registers
count () { local re=$1; shift; objdump -d --no-show-raw-insn "$@" | grep -cE "\s($re)\s.*%ymm"; }
# best nps of two benches
nps () { for i in 1 2; do "$1" qb q | tr -d '\r' | grep -o 'nps [0-9]*' | sed 's/nps //'; done | sort -n | tail -1; }

# the accumulator updates: adds and subtracts of 16 bit values, 16 per instruction

for f in netMove netCapture netPromote netEpCapture netCastle; do
  add=$(count "vpaddw" --disassemble=$f lozza); sub=$(count "vpsubw" --disassemble=$f lozza)
  if [ "$add" -ge 1 ] && [ "$sub" -ge 1 ]; then echo "ok   simd $f (256 bit: $add add, $sub subtract)"
  else echo "FAIL simd $f: no 256 bit vpaddw/vpsubw (clang did not vectorise the loop, or $f is no longer a function in the binary)"; fail=1; fi
done

# the output layer: 16 bit clamp and multiply, then multiply-and-add-pairs into 32 bit.
# vpmulld/vpmovsxwd there mean it has fallen back to 32 bit values, 8 at a time.

clamp=$(count "vpminsw|vpmaxsw" --disassemble=netEvalSum lozza); mul=$(count "vpmullw" --disassemble=netEvalSum lozza)
madd=$(count "vpmaddwd" --disassemble=netEvalSum lozza); wide=$(count "vpmulld|vpmovsxwd" --disassemble=netEvalSum lozza)
if [ "$clamp" -ge 2 ] && [ "$mul" -ge 1 ] && [ "$madd" -ge 1 ] && [ "$wide" = 0 ]; then echo "ok   simd netEvalSum (256 bit: $clamp clamp, $mul multiply, $madd multiply-add)"
else echo "FAIL simd netEvalSum: 256 bit clamp $clamp, vpmullw $mul, vpmaddwd $madd, 32 bit fallback (vpmulld/vpmovsxwd) $wide"; fail=1; fi

# the windows binary has no function names in it, so look at all of it (only vpmulld
# for the fallback: netLoad uses a vpmovsxwd, quite rightly, to widen the output biases)

if [ -f lozza.exe ]; then
  acc=$(count "vpaddw|vpsubw" lozza.exe); mul=$(count "vpmullw" lozza.exe); madd=$(count "vpmaddwd" lozza.exe); wide=$(count "vpmulld" lozza.exe)
  if [ "$acc" -ge 10 ] && [ "$mul" -ge 1 ] && [ "$madd" -ge 1 ] && [ "$wide" = 0 ]; then echo "ok   simd windows (256 bit: $acc add/subtract, $mul multiply, $madd multiply-add)"
  else echo "FAIL simd windows: 256 bit add/subtract $acc, vpmullw $mul, vpmaddwd $madd, 32 bit fallback (vpmulld) $wide"; fail=1; fi
fi

# and it must pay: lozza against lozza_scalar, the same C compiled with SIMD off
# (build.sh). About 9x with a 1536 net; the smaller the net the less there is to gain,
# so the ratio is only insisted on for big nets.

SIMD_MIN=6   # times faster than scalar, for a net of 1024 or more
h1=$(./lozza n q | sed -n 's/^i_size, h1_size, o_size [0-9]* \([0-9]*\) .*/\1/p')
fast=$(nps ./lozza)
if [ -x lozza_scalar ]; then
  slow=$(./lozza_scalar qb q | grep -o 'nps [0-9]*' | sed 's/nps //')
  x10=$(( 10 * fast / slow )); x="$(( x10 / 10 )).$(( x10 % 10 ))"
  if [ "$h1" -lt 1024 ]; then echo "ok   simd speedup ${x}x ($fast nps against $slow scalar; not judged, net $h1 is small)"
  elif [ $x10 -ge $(( 10 * SIMD_MIN )) ]; then echo "ok   simd speedup ${x}x ($fast nps against $slow scalar)"
  else echo "FAIL simd speedup ${x}x ($fast nps against $slow scalar), expected at least ${SIMD_MIN}x"; fail=1; fi
else
  echo "FAIL simd speedup: no lozza_scalar, run build.sh"; fail=1
fi
if [ -f lozza.exe ]; then
  win=$(nps ./lozza.exe); pc=$(( 100 * win / fast ))
  if [ $pc -ge 80 ]; then echo "ok   simd windows speed ($win nps, ${pc}% of linux)"
  else echo "FAIL simd windows speed ($win nps, ${pc}% of linux)"; fail=1; fi
fi

exit $fail
