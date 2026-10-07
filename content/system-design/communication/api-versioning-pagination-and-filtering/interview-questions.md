# API Versioning, Pagination and Filtering — Interview Questions

## Beginner

### Q1. Why do APIs need versioning?

**Style:** Why

<details>
<summary>Answer</summary>

Because clients cannot all update at once — installed mobile apps and third-party integrations may run old code for months. Versioning lets you introduce breaking changes in a new version while old clients keep working against the old one until it is deprecated and retired.

</details>

### Q2. Which API changes are breaking and which are not?

**Style:** Comparison

<details>
<summary>Answer</summary>

Non-breaking: adding a new endpoint, adding an optional request parameter, adding a field to a response (clients must ignore unknown fields). Breaking: removing or renaming a field, changing a field's type or meaning, making an optional input required, changing status codes or error formats.

</details>

## Intermediate

### Q3. Compare offset and cursor pagination.

**Style:** Comparison

<details>
<summary>Answer</summary>

Offset pagination (`limit` + `offset`) is simple and allows jumping to any page, but the database still reads all skipped rows, so deep pages get slow, and inserts or deletes during paging cause duplicates or gaps. Cursor pagination returns items after an encoded position (for example the last item's timestamp and id); it uses an index range scan, stays fast at any depth and is stable under inserts, but cannot jump to arbitrary pages.

</details>

### Q4. Why does `OFFSET 1000000` get slow?

**Style:** Why

<details>
<summary>Answer</summary>

The database must produce and discard the first million rows in sort order before returning the page, so the work grows with the offset even though only 20 rows are returned. Keyset (cursor) pagination starts reading directly at the right index position.

</details>

### Q5. How do you keep filtering and sorting from hurting the database?

**Style:** How

<details>
<summary>Answer</summary>

Allow only whitelisted filter and sort fields that are backed by suitable indexes (often composite indexes matching common filter + sort combinations), cap page sizes, require a deterministic sort with a unique tiebreaker, and route free-text search to a search engine rather than `LIKE` queries.

</details>

## Advanced

### Q6. Where would you put the version — URL, header or query string?

**Style:** Trade-off

<details>
<summary>Answer</summary>

URL path versioning (`/v2/...`) is the most common: visible, easy to route at gateways, test in browsers and cache separately. Header versioning keeps URLs stable and is more "pure" but is easier to forget and harder to debug or cache correctly (needs `Vary`). Query parameters are simple but mix with filters. Most teams choose the URL path and version only for breaking changes.

</details>

### Q7. How do you retire an old API version safely?

**Style:** How

<details>
<summary>Answer</summary>

Announce deprecation with a date, add deprecation headers (`Deprecation`, `Sunset`), measure remaining traffic per client, contact heavy users, keep the old version working (possibly as a thin adapter over the new one) until traffic is near zero, then remove it — optionally with brief planned "brownouts" first to surface forgotten clients.

</details>
