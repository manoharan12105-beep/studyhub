# Distributed Caching — Practice

### P1. Shared view

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** local vs distributed

Users sometimes see different prices on consecutive page loads served by different app servers. Each server caches prices locally for 10 minutes. Why?

- A) The database is corrupt
- B) Each server's local cache loaded the price at a different time, so copies differ
- C) The CDN is down
- D) Redis is too slow

<details>
<summary>Answer</summary>

**Answer:** B) Each server's local cache loaded the price at a different time, so copies differ

</details>

### P2. Remapped keys

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** modulo hashing

Using `hash % N`, roughly what fraction of keys move when going from 3 to 4 nodes? With ideal consistent hashing?

<details>
<summary>Answer</summary>

Modulo: a key stays only when `h % 3 == h % 4`, which holds for 3 of every 12 values → about **75 % move**. Consistent hashing: the new node takes about **1/4 = 25 %**.

</details>

### P3. Hash tags

**Difficulty:** Medium · **Type:** Design · **Concepts:** Redis Cluster

You need to update `cart:42` and `profile:42` together in one Redis Cluster transaction, but the command fails with a cross-slot error. How do you fix the keys?

<details>
<summary>Answer</summary>

Use a hash tag so both keys hash to the same slot: `{user:42}:cart` and `{user:42}:profile`. Only the part inside braces is hashed.

</details>
