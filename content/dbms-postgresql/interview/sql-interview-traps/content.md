# SQL Interview Traps

**Module:** Interview · **Interview priority:** Core

## What Is It?

An **interview trap** is a question whose obvious answer is wrong or only half right. SQL traps cluster around `NULL`, counting, filtering order, duplicates, ranking ties, and "X vs Y" comparisons where both options work but differ in one precise way. The [interview questions](interview-questions.md) for this topic state each trap, give the precise rule, and prove it with a query against the [sample database](../../sql-fundamentals/dbms-sample-database/content.md).

## Why It Matters

- Interviewers use traps to separate memorised syntax from understanding.
- Most production SQL bugs are the same traps: a `NOT IN` that returns nothing, a `LEFT JOIN` that became an inner join, a running total with tied dates.
- Each trap has a one-sentence precise answer worth memorising.

## Core Concept

| Trap | Precise rule |
|------|--------------|
| `NULL = NULL` | Unknown, not true; use `IS NULL` / `IS NOT DISTINCT FROM` |
| `NOT IN (… NULL …)` | Never true → zero rows; use `NOT EXISTS` |
| `count(*)` vs `count(col)` | `count(*)` counts rows; `count(col)` skips `NULL`s |
| `count(*)` vs `count(1)` | Same result; PostgreSQL's `count(*)` is marginally cheaper |
| `WHERE` vs `HAVING` | `WHERE` filters rows before grouping; `HAVING` filters groups |
| `WHERE` vs `ON` (outer join) | `ON` decides matches; `WHERE` filters after `NULL`-extension |
| `UNION` vs `UNION ALL` | `UNION` removes duplicates (extra sort/hash) |
| `DELETE` / `TRUNCATE` / `DROP` | Rows (logged, triggers, `WHERE`) / all rows fast / the table itself |
| `char` / `varchar` / `text` | Same storage in PostgreSQL; `char(n)` pads; `varchar(n)` limits |
| `EXISTS` vs `IN` | Same plan for non-null semijoins in PostgreSQL |
| `NOT EXISTS` vs `NOT IN` | Only `NOT EXISTS` is `NULL`-safe |
| CTE vs subquery | Same plan unless `MATERIALIZED`, recursive or data-modifying |
| CTE vs temporary table | CTE lives for one statement; temp table for the session, can be indexed and analysed |
| View vs materialized view | View = stored query; materialized = stored result, refreshed manually |
| `ROW_NUMBER` / `RANK` / `DENSE_RANK` | 1,2,3,4 / 1,2,2,4 / 1,2,2,3 |
| `PRIMARY KEY` vs `UNIQUE` | PK: one per table, `NOT NULL`; `UNIQUE` allows `NULL`s (many, by default) |
| `DELETE` vs `ON DELETE CASCADE` | Default FK blocks deleting a referenced parent; `CASCADE` deletes children too |
| `SERIAL` vs `IDENTITY` | `IDENTITY` is the SQL standard and owns its sequence more strictly |
| `timestamp` vs `timestamptz` | `timestamptz` stores an instant (UTC) and converts on display |
| Index vs partition | Index finds rows; partitioning splits storage and prunes |
| Normalization vs denormalization | Remove redundancy for integrity vs add it back for reads |

## Revision

- `NULL` comparisons are unknown; `WHERE` keeps only true.
- `NOT IN` + `NULL` = no rows; prefer `NOT EXISTS`.
- `count(col)` skips `NULL`; `avg` ignores `NULL`s.
- Outer-join conditions on the optional table go in `ON`.
- Ranking ties: `ROW_NUMBER` never ties; `RANK` leaves gaps; `DENSE_RANK` does not.
- `timestamptz` for instants; half-open ranges for periods.

## Quick Revision

Most SQL traps are `NULL` (unknown is not true), filter placement (`WHERE`/`ON`/`HAVING`), duplicates (`UNION`, joins, `count(DISTINCT)`) and ties (`RANK` vs `ROW_NUMBER`). Answer each with the precise rule and a two-line example.
