# Diff Inspection, Security Review and Performance Investigation — Practice

### P1. Spot the sink

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** SQL injection

Which line is injectable?

- A) `jdbc.queryForList("SELECT id FROM orders WHERE customer_email = ?", Long.class, email)`
- B) `jdbc.queryForList("SELECT id FROM orders WHERE customer_email = '" + email + "'", Long.class)`
- C) `orders.findById(id)`
- D) `@Email String customerEmail`

<details>
<summary>Answer</summary>

**Answer:** B) `jdbc.queryForList("SELECT id FROM orders WHERE customer_email = '" + email + "'", Long.class)`

User input becomes part of the SQL text.

</details>

### P2. Predict the injection

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** injection mechanics

With the starter DAO, what SQL runs for `email = x' OR '1'='1`, and why does it return every order?

<details>
<summary>Answer</summary>

`SELECT id FROM orders WHERE customer_email = 'x' OR '1'='1' ORDER BY id`. `'1'='1'` is true for every row, so the `OR` matches all orders — the starter app returned `[1,2]`.

</details>

### P3. Wrong fix

**Difficulty:** Medium · **Type:** Code review · **Concepts:** parameterization

A proposed fix: `String safe = email.replace("'", "''");` then concatenate `safe`. Review it.

<details>
<summary>Answer</summary>

It may block this payload but relies on hand-escaping every case correctly, for every database and setting, forever. Use a `?` parameter so the driver sends the value separately from the SQL text, and keep the regression test.

</details>

### P4. Read the plan

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** query plans

Before the index, H2's plan shows `/* PUBLIC.PRIMARY_KEY_8 */` with `WHERE "CUSTOMER_EMAIL" = ?1`. After, `/* PUBLIC.IDX_ORDERS_CUSTOMER_EMAIL: CUSTOMER_EMAIL = ?1 */`. What changed?

<details>
<summary>Answer</summary>

Before: H2 walks the primary-key index (all rows, in `id` order, which also satisfies `ORDER BY`) and filters each row by email. After: it looks up only the matching entries in the email index. That's why the median time fell from milliseconds to tens or hundreds of microseconds.

</details>

### P5. One number isn't a measurement

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** benchmarking

Claude reports "the search took 9 ms before and 0.05 ms after". You get 16 ms and 0.14 ms. Who is wrong?

<details>
<summary>Answer</summary>

Probably neither. Absolute timings vary with machine, load and JIT warm-up; the verified runs ranged from 8.9 to 17.9 ms before and 53 to 166 µs after. Compare medians from many runs on the same machine, and rely on the plan change for the explanation.

</details>

### P6. Cache or index?

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** performance fixes

Compare adding a cache with adding an index for the slow support search.

<details>
<summary>Answer</summary>

The index fixes the cause (full scan) for every query, stays consistent automatically, and costs some write speed and storage. A cache hides the cost only for repeated identical searches, adds staleness (new orders missing) and invalidation code, and does nothing for first lookups. Measure first; here the plan shows the index is the right fix.

</details>

### P7. Prove the fix

**Difficulty:** Hard · **Type:** Workflow design · **Concepts:** security regression tests

Describe a test that fails on the starter DAO and passes on the fixed one, and explain why it needs a stored order.

<details>
<summary>Answer</summary>

Store at least one order (for example `meera@example.com`), call `GET /api/orders/search?email=x' OR '1'='1`, and expect an empty list. On the starter the injected `OR` returns the stored orders (`expected:<0> but was:<2>` in the verified run); on the fixed DAO nobody has that literal email, so the result is empty. Without stored rows, both versions return `[]` and the test proves nothing.

</details>
