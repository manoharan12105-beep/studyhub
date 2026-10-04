# DSA Pattern Recognition Questions

## Definition

**Pattern recognition questions** give a problem statement and ask which approach you would use and why — before any code. The skill is mapping **clues in the statement** (sorted input, "contiguous", "minimum steps", "all combinations", n ≤ 20, "at most k") to a problem-solving pattern, and justifying the choice with complexity.

## Why It Matters

- It is the first and most important minute of every coding interview: the right pattern makes the rest straightforward.
- Interviewers often ask "what approaches did you consider?" — naming and rejecting alternatives shows depth.
- Recognition transfers: a few dozen patterns cover the large majority of interview problems.

## Core Concept

Read the statement for four kinds of clues:

| Clue type | Examples → pattern |
|-----------|--------------------|
| **Input shape** | sorted array → [binary search](../../patterns/binary-search-pattern/content.md) / [two pointers](../../patterns/two-pointers/content.md); intervals → [merge intervals](../../patterns/merge-intervals/content.md); grid/graph → [BFS](../../patterns/bfs-pattern/content.md)/[DFS](../../patterns/dfs-pattern/content.md); tree → DFS/[tree DP](../../algorithms/tree-dp/content.md) |
| **Question wording** | "contiguous subarray/substring" → [sliding window](../../patterns/sliding-window/content.md)/[prefix sum](../../patterns/prefix-sum/content.md); "minimum steps" → BFS; "all combinations" → [backtracking](../../patterns/backtracking-pattern/content.md); "number of ways" → [DP](../../patterns/dp-pattern/content.md); "k largest" → [top K](../../patterns/top-k-elements/content.md); "next greater" → [monotonic stack](../../patterns/monotonic-stack/content.md) |
| **Constraints** | n ≤ 20 → bitmask/backtracking; n ≤ 10⁵ → O(n log n); answer range 10⁹ with a yes/no check → [binary search on answer](../../patterns/binary-search-on-answer/content.md) ([Constraints and Complexity](../../problem-solving/constraints-and-complexity/content.md)) |
| **Structure of the solution** | dependencies → [topological sort](../../patterns/topological-sort-pattern/content.md); merging groups → [union-find](../../patterns/union-find-pattern/content.md); weighted costs → [shortest path](../../patterns/shortest-path-pattern/content.md); local choice provably safe → [greedy](../../patterns/greedy-pattern/content.md) |

## How It Works

1. **Underline the clues**: input type, wording, constraints, required output.
2. **List two or three candidate patterns** that fit the clues.
3. **Check each against the constraints**: does it meet the target complexity? Does its precondition hold (sorted? non-negative values? monotone predicate? no negative edges?)
4. **Pick one and justify it** in one or two sentences, mentioning why the alternatives are worse.
5. **Sketch the approach** and its complexity before coding.

A useful answer format: *"This is a [pattern] problem because [clue]. Brute force is [cost]; with [pattern] it is [cost]. [Alternative] would not work because [reason]."*

## Comparison

Patterns that are easy to confuse:

| Pair | How to tell them apart |
|------|------------------------|
| Sliding window vs prefix sum + hash map | non-negative values with a monotone condition → window; negatives or "exactly k" → prefix sums |
| Two pointers vs hashing | sorted input or values only → two pointers; unsorted with original indices → hashing |
| BFS vs Dijkstra | equal edge costs → BFS; different non-negative costs → Dijkstra |
| Greedy vs DP | provable local choice → greedy; counterexample exists or "count the ways" → DP |
| Backtracking vs DP | list all solutions → backtracking; count/optimise with overlapping subproblems → DP |
| Monotonic stack vs monotonic queue | next greater/smaller → stack; window max/min with expiry → deque |
| Binary search vs binary search on answer | searching positions in sorted data → binary search; searching the value of an optimal answer with a feasibility check → on answer |

## Common Misconceptions

- **"Each problem has exactly one pattern."** Many have several valid approaches (heap vs quickselect, DFS vs union-find); choose by constraints and clarity.
- **"Keywords are enough."** "Subarray" does not always mean sliding window — check the precondition (negatives break it).
- **"Recognition replaces understanding."** You must still verify correctness conditions; a pattern applied outside its preconditions gives wrong answers.

## Key Takeaways

- Read input shape, wording, constraints and solution structure for clues.
- Name candidates, check preconditions and complexity, then justify the choice.
- Know the commonly confused pairs and the single question that separates them.
