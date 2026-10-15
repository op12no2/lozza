# Lozza

A UCI chess engine written in Javascript.

Lozza was primarily created for use in web pages, but more recent versions can also be used on the command line via Node. 

## Web use

All you need is ```lozza.js``` from a [release's](https://github.com/op12no2/lozza/wiki/Release-overview) Assets section.  

Examples:-

- [Hello world](https://op12no2.github.io/lozza/examples/hello.html)
- [Stop command](https://op12no2.github.io/lozza/examples/stop.html) 
- [Promise wrapper](https://op12no2.github.io/lozza/examples/promise.html)
- [Multi PV analysis](https://op12no2.github.io/lozza/examples/analysis.html)
- [Loading via CDN](https://op12no2.github.io/lozza/examples/cdn.html)

If you would like to try the latest development Lozza, use `./examples/lozza.js` which has the net embedded like release versions and is up to date with all commits. 

Note that development and release versions can also be accessed via CDN as per the example above.

## Command line use

```
node lozza.js                                            # interactive, quit to close 
node lozza.js uci "position startpos" "go depth 10 quit" # execute commands then quit 
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
