# Case Study: Design a Photo-Sharing App

**Module:** Case Studies · **Interview priority:** Core

How to use this case study: the design grows **one failure at a time**, the way real systems do. At each step, decide what you would add before reading the answer. Every component must trace back to a requirement or a failure.

## Problem

Design an Instagram-like app: users upload photos, follow other users, and scroll a home feed of recent photos from people they follow; they can like and comment.

## Requirements

**Functional:** sign up and log in; upload a photo with a caption; follow and unfollow users; view a home feed (newest first, paginated); view a user's profile and photos; like and comment.

**Non-functional:**

- Feed loads in **under 200–500 ms**; uploads may take a few seconds.
- **Photos are never lost** once the upload is confirmed; like counts may be a few seconds stale.
- Scales from thousands to tens of millions of users; read-heavy.
- Highly available; cost-conscious.

## Assumptions

From [Back-of-the-Envelope Estimation](../../foundations/back-of-the-envelope-estimation/content.md): **10 million DAU**; each views ~50 photos and uploads ~0.2 per day; stored photo ~2 MB (plus resized versions); feed image ~200 KB; average user follows ~200 people; a few accounts have millions of followers.

## Scale Estimation

```text
Feed/photo reads ≈ 5,800/s average, ≈ 17,000/s peak      Uploads ≈ 23/s (peak ≈ 70/s)
Read:write ≈ 250 : 1
New photo storage ≈ 4 TB/day → ≈ 1.5 PB/year (before replicas and resized copies)
Image bandwidth ≈ 9 Gbps average (≈ 28 Gbps peak)
Metadata (photo rows, likes, follows): gigabytes per day — small compared to images
```

So: images dominate storage and bandwidth (object storage + CDN), metadata writes are modest (one relational primary for a long time), and the read path (feed) is where design effort goes.

## APIs

```http
POST /api/v1/photos/uploads          → { uploadUrl (presigned), photoId }      client then PUTs the file
POST /api/v1/photos/{photoId}/complete  { caption }                            → 202 Accepted (processing)
GET  /api/v1/feed?limit=20&cursor=…  → { items: [ {photoId, author, imageUrl, caption, likeCount, …} ], nextCursor }
GET  /api/v1/users/{id}/photos?cursor=…
POST /api/v1/users/{id}/follow        DELETE /api/v1/users/{id}/follow
PUT  /api/v1/photos/{id}/like         DELETE /api/v1/photos/{id}/like        (idempotent)
POST /api/v1/photos/{id}/comments
```

Likes use `PUT`/`DELETE` on a sub-resource, so they are idempotent; feeds use cursor pagination ([Pagination](../../communication/api-versioning-pagination-and-filtering/content.md)).

## Data Model

From [Data Modeling](../../data-and-storage/data-modeling-and-access-patterns/content.md):

```text
users    (id, name, email, created_at)
photos   (id, posted_by, caption, upload_time, image_key, status)   index (posted_by, upload_time DESC)
likes    (user_id, photo_id, created_at)   PRIMARY KEY (user_id, photo_id)   + like_count on photos (denormalised)
comments (id, photo_id, user_id, text, created_at)   index (photo_id, created_at)
follows  (follower_id, followee_id, created_at)      PRIMARY KEY pair; index (followee_id) for "who follows me"
Image bytes → object storage under image_key; resized variants under derived keys
```

## Basic Architecture

**Day one:** one $10/month server running the web app, PostgreSQL and the uploaded files on local disk. Easy to build and debug — the right start.

Then the app is featured and **10,000 people arrive in a day**. Work through the failures:

**Failure 1 — CPU and memory run out; pages take 10 s.** *What do you add?*

<details>
<summary>Answer</summary>

More app servers behind a **load balancer** (horizontal scaling); DNS points to the balancer. Before that, quick wins: indexes and a bigger machine.

</details>

**Failure 2 — users are randomly logged out.** *Why, and what is the fix?*

<details>
<summary>Answer</summary>

Sessions live in each server's memory; the next request hits another server. Make servers **stateless**: sessions in **Redis** (or signed tokens). See [Stateless vs Stateful](../../foundations/stateless-vs-stateful-services/content.md).

</details>

**Failure 3 — the server's disk could die and take every photo with it.** *What changes?*

<details>
<summary>Answer</summary>

Remove the single point of failure for data: photo files go to **object storage** (S3) via presigned uploads; structured data (users, photos, likes, follows) stays in **PostgreSQL**; flexible preferences and behaviour events can go to a document store. The app servers hold nothing.

</details>

**Failure 4 — heading to a million users, the feed slows from 200 ms to 500 ms.** *First fix?*

<details>
<summary>Answer</summary>

The database is scanning: add **indexes** on `photos(posted_by, upload_time)` and the other access-pattern columns ([Indexes](../../data-and-storage/database-indexing-for-scale/content.md)).

</details>

**Failure 5 — a celebrity posts; millions request the same photo and like count.** *Then?*

<details>
<summary>Answer</summary>

A **cache** (Redis) for hot data — photo metadata, profile cards, feeds — with TTLs and invalidation, plus hot-key protection; images through a **CDN**.

</details>

**Failure 6 — the single database is a single point of failure and a read hotspot.** *Then?*

<details>
<summary>Answer</summary>

**Two read replicas** (three copies): reads spread across them, writes to the primary, automated failover; **backups** with point-in-time recovery because replicas copy mistakes. Route a user's reads of their own new posts to the primary (read-your-writes).

