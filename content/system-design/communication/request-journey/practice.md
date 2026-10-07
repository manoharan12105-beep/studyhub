# The Journey of a Request — Practice

### P1. Order the hops

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** request flow

Put in order for a cache miss: database query, DNS lookup, load balancer, cache lookup, API server, response to client.

<details>
<summary>Answer</summary>

DNS lookup → load balancer → API server → cache lookup → database query → response to client.

</details>

### P2. Latency or bandwidth?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** latency vs bandwidth

An API returns 2 KB of JSON. Users in Australia hitting servers in Europe see slow responses. Which is the main cause?

- A) Too little bandwidth for 2 KB
- B) Round-trip latency due to distance
- C) The JSON format
- D) The CPU of the client phone

<details>
<summary>Answer</summary>

**Answer:** B) Round-trip latency due to distance

2 KB is tiny; the round trip across the world dominates.

</details>

### P3. Count round trips

**Difficulty:** Medium · **Type:** Estimation · **Concepts:** round trips

Round-trip time is 100 ms. A page needs: a new TCP connection, a TLS 1.3 handshake, then 3 API calls made one after another. Ignoring server time, how long until the last response arrives? What if the 3 calls were made in parallel on the same HTTP/2 connection?

<details>
<summary>Answer</summary>

Sequential: 1 (TCP) + 1 (TLS) + 3 = 5 RTT = **500 ms**. In parallel: 1 + 1 + 1 = 3 RTT = **300 ms**.

</details>

### P4. Cache failure impact

**Difficulty:** Hard · **Type:** Failure · **Concepts:** hit ratio, database load

A database receives 500 queries/s while the cache serves a 98 % hit ratio on 25,000 requests/s. The cache cluster restarts empty. How many queries/s hit the database immediately after, and what should you do?

<details>
<summary>Answer</summary>

All 25,000 requests/s miss, so the database receives up to **25,000 queries/s** — 50× its normal load — until the cache warms up. Protect it with request coalescing (one database query per key while others wait), rate limiting or load shedding, warming the cache before taking traffic, and a replicated cache so one node's restart does not empty everything.

</details>
