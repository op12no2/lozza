/*

The net kernel for lozza.js: the accumulator updates and the output layer of the net
as WebAssembly SIMD. lozza.js is complete without it; these functions do exactly the
same arithmetic as the Javascript loops in the "net" fold of lozza.js (netMove,
netCapture, netCastle and netEvalSum), eight 16 bit values at a time, and give
identical results. If you change one, change the other, then check that the bench
node count is the same with WASM = 1 and WASM = 0 at the top of lozza.js.

Build with bin/wasm.sh, or by hand:

  clang --target=wasm32 -O3 -msimd128 -nostdlib -ffreestanding \
        -Wl,--no-entry -Wl,--strip-all -Wl,--export-dynamic -Wl,-z,stack-size=4096 \
        -o lozza.wasm lozza.c

  base64 -w 100 lozza.wasm   and paste the result into getWasm() at the bottom of lozza.js

How it fits together:

  - The arrays below are the net. They live in the WebAssembly memory and lozza.js
    looks at the very same bytes through Int16Arrays (see netArray() in lozza.js), so
    nothing is ever copied between Javascript and here. Javascript loads the weights
    and builds the root accumulators; this file only does the per-node work.

  - All arguments are indexes into those arrays, exactly the numbers the Javascript
    loops use: child/parent/us/them index net_acc and add/sub index the weights.

  - Everything is 16 bit. An accumulator is at most 32 weights plus a bias and the
    trainer clips the weights (see lozza.rs), so it cannot overflow. netLoad() in
    lozza.js checks that and will not use the kernel with a net that breaks it.

*/

#include <stdint.h>
#include <wasm_simd128.h>

#define EXPORT __attribute__((visibility("default")))

// These four must be the same as NET_I_SIZE, NET_H1_SIZE, NET_O_SIZE and MAX_PLY in
// lozza.js, which calls net_sizes_ok() to make sure. bin/wasm.sh reads them from
// lozza.js and passes them in with -D, so the values here only matter when building
// by hand. H1_SIZE must be a multiple of 8.

#ifndef I_SIZE
#define I_SIZE   768   // inputs, 12 pieces x 64 squares
#endif

#ifndef H1_SIZE
#define H1_SIZE  1024  // hidden layer size
#endif

#ifndef O_SIZE
#define O_SIZE   8     // output buckets
#endif

#ifndef MAX_PLY
#define MAX_PLY  128
#endif

EXPORT int16_t net_h1_w[I_SIZE * H1_SIZE];        // input weights seen from our side; feature f is at f * H1_SIZE
EXPORT int16_t net_h2_w[I_SIZE * H1_SIZE];        // the same weights seen from their side
EXPORT int16_t net_h1_b[H1_SIZE];                 // hidden layer biases (only Javascript uses these)
EXPORT int16_t net_o_w[O_SIZE * 2 * H1_SIZE];     // output weights; each bucket is an us half then a them half
EXPORT int16_t net_acc[MAX_PLY * 2 * H1_SIZE];    // each ply has an us accumulator followed by a them accumulator

#define LOAD(p)      wasm_v128_load(p)
#define STORE(p, v)  wasm_v128_store(p, v)
#define ADD(a, b)    wasm_i16x8_add(a, b)
#define SUB(a, b)    wasm_i16x8_sub(a, b)

EXPORT int net_sizes_ok (int i_size, int h1_size, int o_size, int max_ply) {
  return i_size == I_SIZE && h1_size == H1_SIZE && o_size == O_SIZE && max_ply == MAX_PLY;
}

/*

Accumulator updates. The child accumulators are the parent's plus the weights of the
features that appeared (add) minus those that went away (sub). child and parent are
the index of the us accumulator; the them accumulator is the next H1_SIZE values.

*/

// child = parent + add1 - sub1, a quiet move or a promotion that is not a capture

EXPORT void net_move (int child, int parent, int sub1, int add1) {

  const int16_t *q1 = net_acc + parent, *q2 = q1 + H1_SIZE;
  int16_t       *c1 = net_acc + child,  *c2 = c1 + H1_SIZE;

  const int16_t *us_sub1   = net_h1_w + sub1, *us_add1   = net_h1_w + add1;
  const int16_t *them_sub1 = net_h2_w + sub1, *them_add1 = net_h2_w + add1;

  for (int i = 0; i < H1_SIZE; i += 8) {
    STORE(c1 + i, SUB(ADD(LOAD(q1 + i), LOAD(us_add1   + i)), LOAD(us_sub1   + i)));
    STORE(c2 + i, SUB(ADD(LOAD(q2 + i), LOAD(them_add1 + i)), LOAD(them_sub1 + i)));
  }

}

// child = parent + add1 - sub1 - sub2, a capture, an en passant capture or a promotion that is a capture

