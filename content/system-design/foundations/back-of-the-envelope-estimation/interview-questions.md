# Back-of-the-Envelope Estimation — Interview Questions

## Beginner

### Q1. Why do we estimate in system design interviews?

**Style:** Why

<details>
<summary>Answer</summary>

To find the order of magnitude of load, storage and bandwidth, because that decides the architecture: whether one database suffices or sharding is needed, whether a CDN is required, how many servers to run. It also shows that design choices are driven by numbers rather than habit.

</details>

### Q2. How do you convert daily active users into requests per second?

**Style:** How

<details>
<summary>Answer</summary>

Multiply DAU by the average number of requests each user makes per day, divide by 86,400 seconds (≈ 10⁵), then multiply by a peak factor (often 2–10, commonly 3) for peak RPS. Example: 1 M DAU × 20 requests = 20 M/day ≈ 230/s average, ≈ 700/s at a 3× peak.

</details>

### Q3. What is a quick way to remember daily-to-per-second conversion?

**Style:** Direct

<details>
<summary>Answer</summary>

One million events per day is about 12 per second (1,000,000 ÷ 86,400 ≈ 11.6). Scale from there: 100 million per day ≈ 1,200 per second.

</details>

## Intermediate

### Q4. Estimate storage for 50 million new chat messages per day, 200 bytes each, kept for 5 years with 3 replicas.

**Style:** Scenario

<details>
<summary>Answer</summary>

Per day: 50 M × 200 B = 10 GB. Per year: ≈ 3.65 TB. Five years: ≈ 18 TB. With 3 replicas: ≈ 55 TB raw, before indexes and overhead. Conclusion: this is too much for one comfortable machine long term, so plan to partition (for example by conversation ID).

</details>

### Q5. Why convert bandwidth to bits per second?

**Style:** Why

<details>
<summary>Answer</summary>

Network capacity (NICs, links, CDN contracts) is quoted in bits per second, while file and response sizes are in bytes. 1 GB/s of responses needs about 8 Gbps of network capacity; forgetting the factor of 8 underestimates network needs eightfold.

</details>

### Q6. How do you turn peak RPS into a number of servers?

**Style:** How

<details>
<summary>Answer</summary>

Divide peak RPS by the measured capacity of one server, then divide by a target utilisation (for example 0.6–0.7) to keep headroom for spikes and slow requests, and add spare capacity so losing one server (or one availability zone) does not overload the rest. Capacity per server should come from a load test, not a guess.

</details>

### Q7. Why does the read:write ratio matter in an estimate?

**Style:** Why

<details>
<summary>Answer</summary>

It shows which path dominates and what the bottleneck will be. At 250:1, the design focuses on caching, replicas and CDNs; writes can stay on one primary. At 1:1 or write-heavy, the focus shifts to write throughput: partitioning, batching, append-optimised stores and queues.

</details>

## Advanced

### Q8. An interviewer challenges your estimate: "isn't 3× peak too low?" How do you respond?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Acknowledge that the factor depends on traffic shape: global traffic spread across time zones is flatter; a single-country app or a live event can spike 10× or more. Show how the design changes: a higher peak means more servers (or autoscaling), more cache capacity, and queues to absorb write bursts. The structure of the design stays, but sizes change; for extreme spikes, add load shedding.

</details>

### Q9. A design needs 9 Gbps of image traffic on average. What do you conclude?

**Style:** Design

<details>
<summary>Answer</summary>

Application servers should not serve these bytes. Store images in object storage and serve them through a CDN, so most requests are answered from edge caches near users; the origin sees only cache misses. Peak traffic (2–3× the average) makes this even clearer.

</details>
