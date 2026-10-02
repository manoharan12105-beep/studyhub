# Permutation and Combination

## Concept

This topic is about **counting** — how many ways something can be done — without listing every possibility.

- A **permutation** is an **arrangement**: order matters. ABC and BAC are different permutations.
- A **combination** is a **selection**: order does not matter. {A, B, C} is one combination however it is written.

The deciding question for every problem is: **"If I swap two chosen items, do I get a different outcome?"** If yes (ranks, seats, passwords, numbers), use permutations. If no (teams, committees, handshakes), use combinations.

Everything is built on one principle: if one choice can be made in m ways and a second, independent choice in n ways, both can be made in m × n ways.

## Key Terms

| Term | Meaning |
|------|---------|
| n! (n factorial) | n × (n − 1) × … × 2 × 1; 0! = 1 |
| ⁿPᵣ | Number of ordered arrangements of r items from n distinct items |
| ⁿCᵣ | Number of unordered selections of r items from n distinct items |
| With repetition | The same item may be used more than once |

Useful values: 3! = 6, 4! = 24, 5! = 120, 6! = 720, 7! = 5,040, 8! = 40,320.

## Formulas

### Fundamental counting principle

```text
AND (do both, one after the other) → multiply
OR  (do one or the other)           → add
```

- **Meaning:** independent stages multiply; mutually exclusive alternatives add.
- **Example:** 3 shirts and 4 trousers → 3 × 4 = 12 outfits. Travel by one of 3 buses or 2 trains → 3 + 2 = 5 ways.
- **Common mistake:** multiplying alternatives that cannot happen together.

### Permutations

```text
ⁿPᵣ = n! / (n − r)!          All n items:  n!
```

- **Meaning:** fill r positions in order: n choices for the first, n − 1 for the second, …, n − r + 1 for the r-th.
- **Example:** gold, silver and bronze among 8 runners → ⁸P₃ = 8 × 7 × 6 = 336.
- **Common mistake:** using ⁿCᵣ when positions are distinct.

### Permutations with identical items

```text
n! / (p! × q! × r! …)
```

- **Meaning:** arrangements of n items where p are identical of one kind, q of another, …
- **Why it works:** swapping identical items does not create a new arrangement, so divide out the p! duplicate orderings of each group.
- **Example:** LEADER has 6 letters with E twice → 6!/2! = 360.
- **Common mistake:** forgetting a repeated letter (BANANA has A × 3 and N × 2).

### Repetition allowed

```text
Arrangements of length r from n items with repetition = nʳ
```

- **Example:** 3-letter codes from A–E with repetition → 5³ = 125.

### Circular arrangements

```text
n distinct items around a circle:  (n − 1)!
If clockwise and anticlockwise are the same (necklace, garland):  (n − 1)! / 2
```

- **Why it works:** rotating everyone one seat gives the same circular arrangement. Fixing one person removes the n rotations.
- **Example:** 6 people at a round table → 5! = 120.
- **Common mistake:** using n! for circles; dividing by 2 for people at a table (seating is not reversible like a necklace).

### Combinations

```text
ⁿCᵣ = n! / (r! × (n − r)!)        ⁿCᵣ = ⁿCₙ₋ᵣ        ⁿPᵣ = ⁿCᵣ × r!
```

- **Meaning:** selections where order does not matter. Each selection of r items can be ordered in r! ways, so combinations = permutations ÷ r!.
- **Example:** choose 3 of 8 → ⁸C₃ = (8 × 7 × 6)/(3 × 2 × 1) = 56.
- **Common mistake:** computing ¹⁰C₈ the long way — use ¹⁰C₂ = 45.

### Selecting any number of items

```text
Subsets of n distinct items = 2ⁿ        At least one item = 2ⁿ − 1
```

- **Why it works:** each item is either taken or not — 2 choices per item.
- **Example:** at least one fruit from 5 different fruits → 2⁵ − 1 = 31.

### Geometry counts

```text
Lines through n points (no 3 collinear)       = ⁿC₂
Triangles from n points (no 3 collinear)      = ⁿC₃
Diagonals of an n-sided polygon               = ⁿC₂ − n = n(n − 3)/2
Handshakes among n people (each pair once)    = ⁿC₂
```

- **Example:** a decagon has 10 × 7/2 = 35 diagonals.

## Solving Approach

1. Decide: arrangement (P) or selection (C)?
2. Identify restrictions: items that must be together, apart, in fixed places, or at least/at most counts.
3. Handle restrictions **first** (fill restricted positions, glue "together" items into one block).
4. Fill the rest with the counting principle.
5. For "at least / at most / never", consider complementary counting: total − unwanted.

## Shortcuts and Tricks

### Glue method for "always together"

