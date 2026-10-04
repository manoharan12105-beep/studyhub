# Pattern Clues

If the statement says this, think of that first.

## Clue → Pattern

| If you see… | Think… |
|-------------|--------|
| sorted array + pair/triplet sum | two pointers |
| sorted / monotone + "find", O(log n) | binary search |
| "minimum X such that it is possible", min-max, max-min | binary search on the answer |
| contiguous subarray/substring, longest/shortest, values ≥ 0 | sliding window |
| subarray sum = k, values can be negative | prefix sum + hash map |
| many range sums, no updates | prefix sums |
| many range additions, read once | difference array |
| "seen before", duplicates, pairs in unsorted data, counts | hash map / set |
| linked list middle or cycle; O(1) space | fast and slow pointers |
| next greater/smaller, span, histogram | monotonic stack |
| max/min of each window | monotonic deque |
| k largest/smallest/frequent/closest | heap of size k |
| intervals, overlaps, free time | sort by start, merge |
| fewest moves, unit costs, grid/graph | BFS |
| regions, islands, components, reachability | DFS (or union-find) |
| prerequisites, ordering, "possible to finish?" | topological sort |
| groups merge over time, redundant edge | union-find |
| weighted shortest path | Dijkstra (negative weights → Bellman–Ford) |
| connect everything at minimum cost | MST (Kruskal/Prim) |
| all subsets/permutations/arrangements | backtracking |
| number of ways, or min/max where greedy fails | DP |
| one sort order makes the choice obvious | greedy (prove it) |
| n ≤ 20 and "each item used once" | bitmask DP / backtracking |
| appears twice except one; no extra space | XOR / bit counting |
| prefix of words, autocomplete | trie |
| answer mod 10⁹ + 7 | counting DP / combinatorics with modular arithmetic |

## Sanity Checks Before Committing

- Does the pattern's precondition hold (sorted? non-negative? monotone? no negative edges?)
- Does its complexity fit the largest n?
- Is there a simpler O(n) idea you are overlooking?
