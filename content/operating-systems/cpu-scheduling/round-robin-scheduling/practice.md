# Round Robin Scheduling — Practice

### P1. Large quantum

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** quantum size

If the time quantum is larger than every CPU burst, Round Robin behaves like:

- A) SJF
- B) FCFS
- C) Priority scheduling
- D) SRTF

<details>
<summary>Answer</summary>

**Answer:** B) FCFS

Every process finishes in its first turn, in arrival order.

</details>

### P2. Maximum wait

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** bounded waiting

Six processes share the CPU under RR with q = 10 ms. Ignoring switch time, what is the longest a process waits between two of its turns?

<details>
<summary>Answer</summary>

(n − 1) × q = 5 × 10 = **50 ms**.

</details>

### P3. All at time 0

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** RR Gantt chart

P1 (BT 4), P2 (BT 3), P3 (BT 5), all arriving at time 0 in that order, q = 2. Find the Gantt chart, the completion times and the average waiting time.

<details>
<summary>Answer</summary>

Gantt: P1 0–2, P2 2–4, P3 4–6, P1 6–8, P2 8–9, P3 9–12.
CT: P1 8, P2 9, P3 12. WT = CT − BT: 4, 6, 7 → average 17 ÷ 3 ≈ **5.67**.

</details>

### P4. With arrivals

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** RR queue order

| Process | AT | BT |
|---------|----|----|
| P1 | 0 | 4 |
| P2 | 1 | 5 |
| P3 | 2 | 2 |
| P4 | 3 | 1 |

RR with q = 2 (arrivals join the queue before a preempted process). Find average TAT, WT and RT.

<details>
<summary>Answer</summary>

Queue trace: at 2, P3 arrives → [P2, P3], then P1 → [P2, P3, P1]. P2 runs 2–4; P4 arrived at 3 → [P3, P1, P4], then P2 → [P3, P1, P4, P2].
Gantt: P1 0–2, P2 2–4, P3 4–6, P1 6–8, P4 8–9, P2 9–12.
CT: 8, 12, 6, 9. TAT: 8, 11, 4, 6 → average 29 ÷ 4 = **7.25**. WT: 4, 6, 2, 5 → average 17 ÷ 4 = **4.25**. RT: 0, 1, 2, 5 → average 8 ÷ 4 = **2**.

</details>

### P5. Overhead

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** context-switch overhead

A context switch costs 1 ms. What fraction of CPU time is wasted on switching with q = 4 ms and with q = 49 ms, assuming every process uses its full quantum?

<details>
<summary>Answer</summary>

q = 4: 1 ÷ (4 + 1) = **20 %**. q = 49: 1 ÷ (49 + 1) = **2 %**.

</details>

### P6. Choose the quantum

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** quantum selection

Most interactive processes on a server have CPU bursts of 3–8 ms; a few batch jobs run for seconds. A context switch costs 0.05 ms. Would you choose q = 1 ms, 10 ms or 500 ms? Explain.

<details>
<summary>Answer</summary>

**10 ms.** It covers most interactive bursts, so they usually finish in one turn and respond quickly, and the switch overhead is only about 0.5 %. q = 1 ms preempts nearly every interactive burst several times (more switches, more overhead, slower completion). q = 500 ms lets a batch job hold the CPU for half a second, ruining response time — close to FCFS.

</details>
