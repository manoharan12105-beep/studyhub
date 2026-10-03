# Kruskal's Algorithm (Minimum Spanning Tree)

## Definition

**Kruskal's algorithm** builds a [minimum spanning tree](../prims-algorithm/content.md) by considering edges in **increasing order of weight** and adding each edge that does **not create a cycle**, using a [Disjoint Set Union](../../data-structures/disjoint-set-union/content.md) to check whether its endpoints are already connected. It stops after V − 1 edges. Sorting dominates: **O(E log E)**.

## Why It Matters

Kruskal is the natural MST algorithm when the input is an **edge list**, and it is the classic application of union-find — "DSU ↔ Kruskal" is a standard interview connection. It also adapts easily to related problems: minimum spanning forests, clustering into k groups, and checking whether a particular edge must be in every MST.

## Prerequisites

- [Disjoint Set Union](../../data-structures/disjoint-set-union/content.md)
- [Prim's Algorithm](../prims-algorithm/content.md) — MST definition and the cut property.

## Intuition

Take the cheapest cable in the whole catalogue; install it unless both buildings are already connected through installed cables (then it would only form a loop). Repeat with the next cheapest. Each accepted edge is the cheapest edge between the two groups it joins, so the cut property says it belongs to an MST.

## How It Works

1. Sort all edges by weight.
2. Initialise a DSU with every vertex in its own set.
3. For each edge (u, v, w) in sorted order: if `find(u) ≠ find(v)`, add the edge to the MST and `union(u, v)`; otherwise skip it (it would close a cycle).
4. Stop when V − 1 edges are chosen. Fewer than V − 1 after all edges → the graph is disconnected (you have a minimum spanning **forest**).

## Visual Explanation

```text
Edges sorted: 0-1 (2), 1-2 (3), 1-4 (5), 0-3 (6), 2-4 (7), 1-3 (8), 3-4 (9)

0-1 (2): sets {0}{1} differ → take      components {0,1} {2} {3} {4}
1-2 (3): differ → take                   {0,1,2} {3} {4}
1-4 (5): differ → take                   {0,1,2,4} {3}
0-3 (6): differ → take                   {0,1,2,3,4}   4 edges = V − 1 → stop
(2-4, 1-3, 3-4 would all close cycles)
MST weight 16 — the same total as Prim on this graph
```

## Pseudocode

```pseudocode
kruskal(V, edges):
    sort edges by weight
    dsu ← new DSU(V); total ← 0; count ← 0
    for (u, v, w) in edges:
        if dsu.union(u, v):          // true if u and v were in different sets
            total ← total + w; count ← count + 1
            if count = V − 1: break
    return count = V − 1 ? total : "disconnected"
```

## Java Implementation

```java
import java.util.*;

public class Kruskal {

    static int[] parent, size;

    static int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];          // path halving
            x = parent[x];
        }
        return x;
    }

    static boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        size[ra] += size[rb];
        return true;
    }

    // edges: {u, v, weight}; returns MST weight or -1 if disconnected.
    static long mst(int n, int[][] edges, List<String> chosen) {
        parent = new int[n];
        size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
        int[][] sorted = edges.clone();
        Arrays.sort(sorted, Comparator.comparingInt(e -> e[2]));
        long total = 0;
        int used = 0;
        for (int[] e : sorted) {
            if (union(e[0], e[1])) {                 // joins two different components
                total += e[2];
                chosen.add(e[0] + "-" + e[1] + "(" + e[2] + ")");
                if (++used == n - 1) break;
            }
        }
        return used == n - 1 ? total : -1;
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1, 2}, {1, 2, 3}, {0, 3, 6}, {1, 3, 8}, {1, 4, 5}, {2, 4, 7}, {3, 4, 9}};
        List<String> chosen = new ArrayList<>();
        System.out.println("MST weight " + mst(5, edges, chosen) + " using " + chosen);
        System.out.println("disconnected graph: " + mst(4, new int[][] {{0, 1, 1}, {2, 3, 1}}, new ArrayList<>()));
    }
}
```

**Output:**

```text
MST weight 16 using [0-1(2), 1-2(3), 1-4(5), 0-3(6)]
disconnected graph: -1
```

## Dry Run

DSU parent arrays while processing the sorted edges (union by size; ties attach the second root under the first):

| Edge | find(u), find(v) | Action | parent (0..4) |
|------|------------------|--------|---------------|
| start | — | — | 0 1 2 3 4 |
| 0-1 (2) | 0, 1 | union | 0 0 2 3 4 |
| 1-2 (3) | 0, 2 | union | 0 0 0 3 4 |
| 1-4 (5) | 0, 4 | union | 0 0 0 3 0 |
| 0-3 (6) | 0, 3 | union → 4 edges, stop | 0 0 0 0 0 |

## Complexity Analysis

| Step | Time |
|------|------|
| Sort edges | O(E log E) = O(E log V) (since E ≤ V², log E ≤ 2 log V) |
| E union/find operations | O(E α(V)) |
| **Total** | **O(E log E)** |

**Space:** O(V) for the DSU plus O(E) for the sorted edges.

## Properties

- Greedy; correctness from the cut property (each accepted edge is the lightest across the cut between its two components).
- Maintains a forest that merges into one tree.
- Distinct weights ⇒ unique MST (Prim and Kruskal then return the same edges).

## Variations

- **Clustering into k groups:** stop when k components remain (skip the k − 1 most expensive MST edges).
- **Critical edges** (in every MST): removing the edge increases the MST weight; **pseudo-critical** (in some MST): forcing it in first keeps the MST weight.
- **Minimum spanning forest** of a disconnected graph — just do not require V − 1 edges.
- **Maximum spanning tree** — sort descending.

## Comparison

| | Kruskal | Prim |
|---|---------|------|
| Input | edge list | adjacency list / matrix |
| Core structure | sort + DSU | priority queue (or key array) |
| Time | O(E log E) | O(E log V) heap / O(V²) array |
| Sparse graphs | excellent | good |
| Dense / complete graphs | sorting ~V² edges is costly | O(V²) array version is best |

## Edge Cases

- Disconnected graph — report failure or return the forest.
- Equal weights — any order among them yields an MST (possibly different edges, same total).
- Self-loops — always skipped (endpoints already connected).

## Advantages

- Simple with a DSU; works directly on edge lists; easy to adapt (forests, k clusters).

## Disadvantages

- Must sort all edges first; slower than Prim on dense graphs.

## When to Use

- Input given as edges; sparse graphs; problems combining "sorted by cost" with "connect components".

## Common Mistakes

- Using a DFS cycle check per edge (O(V) each → O(E × V)) instead of a DSU.
- Forgetting to stop or check for V − 1 edges.
- Sorting with a subtraction comparator that overflows on large weights.

## Key Takeaways

- Sort edges; add each edge that joins two different DSU components; stop at V − 1 edges.
- O(E log E), dominated by sorting; DSU makes cycle checks O(α(V)).
- Kruskal for edge lists and sparse graphs; Prim (array) for dense graphs.
