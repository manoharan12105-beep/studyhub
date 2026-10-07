# FCFS Scheduling — Practice

### P1. FCFS property

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** FCFS

FCFS scheduling is:

- A) Preemptive and may starve long jobs
- B) Non-preemptive and starvation-free
- C) Preemptive with a time quantum
- D) Non-preemptive and always optimal for waiting time

<details>
<summary>Answer</summary>

**Answer:** B) Non-preemptive and starvation-free

</details>

### P2. All arrive at zero

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** waiting time

P1 (BT 6), P2 (BT 3), P3 (BT 2) all arrive at time 0 in that order. Find each waiting time and the average under FCFS.

<details>
<summary>Answer</summary>

Gantt: P1 0–6, P2 6–9, P3 9–11. WT: 0, 6, 9. Average = 15 ÷ 3 = **5**.

</details>

### P3. Better order

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** convoy effect

Same processes as P2, but they arrive in the order P3, P2, P1 (all at time 0). What is the average waiting time now?

<details>
<summary>Answer</summary>

Gantt: P3 0–2, P2 2–5, P1 5–11. WT: 0, 2, 5. Average = 7 ÷ 3 ≈ **2.33**. Shortest first is much better — this is the idea behind SJF.

</details>

### P4. With arrival times

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** Gantt chart, TAT, WT

| Process | AT | BT |
|---------|----|----|
| P1 | 0 | 5 |
| P2 | 2 | 3 |
| P3 | 4 | 1 |
| P4 | 6 | 2 |

Draw the FCFS Gantt chart and compute average TAT and average WT.

<details>
<summary>Answer</summary>

Gantt: P1 0–5, P2 5–8, P3 8–9, P4 9–11.
CT: 5, 8, 9, 11. TAT: 5, 6, 5, 5 → average 21 ÷ 4 = **5.25**. WT: 0, 3, 4, 3 → average 10 ÷ 4 = **2.5**.

</details>

### P5. Idle CPU

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** idle time, CPU utilisation

P1 (AT 0, BT 2), P2 (AT 4, BT 3), P3 (AT 5, BT 1). Find the completion times and the CPU utilisation from time 0 until the last process finishes.

<details>
<summary>Answer</summary>

Gantt: P1 0–2, idle 2–4, P2 4–7, P3 7–8. CT: 2, 7, 8. Busy time = 2 + 3 + 1 = 6 out of 8 → utilisation = **75 %**.

</details>
