# The Journey of a Request — Interview Questions

## Beginner

### Q1. Walk through what happens when a user opens a mobile app's home feed.

**Style:** How

<details>
<summary>Answer</summary>

The app resolves the domain through DNS (usually cached) to the load balancer's IP, opens or reuses a TCP + TLS connection, and sends `GET /feed` with an auth token. The load balancer terminates TLS and forwards to a healthy API server, which validates the token and checks the cache for the user's feed. On a hit it returns immediately; on a miss it queries the database, stores the result in the cache and returns JSON. The app then loads images from a CDN.

</details>

### Q2. What is the difference between latency and bandwidth?

**Style:** Comparison

<details>
<summary>Answer</summary>

Latency is the time for one round trip — the delay before data starts arriving, set mostly by distance and number of hops. Bandwidth is the amount of data that can flow per second once a transfer is under way. A small request across the world is latency-bound; downloading a large file is bandwidth-bound.

</details>

## Intermediate

### Q3. Why can a feed of small images feel slow on a fast connection?

**Style:** Why

<details>
<summary>Answer</summary>

Because each image costs a round trip, and if they are fetched sequentially or from a distant origin, latency dominates: 30 requests × 150 ms is 4.5 s regardless of bandwidth. Fixes are a CDN (shorter round trips), connection reuse and HTTP/2 multiplexing (parallel requests on one connection), and fewer, batched requests.

</details>

### Q4. What happens to the request path if the cache cluster goes down?

**Style:** What happens if

<details>
<summary>Answer</summary>

Every request becomes a cache miss and goes to the database, multiplying database load (by the inverse of the miss rate — at a 95 % hit ratio, up to 20×). Latency rises and the database may be overwhelmed, causing a cascading outage. Mitigations: a replicated cache cluster, database capacity or read replicas sized for some miss traffic, request coalescing, rate limiting and graceful degradation.

</details>

### Q5. How does the write path differ from the read path?

**Style:** Comparison

<details>
<summary>Answer</summary>

Writes go to the primary database (not replicas or the cache), must be durable before acknowledgement, and then invalidate or update cache entries affected by the change. Slow side effects — thumbnails, notifications, search indexing — are published to a queue and processed asynchronously so the write stays fast.

</details>

## Advanced

### Q6. A user far from your only region sees 1.5 s page loads though servers respond in 20 ms. Explain and fix.

**Style:** Debugging

<details>
<summary>Answer</summary>

The time is network latency multiplied by round trips: DNS lookup, TCP and TLS handshakes, then several sequential API calls, each costing the long round-trip time. Fixes: a CDN or edge proxy to terminate TLS near the user (and cache static content), connection reuse and HTTP/2 or HTTP/3, one aggregated API call instead of several, and eventually a regional deployment closer to those users.

</details>

### Q7. How do you decide where to put timeouts along the request path?

**Style:** Design

<details>
<summary>Answer</summary>

Every network call gets a timeout derived from the overall latency budget: if the user-facing SLO is 500 ms, the API's calls to cache, database and downstream services must have budgets that fit within it (for example cache 50 ms, database 200 ms), with outer timeouts slightly larger than the sum of inner ones so that inner calls fail first and can fall back. Without timeouts, one slow dependency ties up threads and connections until the whole service stalls.

</details>
