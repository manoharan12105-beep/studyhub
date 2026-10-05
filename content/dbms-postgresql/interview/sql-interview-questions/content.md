# SQL Interview Questions

**Module:** Interview · **Interview priority:** Core

## What Is It?

A mixed bank of core SQL questions: query structure and processing order, filtering, joins, grouping, subqueries, set operations, `NULL` handling and DML. Answers are written the way you would say them in an interview, with short queries against the [sample database](../../sql-fundamentals/dbms-sample-database/content.md). The [questions](interview-questions.md) assume the lessons in the SQL modules.

## Why It Matters

- Almost every backend, data and QA interview has a live SQL round.
- Interviewers check correctness on edge cases (`NULL`, duplicates, ties, empty groups), not just syntax.

## Core Concept

### Answering a query-writing question

1. Restate the output: one row per **what**? Which columns?
2. Identify the tables and the join path; decide inner or outer.
3. Decide where each filter goes: `WHERE`, `ON` or `HAVING`.
4. Handle `NULL`s, duplicates and ties explicitly.
5. Add `ORDER BY` — results have no order otherwise.

### Coverage

| Area | Lessons |
|------|---------|
| Query basics | [SELECT Basics](../../sql-fundamentals/select-query-basics/content.md), [Logical Processing Order](../../aggregation-and-grouping/logical-query-processing-order/content.md) |
| Joins | [Join Types](../../joins/sql-join-types/content.md), [Cross and Self Joins](../../joins/cross-and-self-joins/content.md) |
| Grouping and subqueries | [GROUP BY and HAVING](../../aggregation-and-grouping/group-by-and-having/content.md), [Subqueries](../../subqueries/sql-subqueries/content.md) |
| NULL | [NULL and Three-Valued Logic](../../null-and-conditional-logic/null-and-three-valued-logic/content.md) |

## Revision

- Logical order: `FROM`/`JOIN` → `WHERE` → `GROUP BY` → `HAVING` → window functions → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`.
- Inner join keeps matches; left join keeps all left rows; full join keeps both sides; cross join is every pair.
- `GROUP BY` → one row per group; every selected column grouped or aggregated.
- Scalar, row, table and correlated subqueries; `EXISTS` for existence.

## Quick Revision

Say what one output row represents, choose the joins, place each filter correctly, and handle `NULL`, duplicates and ordering explicitly.
