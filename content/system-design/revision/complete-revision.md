# Complete Revision

Every module of System Design in one place, in learning order. Each section summarises its module's lessons; open the module in Learn mode to revisit details.

## 1. Foundations

- **System design** = choosing components and how they connect so a system meets its goal and its quality targets (scale, latency, availability, cost) as it grows. The same code must work for 10 users and 10 million.
- **Scale in order:** make the work cheaper (queries, algorithms) → bigger machine (vertical) → more machines (horizontal, needing a load balancer, stateless servers and shared data). Every fix creates a new problem — name it.
- **HLD vs LLD:** components, data flow and trade-offs vs classes, functions and data structures. State your altitude first.
- **Requirements:** functional = what it does; non-functional = how well, with numbers. Components exist to meet non-functional requirements, and those requirements conflict (speed, availability and consistency all cost).
- **Clarify first:** users and growth, read/write mix, what must never be lost, latency per path, cost. Assume explicitly when answers are missing.
- **Estimation:** DAU × actions ÷ 86,400 ≈ RPS; × peak factor; storage = items × size × retention × replicas; bandwidth in bits. Turn each number into a decision.
- **SLI/SLO/SLA:** measurement / target / contract. 99.9 % ≈ 43 min a month; 99.99 % ≈ 4.3 min. Series availability multiplies down; independent redundancy multiplies failure down. Error budget = 1 − SLO.
- **Data- vs compute-intensive:** time lost moving data → indexes, caches, replicas, partitions; time lost calculating → algorithms, parallel workers, GPUs, queues.
- **Building blocks:** client, DNS, load balancer, app servers/APIs, database, cache, object storage, CDN, queue, monitoring. Sync when the caller needs the answer now; async when it can wait.
- **Monolith → modular monolith → microservices:** split for independent scaling, isolation or team autonomy — never for fashion; microservices cost network failures, distributed data and operations.
- **Stateless services** keep state in shared stores or tokens, so any instance serves any request; sticky sessions are a workaround with uneven load and lost sessions.

## 2. Communication and APIs

- **Request journey:** client → DNS → load balancer → app server → cache → database → back, images from a CDN. Latency adds across hops; availability multiplies. Latency (round trip) ≠ bandwidth (pipe width); most slowness is round trips.
- **DNS:** resolver → root → TLD → authoritative; cached for the TTL. Short TTLs for failover; DNS routing is coarse (geo, weighted, health-checked).
- **Connections:** IP finds the machine, port the process, the 4-tuple the connection. Handshakes cost round trips — reuse connections, pool them; every layer has connection limits.
- **HTTP(S):** stateless request/response; GET/PUT/DELETE idempotent, POST not; TLS usually terminated at the edge, re-encrypted where required; HTTP/2 multiplexes, HTTP/3 runs on QUIC.
- **REST design:** plural nouns + methods; PUT replaces, PATCH modifies; path for identity, query for filter/sort/page, body for data and secrets; precise status codes (201, 204, 401 vs 403, 409, 429, 503); objects not bare arrays.
- **Evolving APIs:** add fields freely; version for breaking changes with deprecation. Cursor pagination for large or changing lists; whitelist and index filters; cap page sizes.
- **Rate limiting:** token bucket (bursts + average), leaky bucket (smooth), fixed window (boundary bursts), sliding window (accurate). Shared atomic counters across gateways; decide fail-open vs fail-closed; 429 + Retry-After.
- **API styles:** REST (public, cacheable), SOAP (legacy XML), GraphQL (client-shaped queries; watch caching and N+1), gRPC (binary, HTTP/2, internal).
- **Real-time:** polling (simple, wasteful), long polling, SSE (one-way push), WebSockets (two-way). Persistent connections need a registry, cross-server routing, least-connections balancing, heartbeats and reconnect with jitter.
- **Proxies:** forward acts for clients; reverse for servers; a load balancer is a reverse proxy; an API gateway adds auth, rate limits, routing and aggregation — keep it thin and redundant.
- **CDN:** edge caches near users; pull vs push; control with Cache-Control, ETag and versioned URLs; never cache personalised responses publicly.
- **Service discovery:** registry of healthy instances; client- or server-side; Kubernetes Services provide it.

