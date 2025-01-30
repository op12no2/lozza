# Lozza

A UCI Javascript chess engine using a small (NNUE) net for evaluation. Try her here:-

https://op12no2.github.io/lozza-ui

Lozza was primarily created for use in browsers, but can also be used with traditional chess UIs via Node and on pretty-much any platform (see below). Note however that Lozza is relatively slow compared to compiled engines of a similar design, which also makes her relatively weak. 

## Basic use in a browser

All you need is ```lozza.js``` from the latest release.  

Here is a little example to do a 10 ply search:-

```Javascript
var lozza = new Worker('lozza.js');

lozza.onmessage = function (e) {
  $('#dump').append(e.data);             // assuming jquery and a div called #dump
                                         // parse messages from here as required
};

lozza.postMessage('uci');                // lozza uses the uci communication protocol
lozza.postMessage('ucinewgame');         // reset tt
lozza.postMessage('position startpos');
lozza.postMessage('go depth 10');        // 10 ply search
```

Try this example here:-

https://op12no2.github.io/lozza-ui/ex.htm

Please note that Lozza's code is folded using ```{{{``` and ```}}}``` (emacs convention) and most easily read using an editor with a folding capability.

## More examples

A sister repo has more browser-based examples for playing and analysing etc. with Lozza.

https://github.com/op12no2/lozza-ui

You can try them here:-

https://op12no2.github.io/lozza-ui

## Play Lozza offline in chess user interfaces

Lozza can be used in popular chesss user interfaces like Banksia, Winboard, Arena and CuteChess via Node. Download the latest Lozza release and then follow the instructions in the ```readme.txt``` file. Any platform that supports Node can be targetted.   

https://github.com/op12no2/lozza/releases

## Acknowledgements

https://nodejs.org - Node

https://github.com/AndyGrant/OpenBench - OpenBench

https://www.chessprogramming.org/Main_Page - Chess programming wiki

https://computerchess.org.uk/ccrl/4040 - CCRL rating list

https://backscattering.de/chess/uci - UCI protocol

https://discord.gg/uM8J3x46 - Engine Programming Discord

https://talkchess.com - Talkchess forums

Fruit 2.1 - Early versions of Lozza used a HCE based on Fruit 2.1.
