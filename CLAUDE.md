# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Liminal is a web-based MIDI sequencer that communicates with DAWs using Web MIDI API. It's a single-page application with no build system - just vanilla JavaScript files loaded directly via script tags in `liminal.html`.

Live preview: https://op12no2.github.io/liminal/liminal.html

## Development

To run locally, serve the files with any static HTTP server:
```bash
python -m http.server 8000
# or
npx serve .
```

Then open `liminal.html` in Chrome or Firefox (Safari doesn't support Web MIDI).

No build step, linting, or tests are configured.

## Architecture

### Script Load Order (defined in liminal.html)
Scripts must load in this specific order due to dependencies:
1. `theme.js` - Color constants used by UI components
2. `globals.js` - State variables, data structures (Node, Link, Note), constants, DOM references
3. `ui.js` - DOM utility functions (setText, setStatus, addClass/removeClass)
4. `note.js` - Pitch/note conversion helpers (pitchToNote, quantiseNote, etc.)
5. `node.js` - Node/link creation, deletion, selection, and performance scheduling
6. `canvas.js` - Canvas rendering and pointer event handling
7. `button.js` - SVG-based Button class with icon rendering
8. `knob.js` - Knob class for rotary controls
9. `midi.js` - Web MIDI initialization and note on/off messaging
10. `inspector.js` - Right panel UI for editing nodes, links, and settings
11. `io.js` - JSON serialization for save/load functionality
12. `liminal.js` - Main sequencer loop (seqStart, seqStop, seqLoop)
13. `init.js` - Application initialization, event binding, button setup

### Core Data Model (globals.js)

**Node**: Represents a note on the canvas with properties:
- Position (x, y), pitch, velocity, duration, articulation, channel
- `leadin: boolean` - Lead-in nodes start the sequence
- `links: Link[]` - Connections to other nodes

**Link**: Weighted connection between nodes
- `weight: 0-11` (0=never, 11=always, 1-10=probability weights)
- `destNode: Node` - Target node reference

**Note**: Runtime state for a scheduled/playing note
- States: IDLE (0), SCHEDULED (1), GATED (2), RESTING (3), PLAYED (4)
- Pool of NODE_POOL (16) reusable Note objects

### Sequencer Logic (liminal.js)

The sequencer uses Web Audio API's `audioContext.currentTime` for precise timing:
1. `seqStart()` - Finds lead-in nodes, schedules them, starts the loop
2. `seqLoop()` - Runs at 1/32 note intervals, processes state transitions
3. After a note finishes playing (PLAYED state), weighted random selection chooses next nodes via links

### Canvas Interaction (canvas.js)

- Ctrl/Cmd + click on empty space: Create new node
- Click node: Select it
- Drag node: Move it
- Ctrl/Cmd + drag from node to node: Create link
- Ctrl/Cmd + drag from node to empty: Create linked node
- Double-click node: Toggle lead-in status (grey = lead-in)
- Delete/Backspace: Delete selected node
- Click link: Select it (for weight editing)

### Inspector Panel (inspector.js)

Three views controlled by what's selected:
- `redrawInspectorSettings()` - Global BPM, key, scale, spread, dynamics
- `redrawInspectorNode()` - Note pitch, octave, length, articulation, channel, velocity
- `redrawInspectorLink()` - Link weight (never to always)

### Save/Load Format (io.js)

JSON format with version number, global settings, and nodes array. Links store destination by index (`destIndex`) which is resolved to node references on load.
