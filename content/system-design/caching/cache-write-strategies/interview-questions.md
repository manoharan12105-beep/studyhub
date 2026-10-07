# Write-Through, Write-Around and Write-Back — Interview Questions

## Beginner

### Q1. Explain write-through, write-around and write-back caching.

**Style:** Comparison

<details>
<summary>Answer</summary>

Write-through writes to the cache and the database synchronously, so the cache is always fresh but writes are slower. Write-around writes only to the database and leaves the cache to be filled on later reads, avoiding pollution but missing on reads right after writes. Write-back writes only to the cache, acknowledges immediately and flushes to the database later, giving the fastest writes but risking loss of unflushed data.

</details>

## Intermediate

### Q2. When would you choose write-around?

**Style:** Scenario

<details>
<summary>Answer</summary>

When writes are frequent but most written items are rarely read soon afterwards — for example, posts on a large social network or log-like records. Caching every write would waste memory; let reads decide what becomes cached.

</details>

### Q3. What is the main risk of write-back, and how can it be reduced?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Data loss: writes acknowledged to the client exist only in the cache until flushed, so a cache crash loses them. Reduce the risk with replicated caches, persistence (append-only logs), short flush intervals, and using write-back only for data where small losses are acceptable or can be recomputed.

</details>

### Q4. A food-delivery order status changes every few seconds. Which strategy fits?

**Style:** Scenario

<details>
<summary>Answer</summary>

Write-back works well for the frequently changing tracking status: updates go to the cache at memory speed and are read from there by the tracking screen, with the database updated in batches. The authoritative order record (payment, items) still goes to the database synchronously.

</details>

### Q5. What consistency problem can write-through still have?

**Style:** What happens if

<details>
<summary>Answer</summary>

Partial failure: if the cache write succeeds and the database write fails (or vice versa), the copies disagree. Implementations must order the writes carefully (often database first), roll back or invalidate the cache entry on failure, and keep a TTL as a safety net.

</details>

## Advanced

### Q6. Which write strategy would you choose for user account settings, and why?

**Style:** Design

<details>
<summary>Answer</summary>

Write-through (or database-first followed by cache update/delete): users expect to see changed settings immediately, settings are read often and written rarely, so synchronous writes are cheap and the cache stays fresh; losing a settings change (as write-back could) is not acceptable.

</details>
