# GATECRASHER - teacher guide

> Generated from the level files by `npm run guide`. Edit the levels in
> `src/levels/`, not this file.

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

## Act 1. Wake It Up

_One gate, one socket._

### 1. Flipper Live

**What comes alive:** Make the left flipper coil fire while the button is held.

**Parts bin:** 1 x INVERT  
**Bench:** gates drop into fixed sockets, wiring already done

**Answer:** One INV between the button and the coil. The switch is active-low, so the signal has to be flipped.

**Follows NANDGAME:** Invert  
**Vocabulary:** active low, inverter

<details><summary>Truth table the game checks</summary>

| BTN | COIL |
| --- | --- |
| 0 | 1 |
| 1 | 0 |

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. Hold the test button and watch the number leaving the LEFT BUTTON terminal. Is that what the coil wants?
2. Pressing sends 0. The coil fires on 1. You need a part that flips a signal to its opposite.
3. Drag the INVERT gate out of the parts bin and drop it into the empty socket.

</details>

### 2. Pop Bumper

**What comes alive:** Fire the pop bumper only when the ball hits it during a game.

**Parts bin:** 1 x AND  
**Bench:** gates drop into fixed sockets, wiring already done

**Answer:** One AND. Output 1 only for skirt=1 and gameOn=1.

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

1. Try the skirt with the game relay on, then switch the relay off and hit it again. What should be different?
2. The coil should fire when the skirt is hit AND the game is running - not for either one on its own.
3. Drop the AND gate into the socket. Both leads already run to its input pins.

</details>

### 3. Slingshot

**What comes alive:** Kick the ball back when the ball touches either blade switch.

**Parts bin:** 1 x OR  
**Bench:** gates drop into fixed sockets, wiring already done

**Answer:** One OR. Only blade=0,0 leaves the coil off.

**Follows NANDGAME:** Or  
**Vocabulary:** OR, disjunction

<details><summary>Truth table the game checks</summary>

| UP | LOW | COIL |
| --- | --- | --- |
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 1 |

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. Last level needed both inputs to be 1. This one is the other way round.
2. Upper blade on its own should kick. Lower blade on its own should kick. Both at once should still kick.
3. The OR gate is the one that answers 1 when either input is 1. Drop it in the socket.

</details>

## Act 2. Rules Take Shape

_Gates working together._

### 4. Tilt Guard

**What comes alive:** The right flipper fires when the button is held, unless the machine is tilted.

**Parts bin:** 1 x INVERT, 1 x AND  
**Bench:** gates drop into fixed sockets, wiring already done

**Answer:** INV on the tilt line, then AND with the button. coil = button AND (NOT tilt).

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

1. The coil wants 1 when the button is 1 and the tilt line is 0. Only one of your two gates can change a 0 into a 1.
2. The tilt line has to be turned upside down before it is any use to an AND gate.
3. INVERT goes in the socket with a single lead coming in. AND goes in the socket with two.

</details>

### 5. Drop Target Bank

**What comes alive:** Open the diverter and light the jackpot only when all four targets are down.

**Parts bin:** 3 x AND  
**Bench:** gates drop into fixed sockets, student draws the wiring

**Answer:** AND(AND(G, A), AND(T, E)), fanned out to both outputs. Pair the targets, then AND the pairs.

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

1. An AND gate only takes two inputs, and you have four targets. Two sockets already have a pair wired in. Each of those answers "are both of mine down?" What do you do with the two answers?
2. The empty socket is the last AND. Feed it the output of the G-and-A gate and the output of the T-and-E gate. That answer is "are all four down?"
3. Wire s1 output to one pin on s3, and s2 output to the other pin. Then run s3 output to BOTH the diverter coil and the jackpot lamp.

</details>

### 6. Mystery Award

**What comes alive:** MYSTERY lights when exactly one ramp is made. The gate wheel spins when both are.

**Parts bin:** 1 x XOR, 1 x AND  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** lampMystery = XOR(left, right); motorSpinner = AND(left, right). Both inputs fan out to two gates.

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

1. "Exactly one" means the two ramps disagree. Which gate in the bin answers 1 only when its inputs are different?
2. XOR handles the mystery lamp. The gate wheel is the plain "both of them" question you already solved on the pop bumper.
3. Both ramp terminals feed both gates: left and right into XOR, left and right into AND. Four wires in, two wires out.

</details>

## Act 3. Make Do

_Build it from what is in the crate._

### 7. Parts Shortage

**What comes alive:** Fire the upper pop bumper when its skirt is hit, unless the machine is tilted - using only NANDs.

**Parts bin:** 3 x NAND  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** g1 = NAND(tilt,tilt) = NOT tilt. g2 = NAND(skirt, g1). g3 = NAND(g2,g2) = skirt AND NOT tilt.

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

