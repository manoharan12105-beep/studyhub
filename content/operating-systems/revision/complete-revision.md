# Complete OS Revision

Every module in one pass: what each idea is, why it exists, and the one fact interviewers check. Comparisons, traps and formulas have their own sections in this mode.

## 1. OS Fundamentals

- **Operating system** — software between hardware and programs; a **resource manager** (CPU, memory, storage, devices) and an **extended machine** (files, processes, sockets instead of raw hardware).
- **Goals** — convenience, efficiency, protection and security, ability to evolve.
- **Responsibilities** — process, memory, file, device, storage management; protection; user interface.
- **Kernel** — the always-resident, privileged core. The shell and GUI are ordinary programs.
- **Types** — batch (no interaction), multiprogramming (switch on I/O wait → CPU utilisation), multitasking/time-sharing (switch on a timer → response time), multiprocessing (several CPUs → parallelism), real-time (deadlines; hard vs soft).
- **Dual mode** — the mode bit separates **kernel mode** (all instructions, all memory) from **user mode** (restricted). Privileged instructions: I/O, interrupt control, timer, page tables.
- **Entering the kernel** — only by **system call**, **interrupt** or **exception**; return-from-trap goes back.
- **Architectures** — monolithic (all services in kernel mode: fast, fragile — Linux), microkernel (IPC + scheduling + basic memory in kernel, rest in user mode: reliable, slower — QNX, MINIX), layered, modular (loadable modules, still kernel mode), hybrid (Windows, macOS).
- **System call** — controlled request for a kernel service: wrapper → registers → trap → system-call table → handler → return. Categories: process, file, device, information, communication, protection.
- **fork / exec / wait** — fork duplicates (0 to child, child PID to parent); exec replaces the program; wait reaps the child. n forks → 2ⁿ processes.

## 2. Processes and Threads

- **Process** — program in execution: text, data, heap, stack + PC, registers, open files, state. **Program** — passive file.
- **States** — New → Ready → Running → Terminated; Running → Ready (preempted), Running → Waiting (I/O/event), Waiting → Ready (event done). Never Waiting → Running.
- **PCB** — the kernel's record of a process: PID, state, PC and registers, scheduling info, memory info, open files, accounting. Linux: `task_struct`.
- **Context switch** — save the old context into its PCB, load the new one; pure overhead (registers, page table, cold caches/TLB). Thread switches are cheaper than process switches.
- **Zombie** — exited but not reaped by `wait()`. **Orphan** — parent died; adopted by PID 1.
- **Thread** — PC + registers + stack inside a process; shares code, data, heap and files with sibling threads.
- **User vs kernel threads** — user threads are cheap but invisible to the kernel (one blocks → all block in many-to-one); kernel threads block independently and run in parallel. Models: many-to-one, one-to-one (Linux, Windows, Java platform threads), many-to-many (Java virtual threads follow this idea).
- **Process vs thread** — isolation vs sharing; IPC vs shared memory; heavy vs light.

## 3. CPU Scheduling

- **Schedulers** — long-term (admission), short-term (CPU, every few ms), medium-term (swapping). **Dispatcher** performs the switch (dispatch latency).
- **Preemptive** — the OS can take the CPU away (SRTF, RR, preemptive priority). **Non-preemptive** — only when the process blocks or exits (FCFS, SJF, NP priority).
- **Criteria** — maximise CPU utilisation and throughput; minimise turnaround, waiting and response time.
- **FCFS** — arrival order; simple; **convoy effect**; no starvation.
- **SJF** — shortest burst first; optimal average waiting time when all arrive together; burst lengths must be predicted (exponential averaging); starvation.
- **SRTF** — preemptive SJF; preempt only if the newcomer is strictly shorter than the remaining time.
- **Round Robin** — FCFS + time quantum; no starvation; best response time; q too large → FCFS, too small → switch overhead; arrivals join the queue before the preempted process.
- **Priority** — highest priority first (state the number convention); starvation → **aging**; priority inversion → **priority inheritance**.
- **MLFQ** — queues with different priorities and quanta; CPU hogs sink, waiters rise.

## 4. Synchronization

