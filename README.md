
# Lozza

A Javascript UCI chess engine.

## Project constraints

- A single file that is easy to deploy.
- Be functionally identical in a Web Worker and Node (or Bun).
- Must not include any WASM.
- Any release binaries must embed a JS engine (like V8) and run as JS.
- Have a straight-forward easy to tweak coding style.

## Web Worker

All you need is `lozza11.0.js` from the [latest release](https://github.com/op12no2/lozza/releases).

```
const dump = document.getElementById('dump');
const lozza = new Worker('lozza11.0.js');

lozza.onmessage = function (e) {
  dump.textContent += e.data + '\n';
};

lozza.postMessage('uci');
lozza.postMessage('ucinewgame');
lozza.postMessage('position startpos');
lozza.postMessage('go depth 10');
```

## Node

```
node lozza11.0.js                     # interactive
node lozza11.0.js uci "go depth 10" q # exec commands and exit
```

## Notes

- The repo copy of `lozza.js` will not load because it has no embedded weights; always use the latest release.
- The code is best read with a folding editor; I use foldit in a WSL terminal - link below.
- Lozza needs a rewrite. It's pretty ugly with a 12x12 board inherited from my 1980 engine and search is way behind the hobby coalface.

## Acknowledgements

- https://chessprogramming.org - Chess programming wiki
- https://backscattering.de/chess/uci - UCI protocol
- https://talkchess.com - Talkchess forums
- https://chessprogramming.org/Fruit - Fruit 2.1
- https://nodejs.org/en - Node
- https://github.com/op12no2/foldit - Folding editor
- https://github.com/jw1912/bullet - bullet trainer
- https://github.com/Disservin/fastchess/releases - fastchess - for SPRTs

