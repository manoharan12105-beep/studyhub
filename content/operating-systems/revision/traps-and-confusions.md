# OS Interview Traps and Confusions

Each trap gives the tempting wrong answer, then the precise one. Read the wrong answer and try to correct it before reading on.

## Fundamentals

- **"The OS is the GUI."** The GUI and the shell are user programs. The kernel does the OS work, with or without a GUI.
- **"Root runs in kernel mode."** Root is a user identity; root's programs run in user mode and still use system calls.
- **"Every system call is a context switch."** A system call is a **mode** switch. A context switch happens only if the call blocks or the scheduler picks another process.
- **"`printf` is a system call."** It is a library function that buffers text and eventually calls `write`.
- **"Linux is a microkernel because it loads modules."** Modules run in kernel mode. Linux is monolithic and modular.
- **"Multitasking needs several CPUs."** One CPU multitasks by time slicing. Several CPUs = multiprocessing.
- **"Real-time means fast."** It means predictable — deadlines met every time.

## Processes and Threads

- **"After I/O completes, the process runs."** It becomes **Ready**; it runs when dispatched. There is no Waiting → Running edge.
- **"A thread has its own heap."** Threads share the heap; each has its own **stack**.
- **"More threads are always faster."** Beyond the core count (for CPU-bound work), extra threads add switching and contention.
- **"Killing a zombie with `kill -9` removes it."** A zombie is already dead; its parent must `wait()` (or exit so PID 1 reaps it).
- **"A context switch saves the process's memory."** Memory stays in place; only CPU state and the page-table pointer change.

## CPU Scheduling

- **"Waiting time = time in the Waiting state."** In scheduling problems it is time in the **ready queue**: WT = TAT − BT.
- **"TAT = CT."** TAT = CT − AT. Equal only when the process arrives at 0.
- **Forgetting idle time.** If nothing has arrived, the CPU idles; the next process starts at its arrival time.
- **Running SJF as preemptive.** SJF never interrupts a running process; SRTF does.
- **"SRTF preempts on a tie."** It preempts only when the newcomer is **strictly** shorter.
- **"Smaller quantum always lowers waiting time."** It improves response time; waiting time may rise, and overhead does.
- **RR queue order at a quantum boundary.** Arrivals at that instant join **before** the preempted process (state your convention).
- **Priority number direction.** Lower number = higher priority is common but not universal. Always state it.
- **"FCFS can starve processes."** It cannot; it can only make them wait long (convoy effect).

## Synchronization

- **"`volatile` makes `count++` safe."** It gives visibility, not atomicity. Use `AtomicInteger` or a lock.
- **"Single core = no race conditions."** Preemption between load and store is enough.
- **"Only writers need the lock."** Readers need it too (or a read-write lock), or they see half-updated data.
- **"A binary semaphore is a mutex."** No owner, no reentrancy, no priority inheritance.
- **"Strict alternation solves the critical-section problem."** It violates **progress**.
- **"Peterson's algorithm works on any CPU."** Not without memory barriers on modern reordering hardware.
- **Producer–consumer order.** `wait(mutex)` before `wait(empty)` deadlocks when the buffer is full.

## Deadlocks

- **"A cycle in the RAG means deadlock."** Only if every resource in it has one instance.
- **"All four Coffman conditions hold → deadlock."** They are necessary, not sufficient.
- **"Unsafe state = deadlock."** Unsafe means deadlock is **possible**; deadlocked states are a subset of unsafe states.
- **"Resources are free, so the Banker's algorithm grants the request."** Availability is only step 2; the safety check decides.
- **Adding Need to Work.** A finishing process returns its **Allocation**.
- **Using Need in deadlock detection.** Detection uses the **current Request** matrix.
- **"CPU preemption breaks the no-preemption condition."** Taking the CPU away does not take away locks.
- **Deadlock vs starvation.** Starved processes could run; deadlocked processes cannot.

## Memory

- **Internal vs external fragmentation swapped.** Internal = inside a block (paging); external = between blocks (segmentation, contiguous).
- **"Paging has no fragmentation."** No external; the last page has internal fragmentation.
- **PA = page × size + offset.** It is **frame** × size + offset.
- **Segmentation check against the base.** Compare offset with the **limit**, then add the base.
- **"A page fault is an error."** On a valid address it is normal demand paging. Invalid addresses cause segmentation faults.
- **Page fault vs TLB miss.** TLB miss: translation not cached, page in RAM. Page fault: page not in RAM.
- **"Virtual memory = swap."** Swap is one backing store; virtual memory is the whole mechanism.
- **Not counting first loads as faults.** With empty frames, each first reference is a fault.
- **"LRU always beats FIFO."** Usually, not always. Only Optimal is guaranteed best.
- **"Belady's anomaly affects LRU."** Only FIFO (non-stack algorithms). LRU and Optimal are stack algorithms.
- **"Thrashing = CPU overload."** The CPU is mostly **idle**, waiting for paging I/O.

## Storage and I/O

- **"The inode stores the file name."** Names live in directory entries.
- **SCAN vs LOOK.** SCAN goes to the disk end; LOOK turns at the last request.
- **C-SCAN/C-LOOK return jump.** Some books count it, some do not — say which.
- **Non-blocking vs asynchronous.** Non-blocking returns what is ready now; asynchronous completes later and notifies.
- **"DMA needs no interrupts."** One interrupt per block instead of per byte.
