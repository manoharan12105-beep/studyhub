# Scheduling Metrics and Comparison — Practice

### P1. Turnaround formula

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** turnaround time

A process arrives at time 3, first runs at time 5 and completes at time 12. Its burst time is 4. What is its turnaround time?

- A) 7
- B) 9
- C) 5
- D) 12

<details>
<summary>Answer</summary>

**Answer:** B) 9

TAT = CT − AT = 12 − 3 = 9. (WT = 9 − 4 = 5; RT = 5 − 3 = 2.)

</details>

### P2. No starvation

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** starvation

Which pair of algorithms can never starve a process?

- A) SJF and Priority
- B) FCFS and Round Robin
- C) SRTF and Round Robin
- D) Priority and FCFS

<details>
<summary>Answer</summary>

**Answer:** B) FCFS and Round Robin

</details>

### P3. Throughput and utilisation

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** throughput, CPU utilisation, idle time

FCFS: P1 (AT 0, BT 2), P2 (AT 3, BT 4), P3 (AT 3, BT 2). Find the CPU utilisation and throughput until all processes finish.

<details>
<summary>Answer</summary>

Gantt: P1 0–2, idle 2–3, P2 3–7, P3 7–9. Busy 8 of 9 units → utilisation ≈ **88.9 %**. Throughput = 3 ÷ 9 ≈ **0.33 processes per unit**.

</details>

### P4. Three algorithms, one input

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** FCFS, SJF, Round Robin

| Process | AT | BT |
|---------|----|----|
| P1 | 0 | 6 |
| P2 | 1 | 8 |
| P3 | 2 | 7 |
| P4 | 3 | 3 |

Compute the average waiting time under FCFS, SJF and Round Robin (q = 3).

<details>
<summary>Answer</summary>

**FCFS:** P1 0–6, P2 6–14, P3 14–21, P4 21–24. WT 0, 5, 12, 18 → **8.75**.
**SJF:** P1 0–6, then P4 (3), P3 (7), P2 (8): P4 6–9, P3 9–16, P2 16–24. WT 0, 15, 7, 3 → **6.25**.
**RR (q = 3):** P1 0–3, P2 3–6, P3 6–9, P4 9–12, P1 12–15, P2 15–18, P3 18–21, P2 21–23, P3 23–24. CT 15, 23, 24, 12 → WT 9, 14, 15, 6 → **11**.

</details>

### P5. Response time under RR

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** response time

For the RR schedule in P4, find each process's response time and the average. Compare with FCFS.

<details>
<summary>Answer</summary>

First runs: P1 0, P2 3, P3 6, P4 9 → RT 0, 2, 4, 6 → average **3**. FCFS RT = WT: 0, 5, 12, 18 → average **8.75**. RR responds much sooner but finishes later on average.

</details>

### P6. Spot the error

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** sanity checks

A student's answer for a process says AT = 2, BT = 5, CT = 6, WT = 1. What is wrong?

<details>
<summary>Answer</summary>

TAT = 6 − 2 = 4, which is less than the burst of 5 — impossible, because a process cannot finish faster than its CPU burst. WT = 4 − 5 = −1 confirms the error. The completion time must be at least AT + BT = 7.

</details>

### P7. Pick the scheduler

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** algorithm choice

A shared university server runs students' editors (short bursts, waiting on keystrokes) and overnight simulation jobs (hours of CPU). Pure RR with q = 100 ms makes editors laggy at peak times. Suggest a scheduler and explain how it treats each kind of process.

<details>
<summary>Answer</summary>

A **multilevel feedback queue**. Editors use only tiny parts of their quantum before blocking for input, so they stay in the top queue (high priority, short quantum) and are dispatched almost immediately after each keystroke. Simulations use their full quanta, so they are demoted to low-priority queues with long quanta — fewer switches, good throughput — and aging promotes them if they wait too long, preventing starvation.

</details>
