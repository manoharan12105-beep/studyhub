# Advanced Indexes — Interview Questions

## Beginner

### Q1. What is a partial index?

<details>
<summary>Answer</summary>

An index built only over rows matching a `WHERE` condition: `CREATE INDEX ON orders (created_at) WHERE status = 'PENDING'`. It is much smaller and cheaper to maintain when queries target a small subset, and the planner uses it when the query's conditions imply the predicate. A partial unique index enforces uniqueness among a subset ("one active subscription per user").

</details>

### Q2. What is a covering index?

<details>
<summary>Answer</summary>

An index that contains every column a query needs, so the query can be answered by an index-only scan without reading the table. In PostgreSQL, non-key payload columns are added with `INCLUDE`: `CREATE INDEX ON orders (customer_id) INCLUDE (total)`. Included columns cannot be searched or sorted on; they just ride along in the leaf entries.

</details>

### Q3. How do you speed up `WHERE name LIKE '%kumar%'`?

<details>
<summary>Answer</summary>

A B-tree cannot help with a leading wildcard. Install `pg_trgm` and create `CREATE INDEX ON people USING gin (name gin_trgm_ops)`; it indexes 3-character substrings and supports `LIKE`, `ILIKE`, regular expressions and similarity searches. For word-based search in documents, full-text search (`tsvector` + GIN) is usually the better fit.

</details>

## Intermediate

### Q4. GIN vs GiST — what is the difference?

<details>
<summary>Answer</summary>

GIN is an inverted index: for each element (array value, JSON key/value, lexeme, trigram) it stores the rows containing it — exact and fast for lookups, but larger and slower to update. GiST is a balanced tree of lossy summaries (bounding boxes, ranges) — smaller and faster to update, slower to query (rechecks), and it supports overlap, nearest-neighbour ordering and exclusion constraints. Use GIN for `jsonb`, arrays and full-text; GiST for ranges, geometry and exclusion constraints.

</details>

### Q5. When would you use a BRIN index?

<details>
<summary>Answer</summary>

On very large tables where the indexed column is strongly correlated with physical row order — append-only logs, sensor readings, events by timestamp. BRIN stores only min/max per block range, so it is tiny (kilobytes for gigabytes of table) and cheap to maintain, but lossy: it returns page ranges that must be rechecked. It is useless if values are scattered (random inserts, many updates).

</details>

### Q6. What is a hash index and why is it rarely used?

<details>
<summary>Answer</summary>

An index storing hash codes of the key, supporting only `=`. Since PostgreSQL 10 it is WAL-logged and crash-safe, and it can be smaller than a B-tree for long keys (URLs, tokens). But a B-tree supports equality almost as fast while also handling ranges, sorting and uniqueness constraints (hash indexes cannot be `UNIQUE`), so B-tree remains the default choice.

</details>

### Q7. How does full-text search work in PostgreSQL?

<details>
<summary>Answer</summary>

Text is converted with `to_tsvector(config, text)` into normalized lexemes (stemmed, lower-case, stop words removed, with positions); queries are built with `to_tsquery`/`plainto_tsquery`/`websearch_to_tsquery`; `tsvector @@ tsquery` tests a match and `ts_rank` scores it. A GIN index on the `tsvector` expression (or on a stored generated `tsvector` column) makes searches fast. The same text-search configuration (e.g. `'english'`) must be used in the index and the query.

</details>

## Advanced

### Q8. A partial index exists but the application's prepared statement does not use it. Why?

<details>
<summary>Answer</summary>

The planner must prove from the query's `WHERE` clause that the index predicate holds. With a parameter (`WHERE status = $1`), a generic cached plan cannot assume `$1 = 'PENDING'`, so the partial index is not applicable; custom plans (first executions, or `plan_cache_mode = force_custom_plan`) can use it. Fix: write the constant in the query text for the hot path (`WHERE status = 'PENDING' AND …`), or use a full index if many statuses are queried.

</details>

### Q9. How would you index a `jsonb` column queried with `attrs @> '{"brand": "Acme"}'` and also with `attrs ->> 'sku' = ?`?

<details>
<summary>Answer</summary>

For containment, a GIN index: `USING gin (attrs jsonb_path_ops)` (smaller, supports `@>`) or default `jsonb_ops` (also supports key-exists `?`). For equality on one extracted key, a B-tree expression index `((attrs ->> 'sku'))` — GIN does not help `->>` comparisons. If `sku` is queried constantly, consider promoting it to a real column (possibly a generated column) with a unique index.

</details>

### Q10. How do you prevent overlapping time ranges for the same resource?

<details>
<summary>Answer</summary>

An exclusion constraint backed by a GiST index: `EXCLUDE USING gist (room_id WITH =, during WITH &&)` on a range column, with the `btree_gist` extension so the scalar `room_id` can take part with `=`. The database rejects any row overlapping an existing one for the same room, safely under concurrency — something a unique index cannot express.

</details>
