# Data Modeling and Access Patterns

**Module:** Data and Storage · **Interview priority:** Core

## What Is It?

An **access pattern** is a question the application asks its data store over and over: "show this user's profile", "show my home feed", "list this photo's comments, newest first". **Data modeling** is deciding which records exist, which fields and keys they have, and how they relate, so that the important access patterns are fast and correct.

The order matters: **questions first, data shape second, technology last.** "PostgreSQL or MongoDB?" is the final decision, not the first.

## Why It Exists

A database answers the questions it was shaped for quickly and the others slowly. If you pick a store and a schema before listing the questions, you discover the hard query — usually the most frequent one — after it is too late.

## How It Works

### Step 1: list the access patterns

For a photo-sharing app:

| # | Access pattern | Read or write | Frequency |
|---|----------------|---------------|-----------|
| 1 | Show a user's profile | Read | High |
| 2 | Show all photos by a user, newest first | Read | High |
| 3 | **Show my home feed** (recent photos from everyone I follow) | Read | **Highest** |
| 4 | Upload a photo | Write | Low |
| 5 | Like a photo; show its like count | Write / read | High |
| 6 | Comment on a photo; list its comments | Write / read | Medium |
| 7 | Follow / unfollow a user | Write | Low |

### Step 2: derive the records

```text
users     (id, name, email, created_at)
photos    (id, posted_by → users.id, caption, upload_time, image_key)   ← the file itself lives in object storage
likes     (user_id, photo_id, created_at)        unique (user_id, photo_id): one like per user
comments  (id, user_id, photo_id, text, created_at)
follows   (follower_id, followee_id, created_at) unique pair
```

Two observations:

- **Files live elsewhere.** A photo row holds only a key or link (`image_key`); the bytes go to [object storage](../object-and-blob-storage/content.md).
- **Connections are pairs of IDs plus a little extra.** A like is `(user_id, photo_id, time)`; a follow is `(follower_id, followee_id)`. Photo 42's like count is the number of like rows with `photo_id = 42` — or a precomputed counter if counting is too slow.

### Step 3: check each pattern against the model

The feed is the hard one. For Alan, who follows 200 people: find the 200 followee IDs, fetch their recent photos, merge and sort by time, return the top 20. It touches two record types, needs sorting, and is the most frequent action. So:

- `photos` must be fast to look up **by `posted_by`** and sort **by `upload_time`** → an index on `(posted_by, upload_time)`.
- At larger scale, the feed may be **precomputed** on write (each new photo is pushed into followers' feed lists) — see the [photo-sharing case study](../../case-studies/design-photo-sharing-app/content.md).

You only see this by starting from access patterns.

### Normalise or denormalise?

- **Normalised** (each fact stored once, joined at read time): no duplication, easy updates, but reads may need joins.
- **Denormalised** (copies stored where they are read, such as the author's name inside each comment, or a `like_count` column): faster reads, but every copy must be updated when the source changes.

Read-heavy systems denormalise the hottest paths deliberately and keep the normalised data as the source of truth.

**Think about it:** the like count is shown on every photo in every feed, millions of times per second. Counting like rows each time is too slow. What do you store, and what is the cost?

<details>
<summary>Answer</summary>

Store a denormalised `like_count` per photo (in the photos table or a cache), incremented when a like is written. Cost: the counter can drift from the true count if an increment fails or is applied twice, and a hot photo's counter becomes a write hot spot. Mitigate with idempotent like writes (the unique `(user_id, photo_id)` constraint), periodic reconciliation from the likes table, and sharded or batched counters for viral photos.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** opening with "I'll use MongoDB because it scales." Start from access patterns and data relationships; the store follows from them.

## Interview Follow-up

- *"What indexes does your design need?"* Read them off the access patterns: each frequent filter and sort becomes an index, such as `photos(posted_by, upload_time)` and `comments(photo_id, created_at)`.

## Key Takeaways

- Questions first, data shape second, technology last.
- List access patterns with frequency; the most frequent complex one (often a feed) drives the design.
- Store files in object storage and references in the database; relationships are pairs of IDs.
- Denormalise deliberately for hot reads and keep a normalised source of truth.
