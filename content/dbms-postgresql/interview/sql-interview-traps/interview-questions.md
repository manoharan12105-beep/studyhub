# SQL Interview Traps — Interview Questions

## Beginner

### Q1. Trap: "`NULL = NULL` is true."

<details>
<summary>Answer</summary>

False. Any comparison with `NULL` is **unknown** (`NULL`), and `WHERE` keeps only rows where the condition is true.

```sql
SELECT NULL = NULL AS equals, NULL IS NULL AS is_null,
       NULL IS NOT DISTINCT FROM NULL AS not_distinct;
```

**Output:**

```text
 equals | is_null | not_distinct
--------+---------+--------------
 NULL   | t       | t
(1 row)
```

Use `IS NULL` to test for a missing value and `IS NOT DISTINCT FROM` for a NULL-safe equality between two expressions.

</details>

### Q2. Trap: "`WHERE commission = NULL` finds employees without a commission."

<details>
<summary>Answer</summary>

It finds nobody, because `commission = NULL` is never true.

```sql
SELECT count(*) FILTER (WHERE commission = NULL)  AS eq_null,
       count(*) FILTER (WHERE commission IS NULL) AS is_null
FROM employees;
```

**Output:**

```text
 eq_null | is_null
---------+---------
       0 |       9
(1 row)
```

Likewise `commission <> 5000` does not return the `NULL` rows. Use `commission IS DISTINCT FROM 5000` if they should be included.

</details>

### Q3. Trap: "`count(*)` and `count(commission)` return the same number."

<details>
<summary>Answer</summary>

Only if the column has no `NULL`s. `count(*)` counts rows; `count(expr)` counts rows where `expr` is not `NULL`; `count(DISTINCT expr)` counts distinct non-null values.

```sql
SELECT count(*) AS all_rows, count(commission) AS with_commission,
       count(DISTINCT commission) AS distinct_commissions
FROM employees;
```

**Output:**

```text
 all_rows | with_commission | distinct_commissions
----------+-----------------+----------------------
       12 |               3 |                    3
(1 row)
```

</details>

### Q4. Trap: "`count(1)` is faster than `count(*)`."

<details>
<summary>Answer</summary>

No. Both count rows and return the same number. In PostgreSQL `count(*)` is the special zero-argument form and is, if anything, slightly cheaper, because `count(1)` evaluates its argument for every row. Pick `count(*)` for readability. What matters for speed is how many rows are read, not the argument.

</details>

### Q5. Trap: "`avg(commission)` treats missing commissions as zero."

<details>
<summary>Answer</summary>

No. Aggregates other than `count(*)` ignore `NULL`s.

```sql
SELECT avg(commission) AS avg_ignoring_nulls,
       avg(coalesce(commission, 0)) AS avg_nulls_as_zero
FROM employees;
```

**Output:**

```text
  avg_ignoring_nulls   |  avg_nulls_as_zero
-----------------------+----------------------
 2666.6666666666666667 | 666.6666666666666667
(1 row)
```

Three employees have a commission value (5000, 3000, 0), so the first average is 8000 / 3; the second divides by 12.

</details>

### Q6. Trap: "`WHERE` and `HAVING` are interchangeable."

<details>
<summary>Answer</summary>

`WHERE` filters rows **before** grouping and cannot use aggregates. `HAVING` filters groups **after** aggregation.

```sql
SELECT dept_id, count(*) AS staff
FROM employees
WHERE salary > 55000
GROUP BY dept_id
HAVING count(*) >= 2
ORDER BY dept_id;
```

**Output:**

```text
 dept_id | staff
---------+-------
      10 |     4
      20 |     3
(2 rows)
```

A condition on plain columns belongs in `WHERE` (it reduces the rows to group). `WHERE count(*) >= 2` is an error.

</details>

### Q7. Trap: "`UNION` and `UNION ALL` give the same result."

<details>
<summary>Answer</summary>

`UNION` removes duplicate rows (which needs a sort or hash); `UNION ALL` keeps everything and is cheaper.

