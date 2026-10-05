# NULL and Three-Valued Logic

**Module:** NULL and Conditional Logic · **Interview priority:** Core

## What Is It?

`NULL` is SQL's marker for **"no value here"** — the value is unknown, missing or not applicable. It is not a value like `0` or `''`; it is the absence of one. Because a comparison with an unknown value cannot be true or false, SQL uses **three-valued logic**: every condition evaluates to **TRUE**, **FALSE** or **UNKNOWN**.

## Why It Matters

- More wrong query results come from `NULL` than from any other single cause: rows silently missing from `WHERE`, `NOT IN` returning nothing, averages that ignore people, joins that drop rows.
- Interviewers use `NULL` to test whether you understand SQL's logic rather than memorised syntax: "What does `NULL = NULL` return?", "Why does `WHERE col = NULL` return no rows?"

## Core Concept

### What NULL means

A `NULL` can mean different things depending on the column — the database does not know which:

| Meaning | Example |
|---------|---------|
| Unknown (exists but not known) | A customer's city was not captured (`Eshan`) |
| Missing / not yet available | `returned_on` of a book still on loan |
| Not applicable | `commission` for an engineer who is not in sales |

Decide and document what `NULL` means for each nullable column; queries depend on it.

### NULL is not 0, not '', not false

| Value | Meaning | `= 0`? | `= ''`? | `IS NULL`? |
|-------|---------|--------|---------|------------|
| `0` | Known to be zero | TRUE | error (`''` is not a valid integer) | FALSE |
| `''` | Known empty string | — | TRUE | FALSE |
| `false` | Known false | — | — | FALSE |
| `NULL` | Unknown | UNKNOWN | UNKNOWN | TRUE |

Rahul's commission is `0` (known: no commission earned); Sneha's is `NULL` (unknown or not applicable). They are different facts.

> [!WARNING]
> **Oracle treats `''` as `NULL`; PostgreSQL does not.** In PostgreSQL `'' IS NULL` is false and `length('')` is 0. Code migrated from Oracle often breaks on this.

### Three-valued logic

Any comparison involving `NULL` yields UNKNOWN (shown by psql as `NULL`):

```text
NULL = NULL   → UNKNOWN        5 = NULL   → UNKNOWN
NULL <> NULL  → UNKNOWN        NULL > 5   → UNKNOWN
NULL < 5      → UNKNOWN        NULL + 1   → NULL (arithmetic)
```

Why `NULL = NULL` is not TRUE: two unknown values might or might not be equal — "I don't know Eshan's city" and "I don't know Deepa's email" are not the same unknown.

Truth tables (U = UNKNOWN):

```text
AND   | T  F  U        OR    | T  F  U        NOT
------+---------      ------+---------      ------
T     | T  F  U       T     | T  T  T        T → F
F     | F  F  F       F     | T  F  U        F → T
U     | U  F  U       U     | T  U  U        U → U
```

Memory aid: `FALSE AND anything = FALSE`; `TRUE OR anything = TRUE`; otherwise UNKNOWN spreads.

### How clauses treat UNKNOWN

| Clause | Keeps a row when the condition is… |
|--------|-------------------------------------|
| `WHERE`, `HAVING`, `JOIN … ON` | **TRUE only** — FALSE and UNKNOWN are both rejected |
| `CHECK` constraint | **not FALSE** — TRUE and UNKNOWN both pass |
| `CASE WHEN` | TRUE only — UNKNOWN falls through to the next `WHEN`/`ELSE` |

This asymmetry (WHERE rejects UNKNOWN, CHECK accepts it) is a favourite interview question.

### Why `WHERE column = NULL` does not work

`email = NULL` is UNKNOWN for **every** row — even rows whose email is NULL — so `WHERE` keeps nothing. Use the dedicated predicates:

- `column IS NULL`
- `column IS NOT NULL`

### NULL-safe comparison: IS DISTINCT FROM

`a IS DISTINCT FROM b` treats two `NULL`s as equal and a `NULL` vs a value as different — it never returns UNKNOWN.

```text
a      b      a = b     a IS DISTINCT FROM b   a IS NOT DISTINCT FROM b
1      1      TRUE      FALSE                  TRUE
1      2      FALSE     TRUE                   FALSE
1      NULL   UNKNOWN   TRUE                   FALSE
NULL   NULL   UNKNOWN   FALSE                  TRUE
```

