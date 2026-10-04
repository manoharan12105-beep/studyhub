# Interview Traps

Questions and follow-ups designed to catch half-understood answers, with what a precise answer says. Also the process mistakes that lose otherwise good interviews.

## Complexity Traps

| Trap question | Precise answer |
|---------------|----------------|
| "Is `HashMap.get` O(1)?" | Average O(1); worst case O(log n) in Java 8+ (treeified buckets), O(n) in a plain chained table. |
| "Is `ArrayList.add` O(1)?" | Amortized O(1); one call can be O(n) when the array grows. |
| "Is quick sort O(n log n)?" | Expected, with random pivots; worst case O(n²). Merge sort and heap sort guarantee O(n log n). |
| "Your loop has a `while` inside a `for` — so O(n²)?" | Not if the inner pointer never moves back: total inner iterations ≤ n → O(n) (amortized). |
| "What is the space of your recursive solution?" | Include the call stack: O(depth) — O(n) for a linked list or skewed tree, O(log n) for balanced recursion. |
| "Building a heap is O(n log n), right?" | Bottom-up heapify is O(n); n separate inserts are O(n log n). |
| "Is O(n × W) knapsack polynomial?" | Pseudo-polynomial: W is a value, exponential in its number of bits. |
| "What is BFS's complexity?" | O(V + E) with adjacency lists; O(V²) with a matrix. |
| "Sorting strings is O(n log n)?" | O(n log n) comparisons, each up to O(L): O(L × n log n). |

## Correctness Traps

| Trap | What to say |
|------|-------------|
| "Why not just use Dijkstra?" (negative edges present) | Dijkstra settles nodes permanently; a later negative edge could lower a settled distance. Use Bellman–Ford. |
| "Can greedy solve coin change?" | Only for canonical coin systems (like 1, 5, 10, 25). Counterexample {1, 3, 4}, amount 6: greedy 3 coins, optimal 2. Use DP. |
| "Is your sort stable?" | Name it: merge/insertion/counting/TimSort are stable; quick/heap/selection are not. |
| "Does your sliding window handle negatives?" | A sum-based variable window needs non-negative values; with negatives use prefix sums + hash map. |
| "What if the BST is skewed?" | Operations become O(n); balanced trees (`TreeMap`) guarantee O(log n). |
| "Can union-find detect cycles in a directed graph?" | No — it models undirected connectivity; use three-colour DFS or Kahn's algorithm. |
| "Is DFS a shortest-path algorithm?" | No, not even for unweighted graphs — BFS is. |
| "Does `Arrays.asList(intArray)` give a list of ints?" | For `int[]` it gives `List<int[]>` with one element; use `Integer[]` or streams. |
| "Is binary search only for sorted arrays?" | It needs a monotone predicate; it also searches answer spaces. |

## Java Behaviour Traps

- `"a" + "b" == "ab"` is true (compile-time constant), but a string built at run time is a different object — always use `equals`.
- `Integer a = 127, b = 127; a == b` is true (cached); with 128 it is false.
- Java passes references by value: a method can mutate the caller's array but cannot make the caller's variable point elsewhere.
- `list.remove(1)` on a `List<Integer>` removes index 1, not the value 1.
- `HashSet<int[]>` cannot find an equal-content array.
- A comparator `(a, b) -> a − b` can overflow; `Integer.compare` cannot.

## Design-Question Traps

| Prompt | Expected direction |
|--------|-------------------|
| LRU cache, O(1) operations | `HashMap` + doubly linked list (or `LinkedHashMap` with access order — then be ready to build it yourself) |
| Insert/delete/getRandom in O(1) | `ArrayList` + `HashMap` of indices; delete by swapping with the last element |
| Median of a stream | two heaps (max-heap lower half, min-heap upper half), sizes differ by ≤ 1 |
| Top k frequent items | count map + size-k heap (O(n log k)) or bucket by frequency (O(n)) |
| Autocomplete | trie (or sorted list + binary search for small static sets) |
| Rate limiter / recent requests | queue of timestamps, evict expired from the front |

## Process Traps

- **Coding before clarifying.** Ask about input sizes, duplicates, negatives, empty input and output format first.
- **Skipping the brute force.** State it with its complexity, then optimise — it shows understanding and gives a fallback.
- **Silent thinking.** Narrate the approach; interviewers grade reasoning.
- **Not testing.** Dry-run your code on a small example and on edge cases before saying "done".
- **Hand-waving complexity.** Justify it: loop counts, recursion depth, data-structure costs.
- **Defending a bug.** When a test fails, trace calmly and fix the root cause; do not patch symptoms.
- **Over-engineering.** Meet the constraints; extra cleverness adds risk without credit.
