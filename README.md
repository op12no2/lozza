# Lozza

A UCI chess engine written in Javascript.

Lozza was primarily created for use in web pages, but more recent versions can also be used on the command line via Node. 

## Web use

All you need is ```lozza.js``` from a [release's](https://github.com/op12no2/lozza/wiki/Release-overview) Assets section.  

Examples:-

- [Hello world](https://op12no2.github.io/lozza/examples/hello_world.html)

If you would like to try the latest pre-release, use `./examples/lozza.js` which has the net embedded like release versions.

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
