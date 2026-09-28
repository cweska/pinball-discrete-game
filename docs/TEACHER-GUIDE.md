# GATECRASHER - teacher guide

> Generated from the level files by `npm run guide`. Edit the levels in
> `src/levels/`, not this file.

GATECRASHER hands a student an almost-finished pinball machine. Thirteen of its
features do not work yet. Each one starts working when the student builds the
logic circuit behind it from NAND, INVERT, AND, OR, and XOR gates. The machine
shows the result: a wrong circuit means the flipper does not move, the bumper
fires when nobody is playing, or the lamp turns off as soon as the switch opens.

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
| `index.html` | Starts where the student left off |
| `index.html?level=7` | Jumps straight to a level |
| `index.html?unlock=all` | Opens every level on that device (teacher demo, or a student who needs to skip) |
| `index.html?reset=1` | Wipes progress on that device (shared Chromebooks) |

Everything works offline once the page has loaded, and everything works from the
keyboard: Tab moves between parts, sockets and pins, Enter picks up a gate and
Enter again drops it, Enter on two pins draws a wire between them.

## Pacing

The four acts are stepped so that each one changes exactly one thing about the
difficulty.

| Act | Levels | What is new | Roughly |
| --- | --- | --- | --- |
| 1. First Gates | 1-3 | One gate, one socket, wiring already done | A short first sitting |
| 2. Gates Together | 4-6 | Two or three gates, then the student connects the wires, then free placement | One sitting |
| 3. NAND Only | 7-9 | Build AND and INVERT from NAND gates; several outputs at once | One sitting |
| 4. Memory Circuits | 10-13 | Feedback, memory circuits, stored state | Two sittings |

After level 13, Free Play runs the machine on its own. A ball moves around the
playfield, and every circuit the student built controls it. It is worth projecting.

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
  with "This circuit remembers an old value." That is not a bug to work around.
  It is the definition of a circuit that should depend only on the inputs.

## How the game supports a stuck student

- Hints arrive on their own: a nudge after about two minutes on a level, a
  sharper one ninety seconds later, then a third that points at the socket but
  still leaves the placing to them. The Hint button does the same on demand, and
  three failed checks in a row moves the ladder along.
- A failed check names the exact case that breaks, and offers to set the test
  switches to that case so the student can watch it happen.
- Nothing is ever solved for them, and nothing is penalized. Hint use is stored
  per level if you want to look at it.

## Answer key

## Act 1. First Gates

_One gate. The wires are already connected._

### 1. Flipper Live

**The job:** Make the left flipper move while the left button is held down.

**Parts bin:** 1 x INVERT  
**Bench:** gates drop into fixed sockets, wiring already done

**Answer:** One INVERT gate sits between the button and the coil. Pressing the button sends 0, and INVERT turns that 0 into 1, so the coil turns on.

**Follows NANDGAME:** Invert  
**Vocabulary:** active low, inverter

<details><summary>Truth table the game checks</summary>

| BTN | COIL |
| --- | --- |
| 0 | 1 |
| 1 | 0 |

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. Hold the test button. Watch the number on LEFT BUTTON. Then look at what LEFT FLIPPER COIL needs in order to turn on.
2. Pressing the button sends 0. The coil turns on when it gets 1. You need a gate that swaps 0 and 1.
3. Drag the INVERT gate from the parts bin into the empty socket.

</details>

### 2. Pop Bumper

**The job:** Fire the pop bumper only when a ball hits it during a game.

**Parts bin:** 1 x AND  
**Bench:** gates drop into fixed sockets, wiring already done

**Answer:** One AND gate. The coil is 1 only when the skirt is 1 and GAME ON is 1.

**Follows NANDGAME:** And  
**Vocabulary:** AND, conjunction

<details><summary>Truth table the game checks</summary>

| SKIRT | GAME | COIL |
| --- | --- | --- |
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | 1 |

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. Tap the bumper with the Game button on. Then turn Game off and tap the bumper again. The coil should fire only the first time.
2. The coil turns on only when both inputs are 1: the skirt is hit, and the game is running.
3. Put the AND gate in the socket. The wires to its two inputs are already connected.

</details>

### 3. Slingshot

**The job:** Kick the ball when it touches the upper switch or the lower switch.

