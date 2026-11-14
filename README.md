
# Lozza

A Javascript UCI chess engine that can be used in a Web Worker and Node.

Lozza is easy to read and tweak; it's also easy to deploy.

Release versions are additionally available as assets for Windows and Linux;
ping me if you would like one for a different platform.

## Examples

| example | what it shows |
|---|---|
| [hello_world.html](examples/hello_world.html) ([try it](https://op12no2.github.io/lozza/examples/hello_world.html)) | The least you can do: start Lozza in a Web Worker, send it UCI commands and show what comes back. |
| [engine.js](examples/engine.js) and [engine.html](examples/engine.html) ([try it](https://op12no2.github.io/lozza/examples/engine.html)) | A small promise wrapper for the Worker, so that you can `await` a best move, the legal moves or the position, and stop a search. The page asks for the best move in a position. |
| [play.html](examples/play.html) ([try it](https://op12no2.github.io/lozza/examples/play.html)) | A game against Lozza on a clickable board, with no chess library: Lozza supplies the legal moves and the page works out check, mate and draws. |
| [analyse.js](examples/analyse.js) | Lozza from a Node program: run it as a child process and get the best move, score and line for a list of positions. `node examples/analyse.js` |

The examples use `examples/lozza_net256.js`, a recent build with a small net. For your
own use take the engine from the [latest release](https://github.com/op12no2/lozza/releases).

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

