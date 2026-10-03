# Prim's Algorithm (Minimum Spanning Tree)

## Definition

A **spanning tree** of a connected, undirected, weighted graph is a subset of V − 1 edges that connects all V vertices without cycles. A **minimum spanning tree (MST)** is a spanning tree with the smallest total edge weight. **Prim's algorithm** grows one tree from a start vertex, each step adding the **cheapest edge that connects the tree to a vertex outside it**. With a binary heap it runs in **O(E log V)**.

## Why It Matters

MSTs give the cheapest way to connect everything: laying cable or pipes between buildings, designing networks, clustering (remove the most expensive MST edges), and approximating harder problems such as the travelling salesman. Prim and [Kruskal](../kruskals-algorithm/content.md) are the two standard MST algorithms; interviews ask you to implement one and explain why the greedy choice is correct.

## Prerequisites

- [Graph](../../data-structures/graph/content.md) — weighted adjacency lists.
- [Heap](../../data-structures/heap/content.md) and [Greedy Algorithms](../greedy-algorithms/content.md).

## Intuition

Start a network at one building. At each step, look at all cables from connected buildings to unconnected ones and lay the cheapest. Nothing cheaper can ever join that unconnected building to the network later — so this cable belongs to some cheapest network.

### The cut property (why greedy works)

Split the vertices into any two groups (a **cut**). The lightest edge crossing the cut belongs to some MST. Proof by exchange: take an MST without that edge e; adding e creates a cycle, which must cross the cut through another edge f with weight ≥ e. Removing f gives a spanning tree no heavier — so an MST containing e exists. Prim always chooses the lightest edge across the cut (tree | rest); Kruskal's choice is also justified by the cut property.

## How It Works

1. Mark the start vertex as in the tree; push all its edges into a min-heap keyed by weight.
2. While the tree has fewer than V vertices and the heap is not empty:
   1. Pop the lightest edge (w, v). If v is already in the tree, skip it (lazy deletion).
   2. Add v and the edge's weight to the tree; push all edges from v to vertices not yet in the tree.
3. If fewer than V vertices were added, the graph is disconnected (no spanning tree; Prim from one start gives the MST of that component only).

**Dense graphs** (E ≈ V²): an array version — keep `key[v]` = cheapest edge from the tree to v, pick the minimum key by scanning — runs in O(V²) without a heap, which is better when E is close to V².

## Visual Explanation

```text
        2         3
   0 ───── 1 ───── 2
   │      / \      │
 6 │   8 /   \ 5   │ 7
   │    /     \    │
   3 ─────────── 4
          9

start 0: candidate edges 0-1 (2), 0-3 (6)
take 0-1 (2)  → tree {0,1}       candidates: 0-3 (6), 1-2 (3), 1-3 (8), 1-4 (5)
take 1-2 (3)  → tree {0,1,2}     + 2-4 (7)
take 1-4 (5)  → tree {0,1,2,4}   + 4-3 (9)
take 0-3 (6)  → tree {0,1,2,3,4} done
MST weight = 2 + 3 + 5 + 6 = 16   (edges 0-1, 1-2, 1-4, 0-3)
```

## Pseudocode

```pseudocode
prim(graph, start):
    inTree[all] ← false; total ← 0
    heap ← [(0, start)]
    while heap not empty:
        (w, v) ← heap.popMin()
        if inTree[v]: continue
        inTree[v] ← true; total ← total + w
        for (u, weight) in edges(v):
            if not inTree[u]: heap.push((weight, u))
    return total        // check that every vertex was added
```

## Java Implementation

