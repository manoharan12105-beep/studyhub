# DML: INSERT, UPDATE and DELETE — Interview Questions

## Beginner

### Q1. What are the DML commands?

<details>
<summary>Answer</summary>

`INSERT` (add rows), `UPDATE` (modify rows), `DELETE` (remove rows) and `MERGE` (conditional insert/update/delete from a source; PostgreSQL 15+). `SELECT` is sometimes included as well.

</details>

### Q2. What happens if you run `UPDATE employees SET salary = 0;`?

<details>
<summary>Answer</summary>

Every row in `employees` gets salary 0 — there is no `WHERE`. In autocommit mode it is committed immediately. (In the sample database the `CHECK (salary > 0)` constraint would reject it, which shows why constraints are valuable.)

</details>

### Q3. How do you copy rows from one table into another?

<details>
<summary>Answer</summary>

`INSERT INTO target (cols…) SELECT cols… FROM source WHERE …;` The `SELECT` can join, filter and compute; its column count and types must match the target column list.

</details>

## Intermediate

### Q4. How do you update one table using values from another in PostgreSQL?

<details>
<summary>Answer</summary>

With `UPDATE … FROM`: `UPDATE orders o SET status = 'SHIPPED' FROM customers c WHERE c.customer_id = o.customer_id AND c.city = 'Mumbai';` The portable alternative is a subquery in `WHERE` or a correlated subquery in `SET`. Make sure each target row matches at most one source row, otherwise the value used is arbitrary.

</details>

### Q5. What does `RETURNING` do?

<details>
<summary>Answer</summary>

A PostgreSQL extension that makes `INSERT`, `UPDATE`, `DELETE` (and `MERGE` from 17) return values from the affected rows — for example the generated id after an insert or the new values after an update — without a second query. JDBC can read it as a result set.

</details>

### Q6. Is a multi-row INSERT atomic?

<details>
<summary>Answer</summary>

Yes. Every SQL statement is atomic: if one row violates a constraint, the whole statement fails and no rows are inserted. Grouping *several statements* atomically requires a transaction.

</details>

### Q7. In `UPDATE t SET a = b, b = a`, what happens?

<details>
<summary>Answer</summary>

The values are swapped. All right-hand expressions are evaluated against the row as it was before the update (standard SQL behaviour, which PostgreSQL follows).

</details>

## Advanced

### Q8. What does an UPDATE physically do in PostgreSQL?

<details>
<summary>Answer</summary>

It never overwrites the row in place. It writes a new row version (tuple) with the new values and marks the old version as deleted by the updating transaction (sets its `xmax`). Other transactions keep seeing the old version according to their snapshots. Dead versions are later removed by `VACUUM`. If no indexed column changed and the page has room, a HOT (heap-only tuple) update avoids touching indexes. So frequent updates create bloat that must be vacuumed.

</details>

### Q9. `MERGE` vs `INSERT … ON CONFLICT` — which would you use for an upsert?

<details>
<summary>Answer</summary>

For a single-table upsert keyed by a unique constraint, `INSERT … ON CONFLICT DO UPDATE`: it is atomic with respect to concurrent inserts of the same key (no unique-violation race). `MERGE` is more general — matching on any condition, several actions including delete, syncing from a source table — but under concurrency it can still fail with a unique violation, so callers must handle retries.

</details>

### Q10. Why should bulk inserts from Java be batched?

<details>
<summary>Answer</summary>

Each statement round trip costs network latency and per-statement overhead, and in autocommit mode each also costs a commit (WAL flush). Batching (`PreparedStatement.addBatch`/`executeBatch`, multi-row `VALUES`, `reWriteBatchedInserts=true` in the PostgreSQL JDBC driver, or `COPY` for very large loads) inside one transaction reduces both by orders of magnitude.

</details>
