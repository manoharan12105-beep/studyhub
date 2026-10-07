# Quorum Reads and Writes — Practice

### P1. Does it overlap?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** W + R > N

N = 3. Which configuration guarantees that a read sees the latest successful write?

- A) W = 1, R = 1
- B) W = 1, R = 2
- C) W = 2, R = 2
- D) W = 2, R = 1

<details>
<summary>Answer</summary>

**Answer:** C) W = 2, R = 2

2 + 2 = 4 > 3. All the others sum to 3 or less.

</details>

### P2. Failure tolerance

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** quorum availability

N = 5, W = 4, R = 2. Is overlap guaranteed? How many replicas can be down for writes and for reads?

<details>
<summary>Answer</summary>

4 + 2 = 6 > 5 → **overlap guaranteed**. Writes tolerate 5 − 4 = **1** failure; reads tolerate 5 − 2 = **3**.

</details>

### P3. Design the quorum

**Difficulty:** Medium · **Type:** Design · **Concepts:** tuning W and R

N = 3. Reads are 99 % of traffic and must be as fast as possible but never stale. Choose W and R and state the cost.

<details>
<summary>Answer</summary>

W = 3, R = 1 (3 + 1 > 3): reads wait for one replica (fastest), always overlapping the write set. Cost: every write must reach all three replicas, so writes are slower and fail if any replica is down.

</details>
