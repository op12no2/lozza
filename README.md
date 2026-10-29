
# Lozza

A Javascript UCI chess engine that can be used in a Web Worker and Node.

Lozza is easy to read and tweak; it's also easy to deploy and is WSAM-free.

Release versions are additionally available as assets for Windows and Linux;
ping me if you would like one for a different platform.

## Web hello world

All you need is `lozza.js` from the [latest release](https://github.com/op12no2/lozza/releases).

```
const dump = document.getElementById('dump');
const lozza = new Worker('lozza.js');

lozza.onmessage = function (e) {
  dump.textContent += e.data + '\n';
};

lozza.postMessage('uci');
lozza.postMessage('ucinewgame');
lozza.postMessage('position startpos');
lozza.postMessage('go depth 10');
```

Try it here: https://op12no2.github.io/lozza/examples/hello_world.html

## Node

```
node lozza.js                     # interactive
node lozza.js uci "go depth 10" q # exec commands and exit
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

