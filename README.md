# Lozza

Lozza is a UCI chess engine written in Javascript. It's easily deployed using a web worker and can also be used with traditional chess user interfaces like Cutechess and Arena.

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

## Play Lozza in chess user interfaces

This can be done using Node and a batch file; full path names are recommended.

```
"C:\Program Files\nodejs\node.exe "c:\path\to\lozza.js"
``` 

Then use the batch file to load Lozza into the user interface. Email me if you get any problems ```op12no2@gmail.com```.

Alternatively use the Linux and Windows binaries in the latest release.

Node is also a nice way to exercise Lozza from the command line:-

```
Node lozza.js
```

## Lozza's net

Lozza's net was booted from ```quiet_labeled.epd``` and ```lichess-big3-resolved.epd```, then iteratively improved through several generations of self play and training; initially using a diy trainer and more recently with ```bullet```. Currently it's a simple quantised 768->(256*2)->1 squared ReLU architecture, trained on about 600M positions. It's embeded into ```lozza.js``` as a single line of code towards the end of the file.

## Limitations

Lozza does not support the ```stop``` command or multi-threading.

## Tweaking Lozza

You can either edit ```lozza.js``` directly or clone/download the repo and edit the individual files in ```src```. There is a little script ```bin/build``` to concatenate them into ```lozza.js```. There is also a script to do SPRT testing in ```bin/sprt```.

## Creating your own net

Use ```bullet``` to train a 768->(N*2)->1 `SqrRelu` net and set ```NET_H1_SIZE``` to ```N``` in ```src/const.js```. See ```src/bullet.rs``` for an example. Use the following command or ```bin/serialise_net``` to write the weights to ```src/weights.js```:-
```
echo "WEIGHTS_B64 = \"$(base64 -w 0 mynet.bin)\";" > src/weights.js

```
Then rebuild using ```bin/build```. If you change the activation function, tweak ```netEval``` ```in src/net.js``` to suit.

## References

- https://nodejs.org - Node
- https://www.chessprogramming.org/Main_Page - Chess programming wiki
- https://computerchess.org.uk/ccrl/4040 - CCRL rating list
- https://backscattering.de/chess/uci - UCI protocol
- https://talkchess.com - Talkchess forums
- https://discord.gg/pntchvGU - Engine Programming Discord

## Acknowledgements

- https://www.chessprogramming.org/Fruit - Early versions of Lozza used a HCE based on Fruit 2.1
