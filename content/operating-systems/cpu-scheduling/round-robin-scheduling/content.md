# Round Robin Scheduling

**Module:** CPU Scheduling · **Interview priority:** Core

## Concept

**Round Robin (RR)** gives each ready process the CPU for at most one **time quantum** (time slice), typically 10–100 ms in real systems. If the process has not finished when its quantum expires, a timer interrupt **preempts** it and it goes to the **back of the ready queue**. The ready queue is a circular FIFO queue.

Round Robin is FCFS plus preemption by a timer — the classic algorithm for **time-sharing** systems.

## Why It Matters

RR guarantees that every ready process gets the CPU regularly: with *n* ready processes and quantum *q*, no process waits more than **(n − 1) × q** before its next turn. That bounded wait gives good **response time** and **no starvation**, which is why interactive systems build on it. Choosing the quantum is the classic trade-off question.

## How It Works

### Rules

1. New processes join the **tail** of the ready queue.
2. The scheduler dispatches the process at the **head** and sets the timer to *q*.
3. If the burst finishes within *q*, the process leaves and the next one is dispatched at once (the rest of the quantum is not wasted).
4. If the quantum expires, the process is preempted and moved to the **tail**.

> [!IMPORTANT]
> **Tie rule used in StudyHub problems:** if a process arrives at the same moment another's quantum expires, the **arriving process joins the queue first**, then the preempted one. Most textbooks use this rule; some do the opposite, so state your assumption in an exam.

### Choosing the quantum

| Quantum | Effect |
|---------|--------|
| Very large (≥ longest burst) | Every process finishes in its first turn → behaves exactly like **FCFS** |
| Very small | Excellent response time, but **context-switch overhead** dominates |
| Good choice | Larger than most CPU bursts (rule of thumb: ~80 % of bursts finish within one quantum) and much larger than the switch time |

## Example

| Process | AT | BT |
|---------|----|----|
| P1 | 0 | 5 |
| P2 | 1 | 3 |
| P3 | 2 | 1 |
| P4 | 3 | 2 |
| P5 | 4 | 3 |

Quantum **q = 2**. Trace of the ready queue (head on the left):

| Time | Event | Ready queue after the event | Runs next |
|------|-------|-----------------------------|-----------|
| 0 | P1 arrives | — | P1 (0–2) |
| 2 | P3 arrives; P1's quantum ends (3 left) | P2, P3, P1 | P2 (2–4) |
| 4 | P5 arrives; P2's quantum ends (1 left) | P3, P1, P4, P5, P2 | P3 (4–5) |
| 5 | P3 finishes | P1, P4, P5, P2 | P1 (5–7) |
| 7 | P1's quantum ends (1 left) | P4, P5, P2, P1 | P4 (7–9) |
| 9 | P4 finishes | P5, P2, P1 | P5 (9–11) |
| 11 | P5's quantum ends (1 left) | P2, P1, P5 | P2 (11–12) |
| 12 | P2 finishes | P1, P5 | P1 (12–13) |
| 13 | P1 finishes | P5 | P5 (13–14) |

(P2 arrived at 1 and P4 at 3, while P1 and P2 were running; each joined the tail at that moment.)

```text
| P1 | P2 | P3| P1 | P4 | P5 |P2|P1|P5|
0    2    4   5    7    9   11  12 13 14
```

| Process | CT | TAT | WT | RT |
|---------|----|-----|----|----|
| P1 | 13 | 13 | 8 | 0 |
| P2 | 12 | 11 | 8 | 1 |
| P3 | 5 | 3 | 2 | 2 |
| P4 | 9 | 6 | 4 | 4 |
| P5 | 14 | 10 | 7 | 5 |

Average TAT = 43 ÷ 5 = **8.6**; average WT = 29 ÷ 5 = **5.8**; average RT = 12 ÷ 5 = **2.4**.

### Same processes, different quanta

| Quantum | Avg WT | Avg RT | Context switches |
|---------|--------|--------|------------------|
| 1 | 5.2 | 1.2 | 13 |
| 2 | 5.8 | 2.4 | 8 |
| 3 | 4.6 | 3.4 | 5 |
| 5 (= longest burst) | 4.6 | 4.6 | 4 — identical to FCFS |

A smaller quantum gives better **response** time but many more switches; average **waiting** time does not simply fall as the quantum shrinks.

