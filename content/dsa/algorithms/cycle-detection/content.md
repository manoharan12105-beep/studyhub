# Cycle Detection in Graphs

## Definition

**Cycle detection** decides whether a graph contains a path that starts and ends at the same vertex. The method depends on the graph type:

- **Undirected:** a DFS/BFS that reaches an already-visited vertex **other than the vertex it came from** has found a cycle; equivalently, [union-find](../../data-structures/disjoint-set-union/content.md) reports an edge whose endpoints are already connected.
- **Directed:** a DFS that reaches a vertex **still on the current recursion path** (a "back edge") has found a cycle — tracked with three colours; equivalently, [Kahn's algorithm](../topological-sort/content.md) cannot remove every vertex.

All methods run in **O(V + E)**.

## Why It Matters

Cycles break many things: a course schedule with circular prerequisites cannot be completed, a build system with circular dependencies cannot compile, a deadlock is a cycle in a "waits-for" graph, and a "tree" with a cycle is not a tree. Interviewers often check that you know the directed and undirected cases need **different** logic.

## Prerequisites

- [DFS](../dfs/content.md), [BFS](../bfs/content.md)

## Intuition

**Undirected:** walking a road network, if you reach an intersection you visited before by a road other than the one you just walked, there must be a loop.

**Directed:** a plain "visited" mark is not enough. In `A → B, A → C, C → B`, DFS reaches B twice (via A and via C) but there is no cycle — B was simply finished already. A cycle means you returned to a vertex you are **still in the middle of exploring** (it is your ancestor on the current path). So vertices need three states: **unvisited (white)**, **on the current path (grey)**, **finished (black)**.

## How It Works

### Undirected graph — DFS with parent

1. DFS from each unvisited vertex, passing the parent.
2. For each neighbour v of u: if v is unvisited, recurse with parent u; if v is visited and v ≠ parent, a cycle exists.

(With parallel edges between the same two vertices, compare edge ids instead of parent vertices.)

### Undirected graph — union-find

For each edge (u, v): if `find(u) == find(v)`, the edge closes a cycle; otherwise `union(u, v)`.

### Directed graph — three colours

1. All vertices start white (0).
2. DFS(u): colour u grey (1). For each neighbour v: if v is grey → **cycle** (back edge); if v is white → recurse.
3. After all neighbours, colour u black (2).

### Directed graph — Kahn's algorithm (BFS)

Repeatedly remove vertices with in-degree 0. If some vertices are never removed, they lie on or depend on a cycle. See [Topological Sort](../topological-sort/content.md).

## Visual Explanation

```text
Directed: 0 → 1 → 2 → 3          DFS colours when reaching 3 → 1:
               ↑         │         0 grey, 1 grey, 2 grey, 3 grey; neighbour 1 is GREY → cycle 1→2→3→1
               └─────────┘

Directed, no cycle: A → B, A → C, C → B
   DFS: A grey → B grey → B black → C grey → neighbour B is BLACK (finished) → not a cycle

Undirected: 0 — 1 — 2 — 0
   DFS(0) → 1 (parent 0) → 2 (parent 1) → neighbour 0 is visited and not the parent → cycle
```

## Pseudocode

```pseudocode
hasCycleDirected(graph):
    colour[all] ← WHITE
    for u in vertices:
        if colour[u] = WHITE and dfs(u): return true
    return false

dfs(u):
    colour[u] ← GREY
    for v in neighbours(u):
        if colour[v] = GREY: return true            // back edge
        if colour[v] = WHITE and dfs(v): return true
    colour[u] ← BLACK
    return false
```

## Java Implementation

```java
import java.util.*;

public class CycleDetection {

    static List<List<Integer>> build(int n, int[][] edges, boolean directed) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            if (!directed) adj.get(e[1]).add(e[0]);
        }
        return adj;
    }

    // ---------- Undirected: DFS with parent ----------
    static boolean hasCycleUndirected(List<List<Integer>> adj) {
        boolean[] visited = new boolean[adj.size()];
        for (int u = 0; u < adj.size(); u++) {
            if (!visited[u] && dfsUndirected(adj, u, -1, visited)) return true;
        }
        return false;
    }

    private static boolean dfsUndirected(List<List<Integer>> adj, int u, int parent, boolean[] visited) {
        visited[u] = true;
        for (int v : adj.get(u)) {
            if (!visited[v]) {
                if (dfsUndirected(adj, v, u, visited)) return true;
            } else if (v != parent) {
                return true;                           // visited, and not the edge we came along
            }
        }
        return false;
    }

    // ---------- Undirected: union-find ----------
    static boolean hasCycleUnionFind(int n, int[][] edges) {
        int[] parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int[] e : edges) {
            int a = find(parent, e[0]), b = find(parent, e[1]);
            if (a == b) return true;                   // already connected → this edge closes a cycle
            parent[a] = b;
        }
        return false;
    }

    private static int find(int[] parent, int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];             // path halving
            x = parent[x];
        }
        return x;
    }

    // ---------- Directed: three colours ----------
    static final int WHITE = 0, GREY = 1, BLACK = 2;

    static boolean hasCycleDirected(List<List<Integer>> adj) {
        int[] colour = new int[adj.size()];
        for (int u = 0; u < adj.size(); u++) {
            if (colour[u] == WHITE && dfsDirected(adj, u, colour)) return true;
        }
        return false;
    }

    private static boolean dfsDirected(List<List<Integer>> adj, int u, int[] colour) {
        colour[u] = GREY;                              // on the current path
        for (int v : adj.get(u)) {
            if (colour[v] == GREY) return true;        // back edge to an ancestor
            if (colour[v] == WHITE && dfsDirected(adj, v, colour)) return true;
        }
        colour[u] = BLACK;                             // fully explored; reaching it again is not a cycle
        return false;
    }

    public static void main(String[] args) {
        int[][] triangle = {{0, 1}, {1, 2}, {2, 0}};
        int[][] path = {{0, 1}, {1, 2}, {2, 3}};
        System.out.println("undirected triangle: " + hasCycleUndirected(build(3, triangle, false)) + ", path: " + hasCycleUndirected(build(4, path, false)));
        System.out.println("union-find triangle: " + hasCycleUnionFind(3, triangle) + ", path: " + hasCycleUnionFind(4, path));

        int[][] directedCycle = {{0, 1}, {1, 2}, {2, 3}, {3, 1}};
        int[][] diamond = {{0, 1}, {0, 2}, {2, 1}};          // B reached twice, but no cycle
        System.out.println("directed 1->2->3->1: " + hasCycleDirected(build(4, directedCycle, true))
                + ", diamond: " + hasCycleDirected(build(3, diamond, true)));
        System.out.println("diamond treated as undirected: " + hasCycleUndirected(build(3, diamond, false)));
    }
}
```

**Output:**

```text
undirected triangle: true, path: false
union-find triangle: true, path: false
directed 1->2->3->1: true, diamond: false
diamond treated as undirected: true
```

The last line shows why the two cases differ: as an undirected graph the "diamond" 0–1, 0–2, 2–1 **is** a cycle, but as a directed graph it is acyclic.

## Dry Run

Three-colour DFS on `0 → 1 → 2 → 3 → 1`:

| Call | Colour change | Neighbour check | Result |
|------|---------------|-----------------|--------|
| dfs(0) | 0 grey | 1 is white → recurse | |
| dfs(1) | 1 grey | 2 is white → recurse | |
| dfs(2) | 2 grey | 3 is white → recurse | |
| dfs(3) | 3 grey | 1 is **grey** | cycle found → true propagates up |

## Complexity Analysis

| Method | Time | Space |
|--------|------|-------|
| Undirected DFS with parent | O(V + E) | O(V) |
| Undirected union-find | O(E α(V)) | O(V) |
| Directed three-colour DFS | O(V + E) | O(V) |
| Directed Kahn's algorithm | O(V + E) | O(V) |

## Properties

- Undirected: the graph is acyclic iff every component is a tree (E = V − components).
- Directed: acyclic iff a topological order exists (it is a DAG).

## Variations

- **Return the cycle itself:** keep parent pointers; when the back edge u → v is found, walk parents from u back to v.
- **Find eventual safe states:** vertices from which no cycle is reachable = vertices that finish black in the colour DFS.
- **Functional graphs** (each vertex has exactly one outgoing edge): use [Fast and Slow Pointers](../../patterns/fast-and-slow-pointers/content.md) or iterate with visit stamps.
- **Cycle in a grid** of equal letters — undirected DFS with parent cell.

## Comparison

| Graph | Use | Do not use |
|-------|-----|------------|
| Undirected | DFS with parent, union-find, BFS with parent | three colours without a parent check (every edge looks like a back edge) |
| Directed | three colours, Kahn's algorithm | plain visited array (false positives), union-find (ignores direction) |

## Edge Cases

- Self-loop (u → u): a cycle in both cases (handled by the grey check / union-find).
- Parallel edges in an undirected graph form a cycle of length 2 — the simple parent check misses it; use edge ids if that matters.
- Disconnected graphs — start from every unvisited vertex.

## Advantages

- Linear time; small code; directly gives topological feasibility for directed graphs.

## Disadvantages

- Recursive DFS depth can be large; Kahn's algorithm avoids recursion.

## When to Use

- "Can all courses be finished?", "is there a deadlock?", "is this graph a tree / DAG?", "detect circular dependencies".

## Common Mistakes

- Using the undirected rule on a directed graph or vice versa.
- Forgetting to colour a vertex black after its DFS (every later visit then looks like a cycle).
- Treating the immediate parent as a cycle in undirected DFS.

## Key Takeaways

- Undirected: visited neighbour that is not the parent ⇒ cycle (or union-find on edges).
- Directed: neighbour that is grey (on the current path) ⇒ cycle; black means already finished, not a cycle.
- Kahn's algorithm: leftover vertices ⇒ cycle. All O(V + E).
