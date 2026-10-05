# Advanced SQL Interview Questions

**Module:** Interview · **Interview priority:** Frequently asked

## What Is It?

A bank of advanced SQL questions for experienced-candidate and data-heavy backend rounds: window functions and frames, CTEs and recursion, `LATERAL`, grouping sets, set-based thinking, `MERGE`/upsert, and writing correct queries under ties and `NULL`s. The [questions](interview-questions.md) assume the window-function, CTE and subquery lessons.

## Why It Matters

- Senior rounds ask for one query that solves a multi-step problem, then for alternatives and their costs.
- Window functions and recursive CTEs separate "knows SQL" from "thinks in sets".

## Core Concept

### Advanced toolbox

| Tool | Use |
|------|-----|
| Window functions | Per-row results with group context: ranks, running totals, `lag`/`lead` |
| Frames (`ROWS`/`RANGE`/`GROUPS`) | Which neighbouring rows a window aggregate sees |
| CTEs | Name intermediate steps; recursion for hierarchies and series |
| `LATERAL` | A subquery per row that can reference that row (top-N per group) |
| `GROUPING SETS` / `ROLLUP` / `CUBE` | Several groupings (subtotals, grand total) in one pass |
| `FILTER` | Conditional aggregates |
| Data-modifying CTEs | Chain `DELETE … RETURNING` into `INSERT` atomically |

### Coverage

| Area | Lessons |
|------|---------|
| Windows | [Window Functions Basics](../../window-functions/window-functions-basics/content.md), [Ranking](../../window-functions/ranking-window-functions/content.md), [Value Functions](../../window-functions/value-window-functions/content.md) |
| CTEs | [Common Table Expressions](../../ctes/common-table-expressions/content.md), [Recursive CTEs](../../ctes/recursive-ctes/content.md) |
| Problem patterns | [Top-N](../../sql-problem-solving/nth-highest-and-top-n-problems/content.md), [Gaps and Islands](../../sql-problem-solving/gaps-and-islands/content.md) |

## Revision

- Window = `func() OVER (PARTITION BY … ORDER BY … frame)`; rows are not collapsed.
- Default frame with `ORDER BY` is `RANGE UNBOUNDED PRECEDING … CURRENT ROW` (includes peers).
- `ROLLUP (a, b)` = `(a, b)`, `(a)`, `()`; `GROUPING()` tells subtotal rows apart.
- `LATERAL` + `LIMIT` = top N per group with an index.

## Quick Revision

Think in sets: windows for "per row, with context", CTEs for steps, `LATERAL` for per-row subqueries, `ROLLUP` for subtotals — and always state how ties and `NULL`s are handled.
