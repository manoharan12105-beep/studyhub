# Segmentation

**Module:** Memory Management · **Interview priority:** Core

## Concept

**Segmentation** divides a process's memory into **variable-size, logical units** called **segments** that match how a programmer thinks about a program: code, global data, heap, stack, a library, an array.

A logical address is a pair **⟨segment number, offset⟩**. A per-process **segment table** gives, for each segment, its **base** (start address in physical memory) and **limit** (length).

## Why It Matters

Paging cuts memory into equal pieces that ignore the program's structure. Segmentation follows the structure, which makes **protection** and **sharing** natural: the code segment can be read-only and shared, the stack can grow on its own, and an out-of-range access is caught per segment. "Paging vs segmentation" is a very common interview comparison.

## How It Works

### Translation

```text
 logical address ⟨s, d⟩
      │
      ▼
 segment table[s] → (base, limit)        (s ≥ number of segments → trap)
      │
 d < limit ? ──no──▶ trap: segmentation fault
      │ yes
      ▼
 physical address = base + d
```

The hardware holds a **segment-table base register** (where the table is) and a **segment-table length register** (how many segments).

### Protection and sharing

Each segment-table entry has protection bits (read/write/execute) that fit the segment's meaning: code read + execute, data read + write. To share a library, two processes' segment tables point to the **same base** — one copy in memory.

### Fragmentation

Segments have different sizes, so physical memory fills with variable-size holes — **external fragmentation**, solved by compaction or by combining segmentation with paging. There is no internal fragmentation, because each segment gets exactly its size.

### Segmentation with paging

To get both the logical structure and fragmentation-free allocation, each **segment is itself paged**: the segment table points to a page table for that segment. Historic Intel x86 (IA-32) used segmentation followed by paging. On x86-64, segmentation is essentially disabled in 64-bit mode (flat address space), and memory protection is done by paging; the word "segmentation fault" survives from the segmented era.

## Example

| Segment | Use | Base | Limit |
|---------|-----|------|-------|
| 0 | Code | 2000 | 600 |
| 1 | Data | 5000 | 300 |
| 2 | Stack | 3500 | 800 |
| 3 | Heap | 8000 | 1200 |

| Logical ⟨s, d⟩ | Check d < limit | Physical address |
|----------------|-----------------|------------------|
| ⟨2, 450⟩ | 450 < 800 ✓ | 3500 + 450 = **3950** |
| ⟨0, 0⟩ | 0 < 600 ✓ | **2000** |
| ⟨3, 1199⟩ | 1199 < 1200 ✓ | 8000 + 1199 = **9199** |
| ⟨1, 320⟩ | 320 ≥ 300 ✗ | **Trap** — offset beyond the data segment |

## Comparison

| Aspect | Paging | Segmentation |
|--------|--------|--------------|
| Unit | Fixed-size page | Variable-size segment |
| Division based on | Hardware (equal blocks) | Program's logical structure |
| Visible to programmer | No (transparent) | Yes (code, data, stack…) |
| Logical address | Page number + offset (one number, split by bits) | ⟨segment number, offset⟩ |
| Table entry | Frame number | Base + limit |
| Fragmentation | Internal (last page) | External |
| Protection and sharing | Per page | Per logical unit — more natural |
| Allocation | Any free frame | Needs a hole large enough |
| Used today | Universally | Mostly combined with or replaced by paging |

## Important Points

- Segment = variable-size logical unit; address = ⟨segment, offset⟩.
- Segment table entry: base and limit; check offset < limit, then physical = base + offset.
- Natural protection and sharing per logical unit.
- External fragmentation (no internal); fix with compaction or segmentation with paging.
- Modern x86-64 relies on paging; segmentation is largely vestigial.

## Common Confusion

> [!WARNING]
> **Comparing the offset with the base.** The check is **offset < limit**. The base is only added afterwards.

- **"Segmentation has internal fragmentation."** No — segments are allocated at their exact size. The fragmentation is external.
- **Segmentation fault** today usually means a paging-protection violation (an unmapped or protected page), not a segment-limit check.

## Interview Perspective

- *"Paging vs segmentation?"* — the comparison table; fixed vs variable, internal vs external fragmentation.
- *"Translate ⟨s, d⟩ with this segment table."* — check the limit first.
- *"What is segmentation with paging, and why?"* — structure plus no external fragmentation.

## Quick Revision

- Address ⟨s, d⟩; table gives base and limit.
- d < limit → base + d; else trap.
- Variable sizes → external fragmentation; no internal.
- Paging: fixed, invisible, internal fragmentation. Segmentation: logical, visible, external.