1. Feed the same signal into both pins of one NAND and watch what comes out. That is one of your missing parts, for free.
2. NAND is AND with its answer flipped. So build the NAND of what you want, then flip it back with a second NAND wired as an inverter.
3. Three gates: NAND(tilt, tilt) makes NOT tilt. NAND(skirt, NOT tilt) is almost the answer but upside down. A third NAND with that signal on both pins turns it the right way up.

</details>

### 8. Bonus Multiplier

**What comes alive:** Light 2X at position 01, 3X at position 10, 4X at position 11. At 00 all three stay dark.

**Parts bin:** 2 x INVERT, 3 x AND  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** 2X = NOT P1 AND P0; 3X = P1 AND NOT P0; 4X = P1 AND P0. A 1-of-n decoder built from minterms.

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

1. Take one lamp at a time. For 2X, write down what P1 and P0 are doing: one of them is 1, the other is 0.
2. 4X is the easy one - both digits are 1. For 2X you need "P0 is 1 and P1 is NOT", and 3X is that idea mirrored.
3. Invert P1 and invert P0 once each, then feed the three ANDs: (NOT P1, P0) for 2X, (P1, NOT P0) for 3X, (P1, P0) for 4X.

</details>

### 9. Kickback

**What comes alive:** Kick the ball back when it rolls through the outlane while the kickback is armed and the machine is not tilted. The ARMED lamp shows whether a save is live right now.

**Parts bin:** 2 x INVERT, 3 x AND  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** lampArmed = AND(armed, NOT tilt); kickCoil = AND(outlane, lampArmed). Three gates; the shared term is the point.

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

1. Start with the lamp - it only cares about two of the three inputs. Build that first and test it.
2. The coil is the lamp's question plus one more: is the ball in the outlane right now?
3. Invert tilt. AND that with armed and send it to the ARMED lamp. Then AND that same signal with the outlane switch for the coil.

</details>

## Act 4. The Machine Remembers

_Circuits that hold a value._

### 10. Lock 1

**What comes alive:** LOCK 1 lights when the lock switch closes, stays lit after it opens, and goes out only when the machine sends its reset.

**Parts bin:** 2 x NAND  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** Cross-coupled NAND latch. Q = g1 = NAND(set-bar, Qbar); Qbar = g2 = NAND(reset-bar, Q). Lamp on Q.

**Follows NANDGAME:** Latch (the unit after logic gates)  
**Vocabulary:** feedback, latch, set/reset, state

<details><summary>Test sequence the game runs</summary>

1. **a ball gets locked and stays locked**
   - the machine resets at the start of the ball -> LOCK 1 LAMP = 0
   - the reset line lets go -> LOCK 1 LAMP = 0
   - the ball hits the lock switch -> LOCK 1 LAMP = 1
   - the ball rolls off the switch -> LOCK 1 LAMP = 1
   - a second hit on the same switch -> LOCK 1 LAMP = 1
   - and off again -> LOCK 1 LAMP = 1
   - the next ball starts -> LOCK 1 LAMP = 0
   - and the lamp stays out -> LOCK 1 LAMP = 0

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. A signal cannot be remembered by a gate that only looks forward. What if a gate could see its own answer coming back around?
2. Take the output of one NAND into an input of the other, and that second output back into the first. The lock switch feeds the first gate's free pin, the reset line feeds the second.
3. g1 = NAND(lock switch, g2 output). g2 = NAND(reset line, g1 output). The lamp hangs off g1. Pulse reset first to start the lamp off.

</details>

### 11. Ball Saver

**What comes alive:** Arm the save when the ball leaves the shooter lane. Hold it until end of ball. While it is armed, a drain should fire the auto-launch coil.

**Parts bin:** 2 x NAND, 1 x INVERT, 1 x AND  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** Latch set by launch, reset by endOfBall. lampSave = Q. coilAuto = AND(Q, INV(drain)).

**Follows NANDGAME:** Latch + And  
**Vocabulary:** state, gated output, active low

<details><summary>Test sequence the game runs</summary>

1. **an early drain gets saved**
   - the machine sets up for a new ball -> BALL SAVE LAMP = 0, AUTO LAUNCH COIL = 0
   - the reset lets go -> BALL SAVE LAMP = 0, AUTO LAUNCH COIL = 0
   - the ball rolls out of the shooter lane -> BALL SAVE LAMP = 1
   - the shooter lane switch opens again -> BALL SAVE LAMP = 1
   - the ball drains almost immediately -> BALL SAVE LAMP = 1, AUTO LAUNCH COIL = 1
   - the outhole clears -> BALL SAVE LAMP = 1, AUTO LAUNCH COIL = 0
