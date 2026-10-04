# DSA Conceptual Questions — Interview Questions

## Beginner

### Q1. When would you choose a linked list over an array (or `ArrayList`)?

<details>
<summary>Answer</summary>

Rarely — only when you insert or delete in the middle **at a position you already hold a reference to**, and never need random access.

An array stores elements contiguously, so `get(i)` is O(1) and scanning is cache-friendly; inserting in the middle shifts elements, O(n). A linked list inserts or removes in O(1) once you have the node, but reaching position i takes O(i) and every node costs extra memory for pointers. In practice `ArrayList`/`ArrayDeque` win for most workloads; linked structures shine inside other structures — LRU caches (hash map + doubly linked list), adjacency lists, free lists. See [Linked List](../../data-structures/linked-list/content.md).

</details>

### Q2. What is the difference between a stack and a queue? Give a real use of each.

<details>
<summary>Answer</summary>

A **stack** is last-in, first-out (LIFO); a **queue** is first-in, first-out (FIFO).

Stack uses: the call stack, undo, matching brackets, DFS. Queue uses: task scheduling in arrival order, buffering, BFS (it processes nodes in order of distance). In Java, `ArrayDeque` implements both: `push`/`pop` for a stack, `offer`/`poll` for a queue.

</details>

### Q3. Why is a `HashMap` lookup O(1) on average?

<details>
<summary>Answer</summary>

Because the key's hash code is turned directly into a bucket index, and the table is resized to keep the number of entries per bucket small on average.

`get(k)` computes `hash(k)`, maps it to one of the bucket array's slots (O(1) arithmetic), then compares k with the few entries in that bucket using `equals`. Java resizes (doubling the bucket array) when size exceeds capacity × load factor (0.75 by default), so the average bucket length stays constant. If many keys collide, a bucket grows: Java 8+ turns long chains into red-black trees, making the worst case O(log n) per operation instead of O(n). See [Hashing](../../data-structures/hashing/content.md).

</details>

### Q4. What does it mean for a sort to be stable, and when does it matter?

<details>
<summary>Answer</summary>

A stable sort keeps elements with equal keys in their original relative order.

It matters when sorting by several keys in passes, or when the input order carries meaning: sort employees by name, then stably by department, and each department stays alphabetical. Merge sort, insertion sort and counting sort are stable; quick sort, heap sort and selection sort (as usually written) are not. Java's `Arrays.sort` on objects (TimSort) is stable; on primitives (dual-pivot quick sort) stability is irrelevant because equal primitives are indistinguishable.

</details>

### Q5. What is the difference between BFS and DFS, and when do you use each?

<details>
<summary>Answer</summary>

BFS explores level by level with a queue; DFS goes as deep as possible first, with recursion or a stack.

Use **BFS** for shortest paths in unweighted graphs (the first visit is the shortest) and level-order processing. Use **DFS** for reachability, connected components, cycle detection, topological order and whole-region/subtree properties, and when you need to backtrack. Both are O(V + E). BFS may hold a whole level in memory; DFS holds one path (but deep recursion can overflow the Java stack).

</details>

## Intermediate

### Q6. Why can quick sort take O(n²) time, and how is that avoided?

<details>
<summary>Answer</summary>

When every pivot is the smallest or largest element, each partition removes only one element, giving n + (n − 1) + … = O(n²) comparisons.

With a "first element" pivot this happens on already sorted input. It is avoided by choosing a random pivot or the median of three, which makes very unbalanced splits unlikely, giving O(n log n) expected time; introsort switches to heap sort if recursion gets too deep, guaranteeing O(n log n). Three-way partitioning handles many duplicates. See [Quick Sort](../../algorithms/quick-sort/content.md).

</details>

### Q7. Why does Dijkstra's algorithm fail with negative edge weights?

<details>
<summary>Answer</summary>

Dijkstra finalises a node when it is popped with the smallest tentative distance, assuming no later path can be cheaper. A negative edge breaks that assumption.

Example: edges A→B (2), A→C (3), C→B (−2). Dijkstra pops B with distance 2 and settles it; later C (3) offers 3 − 2 = 1 < 2, but B is already final. Use Bellman–Ford (O(V × E)) for negative weights; it also detects negative cycles. See [Dijkstra](../../algorithms/dijkstra/content.md) and [Bellman–Ford](../../algorithms/bellman-ford/content.md).

</details>

### Q8. Heap or balanced BST (`PriorityQueue` or `TreeMap`) — how do you choose?

<details>
<summary>Answer</summary>

Use a heap when you only need repeated access to the minimum (or maximum); use a balanced BST when you need ordered operations beyond the extreme.