- **Race condition** — shared data + concurrent access + a write + no synchronisation → timing-dependent result. `count++` is load–add–store. Check-then-act is also a race.
- **Critical section** — code that touches shared data. Entry → critical → exit → remainder.
- **Requirements** — mutual exclusion, progress, bounded waiting.
- **Peterson's algorithm** — `flag[i] = true; turn = j; while (flag[j] && turn == j) wait;` — correct for two processes, needs memory barriers on modern CPUs.
- **Hardware** — test-and-set, compare-and-swap; disabling interrupts only on one CPU, kernel only.
- **Spinlock vs blocking lock** — busy-wait (short waits, multicore) vs sleep in a queue.
- **Mutex** — lock with an owner; only the owner unlocks; reentrant variants keep a hold count; release in `finally`.
- **Semaphore** — integer with atomic wait (P) and signal (V); counting (N resources) or binary; initial 0 = ordering/signalling; no owner.
- **Producer–consumer** — `empty = N`, `full = 0`, `mutex = 1`; wait on the counter **before** the mutex.
- **Classic problems** — readers–writers (writer starvation), dining philosophers (circular wait; order the forks).

## 5. Deadlocks

- **Deadlock** — a set of processes each waiting for a resource held by another in the set.
- **Coffman conditions** — mutual exclusion, hold and wait, no preemption, circular wait. All four are necessary.
- **RAG** — request edge P → R, assignment edge R → P. No cycle → no deadlock; cycle + single instances → deadlock; cycle + multiple instances → maybe.
- **Prevention** — break a condition: share/spool, request all at once, release and retry, **global resource order** (most practical).
- **Avoidance** — grant only if the state stays **safe** (a safe sequence exists). Unsafe ≠ deadlock. Needs Max in advance.
- **Banker's algorithm** — Need = Max − Allocation; safety: find Need ≤ Work, Work += Allocation; request: ≤ Need, ≤ Available, pretend, safe → grant.
- **Detection** — wait-for graph cycle (single instance); detection algorithm with the current Request matrix (multiple instances).
- **Recovery** — abort all / one at a time; preempt resources with rollback; choose cheap victims; avoid starving one victim.
- **Starvation vs deadlock vs livelock** — passed over vs circular wait vs active but no progress.

## 6. Memory Management

- **Logical vs physical address** — CPU generates logical; the **MMU** translates at run time. Base + limit: check L < limit, then base + L.
- **Contiguous allocation** — first fit, best fit, worst fit; **external fragmentation** (holes between blocks) → compaction or paging; **internal fragmentation** (unused space inside a block).
- **Paging** — pages and frames of equal size; page table; p = LA ÷ size, d = LA mod size, PA = frame × size + d; no external fragmentation; TLB caches translations; multi-level page tables.
- **Segmentation** — variable-size logical segments; ⟨s, d⟩ with base and limit; natural protection and sharing; external fragmentation.
- **Virtual memory** — address space larger than RAM; **demand paging** with valid–invalid bits; locality makes it work; copy-on-write makes `fork` cheap.
- **Page fault** — access to a non-resident page → trap → load from disk (process blocks) → update table → restart instruction. Major vs minor vs invalid (SIGSEGV).
- **Page replacement** — FIFO (oldest load; Belady's anomaly), LRU (oldest use; approximated by clock/second chance), Optimal (farthest future use; benchmark). Dirty victims are written back first.
- **Thrashing** — Σ working sets > RAM → constant faults, CPU idle. Fix: fewer processes, working-set model, page-fault frequency, local replacement, more RAM.

## 7. Storage and I/O

- **File system** — files (data + attributes) and directories (tree + links) mapped to blocks.
- **Allocation** — contiguous (fast, external fragmentation), linked/FAT (no fragmentation, slow random access), indexed/inode (direct access).
- **Inode** — metadata + direct and indirect block pointers; no file name. Hard link = another name for an inode; symbolic link = a path.
- **Free space** — bitmap or free list. **Journaling** — log metadata changes first.
- **Disk scheduling** — FCFS, SSTF (nearest; starvation), SCAN (elevator), C-SCAN (one direction, jump back), LOOK/C-LOOK (turn at the last request).
- **I/O techniques** — polling (CPU spins), interrupts (device signals), DMA (controller copies; one interrupt per block).
- **Application I/O** — blocking, non-blocking (returns what is ready), asynchronous (notified on completion). Kernel services: buffering, caching, spooling.
