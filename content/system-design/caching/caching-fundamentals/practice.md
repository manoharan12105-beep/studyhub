# Caching Fundamentals — Practice

### P1. Hit or miss

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** hit and miss

A request finds its data in Redis and returns without touching the database. This is:

- A) A cache miss
- B) A cache hit
- C) A cache stampede
- D) Cache invalidation

<details>
<summary>Answer</summary>

**Answer:** B) A cache hit

</details>

### P2. Database load

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** hit ratio

10,000 reads/s. How many reach the database at hit ratios of 99 %, 95 % and 90 %?

<details>
<summary>Answer</summary>

99 %: **100/s**. 95 %: **500/s**. 90 %: **1,000/s**. Dropping from 99 % to 90 % multiplies database load by ten.

</details>

### P3. Average latency

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** latency

Cache lookup 1 ms; database query 40 ms (after a miss you pay both). What is the average latency at a 90 % hit ratio?

<details>
<summary>Answer</summary>

0.9 × 1 + 0.1 × (1 + 40) = 0.9 + 4.1 = **5 ms**.

</details>

### P4. Cache or not

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** what to cache

Cache it (Y) or not (N)? (a) the top-10 trending list recomputed every minute, (b) a bank balance shown just before a withdrawal is approved, (c) a product description page, (d) a one-time password.

<details>
<summary>Answer</summary>

(a) Y, (b) N — read the source of truth for the decision, (c) Y, (d) N as a performance cache (it is used once; it may be *stored* in Redis with a short expiry, but that is storage, not caching for reuse).

</details>
