# Duplicates and Missing Data Problems — Interview Questions

## Beginner

### Q1. How do you find duplicate emails in a table?

<details>
<summary>Answer</summary>

```sql
-- Illustrative
SELECT email, count(*)
FROM users
GROUP BY email
HAVING count(*) > 1;
```

`HAVING` filters groups after aggregation; `WHERE count(*) > 1` is an error. Clarify what counts as a duplicate: often `lower(trim(email))`, and whether `NULL` emails (which `GROUP BY` puts into one group) count.

</details>

### Q2. Find customers who have never placed an order.

<details>
<summary>Answer</summary>

```sql
SELECT c.customer_id, c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);
```

**Output:**

```text
 customer_id |  name
-------------+--------
           6 | Fatima
(1 row)
```

Equivalent: `LEFT JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id IS NULL`. Both are planned as an anti-join.

</details>

### Q3. How do you find employees who have no manager?

<details>
<summary>Answer</summary>

`WHERE manager_id IS NULL`. Writing `= NULL` returns no rows, because any comparison with `NULL` is unknown. If the question is "employees who manage nobody", that is an anti-join instead: `WHERE NOT EXISTS (SELECT 1 FROM employees r WHERE r.manager_id = e.emp_id)`.

</details>

## Intermediate

### Q4. Delete duplicate rows but keep one copy of each.

<details>
<summary>Answer</summary>

With a unique id, keep the lowest:

```sql
-- Illustrative
DELETE FROM users a
USING users b
WHERE a.email = b.email
  AND a.id > b.id;
```

Or choose the survivor explicitly:

```sql
-- Illustrative
DELETE FROM users
WHERE id IN (SELECT id
             FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC, id DESC) AS rn
                   FROM users) t
             WHERE rn > 1);
```

Run it in a transaction, verify the row count, then add `UNIQUE (email)` so duplicates cannot return. Using `<>` instead of `>` in the self-join would delete every copy.

</details>

### Q5. Why does `WHERE dept_id NOT IN (SELECT dept_id FROM employees)` return no rows?

<details>
<summary>Answer</summary>

Because the subquery returns a `NULL` (an employee without a department). `x NOT IN (a, b, NULL)` means `x <> a AND x <> b AND x <> NULL`. The last comparison is unknown, so the whole condition is never true and every row is filtered out. Fix: `NOT EXISTS`, a `LEFT JOIN … IS NULL`, or `WHERE dept_id IS NOT NULL` inside the subquery. Prefer `NOT EXISTS`: it is NULL-safe and PostgreSQL turns it into an anti-join.

</details>

### Q6. How do you remove duplicates from a table that has no primary key?

<details>
<summary>Answer</summary>

Use PostgreSQL's system column `ctid` to tell identical rows apart:

```sql
-- Illustrative
DELETE FROM t a USING t b
WHERE a.col1 = b.col1 AND a.col2 = b.col2 AND a.ctid > b.ctid;
```

`ctid` is the physical location of the row version; it is stable within one statement but changes after updates or `VACUUM FULL`, so never store it. If most rows are duplicates, rebuilding is faster: `CREATE TABLE t2 AS SELECT DISTINCT * FROM t`, then swap the tables. Afterwards add a primary key.

</details>

### Q7. `LEFT JOIN … WHERE b.x IS NULL` returns customers who did order. Why?

<details>
<summary>Answer</summary>

`b.x` is a column that can itself be `NULL` in a matched row (for example `orders.coupon_code`). The `IS NULL` test then also matches real joined rows. Test a column that is never `NULL` when a match exists: the join key or the primary key of `b` (`WHERE o.order_id IS NULL`).

</details>

### Q8. How do you find customers with no *delivered* orders?

<details>
<summary>Answer</summary>

Put the status condition inside the anti-join:

```sql
-- Illustrative
SELECT c.* FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o
                  WHERE o.customer_id = c.customer_id AND o.status = 'DELIVERED');
```

With a left join, the condition belongs in `ON`, not `WHERE`. In `WHERE`, `o.status = 'DELIVERED'` is false or unknown for the `NULL`-extended rows, so the left join collapses into an inner join.

</details>

## Advanced

### Q9. How do you enforce "email must be unique, ignoring case"?

<details>
<summary>Answer</summary>

A unique expression index: `CREATE UNIQUE INDEX ON users (lower(email))`. Lookups must then use the same expression (`WHERE lower(email) = lower($1)`) to use the index. Alternatives are the `citext` extension type with a normal unique constraint, or a nondeterministic case-insensitive ICU collation. Remove existing duplicates first; the index build fails on them.

</details>

### Q10. Two concurrent requests insert the same email and both pass the "does it exist?" check. How do you prevent duplicates?

<details>
<summary>Answer</summary>

A check-then-insert in application code is a race: both transactions see no row and both insert. Only a database constraint is safe. Add a unique constraint or index, and either catch the unique violation (SQLSTATE `23505`) or use `INSERT … ON CONFLICT (email) DO NOTHING` / `DO UPDATE`. With the constraint, the second insert waits for the first transaction and then fails or skips.

</details>

### Q11. Delete duplicates from a 200-million-row table in production. What do you consider?

<details>
<summary>Answer</summary>

- Measure first: `GROUP BY … HAVING count(*) > 1` to count duplicates.
- If few: delete in batches (for example 10,000 ids at a time, each in its own transaction) to keep locks short, limit WAL bursts and let autovacuum keep up.
- If many: build a deduplicated copy (`CREATE TABLE … AS SELECT DISTINCT ON …`), create indexes, then swap names in a short transaction — faster and avoids bloat, but needs disk space and a write freeze or a catch-up step.
- Add the unique constraint (`CREATE UNIQUE INDEX CONCURRENTLY`, then `ADD CONSTRAINT … USING INDEX`) to stop new duplicates.
- Back up or archive the deleted rows first if they might be needed.

</details>
