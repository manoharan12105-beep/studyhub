# Round Robin Scheduling — Interview Questions

## Beginner

### Q1. What is Round Robin scheduling?

**Style:** Direct

<details>
<summary>Answer</summary>

A preemptive algorithm in which each ready process gets the CPU for at most one time quantum, in circular FIFO order. If a process does not finish within its quantum, a timer interrupt preempts it and it moves to the back of the ready queue. It is designed for time-sharing systems.

</details>

### Q2. What are the advantages and disadvantages of Round Robin?

**Style:** Direct

<details>
<summary>Answer</summary>

**Advantages:** fair sharing, no starvation, bounded waiting for the next turn, good response time for interactive users.
**Disadvantages:** performance depends heavily on the quantum; frequent context switches add overhead; average turnaround and waiting time are usually higher than SJF; it treats all processes the same (no priorities).

</details>

### Q3. What happens if the time quantum is very large? Very small?

**Style:** What happens if

<details>
<summary>Answer</summary>

**Very large** (larger than every burst): each process finishes in its first turn, so RR becomes FCFS, with the convoy effect and poor response time. **Very small:** response time is excellent, but the CPU spends a large fraction of its time on context switches, and throughput drops. A good quantum is large compared with the switch time and covers most CPU bursts.

</details>

## Intermediate

### Q4. P1 (BT 6), P2 (BT 3), P3 (BT 1) all arrive at time 0. Using RR with q = 2, give the Gantt chart and average waiting time.

**Style:** Calculation

<details>
<summary>Answer</summary>

Gantt: P1 0–2, P2 2–4, P3 4–5, P1 5–7, P2 7–8, P1 8–10.
CT: P1 10, P2 8, P3 5. WT = CT − BT (all arrive at 0): P1 4, P2 5, P3 4 → average 13 ÷ 3 ≈ **4.33**.

</details>

### Q5. Same processes with q = 4. Does average waiting time improve?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Gantt: P1 0–4, P2 4–7, P3 7–8, P1 8–10. WT: P1 4, P2 4, P3 7 → average 15 ÷ 3 = **5** — worse than with q = 2 (4.33), because the 1-unit job P3 now waits behind two longer turns. Changing the quantum changes waiting time in either direction; it is not monotonic.

</details>

### Q6. With n ready processes and quantum q, what is the longest a process waits for its next turn?

**Style:** Calculation

<details>
<summary>Answer</summary>

(n − 1) × q, because each of the other n − 1 processes can use at most one full quantum before the process's turn comes again. Including a context-switch cost s per switch: (n − 1) × (q + s). Example: 5 processes, q = 20 ms → at most 80 ms.

</details>

### Q7. In RR, a process arrives at exactly the moment another's quantum expires. Which goes first in the queue?

**Style:** Trap

<details>
<summary>Answer</summary>

It is a convention, so state it. The common convention (and the one used in StudyHub) is that the newly arrived process is added to the queue **first**, then the preempted process goes behind it. Applying the opposite convention changes the Gantt chart, so always mention which you use.

</details>

## Advanced

### Q8. Why is RR's average turnaround time often worse than SJF's even though its response time is better?

**Style:** Why

<details>
<summary>Answer</summary>

RR interleaves all processes, so long and short jobs progress together and short jobs finish later than they would if run first, while long jobs are delayed by everyone's turns. SJF lets short jobs finish immediately, minimising the average. RR optimises for the first response, not for completion.

</details>

### Q9. How do real OSes improve on plain Round Robin?

**Style:** Follow-up

<details>
<summary>Answer</summary>

They combine time slicing with priorities and feedback: a **multilevel feedback queue** gives interactive (I/O-bound) processes higher priority and shorter quanta and moves CPU-bound processes to lower-priority queues with longer quanta, with aging to prevent starvation. Linux's scheduler (CFS, and EEVDF from kernel 6.6) instead gives each task a fair share of CPU time weighted by its nice value, rather than fixed equal quanta.

</details>
