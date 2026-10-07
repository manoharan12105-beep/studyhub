# The CAP Theorem — Practice

### P1. The real choice

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** CAP

According to CAP, what must a replicated system give up **during a network partition**?

- A) Partition tolerance or consistency
- B) Consistency or availability
- C) Availability or durability
- D) Nothing, if it uses SQL

<details>
<summary>Answer</summary>

**Answer:** B) Consistency or availability

</details>

### P2. CP or AP?

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** choosing per feature

Choose CP or AP during a partition: (a) booking the last seat on a flight, (b) showing a video's view count, (c) a distributed lock for a nightly job, (d) a shopping cart's item list, (e) DNS answers.

<details>
<summary>Answer</summary>

(a) CP, (b) AP, (c) CP, (d) AP (merge carts after the partition), (e) AP.

</details>

### P3. What does node 2 return?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** partition behaviour

A partition separates nodes 1 and 2. A write sets `stock = 0` on node 1. A client reads `stock` from node 2, whose last known value is 3. What does a CP system return, and what does an AP system return?

<details>
<summary>Answer</summary>

CP: an error or timeout (node 2 cannot confirm it has the latest value). AP: `3` — a stale value — so the client may try to buy an item that is out of stock, which must then be caught when the order is processed.

</details>

### P4. Fix the statement

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** CAP misconceptions

Correct: "Our PostgreSQL database is CA because we chose consistency and availability and gave up partition tolerance."

<details>
<summary>Answer</summary>

A single PostgreSQL node is not a distributed system, so CAP's trade-off does not arise for it — it is "CA" only in the trivial sense that there are no network partitions between replicas. Once you add replicas and failover, partitions can occur and you must decide: reject writes without the primary or a quorum (CP behaviour) or accept possibly stale reads/writes on replicas (AP behaviour).

</details>
