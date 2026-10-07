# Synchronous vs Asynchronous Replication and Lag — Practice

### P1. Fastest acknowledgement

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** async replication

Which replication mode acknowledges writes fastest?

- A) Synchronous to all replicas
- B) Semi-synchronous
- C) Asynchronous
- D) All are equally fast

<details>
<summary>Answer</summary>

**Answer:** C) Asynchronous

</details>

### P2. Write latency

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** sync latency

Local commit takes 2 ms. Replica round trips: R1 = 1 ms, R2 = 3 ms, R3 = 70 ms (another region). Roughly what is the write latency with (a) async, (b) semi-sync waiting for one replica, (c) sync waiting for all?

<details>
<summary>Answer</summary>

(a) ≈ **2 ms**. (b) ≈ 2 + 1 = **3 ms** (fastest replica). (c) ≈ 2 + 70 = **72 ms** (slowest replica).

</details>

### P3. Name the anomaly

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** lag anomalies

Name each: (a) I change my display name and still see the old one; (b) I see a reply before the question it answers; (c) a like count goes 10 → 12 → 11 across refreshes.

<details>
<summary>Answer</summary>

(a) Read-your-writes violation, (b) consistent-prefix (causal ordering) violation, (c) monotonic-reads violation.

</details>
