# Page Fault

**Module:** Memory Management · **Interview priority:** Core

## Concept

A **page fault** is the trap (exception) the MMU raises when a process accesses a page that is **not currently in physical memory** — its page-table entry is marked invalid. The OS handles it by bringing the page in from disk and restarting the instruction, so the program never notices except for the delay.

A page fault is **not an error** by itself; it is how demand paging works. It becomes an error only if the address does not belong to the process at all.

## Why It Matters

Page faults decide the real speed of [virtual memory](../virtual-memory/content.md): a memory access takes about 100 ns, a page fault served from disk takes milliseconds. The steps of fault handling and the **effective access time** calculation are standard interview questions, and fault counts are what [page-replacement algorithms](../page-replacement-algorithms/content.md) try to minimise.

## How It Works

### Steps to handle a page fault

```text
 1. Process accesses a page; the MMU finds the valid–invalid bit = invalid → trap to the OS
 2. OS checks the address:
        not part of the process  → illegal access: terminate (SIGSEGV)
        valid but not in memory  → continue
 3. Find a free frame (if none: run page replacement, writing the victim to disk if dirty)
 4. Schedule a disk read of the page into the frame
        (the process is BLOCKED; the CPU runs other processes meanwhile)
 5. Disk interrupt: read complete → update the page table (frame number, valid = 1)
 6. Process moves to READY; when dispatched, the faulting instruction is RESTARTED
```

The hardware must be able to **restart** the faulting instruction exactly as if it had never started — a requirement for any CPU that supports demand paging.

### Kinds of page faults

- **Major (hard) fault** — the page must be read from disk. Expensive (milliseconds on a hard disk).
- **Minor (soft) fault** — the page is already in memory (for example in the page cache, or shared with another process) and only the page table needs updating. Cheap.
- **Invalid access** — the address is not mapped at all → the process is killed with a segmentation fault.

### Effective access time with page faults

With memory access time *ma*, page-fault service time *s* and page-fault rate *p* (0 ≤ p ≤ 1):

```text
 EAT = (1 − p) × ma + p × s
```

Example: ma = 100 ns, s = 8 ms = 8,000,000 ns.

- p = 1/1000 → EAT = 0.999 × 100 + 0.001 × 8,000,000 = 99.9 + 8,000 = **8,099.9 ns ≈ 8.1 µs** — about **81 times slower** than RAM.
- To keep the slowdown under 10 % (EAT < 110 ns): 100 + p × 7,999,900 < 110 → p < 1.25 × 10⁻⁶ — fewer than **one fault in about 800,000 accesses**.

The page-fault rate must be extremely low for virtual memory to be fast.

## Example

A process loops through a 16 KB array with 4 KB pages, and none of the array's pages are in memory (pure demand paging):

- The first access to each page faults: **4 page faults** (one per page).
- All other accesses to the same pages hit memory.
- A second pass over the array causes **0** faults if the 4 frames are still allocated to it.

Locality makes the fault count proportional to the number of *distinct pages*, not the number of *accesses*.

## Important Points

- Page fault = access to a valid page that is not in RAM → trap → OS loads it → instruction restarts.
- The faulting process blocks during the disk read; other processes run.
- If no frame is free, page replacement picks a victim (written back first if dirty).
- Major fault (disk) vs minor fault (already in memory) vs invalid access (killed).
- EAT = (1 − p) × ma + p × fault time; p must be tiny.

## Common Confusion

> [!WARNING]
> **"A page fault is an error that crashes the program."** A page fault on a valid address is normal and handled transparently. A crash happens only when the address is invalid (not mapped) or the access violates protection.

- **Page fault vs TLB miss:** a TLB miss means the translation is not cached — the page table is read, but the page is in memory. A page fault means the page itself is not in memory.
- **Page fault vs segmentation fault:** a segmentation fault is the invalid-access case.

## Interview Perspective

- *"What is a page fault? What happens when one occurs?"* — the six steps; mention blocking and restart.
- *"Page fault vs TLB miss?"* — translation not cached vs page not resident.
- *"Compute the EAT for fault rate p."* — and the maximum p for a given slowdown.
- Follow-up: [page replacement](../page-replacement-algorithms/content.md) when memory is full.

## Quick Revision

- Invalid bit → trap → check → free frame (or replace) → disk read (process blocks) → update table → restart.
- Major (disk) vs minor (in memory) vs invalid (SIGSEGV).
- EAT = (1 − p)·ma + p·s; 100 ns vs 8 ms → p must be ~10⁻⁶.
- Faults ≈ number of distinct pages touched (locality).
