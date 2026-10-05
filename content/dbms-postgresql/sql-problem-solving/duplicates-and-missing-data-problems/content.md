# Duplicates and Missing Data Problems

**Module:** SQL Problem Solving · **Interview priority:** Core

## What Is It?

Two families of everyday SQL problems:

- **Duplicates** — find rows that repeat a value that should be unique, show them, delete all but one, and stop them from coming back.
- **Missing data** — find rows that have **no** matching row elsewhere: employees with no manager, departments with no employees, customers who never ordered, products never sold. These are **anti-joins**.

Examples use the [sample database](../../sql-fundamentals/dbms-sample-database/content.md) plus a small `contacts` table defined below.

## Why It Matters

- "Find duplicate emails" and "delete duplicates keeping one" are standard interview questions, and a frequent clean-up task before adding a unique constraint.
- "Customers who never ordered" tests whether you know `LEFT JOIN … IS NULL`, `NOT EXISTS`, and the `NOT IN` + `NULL` trap.
- Getting these wrong in production deletes the wrong rows or silently reports nothing.

## Core Concept

### Finding duplicates

| Goal | Pattern |
|------|---------|
| Which values repeat, and how often? | `GROUP BY key HAVING count(*) > 1` |
| Show the full duplicate rows | `count(*) OVER (PARTITION BY key) > 1` in a subquery |
| Number copies to keep one | `ROW_NUMBER() OVER (PARTITION BY key ORDER BY id)` — keep `rn = 1` |

"Duplicate" must be defined first: the same email? The same email ignoring case and spaces? Every column identical?

### Deleting duplicates (keep one)

| Method | When |
|--------|------|
| `DELETE … USING` self-join on key with `a.id > b.id` | Table has a unique id; keeps the lowest id |
| `DELETE … WHERE id IN (SELECT id … WHERE rn > 1)` | Same, with full control over which copy survives (`ORDER BY` in the window) |
| Same with `ctid` instead of `id` | No key at all (fully identical rows); `ctid` is the row's physical location, stable only within a statement |
| `CREATE TABLE new AS SELECT DISTINCT …` + swap | Most of the table is duplicated; rebuilding is cheaper than deleting |

Run it inside a transaction, check the count, then add a `UNIQUE` constraint or unique index so duplicates cannot return.

### Anti-joins: rows with no match

| Form | NULL-safe? | Notes |
|------|-----------|-------|
| `NOT EXISTS (SELECT 1 FROM b WHERE b.k = a.k)` | Yes | Clearest; recommended |
| `LEFT JOIN b ON b.k = a.k WHERE b.k IS NULL` | Yes | Test a column that cannot be NULL in a matched row (the join key or the primary key) |
| `a.k NOT IN (SELECT k FROM b)` | **No** | If the subquery returns any `NULL`, the result is empty |
| `EXCEPT` | Yes | Compares whole rows of the selected columns; returns only those columns |

PostgreSQL plans `NOT EXISTS` and `LEFT JOIN … IS NULL` as the same hash or merge anti-join. `NOT IN` with a subquery cannot be converted to an anti-join because of `NULL` semantics. See [EXISTS, IN, ANY and ALL](../../subqueries/exists-in-any-all/content.md) and [NULL in Joins and Subqueries](../../null-and-conditional-logic/null-in-joins-and-subqueries/content.md).

### Missing values versus missing rows

- **Missing value**: the row exists but a column is `NULL` (Asha has no `manager_id`) → `WHERE manager_id IS NULL`.
- **Missing row**: nothing exists in the other table (Research has no employees) → anti-join.

## Syntax

```sql
-- Illustrative
-- Find duplicate values
SELECT key, count(*) FROM t GROUP BY key HAVING count(*) > 1;

-- Delete duplicates, keeping the lowest id
DELETE FROM t a USING t b WHERE a.key = b.key AND a.id > b.id;

-- Anti-join
SELECT a.* FROM a WHERE NOT EXISTS (SELECT 1 FROM b WHERE b.a_id = a.id);
```

