# Rate Limiting

**Module:** Communication and APIs · **Interview priority:** Core

## What Is It?

A **rate limiter** caps how many requests a client (a user, an API key, an IP address) may make in a period — for example 100 requests per minute. Requests over the limit are rejected, usually with **HTTP 429 Too Many Requests** and a `Retry-After` header, or delayed.

## Why It Exists

- **Protect capacity:** one buggy script or abusive client must not consume what thousands of normal users need.
- **Stop abuse:** brute-force logins, scraping, spam and some denial-of-service traffic.
- **Fairness and pricing:** free tier 100 requests/minute, paid tier 10,000.
- **Protect downstream services and cost:** a payment provider or SMS gateway that charges per call.

## How It Works

### Where the limiter sits

Usually at the edge — the API gateway, reverse proxy or load balancer — so rejected requests never reach application servers. Applications may add finer limits (per endpoint, per tenant). The limiter needs a **key** (user ID, API key or IP) and a **rule** (limit per window).

### The algorithms

**1. Token bucket.** A bucket holds up to *capacity* tokens and is refilled at a fixed rate. Each request takes one token; with no token, the request is rejected. Allows **bursts** up to the capacity while enforcing the average rate. The most widely used algorithm.

**2. Leaky bucket.** Requests enter a queue (the bucket) that drains at a constant rate; when the queue is full, new requests are dropped. Produces a **smooth output rate** — useful in front of a system that cannot absorb bursts — but adds queueing delay.

**3. Fixed window counter.** Count requests per client per calendar window (12:00:00–12:00:59). Simple and cheap: one counter per key. Flaw: a client can send the full limit at 12:00:59 and again at 12:01:00 — **twice the limit in two seconds** at the boundary.

**4. Sliding window log.** Store the timestamp of each request; count those within the last 60 seconds. Exact, but memory grows with the limit (100 timestamps per client for 100/min).

**5. Sliding window counter.** Approximate the sliding window from two fixed-window counters, weighting the previous window by how much of it still overlaps:

```text
estimate = current_count + previous_count × (1 − elapsed_fraction_of_current_window)
Limit 100/min. Previous minute: 80. Current minute: 30, and we are 25 % into it.
estimate = 30 + 80 × 0.75 = 90  → allowed (10 left)
```

Cheap (two counters) and avoids most of the boundary burst.

| Algorithm | Bursts | Memory per client | Accuracy | Typical use |
|-----------|--------|-------------------|----------|-------------|
| Token bucket | Allowed up to capacity | 2 numbers | Good | API rate limits (most common) |
| Leaky bucket | Smoothed into constant rate | Queue | Good | Traffic shaping |
| Fixed window | 2× at window boundaries | 1 counter | Coarse | Simple quotas |
| Sliding window log | No | One entry per request | Exact | Low limits, strict rules |
| Sliding window counter | Mostly prevented | 2 counters | Approximate | Large-scale limits |

### A token bucket in Java

```java
public class TokenBucketDemo {

    /** Token bucket: holds up to `capacity` tokens, refilled continuously at `refillPerSecond`. */
    static final class TokenBucket {
        private final long capacity;
        private final double refillPerMilli;
        private double tokens;
        private long lastRefillMillis;

        TokenBucket(long capacity, double refillPerSecond, long nowMillis) {
            this.capacity = capacity;
            this.refillPerMilli = refillPerSecond / 1000.0;
            this.tokens = capacity;              // start full: allows an initial burst
            this.lastRefillMillis = nowMillis;
        }

        synchronized boolean tryAcquire(long nowMillis) {
            long elapsed = nowMillis - lastRefillMillis;
            tokens = Math.min(capacity, tokens + elapsed * refillPerMilli);
            lastRefillMillis = nowMillis;
            if (tokens >= 1) {
                tokens -= 1;
                return true;
            }
            return false;
        }
    }

    public static void main(String[] args) {
        // Burst of 3, then a sustained rate of 1 request per second.
        TokenBucket bucket = new TokenBucket(3, 1.0, 0);
        long[] arrivals = {0, 100, 200, 300, 400, 1500, 1600, 3000, 3100, 3200};
        for (long t : arrivals) {
            boolean allowed = bucket.tryAcquire(t);
            System.out.printf("t=%4d ms -> %s%n", t, allowed ? "allowed" : "rejected (429)");
        }
    }
}
```

**Output:**

```text
t=   0 ms -> allowed
t= 100 ms -> allowed
t= 200 ms -> allowed
t= 300 ms -> rejected (429)
t= 400 ms -> rejected (429)
t=1500 ms -> allowed
t=1600 ms -> rejected (429)
t=3000 ms -> allowed
t=3100 ms -> allowed
t=3200 ms -> rejected (429)
```

The first three requests use the initial burst. By 1,500 ms about 1.5 tokens have refilled, so one more is allowed. By 3,000 ms the bucket holds 2 tokens again. The time is passed in as a parameter so the run is deterministic; a real limiter reads a clock.

### Distributed rate limiting

With 20 gateway nodes, a per-node counter lets a client get 20× the limit by spreading requests. Options:

- **Central counter store (Redis):** each request runs an atomic operation — `INCR` + `EXPIRE` for a fixed window, or a small Lua script implementing a token bucket so the read-modify-write is atomic. Adds about a millisecond per request and makes Redis a dependency.
- **Local limits with periodic sync:** each node enforces `limit ÷ nodes` and adjusts from shared totals. Cheaper and approximate.
- **Sticky routing by key** so one node sees all of a client's traffic (consistent hashing on the API key).

Decide what happens when the counter store is unavailable: **fail open** (allow traffic — favours availability) or **fail closed** (reject — favours protection). Most APIs fail open for normal endpoints and closed for sensitive ones such as login.

### Tell clients about limits

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 12
RateLimit-Limit: 100
RateLimit-Remaining: 0
```

Well-behaved clients back off instead of retrying immediately ([Retries and Backoff](../../reliability/timeouts-retries-and-backoff/content.md)).

**Think about it:** a fixed window allows 100 requests per minute. What is the most a client can send in any 2-second span?

<details>
<summary>Answer</summary>

200: 100 in the last second of one window and 100 in the first second of the next. Sliding windows or a token bucket with a small capacity prevent this.

</details>

## When Not to Use

A rate limiter is not a capacity plan. If legitimate traffic regularly exceeds capacity, scale or shed load ([Graceful Degradation](../../reliability/graceful-degradation-and-load-shedding/content.md)); limits that reject real users at normal load are a bug.

## Common Traps

> [!WARNING]
> **Common trap:** limiting only by IP address. Many users share one IP behind corporate NAT or mobile carriers, and attackers rotate IPs. Prefer authenticated keys (user ID, API key), with IP limits as a coarse outer layer.

## Interview Follow-up

- *"Design a rate limiter for an API with 20 gateway nodes."* Token bucket per API key, state in Redis updated atomically with a Lua script, limits configured per plan, 429 with `Retry-After`, local fallback limits and fail-open behaviour if Redis is unreachable, metrics on rejections.

## Key Takeaways

- Rate limiting protects capacity, stops abuse and enforces plans; reject with 429 and `Retry-After`.
- Token bucket (bursts + average rate) is the default; leaky bucket smooths output; fixed windows allow boundary bursts; sliding windows fix them at more cost.
- Across many nodes, keep counters in a shared atomic store or accept approximate local limits, and decide fail-open vs fail-closed.