## 3. Data and Storage

- **Access patterns first**, then data shape, then technology. The most frequent complex query (often a feed) drives the design. Files to object storage; relationships are pairs of IDs; denormalise hot reads deliberately.
- **Relational:** tables, keys, constraints, joins, ACID transactions; reads scale with replicas and caches, writes bound to one primary until sharding.
- **NoSQL families:** key-value (lookups), document (aggregates of varying shape), wide-column (partition + clustering, huge write volume), graph (multi-hop relationships). Model per query. Columnar warehouses are for analytics.
- **Choosing a database:** access patterns → relationships → consistency → volume → size → schema variability → latency → operations; state what you give up. Polyglot persistence is normal; one source of truth, sync the rest by events.
- **Indexes:** avoid full scans; derive from filter/join/sort columns; composite order matters; every index slows writes; fix indexes before caching.
- **Connections:** pool them; size by Little's law; total = instances × pool; use PgBouncer; common bottlenecks are bad queries, N+1, exhaustion, hot rows, long transactions.
- **Object storage:** cheap, durable, HTTP; presigned (multipart) uploads; process on events; serve via CDN; storage classes and lifecycle rules.
- **Search:** inverted indexes, analysis and relevance; Elasticsearch/OpenSearch fed asynchronously from the source of truth.

## 4. Caching

- Caches keep hot, rarely changing, expensive data close; hit ratio drives latency and backend load (95 % → 90 % doubles database reads).
- **Read patterns:** cache-aside (app loads on miss) and read-through (cache loads). On write: update the database, then delete the key.
- **Write strategies:** write-through (fresh, slower writes), write-around (skip cache on write), write-back (fastest, may lose unflushed writes).
- **Invalidation:** TTL (bounded staleness) and active invalidation (fresh); keep a TTL as safety net; never trust stale permissions; cache small referential objects.
- **Eviction:** LRU default (hash map + doubly linked list), LFU resists scans, FIFO simple, MRU for sequential access; measure on real traffic.
- **Failure modes:** stampede (coalesce, serve stale, jitter, pre-warm), penetration (negative caching, Bloom filters), hot keys (local caches, key replicas).
- **Distributed caches:** local vs shared vs two-level; consistent hashing or hash slots; replicas with async failover; Redis vs Memcached.

## 5. Scaling and Distribution

- **Load balancers** choose healthy servers; L4 (connections) vs L7 (requests, routing); active + passive health checks; draining; redundant balancers.
- **Algorithms:** round robin, weighted (proportional), least connections (long-lived), least response time, hashing (affinity), geo, power of two choices.
- **Replication:** one primary for writes, replicas for reads and failover; lag → eventual consistency and read-your-writes routing; failover can lose async writes; guard split brain; replication ≠ backup.
- **Sync vs async:** sync = no loss, slow and fragile; async = fast, lag, possible loss; semi-sync = practical middle.
- **Multi-leader and leaderless:** local writes and no failover, but conflicts (LWW, merges, CRDTs); read repair, hinted handoff, anti-entropy.
- **Quorums:** W + R > N for overlapping reads; tolerate N − W / N − R failures; not full linearizability.
- **Sharding:** range, hash, directory, geo; good keys spread load and keep frequent queries on one shard; cross-shard queries, joins, transactions and resharding get hard — shard late.
- **Hotspots and resharding:** split hot keys, dedicated shards; many logical partitions or consistent hashing; local vs global secondary indexes.
- **Consistent hashing:** ring of hash values, next node clockwise, ~1/N keys move, virtual nodes for balance.
- **Capacity planning:** target 60–70 % at peak, survive a zone loss, Little's law, USE method, load tests; the bottleneck moves after each fix.

## 6. Consistency and Coordination