EXPORT void net_capture (int child, int parent, int sub1, int sub2, int add1) {

  const int16_t *q1 = net_acc + parent, *q2 = q1 + H1_SIZE;
  int16_t       *c1 = net_acc + child,  *c2 = c1 + H1_SIZE;

  const int16_t *us_sub1   = net_h1_w + sub1, *us_sub2   = net_h1_w + sub2, *us_add1   = net_h1_w + add1;
  const int16_t *them_sub1 = net_h2_w + sub1, *them_sub2 = net_h2_w + sub2, *them_add1 = net_h2_w + add1;

  for (int i = 0; i < H1_SIZE; i += 8) {
    STORE(c1 + i, SUB(SUB(ADD(LOAD(q1 + i), LOAD(us_add1   + i)), LOAD(us_sub1   + i)), LOAD(us_sub2   + i)));
    STORE(c2 + i, SUB(SUB(ADD(LOAD(q2 + i), LOAD(them_add1 + i)), LOAD(them_sub1 + i)), LOAD(them_sub2 + i)));
  }

}

// child = parent + add1 - sub1 + add2 - sub2, castling (the king and the rook both move)

EXPORT void net_castle (int child, int parent, int sub1, int add1, int sub2, int add2) {

  const int16_t *q1 = net_acc + parent, *q2 = q1 + H1_SIZE;
  int16_t       *c1 = net_acc + child,  *c2 = c1 + H1_SIZE;

  const int16_t *us_sub1   = net_h1_w + sub1, *us_add1   = net_h1_w + add1;
  const int16_t *us_sub2   = net_h1_w + sub2, *us_add2   = net_h1_w + add2;
  const int16_t *them_sub1 = net_h2_w + sub1, *them_add1 = net_h2_w + add1;
  const int16_t *them_sub2 = net_h2_w + sub2, *them_add2 = net_h2_w + add2;

  for (int i = 0; i < H1_SIZE; i += 8) {
    STORE(c1 + i, SUB(ADD(SUB(ADD(LOAD(q1 + i), LOAD(us_add1   + i)), LOAD(us_sub1   + i)), LOAD(us_add2   + i)), LOAD(us_sub2   + i)));
    STORE(c2 + i, SUB(ADD(SUB(ADD(LOAD(q2 + i), LOAD(them_add1 + i)), LOAD(them_sub1 + i)), LOAD(them_add2 + i)), LOAD(them_sub2 + i)));
  }

}

/*

The output layer. us and them are the indexes of the two accumulators, the side to
move first, and ow is the index in net_o_w of the output weights to use (the start of
a bucket, see netEval() in lozza.js). For each accumulator value x and its output
weight w this adds up

  w * y * y   where   y = clamp(x, 0, QA)   (SCReLU)

and returns the sum; netEval2() in lozza.js scales it to centipawns.

The speed comes from doing it in 16 bits: y is at most 255 and the trainer clips w
to +-127 (1.98 * QB), so y * w is at most 32385 and fits in a signed 16 bit value.
Then one instruction (dot) multiplies those by y again as 32 bit values and adds
neighbouring pairs, giving four 32 bit sums per eight inputs.

The two accumulators are added up separately (sum1 and sum2) and combined at the
end. One running sum would make every add wait for the one before it; with two the
processor can overlap them, which makes this function about 20% faster.

*/

#define QA 255

EXPORT int net_eval (int us, int them, int ow) {

  const int16_t *a1 = net_acc + us;
  const int16_t *a2 = net_acc + them;
  const int16_t *w1 = net_o_w + ow;
  const int16_t *w2 = w1 + H1_SIZE;

  const v128_t zero = wasm_i16x8_splat(0);
  const v128_t qa   = wasm_i16x8_splat(QA);

  v128_t sum1 = wasm_i32x4_splat(0);
  v128_t sum2 = wasm_i32x4_splat(0);

  for (int i = 0; i < H1_SIZE; i += 8) {

    const v128_t y1 = wasm_i16x8_min(wasm_i16x8_max(LOAD(a1 + i), zero), qa);   // clamp(x, 0, QA)
    const v128_t y2 = wasm_i16x8_min(wasm_i16x8_max(LOAD(a2 + i), zero), qa);

    const v128_t yw1 = wasm_i16x8_mul(y1, LOAD(w1 + i));                        // y * w, still 16 bit
    const v128_t yw2 = wasm_i16x8_mul(y2, LOAD(w2 + i));

    sum1 = wasm_i32x4_add(sum1, wasm_i32x4_dot_i16x8(yw1, y1));                 // (y * w) * y as 32 bit, pairs added
    sum2 = wasm_i32x4_add(sum2, wasm_i32x4_dot_i16x8(yw2, y2));

  }

  const v128_t sum = wasm_i32x4_add(sum1, sum2);

  return wasm_i32x4_extract_lane(sum, 0) + wasm_i32x4_extract_lane(sum, 1)
       + wasm_i32x4_extract_lane(sum, 2) + wasm_i32x4_extract_lane(sum, 3);

}