Use it for "has this value changed?" checks and for joining on nullable columns.

### The missing-rows trap: a condition and its negation do not cover everything

For a nullable column, `WHERE c > 0` plus `WHERE NOT (c > 0)` does **not** return every row — rows where `c` is `NULL` are UNKNOWN in both. Add `OR c IS NULL` when you mean "everything else".

### NULL in expressions and functions

- Arithmetic and most functions return `NULL` for a `NULL` input: `salary + NULL`, `upper(NULL)`, `'a' || NULL`.
- Exceptions skip or replace `NULL`: `concat()`, `concat_ws()`, `COALESCE()`, aggregates (`sum`, `avg`, …), `count(*)`.
- `NULL` in a boolean expression follows the truth tables: `NULL AND false` is `false`.

### NULL in clauses (summary)

| Where | Behaviour |
|-------|-----------|
| `WHERE` | Rows with UNKNOWN conditions are dropped |
| `ORDER BY` | PostgreSQL sorts `NULL`s as larger than all values: last in `ASC`, first in `DESC`; `NULLS FIRST/LAST` overrides |
| `GROUP BY` | All `NULL`s form **one group** |
| `DISTINCT` | All `NULL`s count as **one** value |
| `UNION`/`INTERSECT`/`EXCEPT` | `NULL`s are treated as equal (duplicates removed) |
| Aggregates | `NULL`s ignored; `count(*)` counts rows; all-NULL input gives `NULL` (`count` gives 0) |
| `UNIQUE` | Several `NULL`s allowed (unless `NULLS NOT DISTINCT`, PostgreSQL 15+) |
| `PRIMARY KEY` | `NULL` not allowed |
| `CHECK` | UNKNOWN passes |
| `IN (list)` | `x IN (1, NULL)` is TRUE if `x = 1`, otherwise UNKNOWN — never FALSE |
| `NOT IN (list)` | `x NOT IN (1, NULL)` is never TRUE → returns no rows |
| Joins | `NULL` keys never match in `ON a.k = b.k` |

`GROUP BY`, `DISTINCT` and set operations treat `NULL`s as "not distinct" from each other, while `=` treats them as unknown. SQL calls this "not distinct" grouping semantics.

### NULL in CASE

A **simple** `CASE x WHEN NULL THEN …` compares `x = NULL`, which is never TRUE — that branch can never run. Use a **searched** `CASE WHEN x IS NULL THEN …`. Full coverage: [CASE, COALESCE, NULLIF and Casting](../case-coalesce-and-casting/content.md).

### COALESCE and NULLIF in one line each

- `COALESCE(a, b, c)` returns the first non-NULL argument — "use a default when unknown".
- `NULLIF(a, b)` returns `NULL` if `a = b`, else `a` — "turn a sentinel into NULL", classically `x / NULLIF(y, 0)` to avoid division by zero.

### Boolean columns and NULL

A nullable `boolean` has three states. `WHERE NOT is_active` drops rows where `is_active` is `NULL`. PostgreSQL's `IS TRUE`, `IS FALSE`, `IS NOT TRUE`, `IS UNKNOWN` never return UNKNOWN: `WHERE is_active IS NOT TRUE` returns both false and NULL rows.

## Syntax

```sql
-- Illustrative: NULL predicates and functions
expr IS NULL                    expr IS NOT NULL
a IS DISTINCT FROM b            a IS NOT DISTINCT FROM b
bool_expr IS TRUE | IS NOT TRUE | IS FALSE | IS NOT FALSE | IS UNKNOWN
COALESCE(expr1, expr2, ...)     NULLIF(expr1, expr2)
```

## Examples

### Comparisons with NULL

```sql
SELECT NULL = NULL       AS null_eq_null,
       NULL <> NULL      AS null_ne_null,
       NULL > 5          AS null_gt_5,
       NULL < 5          AS null_lt_5,
       NULL IS NULL      AS is_null,
       NULL IS NOT DISTINCT FROM NULL AS not_distinct;
```

**Output:**

```text
 null_eq_null | null_ne_null | null_gt_5 | null_lt_5 | is_null | not_distinct
--------------+--------------+-----------+-----------+---------+--------------
 NULL         | NULL         | NULL      | NULL      | t       | t
(1 row)
```

