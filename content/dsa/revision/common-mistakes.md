# Common Mistakes

The bugs that cost the most marks, grouped by where they occur, each with its fix.

## Java Language Pitfalls

- **`==` on objects.** `String`, `Integer` (outside −128 … 127) and other objects compare references. Use `equals`; for boxed numbers compare with `.equals` or unbox.
- **Integer overflow is silent.** Sums of `int`s, `a * b`, `n * (n − 1) / 2`, `a − b` with large values. Use `long`, and cast **before** the operation: `(long) a * b`.
- **Comparator by subtraction.** `(x, y) -> x − y` overflows; use `Integer.compare(x, y)` or `Comparator.comparingInt`.
- **`Math.abs(Integer.MIN_VALUE)`** is still negative.
- **Integer division** truncates toward zero; `−7 / 2 == −3`, and `%` can be negative — use `Math.floorMod` for cyclic indices.
- **`char` arithmetic** yields `int`: `'a' + 1` is 98; cast back with `(char)`.
- **Precedence:** write `(x & 1) == 0`, `(mask >> i) & 1`.
- **`1 << 31` is negative; `1 << 32 == 1`.** Use `1L << k` for 64-bit masks.
- **Strings are immutable:** `s.toUpperCase()` alone changes nothing; concatenation in loops is O(n²).

## Collections Pitfalls

- `List<Integer>.remove(i)` removes by **index**; use `remove(Integer.valueOf(x))` to remove a value.
- `Arrays.asList(arr)` is fixed-size and backed by the array; `List.of(...)` is immutable.
- Modifying a collection while iterating with for-each throws `ConcurrentModificationException`; use an `Iterator`'s `remove` or `removeIf`.
- `PriorityQueue` iteration/`toString` is not sorted; only `poll` order is.
- `HashMap` iteration order is unspecified; use `LinkedHashMap` or `TreeMap` when order matters.
- Arrays as map/set keys use identity; use `List<Integer>`, a `String`, or an encoded `long`.
- Mutating an object while it is a key in a `HashMap`/`HashSet` makes the entry unreachable.
- `java.util.Stack` and `Vector` are legacy (synchronised); prefer `ArrayDeque`. `ArrayDeque` does not accept `null`.
- Changing an element's priority while it is inside a `PriorityQueue` breaks the heap; remove and re-insert, or push a new entry and skip stale ones.

## Off-by-One and Boundaries

- Loop bounds: `i < n` vs `i <= n`; window length `right − left + 1`; last valid start `n − k`.
- Binary search: mixing `while (lo <= hi)` with `hi = mid` (infinite loop); `mid = (lo + hi) / 2` overflow for large bounds.
- Searching for the **last** feasible value: round `mid` up (`lo + (hi − lo + 1) / 2`) when using `lo = mid`.
- Prefix sums: use a length-(n + 1) array with `P[0] = 0`; sum(l..r) = `P[r + 1] − P[l]`.
- Difference arrays: `diff[r + 1] −= v` needs an array of size n + 1.
- Empty input, single element, all equal, all negative — test them explicitly.

## Recursion and Backtracking

- Missing or unreachable base case → `StackOverflowError`.
- Deep recursion (10⁵ levels) overflows Java's default stack; use iteration or an explicit stack.
- Adding the mutable `path` itself to results instead of a copy.
- Forgetting to undo a choice (or to unmark a visited cell) before the next branch.
- Duplicate results when the input has duplicates — sort and skip equal siblings.
- Memo arrays filled with 0 when 0 is a valid answer — use −1 or a `Long`/`Boolean` sentinel.

## Graphs

- Marking visited on **dequeue** in BFS (states enqueued many times).
- Using BFS for weighted graphs or Dijkstra with negative edges.
- Forgetting both directions for undirected edges.
- Directed cycle detection with a single visited set (needs "on current path" state).
- Not checking `order.size() == n` after Kahn's algorithm.
- Dijkstra without skipping stale heap entries — or with a `visited` set marked at push time (wrong).
- `dist[u] + w` overflowing when `dist[u]` is `Integer.MAX_VALUE`.

## Sorting and Searching

- Assuming `Arrays.sort(int[])` is stable or worst-case O(n log n) (it is dual-pivot quick sort; stability is irrelevant for primitives, but the worst case is not guaranteed).
- Binary searching unsorted data, or a predicate that is not monotone.
- Quick sort with a fixed first/last pivot on sorted input → O(n²).
- `Arrays.binarySearch` on a missing key returns `−(insertionPoint) − 1`, not −1.

## Greedy and DP

- Trusting greedy without an exchange argument or a counterexample check.
- A DP state that forgets information the future depends on (holding a stock, last colour, remaining capacity).
- Wrong evaluation order (reading `dp` values that are not computed yet).
- 0/1 knapsack in 1D iterating capacity upward (reuses items).
- Taking `% MOD` only at the end — overflow happens long before; also normalise negatives after subtraction.
- Initialising min-DP with `Integer.MAX_VALUE` and then adding to it (overflow) — use a large sentinel like `Integer.MAX_VALUE / 2`.

## Strings and Bits

- KMP: falling back with `lps[len]` instead of `lps[len − 1]`; resetting `j = 0` after a match instead of `lps[m − 1]`.
- Rabin–Karp: forgetting `+ mod` after subtracting the leaving character; trusting a hash match without verification.
- Z algorithm: separator character that occurs in the input.
- Using `>>` where `>>>` is needed for unsigned behaviour.
- Sieve: starting the inner loop at p (crosses out p itself) or overflowing `p * p` in `int`.
