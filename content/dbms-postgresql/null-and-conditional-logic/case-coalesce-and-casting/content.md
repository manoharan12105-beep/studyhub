# CASE, COALESCE, NULLIF and Type Casting

**Module:** NULL and Conditional Logic · **Interview priority:** Core

## What Is It?

- **`CASE`** is SQL's if/else expression: it returns one value chosen by conditions. It comes in two forms — **simple** (`CASE x WHEN v1 THEN …`) and **searched** (`CASE WHEN condition THEN …`).
- **`COALESCE(a, b, …)`** returns its first non-NULL argument.
- **`NULLIF(a, b)`** returns `NULL` if `a = b`, otherwise `a`.
- **Casting** converts a value from one data type to another: standard `CAST(x AS type)` or PostgreSQL's shorthand `x::type`.

## Why It Matters

- `CASE` turns raw data into business categories (salary bands, order buckets) and powers **conditional aggregation** — pivot-style reports in a single pass.
- PostgreSQL is **strictly typed**: comparing an `integer` column with a `text` column is an error, not a silent conversion. Knowing when you need a cast — and when a cast will fail — saves debugging time.

## Core Concept

### Simple CASE

Compares one expression with a list of values using `=`:

```sql
-- Illustrative: simple CASE
CASE status
    WHEN 'DELIVERED' THEN 'Done'
    WHEN 'CANCELLED' THEN 'Closed'
    ELSE 'In progress'
END
```

Because it uses `=`, `WHEN NULL` never matches.

### Searched CASE

Each `WHEN` has its own boolean condition; the **first TRUE** one wins:

```sql
-- Illustrative: searched CASE
CASE
    WHEN salary >= 100000 THEN 'High'
    WHEN salary >= 60000  THEN 'Medium'
    WHEN salary IS NULL   THEN 'Unknown'
    ELSE 'Low'
END
```

Rules:

- Conditions are tested top to bottom; order them from most to least specific.
- A condition that is UNKNOWN is treated like FALSE (falls through).
- Without `ELSE`, an unmatched row gets `NULL`.
- All `THEN`/`ELSE` results must have a common type: `CASE WHEN … THEN 1 ELSE 'none' END` is an error.
- `CASE` can appear anywhere an expression can: `SELECT`, `WHERE`, `ORDER BY`, `GROUP BY`, inside aggregates, in `UPDATE … SET`.

### Conditional aggregation

An aggregate over a `CASE` counts or sums only selected rows — several metrics in one scan:

```sql
-- Illustrative: two ways to count conditionally
count(CASE WHEN status = 'DELIVERED' THEN 1 END)       -- portable: NULL for others is ignored
count(*) FILTER (WHERE status = 'DELIVERED')            -- PostgreSQL / SQL-standard FILTER clause
```

### COALESCE

- Returns the first argument that is not `NULL`; `NULL` only if all are `NULL`.
- Arguments must share a common type: `COALESCE(commission, 'none')` fails for an integer column — cast first: `COALESCE(commission::text, 'none')`.
- PostgreSQL evaluates arguments only until it finds a non-NULL one.
- Equivalent to `CASE WHEN a IS NOT NULL THEN a WHEN b IS NOT NULL THEN b … END`.

### NULLIF

- `NULLIF(a, b)` = `CASE WHEN a = b THEN NULL ELSE a END`.
- Typical uses: `x / NULLIF(y, 0)` (no division-by-zero error), `NULLIF(trim(input), '')` (treat blank strings as missing).

### GREATEST and LEAST

`GREATEST(a, b, …)` and `LEAST(…)` return the largest/smallest argument. In PostgreSQL they **ignore `NULL`s** (returning `NULL` only if all are `NULL`); in MySQL and Oracle any `NULL` makes the result `NULL`.

### Casting

```sql
-- Illustrative: three casting syntaxes
CAST('42' AS integer)      -- SQL standard
'42'::integer              -- PostgreSQL shorthand
integer '42'               -- typed literal (only for string literals)
```

**Implicit casting** happens automatically when it is safe and unambiguous:

- Numeric promotion: `integer + numeric` → `numeric`; `integer` → `bigint`.
- **Unknown-type literals**: a quoted literal like `'2026-01-05'` or `'10'` has no type until context gives it one, so `WHERE order_date = '2026-01-05'` and `WHERE dept_id = '10'` work.
- **Assignment casts** when storing into a column: inserting `95000.6` into an `integer` column rounds to `95001`.