## Examples

### E1. Find duplicate emails

```sql
CREATE TABLE contacts (
    contact_id integer PRIMARY KEY,
    name       text NOT NULL,
    email      text
);
INSERT INTO contacts VALUES
    (1, 'Anil',    'anil@mail.com'),
    (2, 'Bhavna',  'bhavna@mail.com'),
    (3, 'Anil K',  'anil@mail.com'),
    (4, 'Chirag',  'Chirag@Mail.com'),
    (5, 'Chirag',  'chirag@mail.com '),
    (6, 'Deepa',   NULL),
    (7, 'Deepa R', NULL),
    (8, 'Anil',    'anil@mail.com');

SELECT email, count(*) AS copies
FROM contacts
GROUP BY email
HAVING count(*) > 1
ORDER BY email;
```

**Output:**

```text
     email     | copies
---------------+--------
 anil@mail.com |      3
 NULL          |      2
(2 rows)
```

`GROUP BY` puts the two `NULL`s in one group, even though `NULL = NULL` is not true; decide whether "no email" counts as a duplicate. The two Chirag addresses differ in case and a trailing space, so they are not detected. Normalise first:

```sql
SELECT lower(trim(email)) AS email_key, count(*) AS copies,
       array_agg(contact_id ORDER BY contact_id) AS ids
FROM contacts
WHERE email IS NOT NULL
GROUP BY lower(trim(email))
HAVING count(*) > 1
ORDER BY email_key;
```

**Output:**

```text
    email_key    | copies |   ids
-----------------+--------+---------
 anil@mail.com   |      3 | {1,3,8}
 chirag@mail.com |      2 | {4,5}
(2 rows)
```

### E2. Show the complete duplicate rows

```sql
SELECT contact_id, name, email, copies
FROM (SELECT c.*, count(*) OVER (PARTITION BY lower(trim(email))) AS copies
      FROM contacts c
      WHERE email IS NOT NULL) t
WHERE copies > 1
ORDER BY lower(trim(email)), contact_id;
```

**Output:**

```text
 contact_id |  name  |      email       | copies
------------+--------+------------------+--------
          1 | Anil   | anil@mail.com    |      3
          3 | Anil K | anil@mail.com    |      3
          8 | Anil   | anil@mail.com    |      3
          4 | Chirag | Chirag@Mail.com  |      2
          5 | Chirag | chirag@mail.com  |      2
(5 rows)
```

A window `count` keeps every row; `GROUP BY` would collapse them.

### E3. Delete duplicates, keeping the lowest id

```sql
BEGIN;

DELETE FROM contacts a
USING contacts b
WHERE lower(trim(a.email)) = lower(trim(b.email))
  AND a.contact_id > b.contact_id;

SELECT contact_id, name, email FROM contacts ORDER BY contact_id;

ROLLBACK;
```

**Output:**

```text
 contact_id |  name   |      email
------------+---------+-----------------
          1 | Anil    | anil@mail.com
          2 | Bhavna  | bhavna@mail.com
          4 | Chirag  | Chirag@Mail.com
          6 | Deepa   | NULL
          7 | Deepa R | NULL
(5 rows)
```

The delete removed three rows — contacts 3, 5 and 8 — keeping the lowest id of each normalised email. Rows with a `NULL` email are untouched, because `NULL = NULL` is not true in the join. `ROLLBACK` is used here so the next example starts from the same data; in real clean-up, check the count and `COMMIT`.

The `ROW_NUMBER` version chooses the survivor explicitly — here, the most recent contact (highest id) is kept:

