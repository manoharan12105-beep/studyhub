# IN, EXISTS, ANY and ALL — Interview Questions

## Beginner

### Q1. What is the difference between IN and EXISTS?

<details>
<summary>Answer</summary>

`IN` tests whether a value is in the list of values a subquery returns; `EXISTS` tests whether a (usually correlated) subquery returns any row at all. `EXISTS` is only ever TRUE or FALSE and ignores the select list; `IN` can be UNKNOWN when the list contains NULLs and nothing matches. Neither duplicates outer rows. For positive checks they return the same result, and PostgreSQL usually turns both into the same semi-join plan.

</details>

### Q2. Does it matter whether you write `SELECT 1` or `SELECT *` inside EXISTS?

<details>
<summary>Answer</summary>

No. `EXISTS` only checks whether a row is produced; the select list is never evaluated for output. `SELECT 1` is a readability convention.

</details>

### Q3. What do `> ANY` and `> ALL` mean?

<details>
<summary>Answer</summary>

`x > ANY (s)` is TRUE if `x` is greater than at least one value in `s` (≈ greater than the minimum). `x > ALL (s)` is TRUE if `x` is greater than every value (≈ greater than the maximum). `SOME` is a synonym for `ANY`; `= ANY` is the same as `IN`; `<> ALL` is the same as `NOT IN`.

</details>

## Intermediate

### Q4. NOT IN vs NOT EXISTS — which should you use and why?

<details>
<summary>Answer</summary>

`NOT EXISTS`. If the subquery of a `NOT IN` returns even one `NULL`, `x NOT IN (…)` is never TRUE (it is FALSE or UNKNOWN), so the query silently returns no rows. `NOT EXISTS` only checks for matching rows and is NULL-safe. It is also better for performance in PostgreSQL: `NOT EXISTS` becomes an anti-join, while `NOT IN` stays a hashed SubPlan, which degrades to a per-row scan when the subquery result does not fit in `work_mem`. `NOT IN` is fine with a literal list or a provably non-null column, but `NOT EXISTS` is the safe habit.

</details>

### Q5. Is EXISTS faster than IN?

<details>
<summary>Answer</summary>

Not in PostgreSQL as a rule. Both are pulled up into semi-joins, and for equivalent queries the planner usually produces the identical plan (hash, merge or nested-loop semi-join chosen by cost). The "EXISTS for large subqueries, IN for small ones" advice came from older optimizers. The real performance difference is in the negative forms: `NOT EXISTS` (anti-join) vs `NOT IN` (SubPlan). Verify with `EXPLAIN`.

</details>

### Q6. What does `salary > ALL (SELECT salary FROM employees WHERE dept_id = 50)` return if department 50 has no employees?

<details>
<summary>Answer</summary>

Every employee: `ALL` over an empty set is vacuously TRUE. By contrast, `salary > (SELECT max(salary) … WHERE dept_id = 50)` returns nobody, because `max` over no rows is `NULL` and the comparison is UNKNOWN. `ANY` over an empty set is FALSE.

</details>

### Q7. What does `x <> ANY (subquery)` mean? Is it the same as NOT IN?

<details>
<summary>Answer</summary>

No. It is TRUE when `x` differs from at least one value — which is true whenever the subquery has two different values. "Not in the list" is `x <> ALL (subquery)`, which is exactly `NOT IN`.

</details>

### Q8. Rewrite "customers with no orders" in three ways.

<details>
<summary>Answer</summary>

```sql
-- Illustrative
SELECT c.* FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);

SELECT c.* FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL;            -- test a NOT NULL column of orders

SELECT c.* FROM customers c
WHERE c.customer_id NOT IN (SELECT o.customer_id FROM orders o
                            WHERE o.customer_id IS NOT NULL);
```

The first two become anti-joins; the third is correct only because of the `IS NOT NULL` filter and is planned as a SubPlan.

</details>

## Advanced

### Q9. Why can't PostgreSQL turn NOT IN into an anti-join the way it does NOT EXISTS?

<details>
<summary>Answer</summary>

Because the semantics differ when NULLs are present. An anti-join returns outer rows with no matching inner row; `NOT IN` must return UNKNOWN (so: drop the row) when the inner list contains a `NULL` or the outer value is `NULL`. The planner would have to prove both sides non-nullable to rewrite it, and PostgreSQL (as of 18) does not perform that rewrite, so `NOT IN` is executed as a SubPlan — hashed if the result fits in `work_mem`, otherwise re-scanned per outer row.

</details>

### Q10. How do you pass a variable-length list of ids from Java to a PostgreSQL query?

<details>
<summary>Answer</summary>

Use one array parameter with `= ANY`:

```java
// Illustrative fragment
PreparedStatement ps = connection.prepareStatement(
        "SELECT * FROM orders WHERE order_id = ANY (?)");
ps.setArray(1, connection.createArrayOf("integer", new Integer[] {101, 104, 108}));
```

The SQL text stays the same for any list length (one prepared statement, no string concatenation, no SQL injection), unlike building `IN (?, ?, ?)` with a varying number of placeholders.

</details>
