# Lozza

A UCI Javascript chess engine.

Lozza was primarily created for use in browsers, but can also be used with traditional chess user interfaces via Node - and because of that - on pretty-much any platform. 

## Basic use in a browser

All you need is ```lozza.js``` from the latest release.  

- https://github.com/op12no2/lozza/releases

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

A sister repo has more browser-based examples for playing and analysing etc. with Lozza.

- https://github.com/op12no2/lozza-ui

You can try them here:-

- https://op12no2.github.io/lozza-ui

## Play Lozza offline in chess user interfaces

Lozza needs Node to run in chess user interfaces (CUI). Node is available for pretty much any platform and is quick and easy to install (and small).

- https://nodejs.org 

Adding Lozza to your CUI is a little bit different to other engines. Edit the .bat file contained in the release to point at the Node executable (node.exe) with Lozza as a parameter. Full paths are recommended. For example:-
```
"c:\program files\nodejs\node.exe" "c:\path\to\lozza.js"
```
The " characters are needed for Windows if there are spaces in the pathnames; your platform may be different.

Now use the .bat file as the engine target in the CUI (where you would normally point to an executable).

If your CUI allows parameters to engine executables, or if your CUI does not allow the selection of batch files, you can use node.exe as the engine executable and lozza.js as a parameter and again full paths are recommended. Linux supports shebangs for javascript files and that is another option.

## UCI options

```
option name Hash type spin default 16 min 1 max 1024 
option name MultiPV type spin default 1 min 1 max 500 
```

## Running Lozza from a command line interface

Again Node is needed:-

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
