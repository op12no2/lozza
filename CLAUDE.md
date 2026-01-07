# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Command

```bash
bash bin/build
```

This concatenates `uci.js` etc into `lozza.js`. The build output `lozza.js` is the distributable file. It is critical to remember this when editing files. i.e. import is not used etc.

## Architecture

Lozza is a UCI (Universal Chess Interface) JavaScript chess engine with HCE evaluation. It can work within Node, Bun, Deno or a browser context (see uci.js).

## Coding style

Indentation = 2 spaces.

Put else on next line. e.g.

if (...) {
  ...
}
else {
  ...
}

