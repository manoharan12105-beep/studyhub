# Rate Limiting — Interview Questions

## Beginner

### Q1. What is rate limiting and why is it needed?

**Style:** Direct

<details>
<summary>Answer</summary>

Restricting how many requests a client can make in a period. It protects capacity from runaway or abusive clients, blocks brute-force and scraping, enforces plan quotas, ensures fairness between tenants, and protects costly downstream services.

</details>

### Q2. What should an API return when a client exceeds its limit?

**Style:** Direct

<details>
<summary>Answer</summary>

HTTP 429 Too Many Requests with a `Retry-After` header saying when to try again, ideally plus headers describing the limit and remaining quota, and a clear error body. Clients should back off rather than retry immediately.

</details>

## Intermediate

### Q3. Explain the token bucket algorithm.

**Style:** How

<details>
<summary>Answer</summary>

Each client has a bucket with a maximum capacity of tokens, refilled at a constant rate. A request consumes one token; if none is available it is rejected (or delayed). Capacity controls the largest burst, refill rate controls the long-term average. State per client is just the token count and the last refill time, computed lazily on each request.

</details>

### Q4. What is the boundary problem with fixed-window counters, and how do sliding windows fix it?

**Style:** Why

<details>
<summary>Answer</summary>

Counters reset at fixed boundaries, so a client can send the full limit just before a boundary and again just after, doubling the effective rate in a short span. A sliding window log counts requests in the true last N seconds (exact but memory-hungry); a sliding window counter weights the previous window's count by its remaining overlap, approximating the sliding window with two counters.

</details>

### Q5. Token bucket vs leaky bucket?

**Style:** Comparison

<details>
<summary>Answer</summary>

Token bucket admits bursts up to its capacity while enforcing an average rate, rejecting excess immediately — good for APIs. Leaky bucket queues requests and releases them at a constant rate, smoothing bursts into a steady flow at the cost of added latency and dropped requests when the queue is full — good for protecting a system that cannot handle bursts.

</details>

### Q6. Should you rate-limit by IP address?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Only as a coarse outer layer, mainly for unauthenticated endpoints. Many legitimate users share an IP (corporate NAT, mobile carrier NAT), so IP limits can block them, while attackers can rotate IPs. Prefer limits keyed by user ID or API key, with IP limits for login and signup endpoints.

</details>

## Advanced

### Q7. How do you enforce one limit across 20 API gateway instances?

**Style:** Design

<details>
<summary>Answer</summary>

Keep counters in a shared store such as Redis and update them atomically — a Lua script implementing the token bucket, or `INCR` with `EXPIRE` for windows — so all gateways see the same state. Alternatives: route each key consistently to one gateway, or enforce approximate local limits (limit ÷ instances) with periodic synchronisation. Add a short local cache for keys already over the limit to reduce Redis load.

</details>

### Q8. Redis, which holds the rate-limit counters, becomes unreachable. What should the limiter do?

**Style:** What happens if

<details>
<summary>Answer</summary>

Decide in advance per endpoint: fail open (allow requests, perhaps with conservative local in-memory limits) to keep the API available, or fail closed (reject) for sensitive endpoints like login or payments where abuse is costlier than downtime. Use short timeouts on the Redis call so the limiter never makes the API slow, and alert on the failure.

</details>

### Q9. Why is a race condition possible in a naive Redis rate limiter, and how is it avoided?

**Style:** Debugging

<details>
<summary>Answer</summary>

A naive implementation reads the count, checks it and writes it back in separate commands; two gateways can read the same value concurrently and both allow a request, exceeding the limit. Use atomic operations: `INCR` (which returns the new value) and check the result, or run the whole token-bucket logic in a Lua script, which Redis executes atomically.

</details>
