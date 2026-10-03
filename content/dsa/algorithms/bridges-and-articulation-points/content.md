# Bridges and Articulation Points

> [!NOTE]
> **Advanced topic.** Asked mainly in harder interviews (e.g. "critical connections in a network"). Learn [DFS](../dfs/content.md) — discovery times and the DFS tree — first.

## Definition

In a connected **undirected** graph, a **bridge** is an edge whose removal disconnects the graph, and an **articulation point** (cut vertex) is a vertex whose removal (with its edges) disconnects the graph. Both are found in **O(V + E)** with one DFS using **discovery times** and **low-link values** (Tarjan's technique).

## Why It Matters

Bridges and articulation points are the single points of failure of a network: a cable whose failure splits the network, a router whose crash isolates part of it, a road whose closure cuts off a town. The low-link technique is also the core of Tarjan's SCC algorithm.

## Prerequisites

- [DFS](../dfs/content.md) — DFS tree, tree edges vs back edges.
- [Strongly Connected Components](../strongly-connected-components/content.md) — low-link (optional).

## Intuition

Run DFS and look at the DFS tree. In an undirected graph, every non-tree edge is a **back edge** to an ancestor. A tree edge u → v is **not** a bridge exactly when something in v's subtree has a back edge climbing to u or above — that back edge is an alternative route around (u, v). So for each vertex compute **how high its subtree can climb** with one back edge: that is `low[v]`.

## How It Works

For every vertex u during DFS:

- `disc[u]` = the time u was discovered.
- `low[u]` = the minimum of `disc[u]`, `disc[w]` for every back edge u — w, and `low[c]` for every DFS child c.

Then, for a tree edge u → v (v a child of u):

| Condition | Meaning |
|-----------|---------|
| `low[v] > disc[u]` | v's subtree cannot reach u or above without (u, v) → **(u, v) is a bridge** |
| `low[v] ≥ disc[u]` and u is **not** the root | v's subtree cannot reach above u → **u is an articulation point** |
| u is the root and has **≥ 2 DFS children** | removing the root separates its subtrees → **root is an articulation point** |

When processing neighbours, skip the edge back to the parent (it is the tree edge itself, not an alternative route). With parallel edges, skip only the specific edge id, not every edge to the parent.

## Visual Explanation

```text
Edges: 0-1, 1-2, 1-3, 3-0, 1-4, 4-5

   0 ───── 1 ───── 2          DFS from 0 (neighbours in edge order):
    \     / \                    vertex  disc  low   why
     \   /   \                     0      0     0
       3      4 ───── 5          1      1     0    child 3 has low 0
                                 2      2     2    no back edge
                                 3      3     0    back edge 3–0
                                 4      4     4
                                 5      5     5

bridges: 1-2 (low[2]=2 > disc[1]=1), 1-4 (low[4]=4 > 1), 4-5 (low[5]=5 > disc[4]=4)
articulation points: 1 (child 2: low 2 ≥ disc 1), 4 (child 5: low 5 ≥ disc 4)
edges of the cycle 0-1-3-0 are not bridges — each has an alternative route
```

## Pseudocode

```pseudocode
dfs(u, parentEdge):
    disc[u] ← low[u] ← timer++
    children ← 0
    for (v, edgeId) in neighbours(u):
        if edgeId = parentEdge: continue
        if disc[v] = unvisited:
            children ← children + 1
            dfs(v, edgeId)
            low[u] ← min(low[u], low[v])
            if low[v] > disc[u]: mark (u, v) as a bridge
            if parent exists and low[v] ≥ disc[u]: mark u as an articulation point
        else:
            low[u] ← min(low[u], disc[v])          // back edge
    if u is the root and children ≥ 2: mark u as an articulation point
```

## Java Implementation

```java
import java.util.*;

public class BridgesAndArticulationPoints {

    static List<List<int[]>> adj;                     // {neighbour, edgeId}
    static int[] disc, low;
    static int timer;
    static List<String> bridges;
    static boolean[] isCut;

    static void analyse(int n, int[][] edges) {
        adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int id = 0; id < edges.length; id++) {
            adj.get(edges[id][0]).add(new int[] {edges[id][1], id});
            adj.get(edges[id][1]).add(new int[] {edges[id][0], id});
        }
        disc = new int[n];
        low = new int[n];
        Arrays.fill(disc, -1);
        isCut = new boolean[n];
        bridges = new ArrayList<>();
        timer = 0;
        for (int v = 0; v < n; v++) {
            if (disc[v] == -1) dfs(v, -1, true);
        }
    }

    private static void dfs(int u, int parentEdge, boolean isRoot) {
        disc[u] = low[u] = timer++;
        int children = 0;
        for (int[] edge : adj.get(u)) {
            int v = edge[0], id = edge[1];
            if (id == parentEdge) continue;                     // the tree edge we came along
            if (disc[v] == -1) {
                children++;
                dfs(v, id, false);
                low[u] = Math.min(low[u], low[v]);
                if (low[v] > disc[u]) bridges.add(Math.min(u, v) + "-" + Math.max(u, v));
                if (!isRoot && low[v] >= disc[u]) isCut[u] = true;
            } else {
                low[u] = Math.min(low[u], disc[v]);             // back edge to an ancestor
            }
        }
        if (isRoot && children >= 2) isCut[u] = true;
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1}, {1, 2}, {1, 3}, {3, 0}, {1, 4}, {4, 5}};
        analyse(6, edges);
        List<Integer> cuts = new ArrayList<>();
        for (int v = 0; v < 6; v++) if (isCut[v]) cuts.add(v);
        Collections.sort(bridges);
        System.out.println("bridges: " + bridges + ", articulation points: " + cuts);

        analyse(3, new int[][] {{0, 1}, {1, 2}, {2, 0}});
        System.out.println("triangle bridges: " + bridges);

        analyse(2, new int[][] {{0, 1}, {0, 1}});               // two parallel edges
        System.out.println("parallel edges bridges: " + bridges);
    }
}
```

**Output:**

```text
bridges: [1-2, 1-4, 4-5], articulation points: [1, 4]
triangle bridges: []
parallel edges bridges: []
```

Skipping the parent **edge id** (not the parent vertex) is what keeps the doubled edge 0–1 from being reported as a bridge.

## Dry Run

DFS from 0 (adjacency in edge order: 0: [1, 3], 1: [0, 2, 3, 4], 3: [1, 0], 4: [1, 5]):

| Step | Vertex | disc | low updates | Finding |
|------|--------|------|-------------|---------|
| 1 | 0 | 0 | | |
| 2 | 1 (from 0) | 1 | | |
| 3 | 2 (from 1) | 2 | no other neighbours → low 2 | low[2] = 2 > disc[1] = 1 → bridge 1-2; 1 is a cut vertex |
| 4 | 3 (from 1) | 3 | back edge 3–0 → low[3] = 0 | |
| 5 | back in 1 | | low[1] = min(1, 0) = 0 | low[3] = 0 < disc[1]: edge 1-3 not a bridge |
| 6 | 4 (from 1) | 4 | | |
| 7 | 5 (from 4) | 5 | low 5 | low[5] = 5 > disc[4] = 4 → bridge 4-5; 4 is a cut vertex |
| 8 | back in 1 | | | low[4] = 4 > disc[1] = 1 → bridge 1-4 |
| 9 | back in 0 (root) | | low[0] = 0 | root has 1 child → not a cut vertex |

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best / Average / Worst | O(V + E) | a single DFS; constant work per edge |

**Space:** O(V + E) for the graph, O(V) for `disc`, `low` and recursion.

## Properties

- An edge is a bridge iff it lies on no cycle.
- A vertex of degree 1 is never an articulation point (removing it does not disconnect the rest); the endpoint of a bridge with degree ≥ 2 always is.

## Variations

- **Critical connections in a network** = list all bridges.
- **2-edge-connected / biconnected components** — remove bridges (or split at articulation points).
- **Bridge tree:** contract 2-edge-connected components; the bridges form a tree.

## Comparison

| Approach | Time |
|----------|------|
| Remove each edge, test connectivity with BFS | O(E × (V + E)) |
| Tarjan's low-link DFS | O(V + E) |

## Edge Cases

- Disconnected graphs — run DFS from every unvisited vertex (each is a root).
- Parallel edges — use edge ids so a duplicate edge counts as a back edge.
- Single vertex or single edge (that edge is a bridge; neither endpoint is a cut vertex).

## Advantages

- Linear time; finds all bridges and articulation points in one pass.

## Disadvantages

- Subtle conditions (`>` vs `≥`, special root rule); recursion depth on large graphs.

## When to Use

- "Critical connection", "single point of failure", "which edge/vertex removal disconnects the network".

## Common Mistakes

- Using `≥` for bridges or `>` for articulation points (they differ).
- Forgetting the special rule for the DFS root.
- Skipping all edges to the parent vertex (wrong with parallel edges).
- Updating `low[u]` with `low[v]` for back edges (use `disc[v]`).

## Key Takeaways

- One DFS with `disc` and `low`; `low[u]` = highest ancestor reachable from u's subtree via one back edge.
- Bridge (u, v): `low[v] > disc[u]`. Articulation point u: `low[v] ≥ disc[u]` for some child (non-root), or root with ≥ 2 children.
- O(V + E).
