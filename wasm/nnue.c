// lozza's nnue kernels in wasm simd, built by wasm/build.sh into the base64 in netWasm() at the end of
// lozza.js. the accumulators and weights live in memory lozza.js owns and passes in; pointers are byte
// offsets into it. results are bit identical to lozza.js's plain js eval, which is the fallback, while the
// accumulators fit in int16 (the js ones are int32); the output sum is int32 that wraps, so the order does
// not matter.
//
// n is the hidden size, a multiple of 8. act is 1 for clipped squared relu (screlu), 0 for squared relu.
// screlu uses the usual trick, (v * w) * v with v * w in int16, exact while |w| <= 128.

#include <wasm_simd128.h>

typedef short i16;

#define EXPORT(name) __attribute__((export_name(name)))

static inline v128_t ld(const i16 *p) { return wasm_v128_load(p); }

// v's contribution to the output sum, activated
static inline v128_t outTerm(v128_t v, v128_t w, int act, v128_t qa) {
  const v128_t zero = wasm_i16x8_splat(0);
  v = wasm_i16x8_max(v, zero);
  if (act) {
    v = wasm_i16x8_min(v, qa);
    return wasm_i32x4_dot_i16x8(wasm_i16x8_mul(v, w), v);
  }
  const v128_t lo = wasm_i32x4_mul(wasm_i32x4_extmul_low_i16x8(v, v), wasm_i32x4_extend_low_i16x8(w));
  const v128_t hi = wasm_i32x4_mul(wasm_i32x4_extmul_high_i16x8(v, v), wasm_i32x4_extend_high_i16x8(w));
  return wasm_i32x4_add(lo, hi);
}

static inline int hsum(v128_t s) {
  return wasm_i32x4_extract_lane(s, 0) + wasm_i32x4_extract_lane(s, 1)
       + wasm_i32x4_extract_lane(s, 2) + wasm_i32x4_extract_lane(s, 3);
}

// the output layer: white's accumulator with its weights plus black's with its
EXPORT("out")
int out(const i16 *w, const i16 *b, const i16 *ow, const i16 *ob, int n, int act, int qa) {
  const v128_t q = wasm_i16x8_splat(qa);
  v128_t s = wasm_i32x4_splat(0);
  for (int i = 0; i < n; i += 8) {
    s = wasm_i32x4_add(s, outTerm(ld(w + i), ld(ow + i), act, q));
    s = wasm_i32x4_add(s, outTerm(ld(b + i), ld(ob + i), act, q));
  }
  return hsum(s);
}

// dst = src + a1 + a2 - s1 - s2 for each perspective; a missing feature points at the zero row
EXPORT("apply")
void apply(i16 *dw, i16 *db, const i16 *sw, const i16 *sb,
           const i16 *aw1, const i16 *aw2, const i16 *rw1, const i16 *rw2,
           const i16 *ab1, const i16 *ab2, const i16 *rb1, const i16 *rb2, int n) {
  for (int i = 0; i < n; i += 8) {
    v128_t x = wasm_i16x8_add(ld(sw + i), wasm_i16x8_add(ld(aw1 + i), ld(aw2 + i)));
    wasm_v128_store(dw + i, wasm_i16x8_sub(x, wasm_i16x8_add(ld(rw1 + i), ld(rw2 + i))));
    v128_t y = wasm_i16x8_add(ld(sb + i), wasm_i16x8_add(ld(ab1 + i), ld(ab2 + i)));
    wasm_v128_store(db + i, wasm_i16x8_sub(y, wasm_i16x8_add(ld(rb1 + i), ld(rb2 + i))));
  }
}

// a quiet move's update fused with the output layer
EXPORT("quiet")
int quiet(i16 *dw, i16 *db, const i16 *sw, const i16 *sb,
          const i16 *aw, const i16 *rw, const i16 *ab, const i16 *rb,
          const i16 *ow, const i16 *ob, int n, int act, int qa) {
  const v128_t q = wasm_i16x8_splat(qa);
  v128_t s = wasm_i32x4_splat(0);
  for (int i = 0; i < n; i += 8) {
    const v128_t x = wasm_i16x8_sub(wasm_i16x8_add(ld(sw + i), ld(aw + i)), ld(rw + i));
    const v128_t y = wasm_i16x8_sub(wasm_i16x8_add(ld(sb + i), ld(ab + i)), ld(rb + i));
    wasm_v128_store(dw + i, x);
    wasm_v128_store(db + i, y);
    s = wasm_i32x4_add(s, outTerm(x, ld(ow + i), act, q));
    s = wasm_i32x4_add(s, outTerm(y, ld(ob + i), act, q));
  }
  return hsum(s);
}

// a capture's update, one more feature removed, fused with the output layer
EXPORT("capture")
int capture(i16 *dw, i16 *db, const i16 *sw, const i16 *sb,
            const i16 *aw, const i16 *rw1, const i16 *rw2, const i16 *ab, const i16 *rb1, const i16 *rb2,
            const i16 *ow, const i16 *ob, int n, int act, int qa) {
  const v128_t q = wasm_i16x8_splat(qa);
  v128_t s = wasm_i32x4_splat(0);
  for (int i = 0; i < n; i += 8) {
    const v128_t x = wasm_i16x8_sub(wasm_i16x8_add(ld(sw + i), ld(aw + i)), wasm_i16x8_add(ld(rw1 + i), ld(rw2 + i)));
    const v128_t y = wasm_i16x8_sub(wasm_i16x8_add(ld(sb + i), ld(ab + i)), wasm_i16x8_add(ld(rb1 + i), ld(rb2 + i)));
    wasm_v128_store(dw + i, x);
    wasm_v128_store(db + i, y);
    s = wasm_i32x4_add(s, outTerm(x, ld(ow + i), act, q));
    s = wasm_i32x4_add(s, outTerm(y, ld(ob + i), act, q));
  }
  return hsum(s);
}

// an accumulator from scratch: the bias plus each of count rows, whose addresses are at rows
EXPORT("refresh")
void refresh(i16 *dst, const i16 *bias, const int *rows, int count, int n) {
  for (int i = 0; i < n; i += 8) {
    v128_t x = ld(bias + i);
    for (int r = 0; r < count; r++)
      x = wasm_i16x8_add(x, ld((const i16 *)rows[r] + i));
    wasm_v128_store(dst + i, x);
  }
}