```sql
BEGIN;

DELETE FROM contacts
WHERE contact_id IN (
    SELECT contact_id
    FROM (SELECT contact_id,
                 ROW_NUMBER() OVER (PARTITION BY lower(trim(email))
                                    ORDER BY contact_id DESC) AS rn
          FROM contacts
          WHERE email IS NOT NULL) t
    WHERE rn > 1
);

SELECT contact_id, name, email FROM contacts ORDER BY contact_id;

ROLLBACK;
```

**Output:**

```text
 contact_id |  name   |      email
------------+---------+------------------
          2 | Bhavna  | bhavna@mail.com
          5 | Chirag  | chirag@mail.com
          6 | Deepa   | NULL
          7 | Deepa R | NULL
          8 | Anil    | anil@mail.com
(5 rows)
```

### E4. Fully identical rows with no key

```sql
CREATE TABLE tags (tag text, colour text);
INSERT INTO tags VALUES ('sql', 'blue'), ('sql', 'blue'), ('java', 'red'), ('sql', 'blue');

DELETE FROM tags a
USING tags b
WHERE a.tag = b.tag AND a.colour = b.colour
  AND a.ctid > b.ctid;

SELECT * FROM tags ORDER BY tag;
```

**Output:**

```text
 tag  | colour
------+--------
 java | red
 sql  | blue
(2 rows)
```

Without a key, the system column `ctid` (physical row position) tells the copies apart. Use it only within one statement — it changes after `UPDATE` or `VACUUM FULL` — and add a primary key afterwards.

### E5. Prevent duplicates from coming back

```sql
CREATE TABLE members (
    member_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email     text NOT NULL
);
CREATE UNIQUE INDEX members_email_key ON members (lower(trim(email)));

INSERT INTO members (email) VALUES ('anil@mail.com');
INSERT INTO members (email) VALUES ('Anil@Mail.com ');
```

**Output:**

```text
ERROR:  duplicate key value violates unique constraint "members_email_key"
DETAIL:  Key (lower(TRIM(BOTH FROM email)))=(anil@mail.com) already exists.
```

A unique **expression index** enforces "unique ignoring case and spaces". Importing data then becomes `INSERT … ON CONFLICT DO NOTHING` (see [RETURNING and Upsert](../../postgresql-features/returning-and-upsert/content.md)).

### E6. Employees with no manager

```sql
SELECT emp_id, name FROM employees WHERE manager_id IS NULL;
SELECT emp_id, name FROM employees WHERE manager_id = NULL;
```

**Output:**

```text
 emp_id | name
--------+------
      1 | Asha
(1 row)

 emp_id | name
--------+------
(0 rows)
```

`= NULL` is never true, so the second query returns nothing. A **missing value** is tested with `IS NULL`.

### E7. Departments with no employees — three anti-joins

```sql
SELECT d.dept_id, d.dept_name
FROM departments d
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.dept_id);

SELECT d.dept_id, d.dept_name
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
WHERE e.emp_id IS NULL;

SELECT dept_id, dept_name
FROM departments
WHERE dept_id NOT IN (SELECT dept_id FROM employees);
```

**Output:**

```text
 dept_id | dept_name
---------+-----------
      50 | Research
(1 row)

 dept_id | dept_name
---------+-----------
      50 | Research
(1 row)

 dept_id | dept_name
---------+-----------
(0 rows)
```

The `NOT IN` version returns **nothing**. Nisha's `dept_id` is `NULL`, so for Research the test becomes `50 <> 10 AND … AND 50 <> NULL`, which is unknown, never true. Add `WHERE dept_id IS NOT NULL` inside the subquery, or use `NOT EXISTS`.

### E8. Customers who never ordered

```sql
SELECT c.customer_id, c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)
ORDER BY c.customer_id;
```

**Output:**

```text
 customer_id |  name
-------------+--------
           6 | Fatima
(1 row)
```

Variation: customers with no **delivered** order. The condition goes **inside** the subquery (or the `ON` clause of a left join):

```sql
SELECT c.customer_id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'DELIVERED'
WHERE o.order_id IS NULL
ORDER BY c.customer_id;
```

