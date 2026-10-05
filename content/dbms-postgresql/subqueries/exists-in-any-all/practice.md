# IN, EXISTS, ANY and ALL — Practice

### P1. Departments with a high earner

**Difficulty:** Easy · **Type:** Query · **Concepts:** EXISTS

List departments that have at least one employee earning more than 80000. Order by `dept_id`.

**Expected output:**

```text
 dept_id |  dept_name
---------+-------------
      10 | Engineering
      20 | Sales
      40 | Finance
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT d.dept_id, d.dept_name
FROM departments d
WHERE EXISTS (SELECT 1 FROM employees e
              WHERE e.dept_id = d.dept_id AND e.salary > 80000)
ORDER BY d.dept_id;
```

**Explanation:** Engineering has three such employees but appears once — `EXISTS` is a semi-join.

</details>

### P2. Predict the result

**Difficulty:** Easy · **Type:** Output · **Concepts:** NOT IN, NULL

What does this return?

```sql
-- Illustrative
SELECT name FROM customers
WHERE city NOT IN (SELECT city FROM customers WHERE customer_id IN (1, 5));
```

- A) Bhavna, Chirag, Fatima
- B) Bhavna, Chirag, Eshan, Fatima
- C) No rows
- D) An error

<details>
<summary>Answer</summary>

**Answer:** C) No rows

**Explanation:** The subquery returns `'Chennai'` (Anil) and `NULL` (Eshan). For every outer city, `city NOT IN ('Chennai', NULL)` is FALSE or UNKNOWN, never TRUE.

</details>

### P3. Products never sold

**Difficulty:** Easy · **Type:** Query · **Concepts:** NOT EXISTS

List products that have never been ordered, using `NOT EXISTS`.

**Expected output:**

```text
 product_id |   name
------------+----------
          6 | Notebook
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT p.product_id, p.name
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.product_id);
```

</details>

### P4. Cheaper than every electronic item

**Difficulty:** Medium · **Type:** Query · **Concepts:** ALL

List products (outside Electronics) cheaper than every Electronics product. Order by price.

**Expected output:**

```text
   name   |  category  | price
----------+------------+-------
 Notebook | Stationery | 50.00
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, category, price
FROM products
WHERE price < ALL (SELECT price FROM products WHERE category = 'Electronics')
ORDER BY price;
```

**Explanation:** The cheapest Electronics product is the Mouse at 500, so `< ALL` means `< 500`. Electronics products themselves cannot qualify because none is cheaper than itself.

</details>

### P5. Customers who ordered both categories

**Difficulty:** Medium · **Type:** Query · **Concepts:** two EXISTS

List customers who have bought at least one Electronics product **and** at least one Furniture product (in any orders). Order by name.

**Expected output:**

```text
  name
--------
 Anil
 Bhavna
 Deepa
(3 rows)
```

<details>
<summary>Hint</summary>

Write one `EXISTS` per category, combined with `AND`. Each joins `orders`, `order_items` and `products`.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT c.name
FROM customers c
WHERE EXISTS (SELECT 1
              FROM orders o
              JOIN order_items oi ON oi.order_id = o.order_id
              JOIN products p     ON p.product_id = oi.product_id
              WHERE o.customer_id = c.customer_id AND p.category = 'Electronics')
  AND EXISTS (SELECT 1
              FROM orders o
              JOIN order_items oi ON oi.order_id = o.order_id
              JOIN products p     ON p.product_id = oi.product_id
              WHERE o.customer_id = c.customer_id AND p.category = 'Furniture')
ORDER BY c.name;
```

**Alternative:** group by customer and `HAVING count(DISTINCT p.category) FILTER (WHERE p.category IN ('Electronics', 'Furniture')) = 2`.

</details>

### P6. Where did Nisha go?

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** NOT IN, NOT EXISTS, NULL outer value

"Employees with no commission-earning colleague in their department" (Nisha, who has no department, should count as such):

```sql
SELECT name
FROM employees
WHERE dept_id NOT IN (SELECT dept_id FROM employees WHERE commission > 0)
ORDER BY emp_id;
```

**Output:**

```text
  name
--------
 Asha
 Ravi
 Meena
 Karan
 Vikram
 Pooja
 Farhan
(7 rows)
```

The subquery contains no `NULL` (it returns 20, 20 for Divya and Arjun). Why is Nisha missing, and how do you fix it?

<details>
<summary>Answer</summary>

This time the `NULL` is on the **outer** side: for Nisha the test is `NULL NOT IN (20, 20)`, which is UNKNOWN, so she is filtered out. `NOT EXISTS` never compares the outer value with the list as a whole — her correlated subquery simply finds no rows:

```sql
SELECT e.name
FROM employees e
WHERE NOT EXISTS (SELECT 1 FROM employees c
                  WHERE c.dept_id = e.dept_id AND c.commission > 0)
ORDER BY e.emp_id;
```

**Output:**

```text
  name
--------
 Asha
 Ravi
 Meena
 Karan
 Vikram
 Pooja
 Farhan
 Nisha
(8 rows)
```

</details>

### P7. Same result or not?

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** ALL vs max, empty sets

Do these two queries always return the same rows? If not, give a case where they differ.

```sql
-- Illustrative
-- Query A
SELECT * FROM employees WHERE salary > ALL (SELECT salary FROM employees WHERE dept_id = :d);
-- Query B
SELECT * FROM employees WHERE salary > (SELECT max(salary) FROM employees WHERE dept_id = :d);
```

<details>
<summary>Answer</summary>

No. They differ when the subquery is empty: for a department with no employees (Research, dept 50), A returns every employee (`ALL` of nothing is TRUE) and B returns none (`max` of nothing is `NULL`). They would also differ if `salary` were nullable and the department contained a `NULL` salary: `max` ignores it, while `ALL` becomes UNKNOWN for everyone. When the subquery is non-empty and has no NULLs, they agree.

</details>
