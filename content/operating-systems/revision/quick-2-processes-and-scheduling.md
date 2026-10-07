# Block 2: Processes and Scheduling

Block 2 of 5, about ten minutes.

## 1. Process, States, PCB (3 min)

- Program = passive file. Process = program in execution: text, data, heap ↑, stack ↓ + PC, registers, files.
- States: **New → Ready → Running → Terminated**; Running → Ready (preempted); Running → Waiting (I/O); Waiting → Ready (I/O done). No Waiting → Running.
- PCB: PID, state, PC, registers, priority, page-table pointer, open files, accounting (Linux `task_struct`).
- Zombie = exited, not reaped. Orphan = parent gone → PID 1 adopts.

## 2. Context Switch and Threads (2 min)

- Context switch: save context → old PCB; load new PCB; switch page table. Pure overhead + cold caches/TLB.
- Thread = PC + registers + stack; shares code, data, heap, files.
- Thread switch < process switch (same address space).
- User threads: cheap, kernel-blind (one blocks → all, in many-to-one). Kernel threads: independent, parallel. Linux/Windows/Java = one-to-one.

## 3. Scheduling Rules (3 min)

```text
FCFS   arrival order                      non-preemptive   convoy effect
SJF    shortest burst                     non-preemptive   optimal avg WT (all at 0), starvation
SRTF   shortest remaining (strictly less) preemptive       best avg WT, starvation
RR     queue head for ≤ q, then tail      preemptive       best response, no starvation
Prio   highest priority                   either           starvation → aging
```

- TAT = CT − AT · WT = TAT − BT · RT = start − AT.
- RR: arrivals join **before** the preempted process. q huge → FCFS; q tiny → overhead.
- Priority inversion → priority inheritance.

## 4. Drill (2 min)

P1 (AT 0, BT 4), P2 (AT 1, BT 3), P3 (AT 2, BT 1), P4 (AT 3, BT 2). Find average WT under FCFS.

<details>
<summary>Answer</summary>

Gantt P1 0–4, P2 4–7, P3 7–8, P4 8–10. WT 0, 3, 5, 5 → **3.25**.

</details>

P1 (AT 0, BT 8), P2 (AT 1, BT 4), P3 (AT 2, BT 2), P4 (AT 3, BT 5). Average WT under SRTF?

<details>
<summary>Answer</summary>

P1 0–1, P2 1–2, P3 2–4, P2 4–7, P4 7–12, P1 12–19. WT 11, 2, 0, 4 → **4.25**.

</details>
