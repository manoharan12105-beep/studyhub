# OS Key Formulas and Algorithms

Every formula and step-by-step procedure used in OS calculation questions, with one checked mini-example each.

## CPU Scheduling Formulas

```text
TAT = CT − AT                       turnaround
WT  = TAT − BT                      waiting (ready-queue time)
RT  = first start − AT              response
Average = sum ÷ n
Throughput = processes completed ÷ total time
CPU utilisation = busy time ÷ total time × 100 %
Burst prediction: τ(n+1) = α·t(n) + (1 − α)·τ(n)
RR maximum wait for next turn = (n − 1) × q
Switch overhead fraction = s ÷ (q + s)
```

Mini-check (FCFS): P1 (0, 4), P2 (1, 3), P3 (2, 1), P4 (3, 2) → CT 4, 7, 8, 10 → avg TAT 5.75, avg WT 3.25.

## Gantt-Chart Procedure

1. Sort by arrival; start at the first arrival.
2. Apply the rule whenever the CPU is free (all algorithms) and at every arrival (SRTF, preemptive priority) or quantum expiry (RR).
3. No process ready → mark **idle** until the next arrival.
4. Ties: earlier arrival, then listed order; RR: arrivals join before the preempted process.
5. Check: sum of bursts + idle time = last completion time.

| Algorithm | Rule when choosing |
|-----------|--------------------|
| FCFS | Earliest arrival |
| SJF | Smallest burst among arrived (no preemption) |
| SRTF | Smallest remaining; preempt if newcomer strictly smaller |
| RR | Head of queue, run ≤ q, then to the tail |
| Priority | Highest priority (state the number convention) |

## Synchronization Facts

```text
Semaphore value after k waits and j signals (all completed) = initial − k + j
Blocking semaphore: value −n  →  n processes waiting
Producer–consumer: empty = N, full = 0, mutex = 1
   producer: wait(empty) → wait(mutex) → add → signal(mutex) → signal(full)
   consumer: wait(full)  → wait(mutex) → remove → signal(mutex) → signal(empty)
Peterson (process i, other j): flag[i] = true; turn = j; while (flag[j] && turn == j) wait;
n sequential fork() calls → 2ⁿ processes
```

## Banker's Algorithm

```text
Need = Max − Allocation
Available = Total − Σ Allocation
Safety:  Work = Available
         repeat: find unfinished i with Need[i] ≤ Work → Work += Allocation[i]
         all finished → SAFE (the order found is a safe sequence)
Request by Pi:
         1. Request ≤ Need[i]?      no → error
         2. Request ≤ Available?    no → wait
         3. Pretend: Available −= R, Allocation[i] += R, Need[i] −= R
         4. Safe → grant;  unsafe → roll back, wait
Check:   final Work = total resources
Detection: same loop with the current Request matrix instead of Need
```

Mini-check: one resource, 10 units; Max 7, 4, 6; Allocated 3, 2, 2 → Available 3, Need 4, 2, 4 → safe ⟨P1, P2, P0⟩.

## Memory Formulas

```text
Base/limit:  L < limit  →  physical = base + L
Paging:      p = LA ÷ page size,  d = LA mod page size
             PA = frame × page size + d
Bits:        offset bits = log2(page size)
             page-number bits = logical bits − offset bits
             frame-number bits = physical bits − offset bits
Page-table size = number of pages × entry size
             (32-bit LA, 4 KB pages, 4-byte entries → 2²⁰ × 4 B = 4 MB)
Segmentation: d < limit[s]  →  PA = base[s] + d
TLB:         EAT = h(t + m) + (1 − h)(t + 2m)
Page faults: EAT = (1 − p)·ma + p·fault time
Internal fragmentation of a process = pages × page size − process size
Working set: pages referenced in the last Δ references;  D = Σ WSS > frames → thrashing
```

Mini-checks: page size 1024, LA 3000 → p 2, d 952; frame 7 → PA 8120. TLB 20 ns, memory 100 ns, h = 0.8 → 140 ns. ma 100 ns, fault 8 ms, p = 0.001 → ≈ 8.1 µs.

## Page-Replacement Procedure

1. Draw one column per reference and one row per frame.
2. Hit → mark H (LRU: update recency; FIFO: no change).
3. Fault with a free frame → load it. Fault with full frames → evict:
   - **FIFO** — loaded earliest.
   - **LRU** — used longest ago.
   - **Optimal** — next used farthest in the future (never again = farthest).
4. Count faults including the first loads.

Mini-check: `2 3 1 2 3 4 2 3 5 1 2 3`, 3 frames → FIFO 10, LRU 8, Optimal 6.
Belady: `1 2 3 4 1 2 5 1 2 3 4 5` → FIFO 9 faults (3 frames), 10 (4 frames).

## Disk Scheduling

```text
Total head movement = Σ |next − current|
FCFS: arrival order          SSTF: nearest pending request
SCAN: to the end, reverse    C-SCAN: to the end, jump to 0, same direction
LOOK / C-LOOK: like SCAN / C-SCAN but turn at the last request
(State whether the C-SCAN / C-LOOK return jump is counted.)
```

Mini-check: head 45, queue 20, 90, 150, 38, 172, 10, 120, 60 (0–199, moving up) → FCFS 733, SSTF 197, SCAN 343, LOOK 289.

## Storage and I/O Numbers

```text
Free-space bitmap size = number of blocks ÷ 8 bytes     (1 TB, 4 KB blocks → 32 MB)
Block of byte offset x = x ÷ block size
DMA interrupts = transfer size ÷ block size
```
