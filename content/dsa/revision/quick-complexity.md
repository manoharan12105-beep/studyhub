# Complexities to Know

The numbers you must be able to say instantly. One line each.

## Budget

- **~10⁸ simple operations per second** in Java. n ≤ 10⁵ → aim for O(n log n); n ≤ 20 → exponential is fine; n ≤ 500 → O(n³).
- log₂(10³) ≈ 10, log₂(10⁶) ≈ 20, log₂(10⁹) ≈ 30, 2²⁰ ≈ 10⁶, 10! ≈ 3.6 × 10⁶.

## Structures

- **Array:** access O(1); insert/delete middle O(n). **ArrayList append:** O(1) amortized.
- **Linked list:** access O(n); insert/delete at a known node O(1).
- **Stack / queue / deque:** O(1) per operation.
- **HashMap / HashSet:** O(1) average; O(log n) worst (Java 8+ tree bins).
- **TreeMap / TreeSet:** O(log n) for everything, including floor/ceiling.
- **Heap:** peek O(1); offer/poll O(log n); build O(n); remove(x) O(n).
- **BST:** O(h) — O(log n) balanced, O(n) skewed.
- **Trie:** O(L) per word or prefix.
- **Union-find:** O(α(n)) ≈ O(1) amortized with both optimisations.
- **Fenwick / segment tree:** O(log n) query and update. **Sparse table:** O(1) query, O(n log n) build.

## Algorithms

- **Binary search:** O(log n). **Linear search:** O(n).
- **Merge sort:** O(n log n) always, O(n) space, stable.
- **Quick sort:** O(n log n) expected, O(n²) worst, in place, not stable.
- **Heap sort:** O(n log n) always, O(1) space, not stable.
- **Insertion sort:** O(n²) worst, O(n) nearly sorted. **Counting sort:** O(n + k).
- **BFS / DFS / topological sort:** O(V + E).
- **Dijkstra:** O((V + E) log V). **Bellman–Ford:** O(V × E). **Floyd–Warshall:** O(V³).
- **Kruskal:** O(E log E). **Prim:** O(E log V).
- **KMP / Z:** O(n + m). **Rabin–Karp:** O(n + m) expected. **Naive matching:** O(n × m).
- **GCD:** O(log min). **Sieve:** O(n log log n). **Trial division:** O(√n). **Fast power:** O(log e).
- **Subsets:** O(2ⁿ × n). **Permutations:** O(n! × n).
- **LCS / edit distance:** O(n × m). **0/1 knapsack:** O(n × W). **LIS:** O(n log n).
- **Two pointers / sliding window / monotonic stack:** O(n) total.
