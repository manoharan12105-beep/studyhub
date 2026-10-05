# SQL vs NoSQL, OLTP vs OLAP and Data Warehouses — Practice

### P1. OLTP or OLAP?

**Difficulty:** Easy · **Type:** MCQ

Which query is typical of an **OLAP** workload?

- A) Fetch order 107 and its items
- B) Deduct 500 from account 2
- C) Average order value per city per quarter over five years
- D) Insert a new customer

<details>
<summary>Answer</summary>

**Answer:** C) Average order value per city per quarter over five years

**Explanation:** It scans and aggregates a large historical dataset. The others touch a few rows by key — OLTP.

</details>

### P2. Fact or dimension?

**Difficulty:** Easy · **Type:** Conceptual

Classify each warehouse table as fact or dimension: `sales_line(date_key, product_key, qty, amount)`, `product(product_key, name, category, brand)`, `calendar(date_key, day, month, quarter, year)`, `payments(date_key, customer_key, amount)`.

<details>
<summary>Answer</summary>

Facts: `sales_line`, `payments` (events with numeric measures). Dimensions: `product`, `calendar` (descriptive context).

</details>

### P3. Choose the store

**Difficulty:** Medium · **Type:** Scenario

A food-delivery app needs: (a) orders and payments with refunds, (b) the live GPS position of each rider, updated every 2 seconds and read by key, (c) a weekly report of revenue by restaurant. Suggest a store for each and justify briefly.

<details>
<summary>Answer</summary>

- (a) PostgreSQL — multi-table ACID transactions and constraints for money.
- (b) A key-value store such as Redis — tiny values, overwritten constantly, read by rider id; losing a few seconds of positions is acceptable.
- (c) A warehouse (or a reporting replica for a small company) fed from the OLTP database — heavy aggregation away from production traffic.

</details>

### P4. Monthly revenue (an OLAP query)

**Difficulty:** Medium · **Type:** Query · **Concepts:** GROUP BY, date_trunc

Using the [sample database](../../sql-fundamentals/dbms-sample-database/content.md), show total revenue (quantity × unit price) per month for non-cancelled orders.

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
<summary>Hint</summary>

Join `orders` to `order_items`, exclude `CANCELLED`, and group by `date_trunc('month', order_date)`.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT date_trunc('month', o.order_date)::date AS month,
       sum(oi.quantity * oi.unit_price)       AS revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status <> 'CANCELLED'
GROUP BY month
ORDER BY month;
```

**Explanation:** `date_trunc` maps every date to the first day of its month, so all orders of a month fall into one group. In a warehouse the same question would be `fact_sales` joined to `dim_date` grouped by `month`.

</details>

### P5. Spot the myth

**Difficulty:** Medium · **Type:** Conceptual

Which statements are myths? (1) NoSQL databases never support transactions. (2) PostgreSQL can store and index JSON documents. (3) Relational databases cannot be scaled at all. (4) Eventual consistency means a read may briefly return stale data.

<details>
<summary>Answer</summary>

Myths: (1) — several NoSQL databases support transactions (e.g. MongoDB multi-document transactions). (3) — relational databases scale vertically, with read replicas, partitioning and sharding solutions. Statements (2) and (4) are true.

</details>
