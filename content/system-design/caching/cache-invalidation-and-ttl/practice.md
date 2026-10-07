# Cache Invalidation and TTL — Practice

### P1. Maximum staleness

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** TTL

Product pages are cached with a 5-minute TTL and no active invalidation. A price changes at 10:00:00, and the entry was last loaded at 9:58:00. Until when can old prices be shown?

- A) 10:00:00
- B) 10:03:00
- C) 10:05:00
- D) Indefinitely

<details>
<summary>Answer</summary>

**Answer:** B) 10:03:00

The entry loaded at 9:58:00 expires 5 minutes later.

</details>

### P2. Choose the approach

**Difficulty:** Medium · **Type:** Design · **Concepts:** TTL vs invalidation

TTL-only (T), invalidate on change + TTL (I), or don't cache for decisions (N)? (a) follower count, (b) whether a user is banned, (c) a blog post body that authors edit occasionally, (d) top-10 trending list.

<details>
<summary>Answer</summary>

(a) T, (b) N (or I with immediate invalidation; authorisation should check the source), (c) I, (d) T.

</details>

### P3. Stale forever

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** missing TTL

An entry cached without a TTL still shows a deleted product a week later. The delete code path forgot to invalidate. What two changes prevent this class of bug?

<details>
<summary>Answer</summary>

(1) Always set a TTL as a safety net, so missed invalidations heal. (2) Drive invalidation from one place — database change events or a shared repository method — rather than relying on every code path to remember.

</details>

### P4. Race

**Difficulty:** Hard · **Type:** Failure · **Concepts:** invalidation race

Describe how a cache can end up with an old value even though the writer deleted the key after updating the database, and one mitigation.

<details>
<summary>Answer</summary>

A reader misses and reads the old value from the database just before the write commits; the writer updates the database and deletes the key; the slow reader then writes the old value into the cache. Mitigations: delayed second delete after a short interval, versioned values (reject writes older than the current version), or short TTLs.

</details>
