//
// Host for the C build of lozza: stdin/stdout, clock, exit, net weights.
//
// The engine itself is lozza_core.c, generated from lozza.js by lozza2c.
// Build (linux):
//
//   clang -O3 -march=x86-64-v3 -fwrapv -o lozza runtime_uci.c -lm
//
// With -DLOZZA_WEIGHTS_H='"weights_blob.h"' the net is embedded, otherwise
// it is read from the file named in lozza.js (dev builds).
//
// Command line arguments are commands, as with node lozza.js, e.g.
//
//   lozza "go depth 10" q
//

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <time.h>

#ifdef _WIN32
#include <windows.h>
#include <io.h>
#else
#include <unistd.h>
#include <poll.h>
#endif

#ifdef LOZZA_WEIGHTS_H
#include LOZZA_WEIGHTS_H
#endif

#include "lozza_core.c"

//{{{  clock

int32_t now (void) {
#ifdef _WIN32
  // GetTickCount64 only ticks every 15.6ms, too coarse for bullet time controls
  static LARGE_INTEGER freq;
  LARGE_INTEGER t;
  if (freq.QuadPart == 0) QueryPerformanceFrequency(&freq);
  QueryPerformanceCounter(&t);
  return (int32_t)(t.QuadPart * 1000 / freq.QuadPart);
#else
  struct timespec ts;
  clock_gettime(CLOCK_MONOTONIC, &ts);
  return (int32_t)(ts.tv_sec * 1000 + ts.tv_nsec / 1000000);
#endif
}

//}}}
//{{{  output

static char uciBuf[16384];
static int  uciLen = 0;

void uciSend_begin (void) { uciLen = 0; }

static void uciAppend (const char* s) {
  int n = (int)strlen(s);
  if (uciLen + n + 2 >= (int)sizeof(uciBuf)) n = (int)sizeof(uciBuf) - uciLen - 2;
  if (n < 0) n = 0;
  memcpy(uciBuf + uciLen, s, (size_t)n);
  uciLen += n;
  uciBuf[uciLen++] = ' ';
}

void uciSend_s (const char* s) { uciAppend(s); }
void uciSend_i (int64_t v)     { uciAppend(lz_i64s(v)); }
void uciSend_d (double v)      { uciAppend(lz_f64s(v)); }

void uciSend_end (void) {
  if (silentMode) return;
  uciBuf[uciLen] = 0;
  puts(uciBuf);
  fflush(stdout);
}

void hostExit (void) {
  fflush(stdout);
  exit(0);
}

double lozzaRandom (void) { return rand() / (RAND_MAX + 1.0); }

//}}}
//{{{  input
//
// Own line buffering over the raw stdin descriptor so that a non blocking
// "is input waiting" check (used while searching) is not fooled by data
// sitting in a stdio buffer.
//

static char inBuf[1 << 16];
static int  inLen = 0;
static int  inEof = 0;
static char lineBuf[1 << 16];

static int inputReady (void) {
#ifdef _WIN32
  static HANDLE h;
  static int init = 0, pipe = 0;
  DWORD dw;
  if (!init) {
    init = 1;
    h = GetStdHandle(STD_INPUT_HANDLE);
    pipe = !GetConsoleMode(h, &dw);
    if (!pipe) {
      SetConsoleMode(h, dw & ~(ENABLE_MOUSE_INPUT | ENABLE_WINDOW_INPUT));
      FlushConsoleInputBuffer(h);
    }
  }
  if (pipe) {
    if (!PeekNamedPipe(h, NULL, 0, NULL, &dw, NULL)) return 1;   // broken pipe: let the read see the EOF
    return dw > 0;
  }
  GetNumberOfConsoleInputEvents(h, &dw);
  return dw > 1;
#else
  struct pollfd p = {0, POLLIN, 0};
  return poll(&p, 1, 0) > 0;
#endif
}

