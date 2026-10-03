# DSA Complexity Reference

## Purpose

One place to look up the time and space cost of every structure and algorithm in this section. Each row links to the topic that explains *why*. Where the average and worst case differ, both are shown — "O(1)" for a hash map is only the average.

Notation: n = number of elements, h = tree height, V = vertices, E = edges, L = key/word length, k = value range or "top k", W = knapsack capacity. "amortized" = averaged over a sequence of operations ([Amortized Analysis](../amortized-analysis/content.md)); "average" = expected under an assumption about the input.

## Linear Structures

### Array and dynamic array (`int[]`, `ArrayList`)

| Operation | Time | Note |
|-----------|------|------|
| Access by index | O(1) | address arithmetic |
| Search (unsorted) | O(n) | |
| Search (sorted) | O(log n) | binary search |
| Append at end | O(1) amortized, O(n) worst | resize copies everything |
| Insert / delete at index i | O(n − i) → O(n) | shifts later elements |
| Delete at end | O(1) | |

Details: [Arrays](../../data-structures/arrays/content.md).

### Linked list

| Operation | Singly (head + tail refs) | Doubly (`LinkedList`) |
|-----------|---------------------------|-----------------------|
| Access k-th element | O(n) | O(n) (starts from the nearer end) |
| Insert / delete at head | O(1) | O(1) |
| Insert at tail | O(1) | O(1) |
| Delete at tail | O(n) — needs predecessor | O(1) |
| Insert after a known node | O(1) | O(1) |
| Delete a known node | O(n) — needs predecessor | O(1) |
| Search | O(n) | O(n) |

Details: [Linked List](../../data-structures/linked-list/content.md).

### Stack, queue, deque

| Structure | Main operations | Time |
|-----------|-----------------|------|
| Stack (array or linked list) | push, pop, peek | O(1) (amortized if array grows) |
| Queue (circular array or linked list) | offer, poll, peek | O(1) (amortized if array grows) |
| Deque (`ArrayDeque`) | add/remove at both ends | O(1) amortized |
| Monotonic stack / queue over n elements | all pushes and pops | O(n) total |

Details: [Stack](../../data-structures/stack/content.md), [Queue](../../data-structures/queue/content.md).

## Hash-Based Structures

| Operation | `HashMap` / `HashSet` average | Worst case |
|-----------|-------------------------------|------------|
| put / add | O(1) average, amortized | O(n); O(log n) in Java 8+ when a crowded bucket is treeified |
| get / contains | O(1) average | O(n); O(log n) treeified |
| remove | O(1) average | O(n); O(log n) treeified |
| Iterate all | O(n + capacity) | |
| Ordered queries (min, floor) | not supported — O(n) scan | |

`LinkedHashMap` has the same costs and also keeps insertion (or access) order. Details: [Hashing](../../data-structures/hashing/content.md).

> [!WARNING]
> Never write "HashMap is O(1)" without "average". The worst case depends on collisions, which depend on the hash function and the keys.

## Trees

### Binary search tree

| Operation | Balanced (AVL, red-black) | Unbalanced BST average (random inserts) | Unbalanced BST worst (sorted inserts) |
|-----------|---------------------------|------------------------------------------|----------------------------------------|
| Search / insert / delete | O(log n) | O(log n) | O(n) |
| Min / max | O(log n) | O(log n) | O(n) |
| Successor / predecessor | O(log n) | O(log n) | O(n) |
| In-order traversal | O(n) | O(n) | O(n) |

Generally: O(h), where h is between log₂ n and n. Details: [Binary Search Tree](../../data-structures/binary-search-tree/content.md).

### `TreeMap` / `TreeSet` (red-black tree)

| Operation | Time |
|-----------|------|
| put, get, remove, containsKey | O(log n) worst case |
| firstKey, lastKey, floorKey, ceilingKey, higherKey, lowerKey | O(log n) |
| Iterate in sorted order | O(n) |

### Binary tree traversal

| Operation | Time | Space |
|-----------|------|-------|
| Pre/in/post-order (recursive or with a stack) | O(n) | O(h) |
| Level order (queue) | O(n) | O(w) — maximum width, up to n/2 |
| Morris traversal | O(n) | O(1) |

### Heap (`PriorityQueue`)

| Operation | Time |
|-----------|------|
| peek (min or max) | O(1) |
| offer / insert | O(log n) |
| poll / extract top | O(log n) |
| Build heap from n elements | O(n) (bottom-up heapify) |
| Build by n inserts | O(n log n) |
| contains / remove(Object) | O(n) |

Details: [Heap](../../data-structures/heap/content.md).

### Trie

| Operation | Time | Space |
|-----------|------|-------|
| Insert word | O(L) | up to O(L) new nodes |
| Search word / prefix | O(L) | |
| Total storage | | O(total characters × alphabet size) worst case with arrays; less with hash-map children |

