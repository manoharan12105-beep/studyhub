# Cache Invalidation and TTL — Interview Questions

## Beginner

### Q1. What is TTL in caching?

**Style:** Direct

<details>
<summary>Answer</summary>

Time to live: the duration after which a cache entry expires automatically. The next read misses and reloads the value from the source. It bounds how stale cached data can be and frees memory used by entries that are no longer read.

</details>

### Q2. What is the difference between TTL expiry and active invalidation?

**Style:** Comparison

<details>
<summary>Answer</summary>

TTL is passive: entries expire on a timer, so data can be stale up to the TTL, but no write path needs to know about the cache. Active invalidation deletes or updates entries when the data changes, so reads are fresh, but every code path that changes the data must trigger it, and a missed invalidation leaves stale data indefinitely unless there is also a TTL.

</details>

## Intermediate

### Q3. How would you choose TTLs for different kinds of data?

**Style:** How

<details>
<summary>Answer</summary>

From how stale each type may be and how expensive it is to recompute: feeds and trending lists tolerate tens of seconds; profile cards and product details a few minutes with invalidation on edit; versioned static assets a year; permissions, privacy and account status should be invalidated on change or not cached for authorisation decisions. Add jitter to TTLs of popular keys to avoid synchronized expiry.

</details>

### Q4. Why is cache invalidation considered hard?

**Style:** Why

<details>
<summary>Answer</summary>

The cache and the source change independently, so there is always a window of inconsistency; concurrent readers and writers can race and re-insert old values; one source change can affect many derived cached entries (feeds, pages, search results) across services and servers; and invalidation messages can be lost. Getting all of these right on every write path is difficult.

</details>

### Q5. What are versioned cache keys?

**Style:** How

<details>
<summary>Answer</summary>

Keys that include a version number from the source (`product:7:v12`). Updating the product increments its version, so readers construct the new key and miss, loading fresh data; old keys are never read again and expire by TTL. It avoids explicit deletes and races where a stale value is written back under the current key.

</details>

## Advanced

### Q6. A user edits a photo caption, but followers' cached feeds keep showing the old caption. How would you design caching to avoid this?

**Style:** Design

<details>
<summary>Answer</summary>

Cache feeds as lists of photo IDs and cache each photo object separately, then assemble the feed from the ID list plus per-photo lookups (a multi-get). A caption edit invalidates only `photo:{id}`, and every feed shows the new caption on the next read. Feed lists themselves expire by TTL or are updated when photos are added or removed.

</details>

### Q7. How do you invalidate local in-memory caches on 50 application servers?

**Style:** How

<details>
<summary>Answer</summary>

Broadcast invalidation messages through pub/sub (for example Redis pub/sub or a message topic) that every server subscribes to, deleting the key locally; keep short TTLs on local caches so a missed message only causes brief staleness; or avoid local caches for data that changes and must be consistent, using the shared cache instead.

</details>