**No implicit cast** between unrelated types such as `integer` and `text` in comparisons and operators (removed in PostgreSQL 8.3 because silent conversions hid bugs):

```text
WHERE int_col = text_col    →  ERROR: operator does not exist: integer = text
```

**Explicit casting** is needed then — `int_col = text_col::integer` — and can fail at run time:

| Cast | Result |
|------|--------|
| `'42'::integer` | 42 |
| `'4.7'::integer` | ERROR: invalid input syntax for type integer |
| `4.7::integer` (numeric → integer) | 5 (rounds) |
| `'abc'::integer` | ERROR: invalid input syntax |
| `'2026-02-30'::date` | ERROR: date/time field value out of range |
| `99999::smallint` | ERROR: smallint out of range |
| `'yes'::boolean` | true (`'t'`, `'true'`, `'y'`, `'yes'`, `'on'`, `'1'` all accepted) |
| `12.5::text` | `'12.5'` |
| `'12.30'::numeric(5,1)` | 12.3 |

Casting a column inside `WHERE` (`WHERE created_at::date = '2026-01-05'`) can prevent the use of a normal index on that column — see [Query Optimization in Practice](../../query-optimization/query-optimization-practice/content.md).

### PostgreSQL-specific casting notes

- `::` binds tightly: `-5::integer` is parsed as `-(5::integer)`; `'a' || 1::text` casts only `1`.
- `to_char`, `to_date`, `to_number`, `to_timestamp` convert with explicit **format patterns** (`to_date('05/01/2026', 'DD/MM/YYYY')`) — safer than relying on `DateStyle`.
- Text output of numbers keeps their scale: `5.50::numeric(5,2)` prints `5.50`.

## Syntax

```sql
-- Illustrative: reference
CASE expr WHEN v1 THEN r1 [WHEN v2 THEN r2 ...] [ELSE r] END
CASE WHEN cond1 THEN r1 [WHEN cond2 THEN r2 ...] [ELSE r] END
COALESCE(v1, v2, ...)      NULLIF(v1, v2)
GREATEST(v1, v2, ...)      LEAST(v1, v2, ...)
CAST(expr AS type)         expr::type        type 'literal'
```

## Examples

### Searched CASE: salary bands

```sql
SELECT name, salary,
       CASE
           WHEN salary >= 100000 THEN 'High'
           WHEN salary >= 70000  THEN 'Medium'
           ELSE 'Low'
       END AS band
FROM employees
WHERE dept_id IN (10, 30)
ORDER BY salary DESC;
```

**Output:**

```text
  name  | salary |  band
--------+--------+--------
 Asha   | 150000 | High
 Ravi   |  95000 | Medium
 Meena  |  95000 | Medium
 Karan  |  72000 | Medium
 Vikram |  70000 | Medium
 Pooja  |  52000 | Low
(6 rows)
```

### Simple CASE: status labels

```sql
SELECT order_id, status,
       CASE status
           WHEN 'DELIVERED' THEN 'Done'
           WHEN 'CANCELLED' THEN 'Closed'
           ELSE 'In progress'
       END AS label
FROM orders
ORDER BY order_id;
```

**Output:**

```text
 order_id |  status   |    label
----------+-----------+-------------
      101 | DELIVERED | Done
      102 | DELIVERED | Done
      103 | SHIPPED   | In progress
      104 | CANCELLED | Closed
      105 | DELIVERED | Done
      106 | PLACED    | In progress
      107 | DELIVERED | Done
      108 | DELIVERED | Done
(8 rows)
```

### CASE in ORDER BY: custom sort order

Show open orders first, then delivered, then cancelled:

```sql
SELECT order_id, status
FROM orders
ORDER BY CASE status
             WHEN 'PLACED'    THEN 1
             WHEN 'SHIPPED'   THEN 2
             WHEN 'DELIVERED' THEN 3
             ELSE 4
         END,
         order_id;
```

**Output:**

```text
 order_id |  status
----------+-----------
      106 | PLACED
      103 | SHIPPED
      101 | DELIVERED
      102 | DELIVERED
      105 | DELIVERED
      107 | DELIVERED
      108 | DELIVERED
      104 | CANCELLED
(8 rows)
```

