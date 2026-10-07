# Disk Scheduling

**Module:** Storage and I/O · **Interview priority:** Frequently asked

## Concept

On a hard disk drive (HDD), reading a block means moving the read–write head to the right **cylinder** (track). When several I/O requests are waiting, **disk scheduling** chooses the order in which to serve them so that the total **head movement** — and therefore the time — is small.

```text
 Access time = seek time + rotational latency + transfer time
                 ▲ largest, depends on the order of requests
```

## Why It Matters

Seek time is milliseconds — an eternity for a CPU. Serving requests in a smart order can cut total head movement several times over. Disk-scheduling calculations (FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK) are common in placement tests.

## How It Works

All examples: cylinders **0–199**, head at **45**, moving towards higher cylinders, request queue **20, 90, 150, 38, 172, 10, 120, 60**.

### FCFS

Serve requests in arrival order. Fair, no starvation, but the head swings wildly.

```text
 45 → 20 → 90 → 150 → 38 → 172 → 10 → 120 → 60      total = 733 cylinders
```

### SSTF (Shortest Seek Time First)

Always serve the pending request closest to the current head position. Much less movement, but requests far from the head can **starve** if new nearby requests keep arriving.

```text
 45 → 38 → 20 → 10 → 60 → 90 → 120 → 150 → 172       total = 197
```

### SCAN (elevator)

Move in one direction serving requests, go all the way to the **end of the disk**, then reverse.

```text
 45 → 60 → 90 → 120 → 150 → 172 → 199 → 38 → 20 → 10  total = 343
```

### C-SCAN (circular SCAN)

Serve requests in one direction only; at the end, jump back to cylinder 0 and continue in the same direction. Gives more **uniform waiting time** (requests just behind the head do not wait for a full round trip twice).

```text
 45 → 60 → 90 → 120 → 150 → 172 → 199 → 0 → 10 → 20 → 38  total = 391
```

### LOOK and C-LOOK

Like SCAN and C-SCAN, but the head goes only as far as the **last request** in each direction, not the end of the disk.

```text
 LOOK:   45 → 60 → 90 → 120 → 150 → 172 → 38 → 20 → 10     total = 289
 C-LOOK: 45 → 60 → 90 → 120 → 150 → 172 → 10 → 20 → 38     total = 317
```

> [!NOTE]
> **Counting convention:** StudyHub counts the return sweep of C-SCAN (199 → 0) and C-LOOK (172 → 10) as head movement. Some textbooks exclude it; then subtract that jump (199 for C-SCAN, 162 for C-LOOK). Say which convention you use.

### How to calculate total head movement

Sum the absolute differences between consecutive positions. SSTF: |45−38| + |38−20| + |20−10| + |10−60| + |60−90| + |90−120| + |120−150| + |150−172| = 7 + 18 + 10 + 50 + 30 + 30 + 30 + 22 = **197**.

### SSDs

Solid-state drives have no moving head, so seek-based scheduling does not apply; Linux typically uses a simple scheduler (`none` or `mq-deadline`) for them, focusing on merging requests and fairness rather than head position.

## Example

| Algorithm | Order served | Total movement |
|-----------|--------------|----------------|
| FCFS | 20, 90, 150, 38, 172, 10, 120, 60 | 733 |
| SSTF | 38, 20, 10, 60, 90, 120, 150, 172 | **197** |
| SCAN | 60, 90, 120, 150, 172, (199), 38, 20, 10 | 343 |
| C-SCAN | 60, 90, 120, 150, 172, (199, 0), 10, 20, 38 | 391 |
| LOOK | 60, 90, 120, 150, 172, 38, 20, 10 | 289 |
| C-LOOK | 60, 90, 120, 150, 172, 10, 20, 38 | 317 |

SSTF wins on this queue because the head starts near the low cluster; SCAN-family algorithms trade some movement for **fairness** and no starvation.

## Comparison

| Algorithm | Idea | Starvation | Notes |
|-----------|------|------------|-------|
| FCFS | Arrival order | No | Simple, fair, slow |
| SSTF | Nearest request | **Yes** | Like SJF for disks; low movement |
| SCAN | Sweep to the end, reverse | No | Elevator; middle cylinders favoured |
| C-SCAN | Sweep one way, jump back | No | Uniform waiting time |
| LOOK | SCAN, turn at last request | No | Less movement than SCAN |
| C-LOOK | C-SCAN, jump at last request | No | Common practical choice |

## Important Points

- Goal: minimise total seek (head movement) while staying fair.
- FCFS fair but slow; SSTF fast but can starve; SCAN/C-SCAN sweep; LOOK/C-LOOK stop at the last request.
- Total head movement = sum of |next − current| along the service order.
- State whether the return jump of C-SCAN/C-LOOK is counted.
- Only meaningful for HDDs; SSDs have no seek.

## Common Confusion

> [!WARNING]
> **SCAN vs LOOK.** SCAN goes to the physical end of the disk (cylinder 199) before turning, even if no request is there; LOOK turns at the last pending request.

- **Direction matters.** "Head at 45 moving towards 0" gives a completely different SCAN order. Read the question.
- **SSTF is not optimal** in general; it is greedy, like SJF.

## Interview Perspective

- *"Calculate total head movement for FCFS, SSTF, SCAN, C-SCAN, LOOK."* — write each order and sum the differences.
- *"Which disk algorithm can cause starvation?"* — SSTF.
- *"Why is C-SCAN fairer than SCAN?"* — uniform wait: no request waits for two sweeps.
- *"Does disk scheduling matter for SSDs?"* — not seek-based.

## Quick Revision

- FCFS: order of arrival. SSTF: nearest first (starvation).
- SCAN: to the end and back. C-SCAN: one way, jump back.
- LOOK/C-LOOK: turn at the last request.
- Total = Σ |differences|; count or exclude the return jump — say which.
