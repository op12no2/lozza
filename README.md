# Lozza

A UCI Javascript chess engine.

Lozza was primarily created for use in web pages, but from v1.13 can also be used on the command line via Node. 

## Web use

All you need is ```lozza.js``` from a [release's](https://github.com/op12no2/lozza/wiki/Release-overview) Assets section.  

This [repo](https://github.com/op12no2/) has lots of examples and also specifies the command repertoire.

## Command line use

```
node lozza.js                                       # interactive, quit to close 
node lozza.js uci "position startpos" "go depth 10" # execute commands then quit 
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
