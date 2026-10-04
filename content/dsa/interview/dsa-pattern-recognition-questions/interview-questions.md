# DSA Pattern Recognition Questions — Interview Questions

## Beginner

### Q1. "Given a sorted array of distinct integers and a target, return whether two elements sum to the target, using O(1) extra space." Which approach?

<details>
<summary>Answer</summary>

**Two pointers from both ends.** Clues: sorted input, a pair condition, O(1) space.

If `a[left] + a[right]` is too small, only moving `left` right can increase it; too large, only moving `right` left can decrease it. Each step discards one element: O(n) time, O(1) space. A hash set also gives O(n) time but O(n) space, violating the constraint. See [Two Pointers](../../patterns/two-pointers/content.md).

</details>

### Q2. "Return the maximum sum of any 5 consecutive elements of an array of 10⁶ integers." Which approach?

<details>
<summary>Answer</summary>

**Fixed-size sliding window.** Clues: "consecutive" (contiguous) and a fixed length.

Each window sum = previous sum + entering element − leaving element: O(n) time, O(1) space, instead of O(n × 5) by recomputation (fine here, but the window idea scales to any k). Negative values are no problem because the window size is fixed. See [Sliding Window](../../patterns/sliding-window/content.md).

</details>

### Q3. "Find the minimum number of moves for a knight to reach a target square on an empty 8 × 8 board." Which approach?

<details>
<summary>Answer</summary>

**BFS over board squares.** Clues: "minimum number of moves", every move costs the same.

Squares are nodes, knight moves are edges; BFS reaches each square first by a shortest path. 64 states, at most 8 moves each — trivial cost. DFS would find *a* path, not the shortest; Dijkstra is unnecessary with unit costs. See [BFS Pattern](../../patterns/bfs-pattern/content.md).

</details>

### Q4. "Count the islands (4-connected groups of 1s) in a binary grid." Which approach?

<details>
<summary>Answer</summary>

**DFS (or BFS) flood fill from each unvisited land cell**; each start is one island. Clues: grid, "groups"/connected components, no distances needed.

O(R × C) time; recursion depth can reach R × C, so for large grids use an explicit stack or BFS. Union-find also works (union adjacent land cells), useful if land is added incrementally. See [DFS Pattern](../../patterns/dfs-pattern/content.md).

</details>

### Q5. "Return all subsets of a set of up to 15 distinct numbers." Which approach?

<details>
<summary>Answer</summary>

**Backtracking** (include/exclude each element), or iterate bitmasks 0 … 2ⁿ − 1. Clues: "all" subsets, small n.

The output has 2ⁿ subsets, so any method is Ω(2ⁿ × n) to write them; 2¹⁵ × 15 ≈ 5 × 10⁵ is fine. DP does not apply because nothing is counted or optimised. See [Backtracking Pattern](../../patterns/backtracking-pattern/content.md).

</details>

## Intermediate

### Q6. "Count subarrays whose sum equals k; values can be negative; n ≤ 2 × 10⁴." Which approach, and why not a sliding window?

<details>
<summary>Answer</summary>

**Prefix sums + hash map of prefix counts**, O(n). Clues: "subarrays", "sum equals k", **negative values**.

A sliding window needs a monotone condition: with negatives, extending a window can decrease its sum, so there is no correct rule for shrinking. A subarray (l, r] has sum k iff `prefix[r] − prefix[l] = k`, so count earlier prefixes equal to `prefix[r] − k`. See [Prefix Sum](../../patterns/prefix-sum/content.md).

</details>

### Q7. "For each day's stock price, find how many consecutive days up to and including today had a price ≤ today's price." Which approach?

<details>
<summary>Answer</summary>

**Monotonic stack** (decreasing stack of (price, span) pairs or indices). Clues: for each element, look back to the **previous greater** element.

Today's span = distance to the previous day with a strictly greater price. Pop all smaller-or-equal prices (absorbing their spans); each day is pushed and popped once — O(n) total, versus O(n²) scanning back. See [Monotonic Stack](../../patterns/monotonic-stack/content.md).

</details>

### Q8. "Workers must paint n boards with given lengths, each painting a contiguous block; minimise the time when k painters work in parallel (time = largest block sum)." Which approach?

<details>
<summary>Answer</summary>

**Binary search on the answer** with a greedy feasibility check. Clues: "minimise the maximum", contiguous blocks, a monotone yes/no question.

feasible(T) = greedily fill blocks with sum ≤ T and count painters; if ≤ k, T works, and any larger T works too. Search T in [max length, total length]: O(n log(sum)). A DP over (boards, painters) is O(k × n²) — slower. See [Binary Search on Answer](../../patterns/binary-search-on-answer/content.md).

