# System Design Interview Traps — Interview Questions

Each question quotes a tempting but wrong (or half-right) statement. Say what is wrong, the precise rule, and why it matters.

## Beginner

### Q1. "CAP means you pick any two of consistency, availability and partition tolerance."

**Style:** Trap

<details>
<summary>Answer</summary>

Partition tolerance is not optional in a distributed system — networks do partition. CAP says that **during a partition** you must choose consistency (refuse or delay requests) or availability (answer, possibly stale). Without a partition you can have both; "CA" just means not distributed. See [CAP](../../consistency-and-coordination/cap-theorem/content.md).

</details>

### Q2. "We have read replicas, so we don't need backups."

**Style:** Trap

<details>
<summary>Answer</summary>

Replicas copy every change — including accidental deletes, corruption and bad migrations — within milliseconds. Backups are independent point-in-time copies for recovering from those. You need both. See [Disaster Recovery](../../reliability/disaster-recovery-rpo-and-rto/content.md).

</details>

### Q3. "Return 401 when a logged-in user isn't allowed to delete a resource."

**Style:** Trap

<details>
<summary>Answer</summary>

401 means not authenticated (no or invalid credentials). A logged-in user lacking permission gets **403 Forbidden** (or 404 to hide the resource's existence). See [REST API Design](../../communication/rest-api-design/content.md).

</details>

### Q4. "NoSQL databases scale and SQL databases don't."

**Style:** Trap

<details>
<summary>Answer</summary>

Relational databases scale reads easily (replicas, caches) and a single primary handles far more writes than most products need; distributed SQL databases scale writes too. NoSQL stores scale specific access patterns horizontally by giving up joins or transactions. Choose from access patterns, consistency and measured scale. See [Choosing a Database](../../data-and-storage/choosing-a-database/content.md).

</details>

### Q5. "Adding more servers always increases throughput."

**Style:** Trap

<details>
<summary>Answer</summary>

Only if the servers are the bottleneck. If a shared database, cache node, lock or downstream service is saturated, more servers add contention and connections, and throughput stays flat or falls. Find the bottleneck first. See [Capacity Planning](../../scaling-and-distribution/capacity-planning-and-bottlenecks/content.md).

</details>

### Q6. "A load balancer is special network hardware."

**Style:** Trap

<details>
<summary>Answer</summary>

Most load balancers are software (Nginx, HAProxy, Envoy, managed cloud services) running on ordinary servers — reverse proxies whose job is distributing traffic. That is also why they must be made redundant like any other server.

</details>

### Q7. "Average latency tells us how fast the service is."

**Style:** Trap

<details>
<summary>Answer</summary>

Averages are distorted by outliers and hide the tail. Use percentiles: P50 for the typical request, P95/P99 for the slow ones users complain about. See [Latency Percentiles](../../observability/latency-percentiles/content.md).

</details>

### Q8. "Our servers talk to a database, so they're stateful."

**Style:** Trap

<details>
<summary>Answer</summary>

Statefulness is about what the server itself remembers between requests. A server that keeps nothing locally and stores everything in external databases or caches is stateless — and that is what makes it easy to scale.

</details>

### Q9. "HTTPS makes the API secure."

**Style:** Trap

<details>
<summary>Answer</summary>

TLS encrypts traffic and authenticates the server. It does nothing about user authentication, authorisation, input validation, rate limiting or compromised servers — all still required.

</details>

### Q10. "PUT and PATCH both update a resource, so they are interchangeable."

**Style:** Trap

<details>
<summary>Answer</summary>

PUT replaces the whole resource (omitted fields are cleared or rejected) and is idempotent; PATCH changes only the fields sent and is idempotent only if the patch is. Using PUT with partial data can wipe fields.

</details>

## Intermediate

### Q11. "Write-around caching is a mix of read-through and write-through."

**Style:** Trap

<details>
<summary>Answer</summary>

Write-around **skips** the cache on writes (writes go only to the database) — the opposite of write-through. It is merely often *paired* with read-through or cache-aside for reads. See [Write Strategies](../../caching/cache-write-strategies/content.md).

</details>

### Q12. "Least connections is the algorithm for sticky sessions."

**Style:** Trap

<details>
<summary>Answer</summary>

Least connections sends new work to the server with the fewest open connections — useful for long-lived or uneven connections. Stickiness comes from hashing (IP or key) or affinity cookies. See [Load-Balancing Algorithms](../../scaling-and-distribution/load-balancing-algorithms/content.md).

</details>

### Q13. "Weighted round robin sends traffic to the most powerful server."

**Style:** Trap

<details>
<summary>Answer</summary>

It sends each server a share **proportional** to its weight — with weights 1:2:3, the servers get 1, 2 and 3 of every 6 requests — not everything to the heaviest.

</details>

### Q14. "A quorum means waiting for more than half of the replicas on reads and writes."

**Style:** Trap

<details>
<summary>Answer</summary>

Majorities are one valid choice, but the general condition is **W + R > N**: then every read overlaps a replica with the latest write. W = N with R = 1 also satisfies it. See [Quorum Reads and Writes](../../scaling-and-distribution/quorum-reads-and-writes/content.md).

</details>

### Q15. "With consistent hashing, each node owns a range of user IDs."

**Style:** Trap

<details>
<summary>Answer</summary>

Each node owns ranges of **hash values** on the ring (usually many small ranges via virtual nodes), not ranges of raw IDs; consecutive IDs are scattered. See [Consistent Hashing](../../scaling-and-distribution/consistent-hashing/content.md).

</details>

### Q16. "Our message broker guarantees exactly-once delivery, so consumers needn't handle duplicates."

**Style:** Trap

<details>
<summary>Answer</summary>

Exactly-once guarantees hold only inside the broker's boundary (for example Kafka transactions between topics). Any external side effect — a database write, an email, a payment — still needs idempotent handling, because redelivery after failures happens. See [Delivery Semantics](../../messaging/delivery-semantics/content.md).

</details>

### Q17. "Kafka guarantees message ordering."

**Style:** Trap

<details>
<summary>Answer</summary>

Only within a partition. Give related messages the same key so they share a partition; across partitions there is no order. See [Ordering and Consumer Groups](../../messaging/message-ordering-and-consumer-groups/content.md).

</details>

### Q18. "Retries make a system more reliable."

**Style:** Trap

<details>
<summary>Answer</summary>

Bounded retries with backoff and jitter on idempotent operations help with transient failures. Unbounded, immediate or multi-layer retries amplify load during an incident (retry storms) and duplicate non-idempotent actions. See [Retries](../../reliability/timeouts-retries-and-backoff/content.md).

</details>

### Q19. "Eventual consistency means data can be lost."

**Style:** Trap

<details>
<summary>Answer</summary>

It means reads may be stale for a while; acknowledged writes are not lost, and replicas converge. Data loss comes from other choices (asynchronous failover, last-write-wins conflict resolution). See [Consistency Models](../../consistency-and-coordination/consistency-models/content.md).

</details>

### Q20. "Hash partitioning eliminates hotspots."

**Style:** Trap

<details>
<summary>Answer</summary>

It spreads different keys evenly, but one very hot key still lands on one shard. Hot keys need caching, key splitting or replicas. See [Hot Partitions](../../scaling-and-distribution/hot-partitions-and-resharding/content.md).

</details>

### Q21. "Make the queue bigger and the overload problem goes away."

**Style:** Trap

<details>
<summary>Answer</summary>

A queue absorbs bursts, not sustained overload. If producers are faster on average, the backlog and latency grow without limit. Scale consumers, slow producers or shed work. See [Backpressure](../../messaging/backpressure/content.md).

</details>

### Q22. "DNS load balancing is as good as a load balancer."

**Style:** Trap

<details>
<summary>Answer</summary>

DNS answers are cached for the TTL, so DNS cannot react to load or failures within seconds and cannot balance individual requests. It is suited to coarse cross-region routing; load balancers handle fine-grained balancing and health. See [DNS in System Design](../../communication/dns-in-system-design/content.md).

</details>

### Q23. "Microservices are more scalable than a monolith."

**Style:** Trap

<details>
<summary>Answer</summary>

A monolith scales horizontally behind a load balancer too. Microservices let you scale parts independently and let teams work independently, at the cost of network failures, distributed data and operational complexity. See [Monolith vs Microservices](../../foundations/monolith-vs-microservices/content.md).

</details>

### Q24. "Rate-limit by IP address to stop abuse."

**Style:** Trap

<details>
<summary>Answer</summary>

Many legitimate users share an IP (corporate and carrier NAT), and attackers rotate IPs. Limit by authenticated identity (user, API key) and use IP limits only as a coarse outer layer. See [Rate Limiting](../../communication/rate-limiting/content.md).

</details>

## Advanced

### Q25. "A Redis lock with an expiry guarantees only one process does the work."

**Style:** Trap

<details>
<summary>Answer</summary>

A holder can pause past its lease while another process takes the lock, and an asynchronous Redis failover can lose the lock key. For correctness, check fencing tokens at the protected resource, use consensus-based locks, or design the work to be idempotent. See [Distributed Locks](../../consistency-and-coordination/distributed-locks-and-leader-election/content.md).

</details>

### Q26. "Use two-phase commit to keep microservices consistent."

**Style:** Trap

<details>
<summary>Answer</summary>

2PC blocks participants holding locks when the coordinator fails, adds latency and makes every participant a dependency of every transaction; many stores don't support it. Microservices use sagas with compensations and the transactional outbox. See [Distributed Transactions](../../consistency-and-coordination/distributed-transactions-and-sagas/content.md).

</details>

### Q27. "Adding redundant components always increases availability."

**Style:** Trap

<details>
<summary>Answer</summary>

Components added **in series** lower availability (multiply). Redundant components in parallel raise it only if failures are independent — not if they share a rack, a zone, a configuration or a buggy release. See [SLA, SLO, SLI](../../foundations/sla-slo-sli-and-availability/content.md).

</details>

### Q28. "Shard the database as soon as it gets slow."

**Style:** Trap

<details>
<summary>Answer</summary>

Sharding is usually the last step: first fix queries and indexes, add caching and read replicas, pool connections, scale vertically. Sharding permanently complicates queries, transactions and operations. See [Sharding](../../scaling-and-distribution/sharding-fundamentals/content.md).

</details>

### Q29. "Video platforms stream to viewers over RTMP."

**Style:** Trap

<details>
<summary>Answer</summary>

Playback today is mostly HLS or MPEG-DASH: segmented files over ordinary HTTP with adaptive bitrate, cacheable by CDNs. RTMP is mainly used to ingest live streams from encoders. See [Video Streaming](../../case-studies/design-video-streaming-platform/content.md).

</details>

### Q30. "There are only 13 DNS root servers, so DNS is fragile."

**Style:** Trap

<details>
<summary>Answer</summary>

There are 13 root server identities (A–M) run by 12 organisations, served by well over a thousand anycast instances worldwide; plus answers are cached at many levels. The root is highly redundant. See [DNS in System Design](../../communication/dns-in-system-design/content.md).

</details>

### Q31. "Health checks should verify every dependency, to be safe."

**Style:** Trap

<details>
<summary>Answer</summary>

If a shared or optional dependency fails, every instance then fails its check and the load balancer removes them all — a self-inflicted total outage. Health checks should reflect whether the instance itself can serve; dependency failures are handled with degradation and alerts.

</details>

### Q32. "A cache can only make things faster, never break them."

**Style:** Trap

<details>
<summary>Answer</summary>

Caches serve stale or wrong data when invalidation fails (deleted content, changed permissions), stampedes overload databases when hot entries expire, and systems sized around a high hit ratio fail when the cache disappears. Plan freshness, stampede protection and cache-failure behaviour. See [Cache Invalidation](../../caching/cache-invalidation-and-ttl/content.md).

</details>

### Q33. "WhatsApp-scale messaging means millions of messages per day."

**Style:** Trap

<details>
<summary>Answer</summary>

Large messaging platforms handle on the order of a hundred billion messages a day. One billion a day is already about 12,000 per second; a hundred billion is over a million per second. Getting the order of magnitude wrong leads to designs a thousand times too small. Estimate carefully. See [Estimation](../../foundations/back-of-the-envelope-estimation/content.md).

</details>
