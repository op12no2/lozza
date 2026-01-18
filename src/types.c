#define VERSION "11"
#define BUILD "1"

/*{{{  includes*/

#define _POSIX_C_SOURCE 200809L

#include <stdalign.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include <inttypes.h> // PRIu64 PRId64 PRIx64
#include <ctype.h>
#include <time.h>
#include <sys/time.h>
#include <assert.h>
#include <unistd.h>
#include <libgen.h>
#include <pthread.h>
#include <stdatomic.h>
#include <stdarg.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#include "../nets/weights.h"

/*}}}*/
/*{{{  macros*/

#define max(a,b) (( (a) > (b) ) ? (a) : (b))
#define min(a,b) (( (a) < (b) ) ? (a) : (b))

#define IS_ALIGNED(p, a) ((((uintptr_t)(p)) & ((a) - 1)) == 0)
#define ASSERT_ALIGNED64(p) assert(IS_ALIGNED((p), 64))

#if defined(__STDC_VERSION__) && __STDC_VERSION__ >= 201112L
  #include <stdalign.h>
  #define ALIGN64 alignas(64)
#elif defined(_MSC_VER)
  #define ALIGN64 __declspec(align(64))
#else
  #define ALIGN64 __attribute__((aligned(64)))
#endif

#if defined(_MSC_VER) && !defined(__clang__)
  #define RESTRICT __restrict
#else
  #define RESTRICT restrict
#endif

#define move_t uint16_t

/*}}}*/
/*{{{  constants*/

#define MAX_PLY 64
#define SAFE_PLY (MAX_PLY - 2)
#define MAX_MOVES 256

#define INF  30000
#define MATE 29000
#define MATE_LIMIT 28000

#define MAGIC_MAX_SLOTS 4096

#define NET_H1_SIZE 384
#define NET_I_SIZE 768
#define NET_QA 255
#define NET_QB 64
#define NET_QAB (NET_QA * NET_QB)
#define NET_SCALE 400

#define UCI_LINE_LENGTH 8192
#define UCI_TOKENS      1024

#define WHITE_RIGHTS_KING  1
#define WHITE_RIGHTS_QUEEN 2
#define BLACK_RIGHTS_KING  4
#define BLACK_RIGHTS_QUEEN 8
#define ALL_RIGHTS         15

#define EMPTY 255

#define RANK_1 0x00000000000000FFULL
#define RANK_2 0x000000000000FF00ULL
#define RANK_3 0x0000000000FF0000ULL
#define RANK_6 0x0000FF0000000000ULL
#define RANK_7 0x00FF000000000000ULL
#define RANK_8 0xFF00000000000000ULL
#define RANK_PROMO (RANK_1 | RANK_8)

#define NOT_A_FILE 0xfefefefefefefefeULL
#define NOT_H_FILE 0x7f7f7f7f7f7f7f7fULL

enum {WHITE, BLACK};
enum {PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING};
enum {WPAWN, WKNIGHT, WBISHOP, WROOK, WQUEEN, WKING, BPAWN, BKNIGHT, BBISHOP, BROOK, BQUEEN, BKING};

#define MT_NON_PAWN_PUSH (0 << 12)
#define MT_PAWN_PUSH (1 << 12)
#define MT_CASTLE (2 << 12)
#define MT_EP_PUSH (3 << 12)
#define MT_PROMO_PUSH_N (4 << 12)
#define MT_PROMO_PUSH_B (5 << 12)
#define MT_PROMO_PUSH_R (6 << 12)
#define MT_PROMO_PUSH_Q (7 << 12)
#define MT_CAPTURE (8 << 12)
#define MT_EP_CAPTURE (9 << 12)
#define MT_PAWN_CAPTURE (10 << 12)
#define MT_SPARE (11 << 12)
#define MT_PROMO_CAPTURE_N (12 << 12)
#define MT_PROMO_CAPTURE_B (13 << 12)
#define MT_PROMO_CAPTURE_R (14 << 12)
#define MT_PROMO_CAPTURE_Q (15 << 12)

