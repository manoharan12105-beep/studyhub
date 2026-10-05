# Denormalization

**Module:** Normalization · **Interview priority:** Frequently asked

## What Is It?

**Denormalization** is deliberately storing redundant or precomputed data — copies of columns, totals, counters, pre-joined tables — to make reads faster or simpler, accepting extra work and risk to keep the copies consistent.

It is a step taken **after** normalizing, for measured reasons. An unnormalized design that was never normalized is not "denormalized"; it is just redundant.

## Why It Matters

- Interviewers ask "normalization vs denormalization — when would you denormalize?" and expect trade-offs, not slogans.
- Real systems mix both: a normalized transactional core plus denormalized read models (reports, dashboards, search, caches).

## Core Concept

### Why denormalize

| Reason | Example |
|--------|---------|
| Avoid expensive joins on hot read paths | Show `customer_name` on every order list without joining |
| Avoid repeated aggregation | Store `order_count` on customers; daily sales summary table |
| Reporting and analytics | Star schema: a wide fact table plus dimension tables |
| Historical snapshot (not really redundancy) | `unit_price` on order lines — the price paid, which must not change |
| Read scaling | Precomputed feeds/timelines, search documents |

### Techniques

| Technique | How it stays correct | Freshness |
|-----------|----------------------|-----------|
| Redundant column (copy of a parent attribute) | Trigger, application code, or never changes | Immediate if maintained in the same transaction |
| Stored counter / total | Trigger or application in the same transaction | Immediate |
| Summary table | Batch job (nightly), or incremental updates | Delayed |
| Materialized view | `REFRESH MATERIALIZED VIEW` | Delayed until refresh ([Materialized Views](../../views-and-materialized-views/materialized-views/content.md)) |
| Generated column | Computed by PostgreSQL from the same row | Always correct |
| JSONB document embedding child data | Rebuilt on change | Depends |

### Costs

- **Write amplification**: one logical change updates several places.
- **Consistency risk**: if any code path forgets to update a copy, data disagrees — the update anomaly normalization prevents.
- **Contention**: a counter row updated by every insert becomes a hot spot; concurrent transactions queue on its row lock.
- **Storage** and more complex migrations.

### Decision checklist

1. Is there a measured read problem (`EXPLAIN ANALYZE`, `pg_stat_statements`) that indexes or query rewrites cannot fix?
2. Is the data read far more often than it is written?
3. Can the redundancy be maintained automatically (generated column, trigger, materialized view) rather than by every developer?
4. How stale may the copy be?
5. Is there a way to detect and repair drift (a reconciliation query)?

### OLTP vs OLAP

- **OLTP** (transactions): normalized (3NF/BCNF), many small writes, integrity first.
- **OLAP** (analytics): denormalized **star schema** — a central **fact table** (sales lines: keys + measures) surrounded by **dimension tables** (date, product, store, customer), optimized for large scans and aggregations. A **snowflake schema** normalizes the dimensions further.

## Syntax

```sql
-- Illustrative: a maintained counter
ALTER TABLE customers ADD COLUMN order_count int NOT NULL DEFAULT 0;
-- kept correct by a trigger on orders (INSERT / DELETE / UPDATE OF customer_id)
```

## Examples

### Normalized query vs a redundant column

The normalized way to show customer names with orders is a join:

```sql
SELECT o.order_id, o.order_date, c.name AS customer_name
FROM orders o JOIN customers c ON c.customer_id = o.customer_id
WHERE o.order_date >= '2026-03-01'
ORDER BY o.order_id;
```

**Output:**

```text
 order_id | order_date | customer_name
----------+------------+---------------
      106 | 2026-03-01 | Bhavna
      107 | 2026-03-15 | Anil
      108 | 2026-03-28 | Eshan
(3 rows)
```

Denormalized: copy the name into `orders`. Reads avoid the join, but the copy can drift:

```sql
ALTER TABLE orders ADD COLUMN customer_name text;
UPDATE orders o SET customer_name = c.name FROM customers c WHERE c.customer_id = o.customer_id;

UPDATE customers SET name = 'Bhavna Shah' WHERE customer_id = 2;   -- the copy is not updated

SELECT o.order_id, o.customer_name AS copied_name, c.name AS current_name
FROM orders o JOIN customers c ON c.customer_id = o.customer_id
WHERE o.customer_id = 2
ORDER BY o.order_id;
```

**Output:**

```text
 order_id | copied_name | current_name
----------+-------------+--------------
      102 | Bhavna      | Bhavna Shah
      106 | Bhavna      | Bhavna Shah
(2 rows)
```

Whether this is a bug depends on intent: if the order should show the name **at the time of ordering** (like an invoice), the copy is a correct snapshot; if it should show the **current** name, it is an update anomaly.

### A counter maintained by a trigger

