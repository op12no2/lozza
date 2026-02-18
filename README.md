# Lozza

Lozza is a UCI chess engine. As a command line program it needs a chess user interface to operate within; e.g. CuteChess, Arena etc.

Releases 2 to 9 were written in Javascript and can be easily deployed in web projects.

For release 10 onwards, Lozza was translated into C and is available as a binary.

## Command extensions

- quit/q - close Lozza.
- bench/h - get a node count over a collection of searches.
- eval/e - display an evaluation for the current position.
- board/b - display the board for the current position.
- perft/f _d_ - performs a PERFT search to depth _d_ on the current position.
- pt [_d_] - perform a set of PERFT searches. If _d_ is present depths greater than _d_ are skipped.
- et - perform a collection of test evaluations.

Commands can be given on the command line, for example: ```./lozza ucinewgame "position startpos" b "go depth 10"```.

## References

- https://www.chessprogramming.org/Main_Page - Chess programming wiki
- https://computerchess.org.uk/ccrl/4040 - CCRL rating list
- https://backscattering.de/chess/uci - UCI protocol
- https://talkchess.com - Talkchess forums

## Acknowledgements

- https://www.chessprogramming.org/Fruit - Early versions of Lozza used a HCE based on Fruit 2.1