- **CAP:** during a network partition choose consistency (refuse) or availability (answer, maybe stale); CA = not distributed; choose per feature. **PACELC:** else latency vs consistency.
- **Consistency models:** linearizable → sequential → causal → read-your-writes / monotonic reads → eventual. Strong where a stale read causes a wrong decision; session guarantees fix most user-visible anomalies.
- **Locks and leader election:** leases with expiry; fencing tokens at the resource; consensus systems (etcd, ZooKeeper) for correctness; prefer idempotency and conditional writes.
- **Distributed transactions:** avoid 2PC across services; sagas with compensations (choreographed or orchestrated); transactional outbox for reliable events.

## 7. Reliability and Resilience

- **Faults vs failures:** hardware faults are random (redundancy); software and human faults are correlated (gradual rollouts, automation, rollback). Find SPOFs along every path.
- **Redundancy and HA:** active-passive vs active-active; spread across zones; keep spare capacity; automate and test failover; prevent split brain.
- **Timeouts, retries, backoff, jitter:** timeouts on every call from the latency budget; retry transient errors of idempotent operations, capped, with jitter; retries multiply into storms.
- **Circuit breakers, bulkheads, fallbacks:** fail fast when a dependency is broken, isolate resources, serve cheap fallbacks; stop cascading failures.
- **Idempotency:** timeouts are ambiguous; client-generated idempotency keys stored atomically; idempotent consumers.
- **Graceful degradation and load shedding:** protect the core, turn off optional features, reject excess early (503/429), bound queues.
- **DR:** RPO (data loss) and RTO (downtime); point-in-time backups, 3-2-1, immutable copies, restore tests; backup-restore → pilot light → warm standby → active-active.

## 8. Messaging and Event-Driven Systems

- **Queues** decouple, buffer and retry async work; ack after processing → at-least-once → idempotent consumers; DLQ for poison messages.
- **Queue vs pub/sub:** one consumer per message vs every subscriber; fan-out to per-service queues or consumer groups.
- **Delivery semantics:** at-most-once (may lose), at-least-once (may duplicate), exactly-once effect via idempotency or transactions.
- **Ordering:** per partition by key; partitions cap consumer parallelism; retries and repartitioning break order.
- **DLQ and retry queues:** delayed retries for transient errors, DLQ for permanent ones, alert and redrive.
- **Backpressure:** queues absorb bursts not sustained overload; scale, bound, slow producers or shed.
- **Kafka vs RabbitMQ:** replayable partitioned log vs routing broker for tasks.
- **Event-driven architecture:** events (facts) vs commands; choreography vs orchestration; plan for eventual consistency, outbox, duplicates, schema evolution and tracing.

## 9. Observability and Operations

- **Metrics, logs, traces:** what and how much / exact events / where across services; structured logs with trace IDs; avoid high-cardinality labels.
- **Percentiles:** P50 typical, P95/P99 tail; averages lie; never average percentiles; fan-out makes tails common.
- **Tracing:** spans in a trace, context in `traceparent`, sampling (tail-based keeps errors), find the slow hop.
- **Monitoring and alerting:** golden signals (latency, traffic, errors, saturation), RED and USE; page on user-facing symptoms and SLO burn; runbooks; blameless reviews.

## 10. Case Studies

- **URL shortener:** tiny writes, huge repetitive reads; base-62 codes (counter ranges, random + unique key, or hash); cache-aside with hot-key and penetration protection; 301 vs 302; async click analytics.
- **Photo sharing:** grow failure by failure — load balancer, stateless + Redis sessions, object storage + Postgres, indexes, cache + CDN, replicas + backups, shards; hybrid feed fan-out (push for most, pull for celebrities).
- **Video streaming:** presigned multipart upload → queue → chunk-parallel transcoding into a bitrate ladder → segments + HLS/DASH manifests → object storage → CDN → ABR players.
- **Chat:** WebSocket gateways + connection registry; persist before ack; client message IDs for idempotent sends; per-conversation sequence numbers; wide-column storage by conversation; small groups fan out on write; throttled presence.
