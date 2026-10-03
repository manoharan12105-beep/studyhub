# Depth-First Search (DFS)

## Definition

**Depth-first search** explores a graph by going as deep as possible along one path before backtracking: from a vertex, it visits an unvisited neighbour, then that neighbour's unvisited neighbour, and so on; when stuck, it returns to the most recent vertex with unexplored neighbours. It is naturally **recursive** (the call stack remembers the path) or **iterative** with an explicit **stack**. It runs in **O(V + E)**.

## Why It Matters

DFS is the workhorse for questions about **structure** rather than distance: connectivity and components, cycle detection, topological ordering, strongly connected components, bridges and articulation points, flood fill, and every backtracking search. Its discovery/finish ordering carries information that many advanced graph algorithms rely on.

## Prerequisites

- [Graph](../../data-structures/graph/content.md)
- [Recursion](../recursion/content.md) and [Stack](../../data-structures/stack/content.md)

## Intuition

Exploring a cave system with a ball of string: follow one tunnel as far as it goes, unrolling string; at a dead end, wind the string back to the last junction with an unexplored tunnel and try it. You never get lost because the string (the stack) always leads back.

## How It Works

### Recursive DFS

1. Mark u visited (record its **discovery** time if needed).
2. For each neighbour v of u: if v is not visited, recurse on v.
3. When all neighbours are done, u is **finished** (record its finish time / add it to a postorder list).
4. To cover a disconnected graph, start a DFS from every vertex that is still unvisited.

### Iterative DFS

Push the start vertex on a stack. Pop a vertex; if already visited, skip it; otherwise mark it and push its unvisited neighbours. This visits vertices in a valid depth-first order (neighbours are explored in reverse push order). It does **not** give finish times directly — for those, simulate the recursion with a stack of (vertex, next-neighbour-index) frames.

### Discovery and finish times

Recording a counter when a vertex is entered (`disc[u]`) and left (`fin[u]`) gives a nesting structure: the interval [disc[v], fin[v]] of a descendant v lies inside that of its ancestor u. Uses:

- **Postorder (finish order)** reversed is a topological order of a DAG.
- **Back edges** (to a vertex that is still on the stack, i.e. started but not finished) reveal **cycles** in directed graphs — see [Cycle Detection](../cycle-detection/content.md).
- **Low-link values** built from discovery times find [bridges and articulation points](../bridges-and-articulation-points/content.md) and [strongly connected components](../strongly-connected-components/content.md).

### Edge classification (awareness)

In a directed DFS: **tree edges** (to a newly discovered vertex), **back edges** (to an ancestor still on the stack → cycle), **forward edges** (to an already finished descendant), **cross edges** (to a finished vertex in another branch). In an undirected graph only tree and back edges exist.

## Visual Explanation

```text
Graph:                       DFS from 0 (neighbours in increasing order):
   0 ─ 1 ─ 4                 enter 0 (d1) → enter 1 (d2) → enter 3 (d3) → enter 2 (d4)
   │   │                       2's neighbours 0, 3 visited → finish 2 (f5)
   2 ─ 3 ─ 5                 back to 3 → enter 5 (d6) → finish 5 (f7) → finish 3 (f8)
                             back to 1 → enter 4 (d9) → finish 4 (f10) → finish 1 (f11) → finish 0 (f12)

preorder (discovery): 0 1 3 2 5 4
postorder (finish):   2 5 3 4 1 0
DFS tree edges: 0–1, 1–3, 3–2, 3–5, 1–4   (0–2 is a back edge → the cycle 0–1–3–2–0)
```

## Pseudocode

```pseudocode
dfs(u):
    visited[u] ← true; disc[u] ← ++time
    for v in neighbours(u):
        if not visited[v]:
            parent[v] ← u
            dfs(v)
    fin[u] ← ++time; postorder.add(u)

dfsAll(graph):
    for u in vertices:
        if not visited[u]: dfs(u)          // one call per connected component
```

## Java Implementation

