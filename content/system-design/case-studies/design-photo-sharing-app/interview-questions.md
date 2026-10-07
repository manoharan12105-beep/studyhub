# Case Study: Design a Photo-Sharing App — Interview Questions

## Beginner

### Q1. Where should uploaded photos be stored, and how are they served?

**Style:** Design

<details>
<summary>Answer</summary>

In object storage (S3 or similar), uploaded directly by the client with presigned URLs; the database stores only metadata and the object key. Resized versions are generated asynchronously and served to users through a CDN with long cache lifetimes on immutable keys.

</details>

### Q2. Why do users get logged out randomly after you add a second app server, and what is the fix?

**Style:** Debugging

<details>
<summary>Answer</summary>

Sessions are stored in each server's memory; when the load balancer sends the next request to the other server, it doesn't recognise the session. Store sessions in a shared store like Redis (or use signed tokens) so servers are stateless.

</details>

## Intermediate

### Q3. Explain fan-out on write vs fan-out on read for the home feed.

**Style:** Comparison

<details>
<summary>Answer</summary>

Fan-out on write pushes each new post's ID into every follower's precomputed feed list when it is posted, so reading a feed is a fast list lookup but posting is expensive for users with many followers. Fan-out on read computes the feed when requested by querying followees' recent posts and merging them, so writes are cheap but every feed view is expensive. Most systems use a hybrid.

</details>

### Q4. How do you handle a celebrity with 50 million followers in the feed design?

**Style:** Design

<details>
<summary>Answer</summary>

Don't fan out their posts on write (50 million inserts per post). Mark high-follower accounts and fetch their recent posts at read time, merging them into the follower's precomputed feed. Cache the celebrity's recent posts heavily (they are hot keys) and serve images via the CDN.

</details>

### Q5. Why is the database a good fit for photo metadata but not for photo files?

**Style:** Why

<details>
<summary>Answer</summary>

Metadata (owner, caption, time, likes, follows) is small, structured and relational, queried by indexes and protected by constraints — what a relational database does well. Files are large blobs that would bloat the database, slow backups and replication, and can't be served efficiently via a CDN; object storage is cheaper, more durable and built for them.

</details>

### Q6. How do you keep like counts fast and accurate enough?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Store each like as a unique `(user_id, photo_id)` row (idempotent, the source of truth), keep a denormalised counter in Redis incremented when a like row is actually created, flush counters to the database in batches, and periodically reconcile from the like rows. Counts may be seconds stale, which users don't notice; hot posts can use sharded counters.

</details>

## Advanced

### Q7. A user posts a photo and doesn't see it in their own profile on refresh. Why, and how do you fix it?

**Style:** Debugging

<details>
<summary>Answer</summary>

Either the image is still processing (show a placeholder state) or the read hit a lagging read replica or a cached profile. Apply read-your-writes: route the author's own profile/feed reads to the primary (or bypass the cache) for a short window after posting, and update the client view from the upload response.

</details>

### Q8. Walk through the scaling journey from one server to 50 million users.

**Style:** Follow-up

<details>
<summary>Answer</summary>

One server (app + DB + files) → load balancer and more app servers → stateless servers with sessions in Redis → files to object storage, metadata in PostgreSQL → indexes for the feed queries → caching of hot data and a CDN for images → read replicas and backups → asynchronous processing through queues → precomputed hybrid feeds → sharding by user ID when data outgrows one primary. Each step is triggered by a specific failure or requirement.

</details>
