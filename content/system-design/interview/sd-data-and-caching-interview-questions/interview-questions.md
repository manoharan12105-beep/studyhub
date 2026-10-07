# Interview Questions: Data and Caching — Interview Questions

## Beginner

### Q1. You are designing a food-delivery app. Which data goes in which store?

**Style:** Design

<details>
<summary>Answer</summary>

Orders, payments, users and restaurants in a relational database (transactions, relationships); menus cached in Redis and images in object storage behind a CDN; drivers' live locations in an in-memory store with geo indexing (overwritten every few seconds); restaurant search in a search engine; order events in a queue or log for notifications and analytics; analytics in a warehouse.

</details>

### Q2. What does "read-heavy" imply for the design of the data layer?

**Style:** How

<details>
<summary>Answer</summary>

Invest in the read path: caches (application and CDN), read replicas, denormalised or precomputed views (feeds, counters), and indexes matching read patterns. Writes can stay on a single primary for a long time.

</details>

### Q3. Is it acceptable to store JSON in a relational database?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Yes, for attributes that vary between records or are read and written as a unit — PostgreSQL's JSONB can even be indexed. Keep fields you filter, join or constrain on as proper columns, because JSON fields lose type checks, constraints and some query efficiency.

</details>

### Q4. Why might a cache make a correct system incorrect?

**Style:** Why

<details>
<summary>Answer</summary>

Because the cache is a second copy that can be stale: if a decision (stock available, user permitted, price) is made from cached data that changed in the source, the system acts on wrong information. Make critical decisions against the source of truth and use caches for display data, with explicit freshness rules.

</details>

### Q5. What is a hot key, and why can't sharding the cache fix it?

**Style:** Direct

<details>
<summary>Answer</summary>

A single key receiving a disproportionate share of requests (a viral post). Sharding spreads different keys across nodes, but one key still lives on one node, which becomes overloaded. Local in-process caching, replicating the key under several suffixes, and read replicas fix it.

</details>

### Q6. Where do you store a user's uploaded profile picture, and what goes in the database?

**Style:** Direct

<details>
<summary>Answer</summary>

The image file in object storage (uploaded via a presigned URL and served through a CDN); the database row stores the object key and metadata such as size and upload time, not the bytes.

</details>

## Intermediate

### Q7. A product listing page runs a 12-table join on every view and takes 900 ms. What do you do?

**Style:** Debugging

<details>
<summary>Answer</summary>

First check the query plan and indexes, and whether all joins are needed. Then precompute: denormalise the listing into a read model (a materialised view or a document per product updated on changes), and cache the rendered result or the read model in Redis with invalidation on product updates. The page then reads one cached object in milliseconds.

</details>

### Q8. Cache-aside vs write-through for a user profile service — which and why?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Cache-aside is the usual default: profiles are read far more than written, misses fall back to the database, and the cache holds only profiles that are read. On updates, write the database then delete the cache key. Write-through is reasonable if profiles are read immediately after every update and you want no miss after writes, accepting slower writes and caching some profiles nobody reads.

</details>

### Q9. How do you size a Redis cache?

**Style:** How

<details>
<summary>Answer</summary>

Estimate the hot set: how many distinct keys receive most reads in the TTL window, times average entry size (key, value and overhead, often roughly 1.5–2× the raw value), plus headroom and replication. For example 10 million hot products × 2 KB ≈ 20 GB, doubled for overhead and replicas. Then validate with the observed hit ratio and eviction rate.

</details>

### Q10. Why is "SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 20" slow on a 500-million-row table, and how do you fix it?

**Style:** Debugging

<details>
<summary>Answer</summary>

Without a suitable index, the database scans and sorts many rows. A composite index on `(customer_id, created_at DESC)` lets it jump to that customer's rows already in order and read 20 entries. Also avoid `SELECT *` if only some columns are needed (a covering index can then answer from the index alone).

</details>

### Q11. A team proposes Elasticsearch as the only database for an e-commerce site. What concerns do you raise?

**Style:** Trap

<details>
<summary>Answer</summary>

Search engines lack multi-document transactions and relational constraints needed for orders, payments and inventory; mapping changes often require reindexing; and recently acknowledged writes may be exposed to loss in some failure modes depending on configuration. Keep authoritative data in a database and feed Elasticsearch asynchronously for search.

</details>

### Q12. Explain how a cache stampede can take down a database, and how to stop it.

**Style:** What happens if

<details>
<summary>Answer</summary>

