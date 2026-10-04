# Isolation Levels and Read Anomalies — Practice

### P1. Name the anomaly

**Difficulty:** Easy · **Type:** MCQ

A report counts orders twice within one transaction and gets 100, then 103, because new orders were committed meanwhile. Which anomaly is this?

- A) Dirty read
- B) Non-repeatable read
- C) Phantom read
- D) Lost update

<details>
<summary>Answer</summary>

**Answer:** C) Phantom read

**Explanation:** The same query returned a different set of rows due to committed inserts.

</details>

### P2. Choose the level

**Difficulty:** Medium · **Type:** Scenario

An end-of-day report reads balances from several tables and must present one consistent point in time while transactions continue. Which isolation would you choose on PostgreSQL, and why?

<details>
<summary>Answer</summary>

REPEATABLE READ with `readOnly = true`: PostgreSQL gives the whole transaction one snapshot, so all queries see the same committed state, without blocking writers (MVCC). READ COMMITTED would let each statement see newer data.

</details>

### P3. Inner isolation ignored

**Difficulty:** Medium · **Type:** Debugging

`ReportService.generate()` is `@Transactional` (default). It calls `ledgerService.snapshot()` annotated `@Transactional(isolation = Isolation.REPEATABLE_READ)`, but the snapshot is not repeatable. Why?

<details>
<summary>Answer</summary>

`snapshot()` joins the transaction started by `generate()` with the default (READ COMMITTED) isolation; the inner isolation attribute is not applied to an existing transaction. Put `REPEATABLE_READ` on `generate()`, or make `snapshot()` start its own transaction (`REQUIRES_NEW`).

</details>
