# Types of Operating Systems — Interview Questions

## Beginner

### Q1. What is a batch operating system?

**Style:** Direct

<details>
<summary>Answer</summary>

An OS that runs jobs in groups (batches) one after another without user interaction. Jobs are submitted, queued and processed; results come back later. It reduced setup time between jobs, but the CPU sat idle whenever a job waited for I/O, and users could not interact with running jobs.

</details>

### Q2. What is the difference between multiprogramming and multitasking?

**Style:** Comparison

<details>
<summary>Answer</summary>

Both keep several programs in memory. In **multiprogramming** the CPU switches to another program only when the running one waits for I/O or finishes; the goal is CPU utilisation. **Multitasking** (time-sharing) also preempts the running program when its time slice expires, so every program gets frequent turns; the goal is short response time for interactive users.

</details>

### Q3. What is a real-time operating system? Give examples of hard and soft real-time systems.

**Style:** Direct

<details>
<summary>Answer</summary>

An OS whose correctness depends on meeting timing deadlines, with predictable response times. **Hard real-time:** missing a deadline is a system failure — airbag deployment, pacemakers, flight control, anti-lock brakes. **Soft real-time:** missing a deadline lowers quality but is tolerated — video and audio streaming, online gaming.

</details>

## Intermediate

### Q4. What is the difference between multitasking and multiprocessing?

**Style:** Comparison

<details>
<summary>Answer</summary>

Multitasking is a scheduling technique: one CPU interleaves many tasks by time slicing, giving the illusion of simultaneity (concurrency). Multiprocessing is a hardware configuration: two or more CPUs execute tasks truly at the same time (parallelism). A modern system does both: each core multitasks, and several cores run in parallel.

</details>

### Q5. What is the difference between symmetric and asymmetric multiprocessing?

**Style:** Comparison

<details>
<summary>Answer</summary>

In **symmetric multiprocessing (SMP)** every CPU is equal: each runs kernel code and user processes and schedules itself from shared or per-CPU queues. In **asymmetric multiprocessing** one master CPU runs the OS and assigns work to the other CPUs. SMP is the standard for general-purpose systems; asymmetric designs appear in some embedded systems.

</details>

### Q6. Is a faster OS always better for a real-time system?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Real-time systems need **predictability** — a guaranteed worst-case response time — more than a fast average. An OS that usually answers in 1 ms but occasionally takes 200 ms fails a hard 10 ms deadline, while one that always answers in 5 ms passes. RTOSes therefore use priority-based preemptive scheduling and avoid unbounded delays.

</details>

## Advanced

### Q7. Concurrency vs parallelism — can you have one without the other?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Yes. **Concurrency** is about structure: several tasks in progress, interleaved (possible on one core). **Parallelism** is about execution: several computations at the same instant (needs several cores). One core running a browser and a music player by time slicing is concurrent but not parallel. A single SIMD instruction that adds eight pairs of numbers at once is parallel without concurrency: there is only one task, but several operations happen at the same instant.

</details>
