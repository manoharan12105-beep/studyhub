# Sharding and Partitioning — Practice

### P1. Which shard?

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** modulo sharding

With `shard = user_id % 4`, which shard holds users 10, 13, 20 and 31?

<details>
<summary>Answer</summary>

10 → 2, 13 → 1, 20 → 0, 31 → 3.

</details>

### P2. What sharding fixes

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** when to shard

Which problem does sharding solve that read replicas do not?

- A) Too many read queries
- B) Data and write volume that exceed one primary
- C) Slow DNS lookups
- D) Stale cache entries

<details>
<summary>Answer</summary>

**Answer:** B) Data and write volume that exceed one primary

</details>

### P3. Range hotspot

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** range partitioning

Events are range-partitioned by `created_at` month. Almost all writes and reads involve the current month. What happens and how do you fix it?

<details>
<summary>Answer</summary>

The current month's shard takes nearly all traffic (a hotspot) while old shards idle. Use a compound key: hash by a high-cardinality field (such as `device_id` or `user_id`) and keep time as a clustering/range component within each shard, or bucket the current month across several shards.

</details>

### P4. Pick the shard key

**Difficulty:** Medium · **Type:** Design · **Concepts:** shard key choice

A multi-tenant SaaS app: every query includes `tenant_id`; tenants vary from 10 to 2 million users. Which shard key, and what risk?

<details>
<summary>Answer</summary>

`tenant_id`, because every query targets one tenant, so queries stay on one shard and tenants are isolated. Risk: very large tenants create hot or oversized shards; use a directory so big tenants can get dedicated shards (or be split further by a secondary key).

</details>

### P5. Moved data

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** resharding cost

With `user_id % N`, roughly what share of users move when going from 4 to 5 shards? Check with users 1–20.

<details>
<summary>Answer</summary>

A user stays only if `id % 4 == id % 5`, which happens for 4 out of every 20 ids (0, 1, 2, 3 in each block of 20). Users 1–20: ids 1, 2, 3 and 20 stay → 16 of 20 move, **80 %**. Consistent hashing would move only about 20 %.

</details>
