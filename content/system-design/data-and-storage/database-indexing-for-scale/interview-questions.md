# Database Indexes at Scale — Interview Questions

## Beginner

### Q1. How does an index speed up a query?

**Style:** How

<details>
<summary>Answer</summary>

It is a separate, ordered structure (usually a B-tree) mapping column values to row locations. For a filter on the indexed column, the database searches the index in logarithmic time and reads only the matching rows, instead of scanning every row in the table.

</details>

### Q2. Why not index every column?

**Style:** Why not

<details>
<summary>Answer</summary>

Every insert, update and delete must update each index, so many indexes slow writes; they also use disk and memory, and unused ones are pure overhead. Index the columns that frequent, important queries filter, join or sort on.

</details>

## Intermediate

### Q3. How do you decide which indexes to add?

**Style:** How

<details>
<summary>Answer</summary>

From access patterns and measurements: list the frequent queries, find the slow ones in the slow-query log or query statistics, inspect their plans with `EXPLAIN ANALYZE`, add an index matching the filter and sort (often composite), verify the plan now uses it and latency improves, and periodically drop indexes nobody uses.

</details>

### Q4. Why does column order matter in a composite index?

**Style:** Why

<details>
<summary>Answer</summary>

A composite index is sorted by the first column, then by the second within each first-column value. A query filtering on the first column (and optionally sorting or ranging on the second) can use it efficiently; a query filtering only on the second column cannot jump into the index because those values are scattered across it.

</details>

### Q5. Index or cache — which do you add first for a slow, frequent query?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Fix the query and index first. An index makes every execution fast and keeps results consistent; a cache only helps on hits, adds staleness and invalidation work, and every miss still runs the slow query. Add a cache afterwards if the query is still too frequent or expensive.

</details>

## Advanced

### Q6. An index exists, but the query still does a full scan. Give possible reasons.

**Style:** Debugging

<details>
<summary>Answer</summary>

A function or cast is applied to the indexed column; the query filters on a non-leading column of a composite index; a leading-wildcard `LIKE '%term'`; the condition matches a large fraction of rows so a scan is genuinely cheaper; outdated statistics mislead the planner; or a type mismatch between the column and the parameter prevents index use.

</details>
