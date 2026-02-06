WIP rewrite with new goals.

### Lozza

A Javascript UCI chess engine.

### Goals

- Interesting playing style.
- Released in a single file as hand-coded Javascript so that it can be easily tweaked/deployed by users.
- Binaries for Windows, Linux and Mac Arm/x86 for use with chess user interfaces.
- Binaries must embed a Javascript run-time (not be a result of a port to C for example).
- i.e. regardless of platform or delivery, Lozza is always running as Javascript.

### Features

- Hand coded evaluation.
- 0x88 board and move generation.
- Principal Variation Search.

### Limitations

- No ```stop``` command.
- No multi-threading.
- No pondering.

### Examples

```lozza.js``` must be invoked with a web worker.

- https://op12no2.github.io/lozza-ui/
- https://op12no2.github.io/lozza-ui/ex.htm