```sql
SELECT (SELECT count(*) FROM (SELECT city FROM customers UNION     SELECT location FROM departments) u) AS union_rows,
       (SELECT count(*) FROM (SELECT city FROM customers UNION ALL SELECT location FROM departments) u) AS union_all_rows;
```

**Output:**

```text
 union_rows | union_all_rows
------------+----------------
          6 |             11
(1 row)
```

`UNION` also collapses duplicates **within** each input and treats `NULL`s as equal. Use `UNION ALL` unless removing duplicates is the goal.

</details>

### Q8. Trap: "`DELETE`, `TRUNCATE` and `DROP` all just remove data."

<details>
<summary>Answer</summary>

| | `DELETE` | `TRUNCATE` | `DROP TABLE` |
|---|---|---|---|
| Removes | Chosen rows (`WHERE`) | All rows | The table, its data, indexes and constraints |
| Speed on big tables | Row by row, logged, leaves dead tuples | Fast; new empty files | Fast |
| Row triggers | Fire | Do not fire | — |
| Referenced by foreign keys | Checked per row | Error unless `CASCADE` (truncates the referencing tables too) | Error unless `CASCADE` (drops the FK constraints) |
| Transactional in PostgreSQL | Yes | Yes (can be rolled back) | Yes |
| Identity/sequence | Unchanged | Unchanged unless `RESTART IDENTITY` | Owned sequence dropped |

The common claim "`TRUNCATE` cannot be rolled back" is false in PostgreSQL.

</details>

### Q9. Trap: "`varchar(255)` is faster than `text` in PostgreSQL."

<details>
<summary>Answer</summary>

No. `text`, `varchar` and `varchar(n)` share the same storage; `varchar(n)` only adds a length check. `char(n)` pads with spaces, and the padding is ignored in comparisons, which surprises people.

```sql
SELECT 'ab'::char(5) = 'ab'::char(5)  AS char_equal,
       length('ab'::char(5))          AS char_length,
       octet_length('ab'::char(5))    AS char_bytes,
       'ab '::varchar = 'ab'::varchar AS varchar_trailing_space_equal;
```

**Output:**

```text
 char_equal | char_length | char_bytes | varchar_trailing_space_equal
------------+-------------+------------+------------------------------
 t          |           2 |          5 | f
(1 row)
```

Use `text` (or `varchar(n)` when a business limit exists); avoid `char(n)`.

</details>

### Q10. Trap: "`LIMIT 3` returns the first three rows of the table."

<details>
<summary>Answer</summary>

Tables have no order. Without `ORDER BY`, `LIMIT` returns any three rows, and the choice can change with the plan, parallelism or updates. Always pair `LIMIT`/`OFFSET` with an `ORDER BY` on a unique key (add a tiebreaker). The same holds for an `ORDER BY` inside a view or subquery: the outer query's order is not guaranteed unless it has its own `ORDER BY`.

</details>

## Intermediate

### Q11. Trap: "`x NOT IN (subquery)` and `NOT EXISTS` are equivalent."

<details>
<summary>Answer</summary>

Not when the subquery can return `NULL`.

```sql
SELECT 'NOT IN' AS method, count(*) AS departments_without_staff
FROM departments WHERE dept_id NOT IN (SELECT dept_id FROM employees)
UNION ALL
SELECT 'NOT EXISTS', count(*)
FROM departments d WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.dept_id);
```

**Output:**

```text
   method   | departments_without_staff
------------+---------------------------
 NOT IN     |                         0
 NOT EXISTS |                         1
(2 rows)
```

Nisha's `dept_id` is `NULL`, so `50 NOT IN (10, 20, …, NULL)` is unknown, not true. `NOT EXISTS` is also planned as an anti-join; `NOT IN (subquery)` cannot be.

</details>

### Q12. Trap: "`EXISTS` is always faster than `IN`."

<details>
<summary>Answer</summary>

