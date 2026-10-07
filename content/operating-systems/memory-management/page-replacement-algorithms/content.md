# Page Replacement: FIFO, LRU and Optimal

**Module:** Memory Management · **Interview priority:** Core

## Concept

When a [page fault](../page-faults/content.md) occurs and **no frame is free**, the OS must choose a resident page to evict — the **victim** — to make room. A **page-replacement algorithm** makes that choice. The goal is the **fewest page faults**.

The three algorithms every interview expects:

- **FIFO** — evict the page that has been in memory **longest**.
- **LRU (Least Recently Used)** — evict the page **not used for the longest time**.
- **Optimal (OPT, MIN)** — evict the page that will **not be used for the longest time in the future**.

If the victim was modified (**dirty bit** set), it must be written to disk first; a clean page can simply be overwritten.

## Why It Matters

Every extra fault costs a disk access — thousands of times slower than memory. Counting faults for a reference string under FIFO, LRU and Optimal is the most common OS calculation question after CPU scheduling, and **Belady's anomaly** is its favourite trap.

## How It Works

### FIFO

Keep pages in a queue in load order; the oldest is the victim. Simple, but it may evict a heavily used page just because it was loaded early.

### Optimal

Look ahead in the reference string; evict the page whose **next use is farthest away** (or that is never used again). It gives the **minimum possible** number of faults for a given number of frames — but needs knowledge of the future, so it cannot be implemented. It serves as the **benchmark** for other algorithms.

### LRU

Use the past as a predictor of the future: evict the page **used longest ago**. It often comes close to Optimal because of locality.

Implementing exact LRU needs hardware help on every memory access:

- **Counters** — store a timestamp in each page-table entry on every access; evict the smallest.
- **Stack** — keep a doubly linked list of pages; move a page to the top on every access; evict from the bottom.

Both are too expensive for real hardware, so OSes use **approximations**: a **reference bit** set by hardware when a page is used, and the **second-chance (clock)** algorithm — FIFO order, but a page whose reference bit is 1 gets its bit cleared and a second chance instead of being evicted.

### Belady's anomaly

For FIFO, **adding frames can increase the number of page faults**. With the reference string `1 2 3 4 1 2 5 1 2 3 4 5`:

| Frames | FIFO | LRU | Optimal |
|--------|------|-----|---------|
| 3 | 9 | 10 | 7 |
| 4 | **10** | 8 | 6 |

FIFO gets worse with more memory. LRU and Optimal are **stack algorithms**: the set of pages in memory with n frames is always a subset of the set with n + 1 frames, so they **never** suffer from Belady's anomaly.

## Example

Reference string `2 3 1 2 3 4 2 3 5 1 2 3`, **3 frames**, initially empty. F = fault, H = hit; the evicted page is shown under each fault.

**FIFO — 10 faults**

```text
 Reference   2  3  1  2  3  4  2  3  5  1  2  3
 Frame 1     2  2  2  2  2  4  4  4  5  5  5  3
 Frame 2     -  3  3  3  3  3  2  2  2  1  1  1
 Frame 3     -  -  1  1  1  1  1  3  3  3  2  2
 Result      F  F  F  H  H  F  F  F  F  F  F  F
 Evicted                    2  3  1  4  2  3  5
```

**LRU — 8 faults**

```text
 Reference   2  3  1  2  3  4  2  3  5  1  2  3
 Frame 1     2  2  2  2  2  2  2  2  2  1  1  1
 Frame 2     -  3  3  3  3  3  3  3  3  3  2  2
 Frame 3     -  -  1  1  1  4  4  4  5  5  5  3
 Result      F  F  F  H  H  F  H  H  F  F  F  F
 Evicted                    1        4  2  3  5
```

At reference 4, the last uses are 2 (time 4), 3 (time 5) and 1 (time 3) → evict **1**. FIFO instead evicted 2 — a hot page — and paid for it immediately.

**Optimal — 6 faults**

```text
 Reference   2  3  1  2  3  4  2  3  5  1  2  3
 Frame 1     2  2  2  2  2  2  2  2  2  2  2  2
 Frame 2     -  3  3  3  3  3  3  3  3  3  3  3
 Frame 3     -  -  1  1  1  4  4  4  5  1  1  1
 Result      F  F  F  H  H  F  H  H  F  F  H  H
 Evicted                    1        4  5
```

At reference 4, future uses are 2 (next at position 7), 3 (8), 1 (10) → evict **1**, used farthest away. At reference 5, page 4 is never used again → evict **4**.

| Algorithm | Faults | Hits | Fault rate |
|-----------|--------|------|------------|
| FIFO | 10 | 2 | 83 % |
| LRU | 8 | 4 | 67 % |
| Optimal | 6 | 6 | 50 % |

