# Materialized Views

**Module:** Views and Materialized Views · **Interview priority:** Frequently asked

## What Is It?

A **materialized view** stores the **result** of a query as a physical table-like object. Reading it is as fast as reading a table (and it can be indexed), but its contents are a **snapshot**: they change only when you run `REFRESH MATERIALIZED VIEW`.

```sql
-- Illustrative
CREATE MATERIALIZED VIEW daily_revenue AS
SELECT order_date, sum(amount) AS revenue
FROM big_order_table
GROUP BY order_date;

SELECT * FROM daily_revenue WHERE order_date >= '2026-03-01';   -- reads stored rows
REFRESH MATERIALIZED VIEW daily_revenue;                        -- recomputes everything
```

## Why It Matters

- Dashboards and reports often aggregate millions of rows for results that change slowly; computing them once and reading many times saves enormous work.
- Interviewers ask: view vs materialized view, how refresh works, how to refresh without blocking readers, and how stale data is handled.

## Core Concept

### Lifecycle

| Step | Command | Notes |
|------|---------|-------|
| Create and fill | `CREATE MATERIALIZED VIEW mv AS query [WITH DATA]` | Runs the query once |
| Create empty | `… WITH NO DATA` | Querying it errors until the first refresh |
| Index | `CREATE [UNIQUE] INDEX … ON mv (…)` | Same index types as tables |
| Refresh | `REFRESH MATERIALIZED VIEW mv` | Recomputes the whole result; takes an `ACCESS EXCLUSIVE` lock — readers wait |
| Refresh without blocking reads | `REFRESH MATERIALIZED VIEW CONCURRENTLY mv` | Needs a `UNIQUE` index (on plain columns, no `WHERE`); computes the new result and applies the differences |
| Drop | `DROP MATERIALIZED VIEW mv` | |

### Plain vs CONCURRENTLY

| | `REFRESH` | `REFRESH … CONCURRENTLY` |
|---|---|---|
| Readers during refresh | Blocked | See the old contents until it finishes |
| Requirement | — | A unique index on the materialized view; it must already be populated |
| Speed | Faster (rebuilds) | Slower (diffs old vs new), writes only changed rows |
| Bloat | None (new storage) | Dead tuples like normal updates |

### What PostgreSQL does not do

- **No automatic refresh**: nothing refreshes the view when base tables change. Schedule it (a cron job, the `pg_cron` extension, an application scheduler), or trigger it after batch loads.
- **No incremental refresh**: every refresh re-runs the full query. For very large inputs that change a little, a summary table maintained incrementally (upserts, triggers) is cheaper ([Denormalization](../../normalization/denormalization/content.md)).
- A materialized view cannot be written to directly.

### When to use one

| Good fit | Poor fit |
|----------|----------|
| Expensive aggregations read often (dashboards, leaderboards) | Data that must be current to the second |
| Results that tolerate minutes/hours of staleness | Huge inputs refreshed very frequently |
| Pre-joining data for search or reporting | Simple queries an index can already make fast |
| Caching results of slow foreign tables (FDW) | Results needing per-user filtering at write time |

## Syntax

```sql
-- Illustrative
CREATE MATERIALIZED VIEW [IF NOT EXISTS] name [(column_names)] AS query [WITH [NO] DATA];
REFRESH MATERIALIZED VIEW [CONCURRENTLY] name [WITH [NO] DATA];
CREATE UNIQUE INDEX ON name (key_columns);
DROP MATERIALIZED VIEW [IF EXISTS] name [CASCADE];
SELECT matviewname, ispopulated FROM pg_matviews;
```

## Examples

### Create, index and query

```sql
CREATE MATERIALIZED VIEW product_sales AS
SELECT p.product_id, p.name, p.category,
       COALESCE(sum(oi.quantity), 0)                  AS units,
       COALESCE(sum(oi.quantity * oi.unit_price), 0)  AS revenue
FROM products p
LEFT JOIN (order_items oi
           JOIN orders o ON o.order_id = oi.order_id AND o.status <> 'CANCELLED')
       ON oi.product_id = p.product_id
GROUP BY p.product_id;

CREATE UNIQUE INDEX product_sales_pk ON product_sales (product_id);

SELECT name, units, revenue FROM product_sales ORDER BY revenue DESC, name;
```

**Output:**

```text
   name   | units | revenue
----------+-------+----------
 Laptop   |     1 | 55000.00
 Chair    |     4 | 18000.00
 Desk     |     2 | 16000.00
 Mouse    |     7 |  3450.00
 Keyboard |     2 |  3000.00
 Notebook |     0 |        0
(6 rows)
```

The parenthesised join pairs each order line with its non-cancelled order first; the `LEFT JOIN` then keeps every product, including the Notebook (no lines) and any product whose only orders were cancelled. Filtering `o.status` in a `WHERE` clause instead would drop such products.

### Snapshots go stale

A new order arrives:

```sql
INSERT INTO orders VALUES (109, 6, '2026-03-30', 'PLACED');
INSERT INTO order_items VALUES (109, 6, 10, 50.00);

SELECT name, units, revenue FROM product_sales WHERE name = 'Notebook';
```

**Output:**

```text
   name   | units | revenue
----------+-------+---------
 Notebook |     0 |       0
(1 row)
```

The materialized view still says the Notebook never sold. A plain view would already show the new order.

### Refreshing

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY product_sales;
SELECT name, units, revenue FROM product_sales WHERE name = 'Notebook';
```

**Output:**

```text
   name   | units | revenue
----------+-------+---------
 Notebook |    10 |  500.00
(1 row)
```

`CONCURRENTLY` let other sessions keep reading the old contents while the new result was computed; it worked because `product_sales_pk` is a unique index.

### CONCURRENTLY needs a unique index

```sql
CREATE MATERIALIZED VIEW category_sales AS
SELECT category, sum(revenue) AS revenue FROM product_sales GROUP BY category;

REFRESH MATERIALIZED VIEW CONCURRENTLY category_sales;
```

**Output:**

```text
ERROR:  cannot refresh materialized view "public.category_sales" concurrently
HINT:  Create a unique index with no WHERE clause on one or more columns of the materialized view.
```

```sql
CREATE UNIQUE INDEX category_sales_pk ON category_sales (category);
REFRESH MATERIALIZED VIEW CONCURRENTLY category_sales;
SELECT * FROM category_sales ORDER BY revenue DESC;
```

**Output:**

```text
  category   | revenue
-------------+----------
 Electronics | 61450.00
 Furniture   | 34000.00
 Stationery  |   500.00
(3 rows)
```

### Created empty: WITH NO DATA

```sql
CREATE MATERIALIZED VIEW monthly_orders AS
SELECT date_trunc('month', order_date)::date AS month, count(*) AS orders
FROM orders
GROUP BY 1
WITH NO DATA;

SELECT * FROM monthly_orders;
```

**Output:**

```text
ERROR:  materialized view "monthly_orders" has not been populated
HINT:  Use the REFRESH MATERIALIZED VIEW command.
```

```sql
REFRESH MATERIALIZED VIEW monthly_orders;
SELECT * FROM monthly_orders ORDER BY month;
```

**Output:**

```text
   month    | orders
------------+--------
 2026-01-01 |      2
 2026-02-01 |      3
 2026-03-01 |      4
(3 rows)
```

`WITH NO DATA` is useful when creating many objects during a migration and populating them later; the first refresh cannot be `CONCURRENTLY`.

### Inspecting materialized views

```sql
SELECT matviewname, ispopulated, hasindexes
FROM pg_matviews
ORDER BY matviewname;
```

**Output:**

```text
  matviewname   | ispopulated | hasindexes
----------------+-------------+------------
 category_sales | t           | t
 monthly_orders | t           | f
 product_sales  | t           | t
(3 rows)
```

### The plan reads stored rows

```sql
EXPLAIN (COSTS OFF)
SELECT * FROM product_sales WHERE product_id = 2;
```

**Output:**

```text
         QUERY PLAN
----------------------------
 Seq Scan on product_sales
   Filter: (product_id = 2)
(2 rows)
```

No joins or aggregation at query time — only a scan of the stored result (a sequential scan here because the materialized view has six rows; on a large one, `product_sales_pk` would be used).

## Comparison

### View vs materialized view vs summary table

| | View | Materialized view | Summary table |
|---|---|---|---|
| Stores data | No | Yes | Yes |
| Freshness | Always current | As of last refresh | As current as its maintenance |
| Read cost | Full query each time | Table read | Table read |
| Maintenance | None | `REFRESH` (full recompute) | Your code: upserts/triggers (incremental) |
| Indexes | No (base tables' only) | Yes | Yes |
| Writable | Simple views | No | Yes |

## Common Mistakes

- Expecting a materialized view to update itself when the base tables change.
- Using plain `REFRESH` on a materialized view that applications read continuously (they block during the refresh).
- Trying `REFRESH … CONCURRENTLY` without a unique index, or on a never-populated view.
- Refreshing a materialized view over a huge table every minute — the full recompute may cost more than it saves.
- Forgetting to grant `SELECT` on the materialized view to the application role.
- Hiding staleness from users: show "as of" timestamps on dashboards.

## Revision

- Materialized view = stored query result; fast to read, indexable, stale until refreshed.
- `REFRESH` recomputes fully and blocks readers; `REFRESH … CONCURRENTLY` keeps reads working but needs a unique index and a populated view.
- No automatic or incremental refresh — schedule refreshes; use summary tables for incremental maintenance.
- `WITH NO DATA` creates it empty; querying errors until refreshed.
- Use for expensive, frequently read, staleness-tolerant results.

## Quick Revision

A materialized view stores a query's result as an indexable snapshot that is fast to read but stale until refreshed. REFRESH recomputes it all and blocks readers; REFRESH CONCURRENTLY avoids that if there is a unique index. Nothing refreshes it automatically.