### Conditional aggregation (pivot)

Orders per customer by status, one row per customer:

```sql
SELECT customer_id,
       count(*)                                          AS total,
       count(CASE WHEN status = 'DELIVERED' THEN 1 END)  AS delivered,
       count(*) FILTER (WHERE status = 'CANCELLED')      AS cancelled,
       count(*) FILTER (WHERE status IN ('PLACED', 'SHIPPED')) AS open
FROM orders
GROUP BY customer_id
ORDER BY customer_id;
```

**Output:**

```text
 customer_id | total | delivered | cancelled | open
-------------+-------+-----------+-----------+------
           1 |     3 |         2 |         0 |    1
           2 |     2 |         1 |         0 |    1
           3 |     1 |         0 |         1 |    0
           4 |     1 |         1 |         0 |    0
           5 |     1 |         1 |         0 |    0
(5 rows)
```

### COALESCE for defaults and display

```sql
SELECT name,
       COALESCE(city, 'Unknown')            AS city,
       COALESCE(email, 'no-email')          AS email
FROM customers
WHERE city IS NULL OR email IS NULL
ORDER BY customer_id;
```

**Output:**

```text
 name  |  city   |     email
-------+---------+----------------
 Deepa | Chennai | no-email
 Eshan | Unknown | eshan@mail.com
(2 rows)
```

Type mismatch inside `COALESCE`:

```sql
SELECT name, COALESCE(commission, 'none') FROM employees WHERE emp_id = 7;
```

**Output:**

```text
ERROR:  invalid input syntax for type integer: "none"
LINE 1: SELECT name, COALESCE(commission, 'none') FROM employees WHE...
                                          ^
```

```sql
SELECT name, COALESCE(commission::text, 'none') AS commission FROM employees WHERE emp_id = 7;
```

**Output:**

```text
 name  | commission
-------+------------
 Sneha | none
(1 row)
```

### NULLIF: blank strings and division by zero

```sql
SELECT NULLIF(trim('   '), '')        AS blank_to_null,
       NULLIF('Chennai', '')          AS kept,
       10 / NULLIF(0, 0)              AS safe_divide;
```

**Output:**

```text
 blank_to_null |  kept   | safe_divide
---------------+---------+-------------
 NULL          | Chennai |        NULL
(1 row)
```

### GREATEST/LEAST ignore NULLs in PostgreSQL

```sql
SELECT name, salary, commission,
       GREATEST(salary * 0.05, commission) AS bonus_basis,
       LEAST(commission, 4000)             AS capped
FROM employees
WHERE dept_id = 20
ORDER BY emp_id;
```

**Output:**

```text
 name  | salary | commission | bonus_basis | capped
-------+--------+------------+-------------+--------
 Divya |  88000 |       5000 |        5000 |   4000
 Arjun |  60000 |       3000 |     3000.00 |   3000
 Sneha |  60000 |       NULL |     3000.00 |   4000
 Rahul |  55000 |          0 |     2750.00 |      0
(4 rows)
```

For Sneha, `GREATEST(3000.00, NULL)` returned 3000.00 rather than `NULL`.

### Casting: success, rounding and errors

```sql
SELECT '42'::integer              AS from_text,
       CAST('2026-03-15' AS date) AS a_date,
       4.7::integer               AS numeric_rounds,
       'yes'::boolean             AS bool_from_text,
       12.5::text || '%'          AS as_text,
       to_date('05/01/2026', 'DD/MM/YYYY') AS parsed_date;
```

**Output:**

```text
 from_text |   a_date   | numeric_rounds | bool_from_text | as_text | parsed_date
-----------+------------+----------------+----------------+---------+-------------
        42 | 2026-03-15 |              5 | t              | 12.5%   | 2026-01-05
(1 row)
```

```sql
SELECT '4.7'::integer;
```

**Output:**

```text
ERROR:  invalid input syntax for type integer: "4.7"
LINE 1: SELECT '4.7'::integer;
               ^
```

```sql
SELECT '2026-02-30'::date;
```

**Output:**

```text
ERROR:  date/time field value out of range: "2026-02-30"
LINE 1: SELECT '2026-02-30'::date;
               ^
```

### Strict typing: integer vs text

