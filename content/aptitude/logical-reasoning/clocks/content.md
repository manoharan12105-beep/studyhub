# Clocks

## Concept

Clock questions are relative-speed problems in disguise. The two hands move around the same circular track (360°) at different speeds:

| Hand | Full circle | Speed |
|------|-------------|-------|
| Minute hand | 60 minutes | 360°/60 = **6° per minute** |
| Hour hand | 12 hours = 720 minutes | 360°/720 = **0.5° per minute** |

So the minute hand gains **5.5° per minute** on the hour hand. Every clock formula follows from this, like the chasing formulas in [Time, Speed and Distance](../../quantitative-aptitude/time-speed-distance/content.md#relative-speed).

## Formulas

### Angle between the hands

```text
Angle at H hours M minutes = |30H − 5.5M|
If the result is more than 180°, use 360° − result.
```

- **Meaning:** at H:00 the hour hand is at 30H° and the minute hand at 0°. In M minutes the minute hand moves 6M° and the hour hand 0.5M°, so the gap changes by 5.5M°.
- **Example:** 3:40 → |90 − 220| = 130°.
- **Common mistake:** forgetting that the hour hand also moves (at 3:40 it is not exactly on the 3).

### When the hands make an angle θ

```text
Between H and H + 1 o'clock, the hands are θ° apart at
M = (2/11)(30H ± θ) minutes past H
```

- **Meaning:** solve |30H − 5.5M| = θ for M. Keep only values between 0 and 60.
- **Coinciding (θ = 0):** M = (2/11)(30H) = 60H/11.
- **Example:** between 4 and 5 the hands coincide at (2/11)(120) = 240/11 = 21 9/11 minutes past 4.
- **Common mistake:** keeping a value of M above 60 or below 0.

### How often things happen

| Event | In 12 hours | In 24 hours |
|-------|-------------|-------------|
| Hands coincide | 11 | 22 |
| Hands at right angles | 22 | 44 |
| Hands opposite (180°) | 11 | 22 |
| Hands in a straight line (0° or 180°) | 22 | 44 |

- **Why 11, not 12:** the hands coincide every 720/11 = 65 5/11 minutes, so 12 hours hold 11 such intervals. The meeting near 11 o'clock happens exactly at 12:00 instead.
- **Right angles:** twice in each gap between meetings → 2 × 11 = 22 in 12 hours.

### Mirror images

```text
Mirror time (vertical mirror) = 11:60 − actual time   (12-hour clock)
```

- **Example:** 3:40 → 11:60 − 3:40 = 8:20.
- If the actual time is after 11:60 (e.g. 12:xx), subtract from 23:60 instead (12:20 → 11:40).
- A clock and its mirror image always show the same angle between the hands.

### Fast and slow clocks

- A clock that **gains** g minutes per hour shows 60 + g minutes for every 60 real minutes.
- Real time elapsed = clock time elapsed × 60/(60 + g). For a losing clock use 60 − g.
- **Example:** a clock gaining 4 minutes per hour is set right at 8 a.m. When it shows 2 p.m. (360 clock minutes), the real time elapsed is 360 × 60/64 = 337.5 minutes = 5 h 37.5 min → real time 1:37:30 p.m.

## Solving Approach

1. For an angle at a given time: use |30H − 5.5M|, then reduce to ≤ 180°.
2. For a time with a given angle: use M = (2/11)(30H ± θ) and keep valid answers.
3. For counts in a day: use the table; remember 11 and 22, not 12 and 24.
4. For mirror images: subtract from 11:60.

## Problem Patterns

### Pattern 1: Angle at a time

**Example:** 8:20 → |240 − 110| = 130°.

### Pattern 2: Time for an angle

**Example:** between 2 and 3, the hands are at right angles at M = (2/11)(60 + 90) = 300/11 = 27 3/11 minutes past 2. (The other root, (2/11)(60 − 90), is negative.)

### Pattern 3: Counting events

**Example:** right angles in a day → 44.

### Pattern 4: Mirror image

**Example:** 4:25 → 11:60 − 4:25 = 7:35.

## Common Mistakes

- Treating the hour hand as fixed on the hour mark.
- Reporting a reflex angle (e.g. 230°) instead of 360° − it.
- Counting 24 coincidences or 48 right angles in a day.
- Subtracting mirror times from 12:00 instead of 11:60.

## Placement Tips

- Memorise 6°, 0.5° and 5.5° per minute — every formula comes from them.
- Answers to "time for an angle" questions are usually fractions with denominator 11; use this to spot the right option.
- Quick sense check: at H:00 the angle is 30H°.

## Key Takeaways

- Angle = |30H − 5.5M| (take 360° − angle if above 180°).
- M = (2/11)(30H ± θ) gives the times for angle θ.
- 11 coincidences and 22 right angles in 12 hours.
- Mirror time = 11:60 − actual time.
