# Averages

## Concept

The **average** (arithmetic mean) of a set of values is the single value that, if every item were equal to it, would give the same total.

```text
Average = Sum of values / Number of values
```

Think of averages as **levelling**: if five friends have ₹10, ₹20, ₹30, ₹40 and ₹50, they could pool and redistribute ₹150 so that each has ₹30. Items above the average "give" to items below it.

This view explains every average shortcut: when a new item joins, it must bring the old average **plus** enough extra to raise everyone else's share. Most average questions are really questions about the **total**, so the most useful habit is:

```text
Sum = Average × Number
```

## Formulas

### Basic average

```text
Average = Sum / n        Sum = Average × n
```

- **Meaning:** total shared equally among n items.
- **Use when:** finding a missing value, a total, or the effect of a change.
- **Example:** five numbers average 20 → sum = 100. If four are 15, 18, 22, 25 (sum 80), the fifth is 20.
- **Common mistake:** averaging averages of groups with different sizes (see weighted average).

### Average of consecutive or evenly spaced numbers

```text
Average = (First + Last) / 2
```

- **Meaning:** for an arithmetic progression, values are symmetric around the middle.
- **Use when:** consecutive numbers, consecutive odd/even numbers, multiples of a number.
- **Example:** 12, 15, 18, 21, 24 → (12 + 24)/2 = 18.
- **Related results:**

| Set | Average |
|-----|---------|
| First n natural numbers | (n + 1)/2 |
| First n odd numbers | n |
| First n even numbers | n + 1 |
| Squares of first n natural numbers | (n + 1)(2n + 1)/6 |

- **Common mistake:** applying (first + last)/2 to numbers that are not evenly spaced.

### Weighted average

```text
Average = (n₁a₁ + n₂a₂ + …) / (n₁ + n₂ + …)
```

- **Meaning:** groups with more members pull the combined average harder.
- **Variables:** nᵢ = size of group i, aᵢ = its average.
- **Example:** 30 students averaging 60 and 20 averaging 75 → (1800 + 1500)/50 = 66.
- **Common mistake:** (60 + 75)/2 = 67.5 — correct only for equal group sizes.

### Adding, removing or replacing an item

```text
New item added      = New average + n × (increase in average)       (n = old count)
                    = Old average + (n + 1) × (increase in average)
Item replaced:      New item − Old item = n × (change in average)
```

- **Meaning:** the new item covers the new average for itself and the extra for each existing member.
- **Why it works:** if n items average A and a new item makes the average A + d, the new total is (n + 1)(A + d) = nA + A + (n + 1)d. The new item = A + (n + 1)d.
- **Example:** 30 students average 40 kg. A teacher joins and the average becomes 41 → teacher = 40 + 31 × 1 = 71 kg.
- **Replacement example:** 8 men's average rises by 2.5 kg when a 65 kg man is replaced → new man = 65 + 8 × 2.5 = 85 kg.
- **Common mistake:** multiplying by the wrong count (old vs new).

### Correcting a wrong entry

```text
Correct average = Wrong average + (Correct value − Wrong value) / n
```

- **Example:** the mean of 50 observations was 36, but 48 was recorded as 23 → 36 + (48 − 23)/50 = 36.5.

## Shortcuts and Tricks

### Deviation (assumed mean) method

- **Normal method:** add all values and divide.
- **Why the shortcut works:** each value = assumed mean + deviation. The average of the values is the assumed mean plus the average of the deviations; the large common part never needs adding.
- **Shortcut:** pick a round number near the values, add the small deviations, divide by n, and add to the assumed mean.
- **Demonstration:** 47, 52, 49, 55, 48 with assumed mean 50 → deviations −3, +2, −1, +5, −2 → sum +1 → average = 50 + 1/5 = 50.2.
- **Useful when:** values are large and close together.
- **Unsafe or unnecessary when:** values are small or widely spread — direct addition is as quick.

### Overlapping groups

- **Normal method:** write equations for each group's total.
- **Why the shortcut works:** when two groups share a member, adding both totals counts that member twice; subtracting the whole total isolates it.
- **Shortcut:** shared item = (total of group 1) + (total of group 2) − (total of all).
- **Demonstration:** 11 results average 50; first six average 49; last six average 52. Sixth = 294 + 312 − 550 = 56.
- **Useful when:** "first k" and "last k" overlap in one item.
- **Unsafe or unnecessary when:** the groups don't overlap (then they just add up).

## Problem Patterns

### Pattern 1: Missing value

**Recognise it:** average of all values given, all but one value known.

**Approach:** missing = average × n − (sum of known values).

**Example:** six numbers average 15; five of them sum to 72 → missing = 90 − 72 = 18.

### Pattern 2: Person joins or leaves

**Recognise it:** "When the teacher's age is included, the average increases by…"

**Approach:** compare totals: new total − old total = the person's value.

**Example:** 24 students average 12 years; with the teacher the average is 13 → teacher = 25 × 13 − 24 × 12 = 37.

### Pattern 3: Cricket / innings averages

**Recognise it:** "In the 17th innings he scores 85 and his average increases by 3."

**Approach:** let the old average be x: 16x + 85 = 17(x + 3) → solve.

**Example:** 16x + 85 = 17x + 51 → x = 34; new average 37.

### Pattern 4: Mixed groups

**Recognise it:** a combined average plus the averages and size of one sub-group; find the total count.

**Approach:** weighted average equation in the unknown count.

**Example:** all workers average ₹8,000; 7 technicians average ₹12,000; the rest average ₹6,000. 7 × 12000 + (n − 7) × 6000 = 8000n → n = 21.

## Common Mistakes

- Averaging group averages without weighting by group size.
- Using the old count instead of the new count when someone joins.
- Forgetting that the average of an AP is (first + last)/2 only for evenly spaced values.
- In wrong-entry corrections, subtracting in the wrong direction (correct − wrong, divided by n).

## Placement Tips

- Convert every average into a total immediately — totals add and subtract; averages do not.
- An added item that raises the average must be above the old average; use this to eliminate options.
- For consecutive numbers, the average is the middle number — no adding needed.

## Key Takeaways

- Sum = average × count.
- Evenly spaced values: average = (first + last)/2.
- Weighted average: Σnᵢaᵢ / Σnᵢ.
- New item = old average + (new count) × (increase); replacement difference = n × change.
- Correct average = wrong average + (correct − wrong)/n.
