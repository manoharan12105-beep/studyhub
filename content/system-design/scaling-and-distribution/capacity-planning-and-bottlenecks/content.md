# Capacity Planning and Finding Bottlenecks

**Module:** Scaling and Distribution · **Interview priority:** Frequently asked

## What Is It?

- **Capacity planning** turns expected load (from [estimation](../../foundations/back-of-the-envelope-estimation/content.md)) into the resources needed — servers, database size, cache memory, bandwidth — with enough **headroom** for peaks, failures and growth.
- **Bottleneck identification** finds the one component that limits the whole system's throughput or latency right now, so effort goes where it helps.

## Why It Exists

A system's throughput is set by its **narrowest point**. Doubling app servers does nothing if the database is saturated; tuning queries does nothing if the network link is full. Too little capacity causes outages on the busiest day; too much wastes money every day.

## How It Works

### Utilisation and why 100 % is too much

As a resource approaches full utilisation, **queues** form and latency rises sharply, not linearly. In simple queueing models, waiting time grows roughly with `utilisation ÷ (1 − utilisation)`:

| Utilisation | Relative waiting time |
|-------------|-----------------------|
| 50 % | 1× |
| 80 % | 4× |
| 90 % | 9× |
| 95 % | 19× |

That is why teams target **60–70 %** utilisation on critical resources at peak: room for spikes, uneven load and a failed instance.

### Little's law

```text
concurrency = throughput × latency
3,000 requests/s × 0.2 s = 600 requests in flight
```

It sizes thread pools, connection pools and queues, and explains a classic failure: when a dependency slows from 0.2 s to 2 s, in-flight requests jump from 600 to 6,000 and exhaust every pool.

### A worked plan

Peak: **25,000 requests/s**. Load tests show one instance handles **1,200 requests/s** at the latency target. Target utilisation **60 %**. Instances spread over **3 availability zones**.

```text
Instances for peak at 60 %:   25,000 ÷ (1,200 × 0.6) ≈ 34.7 → 35
Lose one zone (1/3 of fleet): 35 × 2/3 ≈ 23 instances left
Load per remaining instance:  25,000 ÷ 23 ≈ 1,087 requests/s → ~91 % of capacity
→ survivable but latency will rise; add a few instances or rely on fast autoscaling.
Growth 50 %/year: plan ~53 instances in a year (or autoscaling limits that allow it).
```

Repeat for every tier: database (queries/s, connections, storage growth, IOPS), cache (memory for the hot set, operations/s per node), network and storage.

### Finding the bottleneck

1. **Measure each tier** under load: throughput, latency (percentiles), errors, and saturation.
2. Apply the **USE method** to each resource (CPU, memory, disk, network, connection pools, threads): **U**tilisation, **S**aturation (queueing), **E**rrors.
3. The bottleneck is the resource that saturates first as load rises — its queue grows while others still have room.
4. Use **distributed tracing** to see which hop dominates request time ([Distributed Tracing](../../observability/distributed-tracing/content.md)).
5. Fix it, re-test: the bottleneck moves to the next narrowest point.

| Symptom | Likely bottleneck |
|---------|-------------------|
| App CPU high, database idle | Application code (or too few instances) |
| App CPU low, requests slow, many threads waiting on DB | Database (queries, locks, connections) |
| Timeouts borrowing connections, DB CPU low | Connection pool sizing or long-held connections |
| Latency rises with response size, CPU fine | Network bandwidth or serialisation |
| One shard or node hot, others idle | Skewed partitioning or a hot key |

### Load testing

Estimates must be validated. Load tests replay realistic traffic (mix of endpoints, data sizes, think times) against a production-like environment, ramping until latency targets break, to find the real per-instance capacity and the first bottleneck. **Soak tests** run for hours to expose leaks; **spike tests** check autoscaling and queues.

**Think about it:** you add 50 % more app servers, but peak throughput rises only 5 %. What does that tell you?

<details>
<summary>Answer</summary>

The app tier was not the bottleneck. Something shared behind it is saturated — usually the database (CPU, locks, connection limit), a cache node, a downstream service or a rate-limited third party. Measure saturation per tier and fix that resource; adding app servers may even make it worse (more connections, more contention).

</details>

## Common Traps

> [!WARNING]
> **Common trap:** planning for average load at 100 % utilisation. Plan for peak at 60–70 %, and check what happens when an instance or a whole zone fails.

## Interview Follow-up

- *"How many servers would you need?"* Peak RPS ÷ (per-instance capacity × target utilisation), then check survival of a zone failure and growth, and confirm per-instance capacity with a load test.

## Key Takeaways

- Throughput is limited by the narrowest component; find it by measuring utilisation, saturation and errors per resource.
- Latency explodes near full utilisation; target 60–70 % at peak.
- Little's law (concurrency = throughput × latency) sizes pools and explains slowdown cascades.
- Plan for peak, failure (lose a zone) and growth; validate with load tests.
