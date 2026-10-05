# Denormalization — Practice

### P1. Snapshot or redundancy?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** denormalization vs historical data

Which stored column is a historical snapshot that should **not** be kept in sync with its source?

- A) `orders.customer_email`, used to send order updates to the customer's current email
- B) `order_items.unit_price`, the price charged at checkout
- C) `posts.author_name`, displayed with each post
- D) `customers.order_count`

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** The price charged is a fact about the sale. A and C are copies that should reflect current values (or be replaced by joins); D is a derived counter that must match the orders.

</details>

### P2. Monthly summary table

**Difficulty:** Medium · **Type:** Query · **Concepts:** summary table, upsert

Create `monthly_revenue (month date PRIMARY KEY, revenue numeric(12,2))` and fill it from non-cancelled orders. Write it so that re-running the load updates existing months instead of failing.

**Expected output:**

```text
   month    | revenue
------------+----------
 2026-01-01 | 73000.00
 2026-02-01 |  6500.00
 2026-03-01 | 15950.00
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE TABLE monthly_revenue (month date PRIMARY KEY, revenue numeric(12,2) NOT NULL);

INSERT INTO monthly_revenue (month, revenue)
SELECT date_trunc('month', o.order_date)::date, sum(oi.quantity * oi.unit_price)
FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status <> 'CANCELLED'
GROUP BY 1
ON CONFLICT (month) DO UPDATE SET revenue = EXCLUDED.revenue;

SELECT * FROM monthly_revenue ORDER BY month;
```

**Explanation:** `ON CONFLICT … DO UPDATE` makes the load idempotent — the nightly job can run again after a failure.

</details>

### P3. Find the drift

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** reconciliation

A denormalized `units_sold` column is supposed to equal the total quantity sold per product (all orders), but some values are wrong.

**Schema and data:**

```sql
ALTER TABLE products ADD COLUMN units_sold int NOT NULL DEFAULT 0;
UPDATE products SET units_sold = CASE product_id WHEN 1 THEN 2 WHEN 2 THEN 7 WHEN 3 THEN 1 WHEN 4 THEN 2 WHEN 5 THEN 4 ELSE 0 END;
```

Write a query listing products whose stored `units_sold` differs from the real total, then repair them in one statement.

**Expected output:**

```text
 product_id |   name   | stored | actual
------------+----------+--------+--------
          3 | Keyboard |      1 |      2
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT p.product_id, p.name, p.units_sold AS stored, COALESCE(sum(oi.quantity), 0) AS actual
FROM products p LEFT JOIN order_items oi ON oi.product_id = p.product_id
GROUP BY p.product_id
HAVING p.units_sold <> COALESCE(sum(oi.quantity), 0)
ORDER BY p.product_id;
```

Repair:

```sql
UPDATE products p
SET units_sold = COALESCE((SELECT sum(oi.quantity) FROM order_items oi WHERE oi.product_id = p.product_id), 0)
RETURNING product_id, units_sold;
```

**Explanation:** Keyboard (product 3) was ordered twice (orders 103 and 106) but the stored value says 1. The `LEFT JOIN` and `COALESCE` keep never-sold products (Notebook) at 0.

</details>

### P4. Should we denormalize?

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** trade-offs

A product listing page shows each product with its average rating and number of reviews. It is viewed 50,000 times per minute; reviews are added about 20 times per minute. The current query aggregates the `reviews` table (30 million rows) for every page view. What would you do?

<details>
<summary>Answer</summary>

This is a classic case for denormalization: very high read-to-write ratio and an expensive aggregation. Options:

1. First, an index on `reviews (product_id)` (covering `rating`) makes per-product aggregates cheap — measure whether that is enough for one page of products.
2. Store `review_count` and `rating_sum` on `products`, maintained by an `AFTER INSERT OR UPDATE OR DELETE` trigger on `reviews` in the same transaction; compute the average as `rating_sum / NULLIF(review_count, 0)`. 20 writes per minute is negligible contention.
3. If slight staleness is acceptable, a materialized view refreshed every few minutes, or an application cache.

Store sum and count rather than the average, so updates are simple increments. Add a periodic reconciliation query.

</details>
