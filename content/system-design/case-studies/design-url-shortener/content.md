# Case Study: Design a URL Shortener

**Module:** Case Studies · **Interview priority:** Core

How to use this case study: read each section's question, decide your answer, then read on. The **Think about it** prompts hide the reasoning until you have tried. The interactive builder below lets you make each decision and see its consequences.

## Problem

Build a service like bit.ly or tinyurl: given a long URL, return a short one (`https://sho.rt/aB3dE9x`); visiting the short URL redirects to the long one. It looks trivial — a key-value lookup — which is exactly why it is a favourite interview question: the interesting parts are scale, ID generation, caching and failure handling.

## Requirements

**Functional**

1. Create a short URL for a long URL (optionally a custom alias and an expiry).
2. Redirect a short URL to its long URL.
3. (Optional) Basic click analytics per link.

Out of scope: user accounts management UI, link editing, spam detection beyond basic validation.

**Non-functional**

- **Very low redirect latency** (P99 under ~50 ms server-side): redirects sit in front of every click.
- **High availability for redirects** — a broken short link on a billboard cannot be fixed later.
- **Short codes are unique** forever (no two long URLs share a code by accident) and not trivially guessable if links are private.
- **Durability:** a created link must never disappear before its expiry.

## Assumptions

- 100 million new links per month.
- Read-to-write ratio 100 : 1 (links are clicked far more than created).
- Each record (code, long URL up to ~2 KB but ~200 bytes on average, metadata) ≈ 500 bytes.
- Links kept for 10 years by default.

## Scale Estimation

```text
Writes:  100 M / month ÷ 2.6 M s/month ≈ 40 writes/s       (peak ×3 ≈ 120/s)
Reads:   × 100 ≈ 4,000 redirects/s                           (peak ≈ 12,000/s)
Records: 100 M × 12 × 10 years = 12 billion links
Storage: 12 B × 500 B = 6 TB  (≈ 18 TB with 3 replicas)
Code length: 62^6 ≈ 56.8 billion, 62^7 ≈ 3.5 trillion → 7 base-62 characters is ample
Cache:   if ~20 % of daily redirects hit a hot set of ~10 M links → 10 M × 500 B ≈ 5 GB
```

**Think about it:** what do these numbers tell you about the design before drawing anything?

<details>
<summary>Answer</summary>

Writes are tiny (tens per second) — one database primary handles them easily. Reads are thousands per second and extremely repetitive (popular links), so a cache will absorb most of them. 6 TB over ten years fits a single large database or a few shards; it is not a big-data problem. The hard parts are therefore latency and availability of redirects, and generating unique short codes without collisions or coordination bottlenecks.

</details>

## APIs

```http
POST /api/v1/urls
Content-Type: application/json

{"longUrl": "https://example.com/a/very/long/path?x=1", "customAlias": null, "expiresAt": null}
```

```http
HTTP/1.1 201 Created
Location: https://sho.rt/aB3dE9x

{"shortCode": "aB3dE9x", "shortUrl": "https://sho.rt/aB3dE9x"}
```

```http
GET /aB3dE9x
→ HTTP/1.1 301 Moved Permanently        (or 302 Found — see Trade-offs)
  Location: https://example.com/a/very/long/path?x=1
```

Plus `DELETE /api/v1/urls/{code}` (owner only) and `GET /api/v1/urls/{code}/stats`. Rate-limit creation per API key or IP to block abuse ([Rate Limiting](../../communication/rate-limiting/content.md)).

## Data Model

```text
urls
  short_code   VARCHAR(10)  PRIMARY KEY        ← the only lookup on the hot path
  long_url     TEXT         NOT NULL
  owner_id     BIGINT       NULL
  created_at   TIMESTAMP
  expires_at   TIMESTAMP    NULL
clicks (optional, write-heavy, analytics)  → an event stream, not this table
```

The access pattern is a single key lookup by `short_code`, so a key-value store (DynamoDB, Cassandra) or a relational table with the code as primary key both work. **Think about it:** which would you pick?

<details>
<summary>Answer</summary>

Either is defensible; say why. A relational database (PostgreSQL) is simple, gives a unique constraint on the code for free, and easily handles 40 writes/s and 6 TB with replicas for reads. A key-value store scales out more easily if the system grows 100×, at the cost of weaker querying (analytics by owner needs another store). A common answer: start relational for simplicity and correctness, design the key so it can be sharded by `short_code` later.