A binary heap gives O(1) peek, O(log n) insert/poll, builds in O(n), and is a compact array. But finding or removing an arbitrary element is O(n), and it cannot answer floor/ceiling or iterate in order. A red-black tree (`TreeMap`/`TreeSet`) gives O(log n) insert, delete, search, min, max, floor, ceiling and sorted iteration — at a higher constant and memory cost.

</details>

### Q9. What is the difference between memoisation and tabulation?

<details>
<summary>Answer</summary>

Both store subproblem answers; memoisation is top-down (recursion plus a cache), tabulation is bottom-up (loops filling a table in dependency order).

Memoisation is easy to write from the recurrence and computes only the states actually reached, but it uses recursion (stack depth, call overhead). Tabulation avoids recursion, makes the evaluation order explicit, and often allows space optimisation (keeping only the last row). Same time complexity in general: number of states × work per state. See [Dynamic Programming](../../algorithms/dynamic-programming/content.md).

</details>

### Q10. How do you decide between a greedy algorithm and dynamic programming?

<details>
<summary>Answer</summary>

Try to prove the greedy choice is safe (an exchange argument) and try to break it with a small counterexample; if it breaks, use DP.

Greedy commits to one locally best choice and never revisits it — fast, but only correct with the greedy-choice property (activity selection by earliest end time, fractional knapsack). DP considers every choice for each subproblem. Coin change shows the difference: with coins {1, 3, 4} and amount 6, greedy picks 4 + 1 + 1 (3 coins), DP finds 3 + 3 (2 coins). Counting problems ("how many ways") are always DP. See [Greedy Algorithms](../../algorithms/greedy-algorithms/content.md).

</details>

### Q11. Why do `HashMap`, `LinkedHashMap` and `TreeMap` iterate in different orders?

<details>
<summary>Answer</summary>

Because they store entries differently: `HashMap` by bucket, `LinkedHashMap` with an extra linked list in insertion (or access) order, `TreeMap` in a red-black tree sorted by key.

So `HashMap` order depends on hash codes and capacity and can change after a resize — never rely on it. `LinkedHashMap` costs a little extra memory for predictable insertion order (and access order, used for LRU caches). `TreeMap` costs O(log n) per operation but gives sorted keys and navigation methods (`floorKey`, `ceilingKey`, `headMap`). See [Java Maps and Sets](../../fundamentals/java-maps-and-sets/content.md).

</details>

## Advanced

### Q12. How does union-find achieve nearly constant time per operation?

<details>
<summary>Answer</summary>

By combining **union by rank/size** (attach the shorter tree under the taller) with **path compression** (point every visited node directly at the root during `find`).

Union by rank alone keeps trees O(log n) tall. Path compression flattens paths as they are used, so later finds are short. Together the amortized cost per operation is O(α(n)), where α is the inverse Ackermann function — at most 4–5 for any practical n. See [Disjoint Set Union](../../data-structures/disjoint-set-union/content.md).

</details>

### Q13. Why can't binary search be done efficiently on a linked list, and what structure fixes that?

<details>
<summary>Answer</summary>

Binary search needs O(1) access to the middle element; a linked list needs O(n) steps to reach it, so each "halving" step costs linear time and the total is O(n), no better than a linear scan.

Structures that keep sorted data with fast search and cheap insertion: balanced BSTs (O(log n) per operation) and **skip lists** (linked lists with express lanes of randomly chosen nodes, O(log n) expected) — Java's `ConcurrentSkipListMap` uses the latter.

</details>

### Q14. Trie or hash set for a dictionary of words — what are the trade-offs?

<details>
<summary>Answer</summary>

A hash set answers "is this exact word present?" in O(L) expected time with less memory; a trie also answers prefix questions ("any word starting with `pre`?", autocomplete, longest common prefix) in O(L) and supports ordered traversal.

Trie costs: many nodes (each with a child array or map), so more memory, and pointer-chasing is slower than hashing for exact lookups. Choose a trie when prefix queries, wildcard matching or lexicographic enumeration matter (word search in grids, autocomplete); otherwise a `HashSet<String>`. See [Trie](../../data-structures/trie/content.md).

</details>

### Q15. Why does Java 8's `HashMap` turn some buckets into trees, and when does it do it?

<details>
<summary>Answer</summary>

To bound the worst case: a bucket with many colliding keys would make lookups O(n); as a red-black tree it is O(log n).

A bucket is "treeified" when its chain exceeds 8 entries **and** the table has at least 64 buckets (otherwise the table is resized instead); it turns back into a list when it shrinks to 6 or fewer. Ordering within the tree uses hash values and, if keys are `Comparable`, `compareTo`. This defends against poor hash functions and deliberate collision attacks; with good hashes it rarely triggers.

</details>
