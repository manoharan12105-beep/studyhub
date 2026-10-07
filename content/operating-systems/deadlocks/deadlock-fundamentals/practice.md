# What Is Deadlock? — Practice

### P1. Definition

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** deadlock

Which statement describes a deadlock?

- A) A process runs slowly because the CPU is busy
- B) A set of processes each wait for a resource held by another process in the set
- C) A low-priority process never gets the CPU
- D) A process uses too much memory

<details>
<summary>Answer</summary>

**Answer:** B) A set of processes each wait for a resource held by another process in the set

C describes starvation.

</details>

### P2. Read the graph

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** resource-allocation graph

In a resource-allocation graph, an edge from resource R2 to process P3 means:

- A) P3 is requesting R2
- B) P3 holds an instance of R2
- C) R2 is free
- D) P3 has released R2

<details>
<summary>Answer</summary>

**Answer:** B) P3 holds an instance of R2

</details>

### P3. Deadlock or not?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** RAG cycles, multiple instances

R1 has 2 instances, R2 has 1. P1 holds one R1 and requests R2. P2 holds R2 and requests R1. P3 holds the other R1 and is running (requests nothing). Is the system deadlocked?

<details>
<summary>Answer</summary>

**No.** There is a cycle (P1 → R2 → P2 → R1 → P1), but R1 has two instances. When P3 finishes and releases its R1, P2 gets it, finishes, and releases R2 for P1. A cycle with multi-instance resources is not necessarily a deadlock.

</details>

### P4. Name the problem

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** deadlock, starvation, livelock

Classify each: (a) two robots in a corridor both step left, then both step right, forever; (b) a batch job waits three days because interactive jobs always have higher priority; (c) two transactions each hold one row lock and wait for the other's row.

<details>
<summary>Answer</summary>

(a) **Livelock** — both active, no progress. (b) **Starvation** — it could run, but is always passed over. (c) **Deadlock** — circular wait on locks.

</details>
