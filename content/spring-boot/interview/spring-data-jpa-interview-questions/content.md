# Spring Data JPA and Hibernate Interview Questions

**Module:** Interview Preparation · **Interview priority:** Core

## Definition

A question bank on **JPA, Hibernate and Spring Data JPA**: the three-layer distinction, entities and IDs, the persistence context and entity states, dirty checking and flushing, relationships, cascading, fetching, queries, projections, N+1 and locking — by level and **Style**.

## Why It Matters

Persistence is where most backend performance and correctness problems live. Interviewers move quickly from "What is JPA?" to "Why did this update happen without `save()`?" and "Why does N+1 happen?".

## How to Answer

- Separate **JPA (spec), Hibernate (implementation), Spring Data JPA (repositories)** in every answer.
- Explain behaviour through the **persistence context**: managed vs detached, snapshots, flush timing.
- For performance questions, talk in **SQL statements** — how many and which.

Lessons: [JPA vs Hibernate vs Spring Data JPA](../../jpa-hibernate/jpa-hibernate-spring-data/content.md), [Entity Lifecycle](../../jpa-hibernate/entity-lifecycle-and-persistence-context/content.md), [Dirty Checking](../../jpa-hibernate/dirty-checking-and-flush/content.md), [Relationships](../../jpa-hibernate/jpa-relationships/content.md), [Fetching](../../jpa-hibernate/fetching-and-lazy-loading/content.md), [N+1](../../jpa-hibernate/n-plus-one-problem/content.md), [Locking](../../jpa-hibernate/jpa-locking/content.md).

## Key Takeaways

- Persistence context explains updates, caching, lazy loading and detached entities.
- Count the SQL: N+1, fetch joins, batch fetching, projections.
