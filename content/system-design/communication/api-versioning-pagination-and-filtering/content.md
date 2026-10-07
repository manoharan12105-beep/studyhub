# API Versioning, Pagination and Filtering

**Module:** Communication and APIs · **Interview priority:** Frequently asked

## What Is It?

Three practices that keep an API usable as it grows:

- **Versioning** lets the API change without breaking clients that cannot update immediately (installed mobile apps, partners).
- **Pagination** returns large collections in pages instead of all at once.
- **Filtering and sorting** let clients ask for exactly the subset they need.

## Why It Exists

An API that returns every order in one response works with 50 orders and fails with 5 million: memory blows up, responses time out, and the database scans everything. An API that renames a field breaks every client still expecting the old name. These practices exist because APIs live much longer than their first version.

## How It Works

### Versioning

**Compatible (non-breaking) changes** need no new version: adding an optional field to a response, adding an optional request parameter, adding a new endpoint. Clients must ignore fields they do not know.

**Breaking changes** need a new version: removing or renaming a field, changing a type or meaning, making an optional parameter required, changing error formats.

| Scheme | Example | Notes |
|--------|---------|-------|
| URL path | `/api/v2/orders` | Most visible and easiest to route and cache; the common choice |
| Header | `Accept: application/vnd.example.v2+json` or `API-Version: 2` | Cleaner URLs; harder to test in a browser |
| Query parameter | `/orders?version=2` | Simple, but easy to forget and mixes with filters |

Run old and new versions side by side, announce a **deprecation** period, measure who still calls the old version, and only then remove it.

### Pagination

**Offset pagination:** `GET /orders?limit=20&offset=40` (or `page=3`).

- Simple; clients can jump to any page.
- **Slow on deep pages:** the database still reads and skips the first `offset` rows (`OFFSET 1000000` reads a million rows).
- **Unstable:** if a row is inserted or deleted while paging, items are skipped or shown twice.

**Cursor (keyset) pagination:** `GET /orders?limit=20&cursor=eyJ0IjoiMjAyNi0xMC0wNyIsImlkIjo5MTJ9`

The cursor encodes the last item seen (for example its timestamp and id). The next page is a range query that an index answers directly:

```sql
-- Illustrative
SELECT * FROM orders
WHERE (created_at, id) < ('2026-10-07 10:15:00', 912)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

- Fast at any depth, stable under inserts.
- Cannot jump to "page 500"; only next (and previous, with a second cursor).

| | Offset | Cursor |
|---|--------|--------|
| Deep pages | Slower and slower | Constant time with an index |
| Concurrent inserts | Duplicates or gaps | Stable |
| Jump to page N | Yes | No |
| Typical use | Admin tables, small data | Feeds, timelines, large lists, infinite scroll |

Always enforce a **maximum page size** (for example 100) so a client cannot request a million rows.

### Filtering and sorting

```text
GET /products?category=lamps&minPrice=10&maxPrice=50&inStock=true&sort=-rating,price&fields=id,name,price
```

- Accept only **allowed** filter and sort fields — each one must be backed by an index, or a filter becomes a full table scan.
- `sort=-rating` (descending) is a common convention; always add a unique tiebreaker (the id) so pages are deterministic.
- **Sparse fieldsets** (`fields=`) reduce payload size for mobile clients.
- For free-text search across many fields, use a search system rather than `LIKE '%lamp%'` ([Search Systems](../../data-and-storage/search-systems/content.md)).

**Think about it:** an infinite-scroll feed uses `?page=N&limit=20`. Users report seeing the same post twice while scrolling. Why?

<details>
<summary>Answer</summary>

New posts are inserted at the top while the user scrolls, shifting every later item down. Page 3 then starts with items the user already saw at the end of page 2. Cursor pagination ("items older than the last one I saw") is stable under inserts.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "Adding a new version for every change." Additive changes are compatible; version only for breaking changes, or clients will be stuck maintaining many versions.

- **Unbounded `limit`** — one request can take down the database.
- **Filters on unindexed columns** — fine in development, a full scan in production.

## Interview Follow-up

- *"How would you paginate a feed of 10 million posts?"* Cursor pagination on `(created_at, id)` with a composite index, a maximum page size, and an opaque, encoded cursor.

## Key Takeaways

- Add fields freely; version (usually in the URL) only for breaking changes, with a deprecation period.
- Offset pagination is simple but slow at depth and unstable; cursor pagination is fast and stable for large or changing lists.
- Whitelist filter and sort fields, back them with indexes, cap page sizes, and add a tiebreaker to sorts.
