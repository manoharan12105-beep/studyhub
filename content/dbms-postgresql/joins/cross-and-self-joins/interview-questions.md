# CROSS JOIN and SELF JOIN — Interview Questions

## Beginner

### Q1. What is a CROSS JOIN?

<details>
<summary>Answer</summary>

A join without a condition that returns the Cartesian product: every row of the first table combined with every row of the second, so m × n rows. Example: 3 sizes × 2 colours = 6 product variants.

</details>

### Q2. What is a self join? Give an example.

<details>
<summary>Answer</summary>

Joining a table to itself using two aliases so rows can be related to other rows of the same table. Example: `SELECT e.name, m.name FROM employees e LEFT JOIN employees m ON m.emp_id = e.manager_id` lists each employee with their manager.

</details>

### Q3. Is there a SELF JOIN keyword?

<details>
<summary>Answer</summary>

No. A self join is an ordinary `JOIN` (inner, left, …) where both sides are the same table with different aliases.

</details>

## Intermediate

### Q4. How do you list each pair of customers from the same city only once?

<details>
<summary>Answer</summary>

`SELECT a.name, b.name FROM customers a JOIN customers b ON a.city = b.city AND a.customer_id < b.customer_id;` The `<` removes self-pairs and mirrored duplicates; `<>` would return each pair twice.

</details>

### Q5. Why did my query return millions of rows from two small-ish tables?

<details>
<summary>Answer</summary>

Probably a missing or wrong join condition, producing a Cartesian product — common with the comma syntax (`FROM a, b` without a matching `WHERE`) or a join on a non-selective column. Use explicit `JOIN … ON` and check the condition uses the right keys.

</details>

### Q6. Find employees who earn more than their manager.

<details>
<summary>Answer</summary>

```sql
SELECT e.name, e.salary, m.name AS manager, m.salary AS manager_salary
FROM employees e
JOIN employees m ON m.emp_id = e.manager_id
WHERE e.salary > m.salary;
```

An inner join is right here: employees without a manager cannot satisfy the comparison anyway.

</details>

### Q7. When is a CROSS JOIN actually useful?

<details>
<summary>Answer</summary>

Generating combinations (variants, test data), building complete report grids (every product × every month, every store × every day) that real data is then left-joined onto so gaps show as zero, and attaching a single-row value (a total or a parameter row) to every row.

</details>

## Advanced

### Q8. Can a self join find all levels of a hierarchy?

<details>
<summary>Answer</summary>

Only a fixed number: each join adds one level (employee → manager → manager's manager needs two joins). For unknown depth use a recursive CTE (`WITH RECURSIVE`), which repeats the join until no new rows appear.

</details>

### Q9. What is a non-equi join?

<details>
<summary>Answer</summary>

A join whose condition is not plain equality — ranges (`salary BETWEEN g.min AND g.max`), inequalities (`b.price > a.price`) or overlaps (`a.start < b.end AND b.start < a.end`). Hash and merge joins need equality, so PostgreSQL executes non-equi joins as nested loops (possibly with an index), which can be expensive on large inputs; range types with GiST indexes or window functions can be better alternatives.

</details>
