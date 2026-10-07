# System Design Interview Traps

**Module:** Interview Preparation · **Interview priority:** Core

## What Is It?

A collection of statements that **sound right but are wrong** — or are only half right — and that interviewers deliberately probe. Each [question](interview-questions.md) states the trap, gives the precise truth, and points to the lesson that explains it.

## Why It Matters

Traps reveal whether knowledge is memorised or understood. Many are also real production mistakes: replicas used as backups, CAP as "pick two", retries without idempotency, NoSQL chosen "because it scales", caches that serve wrong data.

## Core Concept

### How to answer a trap

1. **Don't agree quickly.** Words like "always", "never", "just", "guarantees" and "the same as" signal a trap.
2. **State the precise rule.** "CAP says that during a network partition you must choose consistency or availability."
3. **Give the mechanism or counter-example.** "Partitions can't be opted out of in a distributed system, so CA means not distributed."
4. **Add the practical consequence.** "So we decide per feature what happens during a partition."

### Coverage

The traps span every module: foundations and estimation, APIs and protocols, databases and caching, scaling and consistency, reliability and messaging, observability and case studies. The Revision mode's *Traps and Confusions* sheet summarises them.

## Key Takeaways

- Precise vocabulary wins: availability vs reliability, 401 vs 403, replication vs backup, strong vs eventual.
- Many traps are about **what happens during failure** or **at scale**, not in the happy path.
- Always explain the consequence, not just the correction.