Details: [Trie](../../data-structures/trie/content.md).

### Range-query structures (advanced)

| Structure | Build | Query | Point update | Range update |
|-----------|-------|-------|--------------|--------------|
| Prefix sum array | O(n) | O(1) sum | O(n) | O(n) |
| [Fenwick tree](../../data-structures/fenwick-tree/content.md) | O(n log n), or O(n) | O(log n) prefix sum | O(log n) | O(log n) with a difference trick |
| [Segment tree](../../data-structures/segment-tree/content.md) | O(n) | O(log n) any associative op | O(log n) | O(log n) with lazy propagation |
| [Sparse table](../../data-structures/sparse-table/content.md) | O(n log n) | O(1) for min/max/gcd | not supported (static) | not supported |

### Disjoint Set Union

| Implementation | find / union |
|----------------|--------------|
| No optimisation | O(n) worst |
| Union by rank or size only | O(log n) |
| Path compression + union by rank/size | O(α(n)) amortized — α ≤ 4 for any realistic n |

Details: [Disjoint Set Union](../../data-structures/disjoint-set-union/content.md).

## Graph Representations

| | Adjacency matrix | Adjacency list | Edge list |
|---|------------------|----------------|-----------|
| Space | O(V²) | O(V + E) | O(E) |
| Is (u, v) an edge? | O(1) | O(deg(u)) | O(E) |
| Iterate neighbours of u | O(V) | O(deg(u)) | O(E) |
| Add edge | O(1) | O(1) | O(1) |
| Best for | dense graphs, Floyd–Warshall | most problems (sparse graphs) | Kruskal, Bellman–Ford |

Details: [Graph](../../data-structures/graph/content.md).

## Sorting Algorithms

| Algorithm | Best | Average | Worst | Extra space | Stable | In-place |
|-----------|------|---------|-------|-------------|--------|----------|
| [Bubble](../../algorithms/bubble-sort/content.md) (early exit) | O(n) | O(n²) | O(n²) | O(1) | Yes | Yes |
| [Selection](../../algorithms/selection-sort/content.md) | O(n²) | O(n²) | O(n²) | O(1) | No | Yes |
| [Insertion](../../algorithms/insertion-sort/content.md) | O(n) | O(n²) | O(n²) | O(1) | Yes | Yes |
| [Merge](../../algorithms/merge-sort/content.md) | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes | No |
| [Quick](../../algorithms/quick-sort/content.md) | O(n log n) | O(n log n) | O(n²) | O(log n) avg, O(n) worst stack | No | Yes |
| [Heap](../../algorithms/heap-sort/content.md) | O(n log n) | O(n log n) | O(n log n) | O(1) | No | Yes |
| [Counting](../../algorithms/counting-sort/content.md) | O(n + k) | O(n + k) | O(n + k) | O(n + k) | Yes | No |
| [Radix](../../algorithms/radix-sort/content.md) (d digits, base b) | O(d(n + b)) | O(d(n + b)) | O(d(n + b)) | O(n + b) | Yes | No |
| [Bucket](../../algorithms/bucket-sort/content.md) (uniform input) | O(n + k) | O(n + k) | O(n²) | O(n + k) | Yes* | No |

\* if each bucket is sorted with a stable algorithm. Ω(n log n) is the lower bound for comparison sorts only — see [Algorithm Properties](../algorithm-properties/content.md).

## Searching Algorithms

| Algorithm | Time | Space | Requirement |
|-----------|------|-------|-------------|
| [Linear search](../../algorithms/linear-search/content.md) | O(n) | O(1) | none |
| [Binary search](../../algorithms/binary-search/content.md) | O(log n) | O(1) iterative | sorted / monotonic |
| [Binary search on answer](../../patterns/binary-search-on-answer/content.md) | O(log(range) × cost of check) | depends on check | monotonic feasibility |
| BST / `TreeMap` lookup | O(h) / O(log n) | O(1) | ordered structure |
| Hash lookup | O(1) average | — | hashable keys |

## Graph Algorithms

