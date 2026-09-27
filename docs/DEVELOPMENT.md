# Working on GATECRASHER

Notes for whoever picks this up next. `README.md` covers running it and the file
layout; this is the stuff you would otherwise have to re-derive from the code.

## Ground rules of the project

- **No build step, ever.** Plain ES modules loaded straight from `index.html`.
  Nothing is transpiled or bundled, and `package.json` has no dependencies. If a
  change would need npm packages at runtime, it is the wrong change.
- **Art stays inline SVG.** Table sounds are the WAV clips in `assets/sounds/`,
  played from `src/machine/audio.js`. Bench cues (place, wire, reject, solved)
  are still synthesised there.
- **Levels are data.** A new level should be a new file in `src/levels/` plus one
  line in `src/levels/index.js`. If it needs engine changes, the engine is
  probably missing an abstraction.
- **The engine stays DOM-free.** Everything under `src/engine/` is testable in
  Node, and the test suite depends on that. Rendering concerns live in
  `src/ui/` and `src/machine/`.

## Invariants worth not breaking

1. **The simulator settles by relaxation.** `settle()` re-evaluates every gate in
   insertion order, repeatedly, until no output changes or it hits `MAX_PASSES`.
   That is what makes a cross-coupled NAND latch work with no clock, and it is
   why a ring of inverters is reported as `oscillating` instead of hanging.
   Do not "optimise" it into a single topological pass - Act 4 depends on the
   loop.
2. **Combinational levels are checked from two power-up seeds.** `validate()`
   runs every input combination with gate memory seeded LOW and again seeded
   HIGH. Disagreement means the circuit remembers something, and it is rejected
   as `unstable`. This is the only thing stopping a student from "passing" a
   combinational level with a latch.
3. **An empty socket is undriven, not zero.** `sourceValue()` returns `undefined`
   for a wire coming out of a slot with no gate in it, so the bench can draw the
   pre-wired leads of a half-built level in grey. Anything reading wire values
   has to handle `driven: false`.
4. **Wire ids come from one module-level counter.** Both `connect()` and
   `restore()` mint fresh ids, because a restored bench from localStorage would
   otherwise collide with newly drawn wires and corrupt the render map.
5. **Every machine part is declared once, in `src/machine/parts.js`.** Levels
   bind to part ids and the playfield renders from the same manifest. A test
   fails if a level binds to a part that does not exist.

## Level schema

Read `src/levels/level-01-flipper.js` (smallest) and
`src/levels/level-13-multiball.js` (largest) and the shape is obvious. The fields
that are easy to get wrong:

- `placement: 'slots' | 'free'` and `wiring: 'fixed' | 'student'` are
  independent. The three combinations actually used are the difficulty ramp:
  sockets with the wiring done (levels 1-4), sockets but the student wires the
  interconnects (level 5), free placement and full wiring (6 onwards). A test
  asserts levels never go back to sockets after going free.
- `io.inputs[].rest` is the idle value of that switch line. `rest: 1` means an
  active-low switch, and the test controls derive "pressed" as `1 - rest`.
- `prewired` endpoints may reference a socket id that has no gate in it yet.
  That is intentional; see invariant 3.
- `reference` is never shown to students. It exists so the test suite can prove
  the level is solvable, and so the last hint tier knows where to point.
- `spec.kind: 'truthTable'` takes either explicit `rows` or an `expect(inputs)`
  function that gets swept exhaustively. `'sequence'` takes `scenarios` with
  steps, and is the only way to test something that has to hold a value.
- `machine.bind` maps an output id to one part id or an array of them.
  `machine.inputBind` drives an indicator lamp straight from an input (the TILT
  lamp), and `machine.targetInputs` drops the physical drop targets.

After touching any level: `npm test` (integrity checks are per-level, so you will
see exactly which one broke) and `npm run guide` to regenerate the teacher guide.

## Where the moving parts live

- `src/ui/app.js` is the controller and owns the frame loop. Each frame it picks
  the input values (student's test controls if they are driving, otherwise the
  demo clock), settles the circuit, paints the bench, and pushes part states into
  the machine. Sound and scoring are suppressed while the demo clock is driving,
  which is why the machine is animated but quiet between interactions.
- `src/ui/bench.js` is the editor. Structural changes re-render the whole SVG
  (it is tiny); `paint()` only touches classes and dot positions, so it is safe
  to call at 60fps.
- `src/ui/geometry.js` is the single source of truth for where a pin is. The
  renderer, the drag handlers, the wire paths and the flow dots all read it.
- `src/machine/playfield.js` tracks previous values itself to spot rising edges,
  which is what makes a coil thunk once instead of every frame.

## Verifying a change

```bash
npm test          # 133 tests, engine + level pack + module link check
npm start         # then click through the level you touched
npm run guide     # if you changed level copy or answers
```

The link-check test in `tests/modules.test.js` imports every module under `src/`
except `main.js`. In a no-build project that is the only cheap defence against a
symbol imported from the wrong file, so keep new modules importable without a
DOM at load time (touch `document` inside functions, not at the top level).

## Known gaps and things deliberately left out

- **No real ball physics.** By design: the machine is animated and its ball is
  scripted (`src/machine/freeplay.js`), so attention stays on the logic.
- **Free Play is a fixed script.** `SCRIPT` is a waypoint list, and events are
  mapped to level inputs by `EVENT_INPUTS`. `tests/levels.test.js` checks that
  every mapping names a real level input; if you rename an input id, that test
  fails.
- **Hint timing is not configurable in the UI.** Constants at the top of
  `src/ui/hints.js` (first hint at 120s of visible time, then 90s apart).
- **No teacher dashboard.** Progress is per-device localStorage only. Hint tiers
  are stored per level if that is ever wanted for assessment.
- **Narrow screens stack the panels** below 1100px and the page scrolls. Tested
  for laptop and Chromebook shapes; phones work but are cramped.
