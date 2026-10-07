# OS Important Comparisons

The differences interviewers ask for most, side by side. Each table is complete enough to answer "What is the difference between X and Y?" on its own.

## Process vs Program

| Program | Process |
|---------|---------|
| Passive file of instructions | Active program in execution |
| On disk | In memory, with CPU state |
| No resources, no state | PC, registers, stack, heap, open files, state |
| One file | Many processes can run the same program |

## Process vs Thread

| Aspect | Process | Thread |
|--------|---------|--------|
| Address space | Own | Shared with sibling threads |
| Private | Everything | PC, registers, stack |
| Creation / switch cost | High | Low |
| Communication | IPC through the kernel | Shared memory |
| One crashes | Others unaffected | Whole process usually dies |
| Use when | Isolation matters | Sharing and speed matter |

## User Mode vs Kernel Mode

| User mode | Kernel mode |
|-----------|-------------|
| Applications | Kernel, most drivers |
| Non-privileged instructions only | All instructions |
| Own address space | All memory |
| Crash kills one process | Crash can bring down the system |
| Enters kernel via system call, interrupt, exception | Returns via return-from-trap |

## Mode Switch vs Context Switch

| Mode switch | Context switch |
|-------------|----------------|
| User ↔ kernel privilege change | Change of the running process or thread |
| Same process continues | Different process or thread runs next |
| Every system call and interrupt | Preemption, blocking, exit, yield |
| Cheap | Expensive (state save/load, page table, caches) |

## Monolithic vs Microkernel

| Monolithic | Microkernel |
|------------|-------------|
| All services in kernel mode | IPC, scheduling, basic memory in kernel; rest in user mode |
| Function calls | Message passing |
| Fast | Slower (extra messages and switches) |
| One driver bug can crash all | Failed service restarts |
| Linux | QNX, MINIX 3, seL4 |

## Multiprogramming vs Multitasking vs Multiprocessing

| | Multiprogramming | Multitasking | Multiprocessing |
|---|---|---|---|
| Idea | Several jobs in memory, switch on I/O wait | Also switch on a timer | Several CPUs |
| Goal | CPU utilisation | Response time | Parallel throughput |
| CPUs needed | One | One | Two or more |

## Preemptive vs Non-preemptive Scheduling

| Preemptive | Non-preemptive |
|------------|----------------|
| OS can take the CPU away | Process keeps the CPU until it blocks or exits |
| Better response time | Poorer response for short jobs |
| More context switches | Fewer switches |
| SRTF, Round Robin, preemptive priority | FCFS, SJF, non-preemptive priority |

## FCFS vs SJF vs SRTF vs Round Robin vs Priority

| | FCFS | SJF | SRTF | RR | Priority |
|---|---|---|---|---|---|
| Preemptive | No | No | Yes | Yes | Either |
| Picks | Earliest arrival | Shortest burst | Shortest remaining | Queue head, for one quantum | Highest priority |
| Strength | Simple | Low avg WT | Lowest avg WT | Best response, fair | Importance |
| Weakness | Convoy effect | Needs burst estimate | Many switches | Overhead, higher avg WT | Starvation |
| Starvation | No | Yes | Yes | No | Yes (fix: aging) |

## Turnaround vs Waiting vs Response Time

| Metric | Formula | Measures |
|--------|---------|----------|
| Turnaround | CT − AT | Total stay in the system |
| Waiting | TAT − BT | Time in the ready queue |
| Response | First start − AT | Delay until the first run |

## Mutex vs Semaphore

| Mutex | Semaphore |
|-------|-----------|
| Locking | Signalling and counting |
| Owner must unlock | No owner — anyone can signal |
| One holder | Up to N (counting) |
| Reentrant variants, priority inheritance | Neither |
| Protect shared data | N resources; "wait for event" (initial 0) |

## Spinlock vs Mutex

| Spinlock | Mutex (blocking) |
|----------|------------------|
| Waiter busy-waits | Waiter sleeps |
| No context switch | Two context switches |
| Very short critical sections, multicore | Longer waits |

## Deadlock vs Starvation vs Livelock

| Deadlock | Starvation | Livelock |
|----------|------------|----------|
| Blocked, waiting in a cycle | Ready but always passed over | Active, but no progress |
| Never ends by itself | May end | May end by chance |
| Prevention, avoidance, detection | Aging, fairness | Random back-off |

## Deadlock Prevention vs Avoidance vs Detection

| Prevention | Avoidance | Detection and recovery |
|------------|-----------|------------------------|
| Break a necessary condition by design | Grant only safe requests | Let deadlocks happen, then fix |
| No advance knowledge | Needs Max per process | No advance knowledge |
| Lowest utilisation | Medium | Highest |
| Lock ordering | Banker's algorithm | Wait-for graph, abort a victim |

## Safe vs Unsafe vs Deadlocked State

| Safe | Unsafe | Deadlocked |
|------|--------|------------|
| A safe sequence exists | No safe sequence | Processes waiting in a cycle |
| Deadlock can always be avoided | Deadlock possible | Deadlock now |
| Avoidance stays here | Avoidance never enters | Subset of unsafe |

## Logical vs Physical Address

| Logical | Physical |
|---------|----------|
| Generated by the CPU | Produced by the MMU |
| Per process, starts at 0 | Actual RAM location |
| Also called virtual | Also called real |

## Internal vs External Fragmentation

| Internal | External |
|----------|----------|
| Wasted inside an allocated block | Wasted between allocated blocks |
| Fixed-size units (paging's last page) | Variable-size units (segmentation, contiguous) |
| Fix: smaller units | Fix: compaction, paging |

## Paging vs Segmentation

| Paging | Segmentation |
|--------|--------------|
| Fixed-size pages | Variable-size segments |
| Invisible to programmer | Logical units (code, data, stack) |
| Page table: page → frame | Segment table: base + limit |
| Internal fragmentation | External fragmentation |
| Simple allocation | Natural protection and sharing |

## Virtual Memory vs Physical Memory

| Virtual memory | Physical memory |
|----------------|-----------------|
| Address space a process sees | Installed RAM |
| Per process; can exceed RAM | Shared by all processes |
| Backed by RAM + disk | Only RAM |

## FIFO vs LRU vs Optimal

| FIFO | LRU | Optimal |
|------|-----|---------|
| Evict oldest loaded | Evict least recently used | Evict used farthest in future |
| Cheap | Approximated (clock) | Impossible — benchmark |
| Belady's anomaly | No anomaly | No anomaly |
| Usually most faults | Close to Optimal | Fewest faults |

## Page Fault vs TLB Miss vs Segmentation Fault

| Page fault | TLB miss | Segmentation fault |
|------------|----------|--------------------|
| Page not in RAM | Translation not cached | Invalid or forbidden address |
| Load from disk, restart | Read page table | Process killed (SIGSEGV) |
| Microseconds–milliseconds | Nanoseconds | — |

## Polling vs Interrupts vs DMA

| Polling | Interrupts | DMA |
|---------|-----------|-----|
| CPU loops on status | Device signals CPU | Controller copies data |
| CPU busy waiting | CPU free | CPU free |
| No interrupts | Per unit | Per block |

## Blocking vs Non-blocking vs Asynchronous I/O

| Blocking | Non-blocking | Asynchronous |
|----------|--------------|--------------|
| Returns when done | Returns now with what is ready | Returns now; notified when done |
| Process waits | Program re-checks (`epoll`) | Callback or completion event |