```java
import java.util.*;

public class DepthFirstSearch {

    static List<List<Integer>> adj;
    static boolean[] visited;
    static int[] disc, fin;
    static int time;
    static List<Integer> preorder, postorder;

    static void dfs(int u) {
        visited[u] = true;
        disc[u] = ++time;
        preorder.add(u);
        for (int v : adj.get(u)) {
            if (!visited[v]) {
                dfs(v);
            }
        }
        fin[u] = ++time;
        postorder.add(u);                         // u is finished after all its descendants
    }

    static List<Integer> dfsIterative(int start) {
        List<Integer> order = new ArrayList<>();
        boolean[] seen = new boolean[adj.size()];
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(start);
        while (!stack.isEmpty()) {
            int u = stack.pop();
            if (seen[u]) continue;                // a vertex can be pushed more than once
            seen[u] = true;
            order.add(u);
            List<Integer> neighbours = adj.get(u);
            for (int i = neighbours.size() - 1; i >= 0; i--) {   // reverse push → smallest popped first
                if (!seen[neighbours.get(i)]) stack.push(neighbours.get(i));
            }
        }
        return order;
    }

    static int countComponents(int n) {
        visited = new boolean[n];
        disc = new int[n];
        fin = new int[n];
        preorder = new ArrayList<>();
        postorder = new ArrayList<>();
        int components = 0;
        for (int u = 0; u < n; u++) {
            if (!visited[u]) {
                dfs(u);
                components++;
            }
        }
        return components;
    }

    public static void main(String[] args) {
        int n = 8;
        int[][] edges = {{0, 1}, {0, 2}, {1, 4}, {1, 3}, {2, 3}, {3, 5}, {6, 7}};
        adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
        }
        for (List<Integer> list : adj) Collections.sort(list);   // visit neighbours in increasing order

        int components = countComponents(n);
        System.out.println("components: " + components);
        System.out.println("preorder:  " + preorder);
        System.out.println("postorder: " + postorder);
        System.out.println("disc/fin of 0: " + disc[0] + "/" + fin[0] + ", of 3: " + disc[3] + "/" + fin[3]);
        System.out.println("iterative from 0: " + dfsIterative(0));
    }
}
```

**Output:**

```text
components: 2
preorder:  [0, 1, 3, 2, 5, 4, 6, 7]
postorder: [2, 5, 3, 4, 1, 0, 7, 6]
disc/fin of 0: 1/12, of 3: 3/8
iterative from 0: [0, 1, 3, 2, 5, 4]
```

## Dry Run

Recursive DFS from 0 (sorted adjacency: 0: [1, 2], 1: [0, 3, 4], 2: [0, 3], 3: [1, 2, 5]):

| Call stack (bottom → top) | Action | time |
|---------------------------|--------|------|
| 0 | discover 0 | 1 |
| 0 1 | discover 1 (0 visited) | 2 |
| 0 1 3 | discover 3 | 3 |
| 0 1 3 2 | discover 2; neighbours 0, 3 visited; finish 2 | 4, 5 |
| 0 1 3 5 | discover 5; finish 5 | 6, 7 |
| 0 1 3 | finish 3 | 8 |
| 0 1 4 | discover 4; finish 4 | 9, 10 |
| 0 1 | finish 1 | 11 |
| 0 | 2 already visited; finish 0 | 12 |

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best / Average / Worst | O(V + E) | each vertex is visited once; each adjacency list is scanned once |
| Adjacency matrix | O(V²) | scanning a row costs O(V) per vertex |

**Space:** O(V) for `visited` plus the recursion/explicit stack — up to O(V) deep (a path graph). Recursive DFS on 10⁵+ vertices in a chain can overflow Java's stack; use the iterative version.

## Properties

- Explores one branch completely before the next.
- Produces a DFS tree/forest; discovery/finish times nest.
- Does **not** find shortest paths in general.

## Variations

- **Connected components, flood fill, islands, clone graph** — [Graph Traversal Problems](../graph-traversal-problems/content.md).
- **Cycle detection** (colours / parent tracking) — [Cycle Detection](../cycle-detection/content.md).
- **Topological sort** (reverse postorder) — [Topological Sort](../topological-sort/content.md).
- **Bipartite check** (2-colouring) — [Bipartite Graph](../bipartite-graph/content.md).
- **Backtracking** is DFS over a decision tree — [Backtracking](../backtracking/content.md).

## Comparison

| | DFS | BFS |
|---|-----|-----|
| Structure | stack / recursion | queue |
| Order | deep first | level by level |
| Shortest path (unweighted) | no | yes |
| Memory | O(depth) | O(width) |
| Natural for | components, cycles, topological sort, SCC, bridges, backtracking, path existence | minimum steps, levels, nearest source |

## Edge Cases

- Disconnected graphs — loop over all vertices.
- Self-loops and parallel edges (harmless with a visited array).
- Very deep graphs — recursion depth.
- Directed vs undirected input: add both directions for undirected edges.

## Advantages

- Simple recursive code; O(V + E); uses little memory on wide graphs.
- Finish times and the DFS tree unlock many advanced algorithms.

## Disadvantages

- Recursion depth can overflow; no shortest-path guarantee.

## When to Use

- "Is there a path?", "how many components/regions?", "does a cycle exist?", "order tasks with dependencies", "explore all possibilities".

## Common Mistakes

- Forgetting the outer loop over all vertices (misses other components).
- Marking visited after the recursive call instead of before it (infinite recursion on cycles).
- Using a single `visited` array for directed cycle detection (need "on current path" state too).
- Iterative DFS that marks on push and expects the same order as recursion (it differs).

## Key Takeaways

- Go deep, backtrack when stuck; recursion or an explicit stack; O(V + E).
- Discovery/finish times and postorder drive topological sort, cycle detection, SCCs and bridges.
- Use BFS, not DFS, for shortest paths in unweighted graphs.
