# Definitions and Properties

Precise one-line definitions and the properties interviewers check.

## Terms

- **Stable sort:** equal keys keep their input order.
- **In-place:** O(1) (or O(log n)) extra memory besides the input.
- **Amortized cost:** average cost per operation over any sequence of operations, guaranteed.
- **Complete binary tree:** every level full except possibly the last, filled left to right (heaps).
- **Full binary tree:** every node has 0 or 2 children. **Perfect:** full and all leaves at the same depth.
- **Balanced tree:** height O(log n).
- **DAG:** directed graph without cycles — exactly the graphs with a topological order.
- **Bipartite graph:** vertices split into two sides with every edge crossing — no odd cycle.
- **Spanning tree:** connects all V vertices with V − 1 edges, no cycle.
- **Strongly connected component:** maximal set of vertices each reachable from every other.
- **Bridge:** edge whose removal disconnects the graph. **Articulation point:** such a vertex.
- **Optimal substructure:** an optimal solution contains optimal solutions to subproblems.
- **Overlapping subproblems:** the same subproblem recurs — memoise it.
- **Greedy-choice property:** some optimal solution starts with the greedy choice.

## Properties

- **BST:** left subtree < node < right subtree; inorder traversal is sorted.
- **Heap:** parent ≤ children (min-heap); array children 2i + 1, 2i + 2; parent (i − 1) / 2.
- A tree with n nodes has **n − 1 edges**; a binary tree of height h has at most **2ʰ⁺¹ − 1** nodes.
- Leaves of a complete tree stored in an array start at index **n / 2**.
- Undirected graph: **Σ degrees = 2E**.
- Dijkstra requires **non-negative weights**; Bellman–Ford needs **V − 1 rounds** and detects negative cycles with one more.
- MST **cut property:** the lightest edge across any cut belongs to some MST.
- Comparison sorting needs **Ω(n log n)** comparisons in the worst case.
- **Stable:** merge, insertion, bubble, counting, radix, TimSort. **Not stable:** quick, heap, selection.
- **In place:** quick, heap, insertion, selection, bubble. **Not:** merge (arrays), counting, radix.
- XOR: x ^ x = 0, x ^ 0 = x, order does not matter.
- `x & (x − 1)` drops the lowest set bit; `x & −x` keeps only it.
- gcd(a, b) × lcm(a, b) = a × b.
- Fermat: a^(p−1) ≡ 1 (mod p) for prime p not dividing a → inverse a^(p−2).
