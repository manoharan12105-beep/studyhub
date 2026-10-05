# DBMS Fundamentals Interview Questions

**Module:** Interview · **Interview priority:** Core

## What Is It?

A mixed interview bank on core DBMS theory: what a DBMS does, data models and schemas, the relational model, keys, constraints, ER modelling, normalization and the main system types (OLTP/OLAP, SQL/NoSQL). It is the question set asked in campus placements and the first round of most backend interviews. The [questions](interview-questions.md) combine ideas from several lessons; each answer links back to the lesson that teaches it.

## Why It Matters

- Theory rounds test whether you can explain concepts precisely and compare them, not only write queries.
- The same few topics recur: keys, normalization, ACID, joins, indexes and DBMS vs file system.

## Core Concept

### How to answer a theory question

1. **Define** in one sentence.
2. **Explain why it exists** (the problem it solves).
3. **Give a small example** from a familiar schema (employees, orders).
4. **Compare or state a limitation** if there is an obvious "vs".

### Coverage

| Area | Lessons |
|------|---------|
| DBMS basics | [Introduction](../../dbms-fundamentals/dbms-introduction/content.md), [Data Models and Schemas](../../dbms-fundamentals/data-models-and-schemas/content.md), [SQL, NoSQL, OLTP, OLAP](../../dbms-fundamentals/sql-nosql-oltp-olap/content.md) |
| Relational model | [Relational Model Basics](../../relational-model/relational-model-basics/content.md), [Keys](../../relational-model/database-keys/content.md), [Constraints](../../relational-model/sql-constraints/content.md) |
| Design | [ER Modeling](../../database-design/er-modeling/content.md), [Functional Dependencies](../../normalization/functional-dependencies/content.md), [Normalization](../../normalization/database-normalization/content.md) |

## Revision

- DBMS = software that stores, retrieves and protects shared data with integrity, concurrency, recovery and security.
- Three-schema architecture: external (views) → conceptual (logical schema) → internal (storage); gives logical and physical data independence.
- Keys: super ⊇ candidate → one primary, the rest alternate; foreign keys reference candidate keys.
- Normal forms: 1NF atomic values, 2NF no partial dependency, 3NF no transitive dependency, BCNF every determinant is a superkey.

## Quick Revision

Define, justify, give an example, compare. Know keys, constraints, normal forms, ACID, three-schema architecture, and OLTP vs OLAP cold.
