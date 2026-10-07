# API Versioning, Pagination and Filtering — Practice

### P1. Breaking or not?

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** compatibility

Breaking (B) or non-breaking (N)? (a) add `avatarUrl` to the user response, (b) rename `name` to `fullName`, (c) add optional `?sort=`, (d) change `price` from a number to a string.

<details>
<summary>Answer</summary>

(a) N, (b) B, (c) N, (d) B.

</details>

### P2. Pagination for a feed

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** cursor pagination

An infinite-scroll timeline with constant new posts should use:

- A) Offset pagination with `page=N`
- B) Cursor pagination based on the last item's timestamp and id
- C) Returning the entire timeline in one response
- D) Random sampling

<details>
<summary>Answer</summary>

**Answer:** B) Cursor pagination based on the last item's timestamp and id

Stable under inserts and fast at any depth.

</details>

### P3. Why the tiebreaker

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** deterministic sort

Pages are sorted by `created_at`. Several posts share the same timestamp. What can go wrong, and how do you fix it?

<details>
<summary>Answer</summary>

Rows with equal timestamps have no defined order, so the database may return them in different orders on different queries, and a cursor on `created_at` alone cannot say which of the tied rows were already seen — items get skipped or repeated. Sort by `(created_at, id)` and put both in the cursor.

</details>

### P4. Plan the deprecation

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** versioning

You must change `GET /orders` to return amounts in minor units (cents) instead of decimals. Describe the rollout.

<details>
<summary>Answer</summary>

This changes a field's meaning, so it is breaking. Release `/v2/orders` with the new format (or add a new field `amountMinor` to v1, which is non-breaking, and deprecate the old one). Announce a deprecation date for the old behaviour, add `Deprecation`/`Sunset` headers, track which clients still use it, and remove it only when traffic has moved.

</details>
