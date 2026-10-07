# Choosing a Database

**Module:** Data and Storage · **Interview priority:** Core

## What Is It?

Choosing a database is a **reasoning process**, not a lookup table. "SQL for structured data, NoSQL for unstructured data" is a starting hint at best. The right store follows from how the data is accessed, how it relates, how consistent it must be, how much of it there is, and what the team can operate.

## Why It Exists

The database is the hardest component to change later: data must be migrated, queries rewritten and guarantees re-checked. A choice made "because it scales" or "because we know it" without checking access patterns tends to fail on the most important query.

## How It Works

### The questions, in order

| # | Question | Pushes toward |
|---|----------|---------------|
| 1 | **What are the access patterns?** Key lookups, range scans by time, ad-hoc filters, aggregates, graph traversals? | Key lookups → key-value; ordered ranges per key → wide-column; ad-hoc filters/joins → relational; traversals → graph; full-text → search engine |
| 2 | **How related is the data?** Do queries combine several entities? | Many relationships and joins → relational |
| 3 | **What consistency is required?** Can a read be stale? Do multi-record changes need to be atomic? | Strict, multi-record → relational (or a transactional distributed SQL store); tolerant → many options |
| 4 | **What is the read/write ratio and volume?** | Very high write throughput, simple access → wide-column or key-value; read-heavy → anything + replicas and cache |
| 5 | **How big will it get?** | Fits one machine (with headroom) → keep it simple; far beyond → partitioned stores or sharding |
| 6 | **How much does the schema vary or change?** | Highly variable → document (or relational with JSON columns) |
| 7 | **What latency is needed?** | Sub-millisecond → in-memory key-value as a cache or primary store for ephemeral data |
| 8 | **What can the team operate?** Managed service available? Existing expertise? | Prefer managed, familiar systems unless a requirement rules them out |

### Worked decisions

**Payments ledger.** Access: insert transfers, read balances, audit queries. Relationships: accounts, transfers, users. Consistency: a transfer must atomically debit and credit; no stale balance on withdrawal. Volume: thousands of writes/s. → **Relational database** (PostgreSQL) with transactions, constraints and synchronous replication. Scale reads with replicas; partition by account range only if needed.

**Chat messages.** Access: append a message; read the latest N of one conversation; rarely anything else. Relationships: minimal within the message store. Consistency: per-conversation order matters; slight replica lag is fine. Volume: billions of messages, very high write rate. → **Wide-column store** (Cassandra or similar) partitioned by conversation ID, clustered by time. Users and conversation membership can stay relational.

**Product catalogue.** Access: fetch product by ID; browse by category; full-text search with facets. Shape: attributes differ by category (shoes have sizes, laptops have RAM). → **Document store or relational with JSON attributes** as the source of truth, plus a **search engine** (Elasticsearch/OpenSearch) fed from it for search and facets, plus a cache for hot products.

**Session store / rate limits / leaderboards.** Access: key lookup, increment, sorted top-N. Data is small and ephemeral. → **In-memory key-value store** (Redis), with persistence or replication as needed.

**Social graph recommendations.** Access: multi-hop traversals ("friends of friends who follow X"). → **Graph database**, or precomputed results in a key-value store if traversal patterns are fixed.

**Analytics on all orders.** Access: aggregations over billions of rows, ad-hoc. → **Columnar data warehouse**, fed from the operational databases — never run heavy analytics on the primary OLTP database.

### Polyglot persistence

Real systems use several stores, each for what it does best — the photo app keeps users, photos, likes and follows in PostgreSQL, preferences and behaviour events in a document store, sessions and hot data in Redis, images in object storage, and search in OpenSearch. The cost is more to operate and **keeping copies in sync**, usually by publishing changes from the source of truth as events ([Event-Driven Architecture](../../messaging/event-driven-architecture/content.md)). Every extra store must earn its place.

**Think about it:** an interviewer asks "Why not just use NoSQL because it scales?" for a photo app with 10 million users. How do you answer?

<details>
<summary>Answer</summary>

"The core data — users, photos, likes, follows — is relational and the feed and profile queries need secondary indexes and joins. At about 25 metadata writes per second and reads served mostly by caches and replicas, one PostgreSQL primary is far from its limits. What exactly would stop SQL here? If a specific high-volume piece appears, such as an activity-event stream with no relationships, that part can go to a NoSQL store."

</details>

## What Can Fail

- **Choosing by hype or résumé** — then fighting the data model on the main query.
- **Ignoring operations** — a self-hosted distributed database with nobody who can run it.
- **One store for everything** — forcing search, analytics and transactions into one system that does one well.
- **Too many stores** — each with its own backups, upgrades, monitoring and sync bugs.

## Comparison

| Need | Strong default |
|------|----------------|
| Transactions, relationships, flexible queries | Relational (PostgreSQL, MySQL) |
| Massive writes, query by key and time | Wide-column (Cassandra, ScyllaDB, Bigtable) |
| Variable-shape records read as a whole | Document (MongoDB) or relational + JSON |
| Sub-millisecond key access, ephemeral data | In-memory key-value (Redis) |
| Multi-hop relationships | Graph (Neo4j) |
| Full-text search, relevance, facets | Search engine (Elasticsearch/OpenSearch) |
| Large files | Object storage (S3) |
| Analytics over huge history | Columnar warehouse (BigQuery, Redshift, ClickHouse) |

## Common Traps

> [!WARNING]
> **Common trap:** "Structured data → SQL, unstructured → NoSQL" as the whole answer. It ignores access patterns, consistency, scale and operations — the factors interviewers actually probe.

## Interview Follow-up

- *"Which database would you use?"* Answer with the access patterns, consistency needs and scale first, then the choice, then what you give up: "PostgreSQL, because …; we give up easy write scaling, which we don't need below roughly X writes/s."

## Key Takeaways

- Decide from access patterns, relationships, consistency, read/write volume, size, schema variability, latency and operations — in that order.
- Relational is the safe default for related, transactional data; specialised stores win for their specific patterns.
- Polyglot persistence is normal; keep one source of truth and sync the rest with events.
- State what the choice gives up.