| Algorithm | Time | Space | Use |
|-----------|------|-------|-----|
| [BFS](../../algorithms/bfs/content.md) | O(V + E) | O(V) | traversal, unweighted shortest path |
| [DFS](../../algorithms/dfs/content.md) | O(V + E) | O(V) | traversal, components, cycles |
| 0-1 BFS (deque) | O(V + E) | O(V) | weights only 0 or 1 |
| [Dijkstra](../../algorithms/dijkstra/content.md) (binary heap) | O((V + E) log V) | O(V + E) | non-negative weights, single source |
| [Bellman–Ford](../../algorithms/bellman-ford/content.md) | O(V × E) | O(V) | negative weights, detects negative cycles |
| [Floyd–Warshall](../../algorithms/floyd-warshall/content.md) | O(V³) | O(V²) | all pairs, small V |
| [Prim](../../algorithms/prims-algorithm/content.md) (binary heap) | O(E log V) | O(V + E) | MST, dense-ish graphs |
| [Kruskal](../../algorithms/kruskals-algorithm/content.md) | O(E log E) | O(V + E) | MST, edge list |
| [Topological sort](../../algorithms/topological-sort/content.md) (Kahn or DFS) | O(V + E) | O(V) | ordering a DAG |
| [Kosaraju / Tarjan SCC](../../algorithms/strongly-connected-components/content.md) | O(V + E) | O(V) | strongly connected components |
| [Bridges / articulation points](../../algorithms/bridges-and-articulation-points/content.md) | O(V + E) | O(V) | critical edges / vertices |

## String Algorithms

| Algorithm | Time | Space |
|-----------|------|-------|
| [Naive matching](../../algorithms/naive-pattern-matching/content.md) | O(n × m) worst | O(1) |
| [KMP](../../algorithms/kmp-algorithm/content.md) | O(n + m) | O(m) |
| [Rabin–Karp](../../algorithms/rabin-karp/content.md) | O(n + m) average, O(n × m) worst | O(1) |
| [Z algorithm](../../algorithms/z-algorithm/content.md) | O(n + m) | O(n + m) |

(n = text length, m = pattern length.)

## Dynamic Programming Examples

| Problem | States | Time | Space (optimised) |
|---------|--------|------|-------------------|
| Fibonacci / climbing stairs | n | O(n) | O(1) |
| House robber | n | O(n) | O(1) |
| Unique grid paths (r × c) | r × c | O(r × c) | O(c) |
| 0/1 knapsack (n items, capacity W) | n × W | O(n × W) — pseudo-polynomial | O(W) |
| Coin change (unbounded) | n × amount | O(n × amount) | O(amount) |
| Longest common subsequence | m × n | O(m × n) | O(min(m, n)) |
| Edit distance | m × n | O(m × n) | O(min(m, n)) |
| Longest increasing subsequence | n | O(n²), or O(n log n) with binary search | O(n) |
| Matrix chain multiplication (interval DP) | n² | O(n³) | O(n²) |
| Travelling salesman (bitmask DP) | 2ⁿ × n | O(2ⁿ × n²) | O(2ⁿ × n) |

Rule: **time = number of states × work per transition**. Details: [Dynamic Programming](../../algorithms/dynamic-programming/content.md).

## Math and Bit Techniques

| Technique | Time |
|-----------|------|
| [Euclidean GCD](../../algorithms/euclidean-gcd/content.md) | O(log min(a, b)) |
| [Sieve of Eratosthenes](../../algorithms/sieve-of-eratosthenes/content.md) up to n | O(n log log n) time, O(n) space |
| [Prime factorisation](../../algorithms/prime-factorization/content.md) by trial division | O(√n) |
| [Fast exponentiation](../../algorithms/fast-exponentiation/content.md) aᵉ | O(log e) multiplications |
| Count set bits (`Integer.bitCount`) | O(1) for fixed-width ints |
| Enumerate all subsets of n items with bitmasks | O(2ⁿ × n) |

## Recursion Shapes

| Recurrence | Result | Example |
|------------|--------|---------|
| T(n) = T(n/2) + O(1) | O(log n) | binary search |
| T(n) = T(n − 1) + O(1) | O(n) | linear recursion |
| T(n) = 2T(n/2) + O(1) | O(n) | tree traversal |
| T(n) = 2T(n/2) + O(n) | O(n log n) | merge sort |
| T(n) = T(n − 1) + O(n) | O(n²) | naive recursive sorts |
| T(n) = 2T(n − 1) + O(1) | O(2ⁿ) | subsets, Tower of Hanoi |
| T(n) = n × T(n − 1) | O(n!) | permutations |

Details: [Recurrence Relations](../recurrence-relations/content.md).

## Common Mistakes

- Writing O(1) for hash operations without "average", or for `ArrayList.add` without "amortized".
- Quoting quick sort as O(n log n) without its O(n²) worst case.
- Forgetting the recursion stack in space complexity (DFS, quick sort, recursive tree code).
- Treating knapsack's O(n × W) as polynomial — it is polynomial in the *value* W, not in the input size.
- Using O(V²) adjacency matrices for sparse graphs with 10⁵ vertices (10¹⁰ cells).
- Calling `PriorityQueue.remove(Object)` in a loop — each call is O(n).

## Key Takeaways

- Structure choice = which operations you need cheapest; this page shows the price of each.
- Separate average, amortized and worst case; say which you mean.
- Trees: everything is O(h); only balanced trees guarantee h = O(log n).
- Graph algorithms are O(V + E) for traversal; shortest paths cost more as weights become more general.
