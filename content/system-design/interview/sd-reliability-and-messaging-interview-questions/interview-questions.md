# Interview Questions: Reliability, Messaging and Operations — Interview Questions

## Beginner

### Q1. What is the difference between high availability and disaster recovery?

**Style:** Comparison

<details>
<summary>Answer</summary>

High availability keeps a service running through routine failures (an instance, a disk, a zone) using redundancy and automatic failover, usually within seconds or minutes. Disaster recovery restores service and data after events redundancy cannot absorb — a region loss, data corruption, mass deletion — using backups and secondary sites, measured by RPO and RTO.

</details>

### Q2. Why should retries use exponential backoff with jitter?

**Style:** Why

<details>
<summary>Answer</summary>

Backoff gives a struggling dependency time to recover instead of hammering it; jitter randomises retry times so thousands of clients that failed together don't retry in synchronised waves. Together they prevent retry storms.

</details>

### Q3. What is a dead-letter queue for?

**Style:** Direct

<details>
<summary>Answer</summary>

To park messages that fail repeatedly (poison messages) or are invalid, so they stop consuming resources and blocking other messages, without being lost; engineers inspect them, fix the cause and redrive them.

</details>

### Q4. Name the four golden signals.

**Style:** Direct

<details>
<summary>Answer</summary>

Latency, traffic, errors and saturation.

</details>

### Q5. Why can't averages describe latency well?

**Style:** Why

<details>
<summary>Answer</summary>

Latency distributions are skewed; a few very slow requests pull the average up while hiding how slow they are, and most requests are faster than the average. Percentiles (P50, P95, P99) describe the typical and tail experience directly.

</details>

## Intermediate

### Q6. A payment request times out. Walk through what the client should do.

**Style:** Scenario

<details>
<summary>Answer</summary>

Treat the outcome as unknown — the payment may have succeeded. Retry with the same idempotency key (so a completed payment returns its original result rather than charging again), with backoff and a limited number of attempts, or query the payment status by that key. Show the user a pending state, never "failed", until the outcome is known.

</details>

### Q7. How do a circuit breaker and a bulkhead differ?

**Style:** Comparison

<details>
<summary>Answer</summary>

A circuit breaker watches calls to a dependency and, after repeated failures, stops calling it for a while (failing fast with a fallback), protecting both sides. A bulkhead limits the resources (threads, connections) any one dependency can consume, so a slow dependency cannot starve others. They are used together.

</details>

### Q8. Your consumers process each message at least once. How do you avoid charging a customer twice?

**Style:** Design

<details>
<summary>Answer</summary>

Make the consumer idempotent: record the payment or message ID with a unique constraint in the same transaction as the charge record (and pass an idempotency key to the payment provider), so a redelivered message finds the existing record and does nothing.

</details>

### Q9. Kafka or RabbitMQ for a background job system that generates invoices with priorities and retries?

**Style:** Trade-off

<details>
<summary>Answer</summary>

RabbitMQ (or SQS): per-message acknowledgements, priorities, TTLs, dead-letter exchanges and delayed retries are built for job queues. Kafka excels at replayable, high-throughput event streams but makes priorities and per-message retries awkward.

</details>

### Q10. What should a health check verify?

**Style:** How

<details>
<summary>Answer</summary>

That the instance can actually serve: the process is up, it has finished starting, and essential local resources work (for example a database connection it cannot function without). It should not fail because optional or shared downstream services are down, or one dependency outage removes every instance. Separate liveness (restart me) from readiness (send me traffic).

</details>

### Q11. Explain at-least-once vs at-most-once with an example of when each is appropriate.

**Style:** Comparison

<details>
<summary>Answer</summary>

At-least-once (acknowledge after processing) never loses messages but may duplicate them — right for orders and payments with idempotent consumers. At-most-once (acknowledge before processing) never duplicates but may lose messages — acceptable for high-volume telemetry or location pings superseded seconds later.

</details>

### Q12. What is backpressure, and what happens without it?

**Style:** What happens if

<details>
<summary>Answer</summary>

Backpressure is the signal from an overloaded stage to its producers to slow down (or have work rejected). Without it, unbounded queues and buffers grow, latency climbs without limit, memory or storage is exhausted, and work expires before being processed — overload becomes collapse.