</details>

## Basic Architecture

```text
Client ──► DNS ──► Load balancer ──► stateless app servers ──► Database (urls)
```

Create: validate the URL → generate a code → insert → return. Redirect: look up the code → 301/302 with `Location`, or 404 if missing or expired.

### Generating the short code

| Approach | How | Pros | Cons |
|----------|-----|------|------|
| **Hash the long URL** | MD5/SHA-256 of the URL, take the first 7 base-62 characters | Same URL → same code (deduplication); no coordination | Collisions must be detected and resolved (retry with a salt); the same URL from two users shares one code |
| **Random code** | 7 random base-62 characters; insert with a unique constraint; retry on conflict | Simple, unpredictable codes | Collision checks; collision probability rises as the space fills (still tiny at 12 B of 3.5 T) |
| **Counter + base62** | A global, increasing ID encoded in base 62 | No collisions, shortest codes | Needs a unique counter source; codes are sequential and guessable |
| **Pre-generated keys** | A key service pre-creates unused random codes and hands them out | Fast, no collisions at write time | Another service and storage to run |

For the counter approach without a single bottleneck, each app server **reserves a range** of IDs from a coordinator (a database sequence or ZooKeeper) — say 1,000 at a time — and assigns them locally; a crashed server just wastes the rest of its range.

```java
public class Base62Demo {

    private static final String ALPHABET =
            "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    /** Turns a numeric ID into a short code: repeated division by 62, most significant digit first. */
    static String encode(long id) {
        if (id == 0) {
            return "0";
        }
        StringBuilder code = new StringBuilder();
        while (id > 0) {
            code.append(ALPHABET.charAt((int) (id % 62)));
            id /= 62;
        }
        return code.reverse().toString();
    }

    static long decode(String code) {
        long id = 0;
        for (char c : code.toCharArray()) {
            id = id * 62 + ALPHABET.indexOf(c);
        }
        return id;
    }

    public static void main(String[] args) {
        long[] ids = {1, 61, 62, 125, 1_000_000_000L, 56_800_235_583L, 3_521_614_606_207L};
        for (long id : ids) {
            String code = encode(id);
            System.out.printf("%,18d -> %-8s -> %,d%n", id, code, decode(code));
        }
        System.out.printf("Codes of length 7: 62^7 = %,d%n", (long) Math.pow(62, 7));
    }
}
```

**Output:**

```text
                 1 -> 1        -> 1
                61 -> Z        -> 61
                62 -> 10       -> 62
               125 -> 21       -> 125
     1,000,000,000 -> 15FTGg   -> 1,000,000,000
    56,800,235,583 -> ZZZZZZ   -> 56,800,235,583
 3,521,614,606,207 -> ZZZZZZZ  -> 3,521,614,606,207
Codes of length 7: 62^7 = 3,521,614,606,208
```

The billionth link still has a 6-character code; 7 characters cover over 3.5 trillion IDs. If sequential codes must not be guessable, scramble the ID with a reversible bit permutation before encoding, or use random codes.

## Bottlenecks

**Think about it:** at 12,000 redirects/s peak, what breaks first in the basic architecture?

<details>
<summary>Answer</summary>

The database read path: every redirect is a query. A single primary can serve thousands of indexed lookups per second, but peak traffic, viral links (one code receiving a huge share of requests — a hot key) and the latency target make the database the bottleneck and a single point of failure for redirects.

</details>

## Scaling Strategy

- **Stateless app servers** behind a load balancer; autoscale on request rate.
- **Cache** in front of the database for redirects (below).
- **Read replicas** for cache misses; writes go to the primary.
- **Shard by `short_code`** (hash) only if data or writes outgrow one primary — the key-only access pattern shards perfectly.
- **CDN / edge caching** of redirect responses for the most popular links (with care for analytics — a cached redirect never reaches your servers).

## Caching