### Truth table checks

```sql
SELECT NULL AND false AS u_and_f,
       NULL AND true  AS u_and_t,
       NULL OR true   AS u_or_t,
       NULL OR false  AS u_or_f,
       NOT NULL::boolean AS not_u;
```

**Output:**

```text
 u_and_f | u_and_t | u_or_t | u_or_f | not_u
---------+---------+--------+--------+-------
 f       | NULL    | t      | NULL   | NULL
(1 row)
```

### `= NULL` returns nothing; `IS NULL` works

```sql
SELECT name FROM employees WHERE email = NULL;
```

**Output:**

```text
 name
------
(0 rows)
```

```sql
SELECT name FROM employees WHERE email IS NULL;
```

**Output:**

```text
 name
-------
 Karan
(1 row)
```

### A condition and its negation miss the NULL rows

```sql
SELECT
    (SELECT count(*) FROM employees WHERE commission > 0)              AS positive,
    (SELECT count(*) FROM employees WHERE NOT (commission > 0))        AS not_positive,
    (SELECT count(*) FROM employees WHERE commission IS NULL)          AS unknown,
    (SELECT count(*) FROM employees)                                   AS total;
```

**Output:**

```text
 positive | not_positive | unknown | total
----------+--------------+---------+-------
        2 |            1 |       9 |    12
(1 row)
```

2 + 1 = 3, not 12: the nine `NULL` commissions satisfy neither condition.

### NULL vs 0 vs empty string

```sql
SELECT name, commission,
       commission IS NULL         AS is_null,
       commission = 0             AS equals_zero,
       COALESCE(commission, 0)    AS commission_or_zero
FROM employees
WHERE dept_id = 20
ORDER BY emp_id;
```

**Output:**

```text
 name  | commission | is_null | equals_zero | commission_or_zero
-------+------------+---------+-------------+--------------------
 Divya |       5000 | f       | f           |               5000
 Arjun |       3000 | f       | f           |               3000
 Sneha |       NULL | t       | NULL        |                  0
 Rahul |          0 | f       | t           |                  0
(4 rows)
```

```sql
SELECT '' IS NULL AS empty_is_null, length('') AS empty_length, NULL::text IS NULL AS null_is_null;
```

**Output:**

```text
 empty_is_null | empty_length | null_is_null
---------------+--------------+--------------
 f             |            0 | t
(1 row)
```

### NULL in GROUP BY, DISTINCT and ORDER BY

```sql
SELECT dept_id, count(*) AS employees
FROM employees
GROUP BY dept_id
ORDER BY dept_id;
```

**Output:**

```text
 dept_id | employees
---------+-----------
      10 |         4
      20 |         4
      30 |         2
      40 |         1
    NULL |         1
(5 rows)
```

Nisha's `NULL` department forms its own group, listed last (ascending order puts `NULL` last).

```sql
SELECT DISTINCT commission FROM employees ORDER BY commission NULLS FIRST;
```

**Output:**

```text
 commission
------------
       NULL
          0
       3000
       5000
(4 rows)
```

Nine `NULL`s collapse into one row for `DISTINCT`.

### NULL in arithmetic and aggregates

```sql
SELECT name, salary, commission,
       salary + commission               AS naive_total,
       salary + COALESCE(commission, 0)  AS total_pay
FROM employees
WHERE dept_id = 20
ORDER BY emp_id;
```

**Output:**

```text
 name  | salary | commission | naive_total | total_pay
-------+--------+------------+-------------+-----------
 Divya |  88000 |       5000 |       93000 |     93000
 Arjun |  60000 |       3000 |       63000 |     63000
 Sneha |  60000 |       NULL |        NULL |     60000
 Rahul |  55000 |          0 |       55000 |     55000
(4 rows)
```

### NULL-safe comparison

Find employees whose commission differs from Arjun's 3000 — including those with no commission:

```sql
SELECT name, commission
FROM employees
WHERE dept_id = 20
  AND commission IS DISTINCT FROM 3000
ORDER BY emp_id;
```

**Output:**

```text
 name  | commission
-------+------------
 Divya |       5000
 Sneha |       NULL
 Rahul |          0
(3 rows)
```

`commission <> 3000` would have dropped Sneha.

