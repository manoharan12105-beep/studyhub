# Relational Division and Hierarchy Problems — Interview Questions

## Beginner

### Q1. How do you find customers who bought every product?

<details>
<summary>Answer</summary>

Count distinct products per customer and compare with the total:

```sql
-- Illustrative
SELECT o.customer_id
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY o.customer_id
HAVING count(DISTINCT oi.product_id) = (SELECT count(*) FROM products);
```

`DISTINCT` is needed because the same product can appear in several orders. This is called **relational division**.

</details>

### Q2. How do you list each employee with their manager's name?

<details>
<summary>Answer</summary>

A self-join; use `LEFT JOIN` so the top manager (no manager) is kept:

```sql
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.emp_id = e.manager_id
WHERE e.emp_id IN (1, 2, 9)
ORDER BY e.emp_id;
```

**Output:**

```text
 employee | manager
----------+---------
 Asha     | NULL
 Ravi     | Asha
 Pooja    | Vikram
(3 rows)
```

One level of hierarchy needs only a self-join; arbitrary depth needs a recursive CTE.

</details>

## Intermediate

### Q3. Write relational division without `GROUP BY`.

<details>
<summary>Answer</summary>

Double negation — "there is no product the customer has not bought":

```sql
-- Illustrative
SELECT c.customer_id
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM products p
    WHERE NOT EXISTS (
        SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
        WHERE o.customer_id = c.customer_id AND oi.product_id = p.product_id));
```

It is unaffected by duplicate purchases, and returns every customer when the product set is empty (the counting version returns none).

</details>

### Q4. Find all employees under a given manager, at any depth.

<details>
<summary>Answer</summary>

```sql
WITH RECURSIVE reports AS (
    SELECT emp_id, name FROM employees WHERE manager_id = 5
    UNION ALL
    SELECT e.emp_id, e.name FROM employees e JOIN reports r ON e.manager_id = r.emp_id
)
SELECT * FROM reports ORDER BY emp_id;
```

**Output:**

```text
 emp_id | name
--------+-------
      6 | Arjun
      7 | Sneha
     12 | Rahul
(3 rows)
```

The anchor is the direct reports; each iteration adds the next level, until an iteration adds no rows.

</details>

### Q5. How do you show the path from the root to every node of a tree?

<details>
<summary>Answer</summary>

Carry the path in the recursive CTE: start with `name::text` (or `ARRAY[id]`) at the root, and append the child in the recursive part: `t.path || ' > ' || c.name`. Ordering by an array of ids keeps every subtree under its parent. The cast to `text` in the anchor matters: the column type is fixed by the anchor, and the recursive part must produce the same type.

</details>

### Q6. Customers who bought exactly the Furniture products and nothing else?

<details>
<summary>Answer</summary>

Count all distinct products per customer and require both conditions:

```sql
-- Illustrative
SELECT o.customer_id
FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p ON p.product_id = oi.product_id
GROUP BY o.customer_id
HAVING count(DISTINCT p.product_id) FILTER (WHERE p.category = 'Furniture')
         = (SELECT count(*) FROM products WHERE category = 'Furniture')
   AND count(DISTINCT p.product_id) FILTER (WHERE p.category <> 'Furniture') = 0;
```

This is **exact division**: "all of the set" plus "nothing outside the set".

</details>

## Advanced

### Q7. How do you protect a recursive query from cycles in the data?

<details>
<summary>Answer</summary>

PostgreSQL 14+ has the SQL-standard `CYCLE` clause: `… ) CYCLE id SET is_cycle USING path`. It tracks visited ids and stops a branch when an id repeats. Before 14, carry an array and add `WHERE NOT c.id = ANY(t.path)` to the recursive part. `UNION` (instead of `UNION ALL`) also stops on exact duplicate rows, but only if the rows are identical, which is not the case when they carry a level or path. Also prevent cycles at write time with a trigger or application validation.

</details>

### Q8. Compare adjacency list, materialised path and closure table for storing hierarchies.

<details>
<summary>Answer</summary>

- **Adjacency list** (`parent_id`): trivial inserts and moves; subtree and ancestor queries need recursive CTEs. It is the default and fine for most sizes.
- **Materialised path** (`ltree`, `'1.2.5'`): subtree = prefix match (indexable with GiST); moving a subtree rewrites every descendant's path.
- **Closure table** (ancestor, descendant, depth): any subtree or ancestor query is a simple join; inserts add one row per ancestor, and moves are expensive; storage is O(n × depth).

Choose by read/write mix and depth. Many systems keep `parent_id` as the truth and maintain `ltree` or a closure table for fast reads.

</details>

### Q9. How do you compute the total salary of every manager's entire organisation in one query?

<details>
<summary>Answer</summary>

Start a recursive walk at every employee, tagging rows with the starting employee, then group by that tag:

```sql
-- Illustrative
WITH RECURSIVE sub AS (
    SELECT emp_id AS root, emp_id, salary FROM employees
    UNION ALL
    SELECT s.root, e.emp_id, e.salary FROM employees e JOIN sub s ON e.manager_id = s.emp_id
)
SELECT root, sum(salary) FROM sub GROUP BY root;
```

The work is proportional to the number of ancestor–descendant pairs. For very large, deep trees, precompute a closure table.

</details>
