# Block 5: Final Interview Revision

Block 5 of 5, about ten minutes: the most asked questions with the answer you should be able to say in one breath.

## 1. Top Definitions (3 min)

| Question | One-breath answer |
|----------|-------------------|
| What is an OS? | Software that manages hardware resources and gives programs services and abstractions. |
| Process vs thread? | Process: own memory, isolated, heavy. Thread: shares its process's memory, own stack and registers, light. |
| What is a context switch? | Saving one process's CPU state to its PCB and loading another's; pure overhead. |
| User vs kernel mode? | Restricted vs privileged CPU mode; enter the kernel only by system call, interrupt or exception. |
| What is a system call? | A controlled request from a program to the kernel through a trap. |
| What is a race condition? | A result that depends on the timing of unsynchronised access to shared data. |
| Mutex vs semaphore? | Mutex is a lock with an owner; semaphore is a counter anyone can signal. |
| What is a deadlock? | Processes each waiting for a resource another holds, in a cycle. |
| What is virtual memory? | Per-process address space larger than RAM, with only the needed pages resident. |
| What is a page fault? | Access to a page not in RAM; the OS loads it and restarts the instruction. |
| What is thrashing? | More time paging than executing because working sets exceed RAM. |

## 2. Lists to Recite (2 min)

- Process states: new, ready, running, waiting, terminated.
- Scheduling criteria: utilisation, throughput, turnaround, waiting, response.
- Critical-section requirements: mutual exclusion, progress, bounded waiting.
- Deadlock conditions: mutual exclusion, hold and wait, no preemption, circular wait.
- Deadlock handling: prevention, avoidance, detection and recovery, ignore.
- Page replacement: FIFO, LRU, Optimal (+ clock in practice).

## 3. Follow-ups They Love (3 min)

- *Why is a thread switch cheaper?* Same address space: no page-table switch, warm TLB and caches.
- *Can Waiting go straight to Running?* No — to Ready first.
- *Which algorithms starve?* SJF, SRTF, priority. Fix: aging.
- *Why is SJF not used directly?* Burst lengths unknown — predicted by exponential averaging.
- *Binary semaphore = mutex?* No: ownership, reentrancy, priority inheritance.
- *Unsafe = deadlock?* No — deadlock is possible, not certain.
- *Belady's anomaly?* FIFO: more frames, more faults (9 → 10 on 1 2 3 4 1 2 5 1 2 3 4 5).
- *Why does CPU use drop in thrashing?* Processes are blocked on paging I/O.

## 4. Last-Minute Numbers (2 min)

```text
RR max wait = (n − 1) × q              Overhead = s ÷ (q + s)
EAT (TLB) = h(t + m) + (1 − h)(t + 2m)  EAT (faults) = (1 − p)·ma + p·s
PA = frame × page size + offset         Need = Max − Allocation
n forks → 2ⁿ processes                  Semaphore = initial − waits + signals
```