**Parts bin:** 1 x OR  
**Bench:** gates drop into fixed sockets, wiring already done

**Answer:** One OR gate. The coil is 1 when either switch is 1. It is 0 only when both switches are 0.

**Follows NANDGAME:** Or  
**Vocabulary:** OR, disjunction

<details><summary>Truth table the game checks</summary>

| UP | LWR | COIL |
| --- | --- | --- |
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 1 |

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. On the last level, both inputs had to be 1. Here, either input is enough.
2. The upper switch alone should kick. The lower switch alone should kick. Both switches at once should still kick.
3. Put the OR gate in the socket. OR outputs 1 when at least one input is 1.

</details>

## Act 2. Gates Together

_Use more than one gate, then connect the wires yourself._

### 4. Tilt Guard

**The job:** The right flipper works when its button is held, unless the machine is tilted.

**Parts bin:** 1 x INVERT, 1 x AND  
**Bench:** gates drop into fixed sockets, wiring already done

**Answer:** INVERT the tilt wire, then AND that result with the button. The coil is 1 only when the button is 1 and tilt is 0.

**Follows NANDGAME:** And / Invert  
**Vocabulary:** negation, guard condition

<details><summary>Truth table the game checks</summary>

| BTN | TILT | COIL |
| --- | --- | --- |
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. The coil should be 1 when the button is 1 and TILT is 0. Only one of your two gates can turn a 0 into a 1.
2. Turn the tilt signal into its opposite before it reaches the AND gate. Then AND can check "button is on" and "tilt is off" together.
3. Put INVERT in the socket with one wire coming in. Put AND in the socket with two wires coming in.

</details>

### 5. Drop Target Bank

**The job:** Open the diverter and light the jackpot only when all four targets are down.

**Parts bin:** 3 x AND  
**Bench:** gates drop into fixed sockets, student draws the wiring

**Answer:** AND targets G and A. AND targets T and E. AND those two results, and connect that output to both the diverter coil and the jackpot lamp.

**Follows NANDGAME:** And (chained)  
**Vocabulary:** fan-out, chaining gates

<details><summary>Truth table the game checks</summary>

| G | A | T | E | GATE | JACK |
| --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 | 0 |
| 0 | 0 | 0 | 1 | 0 | 0 |
| 0 | 0 | 1 | 0 | 0 | 0 |
| 0 | 0 | 1 | 1 | 0 | 0 |
| 0 | 1 | 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 1 | 0 | 0 |
| 0 | 1 | 1 | 0 | 0 | 0 |
| 0 | 1 | 1 | 1 | 0 | 0 |
| 1 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0 | 0 | 1 | 0 | 0 |
| 1 | 0 | 1 | 0 | 0 | 0 |
| 1 | 0 | 1 | 1 | 0 | 0 |
| 1 | 1 | 0 | 0 | 0 | 0 |
| 1 | 1 | 0 | 1 | 0 | 0 |
| 1 | 1 | 1 | 0 | 0 | 0 |
| 1 | 1 | 1 | 1 | 1 | 1 |

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. An AND gate has only two inputs, and you have four targets. Each left socket checks one pair: G with A, and T with E. You still need to check that both pairs are down.
2. Put an AND gate in the empty socket. Connect the G-and-A output to one of its inputs, and the T-and-E output to the other. That output is 1 only when all four targets are down.
3. Connect that last AND output to both DIVERTER COIL and JACKPOT LAMP. One output pin can have two wires.

</details>

### 6. Mystery Award

**The job:** Light MYSTERY when exactly one ramp is made. Spin the gate wheel when both ramps are made.

**Parts bin:** 1 x XOR, 1 x AND  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** XOR of the two ramps goes to the mystery lamp. AND of the two ramps goes to the gate wheel. Both ramp wires connect to both gates.

**Follows NANDGAME:** Xor  
**Vocabulary:** exclusive or, fan-out

<details><summary>Truth table the game checks</summary>

| LEFT | RIGHT | MYST | WHEEL |
| --- | --- | --- | --- |
| 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | 1 |

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. Look at the two outputs separately. MYSTERY is on when the ramps are different. The wheel is on when both ramps are 1.
2. XOR outputs 1 only when its two inputs are different. Use XOR for the mystery lamp. Use AND for the wheel. AND is the same "both must be 1" rule as the pop bumper.
3. Connect both ramp inputs to the XOR gate, and both ramp inputs to the AND gate. Then connect XOR to MYSTERY LAMP and AND to GATE WHEEL.

