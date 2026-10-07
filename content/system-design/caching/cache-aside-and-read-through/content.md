# Cache-Aside and Read-Through

**Module:** Caching · **Interview priority:** Core

## What Is It?

Two **lazy-loading** patterns: data enters the cache only when someone reads it and misses.

- **Cache-aside (lazy loading):** the **application** manages the cache. It checks the cache, and on a miss reads the database itself, then writes the result into the cache.
- **Read-through:** the **cache** (or a caching library in front of the database) manages it. The application always asks the cache; on a miss the cache loads from the database, stores the value and returns it.

## Why It Exists

Both make sure the cache holds what users actually ask for — not everything in the database — and keep the database as the source of truth. They are the most common way caches are used with relational and NoSQL databases.

## How It Works

### Cache-aside

```text
read(key):
  value = cache.get(key)
  if value != null: return value                  ← hit
  value = db.query(key)                           ← miss: app goes to the database
  cache.set(key, value, ttl = 60 s)               ← app fills the cache
  return value

write(key, newValue):
  db.update(key, newValue)                        ← database first
  cache.delete(key)                               ← then remove the stale copy
```

On writes, **delete** the cache entry rather than updating it: the next read reloads the fresh value. Updating the cache with the new value from the writer can race with other writers and leave an older value in the cache.

### Read-through

```text
App ── get(key) ──► Cache layer ── hit ──► value
                        │ miss
                        └──► loader: db.query(key) ──► store ──► value
```

The application only talks to the cache; the loading logic is configured once (for example a caching library with a loader function, or a database proxy cache). Writes still go to the database (often combined with write-through, see [Write Strategies](../cache-write-strategies/content.md)).

### Comparing them

| | Cache-aside | Read-through |
|---|-------------|--------------|
| Who loads on a miss | Application code | The cache layer / library |
| Application code | Must handle cache and database | Talks to the cache only |
| Cache down | Application can fall back to the database | Reads fail unless the layer falls back |
| Data model in cache | Anything the app chooses (often precomputed, combined objects) | Usually mirrors the database rows/queries |
| Typical tools | Redis or Memcached with application logic | Caching libraries (e.g. a loading cache), Spring's cache abstraction, some managed DB caches |

### Shared weaknesses of lazy loading

- **First request is slow** (cold cache) — warm critical keys at startup or before a launch.
- **Stale data** until the TTL expires or the entry is deleted.
- **Stampedes:** when a hot key is missing, many concurrent requests all miss and hit the database together — see [Stampede and Hot Keys](../cache-stampede-penetration-and-hot-keys/content.md).

**Think about it:** with cache-aside, why delete the cache entry *after* updating the database rather than before?

<details>
<summary>Answer</summary>

If you delete first, a concurrent read can miss, read the **old** value from the database (the update has not happened yet) and put it back into the cache, where it stays stale until the TTL expires. Deleting after the database commit shrinks that window. A small race still exists (a slow reader that read the old value before the update writes it after the delete), which is why entries also carry a TTL and some systems delete twice (immediately and again after a short delay).

</details>

## When to Use

- **Cache-aside:** the default for most applications — flexible, resilient to cache failure, caches exactly what is read.
- **Read-through:** when you want caching logic centralised and transparent to application code.

## Common Traps

> [!WARNING]
> **Common trap:** updating the cache on every write "to keep it warm". It caches data nobody may read and races between concurrent writers can leave old values. Delete on write and let reads repopulate.

## Interview Follow-up

- *"Walk me through cache-aside for a user profile."* Read: check `user:42` in Redis → on a miss query the database, set with a TTL, return. Update: write the database, then delete `user:42`.

## Key Takeaways

- Cache-aside: the application checks the cache, loads from the database on a miss, and fills the cache.
- Read-through: the cache layer loads on a miss; the application only talks to the cache.
- On writes, update the database, then delete the cache entry; keep a TTL as a safety net.
- Lazy loading means cold starts, possible staleness and stampede risk on hot keys.
