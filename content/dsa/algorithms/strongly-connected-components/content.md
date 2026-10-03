# Strongly Connected Components (Kosaraju and Tarjan)

> [!NOTE]
> **Advanced topic.** Less common in interviews than BFS/DFS/topological sort, but it appears in harder rounds and in problems about directed reachability. Learn [DFS](../dfs/content.md) and [Topological Sort](../topological-sort/content.md) first.

## Definition

In a **directed** graph, a **strongly connected component (SCC)** is a maximal set of vertices in which every vertex can reach every other vertex by following edge directions. Every directed graph splits uniquely into SCCs; collapsing each SCC into one vertex gives the **condensation graph**, which is always a DAG. **Kosaraju's algorithm** finds all SCCs with two DFS passes; **Tarjan's algorithm** does it in one pass with low-link values. Both run in **O(V + E)**.

## Why It Matters

SCCs answer "which groups of nodes are mutually reachable?": circular dependencies among modules, communities in follow graphs, deadlock groups, and 2-SAT satisfiability. The condensation DAG turns a cyclic directed problem into an acyclic one where topological ordering and DP apply.

## Prerequisites

- [DFS](../dfs/content.md) — finish times.
- [Topological Sort](../topological-sort/content.md)

## Intuition

Think of one-way streets. An SCC is a neighbourhood where you can drive from any house to any other and back. Between neighbourhoods the streets only go one way — otherwise they would be one neighbourhood — which is why the condensation is acyclic.

**Kosaraju's trick:** in the graph, a DFS that starts in a "sink" SCC (no edges leaving it) can only reach that SCC. Finish times help find sinks: the vertex finishing **last** in a DFS lies in a **source** SCC of the condensation. Reversing all edges turns sources into sinks. So: compute finish order on the original graph, then DFS the **reversed** graph in decreasing finish time — each DFS tree is exactly one SCC.

## How It Works

### Kosaraju's algorithm

1. Run DFS on the original graph; push each vertex onto a stack when it **finishes**.
2. Build the **transpose** graph (every edge reversed).
3. Pop vertices from the stack; for each vertex not yet assigned, run a DFS on the transpose graph — every vertex it reaches (and not yet assigned) forms one SCC.

### Tarjan's algorithm (awareness)

One DFS, keeping each vertex's discovery index `disc[u]` and `low[u]` = the smallest discovery index reachable from u's DFS subtree using at most one back edge to a vertex still on the stack. Vertices are pushed on a stack when discovered. When `low[u] == disc[u]`, u is the root of an SCC: pop the stack down to u — those vertices form the component. It avoids building the transpose graph; the same low-link idea finds [bridges and articulation points](../bridges-and-articulation-points/content.md).

## Visual Explanation

```text
Edges: 0→1, 1→2, 2→0, 1→3, 3→4, 4→5, 5→3, 5→6

   ┌──────────┐        ┌──────────┐
   │ 0 → 1    │        │ 3 → 4    │
   │ ↑   ↓    │ ─────▶ │ ↑   ↓    │ ─────▶  6
   │  └─ 2    │  1→3   │  └─ 5    │  5→6
   └──────────┘        └──────────┘
   SCC {0,1,2}          SCC {3,4,5}         SCC {6}

condensation DAG: {0,1,2} → {3,4,5} → {6}
```

## Pseudocode

```pseudocode
kosaraju(G):
    order ← empty stack; visited[all] ← false
    for v in vertices: if not visited[v]: dfs1(v)       // push v when it finishes
    GT ← transpose(G)
    assigned[all] ← false; components ← []
    while order not empty:
        v ← order.pop()
        if not assigned[v]:
            component ← []
            dfs2(GT, v, component)                      // collects one SCC
            components.add(component)
    return components
```

## Java Implementation

