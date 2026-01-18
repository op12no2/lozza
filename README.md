# Lozza

Lozza is a UCI chess engine that is available for Windows, Linux, Mac ARM, Mac x86 and the browser via a web worker.

## Play Lozza online

- https://op12no2.github.io/lozza-ui

## Play Lozza in chess user interfaces

Use the appropriate binary from the latest release. Note that the binaries do not have a UI and you need to use Fritz, Arena or Cutechess etc. 

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

Note that ```lozza.js``` must be fired up in a web worker.

## More examples

A sister repo has more browser-based examples for playing and analysing with Lozza.

- https://github.com/op12no2/lozza-ui

## References

- https://www.chessprogramming.org/Main_Page - Chess programming wiki
- https://computerchess.org.uk/ccrl/4040 - CCRL rating list
- https://backscattering.de/chess/uci - UCI protocol
- https://talkchess.com - Talkchess forums

## Acknowledgements

- https://www.chessprogramming.org/Fruit - Early versions of Lozza used a HCE based on Fruit 2.1
