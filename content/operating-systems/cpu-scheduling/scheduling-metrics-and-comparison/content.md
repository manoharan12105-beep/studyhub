# Scheduling Metrics and Comparison

**Module:** CPU Scheduling · **Interview priority:** Core

## Concept

Scheduling algorithms are compared with a small set of **metrics** computed from each process's arrival time (AT), burst time (BT), first start time and completion time (CT). This topic collects the formulas, runs all five algorithms on the **same input**, and summarises when each one fits.

## Why It Matters

Interview calculation questions are always about these numbers, and design questions ("which scheduler for a desktop / a batch server / a real-time system?") are answered by knowing which metric each algorithm optimises.

## How It Works

### The formulas

```text
Completion time      CT  = time the process finishes
Turnaround time      TAT = CT − AT
Waiting time         WT  = TAT − BT              (time in the ready queue)
Response time        RT  = first start − AT
Average X            = (sum of X over all processes) ÷ n
Throughput           = processes completed ÷ total time
CPU utilisation      = busy time ÷ total time × 100 %
```

For a process that also does I/O, waiting time counts only ready-queue time: WT = TAT − (CPU time + I/O time).

### Method for any Gantt-chart question

1. Write the processes sorted by arrival time.
2. At time 0 (or the first arrival), list who is ready and apply the algorithm's rule.
3. Re-decide at every event: **arrival** (preemptive algorithms), **completion**, **quantum expiry** (RR).
4. If nothing is ready, mark the CPU **idle** until the next arrival.
5. Read CT from the chart, then TAT = CT − AT, WT = TAT − BT, RT = first start − AT.
6. Check: sum of all BT + idle time = the last CT (the chart has no gaps or overlaps).

## Example

One input, all five algorithms. Lower priority number = higher priority; RR quantum = 2.

| Process | AT | BT | Priority |
|---------|----|----|----------|
| P1 | 0 | 5 | 3 |
| P2 | 1 | 3 | 1 |
| P3 | 2 | 8 | 4 |
| P4 | 3 | 6 | 2 |

**Gantt charts**

```text
FCFS          P1[0-5]  P2[5-8]  P3[8-16]  P4[16-22]
SJF           P1[0-5]  P2[5-8]  P4[8-14]  P3[14-22]
SRTF          P1[0-1]  P2[1-4]  P1[4-8]   P4[8-14]  P3[14-22]
RR (q = 2)    P1[0-2]  P2[2-4]  P3[4-6]   P1[6-8]   P4[8-10]  P2[10-11]
              P3[11-13] P1[13-14] P4[14-16] P3[16-18] P4[18-20] P3[20-22]
Priority (NP) P1[0-5]  P2[5-8]  P4[8-14]  P3[14-22]
Priority (P)  P1[0-1]  P2[1-4]  P4[4-10]  P1[10-14] P3[14-22]
```

**Averages**

| Algorithm | Avg TAT | Avg WT | Avg RT | Context switches |
|-----------|---------|--------|--------|------------------|
| FCFS | 11.25 | 5.75 | 5.75 | 3 |
| SJF | 10.75 | 5.25 | 5.25 | 3 |
| SRTF | **10.5** | **5** | 4.25 | 4 |
| Round Robin (q = 2) | 15.25 | 9.75 | **2** | 11 |
| Priority (non-preemptive) | 10.75 | 5.25 | 5.25 | 3 |
| Priority (preemptive) | 11 | 5.5 | 3.25 | 4 |

All six finish at time 22 with no idle time, so throughput is the same: 4 ÷ 22 ≈ 0.18 processes per unit. The table shows the classic trade-off:

- **SRTF** has the best average turnaround and waiting time.
- **Round Robin** has by far the best average response time — and the worst waiting time and most switches.
- **FCFS** is simple but suffers from P3's long burst ahead of P4.

(Non-preemptive priority and SJF happen to give the same schedule here only because P4's priority and burst order agree.)

## Comparison

| Algorithm | Preemptive | Optimises | Starvation | Overhead | Best for |
|-----------|------------|-----------|------------|----------|----------|
| FCFS | No | Simplicity | No | Lowest | Batch jobs of similar length |
| SJF | No | Avg WT (all arrive together) | Yes | Low | Batch jobs with known run times |
| SRTF | Yes | Avg WT and TAT | Yes | Medium | Theory baseline; short-job-heavy workloads |
| Round Robin | Yes | Response time, fairness | No | Higher (many switches) | Time-sharing, interactive systems |
| Priority | Either | Importance | Yes (fix: aging) | Low–medium | Real-time and mixed-importance systems |

### Multilevel queues (awareness)

Real systems combine algorithms:

- **Multilevel queue:** separate ready queues by type — for example system, interactive (RR) and batch (FCFS) — each with its own algorithm and a fixed priority between queues.
- **Multilevel feedback queue (MLFQ):** processes **move** between queues. A process that uses its whole quantum drops to a lower-priority queue with a longer quantum; one that waits too long moves up (aging). I/O-bound, interactive processes stay at the top; CPU-bound ones sink. This approximates SJF without knowing burst lengths.

## Important Points

- TAT = CT − AT; WT = TAT − BT; RT = first start − AT.
- SRTF minimises average waiting time; RR minimises response time; FCFS is simplest.
- SJF, SRTF and Priority can starve processes; FCFS and RR cannot.
- More preemption → better response, more context switches.
- Real OSes use multilevel feedback queues or fair-share schedulers rather than one textbook algorithm.

## Common Confusion

> [!WARNING]
> **Mixing up TAT and WT.** Turnaround is the whole stay (waiting + running); waiting is only the ready-queue part. If a process's WT is larger than its TAT, something is wrong.

- **Response time equals waiting time only in non-preemptive algorithms.** In RR or SRTF, a process may start early (small RT) and still wait a lot in total.
- **Throughput depends on total time,** not on the order — unless the order creates idle time.

## Interview Perspective

- *"Define turnaround, waiting and response time."* — and give the formulas.
- *"Which algorithm gives minimum average waiting time? Minimum response time?"* — SRTF/SJF; Round Robin.
- *"Which algorithms can cause starvation?"* — SJF, SRTF, Priority; fix with aging.
- *"What is a multilevel feedback queue?"* — moving between queues by behaviour.

## Quick Revision

- TAT = CT − AT · WT = TAT − BT · RT = start − AT.
- Best WT/TAT: SRTF (SJF if non-preemptive). Best RT: RR. Simplest: FCFS.
- Starvation: SJF, SRTF, Priority → aging. None: FCFS, RR.
- MLFQ: demote CPU hogs, promote waiters.