In PostgreSQL, `x IN (SELECT …)` and the equivalent `EXISTS` are both planned as a **semi-join**, usually with the same plan. The difference is semantics: `EXISTS` only checks whether a row exists, and `NOT IN` vs `NOT EXISTS` differ with `NULL`s (Q11). Choose by meaning and readability, then check `EXPLAIN`. The "always faster" rule comes from old optimisers.

</details>

### Q13. Trap: "In a `LEFT JOIN`, a condition in `WHERE` and in `ON` is the same."

<details>
<summary>Answer</summary>

For the right-hand table, no. `ON` decides which rows match; unmatched left rows are still kept with `NULL`s. `WHERE` runs after the join and removes the `NULL`-extended rows, turning the left join into an inner join.

```sql
SELECT 'in ON' AS placement, count(*) AS rows
FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'DELIVERED'
UNION ALL
SELECT 'in WHERE', count(*)
FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.status = 'DELIVERED';
```

**Output:**

```text
 placement | rows
-----------+------
 in ON     |    7
 in WHERE  |    5
(2 rows)
```

With the condition in `ON`, Chirag and Fatima still appear (with `NULL` orders); with it in `WHERE`, they disappear. For inner joins the placement does not change the result.

</details>

### Q14. Trap: "`RANK`, `DENSE_RANK` and `ROW_NUMBER` differ only in name."

<details>
<summary>Answer</summary>

They differ on ties.

```sql
SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC, emp_id) AS row_number,
       RANK()       OVER (ORDER BY salary DESC)         AS rank,
       DENSE_RANK() OVER (ORDER BY salary DESC)         AS dense_rank
FROM employees
WHERE dept_id = 10
ORDER BY salary DESC, emp_id;
```

**Output:**

```text
 name  | salary | row_number | rank | dense_rank
-------+--------+------------+------+------------
 Asha  | 150000 |          1 |    1 |          1
 Ravi  |  95000 |          2 |    2 |          2
 Meena |  95000 |          3 |    2 |          2
 Karan |  72000 |          4 |    4 |          3
(4 rows)
```

`ROW_NUMBER` is unique (ties broken arbitrarily unless the `ORDER BY` decides them); `RANK` repeats and skips (1, 2, 2, 4); `DENSE_RANK` repeats without gaps (1, 2, 2, 3). "Nth-highest salary" needs `DENSE_RANK`.

</details>

### Q15. Trap: "A `UNIQUE` column cannot contain two `NULL`s."

<details>
<summary>Answer</summary>

By default it can. `NULL`s are not equal to each other, so they do not conflict. The primary key differs: it implies `NOT NULL`, and a table has at most one.

```sql
CREATE TABLE t (id int PRIMARY KEY, code text UNIQUE);
INSERT INTO t VALUES (1, NULL), (2, NULL);
SELECT count(*) AS rows_with_null_code FROM t WHERE code IS NULL;
INSERT INTO t VALUES (NULL, 'x');
```

**Output:**

```text
 rows_with_null_code
---------------------
                   2
(1 row)

ERROR:  null value in column "id" of relation "t" violates not-null constraint
DETAIL:  Failing row contains (null, x).
```

PostgreSQL 15+ can forbid duplicate `NULL`s with `UNIQUE NULLS NOT DISTINCT`.

</details>

### Q16. Trap: "Deleting a department deletes its employees."

<details>
<summary>Answer</summary>

Only with `ON DELETE CASCADE`. The default foreign-key action (`NO ACTION`) **rejects** deleting a parent row that is still referenced.

```sql
DELETE FROM departments WHERE dept_id = 30;
```

**Output:**

```text
ERROR:  update or delete on table "departments" violates foreign key constraint "employees_dept_id_fkey" on table "employees"
DETAIL:  Key (dept_id)=(30) is still referenced from table "employees".
```

In the sample, `order_items` references `orders` with `ON DELETE CASCADE`, so deleting an order deletes its lines. Other options: `SET NULL`, `SET DEFAULT`, `RESTRICT` (like `NO ACTION`, but checked immediately even when the constraint is deferred).

</details>

