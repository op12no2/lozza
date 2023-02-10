# Lozza

A Javascript chess engine inspired by Fabien Letouzey's Fruit 2.1. 

It's easy to use Lozza in your web projects by firing it up a web worker and then communicating using the UCI protocol.

Lozza code is folded using ```{{{``` and ```}}}``` (emacs convention) and most easily read using an editor with a folding capability.

## Basic use

All you need is ```lozza.js``` from the root of the repo. 

Here is a little example to do a 10 ply search:-

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

https://op12no2.github.io/lozza-ui/ex.htm

## More examples

A sister repo has more examples for playing and analysing etc. with Lozza.

https://github.com/op12no2/lozza-ui

You can try them here:-

https://op12no2.github.io/lozza-ui

## Testing and tuning

There are various scripts in the testing directory that can be run with ```Node.js```. For example:-

```
cd test
node tuner
```

Training data used is Alexandru Moșoi's (Zurichess) ```quiet-labeled.epd```. 

There is a web-based PERFT script that can be run here:-

https://op12no2.github.io/lozza-ui/perft.htm

I use Windows, but any platform with a ```Node.js``` executable is suitable for testing and tuning.

In a ```Node.js``` script you can call Lozza's functional interface directly (e.g. see ```tuner.js```) or call Lozza's UCI interface like this (e.g. see ```perft.js```):-

```
var depth = 10;
onmessage({data: 'ucinewgame\nposition startpos'});  // separate multiple UCI commands with \n
onmessage({data: 'go depth ' + depth});
```

Lozza has a little utility function called ```docmd``` to make this a little easier:-

```
var depth = 10;
docmd('ucinewgame\nposition startpos');  // separate multiple UCI commands with \n
docmd('go depth ' + depth);
```

After a search, the best move is in ```lozza.stats.bestMove``` in binary form (see constants). You can format it like this:-

```
console.log(lozza.board.formatMove(lozza.stats.bestMove, UCI_FMT);  // e.g. g1f3
console.log(lozza.board.formatMove(lozza.stats.bestMove, SAN_FMT);  // e.g. Nf3
```

To type UCI commands into Lozza directly, just fire it up with ```Node.js```:-

```
> cd _location of lozza.js_
> node lozza
```

Lozza has some UCI command extensions and shortcuts detailed here:-

https://op12no2.github.io/lozza-ui/consolehelp.htm

That may well be out of date. Check the ```switch``` statement in the ```onmessage``` function for the coalface.

You can supply UCI commands on invocation like this for example:-

```
> cd _location of lozza.js_
> node lozza ucinewgame "position startpos" "go depth 10"
```
There is also a web-based UCI console here:-

https://op12no2.github.io/lozza-ui/console.htm

The ```bench``` command allows a quick check for tweaks that should not affect search. It's a node count across various FENs at depth 9 and takes a few seconds to run:-

```
> cd _location of lozza.js_
> node lozza bench quit
nodes 4625388 8993
_tweak something_
> node lozza bench quit
nodes 4625388 9121
```

The node counts should match, like they do above. The times will vary from run to run even without any changes to the code.

## Play Lozza offline in chess user interfaces

Lozza can be used in popular chesss user interfaces like Banksia, Winboard, Arena and CuteChess. Download the latest release and then follow the instructions in the ```readme.txt``` file.  Any platform that supports ```Node.js``` can be targetted. 

https://github.com/op12no2/lozza/releases
  
## Acknowledgements

https://www.chessprogramming.org/Fruit - Fruit

https://www.chessprogramming.org/Main_Page - Chess programming wiki

http://talkchess.com - TalkChess forums

http://ccrl.chessdom.com/ccrl/4040 - CCRL rating list

https://www.chessprogramming.org/Texel%27s_Tuning_Method - Texel tuning

http://wbec-ridderkerk.nl/html/UCIProtocol.html - UCI protocol

https://github.com/davidbau/seedrandom - Random number generator used for Zobrist hashing

https://cutechess.com - Cute Chess

https://bitbucket.org/zurichess/tuner/downloads - Alexandru Moșoi's quiet-labeled.epd

https://nodejs.org - Node.js
