# Strong vs Eventual Consistency — Practice

### P1. Name the guarantee

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** session guarantees

"After I update my bio, I always see the new bio, even if other users briefly see the old one." This is:

- A) Linearizability
- B) Read-your-writes
- C) Eventual consistency only
- D) Monotonic writes

<details>
<summary>Answer</summary>

**Answer:** B) Read-your-writes

</details>

### P2. Pick the model

**Difficulty:** Medium · **Type:** Design · **Concepts:** choosing consistency

Choose strong (S), causal (C), read-your-writes (R) or eventual (E): (a) a group chat's message order, (b) the "trending now" list, (c) reserving a hotel room, (d) a user's own saved settings.

<details>
<summary>Answer</summary>

(a) C, (b) E, (c) S, (d) R.

</details>

### P3. Spot the anomaly

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** monotonic reads

A dashboard shows 1,204 orders, then 1,198 on refresh, then 1,210. Reads go to random replicas. Which guarantee is missing and how do you add it?

<details>
<summary>Answer</summary>

Monotonic reads. Pin each user's session to one replica (for example by hashing the user ID), or track the highest replication position the client has seen and read only from replicas at or beyond it.

</details>
