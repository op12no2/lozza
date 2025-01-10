**Please use the latest release and not the repo coalface, which is usually broken in some way; thanks.**

# Lozza

A UCI Javascript chess engine using a small (NNUE) net for evaluation. Try her here:-

https://op12no2.github.io/lozza-ui

Lozza was primarily created for use in browsers, but can also be used with traditional chess UIs via Node and on pretty-much any platform (see below). Note however that Lozza is relatively slow compared to compiled engines of a similar design, which also makes her relatively weak. 

## Project goal/constraints

To maximise ELO within a Javascript framework (datagen, training and engine); sorry stylists. 

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

Lozza can be used in popular chesss user interfaces like Banksia, Winboard, Arena and CuteChess via Node. Download the latest release and then follow the instructions in the ```readme.txt``` file. Any platform that supports Node can be targetted.   

https://github.com/op12no2/lozza/releases

## Fire up Lozza from the command line

To type UCI commands into Lozza, start Node with ```lozza.js``` or ```lozza``` as the parameter and then enter commands. For example:-

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

Alternatives to Node are Bun and Deno but a few tweaks may be needed.

## Commands specific to Lozza

```eval``` displays the current evaluation of the board.

```board``` displays the board as a FEN string.

```bench``` does a cumulative node count while searching a list of FENs, displaying the total and the time it took. It's particularly useful when checking that changes that should not affect searching have in fact not affected searching.  

```et``` tests the UE part of NNUE.

```perft``` does a PERFT on the current position.

```pt``` performs a timed sequence of PERFT tests. 

```net``` displays net properties.

## Lozza's net

Lozza's net was trained using a ```datagen.js``` -> ```filter.js``` -> ```trainer.js``` Javascript pipeline. The current net is white-relative 768x128x1 unquantized squared ReLU and the weights are inlined into ```lozza.js```. The training samples include flipped nstm positions, which gains for Lozza's white-relative architecture. The total number of (third generation) training samples is about 425M. I am happy to share my training data if you are interested in creating a net for your own projects, or a different net for Lozza.

## Acknowledgements

https://nodejs.org - Node

https://www.chessprogramming.org/Main_Page - Chess programming wiki.

https://computerchess.org.uk/ccrl/4040 - CCRL rating list.

https://backscattering.de/chess/uci - UCI protocol.

https://discord.gg/uM8J3x46 - Engine Programming Discord.

https://talkchess.com - Talkchess forums.

Fruit 2.1 - Early versions of Lozza used a HCE based on Fruit 2.1.
