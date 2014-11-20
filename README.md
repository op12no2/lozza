
# Lozza

A Javascript UCI chess engine that can be used in a Web Worker and Node.

## Hello world

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

[Hello world](https://op12no2.github.io/lozza/examples/hello_world.html)

```
node lozza.js # interactive uci or use in a chess gui via a batch file
```

## Acknowledgements

- https://chessprogramming.org - Chess programming wiki
- https://backscattering.de/chess/uci - UCI protocol
- https://talkchess.com - Talkchess
- https://chessprogramming.org/Fruit - Fruit 2.1
- https://nodejs.org/en - Node

