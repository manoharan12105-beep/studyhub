# Interview Questions: Data and Caching

**Module:** Interview Preparation · **Interview priority:** Core

## What Is It?

A mixed [question bank](interview-questions.md) covering the Data and Storage and Caching modules: access patterns, relational and NoSQL databases, choosing a database, indexes, connection pools, object storage, search, and every caching topic from hit ratios to stampedes.

## Why It Matters

"Which database?" and "where would you cache?" appear in almost every design interview, and they are where weak answers ("NoSQL because it scales", "cache everything") are most visible. These questions train the reasoning: access patterns, consistency, scale, freshness and failure.

## Core Concept

### Two reasoning chains to rehearse

**Database choice:** access patterns → relationships → consistency and transactions → read/write volume and size → schema variability → latency → operations → choice → what you give up.

**Caching:** what is read often and changes rarely → where to cache (client, CDN, app, Redis) → how it fills (cache-aside, read-through) → how it stays fresh (TTL, invalidation) → what happens when it is cold, stale or gone (stampede, penetration, hot keys, failover).

### Where to revise

[Data and Storage](../../data-and-storage/data-modeling-and-access-patterns/content.md) and [Caching](../../caching/caching-fundamentals/content.md) modules; the Revision mode's decision cheat sheets.

## Key Takeaways

- Derive storage from access patterns and consistency needs; state what each choice gives up.
- Every cache needs a freshness rule and a plan for when it is empty or overloaded.
- Fix queries and indexes before adding caches.
