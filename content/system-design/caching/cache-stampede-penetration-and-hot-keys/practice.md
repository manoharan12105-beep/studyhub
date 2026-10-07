# Cache Stampede, Penetration and Hot Keys — Practice

### P1. Name the problem

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** failure patterns

Name each: (a) bots request millions of random product IDs that don't exist; (b) the trending list expires and 800 identical queries hit the database at once; (c) one cache node is at 100 % CPU serving a single celebrity post.

<details>
<summary>Answer</summary>

(a) Cache penetration, (b) cache stampede, (c) hot key.

</details>

### P2. TTL jitter

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** stampede prevention

10,000 product entries were loaded at the same moment after a deploy, each with a 300 s TTL. What does adding ±10 % random jitter achieve?

- A) Makes the cache faster
- B) Spreads expirations over about 60 seconds instead of one instant
- C) Prevents all misses
- D) Reduces memory usage

<details>
<summary>Answer</summary>

**Answer:** B) Spreads expirations over about 60 seconds instead of one instant

TTLs between 270 s and 330 s.

</details>

### P3. Coalescing math

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** request coalescing

A hot key is read 2,000 times/s by 20 app servers (evenly). Rebuilding takes 200 ms. On expiry without coalescing, roughly how many database queries are issued for it? With per-server single-flight coalescing? With a global lock?

<details>
<summary>Answer</summary>

Without coalescing: every request during the 200 ms rebuild misses → about 2,000 × 0.2 = **400 queries**. Per-server single flight: one per server → **20 queries**. Global lock: **1 query** (others wait or serve stale).

</details>

### P4. Bloom filter behaviour

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** Bloom filter

A Bloom filter of valid product IDs says product 77 is "possibly present" and product 88 is "definitely not present". What should the service do for each?

<details>
<summary>Answer</summary>

77: proceed with the normal lookup (cache, then database) — it may exist or be a false positive. 88: return "not found" immediately without querying the database; a Bloom filter never gives false negatives (assuming it is kept up to date with new products).

</details>
