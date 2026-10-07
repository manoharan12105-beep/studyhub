# Load-Balancing Algorithms — Practice

### P1. Round robin trace

**Difficulty:** Easy · **Type:** Output · **Concepts:** round robin

Servers A, B, C; requests 1–8 with round robin. Which server gets request 8?

<details>
<summary>Answer</summary>

1A, 2B, 3C, 4A, 5B, 6C, 7A, **8B**.

</details>

### P2. Least connections

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** least connections

Open connections: S1 = 12, S2 = 4, S3 = 9. A new connection arrives. Under least connections it goes to:

- A) S1
- B) S2
- C) S3
- D) The next in round-robin order

<details>
<summary>Answer</summary>

**Answer:** B) S2

</details>

### P3. Weighted shares

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** weighted round robin

Weights: S1 = 2, S2 = 3, S3 = 5. Out of 1,000 requests, how many does each get?

<details>
<summary>Answer</summary>

Total weight 10: S1 **200**, S2 **300**, S3 **500**.

</details>

### P4. Choose the algorithm

**Difficulty:** Medium · **Type:** Design · **Concepts:** algorithm selection

Choose: (a) identical stateless API servers with short requests, (b) a WebSocket gateway fleet, (c) a fleet where half the servers have twice the CPU, (d) a cache tier where each key should hit the same node.

<details>
<summary>Answer</summary>

(a) Round robin (or least outstanding requests), (b) least connections, (c) weighted round robin / weighted least connections with weights 2:1, (d) consistent hashing on the key.

</details>
