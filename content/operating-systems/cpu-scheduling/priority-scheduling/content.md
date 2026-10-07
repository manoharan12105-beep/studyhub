# Priority Scheduling

**Module:** CPU Scheduling · **Interview priority:** Core

## Concept

In **priority scheduling**, every process has a **priority number** and the CPU goes to the ready process with the **highest priority**. It comes in two forms:

- **Non-preemptive:** a higher-priority arrival waits until the running process finishes its burst.
- **Preemptive:** a higher-priority arrival immediately takes the CPU from the running process.

> [!IMPORTANT]
> **Convention:** whether a small number means high or low priority varies between systems (Linux nice values: lower = higher priority; some textbooks use the opposite). StudyHub problems use **lower number = higher priority**. Always state the convention in an answer.

SJF is a special case of priority scheduling where the priority is the (predicted) burst length.

## Why It Matters

Not all work is equally urgent: an interrupt handler, an audio thread or a payment request matters more than a background backup. Priority scheduling expresses that — and introduces the two classic problems interviewers love: **starvation** (solved by **aging**) and **priority inversion**.

## How It Works

### Where priorities come from

- **Internal:** computed by the OS from measurable properties — memory needs, ratio of I/O to CPU bursts, time limits.
- **External:** set from outside — user importance, payment, `nice` values, real-time class.
- **Static** priorities never change; **dynamic** priorities are adjusted while the process runs or waits (aging is a dynamic adjustment).

### Rules (lower number = higher priority)

1. When the CPU is free, pick the ready process with the smallest priority number. Ties: earlier arrival, then listed order (some textbooks use FCFS for ties — the same thing).
2. Preemptive version: at every arrival, if the newcomer's priority is **strictly higher** than the running process's, preempt.

### Starvation and aging

A steady stream of high-priority processes can keep a low-priority process waiting **forever** — **starvation** (indefinite blocking). **Aging** fixes it by improving a process's priority the longer it waits.

Example: priorities range from 0 (highest) to 10 (lowest), and a waiting process's priority number decreases by 1 every 5 minutes. A process that starts at 10 reaches 0 after at most 10 × 5 = **50 minutes** of waiting, so it must eventually run.

### Priority inversion (link to synchronisation)

A **high**-priority process waits for a lock held by a **low**-priority process, while a **medium**-priority process (which needs no lock) preempts the low one. The high-priority process is effectively blocked by the medium one. The fix is **priority inheritance**: while the low-priority process holds a lock that a high-priority process wants, it temporarily runs at the high priority. This bug famously reset NASA's Mars Pathfinder rover in 1997 until priority inheritance was enabled.

## Example

| Process | AT | BT | Priority |
|---------|----|----|----------|
| P1 | 0 | 4 | 3 |
| P2 | 1 | 3 | 1 |
| P3 | 2 | 2 | 4 |
| P4 | 3 | 1 | 2 |
| P5 | 4 | 2 | 2 |

### Non-preemptive

P1 runs 0–4 (only it has arrived at 0). At 4: P2 (1) is best, then P4 and P5 tie at 2 → P4 arrived first, then P5, then P3 (4).

```text
| P1          | P2       | P4 | P5    | P3    |
0             4          7    8      10      12
```

| Process | CT | TAT | WT |
|---------|----|-----|----|
| P1 | 4 | 4 | 0 |
| P2 | 7 | 6 | 3 |
| P3 | 12 | 10 | 8 |
| P4 | 8 | 5 | 4 |
| P5 | 10 | 6 | 4 |

Average TAT = 31 ÷ 5 = **6.2**; average WT = 19 ÷ 5 = **3.8**.

### Preemptive

- t = 1: P2 (1) beats P1 (3) → P1 preempted; P2 runs 1–4 (P3, P4, P5 arrive but none beats priority 1).
- t = 4: ready P1 (3), P3 (4), P4 (2), P5 (2) → P4 runs 4–5, then P5 5–7, then P1 7–10, then P3 10–12.

```text
| P1 | P2       | P4 | P5    | P1       | P3    |
0    1          4    5       7         10      12
```

| Process | CT | TAT | WT | RT |
|---------|----|-----|----|----|
| P1 | 10 | 10 | 6 | 0 |
| P2 | 4 | 3 | 0 | 0 |
| P3 | 12 | 10 | 8 | 8 |
| P4 | 5 | 2 | 1 | 1 |
| P5 | 7 | 3 | 1 | 1 |

Average TAT = 28 ÷ 5 = **5.6**; average WT = 16 ÷ 5 = **3.2**; average RT = 10 ÷ 5 = **2**. High-priority P2 now waits 0 instead of 3; low-priority P3 waits 8 either way.

## Comparison

| Aspect | Non-preemptive priority | Preemptive priority |
|--------|-------------------------|---------------------|
| Urgent arrival | Waits for the current burst | Runs at once |
| Response for high priority | Can be poor | Best |
| Context switches | Fewer | More |
| Starvation of low priority | Possible | Possible (more likely) |
| Fix | Aging | Aging |

## Important Points

- CPU goes to the highest-priority ready process; state whether low numbers mean high priority.
- Preemptive version switches on a strictly higher-priority arrival.
- Starvation of low-priority processes → **aging**.
- Priority inversion: high waits for low's lock while medium runs → **priority inheritance**.
- SJF = priority by burst length; FCFS = priority by arrival time.

## Common Confusion

> [!WARNING]
> **Assuming a bigger number is a higher priority.** Read the question. In StudyHub (and Linux nice values) a smaller number wins. Mixing conventions silently gives a completely different Gantt chart.

- **Starvation vs deadlock:** a starved process *could* run but is always passed over; deadlocked processes can never proceed because they wait for each other.
- **Aging changes priorities, not burst times.**

## Interview Perspective

- *"Explain priority scheduling. What is its main problem?"* — starvation; aging.
- *"What is priority inversion and how is it solved?"* — three processes, a lock, priority inheritance; Mars Pathfinder.
- *"Preemptive vs non-preemptive priority — calculate both."* — watch the arrival times.
- *"How is SJF a kind of priority scheduling?"* — priority = predicted burst length.

## Quick Revision

- Highest priority first (StudyHub: lower number = higher priority).
- NP waits for the burst; P preempts on strictly higher priority.
- Starvation → aging. Priority inversion → priority inheritance.
- SJF and FCFS are special cases of priority scheduling.
