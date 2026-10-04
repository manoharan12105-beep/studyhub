# Transaction Interview Questions

**Module:** Interview Preparation · **Interview priority:** Core

## Definition

A question bank on **transactions in Spring**: ACID, `@Transactional` mechanics, rollback rules, propagation, isolation, locking interactions and pitfalls — by level and **Style**.

## Why It Matters

Transaction questions are where interviewers check whether you understand proxies, thread-bound resources and database concurrency, not just the annotation. "Why does `@Transactional` sometimes not work?" is almost guaranteed.

## How to Answer

- Explain `@Transactional` as **proxy + transaction manager + thread-bound connection**.
- State **rollback rules** precisely (unchecked by default).
- For concurrency questions, name the **anomaly** (lost update, phantom) and the **mechanism** (isolation, version, lock).

Lessons: [Transactions and ACID](../../transactions/transactions-and-acid/content.md), [@Transactional](../../transactions/transactional-annotation/content.md), [Propagation](../../transactions/transaction-propagation/content.md), [Isolation](../../transactions/transaction-isolation/content.md), [Pitfalls](../../transactions/transactional-pitfalls/content.md), [Locking](../../jpa-hibernate/jpa-locking/content.md).

## Key Takeaways

- Proxy-based, thread-bound, rollback on unchecked exceptions, REQUIRED by default.
- Isolation levels do not replace optimistic/pessimistic locking for lost updates.
