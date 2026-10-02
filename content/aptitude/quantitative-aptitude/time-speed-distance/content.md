# Time, Speed and Distance

## Concept

Speed is how much distance is covered per unit of time. Every question in this topic — trains, boats, races — uses one relationship:

```text
Distance = Speed × Time
```

The variations come from **what is moving relative to what**. A train crossing a pole must cover its own length; a boat moving with the current gets the current's help; two runners on a track close the gap at the difference of their speeds. Identify the **distance that must be covered** and the **effective speed**, and the question becomes D = S × T.

### Unit conversion

```text
km/h → m/s : multiply by 5/18
m/s → km/h : multiply by 18/5
```

- **Why it works:** 1 km/h = 1000 m / 3600 s = 5/18 m/s.
- **Example:** 72 km/h = 72 × 5/18 = 20 m/s.
- **Common mistake:** mixing metres with km/h. Convert before calculating.

### Proportionality

| If this is constant | Then |
|---------------------|------|
| Distance | Speed ∝ 1/Time (twice as fast → half the time) |
| Time | Distance ∝ Speed |
| Speed | Distance ∝ Time |

**Example:** walking at 3/4 of usual speed, a person is 20 minutes late. Time becomes 4/3 of usual, so the extra 1/3 of usual time = 20 min → usual time = 60 min.

### Average speed

```text
Average speed = Total distance / Total time
Equal distances at speeds x and y:  Average speed = 2xy / (x + y)
```

- **Meaning:** the overall rate for the whole journey.
- **Why the second form works:** for distance d each way, time = d/x + d/y, so average = 2d / (d/x + d/y) = 2xy/(x + y).
- **Example:** 40 km/h one way and 60 km/h back → 2 × 40 × 60 / 100 = 48 km/h.
- **Common mistake:** (40 + 60)/2 = 50. The simple average is correct only for equal **times**, not equal distances.

## Relative Speed

### Concept

When two objects move, what matters is how fast the gap between them changes — the **relative speed**.

```text
Opposite directions (towards or away from each other):  S₁ + S₂
Same direction:                                          |S₁ − S₂|
```

- **Meaning:** moving towards each other, both close the gap; moving the same way, only the difference closes it.
- **Example:** cars 300 km apart driving towards each other at 40 and 60 km/h meet after 300/100 = 3 hours.
- **Common mistake:** adding speeds when one is chasing the other.

### Chasing

```text
Time to catch up = Initial gap / (S_fast − S_slow)
```

**Example:** a thief 200 m ahead runs at 10 km/h; a policeman chases at 12 km/h. Relative speed 2 km/h = 5/9 m/s → 200 ÷ 5/9 = 360 s = 6 minutes.

### Meeting and then continuing

```text
If two objects start towards each other at the same time, meet, and then take t₁ and t₂
to reach the other's starting point:   S₁ / S₂ = √(t₂ / t₁)
```

- **Why it works:** after the meeting, each covers the distance the other had covered before. With meeting time t: S₁t = S₂t₂ and S₂t = S₁t₁. Dividing gives S₁²t₁ = S₂²t₂.
- **Example:** after meeting, trains take 9 h and 16 h → speeds are √16 : √9 = 4 : 3.

## Trains

### Concept

A train has length, so "crossing" something means the **whole train** must pass it: the distance includes the train's own length.

| Train crosses | Distance to cover | Speed to use |
|---------------|-------------------|--------------|
| A pole, a person standing, a signal | Train length L | Train speed |
| A platform, bridge or tunnel of length P | L + P | Train speed |
| A person walking/running | L | Relative speed |
| Another train of length L₂ | L + L₂ | Relative speed (sum if opposite, difference if same direction) |

### Formulas

```text
Crossing a pole:            T = L / S
Crossing a platform:        T = (L + P) / S
Crossing another train:     T = (L₁ + L₂) / (S₁ ± S₂)
```

