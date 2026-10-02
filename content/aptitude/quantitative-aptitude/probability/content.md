# Probability

## Concept

**Probability** measures how likely an event is, on a scale from 0 (impossible) to 1 (certain). When all outcomes are equally likely:

```text
P(Event) = Number of favourable outcomes / Total number of outcomes
```

Rolling a fair die has 6 equally likely outcomes; three of them (2, 4, 6) are even, so P(even) = 3/6 = 1/2.

Probability is counting twice — the favourable outcomes and all outcomes — so it relies on [Permutation and Combination](../permutation-and-combination/content.md) whenever outcomes are too many to list. The other main tool is the **complement**: it is often easier to find the chance something does **not** happen.

## Key Terms

| Term | Meaning |
|------|---------|
| Experiment | An action with uncertain outcome (tossing a coin) |
| Sample space (S) | The set of all possible outcomes |
| Event (E) | A set of outcomes we are interested in |
| Mutually exclusive | Events that cannot happen together (getting 1 and 6 on one roll) |
| Independent | One event does not change the probability of the other (two separate coin tosses) |
| Complement (E′) | "E does not happen" |

## Standard Sample Spaces

| Experiment | Total outcomes | Notes |
|------------|----------------|-------|
| n coins | 2ⁿ | 1 coin: H, T; 2 coins: HH, HT, TH, TT |
| n dice | 6ⁿ | 2 dice: 36 ordered pairs; sum 7 is the most likely (6 ways) |
| A deck of cards | 52 | 4 suits × 13; 26 red (hearts, diamonds), 26 black (spades, clubs) |

Cards in detail: each suit has A, 2–10, J, Q, K. **Face cards** = J, Q, K → 12 in total. **Honours** are sometimes defined as A, K, Q, J → 16. Aces: 4. Kings: 4.

Sums of two dice:

| Sum | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|-----|---|---|---|---|---|---|---|---|----|----|----|
| Ways | 1 | 2 | 3 | 4 | 5 | 6 | 5 | 4 | 3 | 2 | 1 |

## Formulas

### Complement rule

```text
P(not E) = 1 − P(E)
```

- **Meaning:** an event either happens or it doesn't.
- **Use when:** "at least one", or when the opposite event is simpler to count.
- **Example:** at least one head in 2 tosses = 1 − P(no heads) = 1 − 1/4 = 3/4.
- **Common mistake:** computing "at least one" by adding cases and missing or double-counting some.

### Addition rule (OR)

```text
P(A or B) = P(A) + P(B) − P(A and B)
Mutually exclusive:  P(A or B) = P(A) + P(B)
```

- **Meaning:** add the probabilities, then remove the overlap that was counted twice.
- **Example:** a king or a heart: 4/52 + 13/52 − 1/52 (king of hearts) = 16/52 = 4/13.
- **Common mistake:** forgetting to subtract the overlap.

### Multiplication rule (AND)

```text
Independent events:  P(A and B) = P(A) × P(B)
Dependent events:    P(A and B) = P(A) × P(B given A)
```

- **Meaning:** both must happen; multiply the chance of the first by the chance of the second **given** the first.
- **Example (independent):** a head and then a six → 1/2 × 1/6 = 1/12.
- **Example (dependent):** two aces drawn without replacement → 4/52 × 3/51 = 1/221.
- **Common mistake:** using 4/52 × 4/52 when cards are not replaced.

### Selections using combinations

```text
P = (ways to choose favourable items) / (ways to choose any items)
```

- **Example:** 2 balls from 5 red and 3 blue; both red → ⁵C₂ / ⁸C₂ = 10/28 = 5/14.
- **Why it works:** every pair of balls is equally likely, so count pairs.

### Odds

```text
Odds in favour a : b   →  P(E) = a / (a + b)
Odds against  a : b    →  P(E) = b / (a + b)
```

- **Meaning:** odds compare favourable to unfavourable outcomes, not favourable to total.
- **Example:** odds against are 3 : 5 → P(E) = 5/8.
- **Common mistake:** reading odds of 3 : 5 as probability 3/5.

## Solving Approach

