# Scheduling Metrics and Comparison — Interview Questions

## Beginner

### Q1. Define turnaround time, waiting time and response time.

**Style:** Direct

<details>
<summary>Answer</summary>

- **Turnaround time** = completion time − arrival time: the total time from submission to completion.
- **Waiting time** = turnaround time − burst time: the total time spent ready but not running.
- **Response time** = time of first execution − arrival time: how long until the process first gets the CPU.

</details>

### Q2. What are throughput and CPU utilisation?

**Style:** Direct

<details>
<summary>Answer</summary>

Throughput is the number of processes completed per unit of time (for example 4 processes in 22 ms ≈ 0.18 per ms). CPU utilisation is the percentage of time the CPU is busy doing useful work rather than idle. Both should be maximised.

</details>

### Q3. Which algorithm gives the minimum average waiting time, and which gives the best response time?

**Style:** Comparison

<details>
<summary>Answer</summary>

SRTF gives the minimum average waiting time (SJF when only non-preemptive algorithms are allowed and all processes arrive together). Round Robin with a small quantum gives the best response time because every process gets the CPU within (n − 1) × q.

</details>

## Intermediate

### Q4. Which scheduling algorithms can cause starvation, and which cannot?

**Style:** Direct

<details>
<summary>Answer</summary>

Can starve: SJF, SRTF (long jobs) and Priority (low-priority jobs), including multilevel queues with fixed priorities between queues. Cannot starve: FCFS and Round Robin — every process eventually reaches the head of the queue. Starvation is prevented with aging.

</details>

### Q5. When is response time equal to waiting time?

**Style:** Trap

<details>
<summary>Answer</summary>

In non-preemptive scheduling (FCFS, SJF, non-preemptive Priority) for processes with a single CPU burst: once a process starts, it runs to completion, so all of its waiting happens before its first run. In preemptive algorithms (RR, SRTF), a process can start early and wait again later, so RT ≤ WT.

</details>

### Q6. What is a multilevel feedback queue?

**Style:** Direct

<details>
<summary>Answer</summary>

A scheduler with several ready queues of different priorities and quanta, where processes move between queues based on behaviour. New processes start at the top (high priority, short quantum). A process that uses its full quantum is demoted to a lower queue with a longer quantum; one that waits too long is promoted (aging). Interactive, I/O-bound processes stay at high priority; CPU-bound ones sink. It approximates SJF without knowing burst lengths.

</details>

### Q7. Which scheduler would you pick for a desktop OS, a batch payroll system and a hard real-time controller?

**Style:** Scenario

<details>
<summary>Answer</summary>

**Desktop:** preemptive, time-sliced scheduling with dynamic priorities (Round Robin within an MLFQ or a fair-share scheduler) for good response time. **Batch payroll:** FCFS or SJF — no interaction, so minimise overhead and turnaround. **Hard real-time:** preemptive priority scheduling (often with fixed priorities by deadline or rate) with priority inheritance, so the most urgent task always runs within a guaranteed time.

</details>

## Advanced

### Q8. How can you check a Gantt chart for mistakes quickly?

**Style:** How

<details>
<summary>Answer</summary>

Total length check: sum of all burst times plus idle time must equal the last completion time, and every process's slices must add up to its burst. No process may run before its arrival. Then each WT must be ≥ 0 and ≤ TAT, and the sum of WT equals the sum of TAT minus the sum of BT. For preemptive algorithms, re-check the decision at every arrival.

</details>

### Q9. Why do real systems rarely use pure SJF or pure Round Robin?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Pure SJF needs burst lengths that are unknown and starves long jobs. Pure Round Robin treats a video call and a background compression job identically and switches too often for CPU-bound work. Real schedulers mix ideas: feedback queues or virtual-runtime fairness (Linux CFS/EEVDF), dynamic priorities that favour I/O-bound tasks, separate real-time classes, and per-core run queues for multiprocessors.

</details>
