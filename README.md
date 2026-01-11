# Lozza

A UCI Javascript chess engine.

Lozza was primarily created for use in browsers, but more recent versioins can be used from the command line via Node. 

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

Note that Lozza must be fired up in a web worker.

## More examples

- https://github.com/op12no2/lozza-ui

## UCI options

```
option name Hash type spin default 16 min 1 max 1024 
option name MultiPV type spin default 1 min 1 max 500 
```

## Running Lozza from the command line

```
node lozza.js
node lozza.js uci ucinewgame "position startpos" "go depth 10" quit
```

## References

- https://nodejs.org - Node
- https://www.chessprogramming.org/Main_Page - Chess programming wiki
- https://computerchess.org.uk/ccrl/4040 - CCRL rating list
- https://backscattering.de/chess/uci - UCI protocol
- https://talkchess.com - Talkchess forums

## Acknowledgements

- https://www.chessprogramming.org/Fruit - Early versions of Lozza used a HCE based on Fruit 2.1