### Q17. Trap: "A CTE is always computed once and stored."

<details>
<summary>Answer</summary>

Since PostgreSQL 12, a non-recursive, side-effect-free CTE referenced **once** is inlined into the main query like a subquery, so conditions can be pushed into it. It is materialized when referenced more than once, when it is recursive or data-modifying, or when written `AS MATERIALIZED`; `AS NOT MATERIALIZED` forces inlining. Before PostgreSQL 12 every CTE was an optimisation fence. A CTE versus a subquery is mostly about readability.

</details>

### Q18. Trap: "A CTE and a temporary table are the same thing."

<details>
<summary>Answer</summary>

| | CTE | Temporary table |
|---|---|---|
| Lifetime | One statement | Session (or transaction with `ON COMMIT DROP`) |
| Reusable across statements | No | Yes |
| Indexes, `ANALYZE` | No | Yes |
| Catalog cost | None | Creates catalog entries (bloat if created very often) |

Use a CTE to structure one query; use a temp table for a multi-step process that reuses a large intermediate result, especially if indexing it helps.

</details>

### Q19. Trap: "A view stores data, so it makes queries faster."

<details>
<summary>Answer</summary>

A plain view stores only the query text; each use re-runs it (merged into the outer query). A **materialized view** stores the result. It is fast to read but stale until `REFRESH MATERIALIZED VIEW` (with `CONCURRENTLY`, which needs a unique index, readers are not blocked). Views are for abstraction and security; materialized views are for expensive, slightly-stale reports.

</details>

### Q20. Trap: "`SERIAL` is the standard way to create an auto-increment column."

<details>
<summary>Answer</summary>

`SERIAL` is PostgreSQL shorthand: an `integer` with a default `nextval()` from a sequence it creates. `GENERATED { ALWAYS | BY DEFAULT } AS IDENTITY` is the SQL standard (PostgreSQL 10+). It ties the sequence to the column more strictly, and `ALWAYS` rejects manual values unless `OVERRIDING SYSTEM VALUE` is used. Both leave **gaps** after rollbacks; neither guarantees consecutive numbers. Prefer identity columns for new tables.

</details>

## Advanced

### Q21. Trap: "`timestamptz` stores the time zone."

<details>
<summary>Answer</summary>

It does not. `timestamptz` stores an absolute instant (internally UTC) and converts to the session `TimeZone` on input and output. `timestamp` stores a wall-clock value with no zone at all.

```sql
SET TIME ZONE 'Asia/Kolkata';
SELECT TIMESTAMPTZ '2026-01-01 10:00:00+00' AS shown_in_ist,
       TIMESTAMP   '2026-01-01 10:00:00+00' AS offset_ignored;
```

**Output:**

```text
       shown_in_ist        |   offset_ignored
---------------------------+---------------------
 2026-01-01 15:30:00+05:30 | 2026-01-01 10:00:00
(1 row)
```

The `+00` offset is honoured for `timestamptz` (shown as 15:30 IST) and silently ignored for `timestamp`. Store events as `timestamptz`.

</details>

### Q22. Trap: "Partitioning is just a better index."

<details>
<summary>Answer</summary>

No. An **index** is an extra structure to find rows quickly inside one table. **Partitioning** splits the table's storage into several tables by a key. It helps queries that filter on that key (pruning) and makes retention cheap (drop a partition). It does not speed up lookups on other columns, and it adds rules: primary keys must include the partition key, and there is no global index. Most large tables need indexes; only some benefit from partitioning.

</details>

### Q23. Trap: "A normalised schema is always the best design."

<details>
<summary>Answer</summary>

Normalisation (to 3NF/BCNF) removes redundancy so every fact is stored once, which prevents update, insert and delete anomalies. That is the right default for transactional systems. **Denormalisation** deliberately adds redundancy — stored totals, copied names, summary tables, materialized views — to make specific reads cheaper. The cost is keeping copies in sync (triggers, application code, refreshes). Normalise first, then denormalise measured hot paths, and document the rule that keeps the copy correct.