</details>

## Act 3. NAND Only

_Build the gates you need from NAND gates._

### 7. Parts Shortage

**The job:** Fire the upper pop bumper when its skirt is hit, unless the machine is tilted. Use only NAND gates.

**Parts bin:** 3 x NAND  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** Three NAND gates. NAND with tilt on both inputs makes NOT tilt. NAND of the skirt and NOT tilt is the answer flipped. A third NAND with that signal on both inputs flips it back.

**Follows NANDGAME:** Invert / And built from NAND  
**Vocabulary:** universal gate, De Morgan

<details><summary>Truth table the game checks</summary>

| SKIRT | TILT | COIL |
| --- | --- | --- |
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. Connect the tilt wire to both inputs of one NAND gate. Watch the output. It is the opposite of tilt.
2. NAND is AND with the answer flipped. Build the condition you want, then flip the answer back with another NAND used as an INVERT.
3. Use three NAND gates. The first gets tilt on both inputs, so its output is NOT tilt. The second gets the skirt and that NOT tilt. That output is the opposite of what the coil needs. The third gets that output on both inputs, which flips it to the right answer. Connect the third output to the coil.

</details>

### 8. Bonus Multiplier

**The job:** Light 2X at position 01, 3X at position 10, and 4X at position 11. At 00, all three lamps stay off.

**Parts bin:** 2 x INVERT, 3 x AND  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** 2X is NOT P1 AND P0. 3X is P1 AND NOT P0. 4X is P1 AND P0. Invert each digit once, then use three AND gates.

**Follows NANDGAME:** And / Invert (composition)  
**Vocabulary:** decoder, minterm, binary position

<details><summary>Truth table the game checks</summary>

| P1 | P0 | 2X | 3X | 4X |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 | 0 |
| 1 | 0 | 0 | 1 | 0 |
| 1 | 1 | 0 | 0 | 1 |

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. Do one lamp at a time. For 2X, write down P1 and P0. One of them is 1, and the other is 0.
2. 4X is the easy lamp: both digits are 1, so one AND gate is enough. 2X needs P0 = 1 and P1 = 0. 3X needs P1 = 1 and P0 = 0.
3. Use one INVERT on P1 and one INVERT on P0. Then three AND gates: NOT P1 with P0 goes to 2X, P1 with NOT P0 goes to 3X, and P1 with P0 goes to 4X.

</details>

### 9. Kickback

**The job:** Kick the ball back when it rolls through the outlane, but only if the kickback is armed and the machine is not tilted. The ARMED lamp shows when a save is ready.

**Parts bin:** 2 x INVERT, 3 x AND  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** The lamp is armed AND NOT tilt. The coil is the outlane switch AND that same lamp signal. Reuse the lamp output so the lamp and the coil cannot disagree.

**Follows NANDGAME:** And / Invert (composition)  
**Vocabulary:** shared subexpression, three-input condition

<details><summary>Truth table the game checks</summary>

| LANE | ARM | TILT | KICK | ARMED |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 |
| 0 | 0 | 1 | 0 | 0 |
| 0 | 1 | 0 | 0 | 1 |
| 0 | 1 | 1 | 0 | 0 |
| 1 | 0 | 0 | 0 | 0 |
| 1 | 0 | 1 | 0 | 0 |
| 1 | 1 | 0 | 1 | 1 |
| 1 | 1 | 1 | 0 | 0 |

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. Build the lamp first. It uses only two inputs: kickback armed is 1, and tilt is 0. Test the lamp before you add the coil.
2. The coil uses the lamp signal plus one more check: is the ball in the outlane right now?
3. INVERT the tilt signal. AND that with the armed signal, and connect that output to ARMED LAMP. Then AND that same output with the outlane switch, and connect it to KICKBACK COIL.

</details>

## Act 4. Memory Circuits

_The output stays on after the switch opens._

### 10. Lock 1

**The job:** Turn LOCK 1 on when the lock switch closes. Keep it on after the switch opens. Turn it off only when reset happens.

