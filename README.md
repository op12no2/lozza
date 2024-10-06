If you are testing Lozza please use the release not the repo version; thanks.

# Lozza

A UCI Javascript chess engine. Try her here:-

https://op12no2.github.io/lozza-ui

## Basic use in your web pages

All you need is ```lozza.js``` from the latest release.  

Here is a little example to do a 10 ply search:-

```Javascript
var lozza = new Worker('lozza.js');

lozza.onmessage = function (e) {
  $('#dump').append(e.data);             //assuming jquery and a div called #dump
                                         //parse messages from here as required
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

A sister repo has more web-based examples for playing and analysing etc. with Lozza.

https://github.com/op12no2/lozza-ui

You can try them here:-

https://op12no2.github.io/lozza-ui

## Play Lozza offline in chess user interfaces

As a UCI engine Lozza can be used in popular chesss user interfaces like Banksia, Winboard, Arena and CuteChess. Download the latest release and then follow the instructions in the ```readme.txt``` file.  Any platform that supports ```Node.js``` can be targetted. 

https://github.com/op12no2/lozza/releases

## Fire up Lozza from the command line

Lozza accesses stdio via ```Node.js``` and will run on any platfrom that supports ```Node.js```.  To type UCI commands into Lozza, start ```Node.js``` with ```lozza.js``` or ```lozza``` as the parameter and then enter UCI commands. For example:-

```
> node lozza
ucinewgame
position startpos
eval
go depth 10
quit
```
Commands can also be given on invocation, for example:-

```
> node lozza ucinewgame bench "position startpos" board "go movetime 100" quit
```

## Commands specific to Lozza

```eval``` displays the current evaluation of the board.

```board``` displays the board as a FEN string.

```bench``` does a cumulative node count while searching a list of FENs, displaying the total and the time it took. It's particularly useful when checking that changes that should not affect searching have in fact not affected searching.  

```et``` tests the UE part of NNUE.

```pt``` performs a sequence of PERFT tests. 

```net``` displays network properties.

```datagen``` performs internal data generation for use with ```trainer.js```. The command I currently use to generate data for the trainer is ```node lozza "dagaten file $RANDOM$RANDOM$RANDOM.fen games 60000 softnodes 6000 hardnodes 1000000 rand 10 first 16" q```. Run on as many threads as possible and repeated as necessary. See the ```datagen``` script in the ```scripts``` directory.

## Acknowledgements

https://www.chessprogramming.org/Main_Page - Chess programming wiki.

https://computerchess.org.uk/ccrl/4040 - CCRL rating list.

https://www.wbec-ridderkerk.nl/html/UCIProtocol.html - UCI protocol.

https://discord.gg/uM8J3x46 - Engine Programming Discord - thanks for the help with NNUE/datagen.

https://talkchess.com - Talkchess forums.

https://www.chessprogramming.org/Fruit - Fruit 2.1.

