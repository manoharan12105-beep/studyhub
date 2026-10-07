# Data-Intensive vs Compute-Intensive Systems — Practice

### P1. Classify the feature

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** workload types

Data-intensive (D) or compute-intensive (C)? (a) showing a bank statement, (b) training a recommendation model, (c) searching logs, (d) rendering 3D animation frames, (e) delivering chat messages.

<details>
<summary>Answer</summary>

(a) D, (b) C, (c) D, (d) C, (e) D.

</details>

### P2. Wrong fix

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** diagnosis

Profiling shows an endpoint spends 5 % of its time on CPU and 95 % waiting for a database. Which change is least likely to help?

- A) Adding an index to the queried column
- B) Caching the result
- C) Moving to servers with twice as many CPU cores
- D) Running two independent queries in parallel

<details>
<summary>Answer</summary>

**Answer:** C) Moving to servers with twice as many CPU cores

The CPU is not the bottleneck.

</details>

### P3. Separate the paths

**Difficulty:** Medium · **Type:** Design · **Concepts:** async compute

An image app resizes every upload into five sizes, which takes 4 seconds of CPU. Uploads time out under load. How do you redesign?

<details>
<summary>Answer</summary>

Store the original in object storage and return immediately; publish a "resize" job to a queue; a separate worker fleet processes jobs and writes the five sizes back to storage, then marks the photo ready. Workers scale on queue depth, and slow processing no longer blocks upload requests. Until resizing finishes, clients can show the original or a placeholder.

</details>
