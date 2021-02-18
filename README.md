# Lozza

A UCI compliant Javascript chess engine. Lozza is a traditional mailbox engine with PVS search. It's easy to embed Lozza into your web project or use her offline in client user interfaces like Arena and Winboard. A sister project also allows Lozza to be played online in your web browser via PC/laptop/tablet/phone etc. There is nothing new in Lozza - it's just an ongoing and fun coding exercise. 

## Why Javascript?

Mostly I was curious if a Javascript engine could compete with more traditional engines in the engine rating lists like CCRL, as at the time there were none listed. There were Javascript engines with their own user interfaces on the internet (like Gary Linscott's Garbochess), but none that used the UCI (or Winboard) protocol - needed to be included in the testing platforms. The Javascript development cycle is very quick because there is no build process; you can even make changes while it's playing to see what happens. Javascript effectively makes the engine platform-independent - running online in any browser/device and offline on any OS that supports node.js (pretty much everything). Not least, Javascript is a lot of fun! 

One downside is a hit in performance compared with traditionally compiled languages like C etc; but the JIT compiler in Google's V8 Javascript engine (that sits in node.js and the Chrome browser) is quite extraordinary. Another is that there are no native 64 bit integer values (there are 53 usable bits in the native Javascript Number type). Recently-ish however the concept of a BigInt was introduced - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt - which may suffice depending on performance; I have not tried them. Lozza uses Typed-Arrays and 2 32bit values for it's hash - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays.  

## Example use in a web  project

```Javascript
var lozza = new Worker('lozza.js');

lozza.onmessage = function (e) {
  $('#dump').append(e.data);      //assuming jquery and a div called #dump
                                  //parse messages from here as required
};

lozza.postMessage('uci');         // get build etc
lozza.postMessage('ucinewgame');  // reset TT
lozza.postMessage('position startpos');
lozza.postMessage('go depth 10'); // 10 ply search
```

Try this example here https://op12no2.github.io/lozza-ui/ex.htm.

You do not have to use a web worker or the UCI interface, but you will not be able to update a web page until Lozza returns - see for example texeltune.js in the tuning folder above, which just includes lozza.js and uses it's function interface directly. While that is a node.js example, the same can be done in web pages.

## Playing Lozza online

A sister project - https://github.com/op12no2/lozza-ui - has some example user interfaces for playing and analysing with Lozza, which you can try out here - https://op12no2.github.io/lozza-ui.

## Playing Lozza offline in Arena, Winboard, Cutechess etc UIs

Lozza can be used in chess UIs like WinBoard, Arena and CuteChess by using node.js - https://nodejs.org - as the engine executable and lozza.js as a parameter
to it. Full paths for both are recommended. node.js and Lozza do not need to be in the same folder. If the UI does not support engine parameters, create a batch file (say lozza.bat) containing something like:-

```
"c:\program files\nodejs\node.exe" c:\path\to\lozza.js 
```

Then use lozza.bat as the engine target; similarly for Linux/Mac.  

Alternatively you can package node and Lozza into a Windows/Linux/Mac executable using a node.js extension; for example - https://dev.to/jochemstoel/bundle-your-node-app-to-a-single-executable-for-windows-linux-and-osx-2c89.

## Online testing

Perft - https://op12no2.github.io/lozza-ui/perft.htm - various Perft tests - the final one takes 25 seconds on my machine doing about 5M nps.

## Offline tuning/testing

The tuning and testing directories of this repo contain some node.js Javascript utilities. They should be pretty easy to adapt to other Javascript engines. Run using node.js, for example:-

```
node texeltune.js
```

You can also fire up Lozza in node.js form the command line and enter UCI commands. i.e.:-

```
node lozza.js
```

Then for example:-

```
uci
ucinewgame
position startpos
board
go depth 10
```

See the LozUCI class for a complete list of commands that Lozza can handle. See also here - https://op12no2.github.io/lozza-ui/consolehelp.htm. 

## Notes

lozza.js is folded using {{{ and }}} (emacs convention) and most easily read using an editor with a folding capability.

## Acknowledgements

In Lozza 1.xy versions the piece values and PSTs were from Fabian Letouzey's Fruit 2.1. In 2.00 and later versions they have been tuned using Peter Österlund's method ("Texel tuning") into values unique to Lozza. The initial tuning data was quiet-labeled.epd published by Alexandru Moșoi, the Zurichess author. Later tuning data came from Lozza self-play. Similarly, Lozza's evaluation function was initially a subset of Fruit 2.1, but is gradaully moving towards something unique to Lozza. The search algorithms etc. are all from the Chess Programming Wiki edited by Gerd Isenberg; which has been - and still is invaluable. Harm Geert Muller was very generous with his time on the computer chess discussion forums. Lozza was kindly taken up and tested by Graham Banks and Gabor Szots et al. at CCRL - and included in their rating lists. Before using node.js, Lozza ran in Edmund Moshammer's jsUCI stdin/stdout V8 container.  I use a fabulous PGN/EPD utility called pgn-extract written by David J. Barnes. Lozza soak testing is performed using the freely available and totally amazing Cutechess command-line and UI applications written by Ilari Pihlajisto and Arto Jonsson.
