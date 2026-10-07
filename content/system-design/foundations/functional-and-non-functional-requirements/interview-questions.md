# Functional and Non-Functional Requirements — Interview Questions

## Beginner

### Q1. What is the difference between functional and non-functional requirements?

**Style:** Comparison

<details>
<summary>Answer</summary>

Functional requirements say what the system does — the features, such as "users can post a photo" or "users can transfer money". Non-functional requirements say how well it does them — latency, throughput, availability, durability, consistency, security, scalability and cost — and are stated as measurable targets like "P99 under 200 ms" or "99.9 % monthly availability".

</details>

### Q2. Name five non-functional requirements and give a measurable example of each.

**Style:** Direct

<details>
<summary>Answer</summary>

Scalability: 50,000 requests/s at peak. Availability: 99.95 % per month. Latency: P99 < 300 ms for search. Durability: no committed order lost, data stored in three copies. Security: all traffic over TLS, data encrypted at rest, role-based access. (Also: consistency, observability, maintainability, cost.)

</details>

### Q3. Why do non-functional requirements drive the architecture more than functional ones?

**Style:** Why

<details>
<summary>Answer</summary>

Feature lists of similar products are nearly identical; what differs is scale, speed and failure tolerance. A photo album for a family and a social network both "upload and view photos", but only the second needs load balancers, caches, replicas, CDNs and sharding. Each of those components exists to meet a quality target, not to add a feature.

</details>

## Intermediate

### Q4. How do availability and reliability differ?

**Style:** Comparison

<details>
<summary>Answer</summary>

Availability is the fraction of time the system responds successfully. Reliability is whether it behaves correctly and keeps data safe over time. A service that responds instantly with stale or wrong balances is available but not reliable; a service that is down for an hour but never loses data is reliable but had an availability incident.

</details>

### Q5. Give an example of two non-functional requirements that conflict, and how you would resolve it.

**Style:** Trade-off

<details>
<summary>Answer</summary>

Low latency vs strong consistency: making every write wait for replicas in another region adds a cross-region round trip (tens of milliseconds or more). Resolve it per feature: payments and inventory decrements use strongly consistent writes in one primary region; feeds, like counts and view counts accept eventual consistency and are served from nearby replicas and caches.

</details>

### Q6. Why is "the system should be fast and scalable" a weak requirement?

**Style:** Trap

<details>
<summary>Answer</summary>

It has no numbers, so it cannot decide anything: you cannot tell whether one server or a hundred is needed, or whether a cache is justified. A useful version gives load and targets: "20k requests/s at peak, P99 under 200 ms, growing 3× per year".

</details>

## Advanced

### Q7. A video app says "uploads may take up to a minute, but playback must start in under two seconds anywhere in the world". What design decisions follow?

**Style:** Scenario

<details>
<summary>Answer</summary>

Do all heavy processing on the write path asynchronously: upload to object storage, queue a transcoding job, produce several resolutions and short segments. Serve reads from a CDN with edge servers near users, and use adaptive bitrate streaming so playback starts with a low-bitrate segment. The relaxed write latency pays for the strict read latency.

</details>

### Q8. How would you prioritise non-functional requirements for a banking app versus a social feed?

**Style:** Design

<details>
<summary>Answer</summary>

Banking: correctness, durability and consistency first (transactions, synchronous replication, audit trails), security next, then availability; latency targets are moderate. Social feed: availability and low latency first, accepting eventual consistency for counts and feed contents; durability matters for user posts but not for derived data like counters, which can be rebuilt.

</details>
