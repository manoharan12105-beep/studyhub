# Paging

**Module:** Memory Management · **Interview priority:** Core

## Concept

**Paging** divides memory into fixed-size blocks so that a process's memory does **not** have to be contiguous:

- **Logical memory** is split into **pages**.
- **Physical memory** is split into **frames** of the **same size**.
- A per-process **page table** records which frame holds each page.

Any page can go into any free frame, so external fragmentation disappears. Page sizes are powers of two — typically **4 KB** (with larger "huge pages" such as 2 MB available on x86-64).

## Why It Matters

Paging is how every modern OS manages memory, and it is the foundation of [virtual memory](../virtual-memory/content.md). Address-translation calculations — page number, offset, frame, physical address, number of bits, page-table size, TLB effective access time — are standard interview and exam questions.

## How It Works

### Splitting an address

With page size 2ⁿ bytes and a logical address of m bits:

```text
 logical address (m bits)
 ┌──────────────────────────┬───────────────┐
 │ page number p (m − n)    │ offset d (n)  │
 └──────────────────────────┴───────────────┘
 p = logical ÷ page size  (integer division)   = logical >> n
 d = logical mod page size                      = logical & (page size − 1)
```

### Translation

```text
 1. split logical address → (p, d)
 2. look up page table[p] → frame f        (invalid entry → trap)
 3. physical address = f × page size + d
```

The **offset never changes** — a page and its frame have the same size, so the byte's position inside them is the same.

### The TLB (translation look-aside buffer)

The page table lives in memory, so a naive translation costs **two** memory accesses (page table, then the data). The **TLB** is a small, fast, associative cache of recent page → frame translations inside the MMU.

- **TLB hit:** frame found in the TLB → one memory access.
- **TLB miss:** read the page table from memory, then access the data, and store the translation in the TLB.

```text
 EAT = h × (TLB time + memory time) + (1 − h) × (TLB time + 2 × memory time)
```

Example: TLB 20 ns, memory 100 ns, hit ratio 80 %:
EAT = 0.8 × 120 + 0.2 × 220 = 96 + 44 = **140 ns**. At 98 %: 0.98 × 120 + 0.02 × 220 = **122 ns**. Locality keeps real hit ratios high.

### Page-table size

32-bit logical addresses, 4 KB (2¹²) pages: 20-bit page number → 2²⁰ = 1,048,576 entries. With 4-byte entries, the page table is **4 MB per process** — mostly for unused addresses. Solutions:

- **Multi-level (hierarchical) paging** — page the page table; only the parts in use are allocated (x86-64 uses four or five levels).
- **Hashed page tables** and **inverted page tables** (one entry per physical frame) — awareness level.

### Protection and sharing

Each page-table entry also has bits: **valid/invalid** (is the page part of the process / in memory?), **read/write/execute**, **dirty** (modified) and **referenced**. Shared libraries are shared by mapping the same frames into several processes' page tables.

## Example

Page size **1 KB = 1024 bytes**. Page table: page 0 → frame 5, page 1 → frame 2, page 2 → frame 7, page 3 → frame 1, page 4 → not in memory.

**Translate logical address 3000:**

- p = 3000 ÷ 1024 = **2**, d = 3000 − 2 × 1024 = **952**
- page 2 → **frame 7**
- physical = 7 × 1024 + 952 = 7168 + 952 = **8120**

```java
public class PagingTranslation {

    static final int PAGE_SIZE = 1024;                       // 2^10 bytes: 10-bit offset
    static final Integer[] PAGE_TABLE = {5, 2, 7, 1, null};  // page 4 is not in memory

    public static void main(String[] args) {
        int[] logicalAddresses = {3000, 1023, 4100, 5200};
        for (int logical : logicalAddresses) {
            int page = logical / PAGE_SIZE;                  // same as logical >> 10
            int offset = logical % PAGE_SIZE;                // same as logical & 1023
            String result;
            if (page >= PAGE_TABLE.length) {
                result = "invalid: outside the address space (trap)";
            } else if (PAGE_TABLE[page] == null) {
                result = "page fault: page not in memory";
            } else {
                int frame = PAGE_TABLE[page];
                result = "frame " + frame + " -> physical " + (frame * PAGE_SIZE + offset);
            }
            System.out.printf("logical %4d -> page %d, offset %4d -> %s%n", logical, page, offset, result);
        }
    }
}
```

**Output:**

```text
logical 3000 -> page 2, offset  952 -> frame 7 -> physical 8120
logical 1023 -> page 0, offset 1023 -> frame 5 -> physical 6143
logical 4100 -> page 4, offset    4 -> page fault: page not in memory
logical 5200 -> page 5, offset   80 -> invalid: outside the address space (trap)
```

**Bits:** 16-bit logical addresses with 1 KB pages → offset 10 bits, page number 6 bits → at most 2⁶ = **64 pages**.

## Important Points

- Page = logical block; frame = physical block; same size, a power of 2.
- p = address ÷ page size, d = address mod page size; physical = frame × page size + d.
- No external fragmentation; internal fragmentation only in each process's last page (on average half a page).
- Page table per process; TLB caches translations; EAT formula with hit ratio.
- Large page tables → multi-level paging.
- Larger pages: smaller page tables and fewer TLB misses, but more internal fragmentation.

## Common Confusion

> [!WARNING]
> **Adding the offset to the page number instead of the frame number.** Physical = **frame** × page size + offset. The page number only selects the page-table entry.

- **"Paging has no fragmentation."** It has no *external* fragmentation; the last page of a process is usually partly empty (internal).
- **Number of pages vs number of frames:** pages depend on the logical address space; frames on physical memory size. They are usually different.

## Interview Perspective

- *"What is paging? Why is it used?"* — non-contiguous allocation, no external fragmentation.
- *"Translate this logical address."* — show p, d, frame, physical.
- *"What is a TLB? Calculate the effective access time."*
- *"How large is the page table for 32-bit addresses and 4 KB pages?"* — 2²⁰ entries, 4 MB with 4-byte entries; multi-level paging.

## Quick Revision

- Pages (logical) ↔ frames (physical), same size 2ⁿ.
- p = LA ÷ size, d = LA mod size, PA = frame × size + d.
- TLB: EAT = h(t + m) + (1 − h)(t + 2m).
- 32-bit, 4 KB → 20-bit page number, 12-bit offset, 2²⁰ entries.
- No external fragmentation; small internal fragmentation.
