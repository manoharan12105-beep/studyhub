# Last-Minute SQL Revision

The query patterns to have at your fingertips just before a SQL round. Each one runs on the **sample database**.

## Second-Highest Salary

```sql
SELECT max(salary) AS second_highest
FROM employees
WHERE salary < (SELECT max(salary) FROM employees);
```

## Nth Highest (here 3rd)

```sql
SELECT (SELECT DISTINCT salary FROM employees ORDER BY salary DESC OFFSET 2 LIMIT 1) AS third_highest;
```

## Top 2 Per Group

```sql
SELECT dept_id, name, salary
FROM (SELECT e.*, dense_rank() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS r
      FROM employees e) t
WHERE r <= 2 AND dept_id IS NOT NULL
ORDER BY dept_id, salary DESC, name;
```

## Duplicates

```sql
SELECT city, count(*) AS customers
FROM customers
WHERE city IS NOT NULL
GROUP BY city
HAVING count(*) > 1;
```

```sql
-- Illustrative: delete duplicates, keep the lowest id
DELETE FROM t a USING t b WHERE a.key = b.key AND a.id > b.id;
```

## No Matching Rows (Anti-Join)

```sql
SELECT c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);
```

## Above Group Average

```sql
SELECT name, dept_id, salary
FROM (SELECT e.*, avg(salary) OVER (PARTITION BY dept_id) AS dept_avg FROM employees e) t
WHERE salary > dept_avg
ORDER BY dept_id;
```

## Running Total and Month-over-Month

```sql
SELECT date_trunc('month', order_date)::date AS month,
       count(*) AS orders,
       sum(count(*)) OVER (ORDER BY date_trunc('month', order_date)::date) AS running_orders,
       count(*) - lag(count(*)) OVER (ORDER BY date_trunc('month', order_date)::date) AS change
FROM orders
GROUP BY 1
ORDER BY 1;
```

## Latest Row Per Group

```sql
SELECT DISTINCT ON (customer_id) customer_id, order_id, order_date
FROM orders
ORDER BY customer_id, order_date DESC, order_id DESC;
```

## Consecutive Days (Islands)

```sql
-- Illustrative
SELECT user_id, min(day) AS start_day, max(day) AS end_day, count(*) AS streak
FROM (SELECT user_id, day, day - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day)::int AS grp
      FROM (SELECT DISTINCT user_id, login_at::date AS day FROM logins) d) t
GROUP BY user_id, grp;
```

## Ordered Every Item (Division)

```sql
SELECT o.customer_id
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p ON p.product_id = oi.product_id
WHERE p.category = 'Furniture'
GROUP BY o.customer_id
HAVING count(DISTINCT p.product_id) = (SELECT count(*) FROM products WHERE category = 'Furniture');
```

## Hierarchy

```sql
WITH RECURSIVE reports AS (
    SELECT emp_id, name, 1 AS depth FROM employees WHERE manager_id = 1
    UNION ALL
    SELECT e.emp_id, e.name, r.depth + 1 FROM employees e JOIN reports r ON e.manager_id = r.emp_id
)
SELECT depth, count(*) FROM reports GROUP BY depth ORDER BY depth;
```

## Pivot

```sql
SELECT count(*) FILTER (WHERE status = 'DELIVERED') AS delivered,
       count(*) FILTER (WHERE status = 'CANCELLED') AS cancelled,
       count(*) AS total
FROM orders;
```

## Upsert

```sql
-- Illustrative
INSERT INTO stock (product_id, qty) VALUES (1, 5)
ON CONFLICT (product_id) DO UPDATE SET qty = stock.qty + EXCLUDED.qty;
```

## Final Checks Before Answering

- What is one output row? Which `NULL`s, ties and empty groups matter?
- Outer-join filters in `ON`; aggregates in `HAVING`; windows filtered outside.
- `ORDER BY` with a tiebreaker on anything you `LIMIT`.
