
# Lozza

A Javascript UCI chess engine that can be used in a Web Worker and Node.
Release versions are also available as a Windows binary;
ping me if you would like a binary for a different platform.

Lozza is easy to read and tweak, trivial to deploy and WSAM-free.

## Web hello world

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

## Node

```
node lozza.js                     # interactive or use in a chess gui via a batch file
node lozza.js uci "go depth 10" q # exec command and exit
```

## Notes

- Lozza's code is best read with a folding editor; I use foldit in a terminal - link below.
- Lozza's search is way behind the hobby coalface.

## Acknowledgements

- https://chessprogramming.org - Chess programming wiki
- https://backscattering.de/chess/uci - UCI protocol
- https://talkchess.com - Talkchess forums
- https://chessprogramming.org/Fruit - Fruit 2.1
- https://nodejs.org/en - Node
- https://github.com/op12no2/foldit - Folding editor
- https://github.com/jw1912/bullet - bullet trainer
- https://github.com/Disservin/fastchess/releases - fastchess - for SPRTs
- https://discord.gg/HTsRk2ATq - Engine Programming Discord channel
- https://discord.gg/bbpA5GqSz - Engine Testers Discord channel
- https://github.com/AndyGrant/Ethereal - Ethereal - Lozza's ID is Ethereal-shaped.

