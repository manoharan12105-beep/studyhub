# Problems on Ages

## Concept

Age problems describe people's ages at different times — now, some years ago, some years later — and ask you to find present ages. They are linear-equation problems in disguise, made easier by two facts:

1. **Everyone ages at the same rate.** After t years, every person is t years older.
2. **So the difference between two people's ages never changes.** A father who is 30 years older than his son is always 30 years older.

The skill is translating sentences into equations correctly. Once the equation is right, the algebra is short (see [Algebra](../algebra/content.md) for solving linear equations).

## Rules

| Phrase | Translation (present age = x) |
|--------|-------------------------------|
| t years ago | x − t |
| t years hence / after t years | x + t |
| A is k times as old as B | A = kB |
| A is t years older than B | A = B + t |
| Ratio of ages is a : b | ages ax and bx |
| At the time of B's birth, A was t years old | A − B = t (forever) |

- Apply "ago/hence" to **every** person in the statement — if A's age is taken 5 years ago, B's must be too.
- Ages cannot be negative, and a parent must be older than a child by a realistic gap — use this to reject one root of a quadratic.

## Solving Approach

1. Choose variables for **present** ages (prefer one variable using a given relation, e.g. father = son + 30).
2. Translate each time-shifted statement using the table above.
3. Solve the equation(s).
4. Answer exactly what is asked (present age, age after t years, ratio …).
5. Check the answer against every condition.

## Shortcuts and Tricks

### The constant-difference ratio method

- **Normal method:** ages ax and bx; write (ax + t)/(bx + t) = c/d and solve.
- **Why the shortcut works:** the age difference never changes. If both ratios are scaled so that their differences are equal, each unit stands for the same number of years in both ratios, and the change in a person's units must equal t years.
- **Shortcut:**
  1. Make the differences of the two ratios equal (scale if needed).
  2. Change in one person's units = t years → value of one unit.
- **Demonstration:** ages are 3 : 5 now and will be 5 : 7 after 8 years. Differences: 5 − 3 = 2 and 7 − 5 = 2 (equal). Elder person: 5 → 7 units = 2 units = 8 years → 1 unit = 4 years → ages 12 and 20.
- **Useful when:** two ratios at two different times are given.
- **Unsafe or unnecessary when:** the statements involve sums, products or "times as old" with a constant — set up equations instead.

### Averages of families

- **Normal method:** track every person's age separately.
- **Why the shortcut works:** a group's total age changes by (number of people) × (years passed).
- **Shortcut:** total t years ago = present total − n × t (for people alive then).
- **Demonstration:** a family of 5 averages 24 (total 120). The youngest is 8. At the youngest's birth, the other 4 had a total of 120 − 8 − 4 × 8 = 80 → average 20.
- **Useful when:** average age questions spanning several years.
- **Unsafe or unnecessary when:** people joined or left the group in between — handle them separately.

## Problem Patterns

### Pattern 1: "Times as old" at two different times

**Recognise it:** a multiple relationship now (or in the past) and another in the future.

**Approach:** one variable for the younger person; express the other using the first relation; substitute into the second.

**Example:** father is 30 years older than son; in 5 years he will be 3 times as old. S + 35 = 3(S + 5) → S = 10, F = 40.

### Pattern 2: Ratios at two times

**Recognise it:** "ratio was a : b, t years ago" and "ratio will be c : d after s years".

**Approach:** ages ax, bx (at one of the times) and cross-multiply, or use the constant-difference method.

**Example:** 6 years ago A : B = 6 : 5; 4 years hence 11 : 10. Let ages 6 years ago be 6x, 5x. Ten years later: (6x + 10)/(5x + 10) = 11/10 → x = 2 → present ages 18 and 16.

### Pattern 3: Children born at equal intervals

**Recognise it:** "born at intervals of k years" with a total or average.

**Approach:** ages x, x + k, x + 2k, … form an AP; sum = n × middle age.

**Example:** five children born 3 years apart, total 50 → middle child = 10 → youngest = 10 − 6 = 4.

### Pattern 4: Product of ages

**Recognise it:** "the product of their ages is …".

**Approach:** quadratic equation, or factor the product into two numbers with the right difference.

**Example:** A is 4 years older than B; product = 221 = 13 × 17 → B = 13, A = 17.

## Common Mistakes

- Shifting only one person's age by t years.
- Answering the age at the wrong time (present vs future).
- Setting the ratio variables at one time and treating them as present ages.
- Accepting a negative or unrealistic root of a quadratic.

## Placement Tips

- Plugging in options is often fastest: take each option as the present age and test both conditions.
- Note the age difference first — it is fixed and narrows the options instantly.
- Watch the question's final ask: many wrong options are the right age at the wrong time.

## Key Takeaways

- Age differences never change; every age changes by the same t.
- Translate carefully: ago → subtract, hence → add, for every person.
- Ratio at two times → ax, bx and cross-multiply, or equalise ratio differences.
- Group total t years ago = present total − n × t.