static void readMore (void) {
  if (inEof) return;
  if (inLen >= (int)sizeof(inBuf) - 1) inLen = 0;   // absurdly long line, drop it
#ifdef _WIN32
  int n = _read(0, inBuf + inLen, (unsigned)(sizeof(inBuf) - 1 - inLen));
#else
  ssize_t n = read(0, inBuf + inLen, sizeof(inBuf) - 1 - inLen);
#endif
  if (n <= 0) { inEof = 1; return; }
  inLen += (int)n;
}

// next complete line (no newline), or NULL if none is available (non blocking) / at EOF (blocking)

static const char* nextLine (int blocking) {
  for (;;) {
    char* nl = memchr(inBuf, '\n', (size_t)inLen);
    if (nl) {
      int n = (int)(nl - inBuf);
      memcpy(lineBuf, inBuf, (size_t)n);
      lineBuf[n] = 0;
      inLen -= n + 1;
      memmove(inBuf, nl + 1, (size_t)inLen);
      return lineBuf;
    }
    if (inEof) {
      if (inLen > 0) {   // last line without a newline
        memcpy(lineBuf, inBuf, (size_t)inLen);
        lineBuf[inLen] = 0;
        inLen = 0;
        return lineBuf;
      }
      return NULL;
    }
    if (!blocking && !inputReady()) return NULL;
    readMore();
  }
}

// called by the engine while searching so that stop/isready/quit can be picked up

void yieldToHost (void) {
  const char* l;
  while ((l = nextLine(0)) != NULL)
    uciQueue(l);
  if (inEof)
    stdinEnded = 1;
}

//}}}
//{{{  weights

const char* getWeights (void) {
#ifdef LOZZA_WEIGHTS_H
  return "embedded";
#else
  return "";
#endif
}

void netLoad (void) {

  const int16_t* w;

#ifdef LOZZA_WEIGHTS_H
  w = lozza_weights;
#else
  FILE* f = fopen(NET_WEIGHTS_FILE, "rb");
  if (!f) { fprintf(stderr, "cannot open weights %s\n", NET_WEIGHTS_FILE); exit(1); }
  fseek(f, 0, SEEK_END);
  long size = ftell(f);
  fseek(f, 0, SEEK_SET);
  int16_t* buf = (int16_t*)malloc((size_t)size);
  if (fread(buf, 1, (size_t)size, f) != (size_t)size) { fprintf(stderr, "short read on weights\n"); exit(1); }
  fclose(f);
  w = buf;
#endif

  // same layout logic as netLoad() in lozza.js

  int64_t offset = 0;

  for (int32_t i = 0; i < NET_I_SIZE; i++) {
    const int32_t lozIndex = bullet2lozza(i);
    const int32_t h = i * NET_H1_SIZE;
    for (int32_t j = 0; j < NET_H1_SIZE; j++) {
      net_h1_w_flat[lozIndex            * NET_H1_SIZE + j] = w[h + j];
      net_h2_w_flat[flipIndex(lozIndex) * NET_H1_SIZE + j] = w[h + j];
    }
  }

  offset += (int64_t)NET_I_SIZE * NET_H1_SIZE;
  for (int32_t i = 0; i < NET_H1_SIZE; i++)
    net_h1_b[i] = w[offset + i];

  offset += NET_H1_SIZE;
  for (int32_t i = 0; i < NET_H1_SIZE * 2; i++)
    net_o_w[i] = w[offset + i];

  offset += NET_H1_SIZE * 2;
  net_o_b = w[offset];

#ifndef LOZZA_WEIGHTS_H
  free(buf);
#endif
}

//}}}

int main (int argc, char** argv) {

  lz_initGlobals();

  initPrng();
  initNet();
  initBoard();
  initNodes();
  initSearch();

  // command line arguments are commands

  for (int i = 1; i < argc; i++)
    uciExec(argv[i], 0);

  // stdin

  for (;;) {
    const char* l = nextLine(1);
    if (!l) break;
    uciQueue(l);
  }

  stdinEnded = 1;
  if (!cmdBusy)
    hostExit();

  return 0;
}
