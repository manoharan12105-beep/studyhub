# CPU Scheduling Fundamentals

**Module:** CPU Scheduling · **Interview priority:** Core

## Concept

**CPU scheduling** is how the OS decides which **ready** process (or thread) gets the CPU next, and for how long. The part of the kernel that decides is the **CPU scheduler** (short-term scheduler); the part that actually hands over the CPU is the **dispatcher**.

Every algorithm in this module — FCFS, SJF, SRTF, Round Robin, Priority — is just a different rule for picking from the ready queue.

## Why It Matters

With many processes and few CPUs, the choice of who runs next decides how fast jobs finish, how responsive the system feels, and whether some process waits forever. It is also the most calculation-heavy OS interview topic: Gantt charts, waiting time and turnaround time.

## How It Works

### The CPU–I/O burst cycle

Processes alternate between **CPU bursts** (computing) and **I/O bursts** (waiting for disk, network, user). Scheduling decides who gets the CPU during each CPU burst.

- **CPU-bound** process: long CPU bursts, little I/O (video encoding, compiling).
- **I/O-bound** process: short CPU bursts, lots of waiting (editor, web server handling small requests).

A good mix keeps both the CPU and the devices busy.

### Three schedulers

| Scheduler | Also called | Decides | Runs |
|-----------|-------------|---------|------|
| **Long-term** | Job scheduler | Which new jobs are admitted into memory (degree of multiprogramming) | Rarely (seconds/minutes); minimal in time-sharing systems |
| **Short-term** | CPU scheduler | Which ready process runs next on the CPU | Very often (milliseconds) — must be fast |
| **Medium-term** | Swapper | Which processes to swap out to disk and back in | When memory is under pressure |

### Dispatcher

The dispatcher gives control of the CPU to the process the scheduler chose: it performs the [context switch](../../processes-and-threads/context-switching/content.md), switches to user mode and jumps to the right instruction. The time it takes is the **dispatch latency** — pure overhead.

### When scheduling decisions happen

1. Running → Waiting (process blocks on I/O).
2. Running → Ready (interrupt, time slice over).
3. Waiting → Ready (I/O completes — a more important process may now be ready).
4. Running → Terminated.

If the scheduler acts **only** in cases 1 and 4, scheduling is **non-preemptive**: once a process has the CPU, it keeps it until it blocks or finishes. If it can also act in cases 2 and 3, scheduling is **preemptive**: the OS can take the CPU away from a running process.

### Preemptive vs non-preemptive

| Aspect | Non-preemptive | Preemptive |
|--------|----------------|------------|
| CPU taken away? | Never; the process releases it | Yes: timer or higher-priority arrival |
| Response time | Poor for short or interactive jobs behind long ones | Good |
| Overhead | Fewer context switches | More context switches |
| Shared-data risk | Lower | Process can be interrupted mid-update → needs synchronisation |
| Algorithms | FCFS, SJF, non-preemptive Priority | SRTF, Round Robin, preemptive Priority |

### Scheduling criteria

| Criterion | Meaning | Goal |
|-----------|---------|------|
| CPU utilisation | % of time the CPU is busy | Maximise |
| Throughput | Processes completed per unit time | Maximise |
| Turnaround time (TAT) | Completion time − arrival time | Minimise |
| Waiting time (WT) | Time spent in the ready queue = TAT − burst time | Minimise |
| Response time (RT) | First time on CPU − arrival time | Minimise (interactive systems) |

Formulas and worked comparisons: [Scheduling Metrics and Comparison](../scheduling-metrics-and-comparison/content.md).

## Example

Three processes arrive at time 0: an editor (I/O-bound, bursts of 1 ms), a compiler (CPU-bound, bursts of 50 ms) and a backup (I/O-bound, bursts of 2 ms).

- **Non-preemptive FCFS** with the compiler first: the editor waits up to 50 ms for every keystroke — the user notices.
- **Preemptive Round Robin** with a 10 ms slice: the compiler is interrupted every 10 ms, so the editor and backup get the CPU quickly, and the disk stays busy with backup I/O while the compiler computes.

## Important Points

- Short-term scheduler picks from the ready queue; dispatcher performs the switch.
- Long-term controls admission; medium-term swaps processes out and in.
- Preemptive = the OS can take the CPU away (timer, higher priority); non-preemptive = only when the process blocks or exits.
- Criteria: maximise utilisation and throughput; minimise turnaround, waiting and response time.
- No algorithm is best for every criterion.

## Common Confusion

> [!WARNING]
> **"Waiting time is the time spent in the Waiting state."** In scheduling problems, waiting time means time spent in the **ready queue** (ready but not running). Time blocked on I/O is not counted.

- **Turnaround vs response time:** turnaround measures until the process *finishes*; response time until it *first runs*.
- **Dispatcher vs scheduler:** the scheduler chooses; the dispatcher switches.

## Interview Perspective

- *"Preemptive vs non-preemptive scheduling?"* — who can take the CPU away, with examples of each.
- *"What are the scheduling criteria?"* — five criteria and which to maximise or minimise.
- *"Long-, short- and medium-term schedulers?"* — what each decides and how often.
- *"What is dispatch latency?"* — time to stop one process and start another.

## Quick Revision

- Scheduler chooses; dispatcher switches (dispatch latency = overhead).
- Long-term: admission. Short-term: CPU. Medium-term: swapping.
- Preemptive: SRTF, RR, preemptive priority. Non-preemptive: FCFS, SJF, NP priority.
- Max: utilisation, throughput. Min: TAT, WT, RT.
