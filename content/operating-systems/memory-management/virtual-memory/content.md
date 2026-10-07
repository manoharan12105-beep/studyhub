# Virtual Memory

**Module:** Memory Management · **Interview priority:** Core

## Concept

**Virtual memory** separates the memory a process **sees** (its virtual address space) from the physical memory that actually **exists**. A process can use an address space larger than RAM, because only the parts it is **currently using** need to be in RAM; the rest stays on disk (swap space or the program file) until needed.

It is built on [paging](../paging/content.md): every page of the virtual address space is either in a frame in RAM or on disk, and the page table records which.

## Why It Matters

Virtual memory is why you can run more programs than fit in RAM, why each process gets a clean, private address space starting at 0, why starting a large program is fast, and why `fork()` is cheap. Its costs — page faults, page replacement and thrashing — make up the rest of this module.

## How It Works

### Demand paging

Pages are loaded **only when first accessed**, not when the program starts:

- Each page-table entry has a **valid–invalid bit**. Valid = the page is in memory. Invalid = the page is on disk (or not part of the process at all).
- Accessing an invalid page raises a **[page fault](../page-faults/content.md)**; the OS loads the page and restarts the instruction.
- **Pure demand paging** starts a process with **no** pages in memory.

It works because of **locality of reference**: during any short period, a program uses only a small set of pages (the loop it is in, the data it is processing).

### Benefits

| Benefit | How |
|---------|-----|
| Programs larger than RAM | Only the working set needs to be resident |
| More processes in memory | Each uses fewer frames → higher degree of multiprogramming, better CPU utilisation |
| Faster start-up, less I/O | Never-used code (error handlers, rare features) is never loaded |
| Isolation | Each process has a private virtual address space |
| Efficient sharing | Shared libraries map the same frames into many processes |
| Cheap process creation | **Copy-on-write**: after `fork()`, parent and child share pages until one writes; only then is that page copied |

### Where the pages live

```text
 Virtual address space of a process        Physical memory (RAM)      Disk
 ┌────────────┐
 │ page 0  ───┼────────────────────────▶  frame 6
 │ page 1  ───┼───────────── (invalid) ──────────────────────────▶  swap / file
 │ page 2  ───┼────────────────────────▶  frame 2
 │ page 3     │  never used → never loaded
 └────────────┘
```

### What it costs

A page fault means a disk (or SSD) access — milliseconds on a hard disk, tens of microseconds or more on an SSD, versus about 100 ns for RAM. Virtual memory therefore works well only while page faults are **rare**. When memory is overcommitted and faults become constant, the system [thrashes](../thrashing/content.md).

## Example

A 4 GB video editor runs on a laptop with 8 GB of RAM alongside a browser and an IDE (together asking for 14 GB of virtual memory):

1. The editor starts quickly: only its start-up code and the open project's pages are loaded.
2. The filters you never open are never loaded.
3. The browser's background tabs are idle; their pages are paged out to make room.
4. When you switch back to a tab, its pages fault back in — the short pause you notice.

All three programs believe they have their full address space; the OS keeps only the active parts in RAM.

## Comparison

| Aspect | Virtual memory | Physical memory |
|--------|----------------|-----------------|
| What it is | Address space a process sees | Actual RAM chips |
| Size | Set by address width (2⁴⁸ bytes per process on typical x86-64) | Installed RAM (for example 16 GB) |
| Per process? | Yes — each process has its own | Shared by all processes |
| Backed by | RAM + disk (swap, files) | Only RAM |
| Addresses | Virtual (logical) addresses | Physical addresses |
| Managed by | OS (page tables) + MMU | Hardware, allocated in frames by the OS |

## Important Points

- Virtual memory lets a process's address space exceed RAM; only needed pages are resident.
- Implemented with demand paging; the valid–invalid bit marks resident pages.
- Relies on locality of reference.
- Benefits: bigger programs, more multiprogramming, less I/O, isolation, sharing, copy-on-write.
- Cost: page faults are thousands of times slower than memory accesses; too many → thrashing.

## Common Confusion

> [!WARNING]
> **"Virtual memory means swap space."** Swap is just one backing store. Virtual memory is the whole mechanism of virtual addresses, page tables and demand paging; code pages, for example, are loaded from the program file, not swap.

- **"Virtual memory makes memory faster."** It makes memory *bigger and safer*; every page fault is slow.
- **"Each process can use unlimited memory."** It is limited by the address size and by RAM + swap the OS is willing to commit.

## Interview Perspective

- *"What is virtual memory and why is it needed?"* — larger address space than RAM, isolation, efficiency.
- *"What is demand paging?"* — load pages on first access; valid–invalid bit; page fault.
- *"What is copy-on-write?"* — sharing after `fork` until a write.
- *"Virtual vs physical memory?"* — the comparison table.

## Quick Revision

- Virtual address space > RAM; only active pages in RAM.
- Demand paging + valid–invalid bit + page faults.
- Works because of locality.
- Benefits: bigger programs, more processes, isolation, sharing, copy-on-write.
- Cost: slow page faults; too many → thrashing.
