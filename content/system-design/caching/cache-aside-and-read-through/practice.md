# Cache-Aside and Read-Through — Practice

### P1. Who loads?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** cache-aside

In cache-aside, who reads the database on a cache miss?

- A) The cache server automatically
- B) The application
- C) The load balancer
- D) Nobody; misses return null

<details>
<summary>Answer</summary>

**Answer:** B) The application

</details>

### P2. Order of operations

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** invalidation order

A developer writes: `cache.delete(key); db.update(key, v2);`. Under concurrent reads, what can go wrong?

<details>
<summary>Answer</summary>

Between the delete and the update, a reader misses, loads the old value v1 from the database and caches it. After the update, the cache still holds v1 until the TTL expires. Update the database first, then delete the cache entry.

</details>

### P3. Trace it

**Difficulty:** Medium · **Type:** Output · **Concepts:** cache-aside flow

Cache-aside with TTL 60 s. t=0: read `p:1` (not cached; DB has "A"). t=10: update DB to "B" and delete `p:1`. t=20: read `p:1`. t=30: read `p:1`. Which reads hit, and what do they return?

<details>
<summary>Answer</summary>

t=0: miss, returns "A" and caches it. t=20: miss (entry deleted at t=10), returns "B" and caches it. t=30: hit, returns "B".

</details>
