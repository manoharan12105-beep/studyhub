# Caching Strategies and Redis — Practice

### P1. Cache or not?

**Difficulty:** Easy · **Type:** MCQ

Which is the **worst** candidate for caching?

- A) List of product categories
- B) Currency exchange rates refreshed hourly
- C) A customer's current wallet balance used for payments
- D) Home page banner configuration

<details>
<summary>Answer</summary>

**Answer:** C) A customer's current wallet balance used for payments

**Explanation:** Payment decisions require strictly current data; stale balances can cause overspending.

</details>

### P2. Stale prices

**Difficulty:** Medium · **Type:** Debugging

Product prices are cached locally (Caffeine) on 4 instances. After an admin changes a price, some users see the old price for up to an hour. Explain and propose two fixes.

<details>
<summary>Answer</summary>

The update evicted the entry only on the instance that handled the admin request; others keep their local copies until the 1-hour TTL. Fixes: use a shared Redis cache, broadcast invalidation events to all instances (Redis pub/sub or a message broker), or shorten the TTL for this data.

</details>

### P3. Design the cache key

**Difficulty:** Medium · **Type:** Design

Recommendations are personalised per user and per category. What cache key and TTL would you use, and what could go wrong with a key of just `category`?

<details>
<summary>Answer</summary>

Key `recommendations:{userId}:{categoryId}` (plus a version prefix for format changes) with a short TTL (e.g. 10–30 minutes). A key of just `category` would serve one user's personalised recommendations to everyone — a data leak.

</details>
