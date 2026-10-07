# Interview Questions: Scaling and Consistency — Interview Questions

## Beginner

### Q1. Replication or sharding — which solves "the database has too many reads"?

**Style:** Comparison

<details>
<summary>Answer</summary>

Replication (read replicas), together with caching: copies spread read load. Sharding solves too much data or too many writes for one primary; it is costlier and should come later.

</details>

### Q2. What happens to users when a read replica falls 30 seconds behind?

**Style:** What happens if

<details>
<summary>Answer</summary>

Reads served by that replica return data up to 30 seconds old: users may not see their own recent changes, counts may go backwards between refreshes, and decisions based on those reads may be wrong. Monitor lag, remove lagging replicas from the read pool, and route freshness-sensitive reads to the primary.

</details>

### Q3. Why use consistent hashing instead of modulo hashing for a cache cluster?

**Style:** Why

<details>
<summary>Answer</summary>

Modulo hashing remaps most keys whenever the node count changes, causing a mass cache miss and a database surge. Consistent hashing moves only about 1/N of the keys — those in the arc the new or removed node affects.

</details>

### Q4. In one sentence each: CP and AP.

**Style:** Direct

<details>
<summary>Answer</summary>

CP: during a network partition the system refuses or delays some requests rather than return possibly stale data. AP: during a partition every reachable node keeps answering, possibly with stale data, and reconciles afterwards.

</details>

### Q5. What is a hot shard and one way to fix it?

**Style:** Direct

<details>
<summary>Answer</summary>

A shard receiving a disproportionate share of traffic — for example because it holds a celebrity or because sequential keys all land on it. Fixes include a better shard key (hash instead of range), splitting hot keys into sub-keys, caching hot reads, or moving a large tenant to a dedicated shard.

</details>

## Intermediate

### Q6. Why is "choose two of C, A, P" a misleading summary of CAP?

**Style:** Trap

<details>
<summary>Answer</summary>

Network partitions are not optional for distributed systems, so you cannot "choose" to give up P. CAP says that when a partition occurs you must give up either consistency or availability for the affected operations; when there is no partition you can have both. "CA" only describes a non-distributed system.

</details>

### Q7. You have a 5-node leaderless store. Choose W and R for strongly consistent-looking reads that tolerate two failed nodes.

**Style:** Design

<details>
<summary>Answer</summary>

W = 3, R = 3: W + R = 6 > 5, so reads overlap the latest write; both operations still succeed with 2 nodes down (5 − 3 = 2).

</details>

### Q8. How does read-your-writes differ from strong consistency?

**Style:** Comparison

<details>
<summary>Answer</summary>

Read-your-writes only guarantees that a client sees its own previous writes; other clients may still see stale data. Strong (linearizable) consistency guarantees every client sees the latest completed write. Read-your-writes is much cheaper — route a user's own reads to the primary after a write.

</details>

### Q9. Why is two-phase commit rarely used between microservices?

**Style:** Why

<details>
<summary>Answer</summary>

It blocks participants holding locks if the coordinator fails, adds multiple round trips per transaction, requires every participant to be available, and many stores and brokers don't support it. Sagas with compensations and the outbox pattern give eventual atomicity without distributed locks.

</details>

### Q10. Least connections or round robin for a fleet of identical stateless REST servers?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Either works when requests are short and uniform; round robin is simplest. If request durations vary a lot (some slow endpoints), least connections (or least outstanding requests) adapts better by sending new work to less busy servers.

</details>

### Q11. What problem do fencing tokens solve?

**Style:** Direct

<details>
<summary>Answer</summary>

A client holding a lease-based lock can pause (GC, VM freeze) past the lease's expiry, while another client acquires the lock. When the first resumes, both act as lock holders. Monotonically increasing fencing tokens, checked by the protected resource, reject the stale holder's writes.

</details>

### Q12. How do you shard a multi-tenant SaaS database where tenant sizes vary enormously?

**Style:** Design

<details>
<summary>Answer</summary>

