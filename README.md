# GATECRASHER

A discrete-logic game for middle school. Students are handed an almost-finished
electro-mechanical pinball machine with thirteen dead features, and each one
comes alive when they build the logic behind it out of NAND, INVERT, AND, OR and
XOR gates.

The machine is the feedback. A wrong circuit does not print an error - the
flipper stays limp, the pop bumper fires when nobody is playing, or the lock lamp
forgets the ball was ever there.

- No build step, no dependencies, no accounts.
- Every sound is synthesised, so there are no media files.
- Progress lives in the browser and the whole thing works offline.

## Run it

Browsers refuse to load ES modules from a `file://` URL, so it has to be served:

```bash
npm start              # node, no dependencies to install
# or
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

To hand it to a class, push to a GitHub repository with Pages enabled - the
included workflow publishes the folder as-is and gives you a URL.

## Useful URLs

| URL | What it does |
| --- | --- |
| `?level=7` | Jump straight to a level |
| `?unlock=all` | Open every level on this device |
| `?reset=1` | Wipe saved progress on this device |

## What is in it

Thirteen builds across four acts. Each act changes exactly one thing about the
difficulty, so the ramp is never two steps at once.

| Act | Levels | What is new |
| --- | --- | --- |
| 1. Wake It Up | Flipper Live, Pop Bumper, Slingshot | One gate, one socket, wiring already drawn |
| 2. Rules Take Shape | Tilt Guard, Drop Target Bank, Mystery Award | Several gates, then the student wires it, then free placement |
| 3. Make Do | Parts Shortage, Bonus Multiplier, Kickback | AND and INVERT built from NANDs; several outputs at once |
| 4. The Machine Remembers | Lock 1, Ball Saver, Lane Change, MULTIBALL | Feedback, cross-coupled NAND latches, stored state |

Then Free Play: a ball runs the playfield on its own and every circuit the
student built drives it at once.

`docs/TEACHER-GUIDE.md` has the answer key, the NANDGAME level each build follows
from, the vocabulary per act, and the misconceptions worth stopping the class
for. It is generated from the level files with `npm run guide`.

## Tests

```bash
npm test
```

The engine is DOM-free on purpose so it can be tested directly. The suite covers
gate truth tables, the settling simulator, latch set/reset/hold, oscillation
detection, and every level's integrity. The important one is that **each level's
reference solution is run through that level's own validator**, which proves
mechanically that all thirteen puzzles are solvable with the parts they hand out.
There is also a link check that imports every module, which catches a symbol
imported from the wrong file - the one class of bug a no-build project otherwise
only finds in the browser.

## How it fits together

```
index.html            shell markup; styles/ is two files, tokens then game
src/engine/           no DOM in here
  gates.js            the five gate types and their truth functions
  circuit.js          graph model: terminals, gates, slots, wires
  simulate.js         relaxes gate outputs until they stop changing
  validator.js        exhaustive sweep, or scripted sequences for stateful levels
src/levels/           thirteen data-only level files plus the registry
src/machine/          parts.js manifest, playfield.js visuals, audio.js synth,
                      freeplay.js scripted ball
src/ui/               app.js controller, bench.js editor, plus palette, controls,
                      hud, overlays, hints, pulse, geometry
src/state/progress.js localStorage
```

A level is pure data - inputs, outputs, the parts bin, where the sockets are,
what the circuit has to do, a reference solution, which machine parts its outputs
drive, its test controls and its three hints. Adding or reordering a level does
not touch engine code. Start from `src/levels/level-01-flipper.js`; it is the
smallest one.

Two engine decisions are worth knowing before changing anything:

- **The simulator relaxes in place until nothing changes.** That is what makes a
  cross-coupled NAND latch work without a clock, and it reports a circuit that
  never settles rather than hanging.
- **Combinational levels are checked from both a LOW and a HIGH power-up.** If
  the two runs disagree, the circuit is remembering something and is rejected.
  That is how a latch is kept out of a level that is supposed to be
  combinational.
