# Lozza

Lozza is a hand-coded Javascript UCI chess engine that can be eaisly be deployed using a web worker. It can also be used with traditional chess user interfaces via Node.

## Play Lozza online

- https://op12no2.github.io/lozza-ui

## Play Lozza in chess user interfaces

This can be done using a batch file and full path names are recommended.
```
"C:\Program Files\nodejs\node.exe "c:\path\to\lozza.js"
``` 
Then use the batch file to load Lozza into the user interface. Email me if you get any problems ```op12no2@gmail.com```.

## Basic use in a browser

All you need is ```lozza.js``` from the latest release.  

Here is a little example to do a 10 ply search:-

```Javascript
const lozza = new Worker('lozza.js');
const ucioutput = document.getElementById('ucioutput');

lozza.onmessage = function(e) {
  ucioutput.textContent += e.data + '\n'; // Lozza reponds with text as per UCI 
};

lozza.postMessage('uci');
lozza.postMessage('ucinewgame');
lozza.postMessage('position startpos');
lozza.postMessage('go depth 10');
```

Try this example here:-

- https://op12no2.github.io/lozza-ui/ex.htm

## More examples

A sister repo has more browser-based examples for playing and analysing with Lozza.

- https://github.com/op12no2/lozza-ui

## Lozza's net

Lozza's net was booted from ```quiet_labeled.epd``` and ```lichess-big3-resolved.epd```, then iteratively improved through six generations of self play and training; initially using a diy trainer and more recently with ```bullet```. Currently it's a simple quantised 768->(256*2)->1 squared ReLU architecture, trained on about 600M positions. It's embeded into ```lozza.js``` as a single line of code towards the end of the file.

## Limitations

Lozza does not support the ```stop``` command or multi-threading.

## References

- https://nodejs.org - Node
- https://www.chessprogramming.org/Main_Page - Chess programming wiki
- https://computerchess.org.uk/ccrl/4040 - CCRL rating list
- https://backscattering.de/chess/uci - UCI protocol
- https://talkchess.com - Talkchess forums
- https://discord.gg/pntchvGU - Engine Programming Discord

## Acknowledgements

- https://www.chessprogramming.org/Fruit - Early versions of Lozza used a HCE based on Fruit 2.1
