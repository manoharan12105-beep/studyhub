# Block 3: Data and Caching

Block 3 of 6, about ten minutes.

## 1. Choosing Storage (4 min)

- **Access patterns → data shape → technology.** The most frequent complex query (the feed) drives the design.
- Relational: joins, constraints, ACID; one primary for writes. Key-value: lookups. Document: varying aggregates. Wide-column: huge append + key/time reads. Graph: multi-hop. Search engine: text. Object storage: files. Warehouse: analytics.
- Decide with: access patterns · relationships · consistency · volume · size · schema variability · latency · operations. Say what you give up.
- Polyglot persistence: one source of truth; sync copies with events.
- Indexes before caches; composite column order matters; each index slows writes.
- Pools sized by Little's law; total = instances × pool; PgBouncer. Bottlenecks: bad queries, N+1, exhaustion, hot rows, long transactions.
- Files: presigned (multipart) uploads → object storage → events → workers → CDN.

## 2. Caching (6 min)

- Cache what is read often, changed rarely, expensive, small. Hit ratio drives everything (95 % → 90 % doubles DB reads).
- Cache-aside: app loads on miss; **write DB, then delete key**. Read-through: cache loads.
- Write-through (fresh, slow writes) · write-around (skip cache on write) · write-back (fast, may lose data).
- TTL (bounded staleness) + invalidation (fresh); TTL as safety net; **never decide permissions from stale cache**.
- Eviction: LRU default (hash map + doubly linked list = O(1)); LFU resists scans.
- Stampede → coalesce, serve stale, jitter, pre-warm. Penetration → negative cache, Bloom filter. Hot key → local cache, key replicas.
- Distributed: local vs shared vs two-level; consistent hashing / hash slots; replicas fail over asynchronously; Redis (structures, persistence) vs Memcached (simple, multi-threaded).
