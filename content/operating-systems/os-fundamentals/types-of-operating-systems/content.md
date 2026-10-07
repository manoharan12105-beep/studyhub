# Types of Operating Systems

**Module:** OS Fundamentals · **Interview priority:** Frequently asked

## Concept

Operating systems are classified by **how they share the CPU among jobs** and **what they are built for**. The interview favourites are batch, multiprogramming, multitasking (time-sharing), multiprocessing and real-time systems. These are not exclusive boxes: a modern Linux server is multiprogrammed, multitasking and multiprocessing at once.

## Why It Matters

Each type answers a problem of its time: an idle CPU (multiprogramming), unresponsive users (time-sharing), more work than one CPU can do (multiprocessing), deadlines that must never be missed (real-time). Knowing the problem makes the definitions easy to remember and to tell apart.

## How It Works

### Batch operating system

Jobs with similar needs are collected into a **batch** and run one after another with no user interaction. An operator submits the batch; output comes back later.

- Problem it solved: setup time between jobs.
- Weakness: while a job waits for I/O, the CPU is idle; no interaction.
- Today: payroll runs, nightly reports and bank statement generation still work in this *style*.

### Multiprogramming

Several programs are kept in memory at once. When the running program waits for I/O, the OS switches the CPU to another one.

- Goal: **maximise CPU utilisation** — the CPU should never be idle while some job could run.
- A program keeps the CPU until it waits for I/O (or finishes); there is no time limit.

### Multitasking (time-sharing)

An extension of multiprogramming: the CPU switches between programs so often — each gets a short **time slice** (quantum) — that every user and program seems to run at the same time.

- Goal: **minimise response time** for interactive users.
- Needs a timer interrupt and preemptive scheduling (see [Round Robin](../../cpu-scheduling/round-robin-scheduling/content.md)).
- Every desktop and phone OS is a multitasking OS.

### Multiprocessing

The system has **two or more CPUs (or cores)** that share memory and run processes truly in parallel.

- **Symmetric (SMP):** every CPU runs the OS and user processes; the normal design today.
- **Asymmetric:** one master CPU controls the others, which run assigned tasks.
- Benefits: throughput, and (on servers) reliability — losing one CPU does not stop the system.

### Real-time operating system (RTOS)

Correctness depends on **meeting deadlines**, not only on the right result.

- **Hard real-time:** a missed deadline is a failure — airbag controller, pacemaker, anti-lock brakes.
- **Soft real-time:** missed deadlines degrade quality but are tolerated — video streaming, online games, audio playback.
- An RTOS favours **predictable** timing over average speed.

### Other types (awareness)

| Type | Idea | Example |
|------|------|---------|
| Distributed OS | Many networked machines appear as one system | Research systems; ideas live on in cluster managers |
| Network OS | Machines keep their own OS but share files, printers and users over a network | Windows Server domain, Linux file server |
| Embedded OS | Small OS built into a device with a fixed purpose | Router firmware, smart TV, washing machine |
| Mobile OS | Multitasking OS tuned for touch, battery and sensors | Android, iOS |

## Example

Three programs: a compiler (CPU-heavy), a backup (disk-heavy) and a text editor (interactive).

- **Batch:** compiler, then backup, then editor. The editor's user waits for both jobs; the CPU idles during the backup's disk waits.
- **Multiprogramming:** when the backup waits for disk, the compiler runs. CPU utilisation rises, but the editor may still wait a long time if the compiler never does I/O.
- **Multitasking:** all three get turns of a few milliseconds each. The editor responds instantly to typing.
- **Multiprocessing (4 cores):** the three really run at the same time on different cores.

## Comparison

| Aspect | Multiprogramming | Multitasking | Multiprocessing |
|--------|------------------|--------------|-----------------|
| Key idea | Several jobs in memory; switch on I/O wait | Switch on a timer too (time slices) | Several CPUs run jobs in parallel |
| Goal | CPU utilisation | Response time | Throughput, parallelism |
| CPUs | One is enough | One is enough | Two or more |
| Switching trigger | I/O wait or finish | Time slice expiry, I/O wait, finish | Each CPU schedules independently |

## Important Points

- Multiprogramming = **CPU utilisation**; multitasking = **response time**; multiprocessing = **parallel hardware**.
- Concurrency (interleaving on one CPU) is not parallelism (simultaneous on many CPUs).
- Hard real-time = deadline miss is failure; soft real-time = deadline miss is degradation.
- Modern OSes combine types: Linux on an 8-core server is multiprogrammed, multitasking and multiprocessing.

## Common Confusion

> [!WARNING]
> **"Multitasking needs several CPUs."** No. Multitasking interleaves tasks on even one CPU using time slices. Several CPUs make it **multiprocessing**.

- **Multiprogramming vs multitasking:** both keep several programs in memory. Multiprogramming switches only when the running program waits; multitasking also preempts it on a timer.
- **Real-time does not mean fast.** It means predictable: a deadline of 10 ms is met every time.

## Interview Perspective

- *"Difference between multiprogramming, multitasking and multiprocessing?"* — answer with the goal of each (utilisation, response time, parallelism) and the trigger for switching.
- *"Hard vs soft real-time, with examples?"* — airbag vs video streaming.
- *"Concurrency vs parallelism?"* — interleaved on one core vs simultaneous on several.

## Quick Revision

- Batch: jobs in groups, no interaction.
- Multiprogramming: switch on I/O wait → CPU utilisation.
- Multitasking/time-sharing: switch on timer → responsiveness.
- Multiprocessing: many CPUs → true parallelism.
- RTOS: deadlines; hard (must) vs soft (should).