A hot entry expires and hundreds of concurrent requests miss simultaneously, each running the same expensive query; the database slows, requests pile up, and the cache can't be refilled. Stop it with single-flight/request coalescing, serving stale data while one request refreshes, early probabilistic refresh, TTL jitter and pre-warming.

</details>

### Q13. When would you put data in Redis as the primary store rather than a cache?

**Style:** Scenario

<details>
<summary>Answer</summary>

For ephemeral or reconstructible data where speed matters and occasional loss is acceptable or mitigated: sessions, rate-limit counters, leaderboards (sorted sets), presence, short-lived OTPs, job queues with persistence enabled. Not for data whose loss would be a business problem, unless persistence and replication are configured and understood.

</details>

### Q14. How do you keep a search index consistent with the database?

**Style:** How

<details>
<summary>Answer</summary>

Treat the database as source of truth; publish changes reliably (transactional outbox or change data capture), consume them with idempotent indexers that upsert by document ID and version, accept seconds of lag, reconcile periodically and support full reindexing from the database.

</details>

### Q15. LRU or LFU for a CDN-like cache of product images?

**Style:** Trade-off

<details>
<summary>Answer</summary>

LRU adapts quickly to changing popularity (new products, campaigns) and is the common default; LFU better protects consistently popular items from one-off bursts like crawlers. Many caches use hybrids (segmented LRU, W-TinyLFU) to get recency adaptation with frequency protection. Measure the hit ratio on real traces.

</details>

## Advanced

### Q16. Design storage for a social network's "follow" graph with 500 million users.

**Style:** Design

<details>
<summary>Answer</summary>

Store edges in a partitioned store with two tables (or indexes): `following(follower_id → followee_id)` and `followers(followee_id → follower_id)`, each partitioned by its first column so both "whom I follow" and "who follows me" are single-partition reads; write both on follow (via an outbox or a transaction where supported). Cache hot users' follower counts. Celebrities' follower partitions are huge — page through them and avoid fan-out on write for them. A graph database helps only if multi-hop queries are central.

</details>

### Q17. Your cache hit ratio dropped from 95 % to 60 % after a deployment. List possible causes.

**Style:** Debugging

<details>
<summary>Answer</summary>

Changed cache key format (old entries never reused), a new parameter included in keys (per-user or per-request values), reduced TTLs, cache cluster resized with modulo hashing (most keys remapped), a cold restart, more memory per entry causing evictions, a new code path bypassing the cache, or a traffic pattern change such as a crawler. Compare key distributions and eviction metrics before and after.

</details>

### Q18. How do you avoid serving stale permissions from a cache?

**Style:** Design

<details>
<summary>Answer</summary>

Don't make authorisation decisions from long-lived cached copies: check permissions against the source of truth (or a strongly consistent permission service), or cache them only with active invalidation on every change (broadcast to local caches) plus a very short TTL safety net, and use versioned keys tied to the user's permission version.

</details>

### Q19. When is denormalisation worth its cost?

**Style:** Trade-off

<details>
<summary>Answer</summary>

When a read is very frequent and expensive to assemble (joins, counts, aggregations) and the duplicated data changes rarely or tolerates brief inconsistency — feed entries, like counts, author names on comments, product listing documents. Keep a normalised source of truth, update copies through events or in the same transaction, and reconcile periodically.

</details>

### Q20. A database's CPU is at 90 % mostly from reads, but adding a read replica barely helped. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

Reads may not actually be routed to the replica (the application sends everything to the primary, or read-your-writes routing is too broad), the expensive work may be writes or a few unindexed queries, the replica may lag and be removed from the pool, or the load balancer for reads may favour the primary. Verify routing and query statistics before adding more replicas.

</details>

### Q21. Choose a database for an IoT platform storing temperature readings from 2 million devices every 10 seconds, queried by device and time range.

**Style:** Design

<details>
<summary>Answer</summary>

200,000 writes/s of small, append-only time-stamped rows queried by device and time range: a wide-column store (partition by device and day, cluster by time) or a time-series database with compression and downsampling. Keep device metadata relational; roll up old data into aggregates and expire raw data by TTL; stream to a warehouse for analytics.

</details>

### Q22. How would you model and cache a leaderboard of the top 100 players among 50 million?

**Style:** Design

<details>
<summary>Answer</summary>

A Redis sorted set keyed by score gives O(log n) updates and fast top-N and rank queries; persist scores in a durable store as the source of truth and rebuild the sorted set if lost. For extreme write rates, shard by score range or region and merge top-Ns, or update the leaderboard from aggregated score events every few seconds.

</details>
