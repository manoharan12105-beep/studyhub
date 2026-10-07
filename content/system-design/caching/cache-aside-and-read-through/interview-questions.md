# Cache-Aside and Read-Through — Interview Questions

## Beginner

### Q1. Explain the cache-aside pattern.

**Style:** How

<details>
<summary>Answer</summary>

The application looks up the key in the cache; on a hit it returns the value. On a miss it queries the database, stores the result in the cache (with a TTL) and returns it. On writes it updates the database and then deletes (invalidates) the cache entry so the next read reloads fresh data.

</details>

### Q2. What is the difference between cache-aside and read-through?

**Style:** Comparison

<details>
<summary>Answer</summary>

In cache-aside the application code handles misses: it reads the database and populates the cache. In read-through the cache layer itself loads from the database on a miss, so the application only calls the cache. Read-through centralises loading logic; cache-aside gives the application control and lets it fall back to the database if the cache is unavailable.

</details>

## Intermediate

### Q3. On a write, should you update the cache entry or delete it?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Usually delete. Concurrent writers updating the cache can apply their values in a different order than the database committed them, leaving an old value cached; updating also fills the cache with data that may never be read. Deleting lets the next reader load the committed value. Updating can make sense for very hot keys where a miss is expensive, combined with versioning to reject older values.

</details>

### Q4. What are the disadvantages of lazy loading?

**Style:** Trade-off

<details>
<summary>Answer</summary>

The first request for each key pays the miss penalty (cold cache after deployments or restarts); data can be stale until invalidated or expired; and when a hot key is missing, concurrent requests can all miss at once and stampede the database.

</details>

### Q5. What happens with cache-aside if the cache cluster is down?

**Style:** What happens if

<details>
<summary>Answer</summary>

The application can treat cache errors as misses and read from the database, so the system keeps working — but the database receives all reads, which may overload it. Use short timeouts on cache calls, circuit-break the cache to avoid waiting on every request, and protect the database with request coalescing and load shedding.

</details>

## Advanced

### Q6. Describe a race condition in cache-aside that leaves stale data, and how to reduce it.

**Style:** Debugging

<details>
<summary>Answer</summary>

Reader A misses and reads value v1 from the database. Writer B updates the database to v2 and deletes the cache key. Reader A then writes v1 into the cache — stale until the TTL expires. Reduce it with short TTLs, delayed double deletion (delete again shortly after the write), versioned values where the cache rejects older versions, or invalidation driven by the database's change stream.

</details>