```sql
ALTER TABLE customers ADD COLUMN order_count int NOT NULL DEFAULT 0;
UPDATE customers c SET order_count = (SELECT count(*) FROM orders o WHERE o.customer_id = c.customer_id);

CREATE FUNCTION maintain_order_count() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        UPDATE customers SET order_count = order_count + 1 WHERE customer_id = NEW.customer_id;
    END IF;
    IF TG_OP IN ('DELETE', 'UPDATE') THEN
        UPDATE customers SET order_count = order_count - 1 WHERE customer_id = OLD.customer_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER orders_count_trg
AFTER INSERT OR DELETE OR UPDATE OF customer_id ON orders
FOR EACH ROW EXECUTE FUNCTION maintain_order_count();

INSERT INTO orders (order_id, customer_id, order_date, status) VALUES (109, 6, '2026-03-30', 'PLACED');
DELETE FROM orders WHERE order_id = 104;

SELECT customer_id, name, order_count FROM customers ORDER BY customer_id;
```

**Output:**

```text
 customer_id |    name     | order_count
-------------+-------------+-------------
           1 | Anil        |           3
           2 | Bhavna Shah |           2
           3 | Chirag      |           0
           4 | Deepa       |           1
           5 | Eshan       |           1
           6 | Fatima      |           1
(6 rows)
```

Fatima's count rose to 1; Chirag's fell to 0 (deleting order 104 also cascaded its items). Trigger functions are covered in [Triggers](../../functions-procedures-triggers/postgresql-triggers/content.md). Every order insert now also updates the customer row — under heavy concurrent ordering by the same customer, those updates queue on one row lock.

### Reconciling a counter

A drift check compares the stored value with the truth. Simulate a bug that changed Anil's counter directly:

```sql
UPDATE customers SET order_count = 2 WHERE customer_id = 1;   -- drift: Anil really has 3

SELECT c.customer_id, c.order_count AS stored, count(o.order_id) AS actual
FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id
HAVING c.order_count <> count(o.order_id)
ORDER BY c.customer_id;
```

**Output:**

```text
 customer_id | stored | actual
-------------+--------+--------
           1 |      2 |      3
(1 row)
```

Only Anil's stored count disagrees with reality. Running such a query regularly — and repairing with the backfill `UPDATE` — is the routine guard against drift.

### A daily summary table

```sql
CREATE TABLE daily_sales (
    sale_date date PRIMARY KEY,
    orders    int NOT NULL,
    revenue   numeric(12,2) NOT NULL
);
INSERT INTO daily_sales
SELECT o.order_date, count(DISTINCT o.order_id), sum(oi.quantity * oi.unit_price)
FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status <> 'CANCELLED'
GROUP BY o.order_date;

SELECT * FROM daily_sales WHERE sale_date >= '2026-03-01' ORDER BY sale_date;
```

**Output:**

```text
 sale_date  | orders | revenue
------------+--------+----------
 2026-03-01 |      1 |  1950.00
 2026-03-15 |      1 | 12500.00
 2026-03-28 |      1 |  1500.00
(3 rows)
```

Dashboards read a handful of summary rows instead of aggregating every order line; a nightly job (or an upsert per new order) keeps it current.

### A star schema (sketch)

```text
                 ┌──────────────┐
                 │  dim_date    │  date_key, day, month, quarter, year
                 └──────┬───────┘
┌──────────────┐ ┌──────┴───────┐ ┌──────────────┐
│ dim_product  ├─┤  fact_sales  ├─┤ dim_customer │
│ product_key, │ │ date_key     │ │ customer_key,│
│ name,        │ │ product_key  │ │ city, segment│
│ category     │ │ customer_key │ └──────────────┘
└──────────────┘ │ qty, revenue │
                 └──────────────┘
```

Dimensions repeat descriptive attributes (category on every product, city on every customer) so that analytical queries need one join per dimension and no deeper chains.

## Comparison

### Normalization vs denormalization

| | Normalized | Denormalized |
|---|---|---|
| Redundancy | Minimal | Deliberate |
| Writes | Simple, one place | Several places, extra code/triggers |
| Reads | More joins | Fewer joins, precomputed values |
| Anomaly risk | Low | Higher — needs maintenance and reconciliation |
| Typical use | OLTP, source of truth | Reports, analytics, caches, read models |

## Common Mistakes

- Denormalizing before measuring; an index or a better query often solves the problem.
- Maintaining copies in application code in only some code paths.
- Counters updated outside the transaction that changes the underlying rows.
- A single hot counter row updated by every request (contention).
- Calling an unnormalized schema "denormalized for performance" without ever having normalized it.
- Confusing historical snapshots (correct by design) with redundant copies (must stay in sync).

## Revision

- Denormalization = deliberate redundancy for read performance or simplicity, after normalizing.
- Techniques: redundant columns, counters/totals, summary tables, materialized views, generated columns, star schemas.
- Costs: write amplification, drift risk, contention, storage.
- Keep copies correct automatically (triggers, materialized views) and check them with reconciliation queries.
- OLTP normalized; OLAP star/snowflake schemas.

## Quick Revision

Denormalize only after normalizing and measuring — add redundant columns, counters, summary tables or materialized views for heavy reads, maintain them automatically, and reconcile them, because every copy is a chance for anomalies.