**Parts bin:** 2 x NAND  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** Two NAND gates wired to each other. The lock switch goes into the first NAND, and the lamp connects to that output. Reset goes into the second NAND. Each output feeds the other gate, so the lamp stays on after the switch opens.

**Follows NANDGAME:** Latch (the unit after logic gates)  
**Vocabulary:** feedback, latch, set/reset, state

<details><summary>Test sequence the game runs</summary>

1. **a ball gets locked and stays locked**
   - Reset at the start of the ball -> LOCK 1 LAMP = 0
   - Reset turns off again -> LOCK 1 LAMP = 0
   - The ball hits the lock switch -> LOCK 1 LAMP = 1
   - The ball rolls off the switch -> LOCK 1 LAMP = 1
   - The ball hits the same switch again -> LOCK 1 LAMP = 1
   - The switch opens again -> LOCK 1 LAMP = 1
   - The next ball starts -> LOCK 1 LAMP = 0
   - Reset turns off, and the lamp stays off -> LOCK 1 LAMP = 0

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. A gate that only watches the switch will forget as soon as the switch goes back to 1. To remember, a gate has to see an output coming back in.
2. Cross the wires. Connect the first NAND output to an input of the second NAND, and the second output back to an input of the first. The lock switch goes to the first gate. Reset goes to the second gate.
3. Connect the lamp to the NAND that also gets the lock switch. Tap Reset first so the lamp starts off. Then tap the lock switch. The lamp should stay on after the switch opens.

</details>

### 11. Ball Saver

**The job:** Turn the save on when the ball leaves the shooter lane. Keep it on until the ball ends. While it is on, a drain fires the auto-launch coil.

**Parts bin:** 2 x NAND, 1 x INVERT, 1 x AND  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** Same two-NAND memory as Lock 1. The shooter lane sets it, and end of ball clears it. The lamp connects to that memory. The coil is the memory AND NOT the outhole wire, because the outhole is 0 when the ball is in it.

**Follows NANDGAME:** Latch + And  
**Vocabulary:** state, gated output, active low

<details><summary>Test sequence the game runs</summary>

1. **an early drain gets saved**
   - The machine sets up a new ball -> BALL SAVE LAMP = 0, AUTO LAUNCH = 0
   - End of ball turns off again -> BALL SAVE LAMP = 0, AUTO LAUNCH = 0
   - The ball leaves the shooter lane -> BALL SAVE LAMP = 1
   - The shooter lane switch opens again -> BALL SAVE LAMP = 1
   - The ball drains right away -> BALL SAVE LAMP = 1, AUTO LAUNCH = 1
   - The outhole is empty again -> BALL SAVE LAMP = 1, AUTO LAUNCH = 0
1. **a drain with no save armed**
   - A new ball starts -> BALL SAVE LAMP = 0
   - End of ball turns off again -> BALL SAVE LAMP = 0
   - The ball is launched -> BALL SAVE LAMP = 1
   - The shooter lane switch opens -> BALL SAVE LAMP = 1
   - The save time runs out and the ball ends -> BALL SAVE LAMP = 0
   - End of ball turns off, and the lamp stays off -> BALL SAVE LAMP = 0
   - A later drain, with the save off -> BALL SAVE LAMP = 0, AUTO LAUNCH = 0
   - The outhole is empty, and the coil stays off -> AUTO LAUNCH = 0

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. Start with the same memory circuit as Lock 1. Decide which input turns the memory on, and which input turns it off.
2. The shooter lane turns the memory on. End of ball turns it off. Connect BALL SAVE LAMP to the memory output.
3. The coil is an AND of two things: the saved value, and "the ball is in the outhole right now." The outhole wire is 0 when the ball is there, so put an INVERT on it before the AND gate.

</details>

### 12. Lane Change

**The job:** Light lane A when the left button is pressed, and lane B when the right button is pressed. Keep that choice after the button is released. Ignore both buttons while the machine is tilted.

**Parts bin:** 4 x NAND, 1 x INVERT  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** INVERT tilt once. Each button goes through a NAND with "not tilted," so tilt blocks both buttons. Those two outputs feed a memory pair, like Lock 1. Lane A connects to one memory output. Lane B connects to the other, which is always the opposite.

**Follows NANDGAME:** Latch (set/reset inputs)  
**Vocabulary:** complementary outputs, Q and Q-bar, illegal state