</details>

**Failure 7 — 50 million users and billions of photo rows outgrow one database.** *Last resort?*

<details>
<summary>Answer</summary>

**Shard** by `user_id` with consistent hashing, keeping each user's photos together — as late as possible ([Sharding](../../scaling-and-distribution/sharding-fundamentals/content.md)).

</details>

## Bottlenecks

The **home feed** is the hardest and most frequent query: for Alan, find the ~200 people he follows, fetch their recent photos, merge by time, return 20 — tens of thousands of times per second. Doing that on every request ("**fan-out on read**") is expensive at scale.

## Scaling Strategy

### Feed generation: fan-out on write vs on read

| | Fan-out on write (push) | Fan-out on read (pull) |
|---|------------------------|------------------------|
| When a user posts | Insert the photo ID into **every follower's** precomputed feed list (in Redis or a feed table), via a queue | Nothing extra |
| When a user opens the feed | Read their precomputed list — fast | Query all followees' recent photos and merge — slow |
| Cost | Heavy writes for users with many followers | Heavy reads for users following many people |
| Problem case | A celebrity with 50 M followers → 50 M inserts per post | Every feed view does the merge |

**The hybrid** used in practice: fan-out on write for normal users (a few hundred followers each), and **fan-out on read for celebrities** — their recent posts are fetched at read time and merged into the precomputed feed. Feed lists store only photo IDs; photo details come from a cache via multi-get, so a caption edit updates everywhere ([Invalidation](../../caching/cache-invalidation-and-ttl/content.md)).

### Uploads

Presigned upload directly to object storage → "uploaded" event to a queue → workers validate, create thumbnails and resized versions, then mark the photo READY and trigger feed fan-out ([Object Storage](../../data-and-storage/object-and-blob-storage/content.md)). Heavy work stays off the request path.

## Caching

| Data | Cache | Freshness |
|------|-------|-----------|
| Images | CDN with long TTLs on immutable, versioned keys | Never changes |
| Photo metadata | Redis, cache-aside, invalidate on edit | Fresh after edits |
| Feed lists (IDs) | Redis lists per user, capped (e.g. 500 entries) | Updated by fan-out; ~30 s TTL for the merged page |
| Like counts | Redis counters, flushed to the database in batches | Seconds stale is fine |
| Profile cards | Redis, a few minutes TTL + invalidation | Owner sees edits via read-your-writes |

## Database Strategy

- **PostgreSQL** for users, photos, likes, comments and follows: relational, needs constraints (one like per user per photo) and modest write rates.
- Primary + 2 replicas, indexes from access patterns, PgBouncer for connections.
- Preferences and behaviour events in a document store or an event log; analytics in a warehouse.
- Shard by `user_id` when needed; likes and comments shard by `photo_id`, the follow graph may get its own store.

## Reliability

Multi-zone app servers and balancers; replicated Redis; database failover; object storage durability (eleven nines design); CDN in front of images; queues with dead-letter handling for processing; graceful degradation (if the feed service is struggling, serve the cached feed or a simple "recent from people you follow" query; hide like counts before failing the page).

## Failure Scenarios

| Scenario | Handling |
|----------|----------|
| Thumbnail worker crashes mid-job | Message redelivered (at-least-once); processing is idempotent (deterministic output keys) |
| Redis feed cache lost | Rebuild feeds lazily on read (fan-out on read fallback), protected by request coalescing |
| Celebrity posts | Not fanned out on write; merged at read; photo cached and served via CDN |
| Upload succeeds but "complete" call never arrives | Object-created event still triggers processing; orphaned uploads expire by lifecycle rule |
| Replica lag | User's own recent posts read from the primary |

## Trade-offs

- Fan-out on write buys fast reads with expensive writes and storage; the hybrid adds complexity to handle celebrities.
- Eventual consistency for feeds and counts in exchange for latency and availability; strong consistency kept for uploads (a photo confirmed is durable) and likes' uniqueness.
- PostgreSQL first for simplicity; sharding postponed until data requires it.

## Final Architecture

```text
Client ──► CDN (images) 
   └────► DNS ──► Load balancers (multi-zone) ──► stateless API servers
                                   ├──► Redis: sessions, feed lists, hot metadata, counters
                                   ├──► PostgreSQL primary + 2 replicas (idx posted_by, upload_time) → shards by user_id later
                                   ├──► Document store: preferences, behaviour events
                                   ├──► Object storage (originals + resized) ◄── presigned uploads
                                   └──► Queue ──► workers: image processing, feed fan-out, notifications
Monitoring, logs, traces across everything; backups off-system
```

## What Changes at 10x Scale

100 M DAU: shard metadata by user, move the follow graph and feeds to purpose-built stores (wide-column for feed lists), multi-region deployment with geo-DNS and regional CDNs, ranked (not purely chronological) feeds from a recommendation service, and stronger hot-key handling for global celebrities.

## Key Takeaways

- Grow the design failure by failure: load balancer, stateless servers, object storage, indexes, cache and CDN, replicas and backups, then shards.
- Images dominate storage and bandwidth: object storage + CDN; metadata is relational and modest.
- The feed is the hard part: hybrid fan-out (push for most users, pull for celebrities) with ID lists and cached photo objects.
- Every component is justified by a requirement or a failure — that reasoning is the answer.
