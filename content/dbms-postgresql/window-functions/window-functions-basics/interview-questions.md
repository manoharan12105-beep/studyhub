# Window Functions Basics — Interview Questions

## Beginner

### Q1. What is a window function?

<details>
<summary>Answer</summary>

A function that computes a value for each row from a set of related rows (the window) defined by `OVER (…)`, without collapsing the rows. Example: `avg(salary) OVER (PARTITION BY dept_id)` shows each employee's department average next to their own salary. Kinds: aggregate functions used with `OVER`, ranking functions (`row_number`, `rank`, `dense_rank`), and value functions (`lag`, `lead`, `first_value`, …).

</details>

### Q2. What is the difference between GROUP BY and PARTITION BY?

<details>
<summary>Answer</summary>

`GROUP BY` collapses each group into one output row, so only grouped columns and aggregates can be selected. `PARTITION BY` inside `OVER` divides rows into groups for the window calculation but keeps every row, so you can show row-level columns together with group-level values.

</details>

### Q3. Can you use a window function in WHERE?

<details>
<summary>Answer</summary>

No. Window functions are evaluated after `WHERE`, `GROUP BY` and `HAVING`. Compute the value in a subquery or CTE and filter in the outer query. They are allowed only in the select list and `ORDER BY`.

</details>

## Intermediate

### Q4. Write a running total of salaries ordered by hire date.

<details>
<summary>Answer</summary>

```sql
SELECT name, hire_date, salary,
       sum(salary) OVER (ORDER BY hire_date, emp_id
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM employees
ORDER BY hire_date, emp_id;
```

The explicit `ROWS` frame and the unique tiebreaker (`emp_id`) make it a strict row-by-row total. With only `ORDER BY hire_date` and the default frame, employees hired on the same date would share one total.

</details>

### Q5. What is the default window frame?

<details>
<summary>Answer</summary>

Without `ORDER BY` in `OVER`: the whole partition. With `ORDER BY`: `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, which means from the partition start up to and including all peers of the current row (rows with the same `ORDER BY` value). This is why running totals repeat for ties and why `last_value` returns the current row's value by default.

</details>

### Q6. ROWS vs RANGE — what is the difference?

<details>
<summary>Answer</summary>

`ROWS` defines the frame by physical row positions (`2 PRECEDING` = the two previous rows). `RANGE` defines it by values of the `ORDER BY` key: peers are always included together, and offsets are value distances (`RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW`). Use `ROWS` for "last n rows", `RANGE` for "last n days" when dates can be missing or repeated. PostgreSQL also supports `GROUPS`, which counts peer groups.

</details>

### Q7. Compute each employee's salary as a percentage of their department's payroll.

<details>
<summary>Answer</summary>

```sql
SELECT name, dept_id, salary,
       round(100.0 * salary / sum(salary) OVER (PARTITION BY dept_id), 1) AS pct_of_dept
FROM employees;
```

`sum` of an `integer` column returns `bigint`, so `100 * salary / sum(…)` would use integer division and truncate; `100.0` makes the arithmetic `numeric`.

</details>

## Advanced

### Q8. How does PostgreSQL execute window functions, and how can you make them faster?

<details>
<summary>Answer</summary>

Input rows are sorted by the `PARTITION BY` and `ORDER BY` keys, and a `WindowAgg` node walks the sorted rows maintaining the frame. Each distinct window specification can need its own sort, so reuse one window definition (`WINDOW w AS (…)`) where possible. An index on `(partition_key, order_key)` can provide presorted input. Since PostgreSQL 15, a filter like `WHERE rn <= 10` on an outer `row_number()` becomes a run condition that stops the `WindowAgg` early. Filter rows in `WHERE` before the window when the logic allows it.

</details>

### Q9. A moving 7-day sum uses `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW`. When is that wrong?

<details>
<summary>Answer</summary>

When the data does not have exactly one row per day: missing days make the frame span more than 7 days, and several rows per day make it span fewer. Use `RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW` on a date column, or first aggregate per day and fill missing days with `generate_series`, then use `ROWS`.

</details>

### Q10. Why does `WHERE dept_id = 10` change the result of `sum(salary) OVER ()`?

<details>
<summary>Answer</summary>

`WHERE` runs before window functions, so the window only sees the filtered rows: the "total" becomes Engineering's total, not the company's. To compare with the company total while showing only some rows, compute the window in a subquery or CTE over all rows and filter outside it.

</details>
