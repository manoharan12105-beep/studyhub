# Data Models, Schema and Instance — Practice

### P1. Schema or instance?

**Difficulty:** Easy · **Type:** MCQ

Which change modifies the **schema** rather than the instance?

- A) `INSERT INTO departments VALUES (60, 'Legal', 'Delhi');`
- B) `UPDATE employees SET salary = 99000 WHERE emp_id = 2;`
- C) `ALTER TABLE employees ADD COLUMN phone text;`
- D) `DELETE FROM orders WHERE order_id = 104;`

<details>
<summary>Answer</summary>

**Answer:** C) `ALTER TABLE employees ADD COLUMN phone text;`

**Explanation:** Adding a column changes the structure. The others change the stored data only.

</details>

### P2. Pick the data model

**Difficulty:** Easy · **Type:** Scenario

Match each workload with the most natural data model: (1) bank ledger with strict integrity, (2) "friends of friends who like this page", (3) user session tokens with expiry, (4) product catalogue where each category has very different attributes.

<details>
<summary>Answer</summary>

1. Relational — transactions, constraints, joins.
2. Graph — traversing relationships is the core operation.
3. Key-value — lookup by key, simple expiry.
4. Document — flexible attributes per record (in PostgreSQL, a `jsonb` column on a relational table also works well).

</details>

### P3. Hierarchical limitation

**Difficulty:** Medium · **Type:** Conceptual

In a hierarchical database, employees are children of departments. An employee starts working for two departments. What problem appears, and how does the relational model handle it?

<details>
<summary>Answer</summary>

Each record can have only one parent, so the employee must be duplicated under both departments — redundancy and possible inconsistency. The relational model uses a junction table `employee_departments(emp_id, dept_id)` with one row per assignment; the employee row is stored once.

</details>

### P4. Same name, two schemas

**Difficulty:** Medium · **Type:** Query · **Concepts:** PostgreSQL schemas

Create a schema `archive` with a table `orders(order_id integer, archived_on date)`. Then list every table named `orders` in the database with its schema.

**Expected output:**

```text
 table_schema | table_name
--------------+------------
 archive      | orders
 public       | orders
(2 rows)
```

<details>
<summary>Hint</summary>

Qualify the table name with the schema when creating it, and filter `information_schema.tables` by `table_name`.

</details>

<details>
<summary>Solution</summary>

```sql
CREATE SCHEMA archive;
CREATE TABLE archive.orders (order_id integer, archived_on date);

SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name = 'orders'
ORDER BY table_schema;
```

**Explanation:** A PostgreSQL schema is a namespace, so `archive.orders` and `public.orders` are different tables. An unqualified `orders` resolves through `search_path` (by default `"$user", public`), so it still means `public.orders`.

</details>

### P5. Identify the level

**Difficulty:** Medium · **Type:** Conceptual

For each change, say which level of the three-schema architecture it touches and whether applications must change: (1) adding a B-tree index on `orders(order_date)`, (2) adding a nullable column `phone` to `employees`, (3) creating a view that hides `salary` for the reception team.

<details>
<summary>Answer</summary>

1. Internal (physical) — no application change: physical data independence.
2. Conceptual — existing queries that name their columns keep working: logical data independence (a careless `SELECT *` consumer may notice).
3. External — a new user view on top of the unchanged conceptual schema.

</details>
