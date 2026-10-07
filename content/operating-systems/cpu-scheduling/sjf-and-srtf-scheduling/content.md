# SJF and SRTF Scheduling

**Module:** CPU Scheduling · **Interview priority:** Core

## Concept

- **Shortest Job First (SJF)** gives the CPU to the ready process with the **smallest CPU burst**. It is **non-preemptive**: once chosen, a process runs its whole burst.
- **Shortest Remaining Time First (SRTF)** is the **preemptive** version: whenever a process arrives, the scheduler compares its burst with the **remaining** time of the running process and switches if the newcomer is shorter.

## Why It Matters

SJF gives the **minimum possible average waiting time** of all non-preemptive algorithms for a given set of processes that are all available, and SRTF does the same among preemptive ones. Running short jobs first removes FCFS's convoy effect. The catch — the OS cannot know burst lengths in advance, and long jobs can **starve** — is a favourite interview discussion.

## How It Works

### SJF rules

1. When the CPU becomes free, look at all processes that have **arrived** and are not finished.
2. Pick the one with the smallest burst time (ties: earlier arrival, then listed order).
3. Run it to completion. Repeat. If nothing has arrived, the CPU idles until the next arrival.

### SRTF rules

1. At every arrival (and every completion), compare remaining times of all ready processes **and** the running one.
2. Run the process with the smallest remaining time. If a newcomer's burst is **strictly smaller** than the running process's remaining time, preempt.
3. On a tie, the running process keeps the CPU (no pointless switch).

### Why shortest-first minimises average waiting time

Running a short job before a long one makes the short job wait less by the long job's length, but the long job waits more by only the short job's length. Swapping any long-before-short pair into short-before-long can only lower the total, so the sorted order is optimal.

### Predicting the next burst

Real systems do not know burst lengths. They **estimate** the next CPU burst with an **exponential average** of past bursts:

```text
τ(n+1) = α × t(n) + (1 − α) × τ(n)
   t(n)  = actual length of the last burst
   τ(n)  = previous prediction
   α     = weight, 0 ≤ α ≤ 1 (often 1/2)
```

Example with α = 0.5, previous prediction 10, last actual burst 6: τ = 0.5 × 6 + 0.5 × 10 = **8**.

## Example

| Process | AT | BT |
|---------|----|----|
| P1 | 0 | 8 |
| P2 | 1 | 4 |
| P3 | 2 | 2 |
| P4 | 3 | 5 |

### SJF (non-preemptive)

At time 0 only P1 has arrived, so it runs to completion (0–8) even though shorter jobs arrive meanwhile. At 8: P3 (2) < P2 (4) < P4 (5).

```text
| P1                      | P3    | P2          | P4             |
0                         8      10            14               19
```

| Process | CT | TAT | WT |
|---------|----|-----|----|
| P1 | 8 | 8 | 0 |
| P2 | 14 | 13 | 9 |
| P3 | 10 | 8 | 6 |
| P4 | 19 | 16 | 11 |

Average TAT = 45 ÷ 4 = **11.25**; average WT = 26 ÷ 4 = **6.5**.

### SRTF (preemptive)

- t = 0: P1 starts (remaining 8).
- t = 1: P2 arrives (4) < P1's remaining 7 → **preempt**, P2 runs.
- t = 2: P3 arrives (2) < P2's remaining 3 → **preempt**, P3 runs.
- t = 3: P4 arrives (5) > P3's remaining 1 → P3 continues and finishes at 4.
- t = 4: remaining P1 7, P2 3, P4 5 → P2 runs 4–7.
- t = 7: P4 (5) < P1 (7) → P4 runs 7–12; then P1 12–19.

```text
| P1 | P2 | P3    | P2       | P4             | P1                   |
0    1    2       4          7               12                     19
```

| Process | CT | TAT | WT | RT |
|---------|----|-----|----|----|
| P1 | 19 | 19 | 11 | 0 |
| P2 | 7 | 6 | 2 | 0 |
| P3 | 4 | 2 | 0 | 0 |
| P4 | 12 | 9 | 4 | 4 |

Average TAT = 36 ÷ 4 = **9**; average WT = 17 ÷ 4 = **4.25**; average RT = 4 ÷ 4 = **1**. Preemption cut the average waiting time from 6.5 to 4.25 — at the cost of 5 context switches instead of 3.

### SJF and SRTF in Java

