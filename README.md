# Lozza

A UCI Javascript chess engine.

Lozza was primarily created for use in browsers, but can also be used with traditional chess user interfaces (see below). 

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

- https://op12no2.github.io/lozza-ui/ex.htm

Note that Lozza must be fired up in a web worker.

## More examples

A sister repo has more browser-based examples for playing and analysing with Lozza.

- https://github.com/op12no2/lozza-ui

You can try them here:-

- https://op12no2.github.io/lozza-ui

## Play Lozza offline in chess user interfaces

The most straightfoward way is to use one of the binaries from the latest release. 

Alternatively install (Node)[https://nodejs.org/en] or (Bun)[https://bun.com/] and use ```lozza.js``` via a batch file; for example:

```
"c:\program files\nodejs\node.exe" "c:\path\to\lozza.js"
```

## UCI options

```
option name Hash type spin default 16 min 1 max 1024 
option name MultiPV type spin default 1 min 1 max 500 
```

## Running Lozza from a command line interface

Again, use one of the binaries from the latest release or for example:-

```
node lozza.js
```

Commands can be given as arguments:-

```
node lozza.js uci ucinewgame "position startpos" "go depth 10" quit
```

## Custom commands

- quit, q - close Lozza.
- board, b - display the board for the current position.
- moves, m - display the moves for the current position.
- eval, e - display the evaluation for the current position.
- net, n - display network attributes.
- bench - run a sequence of searches returning the toal node count and nps.
- perft n - run a perft search from the current position using depth n.
- pt - run a sequence of perft searches.
- et - run a sequence of evaluations.
 
## References

- https://nodejs.org - Node
- https://www.chessprogramming.org/Main_Page - Chess programming wiki
- https://computerchess.org.uk/ccrl/4040 - CCRL rating list
- https://backscattering.de/chess/uci - UCI protocol
- https://talkchess.com - Talkchess forums

## Acknowledgements

- https://www.chessprogramming.org/Fruit - Early versions of Lozza used a HCE based on Fruit 2.1
