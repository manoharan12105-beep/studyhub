# Core Concepts

The ideas behind every DSA topic — what each structure and algorithm is for and why it works. Costs are collected in Complexity Tables; selection advice in Choosing an Algorithm.

## Analysis

- **Big-O** is an upper bound on growth, **Ω** a lower bound, **Θ** a tight bound. They describe functions; best/average/worst case is a separate choice.
- **Average** = expected over random inputs or random choices; **amortized** = guaranteed average over any sequence of operations; **worst** = the single most expensive input.
- Drop constants and lower-order terms, but keep every independent input size: O(V + E), O(n × m), O(n log k).
- **Space** includes extra arrays, maps and the recursion stack (depth × frame), not the input itself (auxiliary space).
- Recurrences: halving with O(1) work → O(log n); halving both sides with O(n) work → O(n log n); two calls of size n − 1 → O(2ⁿ).
- Java budget: roughly 10⁸ simple operations per second; plug the maximum n into your complexity.

## Arrays, Strings and Lists

- **Array:** contiguous, O(1) index access, O(n) insert/delete in the middle (shifting). Cache-friendly.
- **Dynamic array** (`ArrayList`): grows geometrically, so append is amortized O(1).
- **String** is immutable in Java: concatenation in a loop is O(n²); use `StringBuilder`.
- **Matrix:** row-major traversal; neighbours via direction arrays; transpose + reverse rows = rotate 90° clockwise.
- **Linked list:** O(1) insert/delete at a known node, O(n) access by position. Sentinel (dummy) nodes remove head/tail special cases.
- Linked-list techniques: reverse with three pointers; middle and cycle with fast/slow pointers; merge with a dummy head.

## Stacks, Queues and Hashing

- **Stack** (LIFO): undo, brackets, expression evaluation, DFS, monotonic stacks. **Queue** (FIFO): BFS, scheduling. **Deque**: both ends — use `ArrayDeque` for all three.
- **Monotonic stack/deque:** keep elements ordered by evicting dominated ones; each element enters and leaves once → O(n) total.
- **Hash table:** hash → bucket index; resize keeps the load factor bounded → O(1) average. Equal objects must have equal hash codes; never mutate a key in use.
- `HashMap` (no order), `LinkedHashMap` (insertion/access order — LRU), `TreeMap` (sorted, O(log n), floor/ceiling).

## Trees and Heaps

- **Binary tree** traversals: preorder (node first), inorder (node in the middle), postorder (node last), level order (BFS).
- Most tree problems are postorder: compute from children, combine at the node. Return several values per node when the parent needs them.
- **BST:** left < node < right; inorder is sorted. Operations are O(h): O(log n) if balanced, O(n) if skewed. Java's `TreeMap` is a red-black tree (always balanced).
- **Heap:** complete binary tree in an array; parent ≤ children (min-heap). Children of i are 2i + 1 and 2i + 2. Peek O(1), offer/poll O(log n), build O(n).
- **Trie:** one edge per character; O(L) insert/search/prefix query regardless of how many words are stored.

## Graphs

- Represent with an **adjacency list** (O(V + E) space, standard) or matrix (O(V²), O(1) edge test, dense graphs).
- **BFS** finds shortest paths in unweighted graphs (first visit is shortest). **DFS** explores reachability, components, cycles and orderings.
- **Cycle detection:** undirected — a visited neighbour that is not the parent (or union-find); directed — a back edge to a node on the current path (three colours) or Kahn's algorithm leaving nodes.
- **Bipartite** ⇔ 2-colourable ⇔ no odd cycle.
- **Topological order** exists only in a DAG; Kahn's algorithm removes in-degree-0 nodes.
- **Shortest paths:** Dijkstra (non-negative weights, greedy settle), Bellman–Ford (negative weights, V − 1 rounds, detects negative cycles), Floyd–Warshall (all pairs, DP over intermediate vertices).
- **MST:** connects all vertices with minimum total weight. Kruskal = sort edges + union-find; Prim = grow from a vertex with a heap. Both rely on the cut property.
- **Union-find:** merge-only grouping; path compression + union by rank → near-O(1).
- **SCCs** (Kosaraju/Tarjan) and **bridges/articulation points** (low-link values) are advanced DFS applications.

## Searching and Sorting

- **Binary search** needs a monotone yes/no predicate, not necessarily a sorted array; it can search over answers.
- Comparison sorts cannot beat Ω(n log n) in the worst case. Counting, radix and bucket sort beat it by exploiting key structure.
- **Merge sort:** stable, O(n log n) always, O(n) extra. **Quick sort:** in place, O(n log n) expected, O(n²) worst with bad pivots. **Heap sort:** in place, O(n log n) always, not stable.
- **Insertion sort** is O(n) on nearly sorted input and is used for small subarrays inside hybrid sorts.
- Java: `Arrays.sort(int[])` is dual-pivot quick sort; object sorts (`Arrays.sort(T[])`, `Collections.sort`) are stable TimSort.

## Recursion, Backtracking, Divide and Conquer

- **Recursion** = base case + progress toward it; every call costs a stack frame.
- **Backtracking:** choose → explore → unchoose; prune early; record copies of the current path.
- **Divide and conquer:** independent subproblems + combine step; analyse with T(n) = aT(n/b) + f(n).
- If subproblems overlap, divide and conquer becomes exponential — memoise (DP).

## Greedy and Dynamic Programming

- **Greedy** is correct only with the greedy-choice property, proved by an exchange argument. Classic: activity selection (earliest end), fractional knapsack (ratio), Huffman coding.
- **DP** = optimal substructure + overlapping subproblems. Design: state → transition → base cases → order → answer. Time = states × work per state.
- Families: 1D sequences, grids, knapsack (0/1: iterate capacity downward; unbounded: upward), subsequences (LIS, LCS), string DP (edit distance), partitions and intervals, state machines (stocks), trees, bitmasks.
- Space optimisation: keep only the rows/values the transition reads.

## Strings, Bits and Math

- **Pattern matching:** naive O(n × m); KMP uses the LPS (failure) array to never move back in the text — O(n + m); Rabin–Karp compares rolling hashes — O(n + m) expected; Z-array of `p + $ + t` — O(n + m).
- **Bits:** `x & (x − 1)` clears the lowest set bit; `x & −x` isolates it; XOR cancels pairs; masks represent small sets.
- **GCD:** gcd(a, b) = gcd(b, a mod b), O(log min); lcm = a / gcd × b.
- **Sieve** marks multiples from p² for p ≤ √n: O(n log log n). Trial division factorises in O(√n).
- **Modular arithmetic:** reduce after every +, −, ×; division needs an inverse (Fermat a^(p−2) for prime p).
- **Fast exponentiation:** square-and-multiply, O(log e); matrix powers solve linear recurrences in O(k³ log n).

## Range-Query Structures

- **Prefix sums:** O(1) range sums on static arrays. **Difference arrays:** O(1) range updates, read once at the end.
- **Fenwick tree:** prefix sums with point updates, O(log n) each, compact code.
- **Segment tree:** any associative range query with updates, O(log n); lazy propagation for range updates.
- **Sparse table:** O(1) range min/max/gcd on static data after O(n log n) preprocessing (idempotent operations only).
