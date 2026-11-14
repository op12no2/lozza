#!/bin/bash
#
# test.sh [source.js] - checks the C builds here (./lozza, ./lozza.exe and the AVX-512
# pair, see build.sh)
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

# SIMD. The speed of the binaries comes from clang turning the net loops into SIMD on
# 16 bit values: 256 bit, 16 at a time, in the standard build and 512 bit, 32 at a time,
# in the AVX-512 build (see @i16 in lozza2c.js). Nothing in the search shows if a change
# to lozza.js or the converter quietly loses that, the binary is just slower, so check
# for it: the instructions must be there, and they must pay.

# count <register> <mnemonic regex> <objdump args>: how many such instructions use that
# kind of register (ymm is 256 bit, zmm is 512 bit)
count () { local reg=$1 re=$2; shift 2; objdump -d --no-show-raw-insn "$@" | grep -cE "\s($re)\s.*%$reg"; }
# best nps of two benches
nps () { for i in 1 2; do "$1" qb q | tr -d '\r' | grep -o 'nps [0-9]*' | sed 's/nps //'; done | sort -n | tail -1; }

# simd_linux <binary> <register> <bits>: the linux binaries have function names in them

simd_linux () {
  local bin=$1 reg=$2 bits=$3 f add sub clamp mul madd wide

  # the accumulator updates: adds and subtracts of 16 bit values

  for f in netMove netCapture netPromote netEpCapture netCastle; do
    add=$(count $reg "vpaddw" --disassemble=$f $bin); sub=$(count $reg "vpsubw" --disassemble=$f $bin)
    if [ "$add" -ge 1 ] && [ "$sub" -ge 1 ]; then echo "ok   simd $bin $f ($bits bit: $add add, $sub subtract)"
    else echo "FAIL simd $bin $f: no $bits bit vpaddw/vpsubw (clang did not vectorise the loop, or $f is no longer a function in the binary)"; fail=1; fi
  done

  # the output layer: 16 bit clamp and multiply, then multiply-and-add-pairs into 32 bit.
  # vpmulld/vpmovsxwd there mean it has fallen back to 32 bit values, half as many at a time.

  clamp=$(count $reg "vpminsw|vpmaxsw" --disassemble=netEvalSum $bin); mul=$(count $reg "vpmullw" --disassemble=netEvalSum $bin)
  madd=$(count $reg "vpmaddwd" --disassemble=netEvalSum $bin); wide=$(count $reg "vpmulld|vpmovsxwd" --disassemble=netEvalSum $bin)
  if [ "$clamp" -ge 2 ] && [ "$mul" -ge 1 ] && [ "$madd" -ge 1 ] && [ "$wide" = 0 ]; then echo "ok   simd $bin netEvalSum ($bits bit: $clamp clamp, $mul multiply, $madd multiply-add)"
  else echo "FAIL simd $bin netEvalSum: $bits bit clamp $clamp, vpmullw $mul, vpmaddwd $madd, 32 bit fallback (vpmulld/vpmovsxwd) $wide"; fail=1; fi
}

# simd_windows <binary> <register> <bits>: the windows binaries have no function names
# in them, so look at all of it (only vpmulld for the fallback: netLoad uses a vpmovsxwd,
# quite rightly, to widen the output biases)

simd_windows () {
  local bin=$1 reg=$2 bits=$3 acc mul madd wide
  acc=$(count $reg "vpaddw|vpsubw" $bin); mul=$(count $reg "vpmullw" $bin); madd=$(count $reg "vpmaddwd" $bin); wide=$(count $reg "vpmulld" $bin)
  if [ "$acc" -ge 10 ] && [ "$mul" -ge 1 ] && [ "$madd" -ge 1 ] && [ "$wide" = 0 ]; then echo "ok   simd $bin ($bits bit: $acc add/subtract, $mul multiply, $madd multiply-add)"
  else echo "FAIL simd $bin: $bits bit add/subtract $acc, vpmullw $mul, vpmaddwd $madd, 32 bit fallback (vpmulld) $wide"; fail=1; fi
}

simd_linux lozza ymm 256
[ -f lozza.exe ]        && simd_windows lozza.exe ymm 256
[ -f lozza-avx512 ]     && simd_linux lozza-avx512 zmm 512
[ -f lozza-avx512.exe ] && simd_windows lozza-avx512.exe zmm 512

# and it must pay: lozza against lozza_scalar, the same C compiled with SIMD off
# (build.sh). About 9x with a 1536 net; the smaller the net the less there is to gain,
# so the ratios are only insisted on for big nets.

SIMD_MIN=6       # times faster than scalar, for a net of 1024 or more
AVX512_MIN=105   # AVX-512 build, percent of the standard build's speed; about 115 when measured

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

# the AVX-512 binaries: the same search, and faster. They can only be run where the
# processor has AVX-512; elsewhere they say so and stop, which is checked instead.

for bin in lozza-avx512 lozza-avx512.exe; do
  [ -f $bin ] || continue
  if grep -q avx512bw /proc/cpuinfo; then
    A=$(./$bin qb q | tr -d '\r' | grep -o 'nodes [0-9]*'); B=$(./lozza qb q | grep -o 'nodes [0-9]*'); same "$A" "$B" "$bin bench nodes"
    v=$(nps ./$bin); pc=$(( 100 * v / fast ))
    if [ "$h1" -lt 1024 ]; then echo "ok   simd $bin speed ($v nps, ${pc}% of the standard linux build; not judged, net $h1 is small)"
    elif [ $pc -ge $AVX512_MIN ]; then echo "ok   simd $bin speed ($v nps, ${pc}% of the standard linux build)"
    else echo "FAIL simd $bin speed ($v nps, ${pc}% of the standard linux build), expected at least ${AVX512_MIN}%"; fail=1; fi
  else
    A=$(./$bin uci q 2>&1 | tr -d '\r' | grep -c 'does not have AVX-512'); same "$A" "1" "$bin refuses to run without AVX-512"
  fi
done

exit $fail
