# Scenario and Troubleshooting Questions — Interview Questions

## Beginner

### Q1. The website is down for everyone. What do you check first?

**Style:** Debugging

<details>
<summary>Answer</summary>

Work from the outside in: does DNS resolve correctly (and has the domain or certificate expired)? Is the load balancer healthy and does it have healthy targets? What changed recently (deploy, config, infrastructure)? Then check application errors and key dependencies (database, cache). If a recent deploy correlates, roll back first and investigate after.

</details>

### Q2. After a deployment, error rates jump from 0.1 % to 8 %. What do you do?

**Style:** Scenario

<details>
<summary>Answer</summary>

Mitigate first: roll back (or shift traffic away from the new version if using canaries) because the deploy is the most likely cause. Then investigate using logs and traces from the failing version, fix, add a test, and strengthen the rollout (smaller canary, automatic rollback on error-rate increase).

</details>

### Q3. What happens if the cache server restarts during peak traffic?

**Style:** What happens if

<details>
<summary>Answer</summary>

The cache comes back empty, every read misses and goes to the database, whose load jumps by the inverse of the miss rate; it may slow or fail, and hot keys may stampede. Recovery: replicated caches that survive single-node restarts, request coalescing, rate limiting and load shedding protecting the database, and warming hot keys.

</details>

### Q4. Users say their profile changes "don't save", but the database shows the new values. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

They are reading stale copies: a cache entry not invalidated on update, or a read replica lagging behind the primary. Fix by deleting the cache entry after updates (with a TTL safety net) and routing a user's reads of their own data to the primary for a short time after writing.

</details>

## Intermediate

### Q5. A sale is expected to bring 10× normal traffic tomorrow. What do you do today?

**Style:** Scenario

<details>
<summary>Answer</summary>

Load-test at 10× against a production-like environment to find the first bottleneck; pre-scale stateless tiers and raise autoscaling limits; check database capacity, connection limits and replica headroom; pre-warm caches and CDN for sale pages; enable rate limiting, load shedding and feature flags to turn off optional features; freeze risky deploys; ensure dashboards and on-call coverage.

</details>

### Q6. The database CPU is at 100 %. Walk through your investigation.

**Style:** Debugging

<details>
<summary>Answer</summary>

Identify the top queries by total time (query statistics, slow-query log); check for a new query pattern from a recent deploy, a missing index or a changed plan; look for N+1 patterns or a runaway job; check whether reads that could go to replicas or cache are hitting the primary. Mitigate (kill a runaway query, disable a feature, add an index, scale up), then fix the root cause.

</details>

### Q7. One user complains that the app is slow, while everyone else is fine. How do you approach it?

**Style:** Debugging

<details>
<summary>Answer</summary>

Find what is special about them: their location (distance, routing, ISP), device or app version, data size (a user with 50,000 followers or a huge history makes queries heavier), a hot shard holding their data, or rate limiting. Use their requests' traces and logs (by user ID or trace ID) to see which step is slow.

</details>

### Q8. A downstream partner API starts timing out. What happens to your service, and how do you protect it?

**Style:** What happens if

<details>
<summary>Answer</summary>

Without protection, requests wait for the timeout, threads and connections fill up, and your whole service slows — a cascading failure — while retries add load to the partner. Protect with short timeouts, a circuit breaker that opens after repeated failures, a bulkhead limiting concurrent calls to the partner, a fallback (cached data, queued processing, a clear error), and limited retries with backoff.

</details>

### Q9. Messages in a queue are piling up and the oldest is 2 hours old. What do you do?

**Style:** Debugging

<details>
<summary>Answer</summary>

Check whether consumers are running and healthy, whether they are failing on poison messages in a loop, whether a downstream dependency is slow, whether partitions limit parallelism, and whether input rate spiked. Mitigate by scaling consumers (if the bottleneck is theirs), moving poison messages to the DLQ, or throttling producers; then fix the root cause and add an alert on oldest-message age.

</details>

### Q10. Random users see another user's data on a cached page. What is likely wrong?

**Style:** Debugging

<details>
<summary>Answer</summary>

A personalised response was cached publicly — at a CDN, reverse proxy or application cache — with a cache key that omits the user (missing `Cache-Control: private`, or a shared key in Redis). Immediately purge the cache and disable caching for that route; then fix headers and keys and add tests for cacheability of authenticated responses. Treat it as a security incident.

</details>

### Q11. What happens to an e-commerce site if the primary database fails during checkout?

**Style:** What happens if

<details>
<summary>Answer</summary>

