# Case Study: Design a URL Shortener — Practice

### P1. Write rate

**Difficulty:** Easy · **Type:** Estimation · **Concepts:** estimation

A shortener creates 300 million links per month. Roughly how many writes per second is that, and how many redirects per second at a 100 : 1 read ratio?

<details>
<summary>Answer</summary>

300 M ÷ ~2.6 M s ≈ **115 writes/s**; redirects ≈ **11,500/s** on average.

</details>

### P2. Base 62

**Difficulty:** Easy · **Type:** Output · **Concepts:** base-62 encoding

With the alphabet `0-9a-zA-Z`, what is the base-62 code for ID 3,844 (= 62²)?

<details>
<summary>Answer</summary>

3,844 = 1 × 62² + 0 × 62 + 0 → digits 1, 0, 0 → **"100"**.

</details>

### P3. Redirect status

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** 301 vs 302

A marketing team needs accurate click counts and the ability to change where a short link points. Which redirect status should the service use?

- A) 301 Moved Permanently
- B) 302 Found
- C) 200 OK with an HTML page
- D) 404 Not Found

<details>
<summary>Answer</summary>

**Answer:** B) 302 Found

301 would let browsers cache the redirect, skipping the service on later clicks.

</details>

### P4. Collision handling

**Difficulty:** Medium · **Type:** Design · **Concepts:** unique codes

You generate random 7-character codes. Describe how to guarantee uniqueness when 20 servers create links concurrently.

<details>
<summary>Answer</summary>

Make the short code the primary key (unique constraint) and insert directly; if the insert fails with a duplicate-key error, generate a new random code and retry. The database enforces uniqueness atomically, so no separate "check then insert" race exists.

</details>

### P5. Bot scanning

**Difficulty:** Hard · **Type:** Failure · **Concepts:** cache penetration

A bot requests millions of random non-existent codes per hour, and database CPU spikes. Explain why the cache doesn't help and give three defences.

<details>
<summary>Answer</summary>

Non-existent codes are never in the cache, so every request misses and queries the database (cache penetration). Defences: negative caching of "not found" for a short TTL; a Bloom filter of existing codes checked before the database; per-IP rate limiting and bot detection at the edge.

</details>