</details>

### Q13. How do you choose RPO and RTO targets?

**Style:** How

<details>
<summary>Answer</summary>

From business impact: what does an hour of lost data and an hour of downtime cost for this system? Critical transactional systems target near-zero RPO and minutes of RTO (synchronous replication, warm standby); less critical systems accept hours (backup and restore). Then choose the DR strategy that meets the targets at acceptable cost, and verify with drills.

</details>

### Q14. What makes an alert good?

**Style:** Direct

<details>
<summary>Answer</summary>

It signals real or imminent user impact, is actionable, has a clear owner and severity, links to a runbook, fires rarely enough to be taken seriously, and resolves when the problem does. Symptom-based and SLO burn-rate alerts are good pages; cause-level warnings belong on dashboards.

</details>

## Advanced

### Q15. Three layers each retry 3 times. A database slows down. Describe what happens and how to redesign.

**Style:** Debugging

<details>
<summary>Answer</summary>

Each failing user request can multiply into 4 × 4 × 4 = 64 database calls, so the slowdown triggers a load spike that makes it worse — a retry storm and cascading failure. Redesign: retry at one layer only, use retry budgets, exponential backoff with jitter, circuit breakers around the database calls, deadline propagation, and load shedding at the edge.

</details>

### Q16. How do you guarantee an event is published whenever an order is committed?

**Style:** Design

<details>
<summary>Answer</summary>

The transactional outbox: write the order and an outbox row in the same database transaction, and have a relay (polling or change data capture) publish outbox rows to the broker with retries, marking them sent. Consumers deduplicate by event ID because publication is at-least-once.

</details>

### Q17. A Kafka consumer group's lag keeps growing even after adding consumers. What do you check?

**Style:** Debugging

<details>
<summary>Answer</summary>

Whether there are more consumers than partitions (extras sit idle); whether one hot partition holds most traffic; whether a downstream dependency (database, API) is the real bottleneck; whether processing is inefficient (no batching, synchronous calls); and whether frequent rebalances are pausing consumption. Increase partitions, fix the key skew, batch, or scale the downstream system.

</details>

### Q18. How would you make checkout degrade gracefully when the recommendations, reviews and tax services are slow?

**Style:** Design

<details>
<summary>Answer</summary>

Call them with short timeouts inside separate bulkheads and circuit breakers; recommendations and reviews are optional — hide them or show cached content; tax is essential — use a cached rate table or estimate with a disclaimer if the business allows, otherwise fail the order clearly rather than hang. Monitor fallback rates so degradation is visible.

</details>

### Q19. Describe how you would investigate "checkout P99 latency doubled since 14:00".

**Style:** Debugging

<details>
<summary>Answer</summary>

Check what changed at 14:00 (deploys, config, traffic, dependency incidents); slice the latency metric by endpoint, region, instance and version to localise it; examine slow traces to find the dominant span; check saturation (CPU, pools, queue depth) and dependency metrics (database latency, cache hit ratio); then read the logs of failing or slow requests via their trace IDs. Roll back if a deploy correlates.

</details>

### Q20. Why do you need both replication and backups?

**Style:** Trap

<details>
<summary>Answer</summary>

Replication protects availability against machine failure but instantly copies logical errors — deletes, corruption, bad migrations, ransomware actions. Backups are independent, point-in-time copies kept separately so you can restore data as it was before the error. They solve different failures.

</details>

### Q21. Messages for the same order are sometimes processed out of order. What could cause it in a Kafka-based system?

**Style:** Debugging

<details>
<summary>Answer</summary>

The messages aren't keyed by order ID (so they land on different partitions); a consumer processes a partition's messages concurrently without grouping by key; a failed message was sent to a retry topic while later ones continued; the partition count changed, remapping the key; or several producers emit events for the same order without coordination.

</details>

### Q22. How would you test that your failover actually works?

**Style:** How

<details>
<summary>Answer</summary>

Regularly and deliberately: game days and chaos experiments that terminate instances, fail over databases, block a zone's network or inject latency, in staging and carefully in production; measure detection time, recovery time and data loss against targets; and fix whatever runbooks, alerts or automation fail.

</details>
