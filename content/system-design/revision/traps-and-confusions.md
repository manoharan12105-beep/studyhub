# Traps and Confusions

Pairs people mix up, and statements that sound right but are wrong. For full answers see the interview traps bank.

## Pairs People Mix Up

| Pair | The difference |
|------|----------------|
| Latency vs bandwidth | Round-trip time vs pipe width |
| Latency vs throughput | Time per request vs requests per second |
| Availability vs reliability | Responding vs responding correctly and keeping data safe |
| High availability vs fault tolerance | Brief interruption on failover vs no interruption |
| Fault vs failure | One component misbehaving vs the system failing users |
| SLI vs SLO vs SLA | Measurement vs target vs contract |
| 401 vs 403 | Not authenticated vs authenticated but not allowed |
| PUT vs PATCH | Replace all vs change some |
| Forward vs reverse proxy | Acts for clients vs acts for servers |
| Load balancer vs API gateway | Distributes traffic vs adds API concerns (auth, limits, routing) |
| CDN vs cache | Edge HTTP cache near users vs data cache near the app |
| Index vs cache | Faster finding inside the DB vs skipping the DB |
| TTL vs invalidation | Expire after time vs delete on change |
| Replication vs backup | Live copies (copy mistakes) vs point-in-time copies |
| Replication vs sharding | All data on each node vs part of the data on each node |
| Sync vs async replication | Wait for replicas vs acknowledge first |
| Strong vs eventual consistency | Always latest vs converges later |
| CAP consistency vs ACID consistency | Linearizability vs constraints preserved |
| P in CAP vs partitioning | Network split vs sharding data |
| Queue vs pub/sub | One consumer per message vs every subscriber |
| Event vs command | Fact that happened vs request to act |
| At-least-once vs exactly-once | May duplicate vs effect once (via idempotency) |
| Circuit breaker vs retry | Stops calls vs repeats calls |
| RPO vs RTO | How much data lost vs how long down |
| Average vs P99 | Sum ÷ count vs the slow tail |
| Monolith vs distributed monolith | One deployable vs many services that still must deploy together |

## Statements That Sound Right but Are Wrong

| Trap | Precise truth |
|------|---------------|
| "Pick any two of C, A, P" | During a partition choose C or A; CA = not distributed |
| "Replicas are our backup" | Replicas copy deletes and corruption instantly |
| "NoSQL scales, SQL doesn't" | Both scale; choose by access patterns and consistency |
| "More servers = more throughput" | Only if servers are the bottleneck |
| "Write-around = read-through + write-through" | Write-around skips the cache on writes |
| "Least connections gives sticky sessions" | It balances by open connections; hashing gives stickiness |
| "Weighted RR sends traffic to the biggest server" | Proportional shares |
| "Quorum = majority" | General rule W + R > N |
| "Consistent hashing assigns ID ranges" | It assigns ranges of hash values |
| "Kafka guarantees order" | Per partition only |
| "The broker gives exactly-once, so no dedup needed" | External side effects still need idempotency |
| "Retries always help" | Unbounded retries cause storms; need idempotency |
| "Bigger queue fixes overload" | Only bursts; sustained overload needs backpressure |
| "Eventual consistency loses data" | It delays visibility; it doesn't lose acknowledged writes |
| "Hash partitioning prevents hotspots" | A single hot key still overloads one shard |
| "Health checks should test every dependency" | Shared dependency failure then removes every instance |
| "HTTPS makes the API secure" | It protects transport only |
| "A cache can't break correctness" | Stale data, stampedes, cache-loss overload |
| "Average latency is enough" | Use percentiles; never average percentiles |
| "Microservices are more scalable" | They scale parts independently, at a cost |
| "Shard when the DB is slow" | Shard last, after queries, indexes, caches, replicas |
| "Videos stream over RTMP" | Playback is HLS/DASH over HTTP; RTMP is for ingest |
| "13 root DNS servers" | 13 identities, 12 operators, 1,000+ anycast instances |
| "A Redis lock guarantees mutual exclusion" | Pauses and failover break it; use fencing |
| "Use 2PC across microservices" | Use sagas and the outbox |
| "Rate-limit by IP" | Users share IPs; limit by identity |
| "DNS balancing = load balancer" | Cached, coarse, slow to react |
| "Server talks to a DB, so it's stateful" | Statefulness is about what the server remembers |

## Interview Habits That Cost Points

- Drawing before asking questions or estimating.
- Adding components without a requirement behind them.
- Estimating and never using the numbers.
- Ignoring single points of failure and failure behaviour.
- Saying "it depends" without deciding and naming the deciding condition.
- Spending the whole interview on one component.
