# Lozza

## Note to testers

If you are tesing Lozza for a rating list etc., please use lozza.js from the latest release, not the above version in the repository root, which has lots of tuning and debug code that will significantly affect performance; many thanks and also thanks for your CPU cycles :)

https://github.com/op12no2/lozza/releases

## Overview

A Javascript chess engine inspired by Fabien Letouzey's Fruit 2.1. Lozza was an exercise in principal variation search and hand-coded evaluation. It's easy to use Lozza in your web projects. Communication is via the UCI protocol, which also allows it to be used offline in chess user interfaces via something like Nodejs.

## Basic use

All you need is lozza.js from the root of the repository.

```Javascript
var lozza = new Worker('lozza.js');

lozza.onmessage = function (e) {
  $('#dump').append(e.data);             //assuming jquery and a div called #dump
                                         //parse messages from here as required
};

lozza.postMessage('uci');                // get build etc
lozza.postMessage('ucinewgame');         // reset TT
lozza.postMessage('position startpos');
lozza.postMessage('go depth 10');        // 10 ply search
```

Try this example here:-

https://op12no2.github.io/lozza-ui/ex.htm.

## More examples for playing and analysing

https://github.com/op12no2/lozza-ui

You can try them here:-

https://op12no2.github.io/lozza-ui

## Play Lozza on Lichess

https://lichess.org/@/lozzaBot

## Play Lozza offline in chess user interfaces

While primarily intended for use in a browser context, Lozza can be used offline on almost any platform via Nodejs and chess user interfaces like Winboard, Arena, Cutechess and Banksia. Download the latest Lozza release and follow the instructions in readme.txt.

https://github.com/op12no2/lozza/releases
  
## Developer notes

lozza.js is folded using {{{ and }}} (emacs convention) and most easily read using an editor with a folding capability.

Unlike the release versions, the development lozza.js in the repository root has tuning and debug code marked with ##ifdef, which will signigicantly affect performance. It can be removed on release of your project like this:-

```
Windows: findstr -V ##ifdef lozza.js
Linux:   grep -v \#\#ifdef lozza.js
```
You should also change TTSIZE from a power of 22 to 24 if using long time controls (again, as per the release version).

## Acknowledgements

https://www.chessprogramming.org/Fruit - Fruit

https://www.chessprogramming.org/Main_Page - Chess programming wiki

http://ccrl.chessdom.com/ccrl/4040 - CCRL rating list

https://github.com/AndyGrant/Ethereal/blob/master/Tuning.pdf - A nice overview of gradient descent.
