# Decision Cheat Sheets

Fast decision tables for the choices that come up in almost every design. Each row is "if this, then that — because". The lessons give the full reasoning.

## Storage

| If the data… | Choose | Because |
|--------------|--------|---------|
| Is relational, needs joins, constraints, multi-row transactions | Relational DB | ACID, flexible queries, integrity |
| Is looked up only by key, very fast, ephemeral | In-memory key-value (Redis) | Sub-millisecond, simple |
| Is appended at huge volume and read by key + time range | Wide-column store | Partitioned writes, ordered partitions |
| Varies in shape and is read/written as a whole | Document store (or relational + JSON) | Flexible aggregates |
| Is about multi-hop relationships | Graph DB | Traversals without self-joins |
| Needs full-text search, relevance, facets | Search engine, fed from the source | Inverted index |
| Is a large file | Object storage + CDN | Cheap, durable, HTTP |
| Is analytics over all history | Columnar warehouse | Scans few columns fast |

## Caching

| Question | Answer |
|----------|--------|
| What to cache? | Read often, changed rarely, expensive, small |
| Where? | Static/public bytes → CDN; hot DB reads → Redis; tiny hot keys → local in-process (short TTL) |
| Read pattern? | Cache-aside by default; read-through to centralise loading |
| Write pattern? | Fresh after write → write-through; rarely re-read writes → write-around; bursty counters → write-back |
| Freshness? | Feeds/trending → TTL; edited content → invalidate + TTL; permissions → don't trust cache |
| Eviction? | LRU default; LFU if scans pollute; measure |
| Hot key? | Local cache + key replicas + coalescing |
| Missing keys hammered? | Negative cache + Bloom filter + rate limit |

## Communication

| Need | Choose |
|------|--------|
| Public API, broad clients | REST + JSON |
| Internal service-to-service, low latency | gRPC |
| Many client types needing different shapes | GraphQL or a backend-for-frontend |
| Server pushes one-way updates | Server-Sent Events |
| Two-way real-time (chat, games, collaboration) | WebSockets |
| Rare updates | Plain requests / slow polling |
| Work that can happen later | Queue (async) |
| Caller needs the answer now | Synchronous call with timeout |

## Load balancing

| Situation | Algorithm |
|-----------|-----------|
| Identical servers, short uniform requests | Round robin |
| Mixed server sizes | Weighted round robin / weighted least connections |
| Long-lived or uneven connections (WebSockets) | Least connections |
| Latency-sensitive, heterogeneous backends | Least response time |
| Same key → same server (cache locality) | Consistent hashing |
| Global users | Geo DNS / global load balancer, then regional LBs |
| Need path or header routing | L7; raw TCP/UDP or max throughput → L4 |

## Data distribution and consistency

| Problem | Move |
|---------|------|
| Too many reads | Cache, then read replicas |
| Too much data or too many writes | Shard (after everything else) |
| Users don't see their own writes | Read-your-writes routing to the primary |
| Must not lose acknowledged writes on failover | Semi-synchronous replication |
| Writable in every region | Multi-leader/leaderless + conflict strategy |
| Need fresh reads in a leaderless store | W + R > N |
| Adding nodes moves too much data | Consistent hashing or fixed logical partitions |
| Stale read would cause a wrong decision | Strong consistency for that operation |
| Exactly one worker must act | Lease + fencing token, or make it idempotent |
| Atomic change across services | Saga + outbox (not 2PC) |

## Reliability

| Situation | Move |
|-----------|------|
| Any network call | Timeout from the latency budget |
| Transient failure of an idempotent call | Retry with capped exponential backoff + jitter |
| Non-idempotent operation retried | Idempotency key |
| Dependency keeps failing | Circuit breaker + fallback |
| One dependency can starve others | Bulkhead |
| Load above capacity | Shed early (503/429), degrade optional features |
| Producers faster than consumers | Scale consumers, bound queues, slow producers, shed low-value work |
| Message keeps failing | Delayed retries, then DLQ + alert |
| Need to survive a region loss | DR strategy chosen by RPO/RTO |

## Disaster recovery strategy

| RPO / RTO needed | Strategy |
|------------------|----------|
| Hours / hours–day, lowest cost | Backup and restore |
| Minutes / tens of minutes | Pilot light |
| Seconds–minutes / minutes | Warm standby |
| ~0 / ~0 | Multi-site active-active |

## Short-code (ID) generation

| Need | Choose |
|------|--------|
| Shortest codes, no collisions | Counter ranges per server + base 62 |
| Unguessable codes | Random base-62 + unique key, retry on conflict |
| Same URL → same code | Hash prefix + collision handling |
| Time-ordered unique IDs everywhere | Snowflake-style (time + machine + sequence) |
