# Process States — Interview Questions

## Beginner

### Q1. What are the states of a process?

**Style:** Direct

<details>
<summary>Answer</summary>

New (being created), Ready (waiting for a CPU), Running (executing on a CPU), Waiting or Blocked (waiting for an event such as I/O completion), and Terminated (finished, being cleaned up). Some textbooks add Ready-Suspended and Blocked-Suspended for processes swapped out to disk.

</details>

### Q2. What is the difference between the Ready and Waiting states?

**Style:** Comparison

<details>
<summary>Answer</summary>

A **Ready** process has everything it needs except the CPU; it would run immediately if dispatched. A **Waiting** (blocked) process cannot run even if a CPU is free, because it needs an event first — an I/O completion, a lock, a message or a timer. The scheduler chooses only among Ready processes.

</details>

### Q3. What causes a process to move from Running to Ready?

**Style:** Direct

<details>
<summary>Answer</summary>

Preemption: its time slice expires (a timer interrupt), or a higher-priority process becomes ready under a preemptive scheduler. The process could keep running, but the OS takes the CPU away and puts it back in the ready queue.

</details>

## Intermediate

### Q4. Can a process move directly from Waiting to Running?

**Style:** Trap

<details>
<summary>Answer</summary>

No. When the awaited event occurs, the process moves to **Ready** and joins the ready queue. It runs again only when the scheduler dispatches it — the CPU may be busy with another process at that moment.

</details>

### Q5. Why is there no transition from Ready to Waiting?

**Style:** Why

<details>
<summary>Answer</summary>

A process enters Waiting by requesting something it must wait for — a system call such as `read()` or acquiring a lock — and it can only make a request while executing. A Ready process is not executing, so it cannot block itself.

</details>

### Q6. Walk through the states of a process that reads a file and exits.

**Style:** Scenario

<details>
<summary>Answer</summary>

New (created and loaded) → Ready (admitted) → Running (dispatched; calls `read()`) → Waiting (disk I/O in progress) → Ready (disk interrupt; data arrived) → Running (dispatched; processes data; may go Running → Ready several times when its time slice expires) → Terminated (calls `exit`).

</details>

### Q7. What are the ready queue and device queues?

**Style:** Direct

<details>
<summary>Answer</summary>

Lists of PCBs maintained by the OS. The **ready queue** holds processes in the Ready state; the CPU scheduler picks from it. **Device (wait) queues** hold processes blocked on a particular device or event; when the device interrupts, the OS moves the waiting PCB to the ready queue. State changes are implemented as PCBs moving between these queues.

</details>

## Advanced

### Q8. What are the suspended states, and why do they exist?

**Style:** Follow-up

<details>
<summary>Answer</summary>

When memory is overcommitted, the medium-term scheduler swaps some processes' memory to disk. A swapped-out process that is ready is **Ready-Suspended**; one that is also waiting for an event is **Blocked-Suspended**. A Blocked-Suspended process whose event occurs becomes Ready-Suspended; it must be swapped back in (to Ready) before it can run. Swapping frees memory for the active processes and controls the degree of multiprogramming.

</details>

### Q9. On a machine with 4 cores, how many processes can be in the Running state at once?

**Style:** Trap

<details>
<summary>Answer</summary>

At most 4 — one per core (or per hardware thread with simultaneous multithreading, so up to 8 on a 4-core CPU with 2 hardware threads per core). Any number can be Ready or Waiting.

</details>