enum {
  A1, B1, C1, D1, E1, F1, G1, H1,
  A2, B2, C2, D2, E2, F2, G2, H2,
  A3, B3, C3, D3, E3, F3, G3, H3,
  A4, B4, C4, D4, E4, F4, G4, H4,
  A5, B5, C5, D5, E5, F5, G5, H5,
  A6, B6, C6, D6, E6, F6, G6, H6,
  A7, B7, C7, D7, E7, F7, G7, H7,
  A8, B8, C8, D8, E8, F8, G8, H8
};

#define MAX_HISTORY 16384

#define TT_EXACT 1
#define TT_ALPHA 2
#define TT_BETA 4
#define TT_DEFAULT 16

/*}}}*/
/*{{{  structs*/

/*{{{  Position*/

typedef struct {

  uint64_t all[12];
  uint64_t colour[2];
  uint64_t occupied;

  uint8_t board[64];

  uint8_t stm;
  uint8_t rights;
  uint8_t ep;
  uint8_t hmc;

  uint64_t hash;

  uint8_t _pad[56];

} Position;

/*}}}*/
/*{{{  Node*/

typedef struct {

  Position pos;

  ALIGN64 int32_t acc1[NET_H1_SIZE];  // us acc
  ALIGN64 int32_t acc2[NET_H1_SIZE];  // them acc
  ALIGN64 move_t moves[MAX_MOVES];
  ALIGN64 int16_t ranks[MAX_MOVES];
  ALIGN64 move_t pv[MAX_PLY];

  uint8_t pv_len;
  uint8_t num_moves;
  uint8_t next_move;
  move_t tt_move;
  move_t killer1;
  move_t killer2;
  int16_t ev;
  uint8_t in_check;
  uint8_t stage;

} Node;

/*}}}*/
/*{{{  Attack*/

typedef struct {

  int bits;
  int count;
  int shift;

  uint64_t mask;
  uint64_t magic;

  uint64_t *RESTRICT attacks;

  uint8_t pad[24];

} Attack;

/*}}}*/
/*{{{  TimeControl*/

typedef struct {

  uint64_t start_time;
  uint64_t finish_time;
  int max_depth;
  uint64_t max_nodes;
  _Atomic uint8_t finished;
  uint64_t nodes;
  move_t bm;
  int bs;

} TimeControl;

/*}}}*/
/*{{{  Perft*/

typedef struct {

  const char *fen;
  const char *stm;
  const char *rights;
  const char *ep;
  int depth;
  uint64_t expected;
  const char *label;

} Perft;

/*}}}*/
/*{{{  Bench*/

typedef struct {

  const char *fen;
  const char *stm;
  const char *rights;
  const char *ep;

} Bench;

/*}}}*/
/*{{{  Mover*/

typedef void (*Mover)(Position *const pos, const move_t move);

/*}}}*/
/*{{{  Lazy*/

typedef struct {

  void (*post_func)(Position *const pos);
  void (*net_func)(Node *const node);
  int arg0;
  int arg1;
  int arg2;
  int arg3;
  int arg4;
  int arg5;

} Lazy;

/*}}}*/
/*{{{  TT*/

typedef struct {

  uint64_t hash;
  move_t move;
  uint8_t flags;
  uint8_t depth;
  int16_t score;
  int16_t ev;

} TT;

/*}}}*/
/*{{{  HashHistory*/

typedef struct {

  uint64_t hash[1024];
  int num_uci_moves;

} HashHistory;

/*}}}*/

/*}}}*/
/*{{{  data*/

static Mover move_funcs[16];

static uint64_t rand64_seed = 0xDEADBEEFCAFEBABEULL;

