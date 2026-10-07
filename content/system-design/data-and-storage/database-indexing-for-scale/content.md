# Database Indexes at Scale

**Module:** Data and Storage · **Interview priority:** Core

## What Is It?

An **index** is an extra data structure inside the database that maps a column's values to the rows holding them, so a query can **jump** to matching rows instead of checking every row. It works like the index at the back of a book: "mitochondria → pages 1, 100, 125".

For how B-tree and other index types work internally, see [Index Fundamentals](../../../dbms-postgresql/indexing/index-fundamentals/content.md) in the DBMS subject.

## Why It Exists

As a table grows from thousands to millions of rows, a query without a usable index must scan the whole table (a **full table scan**), so its time grows with the table. In the photo app, the feed loaded in 200 ms at 10,000 users and in 500 ms heading toward millions — the database was reading every row of `photos` to find a few users' recent photos.

```text
No index:      row 1 posted_by=priya ✗ → row 2 ravi ✗ → … millions … → row 822 alan ✓ …   (grows with the table)
Index on posted_by:   alan → rows 822, 15000, 100000   → read just those                (stays fast)
```

## How It Works

### Choosing indexes from access patterns

Index the columns your frequent queries **filter**, **join** or **sort** on:

| Access pattern | Index |
|----------------|-------|
| Photos by a user, newest first | `photos(posted_by, upload_time DESC)` |
| Comments on a photo, oldest first | `comments(photo_id, created_at)` |
| Look up user by email at login | Unique index on `users(email)` |
| Has this user liked this photo? | Unique index on `likes(user_id, photo_id)` |

A **composite index** on `(posted_by, upload_time)` serves "this user's photos sorted by time" directly; the order of columns matters — it helps queries filtering on `posted_by`, but not queries filtering only on `upload_time`.

### The cost: writes and space

Every insert, update or delete must also update **every index** on the table. Index everything and writes slow down, storage grows, and the database spends memory caching indexes. Typical tables carry a handful of well-chosen indexes (three to five is common), not one per column.

### The method: measure, then index

1. Start with the primary key and unique constraints.
2. Find slow queries in production (slow-query log, query statistics, `EXPLAIN ANALYZE`).
3. Add the index that turns the scan into an index lookup; confirm with the plan and timings.
4. Remove indexes nothing uses.

A lab-style experiment shows the effect: on a table of five million rows, a filter on an unindexed column takes seconds; after adding one index the same query takes milliseconds.

### Indexes vs caches

| | Index | Cache |
|---|-------|-------|
| Lives | Inside the database | In front of the database (Redis) or in the app |
| Speeds up | Finding rows; the query still runs | Skips the database entirely for repeated reads |
| Freshness | Always consistent with the table | Can be stale |
| Cost | Slower writes, disk space | Memory, invalidation logic |

Fix missing indexes **before** adding a cache — a cache hides a slow query on hits but every miss still pays for it.

**Think about it:** an index on `users(created_at)` exists, yet `SELECT * FROM users WHERE DATE(created_at) = '2026-10-07'` still scans the whole table. Why?

<details>
<summary>Answer</summary>

Applying a function to the indexed column means the index on the raw `created_at` values cannot be searched for the computed values. Rewrite as a range on the column itself: `WHERE created_at >= '2026-10-07' AND created_at < '2026-10-08'` (or create an index on the expression).

</details>

## When Not to Use

Small tables (a few thousand rows), columns with very few distinct values used alone (a boolean flag), and write-heavy tables that are rarely queried by that column usually do not benefit enough to pay the write cost.

## Common Traps

> [!WARNING]
> **Common trap:** "Add an index to every column to be safe." Each index slows every write and uses space; unused indexes are pure cost. Index for measured, frequent queries.

## Interview Follow-up

- *"Your feed got slower as data grew. What do you check first?"* The query plan for the feed query: is it scanning `photos`? Add a composite index matching the filter and sort, then consider caching and precomputed feeds.

## Key Takeaways

- Without a usable index, query time grows with table size; an index lets the database jump to matching rows.
- Derive indexes from access patterns: filter, join and sort columns; composite index column order matters.
- Indexes cost write speed and space — measure slow queries, then index.
- Fix indexes before reaching for a cache.
