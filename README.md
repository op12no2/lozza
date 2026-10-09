# Lozza

A UCI Javascript chess engine.

Lozza was primarily created for use in web pages, but from v1.13 onwards can also be used on the command line via Node. 

Recent versions have become little projects in their own right with differing development ideas; this keeps it fun for me rather then endlessly grinding on the same code. Version 12 is no-holds-barred and version 11 is tightly constrained for example (both in development); as noted in the [release overview](https://github.com/op12no2/lozza/wiki/Release-overview). As a result, successive versions are not necessarily increasingly stronger. Pick a version that suits your requirements.

## Basic use in a web page

All you need is a ```lozza.js``` from a [release's](https://github.com/op12no2/lozza/wiki/Release-overview) Assets section.  

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

Try this example [here](https://op12no2.github.io/lozza-ui/ex.htm) and there are more examples [here](https://github.com/op12no2/lozza-ui).

## Command line use

For example:-

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
- https://github.com/jw1912/bullet - bullet network trainer.
