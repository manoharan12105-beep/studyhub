# Thrashing

**Module:** Memory Management · **Interview priority:** Core

## Concept

**Thrashing** is a state in which the system spends most of its time **paging** — moving pages between memory and disk — instead of executing processes. Processes do not have enough frames for the pages they are actively using, so almost every access causes a [page fault](../page-faults/content.md), and the page brought in evicts another page that is needed moments later.

## Why It Matters

Thrashing turns a working computer into one where the disk light is always on, the mouse barely moves, and CPU utilisation is near zero. It is the failure mode of [virtual memory](../virtual-memory/content.md), and interviewers ask for its cause, its tell-tale signs and the working-set fix.

## How It Works

### The vicious circle

```text
 too many processes for the RAM
        │
        ▼
 each process has fewer frames than its working set
        │
        ▼
 page faults soar → processes wait for the disk → CPU utilisation drops
        │
        ▼
 (old-style) scheduler sees low CPU use → admits MORE processes ─┐
        ▲                                                         │
        └─────────────────────────────────────────────────────────┘
```

### CPU utilisation vs degree of multiprogramming

```text
 CPU
 utilisation
   ▲            ●●●●
   │         ●●     ●
   │       ●          ●
   │     ●              ●
   │   ●                  ●●  ← thrashing
   │ ●                       ●●●
   └──────────────────────────────▶ degree of multiprogramming
```

At first, more processes keep the CPU busier. Past a point, their combined working sets exceed RAM, faults dominate, and utilisation falls sharply.

### Locality and the working set

A process at any moment uses a **locality** — a set of pages used together (a function and its data). Thrashing occurs when the frames allocated are fewer than the size of the current locality.

The **working-set model** approximates the locality with a window of the last **Δ** references:

- **Working set** WS(t, Δ) = the set of distinct pages referenced in the last Δ references.
- **WSS** = its size. Total demand **D = Σ WSSᵢ** over all processes.
- If **D > m** (available frames), thrashing will occur → **suspend** (swap out) a process and give its frames to the others. If D is well below m, another process can be admitted.

Choosing Δ: too small misses the whole locality; too large covers several localities.

### Page-fault frequency (PFF)

A more direct control: measure each process's **page-fault rate**.

- Above an **upper bound** → the process needs more frames → give it one (if none are free, suspend some process).
- Below a **lower bound** → it has more than it needs → take a frame away.

### Ways to prevent or cure thrashing

1. Reduce the **degree of multiprogramming** — suspend or kill processes.
2. Allocate frames according to **working-set size** or **PFF**.
3. Use **local replacement** (a process replaces only its own pages) so one thrashing process cannot steal frames from others.
4. Add **RAM**, or reduce programs' memory footprints and improve locality.

## Example

Reference string of one process, positions 1–10: `1 2 1 3 4 4 3 2 5 5`, window **Δ = 4**.

| Time t | Last 4 references | Working set | WSS |
|--------|-------------------|-------------|-----|
| 4 | 1 2 1 3 | {1, 2, 3} | 3 |
| 6 | 1 3 4 4 | {1, 3, 4} | 3 |
| 8 | 4 4 3 2 | {2, 3, 4} | 3 |
| 10 | 3 2 5 5 | {2, 3, 5} | 3 |

The process needs about **3 frames**. Four such processes need D ≈ 12 frames. With m = 10 frames, D > m → the OS should suspend one process rather than let all four thrash; the remaining three need 9 ≤ 10.

A desktop example: a laptop with 8 GB RAM runs a 6 GB virtual machine, a browser with 40 tabs and an IDE. Their working sets total about 11 GB. The system becomes unresponsive, the disk (or SSD) is busy, and CPU usage shows mostly **I/O wait**. Closing the VM brings the working sets under 8 GB and the system recovers instantly.

## Important Points

- Thrashing = more time paging than executing; caused by too few frames for the active working sets.
- Signs: very high page-fault rate, heavy disk/swap I/O, low CPU utilisation, unresponsive system.
- Working-set model: WS = pages used in the last Δ references; if Σ WSS > frames, suspend a process.
- PFF: keep each process's fault rate between an upper and a lower bound.
- Fix: lower multiprogramming, working-set/PFF allocation, local replacement, more RAM.

## Common Confusion

> [!WARNING]
> **"Thrashing means the CPU is overloaded."** The opposite: the CPU is mostly **idle**, waiting for the disk. Adding more processes makes it worse, not better.

- **Thrashing vs Belady's anomaly:** Belady's anomaly is about one algorithm (FIFO) getting more faults with more frames; thrashing is about the whole system having too few frames.
- **Swap usage alone is not thrashing.** Idle pages sitting in swap are fine; constant paging **in and out** is the problem.

## Interview Perspective

- *"What is thrashing? What causes it?"* — too little memory for the working sets; vicious circle with multiprogramming.
- *"How do you detect and prevent it?"* — fault rate, CPU vs I/O; working set, PFF, suspend processes.
- *"Explain the working-set model."* — window Δ, WSS, D > m.
- *"Why does CPU utilisation drop during thrashing?"* — processes are blocked on page I/O.

## Quick Revision

- Thrashing: paging > executing; faults everywhere; CPU idle.
- Cause: Σ working sets > RAM (too much multiprogramming).
- Working set = pages in the last Δ references; D = Σ WSS > m → suspend.
- PFF: fault rate too high → more frames; too low → fewer.
- Cure: fewer processes, local replacement, more RAM.
