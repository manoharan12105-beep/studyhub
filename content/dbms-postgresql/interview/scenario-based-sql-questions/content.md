# Scenario-Based SQL Questions

**Module:** Interview · **Interview priority:** Frequently asked

## What Is It?

A bank of business scenarios that must be turned into SQL: reports on the [sample database](../../sql-fundamentals/dbms-sample-database/content.md), data clean-up tasks, and "the numbers look wrong" investigations. Each [question](interview-questions.md) states the request as a product manager or teammate would, then gives a working query, its output and the reasoning.

## Why It Matters

- Real interview rounds rarely say "use a window function"; they describe a business need.
- Translating vague requirements (what is "active"? does "revenue" include cancelled orders?) is part of the test.

## Core Concept

### From scenario to query

1. **Clarify** the definitions: time range, statuses included, how to treat `NULL`s, ties and empty groups.
2. **Grain**: what does one output row represent?
3. **Path**: which tables, which joins (inner or outer), where fan-out can happen.
4. **Compute**: aggregates, windows or anti-joins.
5. **Sanity-check**: compare totals with a simple independent query.

### Coverage

The scenarios reuse the patterns from [SQL Problem Solving](../../sql-problem-solving/nth-highest-and-top-n-problems/content.md): top-N, anti-joins, time series, gaps and islands, and division.

## Revision

- Ask about definitions before writing SQL.
- Fix the grain, then aggregate each child table separately before joining.
- Use outer joins and `coalesce` when "zero" rows must appear.
- Validate totals with a second query.

## Quick Revision

Clarify, fix the grain, choose joins without fan-out, compute, and cross-check the totals.
