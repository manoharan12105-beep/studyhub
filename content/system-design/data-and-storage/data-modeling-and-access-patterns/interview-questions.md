# Data Modeling and Access Patterns — Interview Questions

## Beginner

### Q1. What is an access pattern?

**Style:** Direct

<details>
<summary>Answer</summary>

A specific, repeated way the application reads or writes data — for example "get a user's 20 most recent photos" or "list comments on a photo, newest first" — together with how often it happens. Access patterns tell you which lookups and sorts must be fast, which drives the schema, keys, indexes and choice of database.

</details>

### Q2. Why list access patterns before choosing a database?

**Style:** Why

<details>
<summary>Answer</summary>

Because each database is fast for some query shapes and slow for others. Listing the patterns first reveals the hard, frequent queries (such as a feed requiring lookups across follows and photos sorted by time) and lets you pick a model and store that serve them, instead of discovering mismatches in production.

</details>

## Intermediate

### Q3. Why store images in object storage instead of the database?

**Style:** Why

<details>
<summary>Answer</summary>

Large binary files bloat the database, slow backups and replication, consume expensive database storage and I/O, and cannot be served efficiently through a CDN from there. Object storage is cheap, highly durable and built for large files; the database keeps only metadata and the object key.

</details>

### Q4. What are the trade-offs of denormalisation?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Denormalisation copies data to where it is read (a like counter, an author name in each comment) so reads avoid joins or counts and get faster. The cost is extra storage and write work, and the risk of inconsistency: every copy must be updated when the source changes, often asynchronously. Use it for hot read paths and keep a normalised source of truth for reconciliation.

</details>

### Q5. In a photo app, which access pattern is hardest and why?

**Style:** Scenario

<details>
<summary>Answer</summary>

The home feed: it is the most frequent request, and it combines the follow graph (who I follow) with many users' recent photos, sorted by time and paginated. It needs an index on photos by author and time, and at scale a precomputed per-user feed populated when photos are posted.

</details>

## Advanced

### Q6. How do you enforce "a user can like a photo only once" at scale?

**Style:** Design

<details>
<summary>Answer</summary>

Make the like record's key the pair `(user_id, photo_id)` with a unique constraint (or as the primary key in a key-value store), so a duplicate insert fails or is a no-op — the write is idempotent. Increment the denormalised counter only when the insert actually created a row, and reconcile counters periodically.

</details>
