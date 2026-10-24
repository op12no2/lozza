# Lozza

A UCI Javascript chess engine.

Lozza was created for use in web pages and runs as a Web Worker. It's readable, easily tweakable and WASM-free.

The [latest release](https://github.com/op12no2/lozza/releases) has several builds available as assets to choose from:-

| File | Evaluation | ~Elo | Size | |
|---|---|---|---|---|
| lozzaNNUE.js | [Neural network](https://chessprogramming.org/NNUE)                                | 3100 | 370 kb | [Try it](https://op12no2.github.io/lozza-ui/index.html?engine=lozzaNNUE) |
| lozzaMini.js | Mini [neural network](https://chessprogramming.org/NNUE) as readable boards        | 2800 | 195 kb | [Try it](https://op12no2.github.io/lozza-ui/index.html?engine=lozzaMini) |
| lozzaHCE.js  | [Hand coded evaluation](https://chessprogramming.org/Evaluation)                   | 2750 | 97 kb  | [Try it](https://op12no2.github.io/lozza-ui/index.html?engine=lozzaHCE)  |
| lozzaMat.js  | [Material only](https://www.danheisman.com/evaluation-of-material-imbalances.html) | 2050 | 62 kb  | [Try it](https://op12no2.github.io/lozza-ui/index.html?engine=lozzaMat)  |
| lozzaBeal.js | [Random (Beal effect)](https://chessprogramming.org/Search_with_Random_Leaf_Values)| 1200 | 58 kb  | [Try it](https://op12no2.github.io/lozza-ui/index.html?engine=lozzaBeal) |

All have identical UCI interfaces and search. They only differ by their evaluation function. There some example of use [here](https://github.com/op12no2/lozza-ui). 

## References & Acknowledgements

- https://www.chessprogramming.org/Main_Page - Chess programming wiki
- https://backscattering.de/chess/uci - UCI protocol
- https://github.com/Disservin/fastchess - fastchess game runner
- https://github.com/jw1912/bullet - bullet network trainer
