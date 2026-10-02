# Number System — Solved Examples

### E1. Testing a number for primality

**Difficulty:** Easy · **Pattern:** Types of Numbers

**Problem:** Is 221 a prime number?

**Solution:**

1. √221 is between 14 (196) and 15 (225), so test primes up to 14: 2, 3, 5, 7, 11, 13.
2. 221 is odd (not 2); digit sum 5 (not 3); does not end in 0/5 (not 5).
3. 221 ÷ 7 = 31.57… (no). 221 ÷ 11 = 20.09… (no).
4. 221 ÷ 13 = 17 exactly.

**Answer:** 221 = 13 × 17, so it is **not prime**.

### E2. Divisibility by a composite number

**Difficulty:** Easy · **Pattern:** Divisibility Rules

**Problem:** Is 451,672 divisible by 24?

**Solution:**

1. Split 24 into co-prime factors: 24 = 3 × 8.
2. Test 8: last three digits 672 ÷ 8 = 84 → divisible by 8.
3. Test 3: digit sum 4 + 5 + 1 + 6 + 7 + 2 = 25 → not divisible by 3.

**Answer:** **No.** It is divisible by 8 but not by 3, so not by 24.

> [!WARNING]
> Splitting 24 as 4 × 6 would be wrong — 4 and 6 share the factor 2, so passing both tests would not guarantee divisibility by 24.

### E3. HCF and LCM, and checking with the product rule

**Difficulty:** Easy · **Pattern:** HCF and LCM

**Problem:** Find the HCF and LCM of 36 and 84.

**Solution:**

1. 36 = 2² × 3²; 84 = 2² × 3 × 7.
2. HCF: common primes 2 and 3 with lowest powers → 2² × 3 = 12.
3. LCM: all primes with highest powers → 2² × 3² × 7 = 252.
4. Check: HCF × LCM = 12 × 252 = 3024 and 36 × 84 = 3024 ✓.

**Answer:** HCF = **12**, LCM = **252**.

### E4. Number of factors, sum of factors, even factors

**Difficulty:** Medium · **Pattern:** Factors and Multiples

**Problem:** For 360, find (a) the number of factors, (b) the sum of factors, (c) the number of even factors.

**Solution:**

1. 360 = 2³ × 3² × 5¹.
2. (a) (3 + 1)(2 + 1)(1 + 1) = 4 × 3 × 2 = 24.
3. (b) (2⁴ − 1)/(2 − 1) × (3³ − 1)/(3 − 1) × (5² − 1)/(5 − 1) = 15 × 13 × 6 = 1170.
4. (c) Odd factors use only 3² × 5 → (2 + 1)(1 + 1) = 6. Even factors = 24 − 6 = 18.

**Answer:** (a) **24** (b) **1170** (c) **18**

> [!TIP]
> Even factors directly: every even factor contains at least one 2, so the power of 2 has 3 choices (2¹, 2², 2³) instead of 4 → 3 × 3 × 2 = 18.

### E5. Largest divisor leaving given remainders

**Difficulty:** Medium · **Pattern:** HCF with remainders

**Problem:** Find the greatest number that divides 1657 and 2037 leaving remainders 6 and 5 respectively.

**Solution:**

1. Removing the remainders makes both numbers exactly divisible: 1657 − 6 = 1651 and 2037 − 5 = 2032.
2. The required number is HCF(1651, 2032).
3. Euclid: 2032 ÷ 1651 → remainder 381. 1651 ÷ 381 → 4 × 381 = 1524, remainder 127. 381 ÷ 127 = 3, remainder 0.
4. HCF = 127.

**Answer:** **127**

### E6. Events happening together

**Difficulty:** Medium · **Pattern:** LCM

**Problem:** Four bells ring at intervals of 6, 8, 12 and 18 minutes. They ring together at 8:00 a.m. When will they next ring together?

**Solution:**

1. They ring together again after LCM(6, 8, 12, 18) minutes.
2. 6 = 2 × 3, 8 = 2³, 12 = 2² × 3, 18 = 2 × 3² → LCM = 2³ × 3² = 72.
3. 72 minutes = 1 hour 12 minutes after 8:00 a.m.

**Answer:** **9:12 a.m.**

### E7. Remainder of a large power

**Difficulty:** Medium · **Pattern:** Remainders of powers

**Problem:** Find the remainder when 3¹⁰⁰ is divided by 7.

**Solution:**

1. Find the cycle of remainders of 3ⁿ ÷ 7:
   3¹ → 3, 3² → 2, 3³ → 6, 3⁴ → 4, 3⁵ → 5, 3⁶ → 1.
2. The cycle length is 6 (it returns to 1 at 3⁶).
3. 100 = 6 × 16 + 4, so 3¹⁰⁰ leaves the same remainder as 3⁴.
4. 3⁴ = 81 = 7 × 11 + 4.

**Answer:** **4**

> [!TIP]
> Fermat's little theorem gives the cycle length immediately: 7 is prime, so 3⁶ leaves remainder 1.

### E8. Unit digit of a product of powers

**Difficulty:** Medium · **Pattern:** Unit Digit

**Problem:** Find the unit digit of 23⁴⁵ × 47²².

**Solution:**

1. Only the last digits matter: 3⁴⁵ × 7²².
2. 3⁴⁵: 45 mod 4 = 1 → first term of (3, 9, 7, 1) → 3.
3. 7²²: 22 mod 4 = 2 → second term of (7, 9, 3, 1) → 9.
4. 3 × 9 = 27 → unit digit 7.

**Answer:** **7**

### E9. Negative remainders

**Difficulty:** Hard · **Pattern:** Remainders

**Problem:** Find the remainder when 98 × 99 × 101 is divided by 100.

**Solution:**

1. Remainders with respect to 100: 98 → −2, 99 → −1, 101 → 1.
2. Product of remainders: (−2) × (−1) × 1 = 2.
3. 2 is already between 0 and 99.

**Answer:** **2** (check: 98 × 99 × 101 = 979,902).

### E10. Trailing zeros of a factorial

**Difficulty:** Hard · **Pattern:** Factors and Multiples

**Problem:** How many zeros are at the end of 100!?

**Solution:**

1. Count the factors of 5 in 1 × 2 × … × 100.
2. Multiples of 5: ⌊100/5⌋ = 20.
3. Multiples of 25 give an extra 5 each: ⌊100/25⌋ = 4.
4. ⌊100/125⌋ = 0, so stop.
5. Total = 20 + 4 = 24. Factors of 2 are more plentiful, so every 5 pairs with a 2.

**Answer:** **24**
