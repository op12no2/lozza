WIP rewrite going back to Lozza's roots.

### Lozza

A hand-coded Javascript UCI chess engine that is easily deployed in web-based projects.

Lozza can be used with chess user interfaces like CuteChess via Node, which is available for most platforms.

Lozza (currently) uses the PESTO evaluation function.

```lozza.js``` in the repo root is usable and currently around 2350 elo.

### Limitations

- No ```stop``` command.
- No multi-threading.
- No pondering.
- No multi-PV.

### Examples

Note that ```lozza.js``` must be invoked in a web worker.

- https://op12no2.github.io/lozza-ui/ex.htm
- https://op12no2.github.io/lozza-ui/

