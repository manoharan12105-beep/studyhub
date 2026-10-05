# Temporary Tables — Practice

### P1. Who can see it?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** temp table scope

Session A runs `CREATE TEMP TABLE report (x int); INSERT INTO report VALUES (1);` without ending the session. Which is true?

- A) Session B can read the row after A commits.
- B) Session B can read the row only as a superuser.
- C) Session B cannot see A's `report` table at all.
- D) The table is dropped as soon as A's transaction commits.

<details>
<summary>Answer</summary>

**Answer:** C)

**Explanation:** A temp table is private to its session regardless of commits or privileges. With the default `ON COMMIT PRESERVE ROWS` it lasts until A disconnects.

</details>

### P2. Stage and validate an import

**Difficulty:** Medium · **Type:** Query · **Concepts:** temp table staging, validation queries

In one session: create a temp table `price_import (product_id int, new_price numeric)`, load the rows below, report rows that reference unknown products or have negative prices, then apply the valid ones to `products` and return the changed products.

Rows: (1, 52000), (2, 480), (9, 100), (3, -5).

**Expected output:**

```text
 product_id | new_price |     problem
------------+-----------+-----------------
          3 |        -5 | negative price
          9 |       100 | unknown product
(2 rows)

 product_id |  name  |  price
------------+--------+----------
          1 | Laptop | 52000.00
          2 | Mouse  |   480.00
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE TEMP TABLE price_import (product_id int, new_price numeric) ON COMMIT PRESERVE ROWS;
INSERT INTO price_import VALUES (1, 52000), (2, 480), (9, 100), (3, -5);

SELECT i.*, CASE WHEN p.product_id IS NULL THEN 'unknown product' ELSE 'negative price' END AS problem
FROM price_import i
LEFT JOIN products p ON p.product_id = i.product_id
WHERE p.product_id IS NULL OR i.new_price < 0
ORDER BY i.product_id;

UPDATE products p
SET price = i.new_price
FROM price_import i
WHERE p.product_id = i.product_id AND i.new_price >= 0
RETURNING p.product_id, p.name, p.price;
```

**Explanation:** The temp table holds the raw import for inspection and reuse by several statements, without creating a permanent object.

</details>

### P3. Which one is used?

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** shadowing

A data-fix script starts with `CREATE TEMP TABLE employees AS SELECT * FROM employees WHERE dept_id = 20;` and later runs `UPDATE employees SET salary = salary * 1.1;` expecting to raise everyone's salary. Show what actually happens in the real table.

```sql
CREATE TEMP TABLE employees AS SELECT * FROM employees WHERE dept_id = 20;
UPDATE employees SET salary = salary * 1.1;
SELECT count(*) AS temp_rows FROM employees;
SELECT name, salary FROM public.employees WHERE dept_id = 20 ORDER BY emp_id;
```

**Output:**

```text
 temp_rows
-----------
         4
(1 row)

 name  | salary
-------+--------
 Divya |  88000
 Arjun |  60000
 Sneha |  60000
 Rahul |  55000
(4 rows)
```

<details>
<summary>Answer</summary>

The `CREATE TEMP TABLE … AS SELECT … FROM employees` reads the real table (the temp table does not exist yet), but from then on `employees` means the temp copy. The `UPDATE` changed only the 4 temporary rows; `public.employees` is untouched. Use a distinct name such as `tmp_sales_employees`, and qualify permanent tables in scripts.

</details>
