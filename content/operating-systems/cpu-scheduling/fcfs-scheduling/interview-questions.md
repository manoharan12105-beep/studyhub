# FCFS Scheduling — Interview Questions

## Beginner

### Q1. What is FCFS scheduling?

**Style:** Direct

<details>
<summary>Answer</summary>

First Come, First Served: the process that arrives first in the ready queue gets the CPU first and runs until its burst completes (or it blocks). It is non-preemptive and implemented with a FIFO queue.

</details>

### Q2. What are the advantages and disadvantages of FCFS?

**Style:** Direct

<details>
<summary>Answer</summary>

**Advantages:** simple to understand and implement, minimal scheduling overhead, no starvation — every process eventually runs.
**Disadvantages:** high average waiting time when long jobs come first (convoy effect), poor response time for interactive processes, and no way to favour short or important jobs.

</details>

### Q3. What is the convoy effect?

**Style:** Direct

<details>
<summary>Answer</summary>

Short processes wait behind one long CPU-bound process that holds the CPU, like cars behind a slow truck. With bursts 20, 2, 2 arriving together, FCFS order gives waiting times 0, 20, 22 (average 14); running the short ones first gives 0, 2, 4 (average 2). It also leaves I/O devices idle while I/O-bound processes wait behind the CPU-bound one.

</details>

## Intermediate

### Q4. Calculate average waiting and turnaround time under FCFS: P1 (AT 0, BT 4), P2 (AT 1, BT 3), P3 (AT 2, BT 1), P4 (AT 3, BT 2).

**Style:** Calculation

<details>
<summary>Answer</summary>

Gantt: P1 0–4, P2 4–7, P3 7–8, P4 8–10.
CT: 4, 7, 8, 10. TAT = CT − AT: 4, 6, 6, 7 → average **5.75**. WT = TAT − BT: 0, 3, 5, 5 → average **3.25**.

</details>

### Q5. Can FCFS cause starvation?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Every process eventually reaches the head of the FIFO queue, and processes ahead of it finish in finite time (assuming no infinite loop). It can cause very long waits — the convoy effect — but not indefinite postponement. (If a process loops forever, the ones behind it wait forever, but that is a non-terminating process, not starvation by the policy.)

</details>

### Q6. Why is FCFS unsuitable for time-sharing systems?

**Style:** Why

<details>
<summary>Answer</summary>

It is non-preemptive: once a long job starts, interactive processes wait until it finishes. Time-sharing needs every process to get the CPU at regular, short intervals to keep response time low, which requires preemption — Round Robin is essentially FCFS with a time slice.

</details>

## Advanced

### Q7. P1 (AT 0, BT 3), P2 (AT 5, BT 2), P3 (AT 6, BT 4). Draw the FCFS Gantt chart and give average waiting time.

**Style:** Calculation

<details>
<summary>Answer</summary>

Gantt: P1 0–3, **idle 3–5**, P2 5–7, P3 7–11. WT: P1 0, P2 0, P3 7 − 6 = 1. Average WT = 1 ÷ 3 ≈ **0.33**. The CPU is idle because P2 has not arrived when P1 finishes — a common place to make mistakes.

</details>