Writes fail until failover promotes a replica (tens of seconds with automation); in-flight checkouts error out. Clients or the API should retry safely with idempotency keys, browsing can continue from replicas and caches, and with asynchronous replication a few recently committed orders could be missing — semi-synchronous replication prevents that. Payments already charged must reconcile with orders.

</details>

### Q12. Duplicate emails are being sent to customers. Where would you look?

**Style:** Debugging

<details>
<summary>Answer</summary>

At-least-once redelivery (consumer crashes or slow acknowledgements beyond the visibility timeout) combined with a non-idempotent email consumer; multiple instances each subscribed separately to a topic (pub/sub instead of competing consumers); scheduled jobs running on every instance; or producer retries publishing twice. Add idempotency (record sent emails by event ID), fix subscriptions, and extend visibility timeouts.

</details>

## Advanced

### Q13. Latency P99 rises every day at 2 a.m. for 20 minutes. What could it be?

**Style:** Debugging

<details>
<summary>Answer</summary>

Something scheduled: backups or snapshots consuming I/O, batch jobs or report queries hitting the primary, cache TTLs that all expire together, log rotation or compaction, a scan polluting caches, or a dependency's maintenance window. Correlate with job schedules and resource metrics; move heavy jobs to replicas, throttle them, or stagger them.

</details>

### Q14. After adding a fifth node to your cache cluster, the database was overwhelmed. Explain and prevent it next time.

**Style:** Debugging

<details>
<summary>Answer</summary>

The client used modulo hashing, so going from 4 to 5 nodes remapped about 80 % of keys; those lookups missed and fell through to the database. Use consistent hashing or hash slots so only about one-fifth of keys move, add nodes during low traffic, and warm the new node or migrate entries before switching.

</details>

### Q15. Two regions both believe they are primary after a network partition between them. What happened and what now?

**Style:** What happens if

<details>
<summary>Answer</summary>

Split brain: failover logic promoted the second region without a quorum or fencing, so both accepted writes and the data diverged. Now stop writes on one side (fence it), reconcile the divergent writes (by business rules or manually), and fix the design: consensus-based leader election requiring a majority (often with a third tie-breaker site) and fencing of the old primary.

</details>

### Q16. Your system must handle a celebrity with 100 million followers posting. Which parts of your design are affected?

**Style:** Design

<details>
<summary>Answer</summary>

Feed fan-out (don't fan out on write; merge at read time), the hot cache key for the post and its counters (local caches, key replication, sharded counters), notification fan-out (queue, batch, rate-limit), the hot partition holding the celebrity's data (caching, read replicas), and CDN load for the media (pre-warm, origin shield).

</details>

### Q17. A data migration script corrupted 3 % of user records two days ago and was only noticed now. How do you recover?

**Style:** Scenario

<details>
<summary>Answer</summary>

Replicas copied the corruption, so restore from backups: use point-in-time recovery to a separate instance just before the script ran, identify the affected records (by the script's criteria or by comparing), and repair them in production — merging carefully with legitimate changes made since. Then add safeguards: dry runs, batches with verification, backups before migrations, and review.

</details>

### Q18. How would you find out why a request takes 3 seconds when every service reports its own latency as under 100 ms?

**Style:** Debugging

<details>
<summary>Answer</summary>

Look at a distributed trace of the request: the time may be in gaps between spans (queueing, thread pool waits, connection-pool waits, DNS or TLS handshakes, retries hidden inside a client), in many sequential calls each under 100 ms that add up, or in a component that isn't instrumented (a proxy, the client, a queue). Server-reported latency often excludes time spent waiting before the handler starts.

</details>

### Q19. Your error budget for the month is already spent by day 10. What changes?

**Style:** Scenario

<details>
<summary>Answer</summary>

Per the SLO policy, slow or freeze feature releases and prioritise reliability work: fix the causes of the incidents that consumed the budget, improve rollouts (canaries, automatic rollback), add missing alerts and tests, and review whether the SLO and the architecture match. Communicate the status to product stakeholders.

</details>

### Q20. A team wants to move from a single PostgreSQL to a sharded cluster because "the database is slow". What do you ask first?

**Style:** Follow-up

<details>
<summary>Answer</summary>

What exactly is slow and why: which queries, CPU or I/O or locks, reads or writes, data size versus memory, connection counts. Most "slow database" problems are fixed by indexes, query changes, caching, read replicas, connection pooling or a bigger machine. Shard only if write throughput or data size truly exceeds one primary — and with a shard key derived from access patterns.

</details>