static ALIGN64 uint64_t raw_attacks[107648];
static ALIGN64 uint64_t pawn_attacks[2][64];
static ALIGN64 uint64_t knight_attacks[64];
static ALIGN64 uint64_t king_attacks[64];
static ALIGN64 uint64_t all_attacks[64];
static ALIGN64 uint64_t all_attacks_inc_edge[64];

static ALIGN64 Attack bishop_attacks[64];
static ALIGN64 Attack rook_attacks[64];

static ALIGN64 Node ss[MAX_PLY];

static TimeControl tc;
static Lazy lazy;

static ALIGN64 HashHistory hh;

static ALIGN64 TT *tt    = NULL;
static size_t tt_entries = 0;
static size_t tt_mask    = 0;

static bool uci_quiet = false;

static const uint8_t lut_see[16]     = {0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0};
static const uint8_t lut_prune[16]   = {1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
static const uint8_t lut_history[16] = {1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1};
static const uint8_t lut_killer[16]  = {1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0};
static const uint8_t lut_quiet[16]   = {1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0};
static const uint8_t lut_noisy[16]   = {0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1};

static ALIGN64 uint64_t zob_pieces[12 * 64];
static ALIGN64 uint64_t zob_stm;
static ALIGN64 uint64_t zob_rights[16];
static ALIGN64 uint64_t zob_ep[64];

static ALIGN64 int32_t net_h1_w[NET_I_SIZE * NET_H1_SIZE];
static ALIGN64 int32_t net_h2_w[NET_I_SIZE * NET_H1_SIZE];  // flipped
static ALIGN64 int32_t net_h1_b[NET_H1_SIZE];
static ALIGN64 int32_t net_o_w [NET_H1_SIZE * 2];
static ALIGN64 int32_t net_o_b;

static const int see_values[12] = {100, 325, 325, 500, 1000, 0, 100, 325, 325, 500, 1000, 0};
static const int orth_offset[2] = {8, -8};
static const int rook_to[64]    = {[G1] = F1, [C1] = D1, [G8] = F8, [C8] = D8};
static const int rook_from[64]  = {[G1] = H1, [C1] = A1, [G8] = H8, [C8] = A8};

static int rights_masks[64];

static ALIGN64 int16_t piece_to_history[12][64];

static ALIGN64 uint64_t rank_mask[64];
static ALIGN64 uint64_t file_mask[64];
static ALIGN64 uint64_t diag_mask[64];
static ALIGN64 uint64_t anti_mask[64];

/*{{{  perft data*/

static const Perft perft_data[] = {

  {"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",             "w", "KQkq", "-",  0, 1,         "cpw-pos1-0"},
  {"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",             "w", "KQkq", "-",  1, 20,        "cpw-pos1-1"},
  {"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",             "w", "KQkq", "-",  2, 400,       "cpw-pos1-2"},
  {"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",             "w", "KQkq", "-",  3, 8902,      "cpw-pos1-3"},
  {"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",             "w", "KQkq", "-",  4, 197281,    "cpw-pos1-4"},
  {"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",             "w", "KQkq", "-",  5, 4865609,   "cpw-pos1-5"},
  {"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",             "w", "KQkq", "-",  6, 119060324, "cpw-pos1-6"},
  {"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",             "w", "KQkq", "-",  7, 3195901860,"cpw-pos1-6"},
  {"4k3/8/8/8/8/8/R7/R3K2R",                                  "w", "Q",    "-",  3, 4729,      "castling-2"},
  {"4k3/8/8/8/8/8/R7/R3K2R",                                  "w", "K",    "-",  3, 4686,      "castling-3"},
  {"4k3/8/8/8/8/8/R7/R3K2R",                                  "w", "-",    "-",  3, 4522,      "castling-4"},
  {"r3k2r/r7/8/8/8/8/8/4K3",                                  "b", "kq",   "-",  3, 4893,      "castling-5"},
  {"r3k2r/r7/8/8/8/8/8/4K3",                                  "b", "q",    "-",  3, 4729,      "castling-6"},
  {"r3k2r/r7/8/8/8/8/8/4K3",                                  "b", "k",    "-",  3, 4686,      "castling-7"},
  {"r3k2r/r7/8/8/8/8/8/4K3",                                  "b", "-",    "-",  3, 4522,      "castling-8"},
  {"rnbqkb1r/pp1p1ppp/2p5/4P3/2B5/8/PPP1NnPP/RNBQK2R",        "w", "KQkq", "-",  1, 42,        "cpw-pos5-1"},
  {"rnbqkb1r/pp1p1ppp/2p5/4P3/2B5/8/PPP1NnPP/RNBQK2R",        "w", "KQkq", "-",  2, 1352,      "cpw-pos5-2"},
  {"rnbqkb1r/pp1p1ppp/2p5/4P3/2B5/8/PPP1NnPP/RNBQK2R",        "w", "KQkq", "-",  3, 53392,     "cpw-pos5-3"},
  {"r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R", "w", "KQkq", "-",  1, 48,        "cpw-pos2-1"},
  {"r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R", "w", "KQkq", "-",  2, 2039,      "cpw-pos2-2"},
  {"r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R", "w", "KQkq", "-",  3, 97862,     "cpw-pos2-3"},
  {"8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8",                         "w", "-",    "-",  5, 674624,    "cpw-pos3-5"},
  {"n1n5/PPPk4/8/8/8/8/4Kppp/5N1N",                           "b", "-",    "-",  1, 24,        "prom-1"},
  {"8/5bk1/8/2Pp4/8/1K6/8/8",                                 "w", "-",    "d6", 6, 824064,    "ccc-1"},
  {"8/8/1k6/8/2pP4/8/5BK1/8",                                 "b", "-",    "d3", 6, 824064,    "ccc-2"},
  {"8/8/1k6/2b5/2pP4/8/5K2/8",                                "b", "-",    "d3", 6, 1440467,   "ccc-3"},
  {"8/5k2/8/2Pp4/2B5/1K6/8/8",                                "w", "-",    "d6", 6, 1440467,   "ccc-4"},
  {"5k2/8/8/8/8/8/8/4K2R",                                    "w", "K",    "-",  6, 661072,    "ccc-5"},
  {"4k2r/8/8/8/8/8/8/5K2",                                    "b", "k",    "-",  6, 661072,    "ccc-6"},
  {"3k4/8/8/8/8/8/8/R3K3",                                    "w", "Q",    "-",  6, 803711,    "ccc-7"},
  {"r3k3/8/8/8/8/8/8/3K4",                                    "b", "q",    "-",  6, 803711,    "ccc-8"},
  {"r3k2r/1b4bq/8/8/8/8/7B/R3K2R",                            "w", "KQkq", "-",  4, 1274206,   "ccc-9"},
  {"r3k2r/7b/8/8/8/8/1B4BQ/R3K2R",                            "b", "KQkq", "-",  4, 1274206,   "ccc-10"},
  {"r3k2r/8/3Q4/8/8/5q2/8/R3K2R",                             "b", "KQkq", "-",  4, 1720476,   "ccc-11"},
  {"r3k2r/8/5Q2/8/8/3q4/8/R3K2R",                             "w", "KQkq", "-",  4, 1720476,   "ccc-12"},
  {"2K2r2/4P3/8/8/8/8/8/3k4",                                 "w", "-",    "-",  6, 3821001,   "ccc-13"},
  {"3K4/8/8/8/8/8/4p3/2k2R2",                                 "b", "-",    "-",  6, 3821001,   "ccc-14"},
  {"8/8/1P2K3/8/2n5/1q6/8/5k2",                               "b", "-",    "-",  5, 1004658,   "ccc-15"},
  {"5K2/8/1Q6/2N5/8/1p2k3/8/8",                               "w", "-",    "-",  5, 1004658,   "ccc-16"},
  {"4k3/1P6/8/8/8/8/K7/8",                                    "w", "-",    "-",  6, 217342,    "ccc-17"},
  {"8/k7/8/8/8/8/1p6/4K3",                                    "b", "-",    "-",  6, 217342,    "ccc-18"},
  {"8/P1k5/K7/8/8/8/8/8",                                     "w", "-",    "-",  6, 92683,     "ccc-19"},
  {"8/8/8/8/8/k7/p1K5/8",                                     "b", "-",    "-",  6, 92683,     "ccc-20"},
  {"K1k5/8/P7/8/8/8/8/8",                                     "w", "-",    "-",  6, 2217,      "ccc-21"},
  {"8/8/8/8/8/p7/8/k1K5",                                     "b", "-",    "-",  6, 2217,      "ccc-22"},
  {"8/k1P5/8/1K6/8/8/8/8",                                    "w", "-",    "-",  7, 567584,    "ccc-23"},
  {"8/8/8/8/1k6/8/K1p5/8",                                    "b", "-",    "-",  7, 567584,    "ccc-24"},
  {"8/8/2k5/5q2/5n2/8/5K2/8",                                 "b", "-",    "-",  4, 23527,     "ccc-25"},
  {"8/5k2/8/5N2/5Q2/2K5/8/8",                                 "w", "-",    "-",  4, 23527,     "ccc-26"},
  {"8/p7/8/1P6/K1k3p1/6P1/7P/8",                              "w", "-",    "-",  8, 8103790,   "jvm-7"},
  {"n1n5/PPPk4/8/8/8/8/4Kppp/5N1N",                           "b", "-",    "-",  6, 71179139,  "jvm-8"},
  {"r3k2r/p6p/8/B7/1pp1p3/3b4/P6P/R3K2R",                     "w", "KQkq", "-",  6, 77054993,  "jvm-9"},
  {"8/5p2/8/2k3P1/p3K3/8/1P6/8",                              "b", "-",    "-",  8, 64451405,  "jvm-11"},
  {"r3k2r/pb3p2/5npp/n2p4/1p1PPB2/6P1/P2N1PBP/R3K2R",         "w", "KQkq", "-",  5, 29179893,  "jvm-12"},
  {"8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8",                         "w", "-",    "-",  7, 178633661, "jvm-10"},
  {"r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R", "w", "KQkq", "-",  5, 193690690, "jvm-6"},
  {"8/2pkp3/8/RP3P1Q/6B1/8/2PPP3/rb1K1n1r",                   "w", "-",    "-",  6, 181153194, "ob1"},
  {"rnbqkb1r/ppppp1pp/7n/4Pp2/8/8/PPPP1PPP/RNBQKBNR",         "w", "KQkq", "f6", 6, 244063299, "jvm-5"},
  {"8/2ppp3/8/RP1k1P1Q/8/8/2PPP3/rb1K1n1r",                   "w", "-",    "-",  6, 205552081, "ob2"},
  {"8/8/3q4/4r3/1b3n2/8/3PPP2/2k1K2R",                        "w", "K",    "-",  6, 207139531, "ob3"},
  {"4r2r/RP1kP1P1/3P1P2/8/8/3ppp2/1p4p1/4K2R",                "b", "K",    "-",  6, 314516438, "ob4"},
  {"r3k2r/8/8/8/3pPp2/8/8/R3K1RR",                            "b", "KQkq", "e3", 6, 485647607, "jvm-1"},
  {"8/3K4/2p5/p2b2r1/5k2/8/8/1q6",                            "b", "-",    "-",  7, 493407574, "jvm-4"},
  {"r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1",   "w", "kq",   "-",  6, 706045033, "jvm-2"},
  {"r6r/1P4P1/2kPPP2/8/8/3ppp2/1p4p1/R3K2R",                  "w", "KQ",   "-",  6, 975944981, "ob5"}

};

static const size_t perft_data_len = sizeof(perft_data) / sizeof(perft_data[0]);

/*}}}*/
/*{{{  bench data*/

static const Bench bench_data[] = {

  {"r3k2r/2pb1ppp/2pp1q2/p7/1nP1B3/1P2P3/P2N1PPP/R2QK2R", "w", "KQkq", "a6"},
  {"4rrk1/2p1b1p1/p1p3q1/4p3/2P2n1p/1P1NR2P/PB3PP1/3R1QK1", "b", "-", "-"},
  {"r3qbrk/6p1/2b2pPp/p3pP1Q/PpPpP2P/3P1B2/2PB3K/R5R1", "w", "-", "-"},
  {"6k1/1R3p2/6p1/2Bp3p/3P2q1/P7/1P2rQ1K/5R2", "b", "-", "-"},
  {"8/8/1p2k1p1/3p3p/1p1P1P1P/1P2PK2/8/8", "w", "-", "-"},
  {"7r/2p3k1/1p1p1qp1/1P1Bp3/p1P2r1P/P7/4R3/Q4RK1", "w", "-", "-"},
  {"r1bq1rk1/pp2b1pp/n1pp1n2/3P1p2/2P1p3/2N1P2N/PP2BPPP/R1BQ1RK1", "b", "-", "-"},
  {"3r3k/2r4p/1p1b3q/p4P2/P2Pp3/1B2P3/3BQ1RP/6K1", "w", "-", "-"},
  {"2r4r/1p4k1/1Pnp4/3Qb1pq/8/4BpPp/5P2/2RR1BK1", "w", "-", "-"},
  {"4q1bk/6b1/7p/p1p4p/PNPpP2P/KN4P1/3Q4/4R3", "b", "-", "-"},
  {"2q3r1/1r2pk2/pp3pp1/2pP3p/P1Pb1BbP/1P4Q1/R3NPP1/4R1K1", "w", "-", "-"},
  {"1r2r2k/1b4q1/pp5p/2pPp1p1/P3Pn2/1P1B1Q1P/2R3P1/4BR1K", "b", "-", "-"},
  {"r3kbbr/pp1n1p1P/3ppnp1/q5N1/1P1pP3/P1N1B3/2P1QP2/R3KB1R", "b", "KQkq", "b3"},
  {"8/6pk/2b1Rp2/3r4/1R1B2PP/P5K1/8/2r5", "b", "-", "-"},
  {"1r4k1/4ppb1/2n1b1qp/pB4p1/1n1BP1P1/7P/2PNQPK1/3RN3", "w", "-", "-"},
  {"8/p2B4/PkP5/4p1pK/4Pb1p/5P2/8/8", "w", "-", "-"},
  {"3r4/ppq1ppkp/4bnp1/2pN4/2P1P3/1P4P1/PQ3PBP/R4K2", "b", "-", "-"},
  {"5rr1/4n2k/4q2P/P1P2n2/3B1p2/4pP2/2N1P3/1RR1K2Q", "w", "-", "-"},
  {"1r5k/2pq2p1/3p3p/p1pP4/4QP2/PP1R3P/6PK/8", "w", "-", "-"},
  {"q5k1/5ppp/1r3bn1/1B6/P1N2P2/BQ2P1P1/5K1P/8", "b", "-", "-"},
  {"r1b2k1r/5n2/p4q2/1ppn1Pp1/3pp1p1/NP2P3/P1PPBK2/1RQN2R1", "w", "-", "-"},
  {"r1bqk2r/pppp1ppp/5n2/4b3/4P3/P1N5/1PP2PPP/R1BQKB1R", "w", "KQkq", "-"},
  {"r1bqr1k1/pp1p1ppp/2p5/8/3N1Q2/P2BB3/1PP2PPP/R3K2n", "b", "Q", "-"},
  {"r1bq2k1/p4r1p/1pp2pp1/3p4/1P1B3Q/P2B1N2/2P3PP/4R1K1", "b", "-", "-"},
  {"r4qk1/6r1/1p4p1/2ppBbN1/1p5Q/P7/2P3PP/5RK1", "w", "-", "-"},
  {"r7/6k1/1p6/2pp1p2/7Q/8/p1P2K1P/8", "w", "-", "-"},
  {"r3k2r/ppp1pp1p/2nqb1pn/3p4/4P3/2PP4/PP1NBPPP/R2QK1NR", "w", "KQkq", "-"},
  {"3r1rk1/1pp1pn1p/p1n1q1p1/3p4/Q3P3/2P5/PP1NBPPP/4RRK1", "w", "-", "-"},
  {"5rk1/1pp1pn1p/p3Brp1/8/1n6/5N2/PP3PPP/2R2RK1", "w", "-", "-"},
  {"8/1p2pk1p/p1p1r1p1/3n4/8/5R2/PP3PPP/4R1K1", "b", "-", "-"},
  {"8/4pk2/1p1r2p1/p1p4p/Pn5P/3R4/1P3PP1/4RK2", "w", "-", "-"},
  {"8/5k2/1pnrp1p1/p1p4p/P6P/4R1PK/1P3P2/4R3", "b", "-", "-"},
  {"8/8/1p1kp1p1/p1pr1n1p/P6P/1R4P1/1P3PK1/1R6", "b", "-", "-"},
  {"8/8/1p1k2p1/p1prp2p/P2n3P/6P1/1P1R1PK1/4R3", "b", "-", "-"},
  {"8/8/1p4p1/p1p2k1p/P2npP1P/4K1P1/1P6/3R4", "w", "-", "-"},
  {"8/8/1p4p1/p1p2k1p/P2n1P1P/4K1P1/1P6/6R1", "b", "-", "-"},
  {"8/5k2/1p4p1/p1pK3p/P2n1P1P/6P1/1P6/4R3", "b", "-", "-"},
  {"8/1R6/1p1K1kp1/p6p/P1p2P1P/6P1/1Pn5/8", "w", "-", "-"},
  {"1rb1rn1k/p3q1bp/2p3p1/2p1p3/2P1P2N/PP1RQNP1/1B3P2/4R1K1", "b", "-", "-"},
  {"4rrk1/pp1n1pp1/q5p1/P1pP4/2n3P1/7P/1P3PB1/R1BQ1RK1", "w", "-", "-"},
  {"r2qr1k1/pb1nbppp/1pn1p3/2ppP3/3P4/2PB1NN1/PP3PPP/R1BQR1K1", "w", "-", "-"},
  {"2r2k2/8/4P1R1/1p6/8/P4K1N/7b/2B5", "b", "-", "-"},
  {"6k1/5pp1/8/2bKP2P/2P5/p4PNb/B7/8", "b", "-", "-"},
  {"2rqr1k1/1p3p1p/p2p2p1/P1nPb3/2B1P3/5P2/1PQ2NPP/R1R4K", "w", "-", "-"},
  {"r1b2rk1/p1q1ppbp/6p1/2Q5/8/4BP2/PPP3PP/2KR1B1R", "b", "-", "-"},
  {"6r1/5k2/p1b1r2p/1pB1p1p1/1Pp3PP/2P1R1K1/2P2P2/3R4", "w", "-", "-"},
  {"rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR", "b", "KQkq", "c3"},
  {"2rr2k1/1p4bp/p1q1p1p1/4Pp1n/2PB4/1PN3P1/P3Q2P/2RR2K1", "w", "-", "f6"},
  {"3br1k1/p1pn3p/1p3n2/5pNq/2P1p3/1PN3PP/P2Q1PB1/4R1K1", "w", "-", "-"},
  {"2r2b2/5p2/5k2/p1r1pP2/P2pB3/1P3P2/K1P3R1/7R", "w", "-", "-"}

};

static const size_t bench_data_len = sizeof(bench_data) / sizeof(bench_data[0]);
