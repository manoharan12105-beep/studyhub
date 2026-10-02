# Time and Work

## Concept

Time-and-work questions are about **rates**. If a person finishes a job in 10 days, they do 1/10 of it each day. When people work together, their rates add.

```text
Work = Rate × Time        Rate = Work / Time
```

The central insight is that **rates add, times do not**. If A takes 10 days and B takes 15 days, together they do not take 25 days or 12.5 days — they do 1/10 + 1/15 = 1/6 of the job per day, so they take 6 days.

Fractions get messy, so most solvers use the **total-work (LCM) method**: assume the job has a convenient number of units — the LCM of the individual times — so every rate becomes a whole number.

```text
A: 10 days, B: 15 days → total work = LCM(10, 15) = 30 units
A's rate = 30/10 = 3 units/day, B's rate = 30/15 = 2 units/day
Together = 5 units/day → 30/5 = 6 days
```

The same model covers pipes filling tanks (an outlet is negative work) and dividing wages (pay is shared in the ratio of work done).

## Work Efficiency

### Efficiency and time are inversely proportional

```text
Efficiency ∝ 1 / Time        E_A / E_B = T_B / T_A
```

- **Meaning:** someone twice as efficient takes half the time for the same job.
- **Use when:** "A is twice as good a workman as B", "A is 25% more efficient than B".
- **Example:** A is 50% more efficient than B (efficiency ratio 3 : 2). If B takes 30 days, A takes 30 × 2/3 = 20 days.
- **Common mistake:** "50% more efficient" → "50% less time". It is actually 1/1.5 of the time, i.e. 33.33% less.

### Two or more people together

```text
Together (two people):  T = (a × b) / (a + b)
Together (any number):  1/T = 1/a + 1/b + 1/c + …
```

- **Meaning:** combined rate is the sum of individual rates.
- **Variables:** a, b, c = days each takes alone.
- **Example:** 10 and 15 days → (10 × 15)/25 = 6 days.
- **Common mistake:** using (a × b)/(a + b) for three people by applying it to all three at once. Apply it pairwise, or add the reciprocals.

### Finding one person's time from a pair

```text
1/(B alone) = 1/(A and B together) − 1/(A alone)
```

- **Example:** together 12 days, A alone 20 → 1/12 − 1/20 = 2/60 = 1/30 → B alone 30 days.

### Man-days (chain rule for work)

```text
(M₁ × D₁ × H₁) / W₁ = (M₂ × D₂ × H₂) / W₂
```

- **Meaning:** total effort (workers × days × hours per day) is proportional to the amount of work.
- **Variables:** M = number of workers, D = days, H = hours per day, W = amount of work.
- **Use when:** the number of workers, days, hours or the size of the job changes.
- **Example:** 15 men working 8 hours a day finish in 20 days. 20 men working 6 hours a day need D days: 15 × 8 × 20 = 20 × 6 × D → D = 20.
- **Common mistake:** ignoring H or W when they change; assuming workers of different types are equally efficient.

### Pattern: someone leaves or joins midway

**Recognise it:** "They work together for 4 days, then A leaves."

**Approach:**

1. Total work = LCM; find each rate.
2. Work done in the first phase = combined rate × days.
3. Remaining work ÷ rate of whoever continues.

**Example:** A 12 days, B 18 days (work 36; rates 3 and 2). Together for 4 days → 20 units. Remaining 16 units by B → 8 more days.

### Pattern: working on alternate days

**Recognise it:** "A and B work on alternate days, starting with A."

**Approach:**

1. Work in one full cycle (2 days) = A's rate + B's rate.
2. Fit as many full cycles as possible.
3. Finish the remainder day by day, starting with whoever's turn it is — the last day may be partial.

**Example:** A 8 days, B 12 days (work 24; rates 3 and 2). One cycle = 5 units in 2 days. 4 cycles = 20 units in 8 days. Day 9 (A): 3 units → 23. Day 10 (B): 1 unit left at 2/day → half a day. Total 9.5 days.