1. Define the experiment and count the total outcomes (list, 2ⁿ, 6ⁿ, 52, or ⁿCᵣ).
2. Count the favourable outcomes the same way — ordered vs unordered must match the total.
3. For "at least one", use 1 − P(none).
4. For multi-step events, multiply step probabilities, adjusting for "without replacement".
5. Simplify the fraction and check it is between 0 and 1.

## Shortcuts and Tricks

### "At least one" via the complement

- **Normal method:** add P(exactly 1) + P(exactly 2) + …
- **Why the shortcut works:** the only outcome not included is "none", and it is usually one simple product.
- **Shortcut:** 1 − P(none).
- **Demonstration:** at least one six in 3 rolls → 1 − (5/6)³ = 1 − 125/216 = 91/216.
- **Useful when:** "at least one", "solved by at least one person", "hits the target at least once".
- **Unsafe or unnecessary when:** the question asks for "exactly one" — the complement includes "2 or more" too.

### At least one person succeeds

- **Normal method:** add the cases where one, two, or all succeed.
- **Why the shortcut works:** the problem stays unsolved only if everyone fails, and independent failures multiply.
- **Shortcut:** P(solved) = 1 − (1 − p₁)(1 − p₂)…
- **Demonstration:** A solves with 1/2, B with 1/3 → 1 − (1/2)(2/3) = 2/3.
- **Useful when:** independent attempts at the same goal.
- **Unsafe or unnecessary when:** the attempts are not independent.

## Problem Patterns

### Pattern 1: Coins

**Recognise it:** n coins tossed; probability of exact/at least numbers of heads.

**Approach:** total 2ⁿ; favourable = ⁿCₖ for exactly k heads.

**Example:** exactly 2 heads with 3 coins → ³C₂/8 = 3/8.

### Pattern 2: Dice

**Recognise it:** one or two dice; sums, doublets, products.

**Approach:** 2 dice → 36 ordered outcomes; use the sum table.

**Example:** sum 8 → 5/36.

### Pattern 3: Cards

**Recognise it:** one or more cards drawn; suits, face cards, aces.

**Approach:** use the deck facts; subtract overlaps for "or"; use combinations for multiple cards.

**Example:** face card → 12/52 = 3/13.

### Pattern 4: Balls from a bag

**Recognise it:** coloured balls drawn with or without replacement.

**Approach:** combinations for simultaneous draws; multiply step-by-step probabilities for sequential draws.

**Example:** 4 white and 6 black, two drawn, one of each colour → (4 × 6)/¹⁰C₂ = 24/45 = 8/15.

### Pattern 5: Truth and contradiction

**Recognise it:** "A speaks the truth 3/4 of the time and B 4/5 of the time. Probability they contradict each other?"

**Approach:** they contradict when exactly one is truthful: P(A true, B lies) + P(A lies, B true).

**Example:** (3/4)(1/5) + (1/4)(4/5) = 3/20 + 4/20 = 7/20.

### Pattern 6: Calendar probability

**Recognise it:** "Probability that a leap year has 53 Sundays."

**Approach:** 366 days = 52 weeks + 2 extra days. The extra pair is one of 7 equally likely pairs (Sun–Mon, Mon–Tue, …, Sat–Sun); 2 contain Sunday → 2/7. (Non-leap year: 1 extra day → 1/7.)

## Common Mistakes

- Treating unordered outcomes as ordered (or vice versa) in only one of numerator/denominator.
- Forgetting the overlap in "A or B".
- Multiplying as if independent when drawing without replacement.
- Reading odds as probabilities.
- Listing 2-dice outcomes as 21 unordered pairs instead of 36 ordered ones.

## Placement Tips

- Write the total first; many options are fractions with the wrong denominator and can be eliminated at once.
- "At least" → complement; "exactly" → combinations.
- Memorise the two-dice sum table and the deck composition — they appear in most tests.

## Key Takeaways

- P(E) = favourable / total; 0 ≤ P ≤ 1; P(not E) = 1 − P(E).
- OR → add (minus overlap); AND → multiply (adjust when not replaced).
- At least one = 1 − P(none).
- Odds a : b in favour → a/(a + b).
- Use ⁿCᵣ to count selections in both numerator and denominator.
