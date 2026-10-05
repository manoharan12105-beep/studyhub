# The Relational Model

**Module:** Relational Model · **Interview priority:** Core

## What Is It?

The **relational model** (E. F. Codd, 1970) represents all data as **relations** — tables of rows and columns — and all relationships between data as matching **values** in columns. A **relational database** is a collection of such tables, and SQL is the language used to define and query them.

## Why It Matters

- Every SQL concept — keys, joins, normalisation, constraints — is built on these definitions.
- Interviewers expect the formal vocabulary (relation, tuple, attribute, domain, degree, cardinality) and the differences between the theory and what SQL actually does (duplicates, `NULL`, column order).

## Core Concept

### Vocabulary

| Formal term | SQL / everyday term | In the sample `employees` table |
|-------------|---------------------|----------------------------------|
| Relation | Table | `employees` |
| Tuple | Row, record | `(2, 'Ravi', 'ravi@corp.com', 10, 1, 95000, NULL, '2017-06-15')` |
| Attribute | Column, field | `salary` |
| Domain | Set of allowed values for an attribute (type + rules) | positive integers for `salary` |
| Degree (arity) | Number of columns | 8 |
| Cardinality | Number of rows | 12 |
| Relation schema | Table definition | `employees(emp_id, name, email, dept_id, manager_id, salary, commission, hire_date)` |
| Relation instance | Current rows | the 12 rows today |

```text
                attributes (columns)  →  degree = 4
             +--------+-------+---------+--------+
 relation →  | emp_id | name  | dept_id | salary |
 schema      +--------+-------+---------+--------+
             |      1 | Asha  |      10 | 150000 |  ← tuple (row)
             |      2 | Ravi  |      10 |  95000 |  ← tuple
             |     11 | Nisha |    NULL |  45000 |  ← tuple
             +--------+-------+---------+--------+
                                    cardinality = number of rows
```

> [!WARNING]
> "Cardinality" has two meanings. **Cardinality of a relation** = number of rows. **Cardinality of a relationship** (ER modelling) = one-to-one, one-to-many, many-to-many. Index **cardinality** = number of distinct values in a column. Say which one you mean.

### Domains

A **domain** is the set of values an attribute may take. A column's data type is the basic domain (`integer`, `date`); constraints narrow it (`salary > 0`, `status IN (…)`).

PostgreSQL can name a domain with `CREATE DOMAIN` and reuse it across tables — a type plus constraints:

```sql
CREATE DOMAIN positive_money AS numeric(12,2) CHECK (VALUE > 0);
CREATE DOMAIN email_address AS text CHECK (VALUE LIKE '%_@_%');
```

### Properties of a relation (theory)

1. **Every value is atomic** — one value per cell (first normal form).
2. **No duplicate tuples** — a relation is a *set*.
3. **Order of tuples does not matter** — there is no "first row".
4. **Order of attributes does not matter** — columns are identified by name.
5. **Each attribute has a distinct name** and draws values from one domain.

### Where SQL differs from pure theory

| Theory | SQL / PostgreSQL |
|--------|------------------|
| No duplicate tuples | Tables may contain duplicate rows unless a key or `UNIQUE` constraint prevents it; `SELECT` returns a *bag* (multiset) unless `DISTINCT` is used |
| No row order | True: without `ORDER BY`, result order is not guaranteed — even if it looks stable |
| No column order | Columns have a position (`SELECT *`, `INSERT … VALUES` without a column list depend on it) |
| Two-valued logic | SQL adds `NULL` and three-valued logic — see [NULL and Three-Valued Logic](../../null-and-conditional-logic/null-and-three-valued-logic/content.md) |

### Relationships are values, not pointers

`employees.dept_id = 10` links Ravi to Engineering because `departments.dept_id` also holds `10`. There is no stored pointer; the join is computed from matching values. That is why any relationship can be queried, including unplanned ones (for example, "employees and customers in the same city").

### Relational algebra in one table

SQL is based on relational algebra — operations that take relations and return relations:

| Operation | Symbol | Meaning | SQL |
|-----------|--------|---------|-----|
| Selection | σ | Keep rows matching a condition | `WHERE` |
| Projection | π | Keep certain columns | `SELECT col1, col2` (with `DISTINCT` for a true set) |
| Union | ∪ | Rows in either relation | `UNION` |
| Difference | − | Rows in the first, not the second | `EXCEPT` |
| Intersection | ∩ | Rows in both | `INTERSECT` |
| Cartesian product | × | Every pairing | `CROSS JOIN` |
| Join | ⋈ | Product filtered by a condition | `JOIN … ON` |
| Rename | ρ | Rename relation/attributes | `AS` |

Because each operation returns a relation, operations compose — the basis of subqueries and views.

## Examples

### Degree and cardinality of a table

```sql
SELECT count(*) AS cardinality FROM employees;
```

**Output:**

```text
 cardinality
-------------
          12
(1 row)
```

```sql
SELECT count(*) AS degree
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'employees';
```

**Output:**

```text
 degree
--------
      8
(1 row)
```

### A table without a key allows duplicate rows

```sql
CREATE TABLE visits (city text, visit_date date);
INSERT INTO visits VALUES ('Chennai', '2026-03-01'), ('Chennai', '2026-03-01');
SELECT * FROM visits;
```

**Output:**

```text
  city   | visit_date
---------+------------
 Chennai | 2026-03-01
 Chennai | 2026-03-01
(2 rows)
```

A true relation could not contain the same tuple twice. Add a primary key or `UNIQUE (city, visit_date)` to restore set semantics.

### A domain reused across tables

```sql
-- positive_money was created in the Domains section above
CREATE TABLE invoices (invoice_id integer PRIMARY KEY, amount positive_money NOT NULL);
CREATE TABLE refunds  (refund_id  integer PRIMARY KEY, amount positive_money NOT NULL);

INSERT INTO invoices VALUES (1, 250.00);
INSERT INTO refunds  VALUES (1, -10.00);
```

**Output:**

```text
ERROR:  value for domain positive_money violates check constraint "positive_money_check"
```

### Selection and projection

```sql
SELECT DISTINCT dept_id      -- projection (π dept_id) with set semantics
FROM employees
WHERE salary > 80000         -- selection (σ salary > 80000)
ORDER BY dept_id;
```

**Output:**

```text
 dept_id
---------
      10
      20
      40
(3 rows)
```

## Common Mistakes

- Assuming rows come back in insertion order. Without `ORDER BY` the order is unspecified.
- Saying SQL tables are sets. They are bags unless a key or `DISTINCT` removes duplicates.
- Confusing relation cardinality (row count), relationship cardinality (1:N) and index/column cardinality (distinct values).
- Relying on column position (`INSERT INTO t VALUES (…)` without a column list) — adding a column later breaks it.

## Revision

- Relation = table, tuple = row/record, attribute = column, domain = allowed values, degree = columns, cardinality = rows.
- Relations: atomic values, no duplicates, no row or column order, unique attribute names.
- SQL differs: duplicates allowed (bags), column positions exist, `NULL` adds a third truth value.
- Relationships are stored as matching values (foreign keys), not pointers.
- Relational algebra: σ (WHERE), π (SELECT list), ∪, −, ∩, ×, ⋈, ρ.
- PostgreSQL `CREATE DOMAIN` = reusable type + constraints.

## Quick Revision

Relation/tuple/attribute = table/row/column; degree = columns, cardinality = rows; domain = allowed values. SQL tables are bags with `NULL`s, not pure sets — use keys and `ORDER BY`.