### Pattern: comparing workers of different types

**Recognise it:** "4 men or 6 women can do the work in 12 days."

**Approach:** convert to one type: 4 men = 6 women → 1 man = 1.5 women. Then use total work in woman-days.

**Example:** total = 6 × 12 = 72 woman-days. 2 men + 9 women = 3 + 9 = 12 women → 72/12 = 6 days.

## Pipes and Cisterns

### Concept

A tank is "the work". An **inlet** pipe fills it (positive work); an **outlet** pipe or a **leak** empties it (negative work). Every Time-and-Work method applies, with signs.

### Net rate

```text
Net rate = Σ (inlet rates) − Σ (outlet rates)
```

- **Example:** A fills in 20 min, B fills in 30 min, C empties in 15 min. Tank = LCM 60 units: A +3, B +2, C −4 → net +1 per minute → 60 minutes to fill.
- **Common mistake:** adding the outlet's rate instead of subtracting it.

### Leak time

```text
If a pipe fills a tank in a hours, but takes b hours because of a leak (b > a),
the leak alone empties the full tank in  (a × b) / (b − a)  hours
```

- **Why it works:** 1/leak = 1/a − 1/b = (b − a)/(ab).
- **Example:** fills in 6 h, takes 8 h with the leak → leak empties in 48/2 = 24 h.

### Pattern: closing a pipe partway

**Recognise it:** "After how many minutes should B be closed so that the tank fills in exactly T minutes?"

**Approach:** the pipe that stays open works for the whole time T. Whatever is left must be done by the other pipe.

**Example:** A 12 min, B 16 min, tank to fill in 9 min. A in 9 min = 9/12 = 3/4. B must do 1/4 → 16/4 = 4 minutes → close B after 4 minutes.

## Work and Wages

### Wages follow work done

```text
Share of wages ∝ Work done = Efficiency × Days worked
```

- **Meaning:** payment is for the work done, not for the time spent.
- **When everyone works the same number of days:** wages are in the ratio of efficiencies = inverse ratio of their individual times.
- **Example:** A takes 10 days and B 15 days; working together they earn ₹4,500. Efficiency ratio = 15 : 10 = 3 : 2 → A gets ₹2,700, B ₹1,800.
- **Common mistake:** splitting in the ratio of days (10 : 15), which pays the slower worker more.

### Pattern: a helper joins

**Recognise it:** "A and B, with the help of C, finish in 3 days. Find C's share."

**Approach:**

1. Find A's and B's rates and the total work.
2. Combined rate = total ÷ days → C's rate = combined − A − B.
3. Work done by each = rate × days → divide the wages in that ratio.

**Example:** A 6 days, B 8 days (work 24; rates 4 and 3). All three finish in 3 days → 8 units/day → C = 1 unit/day. Work done: 12, 9, 3 → ₹3,200 splits as ₹1,600, ₹1,200, ₹400.

## Common Mistakes

- Adding times instead of rates.
- Reading "x% more efficient" as "x% less time".
- Treating a leak or outlet as positive work.
- Forgetting that someone who leaves stops contributing for the remaining days.
- In alternate-day questions, assuming the last cycle is complete.
- Dividing wages by days worked instead of by work done.

## Placement Tips

- Default to the LCM method — integer rates make every pattern faster.
- When an answer comes out as a fraction of a day, check whether the options use hours or mixed numbers.
- For "how many days" with three people, find the combined rate first; individual times are rarely needed.
- In pipe questions, write signs next to each rate before adding.

## Key Takeaways

- Rate = 1/time; rates add, times don't.
- LCM method: total work = LCM of times; rates become integers.
- Efficiency ∝ 1/time; man-days: M₁D₁H₁/W₁ = M₂D₂H₂/W₂.
- Pipes: inlets +, outlets/leaks −; leak time = ab/(b − a).
- Wages are shared in the ratio of work done.
