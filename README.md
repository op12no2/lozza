If you are testing Lozza please use the latest release and not the coalface from the repo; which is usually broken in some way; thanks.

# Lozza

A UCI Javascript chess engine with a small 768 -> 75(srelu) -> 1 single accumulator NNUE evaluation. Try her here:-

https://op12no2.github.io/lozza-ui

## Basic use in a browser

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

A sister repo has more browser-based examples for playing and analysing etc. with Lozza.

https://github.com/op12no2/lozza-ui

You can try them here:-

https://op12no2.github.io/lozza-ui

## Play Lozza offline in chess user interfaces

While Lozza is primarily intended for use in browsers, as a UCI engine Lozza can be used in popular chesss user interfaces like Banksia, Winboard, Arena and CuteChess via ```Node.js```. Download the latest release and then follow the instructions in the ```readme.txt``` file.  Any platform that supports ```Node.js``` can be targetted.   

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

Alternatives to ```Node.js``` are ```Bun``` and ```Deno```.

## Commands specific to Lozza

```eval``` displays the current evaluation of the board.

```board``` displays the board as a FEN string.

```bench``` does a cumulative node count while searching a list of FENs, displaying the total and the time it took. It's particularly useful when checking that changes that should not affect searching have in fact not affected searching.  

```et``` tests the UE part of NNUE.

```pt``` performs a sequence of PERFT tests. 

```net``` displays network properties.

## Creating your own nets

Lozza's net is trained using ```trainer.js``` on data generated with ```datagen.js``` and ```filter.js```. Contact me if you are interested in building a different net for your project; it's very straightforward.

## Acknowledgements

https://www.chessprogramming.org/Main_Page - Chess programming wiki.

https://computerchess.org.uk/ccrl/4040 - CCRL rating list.

https://www.wbec-ridderkerk.nl/html/UCIProtocol.html - UCI protocol.

https://discord.gg/uM8J3x46 - Engine Programming Discord - thanks for the help with NNUE/datagen.

https://talkchess.com - Talkchess forums.

https://www.chessprogramming.org/Fruit - Fruit 2.1.