**Output:**

```text
 customer_id |  name
-------------+--------
           3 | Chirag
           6 | Fatima
(2 rows)
```

Putting `o.status = 'DELIVERED'` in the `WHERE` clause instead would turn the left join into an inner join and return no rows.

### E9. Products never sold, with EXCEPT

```sql
SELECT product_id FROM products
EXCEPT
SELECT product_id FROM order_items
ORDER BY product_id;
```

**Output:**

```text
 product_id
------------
          6
(1 row)
```

`EXCEPT` treats `NULL`s as equal and removes duplicates, but returns only the compared columns. Join back to `products` to get the name, or use `NOT EXISTS` directly.

### E10. Rows that are missing a required value

```sql
SELECT 'employees.email' AS column_checked, count(*) FILTER (WHERE email IS NULL) AS missing, count(*) AS total
FROM employees
UNION ALL
SELECT 'customers.city', count(*) FILTER (WHERE city IS NULL), count(*) FROM customers
UNION ALL
SELECT 'customers.email', count(*) FILTER (WHERE email IS NULL), count(*) FROM customers;
```

**Output:**

```text
 column_checked  | missing | total
-----------------+---------+-------
 employees.email |       1 |    12
 customers.city  |       1 |     6
 customers.email |       1 |     6
(3 rows)
```

`count(column)` skips `NULL`s, so `count(*) - count(email)` gives the same number. A data-quality report like this is common before adding a `NOT NULL` constraint.

## Comparison

| Problem | Best query | Watch out for |
|---------|-----------|---------------|
| Which values are duplicated | `GROUP BY … HAVING count(*) > 1` | Normalisation (case, spaces); `NULL` group |
| All duplicate rows | Window `count(*) OVER (PARTITION BY …)` | Filtering needs an outer query |
| Delete duplicates | `DELETE USING` or `ROW_NUMBER` + `IN` | Run in a transaction; decide which copy survives |
| No key at all | `ctid` comparison | Add a key afterwards |
| Prevent duplicates | `UNIQUE` constraint / unique expression index | Existing duplicates must be removed first |
| Rows with no match | `NOT EXISTS` / `LEFT JOIN … IS NULL` | `NOT IN` + `NULL` returns nothing |
| Missing column value | `IS NULL`, `count(*) FILTER (WHERE … IS NULL)` | `= NULL` is never true |

## Common Mistakes

- Using `NOT IN` against a column that can contain `NULL`.
- Testing a nullable column in `LEFT JOIN … WHERE b.col IS NULL`; test the join key or primary key of `b`.
- Putting a filter on the right table of a left join in `WHERE` instead of `ON`.
- Deleting duplicates without a transaction or without checking which copy survives.
- `DELETE … WHERE a.id <> b.id` instead of `>` — deletes **every** copy.
- Defining duplicates by raw text when the business rule ignores case and spaces.
- Forgetting the unique constraint afterwards, so duplicates return.

## Revision

- Duplicates: `GROUP BY … HAVING count(*) > 1`; full rows via window `count`; normalise keys (`lower(trim(…))`).
- Delete keeping one: `DELETE FROM t a USING t b WHERE a.key = b.key AND a.id > b.id`, or `ROW_NUMBER() > 1`; `ctid` when no key; then add a unique constraint or index.
- Anti-join: `NOT EXISTS` or `LEFT JOIN … WHERE b.pk IS NULL`; `NOT IN` returns nothing if the subquery has a `NULL`.
- Missing value → `IS NULL`; missing row → anti-join.
- Conditions on the optional side of a left join go in `ON`.

## Quick Revision

Find duplicates with `GROUP BY … HAVING count(*) > 1`, delete with a self-join `a.id > b.id` or `ROW_NUMBER() > 1`, then add a unique index. Find missing rows with `NOT EXISTS` — never `NOT IN` over a nullable column.