</details>

### Q24. Trap: "`BETWEEN '2026-01-01' AND '2026-01-31'` selects all of January."

<details>
<summary>Answer</summary>

Not for `timestamp`/`timestamptz` columns: `'2026-01-31'` means midnight at the start of the 31st, so the rest of that day is excluded.

```sql
SELECT TIMESTAMP '2026-01-31 18:00' BETWEEN '2026-01-01' AND '2026-01-31' AS between_result,
       TIMESTAMP '2026-01-31 18:00' >= '2026-01-01'
   AND TIMESTAMP '2026-01-31 18:00' <  '2026-02-01'                     AS half_open_result;
```

**Output:**

```text
 between_result | half_open_result
----------------+------------------
 f              | t
(1 row)
```

Use half-open ranges (`>= start AND < next_start`).

</details>

### Q25. Trap: "`SELECT 7 / 2` returns 3.5."

<details>
<summary>Answer</summary>

Integer divided by integer is integer division in PostgreSQL (truncated toward zero).

```sql
SELECT 7 / 2 AS int_div, 7 / 2.0 AS numeric_div, -7 / 2 AS negative_int_div,
       round(100.0 * 3 / 12, 1) AS pct;
```

**Output:**

```text
 int_div |    numeric_div     | negative_int_div | pct
---------+--------------------+------------------+------
       3 | 3.5000000000000000 |               -3 | 25.0
(1 row)
```

Write `100.0 * part / total` (or cast) for percentages.

</details>

### Q26. Trap: "`'Hello ' || NULL` returns `'Hello '`."

<details>
<summary>Answer</summary>

`||` with a `NULL` operand returns `NULL`. `concat()` and `concat_ws()` skip `NULL`s.

```sql
SELECT 'Hello ' || NULL AS pipe, concat('Hello ', NULL) AS concat_fn,
       concat_ws(', ', 'Chennai', NULL, 'India') AS concat_ws_fn;
```

**Output:**

```text
 pipe | concat_fn |  concat_ws_fn
------+-----------+----------------
 NULL | Hello     | Chennai, India
(1 row)
```

</details>

### Q27. Trap: "`SELECT dept_id, name FROM employees GROUP BY dept_id` works in PostgreSQL."

<details>
<summary>Answer</summary>

It fails: every selected column must be grouped or aggregated, because a group has many names.

```sql
SELECT dept_id, name FROM employees GROUP BY dept_id;
```

**Output:**

```text
ERROR:  column "employees.name" must appear in the GROUP BY clause or be used in an aggregate function
LINE 1: SELECT dept_id, name FROM employees GROUP BY dept_id;
                        ^
```

Exception: if you group by a table's **primary key**, other columns of that table may be selected, because they are functionally dependent on it. MySQL's permissive mode returns an arbitrary name, which is a classic source of wrong results when porting.

</details>

### Q28. Trap: "A running total with `sum() OVER (ORDER BY day)` always adds one row at a time."

<details>
<summary>Answer</summary>

The default frame is `RANGE … CURRENT ROW`, which includes all **peers** (rows with the same `ORDER BY` value).

```sql
SELECT v.d, v.amt,
       sum(v.amt) OVER (ORDER BY v.d) AS range_total,
       sum(v.amt) OVER (ORDER BY v.d, v.amt ROWS UNBOUNDED PRECEDING) AS rows_total
FROM (VALUES (1, 10), (2, 20), (2, 30), (3, 40)) AS v(d, amt)
ORDER BY v.d, v.amt;
```

**Output:**

```text
 d | amt | range_total | rows_total
---+-----+-------------+------------
 1 |  10 |          10 |         10
 2 |  20 |          60 |         30
 2 |  30 |          60 |         60
 3 |  40 |         100 |        100
(4 rows)
```

Both day-2 rows get 60 under `RANGE`. When each row must accumulate separately, use `ROWS` **and** a tiebreaker in the window `ORDER BY` (here `v.amt`); without the tiebreaker the order of tied rows is arbitrary.

</details>
