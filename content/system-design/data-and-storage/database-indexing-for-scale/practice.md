# Database Indexes at Scale — Practice

### P1. Write cost

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** index trade-off

A table has 12 indexes and inserts are slow. What is the most likely reason?

- A) Indexes make inserts faster, so it is something else
- B) Each insert must update all 12 indexes
- C) Indexes lock the table permanently
- D) The table has too few rows

<details>
<summary>Answer</summary>

**Answer:** B) Each insert must update all 12 indexes

</details>

### P2. Pick the index

**Difficulty:** Medium · **Type:** Design · **Concepts:** composite index

Query: `SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 20`. Which index best serves it, and would an index on `(created_at, customer_id)` be as good?

<details>
<summary>Answer</summary>

`orders(customer_id, created_at DESC)`: it jumps to the customer and reads 20 entries already sorted. `(created_at, customer_id)` is much worse: rows for one customer are scattered through it, so the database would scan many entries.

</details>

### P3. Rewrite to use the index

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** sargable predicates

`WHERE LOWER(email) = 'a@x.com'` ignores the index on `email`. Give two fixes.

<details>
<summary>Answer</summary>

(1) Store emails normalised to lower case and query `WHERE email = 'a@x.com'`. (2) Create an expression index on `LOWER(email)` so the predicate can use it.

</details>