### IN and NOT IN with a NULL in the list

```sql
SELECT 5 IN (5, NULL)      AS in_found,
       7 IN (5, NULL)      AS in_not_found,
       7 NOT IN (5, NULL)  AS not_in;
```

**Output:**

```text
 in_found | in_not_found | not_in
----------+--------------+--------
 t        | NULL         | NULL
(1 row)
```

`7 NOT IN (5, NULL)` means `7 <> 5 AND 7 <> NULL` = `TRUE AND UNKNOWN` = UNKNOWN, so a `WHERE … NOT IN` list containing `NULL` returns no rows. The subquery version is the most famous SQL trap: [NULL in Joins and Subqueries](../null-in-joins-and-subqueries/content.md).

### Boolean tests

```sql
CREATE TABLE feature_flags (name text PRIMARY KEY, enabled boolean);
INSERT INTO feature_flags VALUES ('dark_mode', true), ('beta_search', false), ('new_checkout', NULL);

SELECT name FROM feature_flags WHERE NOT enabled;
```

**Output:**

```text
    name
-------------
 beta_search
(1 row)
```

```sql
SELECT name FROM feature_flags WHERE enabled IS NOT TRUE ORDER BY name;
```

**Output:**

```text
     name
--------------
 beta_search
 new_checkout
(2 rows)
```

### NULLIF to avoid division by zero

```sql
SELECT 100 / NULLIF(0, 0) AS safe_division;
```

**Output:**

```text
 safe_division
---------------
          NULL
(1 row)
```

```sql
SELECT 100 / 0 AS unsafe_division;
```

**Output:**

```text
ERROR:  division by zero
```

## Comparison

### `=` vs `IS NOT DISTINCT FROM` vs `IS NULL`

| | `a = b` | `a IS NOT DISTINCT FROM b` | `a IS NULL` |
|---|---|---|---|
| Both NULL | UNKNOWN | TRUE | — |
| One NULL | UNKNOWN | FALSE | TRUE if `a` is NULL |
| Can return UNKNOWN | Yes | No | No |
| Uses B-tree index (PostgreSQL) | Yes | Not directly | Yes |

### WHERE vs CHECK with UNKNOWN

| Condition result | `WHERE` keeps row? | `CHECK` accepts row? |
|------------------|--------------------|----------------------|
| TRUE | Yes | Yes |
| FALSE | No | No |
| UNKNOWN | **No** | **Yes** |

## Common Mistakes

- `WHERE col = NULL` or `WHERE col <> NULL` — always empty. Use `IS NULL` / `IS NOT NULL`.
- Expecting `WHERE status <> 'CANCELLED'` to include rows where `status` is `NULL`.
- `NOT IN` with a list or subquery that can contain `NULL`.
- `salary + commission` when commission may be `NULL`.
- Treating `''` and `NULL` as the same (true in Oracle, false in PostgreSQL).
- `CASE x WHEN NULL` — never matches.
- Assuming `UNIQUE` rejects a second `NULL`.
- Forgetting that `avg` ignores `NULL`s.

## Revision

- `NULL` = no value (unknown, missing, not applicable); not `0`, not `''`, not `false`.
- Comparisons with `NULL` give UNKNOWN; logic is three-valued (TRUE/FALSE/UNKNOWN).
- `FALSE AND x = FALSE`, `TRUE OR x = TRUE`; otherwise UNKNOWN propagates; `NOT UNKNOWN = UNKNOWN`.
- `WHERE`/`ON`/`HAVING` keep only TRUE; `CHECK` rejects only FALSE.
- Test with `IS NULL`, `IS NOT NULL`, `IS [NOT] DISTINCT FROM`, `IS [NOT] TRUE`.
- `GROUP BY`/`DISTINCT`/set operations group `NULL`s together; `ORDER BY` puts them last in ASC (PostgreSQL).
- Aggregates ignore `NULL` (except `count(*)`); `x NOT IN (…, NULL)` is never TRUE.
- `COALESCE` gives a default; `NULLIF(a, b)` gives `NULL` when equal (safe division).

## Quick Revision

`NULL = NULL` is UNKNOWN, and `WHERE` keeps only TRUE — so use `IS NULL`. UNKNOWN passes `CHECK` but fails `WHERE`; `NOT IN` with a `NULL` returns nothing.