```java
import java.util.*;

public class Prim {

    // adj.get(u) holds {v, weight}; returns the MST weight, or -1 if the graph is disconnected.
    static long mstWeight(List<List<int[]>> adj, List<String> chosenEdges) {
        int n = adj.size();
        boolean[] inTree = new boolean[n];
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));   // {weight, to, from}
        heap.offer(new int[] {0, 0, -1});
        long total = 0;
        int added = 0;
        while (!heap.isEmpty() && added < n) {
            int[] top = heap.poll();
            int w = top[0], v = top[1], from = top[2];
            if (inTree[v]) continue;                       // stale: v joined the tree via a cheaper edge
            inTree[v] = true;
            added++;
            total += w;
            if (from != -1) chosenEdges.add(from + "-" + v + "(" + w + ")");
            for (int[] e : adj.get(v)) {
                if (!inTree[e[0]]) heap.offer(new int[] {e[1], e[0], v});
            }
        }
        return added == n ? total : -1;
    }

    // O(V^2) version for dense graphs given as a weight matrix (0 = no edge).
    static long mstDense(int[][] w) {
        int n = w.length;
        long[] key = new long[n];
        Arrays.fill(key, Long.MAX_VALUE);
        boolean[] inTree = new boolean[n];
        key[0] = 0;
        long total = 0;
        for (int step = 0; step < n; step++) {
            int u = -1;
            for (int v = 0; v < n; v++) {
                if (!inTree[v] && (u == -1 || key[v] < key[u])) u = v;   // cheapest vertex to attach
            }
            if (key[u] == Long.MAX_VALUE) return -1;                       // disconnected
            inTree[u] = true;
            total += key[u];
            for (int v = 0; v < n; v++) {
                if (w[u][v] != 0 && !inTree[v] && w[u][v] < key[v]) key[v] = w[u][v];
            }
        }
        return total;
    }

    public static void main(String[] args) {
        int n = 5;
        int[][] edges = {{0, 1, 2}, {1, 2, 3}, {0, 3, 6}, {1, 3, 8}, {1, 4, 5}, {2, 4, 7}, {3, 4, 9}};
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[][] matrix = new int[n][n];
        for (int[] e : edges) {
            adj.get(e[0]).add(new int[] {e[1], e[2]});
            adj.get(e[1]).add(new int[] {e[0], e[2]});
            matrix[e[0]][e[1]] = matrix[e[1]][e[0]] = e[2];
        }
        List<String> chosen = new ArrayList<>();
        System.out.println("MST weight " + mstWeight(adj, chosen) + " using " + chosen);
        System.out.println("dense version: " + mstDense(matrix));
    }
}
```

**Output:**

```text
MST weight 16 using [0-1(2), 1-2(3), 1-4(5), 0-3(6)]
dense version: 16
```

## Dry Run

Heap version on the example (entries (weight, to)):

| Pop | In tree? | Added | Pushed |
|-----|----------|-------|--------|
| (0, 0) | no | 0 | (2,1), (6,3) |
| (2, 1) | no | 1, total 2 | (3,2), (8,3), (5,4) |
| (3, 2) | no | 2, total 5 | (7,4) |
| (5, 4) | no | 4, total 10 | (9,3) |
| (6, 3) | no | 3, total 16 | — (all neighbours in tree) |

## Complexity Analysis

| Implementation | Time | Space |
|----------------|------|-------|
| Binary heap, lazy deletion | O(E log E) = O(E log V) | O(V + E) |
| Array of keys (dense graphs) | O(V²) | O(V) |
| Fibonacci heap (theory) | O(E + V log V) | O(V + E) |

## Properties

- Greedy, justified by the cut property.
- The tree stays connected throughout (unlike Kruskal's forest).
- If all edge weights are distinct, the MST is unique.

## Variations

- **Minimum cost to connect all points** (complete graph on points, Manhattan distances) — use the O(V²) dense version.
- **Maximum spanning tree** — negate weights or use a max-heap.
- **Minimum spanning forest** — run Prim from each unvisited vertex.

## Comparison

| | Prim | Kruskal |
|---|------|---------|
| Grows | one tree from a vertex | a forest that merges into one tree |
| Main structure | priority queue | sorted edges + union-find |
| Time | O(E log V) heap; O(V²) array | O(E log E) |
| Best for | dense graphs (array version), adjacency lists | sparse graphs, edge lists |

## Edge Cases

- Disconnected graph — no spanning tree; detect it by counting added vertices.
- Single vertex — MST weight 0 with no edges.
- Parallel edges — the heap naturally uses the cheapest.
- Negative weights are fine for MSTs (unlike shortest paths).

## Advantages

- Simple with a priority queue; O(V²) version ideal for dense/complete graphs.

## Disadvantages

- Needs the whole adjacency structure; heap version slower than Kruskal on very sparse edge lists in practice.

## When to Use

- "Connect all nodes with minimum total cost", especially when the graph is dense or implicit (all pairs of points).

## Common Mistakes

- Confusing MST with shortest paths: the MST does not minimise the distance between two particular vertices.
- Not skipping stale heap entries (adding a vertex twice → cycle and wrong total).
- Forgetting the disconnected case.

## Key Takeaways

- MST = cheapest set of V − 1 edges connecting all vertices; justified by the cut property.
- Prim: grow one tree, always add the lightest edge leaving it; heap O(E log V), array O(V²).
- MST ≠ shortest-path tree.
