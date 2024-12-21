Please use the latest release and not the repo coalface, which is usually broken in some way; thanks.

# Lozza

A UCI Javascript chess engine using a small net for evaluation. Try her here:-

https://op12no2.github.io/lozza-ui

Lozza was primarily created for use in browsers, but can also be used with traditional chess UIs via ```Node.js``` and on pretty-much any platform (see below). Note however that Lozza is relatively slow compared to compiled engines of a similar design, which also makes her relatively weak. 

## Project constraints

Hand-coded (as opposed to Emscripten) Javascript for everything including training and tuning. Self data generation, with the exception of the first training dataset which was ```lichess-big3-resolved.epd + quiet_labeled.epd```. 

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

Lozza can be used in popular chesss user interfaces like Banksia, Winboard, Arena and CuteChess via ```Node.js```. Download the latest release and then follow the instructions in the ```readme.txt``` file. Any platform that supports ```Node.js``` can be targetted.   

https://github.com/op12no2/lozza/releases

## Fire up Lozza from the command line

To type UCI commands into Lozza, start ```Node.js``` with ```lozza.js``` or ```lozza``` as the parameter and then enter commands. For example:-

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
The UCI protocol is not fully implemented; see the ```lozUCI``` class in ```lozza.js``` for details.

Alternatives to ```Node.js``` are ```Bun``` and ```Deno```.

## Commands specific to Lozza

```eval``` displays the current evaluation of the board.

```board``` displays the board as a FEN string.

```bench``` does a cumulative node count while searching a list of FENs, displaying the total and the time it took. It's particularly useful when checking that changes that should not affect searching have in fact not affected searching.  

```et``` tests the UE part of NNUE.

```perft``` does a PERFT on the current position.

```pt``` performs a sequence of PERFT tests. 

```net``` displays network properties.

## Creating your own nets

Lozza's net was trained using a ```datagen.js``` -> ```filter.js``` -> ```trainer.js``` Javascript pipeline. Contact me if you are interested in training a different net for your project; it's very straightforward.

## Using Lozza nets

Lozza's ```.bin``` network files are a simple concatenation of little-endian unquantized float32 weights and biases representing a single perspective/accumulator: (768*128 weights + 128 biases) + (128 weights + 1 bias).  See ```saveBinaryModel``` in ```trainer.js``` and ```lozBoard.prototype.netLoad``` in ```lozza.js```. The activation function is squared ReLU - ```srelu``` in ```lozza.js```. See also ```lozBoard.prototype.net*``` for accumulator updates etc.   

## Acknowledgements

https://nodejs.org - ```Node.js```

https://www.chessprogramming.org/Main_Page - Chess programming wiki.

https://computerchess.org.uk/ccrl/4040 - CCRL rating list.

https://backscattering.de/chess/uci - UCI protocol.

https://discord.gg/uM8J3x46 - Engine Programming Discord.

https://talkchess.com - Talkchess forums.

