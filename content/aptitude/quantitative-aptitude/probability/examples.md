# Probability — Solved Examples

### E1. One die

**Difficulty:** Easy · **Pattern:** Dice

**Problem:** A fair die is rolled. What is the probability of getting a prime number?

**Solution:**

1. Outcomes: 1, 2, 3, 4, 5, 6 → 6.
2. Primes: 2, 3, 5 → 3 (1 is not prime).
3. P = 3/6 = 1/2.

**Answer:** **1/2**

### E2. At least one head

**Difficulty:** Easy · **Pattern:** Coins

**Problem:** Two coins are tossed. What is the probability of getting at least one head?

**Solution:**

1. Outcomes: HH, HT, TH, TT → 4.
2. No heads: TT → probability 1/4.
3. At least one head = 1 − 1/4 = 3/4.

**Answer:** **3/4**

### E3. Sum of two dice

**Difficulty:** Medium · **Pattern:** Dice

**Problem:** Two dice are rolled. What is the probability that the sum is 8?

**Solution:**

1. Total ordered outcomes = 36.
2. Sum 8: (2, 6), (3, 5), (4, 4), (5, 3), (6, 2) → 5.
3. P = 5/36.

**Answer:** **5/36**

### E4. King or heart

**Difficulty:** Medium · **Pattern:** Cards

**Problem:** One card is drawn from a well-shuffled deck of 52. What is the probability that it is a king or a heart?

**Solution:**

1. Kings: 4. Hearts: 13. King of hearts counted in both: 1.
2. P = (4 + 13 − 1)/52 = 16/52 = 4/13.

**Answer:** **4/13**

### E5. Two balls of the same colour

**Difficulty:** Medium · **Pattern:** Balls from a bag

**Problem:** A bag has 5 red and 3 blue balls. Two balls are drawn at random without replacement. What is the probability that both are red?

**Solution:**

1. Total pairs: ⁸C₂ = 28.
2. Red pairs: ⁵C₂ = 10.
3. P = 10/28 = 5/14.

**Answer:** **5/14**

> [!TIP]
> Step by step: 5/8 × 4/7 = 20/56 = 5/14 — the same answer.

### E6. At least one six

**Difficulty:** Hard · **Pattern:** Complement

**Problem:** A die is rolled 3 times. What is the probability of getting at least one six?

**Solution:**

1. P(no six in one roll) = 5/6.
2. P(no six in 3 rolls) = (5/6)³ = 125/216.
3. P(at least one six) = 1 − 125/216 = 91/216.

**Answer:** **91/216**

### E7. Problem solved by at least one person

**Difficulty:** Hard · **Pattern:** Complement

**Problem:** A can solve a problem with probability 1/2 and B with probability 1/3, independently. What is the probability that the problem is solved?

**Solution:**

1. It stays unsolved only if both fail: (1 − 1/2)(1 − 1/3) = 1/2 × 2/3 = 1/3.
2. P(solved) = 1 − 1/3 = 2/3.

**Answer:** **2/3**

> [!WARNING]
> 1/2 + 1/3 = 5/6 is wrong — it double-counts the case where both solve it.

### E8. Odds to probability

**Difficulty:** Hard · **Pattern:** Odds

**Problem:** The odds against an event are 3 : 5. What is the probability that the event happens?

**Solution:**

1. Odds against 3 : 5 → 3 unfavourable for every 5 favourable.
2. Total = 8 → P(event) = 5/8.

**Answer:** **5/8**
