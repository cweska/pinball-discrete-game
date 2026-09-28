#!/usr/bin/env node
/**
 * Generates docs/TEACHER-GUIDE.md from the level pack.
 *
 * The answer key, the parts bin, the NANDGAME tie-in and the hint ladder all
 * live in the level files, so generating the guide means it cannot drift out of
 * date. Run `npm run guide` after editing any level.
 */

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { ACTS, LEVELS } from '../src/levels/index.js';
import { gateDef } from '../src/engine/gates.js';
import { goalTable } from '../src/engine/validator.js';

const OUT = resolve(import.meta.dirname, '..', 'docs', 'TEACHER-GUIDE.md');

function partsBin(level) {
  return level.palette.map((entry) => `${entry.count} x ${gateDef(entry.type).label}`).join(', ');
}

function truthTable(level) {
  const table = goalTable(level);
  if (!table) return null;
  const head = [...table.inputs.map((t) => t.label), ...table.outputs.map((t) => t.label)];
  const rows = table.rows.map((row) => [...row.in, ...row.out.map((v) => (v == null ? '-' : v))]);
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function sequenceSteps(level) {
  return level.spec.scenarios
    .map((scenario) => {
      const steps = scenario.steps
        .map((step) => {
          const wants = Object.entries(step.expect || {})
            .map(([id, value]) => {
              const terminal = level.io.outputs.find((t) => t.id === id);
              return `${terminal ? terminal.label : id} = ${value}`;
            })
            .join(', ');
          return `   - ${step.note || 'next step'}${wants ? ` -> ${wants}` : ''}`;
        })
        .join('\n');
      return `1. **${scenario.name}**\n${steps}`;
    })
    .join('\n');
}

function levelSection(level) {
  const lines = [];
  lines.push(`### ${level.number}. ${level.title}`);
  lines.push('');
  lines.push(`**What comes alive:** ${level.brief.goal}`);
  lines.push('');
  lines.push(`**Parts bin:** ${partsBin(level)}  `);
  lines.push(
    `**Bench:** ${level.placement === 'slots' ? 'gates drop into fixed sockets' : 'gates go anywhere'}, ${
      level.wiring === 'fixed' ? 'wiring already done' : 'student draws the wiring'
    }`
  );
  lines.push('');
  lines.push(`**Answer:** ${level.teacher.answer}`);
  lines.push('');
  lines.push(`**Follows NANDGAME:** ${level.teacher.nandgame}  `);
  lines.push(`**Vocabulary:** ${level.teacher.vocab.join(', ')}`);
  lines.push('');

  const table = truthTable(level);
  if (table) {
    lines.push('<details><summary>Truth table the game checks</summary>');
    lines.push('');
    lines.push(table);
    lines.push('');
    lines.push('</details>');
  } else {
    lines.push('<details><summary>Test sequence the game runs</summary>');
    lines.push('');
    lines.push(sequenceSteps(level));
    lines.push('');
    lines.push('</details>');
  }
  lines.push('');
  lines.push('<details><summary>Hint ladder (what the game will eventually say)</summary>');
  lines.push('');
  level.hints.forEach((hint, index) => lines.push(`${index + 1}. ${hint}`));
  lines.push('');
  lines.push('</details>');
  lines.push('');
  return lines.join('\n');
}

const HEADER = `# GATECRASHER - teacher guide

> Generated from the level files by \`npm run guide\`. Edit the levels in
> \`src/levels/\`, not this file.

GATECRASHER hands a student an almost-finished pinball machine. Thirteen of its
features are dead, and each one comes alive when the student builds the logic
circuit behind it out of NAND, INVERT, AND, OR and XOR gates. The machine is the
feedback: a wrong circuit means the flipper does not move, the bumper fires when
nobody is playing, or the lamp forgets it was ever lit.

## What students need first

- Converting between decimal and binary, and why a machine cares.
- The basic gate set: NAND, AND, OR, INVERT, XOR, and what each one answers.
- NANDGAME through the logic-gate levels. Act 3 leans directly on the trick they
  learned there, that a NAND with both pins tied together is an inverter.

Act 4 goes one step past what they have seen and builds a cross-coupled NAND
latch. That is deliberately a preview of NANDGAME's next unit, so the game
introduces it slowly, with a single latch driving a single lamp.

## How to run it in class

Open the published URL and hand it out - nothing to install, no accounts, and
progress is saved in each browser. Useful URLs:

| URL | What it does |
| --- | --- |
| \`index.html\` | Starts where the student left off |
| \`index.html?level=7\` | Jumps straight to a level |
| \`index.html?unlock=all\` | Opens every level on that device (teacher demo, or a student who needs to skip) |
| \`index.html?reset=1\` | Wipes progress on that device (shared Chromebooks) |

Everything works offline once the page has loaded, and everything works from the
keyboard: Tab moves between parts, sockets and pins, Enter picks up a gate and
Enter again drops it, Enter on two pins draws a wire between them.

## Pacing

The four acts are stepped so that each one changes exactly one thing about the
difficulty.

| Act | Levels | What is new | Roughly |
| --- | --- | --- | --- |
| 1. Wake It Up | 1-3 | One gate, one socket, wiring already done | A short first sitting |
| 2. Rules Take Shape | 4-6 | Two or three gates, then the student wires it, then free placement | One sitting |
| 3. Make Do | 7-9 | Build AND and INVERT out of NANDs; several outputs at once | One sitting |
| 4. The Machine Remembers | 10-13 | Feedback, latches, stored state | Two sittings |

After level 13, Free Play turns the machine loose: a ball runs the playfield and
every circuit the student built drives it at once. It is worth projecting.

## Things worth stopping the class for

- **Active-low switches (level 1).** Real pinball switches close to ground, so
  the line rests at 1 and drops to 0. Nearly every student's first instinct is
  that pressing a button sends a 1. The tutorial exists to break that.
- **Fan-out (level 5).** One output pin can feed as many inputs as you like.
  Students often try to build the same term twice instead.
- **NAND is universal (level 7).** The parts crate runs out on purpose. Tying
  both pins of a NAND together gives an inverter for free.
- **Shared terms (level 9).** The ARMED lamp and the kickback coil ask almost
  the same question. Reusing one gate's answer is both fewer parts and a
  guarantee the lamp can never lie about what the coil will do.
- **The illegal state (level 12).** Pressing both flipper buttons at once drives
  both lamps on, which is impossible for a real lane change. Let them find it.
- **Why a latch is refused earlier.** Combinational levels are checked from both
  a LOW and a HIGH power-up, so a circuit that remembers anything is rejected
  with "this circuit remembers things it should not". That is not a bug to work
  around; it is the definition of combinational.

## How the game supports a stuck student

- Hints arrive on their own: a nudge after about two minutes on a level, a
  sharper one ninety seconds later, then a third that points at the socket but
  still leaves the placing to them. The Hint button does the same on demand, and
  three failed checks in a row moves the ladder along.
- A failed check names the exact case that breaks, and offers to set the test
  switches to that case so the student can watch it happen.
- Nothing is ever solved for them, and nothing is penalised. Hint use is stored
  per level if you want to look at it.

## Answer key

`;

const FOOTER = `## Discussion questions

1. Level 1 needed an inverter because the switch was active low. What would
   happen to the rest of the machine if the factory changed every switch to
   close to +5V instead?
2. Level 5 used three ANDs for four targets. How many would you need for six
   targets? For twenty?
3. Level 7 built AND and INVERT out of NANDs. Could you build XOR out of NANDs
   too? How many would it take?
4. Level 8 lights exactly one of three lamps from two switches. Two switches can
   count to three. How many lamps could four switches pick between?
5. Level 10 is the first circuit with a wire running backwards. Why does that one
   wire change what the circuit can do?
6. In level 12, what should a real machine do if both buttons are pressed at the
   same instant? Whose job is it to decide?

## If something goes wrong

- Nothing appears: the game needs to be served over http, not opened as a file.
  \`npm start\` or \`python3 -m http.server 8000\` from the project folder.
- No sound: browsers hold audio until the first click anywhere on the page. The
  Sound button in the top bar also toggles it, and the setting sticks.
- A bench looks scrambled after an update to the level pack: \`index.html?reset=1\`
  clears saved work on that device.
`;

const body = ACTS.map((act) => {
  const levels = LEVELS.filter((level) => level.act === act.act);
  return [`## Act ${act.act}. ${act.title}`, '', `_${act.blurb}_`, '', ...levels.map(levelSection)].join('\n');
}).join('\n');

await writeFile(OUT, `${HEADER}${body}\n${FOOTER}`, 'utf8');
console.log(`Wrote ${OUT}`);
