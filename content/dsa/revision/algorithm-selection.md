# Choosing an Algorithm

Decision guides: given what you need and what the input looks like, which structure or algorithm fits — and when it does not.

## Choosing a Data Structure

| You need | Use | Not |
|----------|-----|-----|
| Index access, append, iterate | `ArrayList` / array | `LinkedList` (O(n) index access) |
| Add/remove at both ends | `ArrayDeque` | `ArrayList.remove(0)` (O(n)), legacy `Stack` |
| Membership / counting / grouping | `HashSet` / `HashMap` | `List.contains` (O(n)) |
| Sorted keys, floor/ceiling, range views | `TreeMap` / `TreeSet` | sorting after every insertion |
| Repeated min or max with insertions | `PriorityQueue` | `TreeMap` unless you also need deletion of arbitrary elements or ordered iteration |
| Insertion-ordered map, LRU cache | `LinkedHashMap` | `HashMap` (no order) |
| Prefix lookups, autocomplete | trie | hashing every prefix |
| Dynamic connectivity (merge-only) | union-find | BFS after each new edge |
| Range sums with point updates | Fenwick tree | prefix sums (O(n) per update) |
| Range min/max with updates | segment tree | sparse table (static only) |
| Range min/max, no updates | sparse table (O(1) query) | segment tree (O(log n) query) |
| Many range additions, read once | difference array | updating each element |

## Choosing a Search

| Situation | Algorithm |
|-----------|-----------|
| Unsorted data, one query | linear scan, O(n) |
| Unsorted data, many membership queries | build a `HashSet` once, O(1) average per query |
| Sorted array | binary search, O(log n) |
| Monotone yes/no over positions or values | binary search on the predicate / on the answer |
| Rotated sorted array, mountain array, peak | modified binary search (decide which half is ordered / follow the slope) |
| k-th smallest | quickselect (O(n) expected), heap of size k, or binary search on value with counting |

## Choosing a Sort

| Situation | Choice | Why |
|-----------|--------|-----|
| General purpose in Java | `Arrays.sort` / `Collections.sort` | tuned library code |
| Need stability (multi-key sorting) | merge sort / TimSort (object sort) | equal keys keep their order |
| O(1) extra space and guaranteed O(n log n) | heap sort | in place, no worst case blow-up |
| Nearly sorted / very small input | insertion sort | O(n + inversions) |
| Integer keys in a small range k | counting sort | O(n + k) |
| Fixed-width integers or strings | radix sort | O(d(n + b)) |
| Uniformly distributed reals | bucket sort | O(n) average |
| Linked list | merge sort | no random access needed |
| Only the top k | heap of size k or quickselect | no need to sort everything |

## Choosing a Graph Algorithm

| Goal | Condition | Algorithm |
|------|-----------|-----------|
| Shortest path, fewest edges | unweighted | BFS |
| Shortest path | weights 0 or 1 | 0-1 BFS with a deque |
| Shortest path, one source | non-negative weights | Dijkstra |
| Shortest path, one source | negative weights or a limit of k edges | Bellman–Ford (k rounds for "at most k edges") |
| All-pairs shortest paths | V ≤ ~400 | Floyd–Warshall |
| Shortest path in a DAG | any weights | relax in topological order, O(V + E) |
| Connect all vertices cheaply | undirected, weighted | Kruskal (edge list) or Prim (adjacency list, dense) |
| Order with dependencies | DAG | topological sort (Kahn); leftover nodes = cycle |
| Connected components | static graph | DFS/BFS |
| Connected components | edges arrive over time | union-find |
| Cycle detection | undirected | DFS with parent / union-find |
| Cycle detection | directed | three-colour DFS / Kahn |
| Two-colouring / "split into two groups" | — | BFS/DFS colouring (bipartite check) |
| Mutually reachable groups | directed | Kosaraju / Tarjan SCC |
| Critical edges or vertices | undirected | bridges / articulation points (low-link) |

## Choosing a Paradigm

| Signal | Paradigm |
|--------|----------|
| List every solution, n small | backtracking |
| Count solutions, or optimise where a local rule fails | dynamic programming |
| Local choice provably safe (exchange argument) | greedy |
| Independent halves + cheap combine | divide and conquer |
| Answer is a threshold with a monotone check | binary search on the answer |
| Input too large to enumerate, cheap per-element update | single pass with a running state (Kadane, prefix sums, sliding window) |

## Choosing a String Algorithm

| Situation | Choice |
|-----------|--------|
| Short pattern, ordinary text, one search | `indexOf` / naive scan |
| Guaranteed linear time, one pattern | KMP or Z algorithm |
| Many patterns of the same length | Rabin–Karp with a hash set |
| Substring equality queries, longest repeated substring | rolling/prefix hashes (+ binary search on length) |
| Borders, periods, prefix-function questions | KMP's LPS array or the Z-array |
| Many words, prefix queries | trie |
| Edit distance, LCS, matching with wildcards | string DP |

## Choosing a Number-Theory Tool

| Need | Tool |
|------|------|
| gcd / lcm | Euclid; lcm = a / gcd × b |
| Primes up to n ≤ 10⁷ | sieve of Eratosthenes |
| Is one large x (≤ 10¹²) prime? factor it? | trial division up to √x |
| Many factorisations of values ≤ 10⁷ | smallest-prime-factor sieve |
| aᵉ mod m with huge e | fast exponentiation |
| Division under a prime modulus | multiply by the inverse a^(p−2) |
| n-th term of a linear recurrence, huge n | matrix exponentiation |
