# Direction Sense

## Concept

Direction-sense questions describe a person walking and turning, then ask where they end up (direction and distance from the start) or which way they are facing. The method is always the same: **draw the path on a rough grid**, one move at a time.

```text
              N
         NW   │   NE
              │
     W ───────┼─────── E
              │
         SW   │   SE
              S
```

Turning **right** means turning clockwise (N → E → S → W → N); turning **left** means anticlockwise (N → W → S → E → N). A right turn depends on the direction you are **currently facing**, not on the page — this is where most mistakes happen.

## Rules

### Turns

| Facing | Right turn → | Left turn → |
|--------|--------------|-------------|
| North | East | West |
| East | South | North |
| South | West | East |
| West | North | South |

### Angles

- Clockwise rotation adds degrees; anticlockwise subtracts. Measure from north: N = 0°, NE = 45°, E = 90°, SE = 135°, S = 180°, SW = 225°, W = 270°, NW = 315°.
- **Example:** facing north, turn 90° clockwise (→ 90°, east), then 135° anticlockwise (→ −45° = 315°) → north-west.

### Distance from the start

```text
Net east–west displacement = x,  net north–south displacement = y
Distance from start = √(x² + y²)
```

- **Example:** 3 km east and 4 km north → √(9 + 16) = 5 km.
- The final direction is read from the signs of x and y: x > 0 and y > 0 → north-east, and so on. A single non-zero component gives a pure direction (north, east …).

### Shadows

- The sun rises in the **east** and sets in the **west**.
- **Morning:** sun in the east → shadows fall towards the **west**.
- **Evening:** sun in the west → shadows fall towards the **east**.
- At noon the sun is roughly overhead and shadows are negligible, so noon questions do not appear.

## Solving Approach

1. Start at the origin, facing the stated direction.
2. For each move: apply the turn **relative to your current facing**, then move the distance.
3. Track net x (east +, west −) and net y (north +, south −) as you go.
4. Distance = √(x² + y²); direction from the signs.
5. If the question asks where the **start** is relative to the end, reverse the direction (start is south-west of a point that is north-east of it).

## Problem Patterns

### Pattern 1: Final facing direction

**Example:** facing north; turn right, right, left → east, south, east → facing **east**.

### Pattern 2: Distance and direction from the start

**Example:** walk 10 m north, turn right and walk 6 m, turn right and walk 10 m → 6 m **east** of the start.

### Pattern 3: Rotation by angles

**Example:** see the angle rule above.

### Pattern 4: Shadows

**Example:** in the morning, A and B stand facing each other. A's shadow falls exactly to B's right. Morning shadows point west, so B's right is west → B faces **south**.

### Pattern 5: Relative positions of several points

**Example:** B is 10 m west of A; C is 10 m north of A. Place B at (0, 0) and A at (10, 0); C is at (10, 10) → C is **north-east** of B.

## Common Mistakes

- Turning right relative to the page instead of the current facing.
- Answering the direction of the start from the end when the question asks the reverse (or vice versa).
- Forgetting that morning shadows point west.
- Adding distances along the path instead of using net displacement.

## Placement Tips

- Always sketch — even three moves are easy to confuse mentally.
- Keep a running (x, y) total; it removes the need to redraw.
- Distances often form 3-4-5 or 6-8-10 triangles; recognise them instead of computing roots.

## Key Takeaways

- Right = clockwise, left = anticlockwise, relative to the current facing.
- Distance from start = √(x² + y²) using net displacements.
- Morning shadows fall west; evening shadows fall east.
