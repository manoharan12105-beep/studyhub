# INNER, LEFT, RIGHT and FULL Joins — Interview Questions

## Beginner

### Q1. Explain INNER, LEFT, RIGHT and FULL joins.

<details>
<summary>Answer</summary>

INNER returns only rows that match on both sides. LEFT returns all rows of the left table plus matching right rows (NULLs when none). RIGHT does the same for the right table. FULL returns all rows of both tables, with NULLs where either side has no match. Example: employees and departments — INNER drops the employee without a department and the department without employees; LEFT keeps the employee; RIGHT keeps the department; FULL keeps both.

</details>

### Q2. What is the difference between JOIN and INNER JOIN?

<details>
<summary>Answer</summary>

None. `JOIN` defaults to `INNER JOIN`. Likewise `LEFT JOIN` = `LEFT OUTER JOIN`; `OUTER` is optional.

</details>

### Q3. Is `A LEFT JOIN B` the same as `B RIGHT JOIN A`?

<details>
<summary>Answer</summary>

Yes — the same rows, only the default column order in `SELECT *` differs. Teams usually stick to LEFT JOIN for readability.

</details>

## Intermediate

### Q4. Table A has 5 rows and table B has 4 rows. What are the minimum and maximum row counts of `A INNER JOIN B` and `A LEFT JOIN B`?

<details>
<summary>Answer</summary>

INNER: minimum 0 (no matches), maximum 20 (every row matches every row, e.g. all keys equal). LEFT: minimum 5 (each left row appears at least once), maximum 20. For completeness, FULL: minimum 5 (four A rows each match a different B row, the fifth A row is unmatched), maximum 20; with no matches at all it returns 5 + 4 = 9.

</details>

### Q5. Why do I get duplicate rows after a join?

<details>
<summary>Answer</summary>

The join key is not unique on at least one side, so each left row matches several right rows (fan-out) — for example joining customers to orders and also to addresses multiplies orders × addresses. Fix the join condition or the data model, aggregate one side before joining, or use `EXISTS` if you only need to filter. Adding `DISTINCT` hides the symptom and can still give wrong sums.

</details>

### Q6. How do you find rows in one table that have no match in another using a join?

<details>
<summary>Answer</summary>

Left anti-join: `SELECT c.* FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id WHERE o.order_id IS NULL;` Test a column of the right table that is never NULL in a real match (its primary key). `NOT EXISTS` is the equivalent subquery form.

</details>

### Q7. When would you use a FULL OUTER JOIN?

<details>
<summary>Answer</summary>

To compare or reconcile two datasets: payments from the bank vs payments recorded in the application, inventory in two warehouses, last month's vs this month's totals per product. Rows with NULLs on one side show what exists only on the other side.

</details>

### Q8. What happens to rows with NULL in the join column?

<details>
<summary>Answer</summary>

They never satisfy `a.k = b.k` (NULL compared with anything is UNKNOWN), so inner joins drop them and outer joins keep them only as unmatched rows padded with NULLs.

</details>

## Advanced

### Q9. Which join algorithms does PostgreSQL use, and when?

<details>
<summary>Answer</summary>

**Nested loop** — for each outer row, look up matches (ideally via an index); best when the outer side is small. **Hash join** — build a hash table on the smaller input, probe with the other; good for large unsorted equi-joins. **Merge join** — both inputs sorted on the key, then merged; good when inputs are already sorted (indexes) or very large. The cost-based planner chooses based on estimated row counts, indexes and memory (`work_mem`), and may reorder inner joins.

</details>

### Q10. Does the order of tables in an INNER JOIN matter for performance in PostgreSQL?

<details>
<summary>Answer</summary>

Usually not: the planner searches join orders for inner joins up to `join_collapse_limit` (default 8) tables, and uses a genetic optimiser beyond `geqo_threshold` (default 12). Outer joins restrict reordering because they are not freely commutative. Write joins in the order that reads best; check `EXPLAIN` if performance is poor.

</details>
