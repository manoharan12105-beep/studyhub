# Cache Invalidation and TTL

**Module:** Caching · **Interview priority:** Core

## What Is It?

**Cache invalidation** is removing or replacing cached data when the source changes, so users do not keep seeing old values. There are two basic approaches, usually combined:

- **TTL (time to live):** every entry expires after a fixed time; the next read reloads it. Lazy and simple — data may be stale for up to the TTL.
- **Active invalidation:** when the data changes, the writer (or a change event) deletes or updates the cached entry immediately. Fresh — but every write path must remember to do it.

## Why It Exists

A slow cache is an inconvenience; a cache that **confidently serves wrong data** is a bug users see: a deleted photo still showing, a price that changed an hour ago, private photos visible after a user switched their account to private. Invalidation is famously one of the hard problems in computer science because the cache and the source are two copies that change independently.

## How It Works

### Choosing a TTL

| Data | Typical choice | Reasoning |
|------|----------------|-----------|
| Home feed | ~30 s TTL | Slightly stale is fine; recomputation is expensive |
| Trending list | ~60 s TTL | Changes gradually; everyone reads the same entry |
| Profile card | A few minutes, plus invalidation on edit | Rarely changes; owner expects edits to show |
| Product price on listing pages | Minutes, plus invalidation on change | Checkout re-reads the source anyway |
| Permissions, privacy settings, account status | **No TTL-only caching** — invalidate on every change (or don't cache) | Staleness is a security problem |
| Static assets with versioned URLs | Very long (a year) | New version = new URL |

Short TTLs mean fresher data and more misses; long TTLs mean higher hit ratios and more staleness. Even with active invalidation, keep a TTL as a **safety net** so a missed invalidation heals itself.

### Active invalidation techniques

1. **Delete on write** (cache-aside): update the database, then delete the key ([Cache-Aside](../cache-aside-and-read-through/content.md)).
2. **Event-driven invalidation:** the database's change stream (change data capture) or an application event triggers deletion of every affected key — including keys in other services and in local caches on many servers (broadcast via pub/sub).
3. **Versioned keys:** include a version in the key (`user:42:v17`); a change increments the version stored in the source record, so readers simply stop asking for the old key, which ages out.
4. **Write-through:** update cache and database together ([Write Strategies](../cache-write-strategies/content.md)).

### The hard part: derived and aggregated entries

A photo's caption appears in the photo entry, in 300 followers' cached feeds, and in a search result page. Invalidating "everything that contains this photo" requires knowing every key that depends on it. Options: keep cached objects **small and referential** (cache the feed as a list of photo IDs, and photos separately, so one photo update invalidates one entry), use tags to purge groups, or accept TTL-bounded staleness for derived views.

### Cache consistency is eventual at best

There is always a moment between the database commit and the invalidation when the cache is stale, and races between readers and writers can re-insert old values. Design so that **decisions are made against the source of truth** (checkout price, permission checks, stock), and caches serve display data.

**Think about it:** a user makes their account private. Profile data is cached with a 10-minute TTL and no active invalidation. What can go wrong, and how do you fix it?

<details>
<summary>Answer</summary>

For up to 10 minutes, cached responses may still show their photos to people who are no longer allowed to see them — a privacy breach. Privacy and permission changes must actively invalidate (or bypass) every cached entry that depends on them, and authorisation should be checked against the source of truth on each request rather than baked into cached responses.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "The worst cache bug is an empty cache." The worst is a cache confidently serving wrong data — especially permissions and deleted content. Decide per data type how stale is acceptable, and never let a cache make security decisions with stale data.

## Interview Follow-up

- *"TTL or invalidation?"* Both: active invalidation for freshness on known write paths, a TTL as the safety net, and TTL-only for derived data where bounded staleness is acceptable.

## Key Takeaways

- TTL: simple, bounded staleness. Active invalidation: fresh, but every writer must do it.
- Choose TTLs per data type; permissions and privacy need invalidation, not just TTLs.
- Keep a TTL even with invalidation; use events, versioned keys or small referential entries for derived data.
- Caches are eventually consistent: make critical decisions against the source of truth.
