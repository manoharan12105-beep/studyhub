# OS Emergency 15-Minute Revision

Only the highest-value Operating Systems facts. Read once, top to bottom, right before the interview.

## Process

```text
Program   passive file on disk
Process   program in execution: code, data, heap, stack + PC, registers, files
States    New → Ready → Running → Terminated
          Running → Ready     (time slice over / higher priority)
          Running → Waiting   (I/O, lock, sleep)
          Waiting → Ready     (event done)      never Waiting → Running
PCB       PID, state, PC, registers, priority, page table, open files
```

## Thread

```text
Thread    own PC, registers, stack · shares code, data, heap, files
Process   isolated, heavy, IPC        Thread   shared memory, light, needs locks
One thread segfaults → whole process dies
```

## Context Switch

```text
Save old context → its PCB · pick next · switch page table · load new context
Overhead: no useful work + cold caches/TLB
Thread switch (same process) < process switch
Mode switch (user ↔ kernel) ≠ context switch
```

## Scheduling

```text
FCFS  arrival order, non-preemptive, convoy effect
SJF   shortest burst, non-preemptive, optimal avg WT, starvation
SRTF  shortest remaining, preemptive (strictly shorter)
RR    quantum q, preemptive, best response, no starvation; q huge → FCFS
Prio  highest first; starvation → AGING; inversion → PRIORITY INHERITANCE

TAT = CT − AT     WT = TAT − BT     RT = first start − AT
```

## Synchronization

```text
Race condition   shared data + concurrent access + a write + no sync (count++)
Critical section mutual exclusion · progress · bounded waiting
Mutex            lock with OWNER; one at a time; unlock in finally
Semaphore        counter; wait(P) / signal(V); NO owner; N resources or signalling
Binary semaphore ≠ mutex
```

## Deadlock

```text
4 conditions   mutual exclusion · hold and wait · no preemption · circular wait
Prevention     break one (global lock order)
Avoidance      Banker's: grant only if safe; Need = Max − Allocation
Safety         find Need ≤ Work → Work += Allocation → repeat
Unsafe ≠ deadlock · RAG cycle = deadlock only with single instances
Detection      wait-for graph cycle; recovery = kill or preempt + rollback
```

## Paging

```text
Pages (logical) and frames (physical), same size
p = LA ÷ size   d = LA mod size   PA = frame × size + d
No external fragmentation; small internal fragmentation
TLB caches translations: EAT = h(t + m) + (1 − h)(t + 2m)
Paging (fixed, invisible) vs segmentation (logical, external fragmentation)
```

## Virtual Memory and Page Fault

```text
Virtual memory   address space > RAM; only needed pages resident (demand paging)
Page fault       page not in RAM → trap → load from disk → update table → restart
                 not an error (invalid address = segmentation fault)
EAT              (1 − p) × memory time + p × fault time  → p must be tiny
```

## Page Replacement and LRU

```text
FIFO     evict oldest loaded           Belady's anomaly (more frames → more faults)
LRU      evict least recently used     no anomaly; approximated by clock/second chance
Optimal  evict used farthest in future  fewest faults; impossible → benchmark
Count first loads as faults.
```

## Thrashing

```text
Cause     Σ working sets > RAM (too many processes)
Signs     faults everywhere, disk busy, CPU IDLE
Fix       suspend processes, working-set model, page-fault frequency, more RAM
```

## Most Important Differences

| Pair | One-line difference |
|------|---------------------|
| Process vs thread | Own memory vs shared memory |
| Program vs process | Passive file vs running instance |
| User vs kernel mode | Restricted vs privileged |
| Preemptive vs non-preemptive | OS can vs cannot take the CPU away |
| Mutex vs semaphore | Owned lock vs unowned counter |
| Deadlock vs starvation | Circular wait vs always passed over |
| Prevention vs avoidance | Static rules vs run-time safety check |
| Paging vs segmentation | Fixed pages vs logical segments |
| Logical vs physical address | CPU's address vs RAM location |
| Internal vs external fragmentation | Inside a block vs between blocks |
| Page fault vs TLB miss | Page not in RAM vs translation not cached |