- **Normal method:** list cases for where the group can sit.
- **Why the shortcut works:** if items must be adjacent, treat them as one block; arrange the blocks, then arrange items inside the block.
- **Shortcut:** (number of blocks)! × (internal arrangements).
- **Demonstration:** ORANGE with vowels O, A, E together → block + R, N, G = 4 units → 4! × 3! = 144.
- **Useful when:** "always together", "must sit next to each other".
- **Unsafe or unnecessary when:** the block has identical items — divide inside the block as well.

### Gap method for "never together"

- **Normal method:** total − together (works only for a pair or single block).
- **Why the shortcut works:** placing the unrestricted items first creates gaps; putting each restricted item in a separate gap guarantees no two are adjacent.
- **Shortcut:** arrange the others, count the gaps (others + 1 in a row), then place the k restricted items in distinct gaps: ᵍPₖ (g = number of gaps).
- **Demonstration:** 5 boys and 3 girls in a row, no two girls together → 5! × ⁶P₃ = 120 × 120 = 14,400.
- **Useful when:** no two of a group may be adjacent.
- **Unsafe or unnecessary when:** only one specific pair must be apart — total − together is quicker.

### Complement for "at least one"

- **Normal method:** add the cases (exactly 1, exactly 2, …).
- **Why the shortcut works:** "at least one" is everything except "none".
- **Shortcut:** total − (selections with none).
- **Demonstration:** 4 people from 5 men and 3 women with at least one woman → ⁸C₄ − ⁵C₄ = 70 − 5 = 65.
- **Useful when:** "at least one" of something.
- **Unsafe or unnecessary when:** "at least 2" with few cases — direct addition can be as fast; complement must then subtract both "0" and "1" cases.

## Problem Patterns

### Pattern 1: Arranging letters of a word

**Recognise it:** "In how many ways can the letters of the word … be arranged?"

**Approach:** count letters and repeats → n!/(p!q!…); apply together/apart/position restrictions.

**Example:** BANANA → 6!/(3! 2!) = 60.

### Pattern 2: Forming numbers from digits

**Recognise it:** "How many 3-digit even numbers can be formed from …?"

**Approach:** fill the restricted places first — units digit for even/odd/divisibility, first digit cannot be 0 — then the rest.

**Example:** 3-digit even numbers from 1–6 without repetition → units: 3 choices (2, 4, 6) → hundreds: 5 → tens: 4 → 60.

### Pattern 3: Committees with conditions

**Recognise it:** select a team with "exactly", "at least" or "at most" members of a group.

**Approach:** split into cases by the group count and add products of combinations, or use the complement.

**Example:** 5 people from 6 men and 4 women with exactly 3 men → ⁶C₃ × ⁴C₂ = 20 × 6 = 120.

### Pattern 4: Circular seating with conditions

**Recognise it:** round table plus "two people must/must not sit together".

**Approach:** together → glue them: (n − 2)! × 2. Not together → (n − 1)! − (n − 2)! × 2.

**Example:** 6 people, two must not sit together → 120 − 4! × 2 = 120 − 48 = 72.

### Pattern 5: Grid paths

**Recognise it:** shortest paths on a grid moving only right and up.

**Approach:** a path is a sequence of R and U moves; choose positions of the U moves: ⁽ʳ⁺ᵘ⁾Cᵤ.

**Example:** 4 right and 3 up → ⁷C₃ = 35.

## Common Mistakes

- Using permutations for teams or combinations for rankings.
- Forgetting that 0 cannot lead a number.
- Forgetting to divide for repeated letters, or dividing for letters that are not repeated.
- Using n! instead of (n − 1)! for circular seating.
- In "at least" questions, adding overlapping cases or forgetting the "none" case.
- Not arranging the items inside a glued block.

## Placement Tips

- Write blanks for positions (_ _ _) and fill numbers of choices into them — it prevents most errors.
- Handle the most restricted position first.
- Learn small ⁿCᵣ values: ⁵C₂ = 10, ⁶C₂ = 15, ⁶C₃ = 20, ⁷C₃ = 35, ⁸C₃ = 56, ⁹C₃ = 84, ¹⁰C₃ = 120.
- When a count seems large, sanity-check with a tiny case (2 or 3 items) that you can list by hand.

## Key Takeaways

- Order matters → permutation (ⁿPᵣ); order doesn't → combination (ⁿCᵣ); ⁿPᵣ = ⁿCᵣ × r!.
- AND → multiply, OR → add.
- Identical items: n!/(p!q!…); repetition allowed: nʳ; circle: (n − 1)!.
- Together → glue; never together → gaps; at least one → total − none.
- Diagonals n(n − 3)/2; handshakes and lines ⁿC₂; triangles ⁿC₃.
