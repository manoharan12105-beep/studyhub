# Last-Minute Traps

Read this just before the interview: the checks to run before you say "done", and the answers that must come out precise.

## Before You Say "Done"

- Empty input, one element, all equal, all negative, maximum size.
- `long` for sums, products, `n × (n − 1) / 2`; cast before multiplying.
- Loop bounds, window length `right − left + 1`, last valid start `n − k`.
- Visited marked when enqueued (BFS); both directions added for undirected edges.
- Recursion: base case reached; copies recorded in backtracking; choices undone.
- Binary search terminates (`lo < hi` with `hi = mid`, or round mid up for `lo = mid`).
- `equals` for strings and boxed numbers; `Integer.compare` in comparators.
- State time **and** space complexity, with the reason.

## Say It Precisely

- HashMap: **O(1) average**, not guaranteed.
- ArrayList append: **amortized** O(1).
- Quick sort: **expected** O(n log n), worst O(n²).
- Heap build: **O(n)**, not O(n log n).
- Recursion uses **O(depth)** stack space.
- BFS = shortest path only when **all edges cost the same**.
- Dijkstra **fails with negative edges**.
- Greedy needs **proof**; coin change {1, 3, 4} for 6 breaks it.
- Knapsack O(n × W) is **pseudo-polynomial**.
- Comparison sorts are **Ω(n log n)**; counting/radix beat it only with small key ranges.

## Process

- Clarify → examples → brute force (with complexity) → optimise → code → dry run → complexity.
- Think aloud; name the pattern and why it fits.
- When a test fails, trace and fix the cause, not the symptom.
