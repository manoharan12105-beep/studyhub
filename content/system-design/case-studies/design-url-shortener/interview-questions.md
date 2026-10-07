# Case Study: Design a URL Shortener — Interview Questions

## Beginner

### Q1. What are the core functional and non-functional requirements of a URL shortener?

**Style:** Direct

<details>
<summary>Answer</summary>

Functional: create a short code for a long URL (optionally with custom alias and expiry), redirect a short URL to its long URL, and optionally count clicks. Non-functional: very low redirect latency, high availability of redirects, globally unique codes, durability of links for their lifetime, and abuse protection.

</details>

### Q2. How many characters does a short code need?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

Base-62 codes give 62ⁿ combinations: 6 characters ≈ 56.8 billion, 7 characters ≈ 3.5 trillion. With 100 million links a month for 10 years (12 billion links), 7 characters leaves ample headroom; 6 would also suffice but with less margin.

</details>

## Intermediate

### Q3. Compare ways to generate short codes.

**Style:** Comparison

<details>
<summary>Answer</summary>

Hashing the long URL (take a prefix of MD5/SHA-256 in base 62) needs no coordination and deduplicates URLs but requires collision handling. Random codes are unguessable but need a uniqueness check on insert. A counter encoded in base 62 has no collisions and gives the shortest codes, but needs a unique counter (ranges handed out to servers) and produces guessable codes. Pre-generated key services avoid collisions at write time at the cost of an extra service.

</details>

### Q4. 301 or 302 for redirects?

**Style:** Trade-off

<details>
<summary>Answer</summary>

301 (permanent) lets browsers and proxies cache the redirect, reducing load and latency for repeat visitors, but those later clicks never reach the service (no analytics) and the destination cannot be changed for clients that cached it. 302 (temporary) sends every click through the service, enabling analytics and editable destinations at the cost of more traffic. Choose by whether analytics and flexibility matter.

</details>

### Q5. How would you cache redirects?

**Style:** Design

<details>
<summary>Answer</summary>

Cache-aside in Redis mapping code → long URL with a TTL and LRU eviction; links rarely change, so delete the key only on delete or expiry. Protect hot viral links with a short in-process cache on app servers, and protect against random-code scanning with negative caching, a Bloom filter of existing codes and rate limits. Popular redirects can also be cached at a CDN if analytics are collected another way.

</details>

### Q6. How do you record click analytics without overloading the database?

**Style:** Design

<details>
<summary>Answer</summary>

Don't increment a counter row per click (hot rows, thousands of writes per second). Emit a click event (code, timestamp, referrer, coarse location) to a log or queue such as Kafka and aggregate asynchronously with stream processing into an analytics store; serve stats from there. Losing a tiny fraction of click events is usually acceptable.

</details>

## Advanced

### Q7. How do you generate unique counter-based IDs across 50 app servers without a bottleneck?

**Style:** Design

<details>
<summary>Answer</summary>

Each server reserves a block of IDs (for example 10,000) from a durable coordinator — a database sequence or a consensus store — and assigns them locally, requesting a new block when it runs low. The coordinator is hit once per block rather than per link, and a crashed server only wastes the unused part of its block. Alternatives are Snowflake-style IDs (timestamp + machine ID + sequence), though they produce longer codes.

</details>

### Q8. The primary database fails. What still works?

**Style:** What happens if

<details>
<summary>Answer</summary>

Redirects keep working from the cache and read replicas — they only need reads — while link creation fails until failover promotes a replica (typically within tens of seconds with automated failover). This is graceful degradation: protecting the high-value read path. Semi-synchronous replication ensures links acknowledged before the failure are not lost.

</details>

### Q9. What changes when traffic grows 10×?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Data grows to tens of terabytes, so shard by hash of the short code (or use a managed key-value store); the cache becomes a multi-shard Redis Cluster with more edge caching; ID generation must be fully decentralised (bigger ranges or random codes with an extra character); analytics needs a proper streaming pipeline; and global users justify multi-region read replicas of the link data with writes routed to a home region or region-specific ID ranges.

</details>
