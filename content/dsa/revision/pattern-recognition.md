# Pattern Recognition

For each problem-solving pattern: when to recognise it, the invariant that makes it correct, its usual cost, and the condition that breaks it.

## Array and String Patterns

| Pattern | Recognise when | Key invariant | Cost | Breaks when |
|---------|----------------|---------------|------|-------------|
| Two pointers (opposite ends) | sorted input, pair/triplet with a target, palindrome checks | a pointer moves only when the discarded element provably cannot be in an answer | O(n) after sorting | input unsorted and indices must be preserved |
| Two pointers (same direction) | in-place filtering, "keep order, O(1) space" | everything before `slow` is final output | O(n) | — |
| Sliding window | contiguous subarray/substring + longest/shortest/count with a monotone condition | window is valid (or minimal) after each shrink; pointers only move forward | O(n) | condition not monotone (sums with negatives) |
| Fast and slow pointers | linked-list middle or cycle; repeated function `x → f(x)` | speed difference closes the gap by 1 per step inside a cycle | O(n), O(1) space | random access available (just index) |
| Prefix sum | many range sums; subarray sum = k with negatives | sum(l..r) = P[r + 1] − P[l]; earlier prefix = current − k | O(n) | values change between queries |
| Difference array | many range additions, read once | `diff[l] += v; diff[r + 1] −= v`; prefix sum rebuilds | O(n + q) | queries interleave with updates |
| Hashing | unsorted pair search, duplicates, counts, grouping | map holds exactly the earlier elements' information | O(n) expected | sorted input + O(1) space required (use two pointers) |

## Search Patterns

| Pattern | Recognise when | Key invariant | Cost | Breaks when |
|---------|----------------|---------------|------|-------------|
| Binary search | sorted data, "first/last position", O(log n) demanded, rotated/mountain arrays | answer stays inside [lo, hi); predicate is F…F T…T | O(log n) | predicate not monotone |
| Binary search on answer | "minimum X such that possible", min-max / max-min, huge answer range | feasible(X) monotone in X | O(n log range) | feasibility not monotone ("exactly k") |

## Stack, Queue and Heap Patterns

| Pattern | Recognise when | Key invariant | Cost | Breaks when |
|---------|----------------|---------------|------|-------------|
| Monotonic stack | next/previous greater or smaller, spans, histogram areas | stack values monotone; a pop means the answer for the popped index is known | O(n) | elements must leave from the front (window) |
| Monotonic queue | max/min of every window; DP over a sliding range | deque values monotone, front = window extreme, expired indices removed | O(n) | arbitrary range queries |
| Top K | k largest/smallest/frequent/closest; streams | heap of size k holds the best k, weakest on top | O(n log k) | k ≈ n (just sort) |
| Merge intervals | intervals, overlaps, free time, insert interval | after sorting by start, only the last kept interval can overlap the next one | O(n log n) | online queries (use a `TreeMap`) |

## Graph Patterns

| Pattern | Recognise when | Key invariant | Cost | Breaks when |
|---------|----------------|---------------|------|-------------|
| BFS | minimum steps with unit costs; nearest source; spreading | queue holds states in non-decreasing distance; first visit is shortest | O(V + E) | weighted edges |
| DFS | components, regions, reachability, whole-subtree answers | each state visited once; results aggregate on return | O(V + E) | shortest paths needed |
| Topological sort | prerequisites, build order, earliest finish | only in-degree-0 nodes are emitted; leftovers mean a cycle | O(V + E) | undirected relationships |
| Union-find | merge-only grouping, redundant edge, equations | each set is a tree; roots represent sets | O(α(n)) per op | deletions; directed reachability |
| Shortest path | weighted costs (sum, product ≤ 1, bottleneck) | Dijkstra settles in non-decreasing distance (needs non-negative weights) | O((V + E) log V) | negative edges (use Bellman–Ford) |

## Recursion, Greedy and DP Patterns

| Pattern | Recognise when | Key invariant | Cost | Breaks when |
|---------|----------------|---------------|------|-------------|
| Backtracking | "all" subsets/permutations/arrangements; puzzles; n small | state is restored after each choice; pruning removes hopeless prefixes | exponential (output-sized) | only a count/optimum is needed with overlapping subproblems |
| Divide and conquer | independent halves + combine; split at invalid elements | pieces share nothing; combine handles the crossing part | often O(n log n) | subproblems overlap |
| Greedy | one sort key or local rule; exchange argument exists | some optimal solution agrees with every greedy choice so far | O(n log n) | a counterexample exists (general coin change, 0/1 knapsack) |
| Dynamic programming | count ways; optimise when greedy fails; repeated subproblems | each state's value depends only on smaller states | states × transition | state space too large |
| Bit manipulation | appears twice/k times except one; O(1) space; small sets | XOR cancels pairs; per-bit counts mod k; masks encode sets | O(n) or O(2ⁿ) | sets larger than 64 without `BitSet` |

## Patterns That Look Alike

| If you are unsure between… | Ask |
|----------------------------|-----|
| Sliding window vs prefix sum + map | Are all values non-negative and is the condition monotone? Yes → window. |
| Two pointers vs hashing | Is the input sorted and are original indices unnecessary? Yes → two pointers. |
| BFS vs Dijkstra | Do all moves cost the same? Yes → BFS. |
| DFS vs union-find | Does the graph change over time (edges added)? Yes → union-find. |
| Greedy vs DP | Can I break the greedy rule with a 3–4 element example? Yes → DP. |
| Backtracking vs DP | Must I list every solution? Yes → backtracking; count/optimise → DP. |
| Binary search vs binary search on answer | Am I searching positions in data, or the value of the optimum? |
| Monotonic stack vs monotonic queue | Do elements expire from the front (a moving window)? Yes → deque. |
