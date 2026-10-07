# FCFS Scheduling

**Module:** CPU Scheduling · **Interview priority:** Core

## Concept

**First Come, First Served (FCFS)** runs processes in the **order they arrive** in the ready queue. The process at the head of the queue gets the CPU and keeps it until it finishes its burst (or blocks). It is **non-preemptive** and implemented with a simple FIFO queue.

## Why It Matters

FCFS is the baseline every other algorithm is compared against, and the easiest way to learn Gantt charts and the formulas for completion, turnaround and waiting time. Its big weakness — the **convoy effect** — explains why SJF and Round Robin exist.

## How It Works

### Rules

1. Sort processes by arrival time (ties: the order they are listed).
2. Give the CPU to the first one; it runs its whole burst.
3. When it finishes, give the CPU to the next one that has arrived. If none has arrived yet, the CPU is **idle** until the next arrival.

### Formulas (used in every scheduling problem)

```text
Completion time (CT)  = time the process finishes
Turnaround time (TAT) = CT − Arrival time (AT)
Waiting time (WT)     = TAT − Burst time (BT)
Response time (RT)    = First start time − AT      (FCFS: RT = WT)
Averages              = sum ÷ number of processes
```

### The convoy effect

When a long CPU-bound process is at the head of the queue, every short process behind it waits for the whole long burst — like cars stuck behind a slow truck. Example, all arriving at time 0:

| Order | Waiting times | Average WT |
|-------|---------------|------------|
| P1 (20), P2 (2), P3 (2) | 0, 20, 22 | 42 ÷ 3 = **14** |
| P2 (2), P3 (2), P1 (20) | 0, 2, 4 | 6 ÷ 3 = **2** |

Same work, same CPU — the average waiting time changes sevenfold just by order. FCFS ignores burst lengths, so it can easily pick the bad order.

## Example

| Process | AT | BT |
|---------|----|----|
| P1 | 0 | 4 |
| P2 | 1 | 3 |
| P3 | 2 | 1 |
| P4 | 3 | 2 |

**Gantt chart:**

```text
| P1        | P2      | P3 | P4    |
0           4         7    8      10
```

| Process | AT | BT | CT | TAT = CT − AT | WT = TAT − BT |
|---------|----|----|----|---------------|---------------|
| P1 | 0 | 4 | 4 | 4 | 0 |
| P2 | 1 | 3 | 7 | 6 | 3 |
| P3 | 2 | 1 | 8 | 6 | 5 |
| P4 | 3 | 2 | 10 | 7 | 5 |

Average TAT = (4 + 6 + 6 + 7) ÷ 4 = **5.75**. Average WT = (0 + 3 + 5 + 5) ÷ 4 = **3.25**.

P3 needs only 1 unit but waits 5 — a small convoy effect.

### FCFS in Java

```java
public class FcfsScheduling {

    record Proc(String id, int arrival, int burst) {}

    public static void main(String[] args) {
        Proc[] procs = {                       // sorted by arrival time
            new Proc("P1", 0, 4), new Proc("P2", 1, 3),
            new Proc("P3", 2, 1), new Proc("P4", 3, 2),
        };

        int time = 0;
        int totalTat = 0;
        int totalWt = 0;
        StringBuilder gantt = new StringBuilder("Gantt:");
        System.out.println("ID  AT  BT  CT  TAT  WT");
        for (Proc p : procs) {
            if (time < p.arrival()) {          // nobody ready: the CPU idles
                gantt.append(" idle[").append(time).append('-').append(p.arrival()).append(']');
                time = p.arrival();
            }
            int start = time;
            time += p.burst();                 // non-preemptive: runs to completion
            int tat = time - p.arrival();
            int wt = tat - p.burst();
            totalTat += tat;
            totalWt += wt;
            gantt.append(' ').append(p.id()).append('[').append(start).append('-').append(time).append(']');
            System.out.printf("%-3s %2d  %2d  %2d  %3d  %2d%n", p.id(), p.arrival(), p.burst(), time, tat, wt);
        }
        System.out.println(gantt);
        System.out.printf("Average TAT = %.2f, average WT = %.2f%n",
                (double) totalTat / procs.length, (double) totalWt / procs.length);
    }
}
```

**Output:**

```text
ID  AT  BT  CT  TAT  WT
P1   0   4   4    4   0
P2   1   3   7    6   3
P3   2   1   8    6   5
P4   3   2  10    7   5
Gantt: P1[0-4] P2[4-7] P3[7-8] P4[8-10]
Average TAT = 5.75, average WT = 3.25
```

## Important Points

- FCFS = FIFO queue, non-preemptive, no starvation (everyone eventually reaches the head).
- Simple and fair in the order-of-arrival sense; very little scheduling overhead.
- **Convoy effect:** short jobs stuck behind a long one → high average waiting time.
- Poor for interactive systems: a long job delays everyone's response.
- In FCFS (and any non-preemptive algorithm), response time = waiting time.

## Common Confusion

> [!WARNING]
> **Forgetting idle time.** If the next process arrives after the CPU becomes free, the CPU is idle until it arrives — its start time is its arrival time, not the previous completion time. Example: P1 (AT 0, BT 3) and P2 (AT 5, BT 2): P2 runs 5–7, not 3–5.

- **TAT is not "CT".** Subtract arrival time. They are equal only when the process arrives at 0.
- **FCFS has no starvation**, but it can still give terrible waiting times.

## Interview Perspective

- *"Explain FCFS and its disadvantages."* — non-preemptive FIFO; convoy effect; bad response time.
- *"What is the convoy effect?"* — give the 20/2/2 example.
- Expect a table of AT and BT and a request for the Gantt chart, average TAT and average WT.
- Follow-up: *"Which algorithm fixes the convoy effect?"* — SJF for average waiting time, Round Robin for response time. All five algorithms on one input: [Scheduling Metrics and Comparison](../scheduling-metrics-and-comparison/content.md).

## Quick Revision

- Run in arrival order; non-preemptive; FIFO queue.
- TAT = CT − AT; WT = TAT − BT; RT = WT.
- Convoy effect: long job first → everyone waits.
- No starvation; poor response for interactive work. Watch for idle gaps.
