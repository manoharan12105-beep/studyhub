# Multi-Leader and Leaderless Replication — Practice

### P1. Conflict

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** write conflicts

Which replication style has no write conflicts between replicas in normal operation?

- A) Single-leader
- B) Multi-leader
- C) Leaderless
- D) All of them have conflicts constantly

<details>
<summary>Answer</summary>

**Answer:** A) Single-leader

One node orders all writes.

</details>

### P2. LWW outcome

**Difficulty:** Medium · **Type:** Output · **Concepts:** last write wins

Two leaders receive concurrent writes to a title: "Draft" stamped 10:00:00.120 by leader A, and "Final" stamped 10:00:00.090 by leader B whose clock runs 50 ms slow. Under LWW, which title survives, and was that the real last write?

<details>
<summary>Answer</summary>

"Draft" survives (larger timestamp). But B's clock is 50 ms slow, so its write actually happened at about 10:00:00.140 real time — after A's. LWW kept the earlier write and discarded the later one without any error.

</details>

### P3. Choose a strategy

**Difficulty:** Medium · **Type:** Design · **Concepts:** conflict resolution

Choose a conflict strategy: (a) a "likes" counter edited in two regions, (b) a user's display name, (c) the tags on a photo edited on two devices.

<details>
<summary>Answer</summary>

(a) A CRDT counter (each region keeps its own increments; the value is the sum) — no lost likes. (b) LWW or a home region per user — a lost concurrent rename is acceptable. (c) Merge as a set union (or an OR-set CRDT so removals are respected).

</details>