```java
import java.util.*;

public class StronglyConnected {

    static List<List<Integer>> kosaraju(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>(), rev = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            adj.add(new ArrayList<>());
            rev.add(new ArrayList<>());
        }
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            rev.get(e[1]).add(e[0]);                    // transpose graph
        }
        boolean[] visited = new boolean[n];
        Deque<Integer> finishOrder = new ArrayDeque<>();
        for (int v = 0; v < n; v++) {
            if (!visited[v]) fillOrder(v, adj, visited, finishOrder);
        }
        boolean[] assigned = new boolean[n];
        List<List<Integer>> components = new ArrayList<>();
        while (!finishOrder.isEmpty()) {
            int v = finishOrder.pop();                  // latest finish first
            if (assigned[v]) continue;
            List<Integer> component = new ArrayList<>();
            collect(v, rev, assigned, component);
            Collections.sort(component);
            components.add(component);
        }
        return components;
    }

    private static void fillOrder(int u, List<List<Integer>> adj, boolean[] visited, Deque<Integer> order) {
        visited[u] = true;
        for (int v : adj.get(u)) if (!visited[v]) fillOrder(v, adj, visited, order);
        order.push(u);                                  // finished
    }

    private static void collect(int u, List<List<Integer>> rev, boolean[] assigned, List<Integer> component) {
        assigned[u] = true;
        component.add(u);
        for (int v : rev.get(u)) if (!assigned[v]) collect(v, rev, assigned, component);
    }

    // Tarjan's algorithm: one DFS with low-link values.
    static int timer;

    static List<List<Integer>> tarjan(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) adj.get(e[0]).add(e[1]);
        int[] disc = new int[n], low = new int[n];
        Arrays.fill(disc, -1);
        boolean[] onStack = new boolean[n];
        Deque<Integer> stack = new ArrayDeque<>();
        List<List<Integer>> components = new ArrayList<>();
        timer = 0;
        for (int v = 0; v < n; v++) {
            if (disc[v] == -1) strongConnect(v, adj, disc, low, onStack, stack, components);
        }
        return components;
    }

    private static void strongConnect(int u, List<List<Integer>> adj, int[] disc, int[] low, boolean[] onStack,
                                      Deque<Integer> stack, List<List<Integer>> components) {
        disc[u] = low[u] = timer++;
        stack.push(u);
        onStack[u] = true;
        for (int v : adj.get(u)) {
            if (disc[v] == -1) {
                strongConnect(v, adj, disc, low, onStack, stack, components);
                low[u] = Math.min(low[u], low[v]);
            } else if (onStack[v]) {
                low[u] = Math.min(low[u], disc[v]);     // back edge into the current component
            }
        }
        if (low[u] == disc[u]) {                        // u is the root of an SCC
            List<Integer> component = new ArrayList<>();
            int w;
            do {
                w = stack.pop();
                onStack[w] = false;
                component.add(w);
            } while (w != u);
            Collections.sort(component);
            components.add(component);
        }
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1}, {1, 2}, {2, 0}, {1, 3}, {3, 4}, {4, 5}, {5, 3}, {5, 6}};
        System.out.println("Kosaraju: " + kosaraju(7, edges));
        System.out.println("Tarjan:   " + tarjan(7, edges));
    }
}
```

**Output:**

```text
Kosaraju: [[0, 1, 2], [3, 4, 5], [6]]
Tarjan:   [[6], [3, 4, 5], [0, 1, 2]]
```

Kosaraju outputs components in topological order of the condensation; Tarjan in reverse topological order.

## Dry Run

Kosaraju pass 1 from 0 (adjacency 0: [1], 1: [2, 3], 2: [0], 3: [4], 4: [5], 5: [3, 6]):

| Event | Finish stack (top first) |
|-------|--------------------------|
| 0 → 1 → 2 (2's neighbour 0 visited), finish 2 | 2 |
| 1 → 3 → 4 → 5 → 6, finish 6 | 6 2 |
| finish 5, 4, 3 | 3 4 5 6 2 |
| finish 1, 0 | 0 1 3 4 5 6 2 |

Pass 2 on the transpose: pop 0 → reaches 2, 1 → SCC {0, 1, 2}; pop 3 → reaches 5, 4 (1 already assigned) → {3, 4, 5}; pop 6 → {6}.

## Complexity Analysis

| Algorithm | Time | Space |
|-----------|------|-------|
| Kosaraju | O(V + E) — two DFS passes + building the transpose | O(V + E) |
| Tarjan | O(V + E) — one DFS | O(V) besides the graph |

## Properties

- SCCs partition the vertices; the condensation graph is a DAG.
- In an undirected graph, SCCs are just connected components.

## Variations

- **Condensation + DP:** longest path or reachability counts on the DAG of components.
- **Minimum edges to make the graph strongly connected:** max(number of source SCCs, number of sink SCCs) when there is more than one SCC (0 if already one).
- **2-SAT:** a formula is satisfiable iff no variable and its negation share an SCC.

## Comparison

| | Kosaraju | Tarjan |
|---|----------|--------|
| DFS passes | 2 | 1 |
| Needs the transpose graph | yes | no |
| Ease of explanation | easier | trickier (low-link) |
| Output order | topological (of components) | reverse topological |

## Edge Cases

- Single vertices with no cycle are SCCs of size 1.
- Self-loops do not change the components.
- Deep recursion on large graphs — convert to an iterative DFS.

## Advantages

- Linear time; reveals the cyclic structure of directed graphs.

## Disadvantages

- More involved than plain DFS; recursion depth issues on big inputs.

## When to Use

- "Groups that can all reach each other", "mutual reachability", "collapse cycles then reason about a DAG", 2-SAT.

## Common Mistakes

- Running pass 2 on the original graph instead of the transpose.
- Using discovery order instead of finish order in pass 1.
- In Tarjan, updating `low[u]` from vertices that are visited but no longer on the stack.

## Key Takeaways

- SCC = maximal mutually reachable set in a directed graph; the condensation is a DAG.
- Kosaraju: DFS finish order, then DFS on the reversed graph in decreasing finish order.
- Tarjan: one DFS with `disc`/`low` and a stack; `low[u] == disc[u]` marks an SCC root.