- **Example (pole):** 150 m train at 54 km/h (15 m/s) → 10 s.
- **Example (platform):** 200 m train at 72 km/h (20 m/s) crosses a 300 m platform → 500/20 = 25 s.
- **Example (trains):** 120 m and 180 m trains at 50 and 40 km/h. Opposite: 90 km/h = 25 m/s → 300/25 = 12 s. Same direction: 10 km/h = 25/9 m/s → 108 s.
- **Common mistake:** forgetting to add the platform's or the other train's length; forgetting to convert km/h.

## Boats and Streams

### Concept

A river's current (stream) helps a boat going **downstream** and slows it going **upstream**.

```text
Downstream speed  D = u + v
Upstream speed    U = u − v
u = (D + U) / 2       v = (D − U) / 2
```

- **Variables:** u = boat's speed in still water, v = speed of the stream.
- **Meaning:** the boat's own speed is the average of its downstream and upstream speeds; the stream's speed is half their difference.
- **Example:** 24 km downstream in 2 h (12 km/h) and 24 km upstream in 3 h (8 km/h) → u = 10 km/h, v = 2 km/h.
- **Common mistake:** taking the downstream speed as the boat's speed in still water.

### Round trips

```text
Time for a round trip of d km each way = d/(u + v) + d/(u − v)
```

**Example:** u = 15, v = 3, d = 30 → 30/18 + 30/12 = 1⅔ + 2½ = 4⅙ h = 4 h 10 min.

### Pattern: time ratio upstream vs downstream

**Recognise it:** "It takes him twice as long to row upstream as downstream."

**Approach:** equal distances → speeds are in the inverse ratio of times: (u + v) = 2(u − v) → u = 3v.

**Example:** with u = 4.5 km/h → v = 1.5 km/h.

## Races

### Concept

In a race of length L, "A beats B by x metres" means: **when A finishes L, B has run L − x**. Since they ran for the same time, their speeds are in the ratio of distances covered.

```text
A beats B by x m in a race of L m  →  S_A : S_B = L : (L − x)
A beats B by t seconds             →  B takes t seconds longer than A to finish
```

- **Example:** in a 1 km race A beats B by 100 m → speeds 1000 : 900 = 10 : 9.
- **Combining races:** A beats B by 100 m and B beats C by 100 m (each over 1 km). When A runs 1000, B runs 900, and C runs 900 × 900/1000 = 810 → A beats C by 190 m (not 200).

### Head start and dead heat

- **Head start:** "A gives B a start of x m" — B starts x m ahead, so B runs only L − x.
- **Dead heat:** both finish together. If A gives B a 20 m start in a 200 m race and it is a dead heat, then A runs 200 while B runs 180 in the same time → S_A : S_B = 10 : 9.

### Circular tracks

```text
First meeting (same direction):     Track length / (S₁ − S₂)
First meeting (opposite directions): Track length / (S₁ + S₂)
Meeting again at the starting point: LCM of the individual lap times
```

**Example:** 600 m track, speeds 6 and 4 m/s. Same direction: first meet after 600/2 = 300 s. Opposite: 600/10 = 60 s. Lap times 100 s and 150 s → both at the start together after LCM = 300 s.

## Common Mistakes

- Mixing units (km/h with metres or seconds).
- Using the simple average of two speeds for equal distances.
- Forgetting the train's own length, or the platform/other train's length.
- Using the sum of speeds for objects moving in the same direction.
- Treating downstream speed as the boat's still-water speed.
- In races, subtracting margins directly when combining (A beats C by 190 m, not 200 m).

## Placement Tips

- Convert all speeds to m/s when lengths are in metres; to km/h when distances are in km.
- Draw a quick line diagram with arrows for directions — it settles sum vs difference instantly.
- Multiples of 18 (36, 54, 72, 90, 108 km/h) convert cleanly to m/s (10, 15, 20, 25, 30). Expect them.
- For "late/early" questions, use the inverse ratio of speed and time instead of equations.

## Key Takeaways

- D = S × T; km/h × 5/18 = m/s.
- Equal distances: average speed = 2xy/(x + y).
- Relative speed: sum for opposite directions, difference for the same direction.
- Trains: distance = own length (+ platform or other train).
- Boats: D = u + v, U = u − v; u = (D + U)/2, v = (D − U)/2.
- Races: A beats B by x in L → speeds L : (L − x).
