# CPU Scheduling Fundamentals — Interview Questions

## Beginner

### Q1. What is CPU scheduling?

**Style:** Direct

<details>
<summary>Answer</summary>

The OS activity of choosing which ready process or thread runs on the CPU next, and for how long. The short-term (CPU) scheduler selects from the ready queue according to an algorithm such as FCFS, SJF, Round Robin or Priority, and the dispatcher performs the context switch to the chosen process.

</details>

### Q2. What is the difference between preemptive and non-preemptive scheduling?

**Style:** Comparison

<details>
<summary>Answer</summary>

In **non-preemptive** scheduling, a process that gets the CPU keeps it until it blocks or terminates (FCFS, SJF, non-preemptive Priority). In **preemptive** scheduling, the OS can take the CPU from a running process — when its time slice expires or a higher-priority process becomes ready (Round Robin, SRTF, preemptive Priority). Preemptive gives better response time but more context switches and requires care with shared data.

</details>

### Q3. What are the criteria used to compare scheduling algorithms?

**Style:** Direct

<details>
<summary>Answer</summary>

CPU utilisation (maximise), throughput — processes completed per unit time (maximise), turnaround time — completion minus arrival (minimise), waiting time — time in the ready queue (minimise), and response time — first run minus arrival (minimise, important for interactive systems).

</details>

## Intermediate

### Q4. What are the long-term, short-term and medium-term schedulers?

**Style:** Comparison

<details>
<summary>Answer</summary>

- **Long-term (job) scheduler:** decides which jobs are admitted to memory; controls the degree of multiprogramming; runs infrequently.
- **Short-term (CPU) scheduler:** picks the next ready process to run; runs every few milliseconds, so it must be fast.
- **Medium-term scheduler:** swaps processes out of memory to disk and back in, to reduce memory pressure or rebalance the mix.

</details>

### Q5. What is the dispatcher, and what is dispatch latency?

**Style:** Direct

<details>
<summary>Answer</summary>

The dispatcher is the kernel module that gives the CPU to the process selected by the scheduler: it switches context, switches to user mode and jumps to the correct location in the program. Dispatch latency is the time the dispatcher takes to stop one process and start another — overhead that should be as small as possible.

</details>

### Q6. When does the CPU scheduler have to make a decision?

**Style:** How

<details>
<summary>Answer</summary>

When a process switches from Running to Waiting, from Running to Ready (interrupt or time-slice expiry), from Waiting to Ready (I/O completes), or terminates. Decisions only in the first and last cases mean non-preemptive scheduling; decisions in all four cases mean preemptive scheduling.

</details>

### Q7. What is the difference between a CPU-bound and an I/O-bound process? Why does the mix matter?

**Style:** Why

<details>
<summary>Answer</summary>

A CPU-bound process spends most of its time computing with long CPU bursts; an I/O-bound process has short CPU bursts and spends most of its time waiting for I/O. With only CPU-bound processes, devices sit idle; with only I/O-bound ones, the CPU sits idle. A balanced mix — and a scheduler that lets I/O-bound processes run promptly — keeps both busy.

</details>

## Advanced

### Q8. In scheduling problems, does "waiting time" include time blocked on I/O?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Waiting time is the total time a process spends in the **ready queue** — ready to run but not running. Time blocked for I/O is a separate component. For a process with a single CPU burst and no I/O, waiting time = turnaround time − burst time.

</details>

### Q9. Why do interactive systems use preemptive scheduling even though it adds overhead?

**Style:** Why

<details>
<summary>Answer</summary>

Interactive users care about response time. Without preemption, a long CPU-bound job could hold the CPU for seconds while keystrokes and clicks wait. Preemption with short time slices guarantees every ready process gets the CPU within a bounded time. The extra context switches cost a few percent of CPU time, which is a good trade for responsiveness.

</details>