<details><summary>Test sequence the game runs</summary>

1. **the player changes lanes**
   - The player presses the left button -> LANE A LAMP = 1, LANE B LAMP = 0
   - The left button is released, and lane A stays on -> LANE A LAMP = 1, LANE B LAMP = 0
   - The player presses the right button -> LANE A LAMP = 0, LANE B LAMP = 1
   - The right button is released, and lane B stays on -> LANE A LAMP = 0, LANE B LAMP = 1
   - The machine is tilted -> LANE A LAMP = 0, LANE B LAMP = 1
   - The left button is pressed while tilted, so nothing changes -> LANE A LAMP = 0, LANE B LAMP = 1
   - Tilt turns off -> LANE A LAMP = 0, LANE B LAMP = 1
   - The left button works again -> LANE A LAMP = 1, LANE B LAMP = 0
   - The left button is released, and lane A stays on -> LANE A LAMP = 1, LANE B LAMP = 0

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. The buttons send 1 when pressed. The memory circuit from Lock 1 changes when an input drops to 0. You also have to block both buttons while tilt is 1.
2. Put a NAND in front of each side of the memory circuit. One NAND gets the left button. The other gets the right button. Both also get "not tilted." While the machine is tilted, those NAND outputs stay at 1, so the memory cannot change.
3. INVERT tilt once, and connect that output to both front NAND gates. The left NAND output goes into one side of the memory. The right NAND output goes into the other side. Lane A connects to the memory gate fed by the left button. Lane B connects to the other memory gate.

</details>

### 13. Multiball

**The job:** Each lock lamp turns on from its own switch and stays on. When all three lamps are on, fire the ball release. Reset turns all three lamps off.

**Parts bin:** 6 x NAND, 2 x AND  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** Three copies of the Lock 1 memory, all using the same reset wire. AND the first two lamp signals, then AND that result with the third. That output goes to the ball release.

**Follows NANDGAME:** Latch (x3) + And  
**Vocabulary:** register, shared reset, composition

<details><summary>Test sequence the game runs</summary>

1. **three locks and a release**
   - Reset for a new game -> LOCK 1 LAMP = 0, LOCK 2 LAMP = 0, LOCK 3 LAMP = 0, BALL RELEASE = 0
   - Reset turns off again -> LOCK 1 LAMP = 0, LOCK 2 LAMP = 0, LOCK 3 LAMP = 0, BALL RELEASE = 0
   - The first ball is locked -> LOCK 1 LAMP = 1, LOCK 2 LAMP = 0, LOCK 3 LAMP = 0, BALL RELEASE = 0
   - Lock 1 opens, and the lamp stays on -> LOCK 1 LAMP = 1, BALL RELEASE = 0
   - Lock 3 is hit before lock 2 -> LOCK 1 LAMP = 1, LOCK 2 LAMP = 0, LOCK 3 LAMP = 1, BALL RELEASE = 0
   - Lock 3 opens, and that lamp stays on -> LOCK 3 LAMP = 1, BALL RELEASE = 0
   - All three locks are on, so the balls release -> LOCK 1 LAMP = 1, LOCK 2 LAMP = 1, LOCK 3 LAMP = 1, BALL RELEASE = 1
   - Lock 2 opens, and the release stays on -> BALL RELEASE = 1
   - The game ends, and everything turns off -> LOCK 1 LAMP = 0, LOCK 2 LAMP = 0, LOCK 3 LAMP = 0, BALL RELEASE = 0
   - Reset turns off, and the release stays off -> BALL RELEASE = 0

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. Build one lock and test it before you add the other two. Then copy that circuit two more times.
2. All three memory circuits use the same reset wire. Connect that one reset pin to each circuit. You already connected one output to two places on the drop-target level.
3. Each lock is two NAND gates, like Lock 1. Then AND the first two lamp signals together. AND that result with the third lamp signal. Connect that last output to BALL RELEASE.

</details>

## Discussion questions

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
  `npm start` or `python3 -m http.server 8000` from the project folder.
- No sound: browsers hold audio until the first click anywhere on the page. The
  Sound button in the top bar also toggles it, and the setting sticks.
- A bench looks scrambled after an update to the level pack: `index.html?reset=1`
  clears saved work on that device.
