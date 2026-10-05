# Index Fundamentals — Practice

### P1. Which query can use the index?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** composite index, leading column

Index: `CREATE INDEX ON orders (customer_id, order_date)`. Which query uses it most efficiently?

- A) `WHERE order_date = '2026-03-01'`
- B) `WHERE customer_id = 1 AND order_date >= '2026-03-01'`
- C) `WHERE extract(year FROM order_date) = 2026`
- D) `WHERE customer_id::text = '1'`

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** Equality on the leading column plus a range on the second column is the ideal shape. A lacks the leading column (only a PostgreSQL 18 skip scan could help, and only if `customer_id` has few values); C and D wrap columns in an expression/cast.

</details>

### P2. Index the foreign key

**Difficulty:** Easy · **Type:** Query · **Concepts:** FK indexes, pg_indexes

List the indexes on `orders` and `order_items` in the sample database, then add the index that the `orders.customer_id` foreign key is missing.

**Expected output:**

```text
  tablename  |       indexname        |                                           indexdef
-------------+------------------------+-----------------------------------------------------------------------------------------------
 order_items | order_items_pkey       | CREATE UNIQUE INDEX order_items_pkey ON public.order_items USING btree (order_id, product_id)
 orders      | orders_customer_id_idx | CREATE INDEX orders_customer_id_idx ON public.orders USING btree (customer_id)
 orders      | orders_pkey            | CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (order_id)
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE INDEX orders_customer_id_idx ON orders (customer_id);

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, indexname;
```

**Explanation:** Only the primary keys had indexes. `order_items.product_id` is a foreign key without an index too; `order_items.order_id` is covered as the leading column of the primary key `(order_id, product_id)`.

</details>

### P3. Rewrite for the index

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** sargable predicates

`orders` has an index on `order_date`. Rewrite each condition so that the index can be used:

1. `WHERE extract(month FROM order_date) = 3 AND extract(year FROM order_date) = 2026`
2. `WHERE order_date + 7 > CURRENT_DATE`
3. `WHERE to_char(order_date, 'YYYY-MM-DD') = '2026-03-15'`

<details>
<summary>Answer</summary>

Move the computation to the constant side so the column stays bare:

1. `WHERE order_date >= DATE '2026-03-01' AND order_date < DATE '2026-04-01'`
2. `WHERE order_date > CURRENT_DATE - 7`
3. `WHERE order_date = DATE '2026-03-15'`

Such conditions are called **sargable** (Search ARGument ABLE). If the expression form is unavoidable, create an expression index on exactly that expression.

</details>

### P4. Choose the index

**Difficulty:** Medium · **Type:** Design · **Concepts:** composite index design

The most frequent query on a 50-million-row `payments` table is:

```sql
-- Illustrative
SELECT * FROM payments
WHERE merchant_id = $1 AND status = 'SUCCEEDED'
ORDER BY created_at DESC
LIMIT 20;
```

`merchant_id` has 20,000 distinct values; `status` has 4 values, 90% are `SUCCEEDED`. Propose an index and explain the column order.

<details>
<summary>Answer</summary>

`CREATE INDEX ON payments (merchant_id, status, created_at DESC);` — two equality columns first, then the sort column, so PostgreSQL can jump to (merchant, SUCCEEDED) and read the newest 20 entries in order with no sort, stopping after 20. Because 90% of rows are `SUCCEEDED`, a partial index is smaller and just as good: `CREATE INDEX ON payments (merchant_id, created_at DESC) WHERE status = 'SUCCEEDED';`. An index on `status` alone would be useless (low selectivity).

</details>

### P5. Explain the plan

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** scan types, selectivity

With an index on `events(user_id)` (200,000 rows, 5,000 users, rows of a user spread evenly), the planner chooses:

- a **Bitmap Heap Scan** for `user_id = 42`,
- an **Index Only Scan** for `SELECT user_id … WHERE user_id = 42`,
- a **Seq Scan** for `user_id > 100`.

Explain each choice.

<details>
<summary>Answer</summary>

- `user_id = 42` matches 40 rows on 40 different pages. A bitmap scan collects their locations and reads each page once in physical order — cheaper than 40 random index-ordered heap fetches when rows are scattered.
- When only `user_id` is selected, the index alone has all needed data, and the visibility map (after VACUUM) says every page is all-visible, so no heap access is needed.
- `user_id > 100` matches about 98% of rows; touching nearly every page through the index would be slower than reading the table sequentially, so the planner ignores the index.

</details>
