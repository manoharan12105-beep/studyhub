# Key Numbers and Rules

Numbers and rules of thumb worth knowing by heart. Latency figures are orders of magnitude; real hardware varies.

## Time and Size Conversions

```text
1 day = 86,400 s ≈ 10^5 s          1 month ≈ 2.5 × 10^6 s        1 year ≈ 3 × 10^7 s
1 million per day ≈ 12 per second   100 million per day ≈ 1,200 per second
KB 10^3 · MB 10^6 · GB 10^9 · TB 10^12 · PB 10^15 bytes
1 byte = 8 bits → 1 GB/s = 8 Gbps
Storage per hour of video at B Mbps = B × 3,600 ÷ 8 MB   (5 Mbps → 2.25 GB/h)
```

## Latency Orders of Magnitude

| Operation | Approximate |
|-----------|-------------|
| Main memory reference | 100 ns |
| SSD random read | ~0.1 ms |
| Round trip inside a data centre | ~0.5 ms |
| Redis/Memcached GET over the network | 0.2–1 ms |
| Indexed database query | 1–10 ms |
| Disk seek (HDD) | ~10 ms |
| Round trip between continents | 100–150 ms (or more) |
| Light in fibre | ~200 km per ms |

## Availability (the Nines)

| Availability | Per year | Per 30-day month |
|--------------|----------|------------------|
| 99 % | 3.65 days | 7.2 h |
| 99.9 % | 8.76 h | 43.2 min |
| 99.95 % | 4.38 h | 21.6 min |
| 99.99 % | 52.6 min | 4.32 min |
| 99.999 % | 5.26 min | 26 s |

```text
Series:   A = A1 × A2 × … × An               (10 × 99.9 % ≈ 99 %)
Parallel: A = 1 − (1 − A1)(1 − A2)…          (2 × 99 % independent ≈ 99.99 %)
Error budget = 1 − SLO
```

## Estimation Rules

```text
RPS = DAU × actions per user per day ÷ 86,400;   peak ≈ average × 2–10 (state it; 3 is common)
Storage = new items/day × size × retention × replication factor (often 3)
Servers = peak RPS ÷ (per-server capacity × target utilisation 0.6–0.7) + spare for failures
```

## Capacity and Queueing

```text
Little's law:      concurrency = throughput × latency         (2,000 req/s × 0.15 s = 300 in flight)
Utilisation:       waiting time grows ~ u ÷ (1 − u)           (50 % → 1×, 80 % → 4×, 90 % → 9×)
Pool sizing:       connections ≈ query rate × query time, plus headroom; total = instances × pool
```

## Distribution Rules

```text
Quorum overlap:            W + R > N        writes tolerate N − W failures, reads N − R
Consensus majority:        ⌊N/2⌋ + 1        3 nodes tolerate 1 failure, 5 tolerate 2
Modulo resharding N→N+1:   ~N/(N+1) of keys move      (4 → 5: ~80 %)
Consistent hashing:        ~1/(N+1) of keys move      (4 → 5: ~20 %)
Fan-out tail:              P(at least one slow) = 1 − (1 − p)^n     (p = 1 %, n = 100 → 63 %)
```

## Short Codes and IDs

```text
Base 62 = 0-9, a-z, A-Z
62^6 ≈ 56.8 billion        62^7 ≈ 3.5 trillion
Snowflake-style 64-bit ID = timestamp + machine ID + per-millisecond sequence
```

## Caching Defaults (Typical Starting Points)

| Data | TTL |
|------|-----|
| Home feed | ~30 s |
| Trending list | ~60 s |
| Profile card | a few minutes + invalidation |
| Permissions, privacy | invalidate on change; don't trust stale copies |
| Versioned static assets | ~1 year, immutable |
| TTL jitter | ±10 % |

## Retry Defaults

```text
Attempts: 3–5        Backoff: base × 2^retry, capped        Jitter: random(0, ceiling)
Retry only: timeouts, connection errors, 429/503 (respect Retry-After), on idempotent operations
```

## Status Codes

```text
200 OK · 201 Created · 204 No Content · 301 permanent / 302 temporary redirect · 304 Not Modified
400 Bad Request · 401 not authenticated · 403 not allowed · 404 Not Found · 409 Conflict
429 Too Many Requests · 500 server bug · 503 overloaded/unavailable
```

## Monitoring Starting Thresholds

```text
CPU sustained > ~75 % · memory > ~90 % · disk > ~80 % · capacity warning at ~75 %, page at ~90 % of tested throughput
Golden signals: latency, traffic, errors, saturation
```

## Scale Facts Used in the Case Studies

```text
URL shortener: 100 M links/month → ~40 writes/s, ~4,000 redirects/s, 6 TB over 10 years
Photo app: 10 M DAU → ~17,000 reads/s peak, ~4 TB of photos per day, ~9 Gbps of images
Video: ~2.1 M concurrent viewers at ~3 Mbps ≈ 6 Tbps egress → CDN
Chat: 2 B messages/day ≈ 23,000/s; 20 M connections ≈ 200 gateways at 100k each
```