- **Cache-aside** in Redis: `code → long_url`, with a TTL (for example 24 h) and LRU eviction ([Cache-Aside](../../caching/cache-aside-and-read-through/content.md)).
- Links almost never change, so staleness is rarely an issue; on delete or expiry, **delete the cache key** too.
- Viral links are hot keys: add a short-lived in-process cache on each app server ([Hot Keys](../../caching/cache-stampede-penetration-and-hot-keys/content.md)).
- Bots probing random codes cause **cache penetration**: cache "not found" briefly, or keep a Bloom filter of existing codes, and rate-limit by IP.

With a 90–95 % hit ratio, the database sees only a few hundred reads per second at peak.

## Database Strategy

- Primary + two replicas across zones; semi-synchronous replication so a created link is never lost on failover.
- Unique constraint (primary key) on `short_code` resolves random/hash collisions safely: on conflict, generate another code.
- Expired links: a background job deletes or marks them; redirect checks `expires_at`.
- Click analytics: **do not** update a counter row per click (12,000 writes/s on hot rows). Publish click events to a queue or log (Kafka) and aggregate asynchronously into an analytics store ([Message Queues](../../messaging/message-queues/content.md)).

## Reliability

- Redirect path must survive: multi-zone app servers, replicated cache, database replicas, redundant load balancers and DNS.
- If the cache is down, fall back to replicas with load shedding; if the primary is down, **redirects still work from replicas and cache** while creation is temporarily unavailable — a deliberate degradation ([Graceful Degradation](../../reliability/graceful-degradation-and-load-shedding/content.md)).
- Backups with point-in-time recovery: links are long-lived promises.

## Failure Scenarios

| Scenario | Effect | Handling |
|----------|--------|----------|
| Two servers generate the same random code | Unique-constraint violation on insert | Retry with a new code |
| ID-range coordinator unavailable | Servers cannot get new ranges | Servers hold ranges of thousands of IDs, giving minutes of buffer; coordinator is replicated |
| A link goes viral (1M clicks/min) | Hot cache key | Local in-process cache, CDN caching of the redirect |
| Bot scans random codes | Misses hammer the database | Negative caching, Bloom filter, rate limiting |
| Malicious long URLs (phishing) | Reputational and legal risk | URL validation, blocklists, abuse reporting |

## Trade-offs

| Decision | Option A | Option B |
|----------|----------|----------|
| Redirect status | **301 permanent:** browsers cache it — fewer requests, lower cost, but later clicks bypass your analytics and you cannot change the target | **302 temporary:** every click reaches you — accurate analytics and editable targets, more load |
| Code generation | **Counter + base62:** no collisions, shortest codes, guessable | **Random:** unguessable, needs collision checks |
| Storage | **Relational:** simple, constraints, easy ops | **Key-value:** easier horizontal scale, weaker queries |
| Deduplicate same long URL? | Yes: saves space (hash approach) | No: each creator gets their own code and stats |

## Final Architecture

```text
            ┌──────────── CDN (optional, popular redirects) ────────────┐
Client ──► DNS ──► Load balancer (multi-zone) ──► App servers (stateless, local hot cache)
                                                      │   ├──► Redis cluster (code → URL, TTL, LRU)
                                                      │   ├──► PostgreSQL primary (writes) + 2 replicas (reads)
                                                      │   └──► ID range service (or random codes + unique key)
                                                      └──► Click events → Kafka → analytics workers → analytics DB
```

## What Changes at 10x Scale

At 1 billion new links/month (≈ 400 writes/s) and 40,000+ redirects/s average:

- Data reaches ~60 TB over ten years → **shard by hash of `short_code`** (or move to a managed key-value store with automatic partitioning).
- Cache grows to tens of GB → Redis Cluster with several shards; more edge caching.
- ID generation must be fully decentralised: larger ranges per server, or random codes with an 8th character for headroom.
- Analytics becomes a real stream-processing pipeline.
- Multi-region deployment for global latency: replicate the (rarely changing) link data to every region; writes go to a home region or use globally unique ID ranges per region.

## Key Takeaways

- Estimate first: tiny writes, many repetitive reads, modest storage — the challenge is redirect latency, availability and code generation.
- Short codes: hash, random with uniqueness checks, counter + base62 (ranges per server), or pre-generated keys — each with trade-offs.
- Cache-aside with hot-key and penetration protection makes redirects fast; replicas and degradation keep them available.
- 301 vs 302 trades cost for analytics and flexibility; record clicks asynchronously.