</details>

### Q9. "Given meeting time intervals, find the minimum number of rooms required." Which approaches work?

<details>
<summary>Answer</summary>

**Sweep over start/end events** (or a min-heap of end times after sorting by start). Clues: intervals, "how many at the same time".

Sweep: +1 at each start, −1 at each end (process ends before starts at equal times for half-open intervals); the maximum running count is the answer — O(n log n) for sorting. Heap: sort by start; for each meeting, if the earliest-ending room is free, reuse it (poll), then push this meeting's end — the heap size at the end is the answer. See [Merge Intervals](../../patterns/merge-intervals/content.md) and [Difference Array](../../patterns/difference-array/content.md).

</details>

### Q10. "Cities are connected by roads with travel times (non-negative). Find the fastest time from city A to every other city." Which approach?

<details>
<summary>Answer</summary>

**Dijkstra's algorithm** with a min-heap. Clues: weighted edges, non-negative weights, single source.

O((V + E) log V). BFS is wrong because edges have different costs; Bellman–Ford works but is O(V × E); Floyd–Warshall computes all pairs in O(V³) — wasteful for a single source. See [Shortest Path Pattern](../../patterns/shortest-path-pattern/content.md).

</details>

### Q11. "Each course lists its prerequisites; return an order to take all courses or report that it is impossible." Which approach?

<details>
<summary>Answer</summary>

**Topological sort (Kahn's algorithm).** Clues: "prerequisites", "order", possibility of impossibility (a cycle).

Edges prerequisite → course; repeatedly take courses with in-degree 0. If fewer than n courses are output, a cycle exists. O(V + E). See [Topological Sort Pattern](../../patterns/topological-sort-pattern/content.md).

</details>

## Advanced

### Q12. "Given a stream of edges added to an undirected graph, after each addition report the number of connected components." Which approach?

<details>
<summary>Answer</summary>

**Union-find** with path compression and union by size. Clues: edges only **added**, connectivity questions after every addition.

Start with n components; each successful union decreases the count; a union of two already-connected nodes changes nothing. O(α(n)) amortized per edge, versus re-running BFS/DFS (O(V + E)) after every addition. See [Union-Find Pattern](../../patterns/union-find-pattern/content.md).

</details>

### Q13. "n ≤ 16 cities with pairwise travel costs; find the cheapest route that visits every city exactly once and returns to the start." Which approach?

<details>
<summary>Answer</summary>

**Bitmask DP (Held–Karp)**: `dp[mask][v]` = cheapest path starting at city 0, visiting exactly the cities in `mask`, ending at v. Clues: tiny n, "visit every city exactly once" (state must remember the set of visited cities).

O(2ⁿ × n²) ≈ 1.7 × 10⁷ for n = 16, versus n! ≈ 2 × 10¹³ permutations. Greedy nearest-neighbour is not optimal. See [Bitmask DP](../../algorithms/bitmask-dp/content.md).

</details>

### Q14. "Given a string, find the number of distinct ways to decode it where 'A' = 1 … 'Z' = 26, modulo 10⁹ + 7, for strings up to 10⁵ characters." Which approach and why not backtracking?

<details>
<summary>Answer</summary>

**1D DP**: `ways[i]` = number of decodings of the first i characters; `ways[i] = (s[i−1] ≠ '0' ? ways[i−1] : 0) + (s[i−2…i−1] in 10…26 ? ways[i−2] : 0)`. Clues: "number of ways", "modulo", long input.

Backtracking enumerates every decoding — up to about φⁿ of them — and the same suffixes are re-explored repeatedly; DP counts each prefix once: O(n) time, O(1) space with two variables. See [1D DP](../../algorithms/dp-1d/content.md).

</details>

### Q15. "Return the length of the longest substring that contains at most k distinct characters." Which approach, and how would you change it for "exactly k"?

<details>
<summary>Answer</summary>

**Variable sliding window** with a character-count map and a distinct counter. Clues: "longest substring", condition "at most k distinct" is monotone (shrinking never increases the number of distinct characters).

Expand right; while distinct > k, shrink from the left; record the longest window — O(n). For **counting** substrings with exactly k distinct characters, use `atMost(k) − atMost(k − 1)`, where `atMost` counts windows ending at each right index. For the **longest** substring with exactly k, track the longest window whose distinct count equals k during the same scan. See [Sliding Window](../../patterns/sliding-window/content.md).

</details>