```sql
CREATE TABLE imported_orders (order_ref text, amount text);
INSERT INTO imported_orders VALUES ('101', '56000'), ('105', '5000');

SELECT o.order_id, i.amount
FROM orders o
JOIN imported_orders i ON i.order_ref = o.order_id;
```

**Output:**

```text
ERROR:  operator does not exist: text = integer
LINE 3: JOIN imported_orders i ON i.order_ref = o.order_id;
                                              ^
HINT:  No operator matches the given name and argument types. You might need to add explicit type casts.
```

```sql
SELECT o.order_id, i.amount::numeric AS amount
FROM orders o
JOIN imported_orders i ON i.order_ref::integer = o.order_id
ORDER BY o.order_id;
```

**Output:**

```text
 order_id | amount
----------+--------
      101 |  56000
      105 |   5000
(2 rows)
```

A literal still works without a cast because it starts as an unknown type:

```sql
SELECT dept_name FROM departments WHERE dept_id = '30';
```

**Output:**

```text
 dept_name
-----------
 HR
(1 row)
```

### Assignment cast on insert

```sql
CREATE TABLE scores (player text, score integer);
INSERT INTO scores VALUES ('a', 91.6), ('b', 91.4);
SELECT * FROM scores ORDER BY player;
```

**Output:**

```text
 player | score
--------+-------
 a      |    92
 b      |    91
(2 rows)
```

The numeric values were rounded when stored into the `integer` column — silently. Validate precision in the application or use `numeric`.

## Comparison

### Simple vs searched CASE

| | Simple CASE | Searched CASE |
|---|---|---|
| Form | `CASE x WHEN v THEN …` | `CASE WHEN cond THEN …` |
| Test | `x = v` only | Any condition (`>`, `IS NULL`, `LIKE`, `AND` …) |
| Handles `NULL` test | No (`WHEN NULL` never matches) | Yes (`WHEN x IS NULL`) |
| Use for | Mapping codes to labels | Ranges, complex rules |

### COALESCE vs NULLIF vs CASE

| | Purpose | Equivalent CASE |
|---|---|---|
| `COALESCE(a, b)` | Replace `NULL` with a fallback | `CASE WHEN a IS NOT NULL THEN a ELSE b END` |
| `NULLIF(a, b)` | Turn a specific value into `NULL` | `CASE WHEN a = b THEN NULL ELSE a END` |

### CAST vs `::`

| | `CAST(x AS t)` | `x::t` |
|---|---|---|
| Standard | SQL standard (portable) | PostgreSQL-specific |
| Readability | Verbose | Short, common in PostgreSQL code |
| Behaviour | Identical | Identical |

## Common Mistakes

- `CASE x WHEN NULL` — use a searched `CASE` with `IS NULL`.
- Ordering `WHEN` branches from least to most specific (`>= 60000` before `>= 100000` makes "High" unreachable).
- Mixing result types in `THEN`/`ELSE` or `COALESCE` arguments.
- Expecting `GREATEST`/`LEAST` to return `NULL` when one argument is `NULL` (true in MySQL/Oracle, not PostgreSQL).
- Comparing `integer` with `text` columns and expecting implicit conversion.
- Casting decimal strings directly to `integer` (`'4.7'::integer` fails) — cast to `numeric` first.
- Relying on silent rounding when inserting decimals into integer columns.

## Revision

- `CASE`: simple (`x WHEN v`, uses `=`) and searched (`WHEN cond`); first TRUE wins; no `ELSE` → `NULL`; one result type.
- Conditional aggregation: `count(CASE WHEN … THEN 1 END)` or `count(*) FILTER (WHERE …)`.
- `COALESCE` = first non-NULL; `NULLIF(a, b)` = `NULL` if equal (safe division, blank → NULL).
- PostgreSQL `GREATEST`/`LEAST` ignore `NULL`s.
- Casting: `CAST(x AS t)`, `x::t`, `t 'literal'`, `to_date`/`to_char` with formats.
- Implicit: numeric promotion, unknown literals, assignment casts (round silently). No implicit `integer` ↔ `text` comparison.
- Cast errors: invalid input syntax, out of range, invalid dates.

## Quick Revision

Searched `CASE WHEN … THEN … ELSE … END` handles any rule (including `IS NULL`); `COALESCE` fills NULLs, `NULLIF` creates them. PostgreSQL is strictly typed — cast with `::` or `CAST`, and expect errors for bad input.