Shard by tenant ID so each tenant's queries stay on one shard, using a directory (lookup table) rather than pure hashing so huge tenants can be placed on dedicated shards and small tenants packed together; move tenants between shards online when they grow.

</details>

### Q13. A primary database fails and a replica is promoted. What can be lost, and how do you limit it?

**Style:** What happens if

<details>
<summary>Answer</summary>

With asynchronous replication, writes acknowledged by the old primary but not yet replicated are lost. Limit it with semi-synchronous replication (at least one replica confirms before ack), choosing the most up-to-date replica for promotion, and fencing the old primary to avoid split brain.

</details>

### Q14. How would you implement a distributed lock for a once-a-night billing job?

**Style:** Design

<details>
<summary>Answer</summary>

Acquire a lease in a consensus-backed store (etcd, ZooKeeper, a Kubernetes lease) with a TTL longer than a heartbeat interval, renew while running, and release at the end; make the job idempotent (record per-account billing for the date with a unique constraint) so an accidental double run cannot double-bill, and use the lease's revision as a fencing token if it writes to shared resources.

</details>

## Advanced

### Q15. Design a globally available shopping cart that keeps working during regional outages.

**Style:** Design

<details>
<summary>Answer</summary>

Use an AP, multi-region replicated store for carts (leaderless or multi-leader), modelling the cart so concurrent edits merge — for example an observed-remove set of items with quantities — rather than last-write-wins, so items are not silently lost. At checkout, validate stock and prices against strongly consistent services in the order's home region.

</details>

### Q16. Why can quorum reads still return stale data?

**Style:** Trap

<details>
<summary>Answer</summary>

Sloppy quorums let writes land on substitute nodes during failures, breaking the overlap until hinted handoff completes; concurrent writes resolved by timestamps can discard the newer one under clock skew; partially failed writes may survive on some replicas; and restores from old data can reintroduce stale versions. Quorums are strong but not full linearizability.

</details>

### Q17. How would you add shards to a live database without downtime?

**Style:** How

<details>
<summary>Answer</summary>

Use many logical partitions mapped to physical nodes (or consistent hashing) so only some data moves; for each moving partition, copy existing data, stream ongoing changes (CDC or dual writes), verify, switch routing atomically, and clean up — throttled to protect production traffic, with the ability to roll back.

</details>

### Q18. Explain PACELC with an example of each side.

**Style:** Direct

<details>
<summary>Answer</summary>

If there is a Partition, choose Availability or Consistency; Else choose Latency or Consistency. A Dynamo-style store with low consistency levels is PA/EL: available during partitions and fast normally, with eventual consistency. A consensus-based store such as etcd is PC/EC: it refuses minority-side requests during partitions and pays quorum latency normally to stay consistent.

</details>

### Q19. You need unique, roughly time-ordered IDs generated on 200 servers without a central bottleneck. How?

**Style:** Design

<details>
<summary>Answer</summary>

Snowflake-style IDs: a 64-bit value composed of a timestamp (milliseconds), a machine/worker ID assigned at startup (from configuration or a coordinator), and a per-millisecond sequence counter. IDs are unique without coordination per ID and sort roughly by time; guard against clock moving backwards (wait or refuse until it catches up).

</details>

### Q20. When would you deliberately choose eventual consistency for a feature that "looks" like it needs strong consistency?

**Style:** Trade-off

<details>
<summary>Answer</summary>

When the cost of occasional anomalies is low and recoverable compared with the latency and availability cost of coordination — for example inventory counts shown on product pages (re-checked at purchase), follower counts, or "seats left" displays — while enforcing the true invariant at a single strongly consistent point (the purchase or booking).

</details>

### Q21. A capacity plan says 40 servers at 60 % utilisation. Why might 40 still not be enough on launch day?

**Style:** Debugging

<details>
<summary>Answer</summary>

Per-server capacity may have been measured with unrealistic traffic (cache hit ratios, payload sizes, endpoint mix), a shared dependency (database, cache, third-party API) may saturate first, traffic may be spikier than the peak factor assumed, and losing a zone removes a third of capacity. Load-test realistically, check every tier, and keep autoscaling and load shedding ready.

</details>