### Page replacement in Java

```java
import java.util.ArrayList;
import java.util.List;

public class PageReplacement {

    static final int[] REFS = {2, 3, 1, 2, 3, 4, 2, 3, 5, 1, 2, 3};
    static final int FRAMES = 3;

    public static void main(String[] args) {
        for (String policy : new String[] {"FIFO", "LRU", "OPT"}) {
            run(policy);
        }
    }

    static void run(String policy) {
        List<Integer> frames = new ArrayList<>();          // resident pages, in load order
        int[] loaded = new int[10];                        // time each page was loaded (FIFO)
        int[] lastUsed = new int[10];                      // time each page was last used (LRU)
        int faults = 0;
        StringBuilder trace = new StringBuilder();
        for (int t = 0; t < REFS.length; t++) {
            int page = REFS[t];
            if (frames.contains(page)) {
                trace.append("H ");
            } else {
                faults++;
                trace.append("F ");
                if (frames.size() == FRAMES) {
                    frames.remove(Integer.valueOf(victim(policy, frames, loaded, lastUsed, t)));
                }
                frames.add(page);
                loaded[page] = t;
            }
            lastUsed[page] = t;
        }
        System.out.printf("%-4s faults = %2d   %s%n", policy, faults, trace.toString().trim());
    }

    static int victim(String policy, List<Integer> frames, int[] loaded, int[] lastUsed, int now) {
        int best = frames.get(0);
        for (int page : frames) {
            switch (policy) {
                case "FIFO" -> {
                    if (loaded[page] < loaded[best]) {
                        best = page;                       // oldest load
                    }
                }
                case "LRU" -> {
                    if (lastUsed[page] < lastUsed[best]) {
                        best = page;                       // oldest use
                    }
                }
                default -> {
                    if (nextUse(page, now) > nextUse(best, now)) {
                        best = page;                       // farthest next use
                    }
                }
            }
        }
        return best;
    }

    static int nextUse(int page, int now) {
        for (int t = now + 1; t < REFS.length; t++) {
            if (REFS[t] == page) {
                return t;
            }
        }
        return Integer.MAX_VALUE;                          // never used again
    }
}
```

**Output:**

```text
FIFO faults = 10   F F F H H F F F F F F F
LRU  faults =  8   F F F H H F H H F F F F
OPT  faults =  6   F F F H H F H H F F H H
```

## Comparison

| Aspect | FIFO | LRU | Optimal |
|--------|------|-----|---------|
| Evicts | Oldest loaded page | Least recently used page | Page used farthest in the future |
| Looks at | Past loads | Past uses | Future references |
| Implementable | Yes, cheaply | Yes, but expensive exactly → approximated (clock) | No — benchmark only |
| Faults | Usually most | Close to Optimal with locality | Minimum possible |
| Belady's anomaly | **Yes** | No (stack algorithm) | No (stack algorithm) |

## Important Points

- Replacement runs only when a fault occurs and no frame is free; dirty victims are written back first.
- FIFO: simple, can evict hot pages, suffers Belady's anomaly.
- Optimal: fewest faults, needs the future — a benchmark.
- LRU: best practical approximation of Optimal; real systems approximate it with reference bits and the clock algorithm.
- Initial loads into empty frames are faults too (compulsory faults).

## Common Confusion

> [!WARNING]
> **Not counting the first loads.** With empty frames, the first reference to each page is a page fault. In the example, the first three references are all faults under every algorithm.

- **"LRU is always better than FIFO."** Usually, not always — on some reference strings FIFO has fewer faults. Optimal is the only one guaranteed to be best.
- **LRU vs FIFO on a hit:** a hit updates LRU's recency but does **not** change FIFO's order.
- **Belady's anomaly applies to FIFO**, not to LRU or Optimal.

## Interview Perspective

- *"Count page faults for this string with 3 frames using FIFO, LRU and Optimal."* — draw the frame table; mark faults and victims.
- *"What is Belady's anomaly?"* — more frames, more faults under FIFO; give the 9 → 10 example.
- *"Why can't Optimal be implemented? Why study it?"* — needs the future; benchmark.
- *"How is LRU implemented in practice?"* — reference bit, second chance/clock. (Related: [LRU caches in system design](../../../system-design/caching/cache-eviction-policies/content.md).)

## Quick Revision

- FIFO: oldest loaded. LRU: least recently used. OPT: used farthest in future.
- Faults: OPT ≤ LRU (usually) ≤ FIFO (usually).
- Belady: FIFO 3 frames → 9, 4 frames → 10 on 1 2 3 4 1 2 5 1 2 3 4 5.
- LRU and OPT are stack algorithms: no Belady. Count the first loads as faults.