1. **a drain with no save armed**
   - new ball -> BALL SAVE LAMP = 0
   - next step -> BALL SAVE LAMP = 0
   - ball launched -> BALL SAVE LAMP = 1
   - next step -> BALL SAVE LAMP = 1
   - the save time runs out and the ball ends -> BALL SAVE LAMP = 0
   - next step -> BALL SAVE LAMP = 0
   - a later drain, with nothing armed -> BALL SAVE LAMP = 0, AUTO LAUNCH COIL = 0
   - next step -> AUTO LAUNCH COIL = 0

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. You already know how to build the memory. Which line should set it, and which should clear it?
2. The latch goes between the shooter lane switch and the end of ball line. The lamp comes straight off it.
3. The coil is an AND: the stored bit, and "is the ball in the outhole right now". The outhole line reads 0 when the ball is there, so it needs inverting first.

</details>

### 12. Lane Change

**What comes alive:** Lane A lights when the left button is pressed, lane B when the right button is pressed, the choice holds after the button is released, and a tilted machine ignores both buttons.

**Parts bin:** 4 x NAND, 1 x INVERT  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** INV(tilt) gates both button lines through NANDs into a NAND latch. Lamps take Q and Qbar - the latch already produces both. Pressing both buttons at once drives the illegal state where both lamps light; worth demonstrating.

**Follows NANDGAME:** Latch (set/reset inputs)  
**Vocabulary:** complementary outputs, Q and Q-bar, illegal state

<details><summary>Test sequence the game runs</summary>

1. **the player changes lanes**
   - the player taps the left button -> LANE A LAMP = 1, LANE B LAMP = 0
   - released, and lane A stays chosen -> LANE A LAMP = 1, LANE B LAMP = 0
   - now the right button -> LANE A LAMP = 0, LANE B LAMP = 1
   - released, and lane B stays chosen -> LANE A LAMP = 0, LANE B LAMP = 1
   - somebody shoves the machine -> LANE A LAMP = 0, LANE B LAMP = 1
   - left button while tilted, which must do nothing -> LANE A LAMP = 0, LANE B LAMP = 1
   - the tilt clears -> LANE A LAMP = 0, LANE B LAMP = 1
   - and the left button works again -> LANE A LAMP = 1, LANE B LAMP = 0
   - released -> LANE A LAMP = 1, LANE B LAMP = 0

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. The buttons read 1 when pressed, but the latch you built wants a 0 to set it. What do you have that turns a 1 into a 0 - and can check the tilt at the same time?
2. Put a NAND in front of each side of the latch: one takes the left button, one takes the right, and both take "the machine is not tilted". While tilted, both of those NANDs sit at 1 and the latch cannot move.
3. Invert tilt once. g2 = NAND(left button, not-tilt) feeds the latch's set side, g3 = NAND(right button, not-tilt) feeds its reset side. Lane A comes off the latch gate fed by g2, lane B off the other one.

</details>

### 13. MULTIBALL

**What comes alive:** Each lock lamp lights on its own switch and holds. When all three are lit, fire the ball release. The reset line clears all three.

**Parts bin:** 6 x NAND, 2 x AND  
**Bench:** gates go anywhere, student draws the wiring

**Answer:** Three cross-coupled NAND latches sharing one reset line, then AND(AND(Q1,Q2),Q3) into the release coil.

**Follows NANDGAME:** Latch (x3) + And  
**Vocabulary:** register, shared reset, composition

<details><summary>Test sequence the game runs</summary>

1. **three locks and a release**
   - the machine resets for a new game -> LOCK 1 LAMP = 0, LOCK 2 LAMP = 0, LOCK 3 LAMP = 0, BALL RELEASE = 0
   - reset lets go -> LOCK 1 LAMP = 0, LOCK 2 LAMP = 0, LOCK 3 LAMP = 0, BALL RELEASE = 0
   - the first ball is locked -> LOCK 1 LAMP = 1, LOCK 2 LAMP = 0, LOCK 3 LAMP = 0, BALL RELEASE = 0
   - the switch opens and lock 1 holds -> LOCK 1 LAMP = 1, BALL RELEASE = 0
   - the player locks number 3 out of order -> LOCK 1 LAMP = 1, LOCK 2 LAMP = 0, LOCK 3 LAMP = 1, BALL RELEASE = 0
   - and that holds too -> LOCK 3 LAMP = 1, BALL RELEASE = 0
   - all three locked, so the balls release -> LOCK 1 LAMP = 1, LOCK 2 LAMP = 1, LOCK 3 LAMP = 1, BALL RELEASE = 1
   - and the release stays on while the locks hold -> BALL RELEASE = 1
   - game over, everything clears -> LOCK 1 LAMP = 0, LOCK 2 LAMP = 0, LOCK 3 LAMP = 0, BALL RELEASE = 0
   - and stays clear -> BALL RELEASE = 0

</details>

<details><summary>Hint ladder (what the game will eventually say)</summary>

1. Build one lock and get it working before you place a single gate for the other two. Then copy it twice.
2. All three latches share the same reset line. One output pin can feed as many wires as you need - you already did that on the drop targets.
3. Three latches of two NANDs each. Then AND the first two stored bits together, and AND that answer with the third, straight into the ball release.

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