```java
public class SjfSrtfScheduling {

    record Proc(String id, int arrival, int burst) {}

    static final Proc[] PROCS = {                       // listed in arrival order
        new Proc("P1", 0, 8), new Proc("P2", 1, 4), new Proc("P3", 2, 2), new Proc("P4", 3, 5),
    };

    public static void main(String[] args) {
        run("SJF ", false);
        run("SRTF", true);
    }

    /** Simulates one time unit at a time; preemptive = SRTF, otherwise SJF. */
    static void run(String name, boolean preemptive) {
        int n = PROCS.length;
        int[] remaining = new int[n];
        int[] completion = new int[n];
        for (int i = 0; i < n; i++) {
            remaining[i] = PROCS[i].burst();
        }
        StringBuilder gantt = new StringBuilder();
        int time = 0;
        int finished = 0;
        int current = -1;                                 // -1: CPU free
        int sliceStart = 0;
        while (finished < n) {
            int pick = current;
            if (current == -1 || preemptive) {
                int best = -1;                            // shortest remaining among arrived; ties: listed order
                for (int i = 0; i < n; i++) {
                    if (remaining[i] > 0 && PROCS[i].arrival() <= time
                            && (best == -1 || remaining[i] < remaining[best])) {
                        best = i;
                    }
                }
                if (current == -1 || remaining[best] < remaining[current]) {
                    pick = best;                          // switch only if strictly shorter
                }
            }
            if (pick != current) {                        // a new slice starts in the Gantt chart
                if (current != -1) {
                    gantt.append(PROCS[current].id()).append('[').append(sliceStart).append('-').append(time).append("] ");
                }
                current = pick;
                sliceStart = time;
            }
            if (current == -1) {                          // nothing has arrived yet
                time++;
                continue;
            }
            remaining[current]--;
            time++;
            if (remaining[current] == 0) {
                completion[current] = time;
                finished++;
                gantt.append(PROCS[current].id()).append('[').append(sliceStart).append('-').append(time).append("] ");
                current = -1;
            }
        }
        int totalTat = 0;
        int totalWt = 0;
        StringBuilder ct = new StringBuilder();
        for (int i = 0; i < n; i++) {
            int tat = completion[i] - PROCS[i].arrival();
            totalTat += tat;
            totalWt += tat - PROCS[i].burst();
            ct.append(PROCS[i].id()).append('=').append(completion[i]).append(' ');
        }
        System.out.println(name + " Gantt: " + gantt.toString().trim());
        System.out.println(name + " CT:    " + ct.toString().trim());
        System.out.printf("%s average TAT = %.2f, average WT = %.2f%n",
                name, (double) totalTat / n, (double) totalWt / n);
    }
}
```

**Output:**

```text
SJF  Gantt: P1[0-8] P3[8-10] P2[10-14] P4[14-19]
SJF  CT:    P1=8 P2=14 P3=10 P4=19
SJF  average TAT = 11.25, average WT = 6.50
SRTF Gantt: P1[0-1] P2[1-2] P3[2-4] P2[4-7] P4[7-12] P1[12-19]
SRTF CT:    P1=19 P2=7 P3=4 P4=12
SRTF average TAT = 9.00, average WT = 4.25
```

## Comparison

| Aspect | FCFS | SJF | SRTF |
|--------|------|-----|------|
| Preemptive | No | No | Yes |
| Chooses by | Arrival order | Shortest burst | Shortest remaining time |
| Average WT | Often high (convoy) | Minimum when all arrive together | Minimum (ignoring switch cost) |
| Starvation | No | Yes — long jobs | Yes — long jobs |
| Needs burst length | No | Yes (estimated) | Yes (estimated) |
| Context switches | Fewest | Few | More |

## Important Points

- SJF: non-preemptive, shortest burst first. SRTF: preemptive, shortest remaining time first.
- SJF gives the minimum average waiting time when all processes are available together; SRTF gives the minimum even with staggered arrivals (ignoring context-switch cost).
- Both can **starve** long processes if short ones keep arriving; **aging** (raising priority with waiting time) fixes it.
- Burst lengths are predicted with exponential averaging: τ(n+1) = α·t(n) + (1 − α)·τ(n).
- In SJF, a process that started keeps the CPU even if a shorter one arrives.

## Common Confusion

> [!WARNING]
> **Running SJF as if it were preemptive.** In the example, P1 runs 0–8 under SJF even though P2, P3 and P4 arrive while it runs. Only SRTF interrupts it.

- **"SJF is optimal, so every OS uses it."** It is optimal only if burst times are known. Real schedulers can only estimate them.
- **SRTF compares with the remaining time** of the running process, not its original burst.

## Interview Perspective

- *"Why is SJF optimal for average waiting time?"* — swapping argument: short before long always reduces total waiting.
- *"What is the problem with SJF in practice?"* — burst lengths unknown; starvation.
- *"SJF vs SRTF?"* — non-preemptive vs preemptive; compare on an example with arrival times.
- Expect a full Gantt-chart calculation with arrivals; check every arrival point in SRTF.

## Quick Revision

- SJF: pick shortest burst when CPU is free; no preemption.
- SRTF: on every arrival, preempt if newcomer < remaining time.
- Optimal average WT; starvation of long jobs; aging fixes it.
- Predict bursts: τ(n+1) = α·t(n) + (1 − α)·τ(n).
