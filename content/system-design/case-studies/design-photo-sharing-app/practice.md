# Case Study: Design a Photo-Sharing App — Practice

### P1. First fix

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** scaling order

Pages on a single-server photo app went from 200 ms to 10 s after a traffic spike, and CPU is at 100 %. After quick wins (indexes, a bigger machine), what comes next?

- A) Shard the database
- B) Add app servers behind a load balancer
- C) Switch to microservices
- D) Add Kafka

<details>
<summary>Answer</summary>

**Answer:** B) Add app servers behind a load balancer

</details>

### P2. Fan-out cost

**Difficulty:** Medium · **Type:** Estimation · **Concepts:** fan-out on write

Users post 2 million photos a day; the average poster has 300 followers. With pure fan-out on write, how many feed-list inserts per day and per second on average?

<details>
<summary>Answer</summary>

2 M × 300 = **600 million inserts/day** ≈ 600 M ÷ 86,400 ≈ **6,900/s** on average — heavy but manageable in Redis or a wide-column store; celebrities would add tens of millions per post, which is why they are excluded.

</details>

### P3. Place the components

**Difficulty:** Medium · **Type:** Design · **Concepts:** component purpose

Match each component to the failure it fixes: (a) Redis session store, (b) object storage, (c) read replicas, (d) CDN, (e) queue + workers.

<details>
<summary>Answer</summary>

(a) Random logouts with multiple servers, (b) photos lost if a server's disk dies, (c) database single point of failure and read hotspot, (d) slow image delivery and huge bandwidth from the origin, (e) slow uploads because resizing runs in the request.

</details>

### P4. Rebuild after cache loss

**Difficulty:** Hard · **Type:** Failure · **Concepts:** feed cache

The Redis cluster holding precomputed feeds is lost. What happens and how should the system recover without overloading the database?

<details>
<summary>Answer</summary>

Feed reads miss, so the service falls back to fan-out on read (querying followees' recent photos). To avoid a stampede, coalesce concurrent rebuilds per user, rate-limit rebuild work, serve a simpler degraded feed (fewer items) if the database is saturated, and refill feed lists lazily on read (and in the background for active users).

</details>
