# Denormalization — Interview Questions

## Beginner

### Q1. What is denormalization?

<details>
<summary>Answer</summary>

Deliberately adding redundant or precomputed data to a normalized design — copied columns, stored totals or counters, summary tables, materialized views — to make frequent reads faster or simpler, at the cost of extra writes and the risk of inconsistent copies.

</details>

### Q2. When would you denormalize?

<details>
<summary>Answer</summary>

When a measured, frequent read path is too slow or complex even after indexing and query tuning, the data is read far more than written, and the redundancy can be maintained reliably (trigger, materialized view refresh, batch job) with an acceptable staleness. Typical cases: dashboards and reports, counters shown on every page, analytics star schemas, precomputed feeds.

</details>

## Intermediate

### Q3. What are the risks of denormalization?

<details>
<summary>Answer</summary>

Update anomalies (copies disagree when a code path forgets to update one), write amplification (one change touches several rows/tables), lock contention on hot rows such as shared counters, more storage, and more complex schema changes. Mitigate with automatic maintenance (triggers, generated columns, materialized views), updates in the same transaction, and reconciliation queries that detect drift.

</details>

### Q4. Is storing `unit_price` in order lines denormalization?

<details>
<summary>Answer</summary>

Not really. It records a different fact — the price at the time of purchase — which must not change when the catalogue price changes. It is a historical snapshot, required for correct invoices, not a redundant copy that must stay synchronised. The same applies to a shipping address copied onto an order.

</details>

### Q5. How would you keep a `comment_count` column on posts accurate?

<details>
<summary>Answer</summary>

Update it in the same transaction as the comment insert/delete — most robustly with an `AFTER INSERT OR DELETE` trigger on comments that increments/decrements the post's counter — so no code path can skip it. Periodically reconcile with `count(*)` and repair drift. For very hot posts, the single counter row becomes a contention point; alternatives are sharded counters (several rows summed on read) or asynchronous aggregation.

</details>

## Advanced

### Q6. What is a star schema?

<details>
<summary>Answer</summary>

The standard denormalized design for analytics: a central fact table holding measures (quantity, revenue) and foreign keys to dimension tables (date, product, customer, store), each dimension wide and denormalized (category and brand repeated on every product row). Queries join the fact table to a few dimensions and aggregate. A snowflake schema normalizes dimensions into sub-dimensions, reducing redundancy at the cost of more joins.

</details>

### Q7. Materialized view vs summary table maintained by triggers?

<details>
<summary>Answer</summary>

A materialized view is declared as a query and refreshed as a whole (`REFRESH MATERIALIZED VIEW [CONCURRENTLY]`), so it is simple and always rebuildable, but stale between refreshes and expensive to refresh for large inputs. A trigger-maintained summary table is updated incrementally in the writing transaction — always current — but adds write cost and complexity, and must handle every kind of change (insert, update, delete, truncate) correctly.

</details>
