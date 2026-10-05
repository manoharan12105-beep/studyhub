# Set Operations — Interview Questions

## Beginner

### Q1. What is the difference between UNION and UNION ALL?

<details>
<summary>Answer</summary>

`UNION` returns the combined rows with duplicates removed; `UNION ALL` returns all rows, including duplicates. `UNION` costs an extra hash or sort over the whole result to find duplicates, so `UNION ALL` is faster. Use `UNION ALL` when the branches cannot overlap or duplicates are meaningful; `UNION` only when you need distinct rows.

</details>

### Q2. What are the rules for combining queries with UNION?

<details>
<summary>Answer</summary>

Same number of columns; columns matched by position with compatible types; result column names come from the first query; `ORDER BY`/`LIMIT` at the end apply to the whole combined result (use parentheses for per-branch ordering).

</details>

### Q3. What do INTERSECT and EXCEPT do?

<details>
<summary>Answer</summary>

`INTERSECT` returns rows present in both results; `EXCEPT` returns rows of the first result that are not in the second (Oracle calls it `MINUS`). Both remove duplicates unless `ALL` is added.

</details>

## Intermediate

### Q4. What is the difference between a UNION and a JOIN?

<details>
<summary>Answer</summary>

A union stacks rows of two results with the same shape (vertical combination); a join places columns of related rows side by side (horizontal combination) based on a condition. Union: "employees and customers in one contact list". Join: "each employee with their department name".

</details>

### Q5. How are NULLs handled by UNION, INTERSECT and EXCEPT?

<details>
<summary>Answer</summary>

As equal: two rows that differ only in having `NULL` in the same column are duplicates, and `INTERSECT` matches a `NULL` with a `NULL`. This is the "not distinct" comparison, like `DISTINCT` and `GROUP BY` — unlike `=` in joins and `WHERE`, where `NULL = NULL` is UNKNOWN.

</details>

### Q6. EXCEPT vs NOT EXISTS — which would you use to find customers without orders?

<details>
<summary>Answer</summary>

`SELECT customer_id FROM customers EXCEPT SELECT customer_id FROM orders` gives only ids (all compared columns must match), removes duplicates and treats `NULL`s as equal. `NOT EXISTS` can return any columns of the customer, can compare on a condition, and becomes an anti-join in PostgreSQL. For "rows of A with no match in B", `NOT EXISTS` is usually the better tool; `EXCEPT` is good for comparing whole rows of two similar datasets.

</details>

### Q7. What is the precedence of set operators?

<details>
<summary>Answer</summary>

`INTERSECT` binds more tightly than `UNION` and `EXCEPT`; `UNION` and `EXCEPT` have equal precedence and are evaluated left to right. So `A UNION B INTERSECT C` means `A UNION (B INTERSECT C)`. Use parentheses for clarity.

</details>

## Advanced

### Q8. How would you find the differences between two versions of a table?

<details>
<summary>Answer</summary>

Use `EXCEPT` in both directions and label the sides:

```sql
-- Illustrative
(SELECT 'only in a' AS side, * FROM (SELECT * FROM a EXCEPT SELECT * FROM b) x)
UNION ALL
(SELECT 'only in b', * FROM (SELECT * FROM b EXCEPT SELECT * FROM a) y);
```

Changed rows appear on both sides, missing rows on one. Because set operations treat `NULL`s as equal, unchanged rows containing `NULL`s are correctly not reported — a join on all columns would report them. For duplicates to count, use `EXCEPT ALL`.

</details>

### Q9. What do INTERSECT ALL and EXCEPT ALL return?

<details>
<summary>Answer</summary>

They work with counts: if a row appears m times on the left and n times on the right, `INTERSECT ALL` returns it min(m, n) times and `EXCEPT ALL` returns it max(m − n, 0) times. Useful for reconciling lists where quantities matter (e.g. two lists of scanned items).

</details>

### Q10. A UNION of two large disjoint tables is slow. What do you check?

<details>
<summary>Answer</summary>

`EXPLAIN` will show a `HashAggregate` (or `Sort` + `Unique`) over all appended rows — the duplicate removal. If the branches are disjoint (different partitions, a distinguishing literal column, mutually exclusive filters), switch to `UNION ALL`, which is a plain `Append` and can stream rows (and run branches in parallel with Parallel Append).

</details>
