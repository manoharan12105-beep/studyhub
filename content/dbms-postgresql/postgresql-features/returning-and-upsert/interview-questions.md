# RETURNING and Upsert — Interview Questions

## Beginner

### Q1. What does the RETURNING clause do?

<details>
<summary>Answer</summary>

It makes `INSERT`, `UPDATE`, `DELETE` (and `MERGE` from PostgreSQL 17) return values from the affected rows, as if a `SELECT` were run on them: generated ids, defaults, trigger-modified values, computed expressions. It saves a second query and avoids races such as reading back an id with `max(id)`. PostgreSQL 18 adds `old.` and `new.` to return values from before and after the change.

</details>

### Q2. How do you insert a row only if it does not already exist?

<details>
<summary>Answer</summary>

With a unique constraint on the identifying column and `INSERT … ON CONFLICT (col) DO NOTHING`. It is atomic: concurrent sessions inserting the same key never produce a duplicate or a unique-violation error. `INSERT … WHERE NOT EXISTS (SELECT …)` is not safe under concurrency, because two sessions can both see "not exists".

</details>

### Q3. What is EXCLUDED in an upsert?

<details>
<summary>Answer</summary>

A special table reference to the row that was proposed for insertion and hit the conflict. In `DO UPDATE SET name = EXCLUDED.name`, `EXCLUDED.name` is the new value, while the target table's name (or alias) refers to the existing row: `SET visits = subscribers.visits + 1`.

</details>

## Intermediate

### Q4. Why is "SELECT, then INSERT or UPDATE" in application code a problem?

<details>
<summary>Answer</summary>

It is a check-then-act race: two requests can both `SELECT`, both see no row, and both `INSERT` — one fails with a duplicate key (or, without a unique constraint, a duplicate is created). It also costs two round trips. `INSERT … ON CONFLICT DO UPDATE` performs the check and the write atomically in one statement; the alternative is explicit locking or retry loops.

</details>

### Q5. Your upsert fails with "ON CONFLICT DO UPDATE command cannot affect row a second time". Why?

<details>
<summary>Answer</summary>

The rows proposed in one statement contain the same conflict key more than once, so the statement would update the same row twice, which PostgreSQL forbids (the result would depend on processing order). Deduplicate the input first — e.g. `SELECT DISTINCT ON (key) … ORDER BY key, updated_at DESC` — so each key appears once.

</details>

### Q6. What is the conflict target, and when do you need a WHERE in it?

<details>
<summary>Answer</summary>

The part after `ON CONFLICT` that names which unique index or constraint the clause handles: a column list such as `(email)`, or `ON CONSTRAINT name`. PostgreSQL infers the index from the column list. If the unique index is partial (`CREATE UNIQUE INDEX … (customer_id) WHERE active`), the target must repeat the predicate: `ON CONFLICT (customer_id) WHERE active`, otherwise there is "no unique or exclusion constraint matching the ON CONFLICT specification".

</details>

### Q7. ON CONFLICT vs MERGE — when would you use each?

<details>
<summary>Answer</summary>

`ON CONFLICT` for application upserts keyed by a unique index: it is atomic and safe when sessions insert the same key concurrently (a waiting session re-checks and updates). `MERGE` (PostgreSQL 15+) for batch synchronisation from a source table or query with several actions (insert, update, delete, do nothing) and arbitrary join conditions; under concurrent inserts of the same key it can fail with a unique violation, because it does not re-check after waiting.

</details>

## Advanced

### Q8. Why do upserts create gaps in identity columns?

<details>
<summary>Answer</summary>

The default for the identity column (`nextval`) is evaluated when the row is formed, before the conflict check. If the row then conflicts and is skipped or turned into an update, the drawn value is discarded — sequences are not rolled back. High-volume upsert workloads can burn through `integer` ranges surprisingly fast; use `bigint`.

</details>

### Q9. How can an upsert avoid rewriting a row that did not change?

<details>
<summary>Answer</summary>

Add a `WHERE` to the `DO UPDATE` clause comparing old and new values: `DO UPDATE SET name = EXCLUDED.name WHERE t.name IS DISTINCT FROM EXCLUDED.name`. When it is false, no new row version is written, no update triggers fire and the row is not returned by `RETURNING`. This reduces bloat and WAL for idempotent re-imports.

</details>

### Q10. With DO NOTHING, how do you get the id of the existing row?

<details>
<summary>Answer</summary>

`RETURNING` returns nothing for skipped rows. Combine the insert with a lookup:

```sql
-- Illustrative
WITH ins AS (
    INSERT INTO tags (name) VALUES ('sql')
    ON CONFLICT (name) DO NOTHING
    RETURNING id
)
SELECT id FROM ins
UNION ALL
SELECT id FROM tags WHERE name = 'sql' AND NOT EXISTS (SELECT 1 FROM ins);
```

Alternatively use `DO UPDATE SET name = EXCLUDED.name` (a no-op update) so `RETURNING` always produces the row — at the cost of writing a new row version each time.

</details>
