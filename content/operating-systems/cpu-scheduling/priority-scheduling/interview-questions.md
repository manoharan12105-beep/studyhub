# Priority Scheduling — Interview Questions

## Beginner

### Q1. What is priority scheduling?

**Style:** Direct

<details>
<summary>Answer</summary>

A scheduling algorithm in which each process has a priority and the CPU is given to the ready process with the highest priority. It can be non-preemptive (a higher-priority arrival waits for the current burst to end) or preemptive (a higher-priority arrival takes the CPU at once). Ties are usually broken by arrival order.

</details>

### Q2. What is starvation in priority scheduling, and how is it prevented?

**Style:** Direct

<details>
<summary>Answer</summary>

Starvation (indefinite blocking) happens when a low-priority process never gets the CPU because higher-priority processes keep arriving. It is prevented by **aging**: gradually raising the priority of processes that have waited a long time, so every process eventually becomes the highest priority and runs.

</details>

### Q3. What is the difference between internal and external priorities?

**Style:** Comparison

<details>
<summary>Answer</summary>

Internal priorities are computed by the OS from measurable properties of the process — memory requirements, number of open files, ratio of I/O to CPU time, time limits. External priorities are set from outside the scheduler — by the user or administrator (`nice`), by importance or payment, or by the process class (real-time vs normal).

</details>

## Intermediate

### Q4. Explain priority inversion with an example.

**Style:** Scenario

<details>
<summary>Answer</summary>

Three processes: High (H), Medium (M), Low (L). L holds a lock. H becomes ready and needs the same lock, so it blocks waiting for L. Now M (which needs no lock) becomes ready and, having higher priority than L, preempts L. L cannot release the lock while M runs, so H — the most important process — is effectively waiting for M. The priority order has been inverted.

</details>

### Q5. How is priority inversion solved?

**Style:** How

<details>
<summary>Answer</summary>

With **priority inheritance**: while a low-priority process holds a lock that a higher-priority process is waiting for, it temporarily inherits that higher priority, so medium-priority processes cannot preempt it. When it releases the lock, its priority returns to normal and the high-priority process proceeds. An alternative is the **priority ceiling protocol**, where a lock raises its holder to a predefined ceiling priority. Mars Pathfinder's 1997 resets were fixed by enabling priority inheritance on a mutex.

</details>

### Q6. P1 (AT 0, BT 6, priority 3), P2 (AT 2, BT 2, priority 1), P3 (AT 3, BT 3, priority 2). Lower number = higher priority. Compare average waiting time under non-preemptive and preemptive priority.

**Style:** Calculation

<details>
<summary>Answer</summary>

**Non-preemptive:** P1 0–6, P2 6–8, P3 8–11. WT: 0, 4, 5 → average **3**.
**Preemptive:** P1 0–2; P2 arrives with priority 1 → preempts, runs 2–4; P3 (2) beats P1 (3) → 4–7; P1 7–11. WT: P1 11 − 6 = 5, P2 0, P3 1 → average **2**.

</details>

### Q7. Why can SJF be described as a priority scheduling algorithm?

**Style:** Why

<details>
<summary>Answer</summary>

Because it is priority scheduling where the priority is the (predicted) next CPU burst: the shorter the burst, the higher the priority. Similarly, FCFS is priority scheduling with priority = arrival time. This also explains why SJF shares priority scheduling's starvation problem.

</details>

## Advanced

### Q8. Starvation vs deadlock — what is the difference?

**Style:** Trap

<details>
<summary>Answer</summary>

In **starvation**, a process is ready and could run, but the scheduling policy keeps choosing others; it may run eventually if conditions change (or with aging). In **deadlock**, a set of processes each wait for a resource held by another in the set, so none can ever proceed regardless of scheduling. Starvation is a fairness problem; deadlock is a circular-wait problem.

</details>

### Q9. With aging, a process's priority number drops by 1 every 4 seconds of waiting. A process enters at priority 20; the highest priority is 0. What is the longest it can wait before it has the highest possible priority?

**Style:** Calculation

<details>
<summary>Answer</summary>

It needs 20 steps of 4 seconds: 20 × 4 = **80 seconds**. After that its priority is 0, so it is chosen ahead of any newly arriving process (ties broken by arrival order, and it has waited longest).

</details>
