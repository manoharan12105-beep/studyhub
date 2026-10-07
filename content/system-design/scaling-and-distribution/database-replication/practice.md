# Database Replication and Read Replicas — Practice

### P1. What replication scales

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** read scaling

Adding two read replicas to a single-primary database mainly increases:

- A) Write throughput
- B) Read throughput and availability
- C) Maximum data size
- D) Transaction isolation

<details>
<summary>Answer</summary>

**Answer:** B) Read throughput and availability

Writes still go to one primary, and every replica holds all the data.

</details>

### P2. The bad DELETE

**Difficulty:** Easy · **Type:** Failure · **Concepts:** replication vs backup

An engineer accidentally deletes all orders from yesterday on the primary. What happens on the replicas, and how do you recover?

<details>
<summary>Answer</summary>

The delete replicates to the replicas within milliseconds, so they lose the rows too. Recover from a backup with point-in-time recovery to just before the delete (restored to a separate instance, then copy the missing rows back).

</details>

### P3. Read routing

**Difficulty:** Medium · **Type:** Design · **Concepts:** read-your-writes

Which reads should go to the primary? (a) a user viewing the post they published 1 second ago, (b) the public trending page, (c) checking the balance before approving a withdrawal, (d) another user's profile.

<details>
<summary>Answer</summary>

(a) Primary (read-your-writes), (b) replica, (c) primary (decision on the latest data), (d) replica.

</details>

### P4. Failover data loss

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** async replication, failover

With asynchronous replication, the primary acknowledged 50 writes that had not reached any replica when it crashed. A replica is promoted. What happens to those writes, and what setting would have prevented it?

<details>
<summary>Answer</summary>

They are lost: the new primary never received them, and clients were told they succeeded. Synchronous (or semi-synchronous) replication — acknowledging a write only after at least one replica has it — prevents this at the cost of higher write latency.

</details>
