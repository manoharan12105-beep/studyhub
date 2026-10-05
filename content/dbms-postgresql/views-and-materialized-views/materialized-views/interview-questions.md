# Materialized Views — Interview Questions

## Beginner

### Q1. What is a materialized view?

<details>
<summary>Answer</summary>

A database object that stores the result of a query physically, so reading it is as cheap as reading a table and it can be indexed. Unlike a regular view it is a snapshot: it reflects the data as of its last `REFRESH MATERIALIZED VIEW`, not the current state of the base tables.

</details>

### Q2. What is the difference between a view and a materialized view?

<details>
<summary>Answer</summary>

A view stores only the query and runs it on every access, so it is always current but as slow as the query. A materialized view stores the result, so reads are fast and indexable, but the data is stale until refreshed and the refresh recomputes the whole query. Use views for abstraction and security, materialized views for caching expensive results.

</details>

## Intermediate

### Q3. How do you refresh a materialized view without blocking readers?

<details>
<summary>Answer</summary>

`REFRESH MATERIALIZED VIEW CONCURRENTLY name;` It computes the new result into a temporary area, compares it with the current contents and applies only inserts/updates/deletes, so readers continue to see the old data meanwhile. Requirements: a `UNIQUE` index on the materialized view (plain columns, no `WHERE`) and the view must already be populated. It is slower than a plain refresh, which takes an `ACCESS EXCLUSIVE` lock and blocks readers.

</details>

### Q4. Does a PostgreSQL materialized view refresh automatically?

<details>
<summary>Answer</summary>

No. There is no automatic or incremental refresh in core PostgreSQL. Refreshes must be scheduled (cron, `pg_cron`, an application job) or triggered after data loads. Triggers that refresh on every base-table change are usually a bad idea because each refresh recomputes everything.

</details>

### Q5. When would you choose a summary table over a materialized view?

<details>
<summary>Answer</summary>

When the base data is large and changes a little at a time, so a full recompute on every refresh is wasteful, or when the summary must be current within the same transaction. A summary table can be maintained incrementally (upserting today's totals, trigger-based counters). A materialized view is simpler to build and always fully rebuildable, but every refresh re-runs the full query.

</details>

## Advanced

### Q6. A dashboard reads a materialized view refreshed every 5 minutes with plain REFRESH; users report the page hanging for 20 seconds every 5 minutes. Why and how do you fix it?

<details>
<summary>Answer</summary>

Plain `REFRESH MATERIALIZED VIEW` takes an `ACCESS EXCLUSIVE` lock for the whole recomputation, so every dashboard query waits until it finishes. Add a unique index on the materialized view and use `REFRESH … CONCURRENTLY`; readers keep using the old snapshot. If the refresh itself is too expensive, make it cheaper (narrower query, pre-aggregated inputs) or replace it with an incrementally maintained summary table.

</details>

### Q7. Can you build a materialized view on top of another materialized view?

<details>
<summary>Answer</summary>

Yes, but refreshes are independent: refreshing the lower view does not refresh the upper one. You must refresh them in dependency order (lower first) to keep them consistent, and dropping the lower view requires `CASCADE` or dropping the upper one first.

</details>
