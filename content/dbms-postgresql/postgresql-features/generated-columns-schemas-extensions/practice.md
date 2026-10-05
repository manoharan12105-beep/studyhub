# Generated Columns, Schemas and Extensions — Practice

### P1. Which expression is allowed?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** generated column rules

Which is a valid generated column expression on `orders(order_date date, …)`?

- A) `GENERATED ALWAYS AS (now() - order_date) STORED`
- B) `GENERATED ALWAYS AS (extract(year FROM order_date)) STORED`
- C) `GENERATED ALWAYS AS ((SELECT count(*) FROM order_items)) STORED`
- D) `GENERATED ALWAYS AS (order_id + random()) STORED`

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** `extract` on a `date` is immutable. `now()` and `random()` are not immutable, and subqueries are not allowed.

</details>

### P2. Line totals that cannot drift

**Difficulty:** Easy · **Type:** Query · **Concepts:** stored generated column

Add a stored generated column `line_total` to `order_items` (`quantity * unit_price`) and show the three largest lines.

**Expected output:**

```text
 order_id | product_id | line_total
----------+------------+------------
      101 |          1 |   55000.00
      104 |          1 |   55000.00
      102 |          5 |    9000.00
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
ALTER TABLE order_items
    ADD COLUMN line_total numeric(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED;

SELECT order_id, product_id, line_total
FROM order_items
ORDER BY line_total DESC, order_id, product_id
LIMIT 3;
```

**Explanation:** Adding a stored generated column rewrites the table to compute existing rows.

</details>

### P3. Move a table to a schema

**Difficulty:** Medium · **Type:** Query · **Concepts:** schemas, ALTER TABLE SET SCHEMA

Create a schema `sales`, move `orders` and `order_items` into it, and show where they live now.

**Expected output:**

```text
 table_schema | table_name
--------------+-------------
 sales        | order_items
 sales        | orders
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE SCHEMA sales;
ALTER TABLE orders SET SCHEMA sales;
ALTER TABLE order_items SET SCHEMA sales;

SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name IN ('orders', 'order_items')
ORDER BY table_name;
```

**Explanation:** Foreign keys, indexes and owned sequences move with the table. Code using unqualified `orders` now needs `sales` in its `search_path`.

</details>

### P4. Case-insensitive unique emails

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** citext, uniqueness

A `UNIQUE (email)` constraint allowed both `Anil@Mail.com` and `anil@mail.com`.

**Schema and data:**

```sql
CREATE TABLE members (email text UNIQUE);
INSERT INTO members VALUES ('Anil@Mail.com'), ('anil@mail.com');
SELECT count(*) FROM members;
```

**Output:**

```text
 count
-------
     2
(1 row)
```

Redesign the table so the second insert fails.

<details>
<summary>Answer</summary>

`text` comparison is case-sensitive, so the two strings are different values. Use `citext` (or a unique index on `lower(email)`):

```sql
CREATE EXTENSION IF NOT EXISTS citext;
CREATE TABLE members_v2 (email citext UNIQUE);
INSERT INTO members_v2 VALUES ('Anil@Mail.com');
INSERT INTO members_v2 VALUES ('anil@mail.com');
```

**Output:**

```text
ERROR:  duplicate key value violates unique constraint "members_v2_email_key"
DETAIL:  Key (email)=(anil@mail.com) already exists.
```

</details>

### P5. Local business day as a column

**Difficulty:** Hard · **Type:** Design · **Concepts:** immutability, time zones

Reports group orders by the Indian business day. Someone tries `business_day date GENERATED ALWAYS AS (created_at::date) STORED` on a `timestamptz` column and gets "generation expression is not immutable". Explain and fix.

<details>
<summary>Answer</summary>

Casting `timestamptz` to `date` uses the session `TimeZone`, so the same row could produce different values in different sessions — not immutable. Name the zone explicitly:

```sql
SET TIME ZONE 'UTC';
CREATE TABLE web_orders (
    id           int PRIMARY KEY,
    created_at   timestamptz NOT NULL,
    business_day date GENERATED ALWAYS AS ((created_at AT TIME ZONE 'Asia/Kolkata')::date) STORED
);
INSERT INTO web_orders (id, created_at) VALUES (1, '2026-03-09 19:00+00'), (2, '2026-03-09 17:00+00');
SELECT id, created_at, business_day FROM web_orders ORDER BY id;
```

**Output:**

```text
 id |       created_at       | business_day
----+------------------------+--------------
  1 | 2026-03-09 19:00:00+00 | 2026-03-10
  2 | 2026-03-09 17:00:00+00 | 2026-03-09
(2 rows)
```

19:00 UTC is 00:30 the next day in India. The column can be indexed for fast daily reports.

</details>
