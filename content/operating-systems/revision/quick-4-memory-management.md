# Block 4: Memory Management

Block 4 of 5, about ten minutes.

## 1. Addresses and Fragmentation (2 min)

- Logical (CPU) → **MMU** → physical (RAM). Base/limit: L < limit → base + L, else trap.
- First fit (fast) · best fit (smallest leftover) · worst fit (largest leftover, usually worst).
- **Internal** = waste inside a block (paging). **External** = waste between blocks (segmentation, contiguous) → compaction or paging.

## 2. Paging and Segmentation (3 min)

```text
Paging:  p = LA ÷ size, d = LA mod size, PA = frame × size + d
TLB:     EAT = h(t + m) + (1 − h)(t + 2m)
32-bit, 4 KB pages → 20-bit page number, 12-bit offset, 2²⁰ entries (4 MB at 4 B each)
Segmentation: ⟨s, d⟩, d < limit → base + d
```

- Paging: fixed, invisible, internal fragmentation. Segmentation: logical units, external fragmentation.

## 3. Virtual Memory and Page Faults (2 min)

- Virtual address space can exceed RAM; **demand paging** + valid–invalid bit; locality makes it work; copy-on-write makes `fork` cheap.
- Page fault: trap → check → free frame (or replace) → disk read (process blocks) → update table → restart.
- EAT = (1 − p)·ma + p·fault time. 100 ns vs 8 ms → p must be about 10⁻⁶.

## 4. Replacement and Thrashing (3 min)

- FIFO: oldest load (Belady's anomaly). LRU: oldest use (clock approximates). Optimal: farthest future use (benchmark).
- Count first loads as faults. LRU/OPT are stack algorithms — no anomaly.
- Thrashing: Σ working sets > RAM → faults everywhere, **CPU idle**. Fix: fewer processes, working set (Δ window), page-fault frequency, local replacement, more RAM.

**Drill:** `2 3 1 2 3 4 2 3 5 1 2 3`, 3 frames — faults under FIFO, LRU and Optimal?

<details>
<summary>Answer</summary>

FIFO **10**, LRU **8**, Optimal **6**.

</details>
