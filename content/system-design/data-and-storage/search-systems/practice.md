# Search Systems — Practice

### P1. Inverted index lookup

**Difficulty:** Easy · **Type:** Output · **Concepts:** inverted index

Index: `fast → 1, 4`, `car → 1, 2, 3`, `red → 2, 4`. Which documents contain both "fast" and "car"? Which contain "red" or "fast"?

<details>
<summary>Answer</summary>

Both "fast" and "car": {1, 4} ∩ {1, 2, 3} = **{1}**. "red" or "fast": {2, 4} ∪ {1, 4} = **{1, 2, 4}**.

</details>

### P2. Source of truth

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** search architecture

In a typical design, where does authoritative product data live?

- A) Only in Elasticsearch
- B) In the primary database, with Elasticsearch holding a derived copy for search
- C) In the CDN
- D) In each user's browser

<details>
<summary>Answer</summary>

**Answer:** B) In the primary database, with Elasticsearch holding a derived copy for search

</details>

### P3. Do you need it?

**Difficulty:** Medium · **Type:** Trade-off · **Concepts:** when to add search

An internal admin tool needs to find customers by exact email or by name prefix across 50,000 rows. Do you add an Elasticsearch cluster?

<details>
<summary>Answer</summary>

No. An index on email and a prefix query (`name LIKE 'Ra%'` can use a suitable B-tree index) or PostgreSQL full-text search handles 50,000 rows easily, with no synchronisation pipeline or extra cluster to operate.

</details>
