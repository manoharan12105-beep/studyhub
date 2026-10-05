# Table Partitioning — Interview Questions

## Beginner

### Q1. What is table partitioning?

<details>
<summary>Answer</summary>

Splitting one large logical table into smaller physical tables (partitions) by the value of a partition key. Applications query the parent table; PostgreSQL routes inserted rows to the right partition and, when a query filters on the key, scans only the partitions that can match (partition pruning). Typical example: an events table partitioned by month.

</details>

### Q2. What partitioning methods does PostgreSQL support?

<details>
<summary>Answer</summary>

- **RANGE** — each partition holds a contiguous range `[from, to)`, usually dates (`FOR VALUES FROM ('2026-01-01') TO ('2026-02-01')`).
- **LIST** — each partition holds an explicit set of values (`FOR VALUES IN ('Mumbai', 'Pune')`).
- **HASH** — rows are spread by hash of the key modulo a modulus (`FOR VALUES WITH (MODULUS 4, REMAINDER 0)`), for even distribution without a natural range.

A `DEFAULT` partition can catch rows that fit no other range or list partition, and partitions can be sub-partitioned.

</details>

### Q3. What happens when you insert a row that fits no partition?

<details>
<summary>Answer</summary>

The insert fails: `no partition of relation "…" found for row`. Either create the missing partition (usually ahead of time by a scheduled job or `pg_partman`) or add a `DEFAULT` partition. A default partition has a cost: attaching a new partition later must scan the default partition to make sure none of its rows belong to the new range.

</details>

### Q4. Is table partitioning the same as `PARTITION BY` in a window function?

<details>
<summary>Answer</summary>

No. Window `PARTITION BY` only groups rows logically for one calculation in one query. Table partitioning changes physical storage: the table becomes many tables on disk. They share a keyword and nothing else.

</details>

## Intermediate

### Q5. What is partition pruning and when does it not happen?

<details>
<summary>Answer</summary>

Pruning removes partitions that cannot contain matching rows. It happens at plan time for constant conditions on the key, and at run time for parameters or values known only during execution (`Subplans Removed` in `EXPLAIN ANALYZE`).

It does not happen when:

- the query filters on columns other than the partition key;
- the key is wrapped in a function or expression (`extract(month FROM taken_at) = 2`) — rewrite as a range on the raw column;
- the comparison type does not match the key's operator family.

</details>

### Q6. Why can't a table partitioned by `created_at` have `PRIMARY KEY (id)`?

<details>
<summary>Answer</summary>

PostgreSQL has no global indexes; each partition has its own index, so uniqueness is checked only within one partition. Two rows with the same `id` in different months would each be unique in their own partition. To make the guarantee real, PostgreSQL requires unique and primary key constraints to include every partition-key column: `PRIMARY KEY (id, created_at)`. If `id` alone must be globally unique, rely on a sequence/identity (unique by construction) or a separate lookup table.

</details>

### Q7. How do you delete data older than a year from a huge partitioned table?

<details>
<summary>Answer</summary>

Detach and drop the old partitions instead of running `DELETE`:

```sql
-- Illustrative
ALTER TABLE events DETACH PARTITION events_2025_09 CONCURRENTLY;
DROP TABLE events_2025_09;
```

`DELETE` writes WAL for every row, leaves dead tuples and needs vacuum; dropping a partition is a catalog operation that frees the files immediately. `CONCURRENTLY` (PostgreSQL 14+) avoids blocking queries on the parent. A detached partition can also be archived before dropping.

</details>

### Q8. What happens when an `UPDATE` changes a row's partition key?

<details>
<summary>Answer</summary>

PostgreSQL moves the row: it deletes it from the old partition and inserts it into the new one in the same statement (PostgreSQL 11+). If no partition accepts the new value, the update fails. Internally it is a delete plus insert, so it is more expensive than an in-place update, and a concurrent transaction that tries to update the moved row gets a serialization error rather than following it.

</details>

### Q9. Range vs hash partitioning — how do you choose?

<details>
<summary>Answer</summary>

Use range when there is a natural ordered key that queries filter on and that drives retention (time). Use list for a small set of discrete categories. Use hash only when you need data spread evenly (for parallel maintenance or I/O) and there is no range that queries use; hash prunes only on equality and cannot drop "old" data, because every partition holds a mix of everything.

</details>

## Advanced

### Q10. When does partitioning not help, or make things worse?

<details>
<summary>Answer</summary>

- Queries that do not filter on the key scan every partition — more plans, more index lookups than one big index.
- Small or medium tables: a good index is simpler and as fast.
- Thousands of partitions add planning time, memory and open files.
- Point lookups by a column outside the partition key must probe each partition's index (no global index).
- Uniqueness on columns outside the key cannot be enforced.

Partition for a large table with a dominant access and retention key, not as a general speed-up.

</details>

### Q11. How is partitioning different from sharding?

<details>
<summary>Answer</summary>

Partitioning splits a table into pieces on the same server; the database still has one machine's CPU, memory and disk. Sharding spreads data across multiple servers to scale storage and writes horizontally. In PostgreSQL, core partitioning is declarative; sharding needs an extension such as Citus, foreign-data-wrapper setups, or application-level routing. Sharded systems often partition within each shard too.

</details>

### Q12. You partitioned a 500 GB events table by month, but a dashboard query got slower. What do you check?

<details>
<summary>Answer</summary>

1. `EXPLAIN (ANALYZE)` the query: does the plan list every partition? Then pruning is not happening.
2. Check the `WHERE`: it must filter on the partition key directly — not on another column, not through `date_trunc`/`extract`, not via a mismatched type.
3. If the filter uses a parameter or subquery, look for run-time pruning (`Subplans Removed`).
4. Check that indexes exist on each partition for the dashboard's other filters (create them on the parent so they cascade).
5. Check the partition count and planning time (`EXPLAIN (ANALYZE, SUMMARY)`); thousands of partitions slow every query.

</details>
