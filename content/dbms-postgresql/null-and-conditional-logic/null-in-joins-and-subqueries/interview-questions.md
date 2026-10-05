# NULL in Joins and Subqueries — Interview Questions

## Beginner

### Q1. Why might `NOT IN` return no rows when you expect some?

<details>
<summary>Answer</summary>

If the subquery returns at least one NULL, `x NOT IN (...)` expands to `x <> v1 AND … AND x <> NULL`; the last comparison is UNKNOWN, so the condition is never TRUE and `WHERE` keeps nothing. Use `NOT EXISTS`, or filter NULLs out of the subquery.

</details>

### Q2. Does `NULL` match `NULL` in a join condition?

<details>
<summary>Answer</summary>

No. `ON a.k = b.k` is UNKNOWN when either side is NULL, so such rows never join. If NULLs should match, use `ON a.k IS NOT DISTINCT FROM b.k` — knowing it is harder for the planner to optimise.

</details>

### Q3. Where do NULLs come from in a LEFT JOIN result?

<details>
<summary>Answer</summary>

Left rows without a matching right row are kept, with every right-side column set to NULL. NULLs can also be genuine stored values in matched right rows.

</details>

## Intermediate

### Q4. NOT IN vs NOT EXISTS — differences?

<details>
<summary>Answer</summary>

Semantics: `NOT IN` returns no rows if the subquery yields any NULL and excludes outer rows whose own value is NULL; `NOT EXISTS` only asks whether a matching row exists, so NULLs never poison it. Performance in PostgreSQL: `NOT EXISTS` is planned as an anti-join (hash, merge or nested loop); `NOT IN` with a subquery cannot be turned into an anti-join because of its NULL semantics and becomes a hashed subplan, or a per-row subplan if the result is too large for memory. Prefer `NOT EXISTS`.

</details>

### Q5. How do you find rows in A with no match in B?

<details>
<summary>Answer</summary>

`SELECT a.* FROM a WHERE NOT EXISTS (SELECT 1 FROM b WHERE b.a_id = a.id)`, or `SELECT a.* FROM a LEFT JOIN b ON b.a_id = a.id WHERE b.id IS NULL` (test a non-nullable column of `b`, normally its primary key). Avoid `NOT IN` unless `b.a_id` is `NOT NULL`. `EXCEPT` also works when comparing just the key columns.

</details>

### Q6. A department report with LEFT JOIN shows 1 employee for an empty department. Why?

<details>
<summary>Answer</summary>

`count(*)` counts the padded row produced by the LEFT JOIN. Use `count(e.emp_id)`, which ignores the NULL from the padding and returns 0.

</details>

### Q7. Does `IN (subquery)` have a NULL problem too?

<details>
<summary>Answer</summary>

Not in practice. If a match exists, `IN` is TRUE regardless of NULLs; if not, it is UNKNOWN (with NULLs) or FALSE (without) — and `WHERE` treats both as "reject". The problem appears only when the result is negated (`NOT IN`) or used as a value (`SELECT x IN (...)` can return NULL).

</details>

## Advanced

### Q8. What does `salary > ALL (SELECT commission FROM …)` return if one commission is NULL?

<details>
<summary>Answer</summary>

Never TRUE: `ALL` requires every comparison to be TRUE, and the comparison with NULL is UNKNOWN. It can be FALSE if some value already makes a comparison false. Over an empty subquery, `> ALL` is TRUE. Fix with `WHERE commission IS NOT NULL` in the subquery, or compare with `(SELECT max(commission) …)` — `max` ignores NULLs (but returns NULL on an empty set).

</details>

### Q9. What happens when a scalar subquery returns no rows? Two rows?

<details>
<summary>Answer</summary>

No rows: the value is NULL (no error), so comparisons against it are UNKNOWN. Two or more rows: runtime error "more than one row returned by a subquery used as an expression". Guard with an aggregate, `LIMIT 1` with a deterministic `ORDER BY`, or a unique key in the filter.

</details>

### Q10. Why can't PostgreSQL rewrite `NOT IN (subquery)` into an anti-join like `NOT EXISTS`?

<details>
<summary>Answer</summary>

Because the two are not equivalent when NULLs are possible: `NOT IN` must return no rows if the subquery yields a NULL and must exclude outer rows with a NULL value, while an anti-join would return them. The planner cannot prove the absence of NULLs in general, so it keeps the subplan form — which is also why `NOT IN` can be dramatically slower on large subqueries that do not fit in `work_mem`.

</details>
