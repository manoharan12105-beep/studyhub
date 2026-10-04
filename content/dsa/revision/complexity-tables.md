# Complexity Tables

Costs organised by what you actually type in Java and by the reasoning behind them. The full structure-by-structure tables live in the Complexity Reference topic.

## Java Collection Methods

| Call | Time | Watch out |
|------|------|-----------|
| `ArrayList.get(i)`, `set(i, x)` | O(1) | |
| `ArrayList.add(x)` | O(1) amortized | a single call can be O(n) when it resizes |
| `ArrayList.add(0, x)`, `remove(0)` | O(n) | shifts every element — use `ArrayDeque` for front operations |
| `ArrayList.contains(x)`, `indexOf(x)` | O(n) | linear scan; use a `HashSet` for membership |
| `LinkedList.get(i)` | O(n) | never index a linked list in a loop |
| `ArrayDeque` `push/pop/offer/poll/peekFirst/peekLast` | O(1) amortized | `contains` is O(n) |
| `HashMap` `get/put/remove/containsKey` | O(1) average | worst O(log n) in a treeified bucket; `containsValue` is O(n) |
| `TreeMap` `get/put/remove/floorKey/ceilingKey/firstKey` | O(log n) | |
| `PriorityQueue` `offer/poll` | O(log n) | |
| `PriorityQueue.peek()` | O(1) | |
| `PriorityQueue` `remove(x)`, `contains(x)` | O(n) | prefer lazy deletion |
| `new PriorityQueue<>(collection)` | O(n) | heapify; n offers would be O(n log n) |
| `Collections.sort`, `List.sort`, `Arrays.sort(T[])` | O(n log n) | TimSort, stable; O(n) if already sorted |
| `Arrays.sort(int[])` | O(n log n) expected | dual-pivot quick sort, not stable (irrelevant for primitives) |
| `Arrays.binarySearch`, `Collections.binarySearch` | O(log n) | on a `LinkedList` the latter degrades to O(n) traversal |
| `Arrays.fill`, `Arrays.copyOf`, `clone()` | O(n) | |
| `Collections.reverse`, `Collections.swap` | O(n), O(1) | |

## Java String Methods

| Call | Time | Watch out |
|------|------|-----------|
| `charAt(i)`, `length()` | O(1) | |
| `substring(a, b)` | O(b − a) | copies characters (since Java 7u6) |
| `equals`, `compareTo` | O(n) | `==` compares references, not contents |
| `indexOf(sub)`, `contains(sub)` | O(n × m) worst | simple scan; KMP/Z guarantee O(n + m) |
| `s1 + s2` | O(len1 + len2) | in a loop this becomes O(n²) |
| `StringBuilder.append` | O(1) amortized per char | |
| `StringBuilder.insert(0, x)`, `deleteCharAt(0)` | O(n) | shifts the buffer |
| `toCharArray()`, `split`, `String.valueOf(char[])` | O(n) | |
| `hashCode()` | O(n) first call, then cached | |

## From Code Shape to Complexity

| Code shape | Complexity | Example |
|------------|------------|---------|
| Single loop over n | O(n) | linear search |
| Two nested loops, inner bound depends on outer (`j < i`) | O(n²) | bubble sort |
| Loop where the variable doubles or halves | O(log n) | binary search, `while (n > 0) n /= 2` |
| Outer loop n, inner loop halving | O(n log n) | Fenwick build by n updates |
| Two pointers / sliding window where each pointer only moves forward | O(n) | variable window |
| Stack where each element is pushed and popped once | O(n) | monotonic stack |
| Recursion with one call on n/2 and O(1) work | O(log n) | binary search, fast power |
| Two calls on n/2 and O(n) work | O(n log n) | merge sort |
| Two calls on n/2 and O(1) work | O(n) | tree traversal by halves |
| Two calls on n − 1 | O(2ⁿ) | naive Fibonacci (precisely Θ(φⁿ)) |
| Loop over all subsets | O(2ⁿ × n) | bitmask enumeration |
| Loop over all permutations | O(n! × n) | permutation backtracking |
| Memoised recursion | states × work per state | DP |

## Master Theorem Shortcuts

For T(n) = a·T(n/b) + Θ(nᵈ):

| Condition | Result | Example |
|-----------|--------|---------|
| d > log_b a | Θ(nᵈ) | T(n) = 2T(n/2) + n² → Θ(n²) |
| d = log_b a | Θ(nᵈ log n) | T(n) = 2T(n/2) + n → Θ(n log n) |
| d < log_b a | Θ(n^(log_b a)) | T(n) = 4T(n/2) + n → Θ(n²); Karatsuba 3T(n/2) + n → Θ(n^1.585) |

Not covered: T(n) = T(n − 1) + f(n) (unroll: sum of f), unequal splits (use a recursion tree).

## Average, Amortized and Worst Case

| Operation | Typical bound | Kind | Worst single operation |
|-----------|---------------|------|------------------------|
| `HashMap.get` | O(1) | average (expected) | O(log n) treeified bucket, O(n) without treeification |
| `HashMap.put` | O(1) | average **and** amortized (resizing) | O(n) during a resize |
| `ArrayList.add` | O(1) | amortized | O(n) during a resize |
| Quick sort | O(n log n) | expected (random pivot) | O(n²) |
| Quickselect | O(n) | expected | O(n²) |
| Union-find with both optimisations | O(α(n)) | amortized | O(log n) for one find |
| Two-stack queue `poll` | O(1) | amortized | O(n) for one transfer |
| Rabin–Karp | O(n + m) | expected | O(n × m) with many collisions |
| Bucket sort on uniform data | O(n) | average | O(n²) if all keys land in one bucket |

## Graph and DP Quick Costs

| Task | Cost |
|------|------|
| BFS / DFS / topological sort / SCC / bridges | O(V + E) |
| Dijkstra (binary heap) | O((V + E) log V) |
| Bellman–Ford | O(V × E) |
| Floyd–Warshall | O(V³) time, O(V²) space |
| Kruskal / Prim | O(E log E) / O(E log V) |
| Grid BFS/DFS (R × C) | O(R × C) |
| DP over prefixes of two strings | O(n × m), O(min(n, m)) space with rolling rows |
| 0/1 knapsack | O(n × W) time, O(W) space — pseudo-polynomial |
| Interval DP | O(n³) typical |
| Bitmask DP over n items | O(2ⁿ × n) to O(2ⁿ × n²) |