### Round Robin in Java

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class RoundRobinScheduling {

    record Proc(String id, int arrival, int burst) {}

    public static void main(String[] args) {
        Proc[] procs = {                                  // sorted by arrival time
            new Proc("P1", 0, 5), new Proc("P2", 1, 3), new Proc("P3", 2, 1),
            new Proc("P4", 3, 2), new Proc("P5", 4, 3),
        };
        int quantum = 2;
        int n = procs.length;
        int[] remaining = new int[n];
        int[] completion = new int[n];
        int[] firstRun = new int[n];
        for (int i = 0; i < n; i++) {
            remaining[i] = procs[i].burst();
            firstRun[i] = -1;
        }

        Deque<Integer> ready = new ArrayDeque<>();
        StringBuilder gantt = new StringBuilder("Gantt:");
        int time = 0;
        int next = 0;                                     // next process still to arrive
        int finished = 0;
        while (finished < n) {
            while (next < n && procs[next].arrival() <= time) {
                ready.add(next++);
            }
            if (ready.isEmpty()) {                        // CPU idle until the next arrival
                time = procs[next].arrival();
                continue;
            }
            int p = ready.poll();
            if (firstRun[p] == -1) {
                firstRun[p] = time;
            }
            int run = Math.min(quantum, remaining[p]);
            gantt.append(' ').append(procs[p].id()).append('[').append(time).append('-').append(time + run).append(']');
            time += run;
            remaining[p] -= run;
            while (next < n && procs[next].arrival() <= time) {
                ready.add(next++);                        // arrivals join before the preempted process
            }
            if (remaining[p] > 0) {
                ready.add(p);
            } else {
                completion[p] = time;
                finished++;
            }
        }

        System.out.println(gantt);
        System.out.println("ID  CT  TAT  WT  RT");
        int totalTat = 0;
        int totalWt = 0;
        int totalRt = 0;
        for (int i = 0; i < n; i++) {
            int tat = completion[i] - procs[i].arrival();
            int wt = tat - procs[i].burst();
            int rt = firstRun[i] - procs[i].arrival();
            totalTat += tat;
            totalWt += wt;
            totalRt += rt;
            System.out.printf("%-3s %2d  %3d  %2d  %2d%n", procs[i].id(), completion[i], tat, wt, rt);
        }
        System.out.printf("Average TAT = %.2f, WT = %.2f, RT = %.2f%n",
                (double) totalTat / n, (double) totalWt / n, (double) totalRt / n);
    }
}
```

**Output:**

```text
Gantt: P1[0-2] P2[2-4] P3[4-5] P1[5-7] P4[7-9] P5[9-11] P2[11-12] P1[12-13] P5[13-14]
ID  CT  TAT  WT  RT
P1  13   13   8   0
P2  12   11   8   1
P3   5    3   2   2
P4   9    6   4   4
P5  14   10   7   5
Average TAT = 8.60, WT = 5.80, RT = 2.40
```

## Important Points

- Preemptive FCFS with a time quantum; ready queue is circular FIFO.
- No starvation; maximum wait for the next turn = (n − 1) × q.
- Good response time; average waiting/turnaround time is often worse than SJF.
- q too large → FCFS; q too small → overhead from context switches.
- A process that finishes early releases the CPU immediately.

## Common Confusion

> [!WARNING]
> **Getting the queue order wrong at a quantum boundary.** Admit processes that arrived during (or at the end of) the slice **before** re-queuing the preempted process. Track the queue in a table as in the example — most wrong answers come from skipping this.

- **"Smaller quantum always means lower waiting time."** No — it improves response time; waiting time can go up or down, and overhead rises.
- **Waiting time in RR** is all the time spent in the ready queue across every turn: WT = TAT − BT still works.

## Interview Perspective

- *"Explain Round Robin. What happens if the quantum is too large or too small?"* — FCFS vs overhead.
- *"Why is RR good for time-sharing?"* — bounded waiting, responsiveness, no starvation.
- *"Calculate average WT/TAT for q = 2."* — keep a ready-queue table.
- *"What is the maximum time a process waits for its next turn?"* — (n − 1) × q (plus switch overhead).

## Quick Revision

- Each process runs ≤ q, then goes to the tail. Arrivals join before the preempted process.
- No starvation; bounded wait (n − 1) × q; great response time.
- q large → FCFS; q small → switch overhead.
- WT = TAT − BT; RT = first run − AT.
