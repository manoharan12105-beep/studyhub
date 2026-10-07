# HLD vs LLD — Practice

### P1. Classify the prompt

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** HLD, LLD

Which prompt is a low-level design question?

- A) Design YouTube
- B) Design a URL shortener for 100 million links
- C) Design the classes for a parking lot
- D) Design a global chat service

<details>
<summary>Answer</summary>

**Answer:** C) Design the classes for a parking lot

It asks for entities, responsibilities and relationships — object-oriented, low-level design.

</details>

### P2. Sort the concerns

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** HLD, LLD

Label each concern HLD or LLD: (a) choosing a shard key, (b) a `LikeService.like()` method signature, (c) whether to add a CDN, (d) using a doubly linked list for LRU order, (e) where sessions are stored.

<details>
<summary>Answer</summary>

(a) HLD, (b) LLD, (c) HLD, (d) LLD, (e) HLD. The shard key is an HLD detail that matters enough to discuss in depth.

</details>

### P3. Opening line

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** interview communication

You are asked "Design Instagram". Write the one sentence you would say before anything else, and explain why.

<details>
<summary>Answer</summary>

For example: "I'll start by clarifying requirements and stay at the high level — components, data flow and trade-offs — and we can zoom into any component you'd like." It sets the altitude, invites the interviewer to redirect early, and signals that you will derive the design from requirements.

</details>
