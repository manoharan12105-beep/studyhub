# Data Modeling and Access Patterns — Practice

### P1. Correct order

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** modeling process

What is the recommended order of decisions?

- A) Database → schema → access patterns
- B) Access patterns → data shape → database technology
- C) Technology → access patterns → data shape
- D) Schema → technology → access patterns

<details>
<summary>Answer</summary>

**Answer:** B) Access patterns → data shape → database technology

</details>

### P2. Index from pattern

**Difficulty:** Medium · **Type:** Design · **Concepts:** indexes from access patterns

Access pattern: "list the 20 newest comments on a photo". Which index supports it?

<details>
<summary>Answer</summary>

A composite index on `comments(photo_id, created_at)` (descending order on `created_at`, or scanned backwards), so the database jumps to one photo's comments already sorted by time and reads 20 entries.

</details>

### P3. Model a feature

**Difficulty:** Medium · **Type:** Design · **Concepts:** relationships

Add "save a photo to a named collection" (users can have many collections; a photo can be in many collections). Which records do you add?

<details>
<summary>Answer</summary>

`collections(id, owner_id, name, created_at)` and a junction record `collection_items(collection_id, photo_id, added_at)` with a unique `(collection_id, photo_id)`, plus an index for "items in a collection, newest first" on `(collection_id, added_at)`.

</details>

### P4. Counter drift

**Difficulty:** Hard · **Type:** Failure · **Concepts:** denormalisation

The like counter on photo 42 shows 1,005 but there are 1,000 like rows. Give two possible causes and a fix.

<details>
<summary>Answer</summary>

Causes: a retried request incremented the counter twice although the like insert was a duplicate no-op; or an unlike decremented in the database but the counter update failed. Fix: increment or decrement only based on whether the like row was actually created or deleted (in the same transaction, or via an event from the like table), and run a periodic job that recomputes counters from the like rows.

</details>
