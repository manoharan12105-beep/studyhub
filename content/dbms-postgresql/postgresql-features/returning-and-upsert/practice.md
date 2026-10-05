# RETURNING and Upsert — Practice

### P1. Insert and return

**Difficulty:** Easy · **Type:** Query · **Concepts:** RETURNING

Insert a new customer (id 7, `Gita`, `Kochi`, `gita@mail.com`) and return the id and name in the same statement.

**Expected output:**

```text
 customer_id | name
-------------+------
           7 | Gita
(1 row)
```

<details>
<summary>Solution</summary>

```sql
INSERT INTO customers (customer_id, name, city, email)
VALUES (7, 'Gita', 'Kochi', 'gita@mail.com')
RETURNING customer_id, name;
```

</details>

### P2. What does RETURNING give?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ON CONFLICT DO NOTHING, RETURNING

`customers` already has `customer_id = 1`. What does this return?

```sql
-- Illustrative
INSERT INTO customers (customer_id, name) VALUES (1, 'Anil'), (8, 'Hari')
ON CONFLICT (customer_id) DO NOTHING
RETURNING customer_id;
```

- A) 1 and 8
- B) Only 8
- C) Only 1
- D) An error for the duplicate key

<details>
<summary>Answer</summary>

**Answer:** B) Only 8

**Explanation:** Row 1 is skipped by `DO NOTHING`, and skipped rows are not returned. There is no error.

</details>

### P3. Stock upsert

**Difficulty:** Medium · **Type:** Query · **Concepts:** ON CONFLICT DO UPDATE, EXCLUDED

A table `stock (product_id int PRIMARY KEY, qty int NOT NULL)` holds quantities. Product 2 has 40 units. Receive a delivery of 10 units of product 2 and 5 units of product 4 in one statement, adding to existing stock, and return the resulting rows.

**Schema and data:**

```sql
CREATE TABLE stock (product_id int PRIMARY KEY, qty int NOT NULL);
INSERT INTO stock VALUES (2, 40);
```

**Expected output:**

```text
 product_id | qty
------------+-----
          2 |  50
          4 |   5
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
INSERT INTO stock (product_id, qty) VALUES (2, 10), (4, 5)
ON CONFLICT (product_id) DO UPDATE SET qty = stock.qty + EXCLUDED.qty
RETURNING product_id, qty;
```

</details>

### P4. Raise and report

**Difficulty:** Medium · **Type:** Query · **Concepts:** UPDATE RETURNING old/new (PostgreSQL 18)

Give Finance employees a 7% raise (rounded to whole rupees) and return each name with the old salary, new salary and increase.

**Expected output:**

```text
  name  | old_salary | new_salary | increase
--------+------------+------------+----------
 Farhan |      82000 |      87740 |     5740
(1 row)
```

<details>
<summary>Solution</summary>

```sql
UPDATE employees
SET salary = round(salary * 1.07)
WHERE dept_id = 40
RETURNING name, old.salary AS old_salary, new.salary AS new_salary,
          new.salary - old.salary AS increase;
```

**Explanation:** On PostgreSQL 17, return `salary` (the new value) and compute the old one in a CTE that reads the table before the update.

</details>

### P5. Fix the batch upsert

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** duplicate keys in one statement, DISTINCT ON

A nightly job loads email preferences from a staging table, which can contain several rows per email (the latest `changed_at` wins). The upsert fails.

**Schema and data:**

```sql
CREATE TABLE prefs (email text PRIMARY KEY, newsletter boolean NOT NULL);
CREATE TABLE prefs_staging (email text, newsletter boolean, changed_at timestamp);
INSERT INTO prefs VALUES ('anil@mail.com', true);
INSERT INTO prefs_staging VALUES
    ('anil@mail.com',  false, '2026-03-01 10:00'),
    ('anil@mail.com',  true,  '2026-03-02 09:00'),
    ('meera@mail.com', true,  '2026-03-01 12:00');
```

```sql
INSERT INTO prefs (email, newsletter)
SELECT email, newsletter FROM prefs_staging
ON CONFLICT (email) DO UPDATE SET newsletter = EXCLUDED.newsletter;
```

**Output:**

```text
ERROR:  ON CONFLICT DO UPDATE command cannot affect row a second time
HINT:  Ensure that no rows proposed for insertion within the same command have duplicate constrained values.
```

<details>
<summary>Hint</summary>

Reduce the staging rows to one per email before inserting.

</details>

<details>
<summary>Answer</summary>

Anil appears twice in the input, so the statement would update his row twice. Keep only the latest row per email with `DISTINCT ON`:

```sql
INSERT INTO prefs (email, newsletter)
SELECT DISTINCT ON (email) email, newsletter
FROM prefs_staging
ORDER BY email, changed_at DESC
ON CONFLICT (email) DO UPDATE SET newsletter = EXCLUDED.newsletter
RETURNING email, newsletter;
```

**Output:**

```text
     email      | newsletter
----------------+------------
 anil@mail.com  | t
 meera@mail.com | t
(2 rows)
```

</details>
