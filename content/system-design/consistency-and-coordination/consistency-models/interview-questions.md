# Strong vs Eventual Consistency — Interview Questions

## Beginner

### Q1. What is the difference between strong and eventual consistency?

**Style:** Comparison

<details>
<summary>Answer</summary>

Strong consistency (linearizability) guarantees that after a write completes, every subsequent read anywhere returns that value or a newer one. Eventual consistency only guarantees that replicas converge if writes stop; until then reads may return stale data. Strong costs coordination latency and availability during partitions; eventual is faster and more available.

</details>

### Q2. Give examples of features that need strong consistency and features that can be eventually consistent.

**Style:** Scenario

<details>
<summary>Answer</summary>

Strong: balances and transfers, inventory decrements, seat or slot booking, unique usernames, distributed locks, password and permission changes. Eventual: like and view counts, follower counts, feeds, recommendations, search indexes, analytics dashboards.

</details>

## Intermediate

### Q3. What is read-your-writes consistency and how is it implemented?

**Style:** How

<details>
<summary>Answer</summary>

A guarantee that a client always sees its own previous writes. Implementations: route a user's reads to the primary for a short time after they write (or for data they own), remember the log position of their last write and read only from replicas that have applied it, or update the client's local view from the write response.

</details>

### Q4. What is causal consistency?

**Style:** Direct

<details>
<summary>Answer</summary>

A model where operations that are causally related — one could have influenced the other, such as a reply to a message — are seen in that order by every client, while unrelated concurrent operations may be seen in different orders. It prevents anomalies like seeing an answer before its question, with less coordination than full linearizability.

</details>

### Q5. Why is strong consistency slower?

**Style:** Why

<details>
<summary>Answer</summary>

Every strongly consistent operation must coordinate: go through a single leader or reach a majority of replicas (consensus or quorum) before acknowledging, which adds network round trips — large ones across regions. During partitions, nodes that cannot coordinate must refuse requests.

</details>

## Advanced

### Q6. How would you design a like counter that is fast globally but never loses likes?

**Style:** Design

<details>
<summary>Answer</summary>

Store likes as unique (user, post) records — idempotent and mergeable — and keep counts as a CRDT or sharded per-region counters that sum when read. Accept eventual consistency for the displayed count (refreshed asynchronously or cached), and reconcile periodically from the like records. No coordination is needed on each like, yet no like is lost.

</details>

### Q7. A system offers only eventual consistency, but you must enforce "an item can be sold only once". How?

**Style:** Design

<details>
<summary>Answer</summary>

Funnel the decision through a single strongly consistent point: a conditional write on the item's home partition (compare-and-set on a version or `stock > 0`), a lightweight transaction / consensus-backed operation where the store offers one, or a separate strongly consistent service (a relational database or a lock service) for reservations. Everything else (browsing, display) can stay eventual.

</details>
