# Dijkstra's Algorithm

## Definition

**Dijkstra's algorithm** finds the shortest paths from one source vertex to every other vertex in a graph with **non-negative** edge weights. It repeatedly takes the unvisited vertex with the smallest known distance (using a **min-heap**), fixes that distance as final, and **relaxes** its outgoing edges. With a binary heap it runs in **O((V + E) log V)**.

## Why It Matters

It is the standard weighted shortest-path algorithm: road navigation, network routing (OSPF), game AI, "minimum cost/time/effort to reach…" interview problems. Interviews also probe its limits: why it needs non-negative weights, why stale heap entries are skipped, and how it relates to BFS (Dijkstra with all weights equal to 1 behaves like BFS).

## Prerequisites

- [BFS](../bfs/content.md) — Dijkstra generalises BFS to weighted edges.
- [Heap](../../data-structures/heap/content.md) and [Graph](../../data-structures/graph/content.md) (weighted adjacency lists).

## Intuition

Imagine water spreading from the source through pipes whose lengths are the edge weights. The water reaches vertices in order of their true distance. Dijkstra simulates this: the closest vertex not yet reached is the next one the water touches, and nothing can reach it sooner later — because every other route would have to pass through a vertex that is already at least as far away, and weights cannot be negative.

## How It Works

1. `dist[source] = 0`, every other `dist = ∞`. Push (0, source) into a min-heap ordered by distance.
2. While the heap is not empty:
   1. Pop (d, u). If `d > dist[u]`, this entry is **stale** (a shorter path to u was found after it was pushed) — skip it.
   2. Otherwise u's distance is final. For each edge u → v with weight w: if `dist[u] + w < dist[v]` (**relaxation**), set `dist[v] = dist[u] + w`, `parent[v] = u`, and push (dist[v], v).
3. `dist` holds the shortest distances; follow `parent` to rebuild paths.

Java's `PriorityQueue` has no "decrease key", so the standard approach pushes a new entry and skips stale ones ("lazy deletion"). The heap can then hold O(E) entries; the bound becomes O(E log E) = O(E log V) since E ≤ V².

### Why negative edges break it

Once a vertex is popped, Dijkstra assumes no later path can be shorter. A negative edge discovered later can violate that:

```text
A → B weight 2,  A → C weight 3,  C → B weight −2
Dijkstra pops B (dist 2) before C and finalises it, then finds A → C → B = 1 too late.
```

Use [Bellman–Ford](../bellman-ford/content.md) when weights can be negative. (Negative **cycles** make shortest paths undefined altogether.)

## Visual Explanation

```text
        4         1
   0 ─────▶ 1 ─────▶ 3
   │        ▲        ▲
 1 │      2 │      5 │
   ▼        │        │
   2 ───────┘────────┘
        (2→1 weight 2, 2→3 weight 5)

pop 0 (0):  relax 0→1 = 4, 0→2 = 1           dist [0, 4, 1, ∞]
pop 2 (1):  relax 2→1 = 3 < 4, 2→3 = 6         dist [0, 3, 1, 6]
pop 1 (3):  relax 1→3 = 4 < 6                  dist [0, 3, 1, 4]
pop 1 (4):  stale (4 > 3) → skip
pop 3 (4):  final                              shortest 0→3 = 4 via 0→2→1→3
pop 3 (6):  stale → skip
```

## Pseudocode

```pseudocode
dijkstra(graph, source):
    dist[all] ← ∞; dist[source] ← 0
    heap ← [(0, source)]
    while heap not empty:
        (d, u) ← heap.popMin()
        if d > dist[u]: continue                 // stale entry
        for (v, w) in edges(u):
            if dist[u] + w < dist[v]:
                dist[v] ← dist[u] + w; parent[v] ← u
                heap.push((dist[v], v))
    return dist
```

## Java Implementation

```java
import java.util.*;

public class Dijkstra {

    static int[] parent;

    // adj.get(u) holds {v, weight}
    static long[] shortestPaths(List<List<int[]>> adj, int source) {
        int n = adj.size();
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        parent = new int[n];
        Arrays.fill(parent, -1);
        dist[source] = 0;
        PriorityQueue<long[]> heap = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));   // {distance, vertex}
        heap.offer(new long[] {0, source});
        while (!heap.isEmpty()) {
            long[] top = heap.poll();
            long d = top[0];
            int u = (int) top[1];
            if (d > dist[u]) continue;                       // stale: u already settled with a smaller distance
            for (int[] edge : adj.get(u)) {
                int v = edge[0];
                long candidate = d + edge[1];
                if (candidate < dist[v]) {                   // relaxation
                    dist[v] = candidate;
                    parent[v] = u;
                    heap.offer(new long[] {candidate, v});
                }
            }
        }
        return dist;
    }

    // Textbook version: a vertex is final once popped and is never updated again.
    static long[] shortestPathsSettled(List<List<int[]>> adj, int source) {
        int n = adj.size();
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        boolean[] settled = new boolean[n];
        dist[source] = 0;
        PriorityQueue<long[]> heap = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        heap.offer(new long[] {0, source});
        while (!heap.isEmpty()) {
            int u = (int) heap.poll()[1];
            if (settled[u]) continue;
            settled[u] = true;
            for (int[] edge : adj.get(u)) {
                int v = edge[0];
                if (!settled[v] && dist[u] + edge[1] < dist[v]) {
                    dist[v] = dist[u] + edge[1];
                    heap.offer(new long[] {dist[v], v});
                }
            }
        }
        return dist;
    }

    static List<Integer> path(int target) {
        LinkedList<Integer> p = new LinkedList<>();
        for (int v = target; v != -1; v = parent[v]) p.addFirst(v);
        return p;
    }

    public static void main(String[] args) {
        int n = 5;
        int[][] edges = {{0, 1, 4}, {0, 2, 1}, {2, 1, 2}, {1, 3, 1}, {2, 3, 5}};   // vertex 4 unreachable
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) adj.get(e[0]).add(new int[] {e[1], e[2]});

        long[] dist = shortestPaths(adj, 0);
        StringBuilder sb = new StringBuilder();
        for (long d : dist) sb.append(d == Long.MAX_VALUE ? "INF" : String.valueOf(d)).append(' ');
        System.out.println("dist: " + sb.toString().trim());
        System.out.println("path to 3: " + path(3));

        // Negative edge: the settled-set version finalises B too early.
        List<List<int[]>> neg = new ArrayList<>();
        for (int i = 0; i < 3; i++) neg.add(new ArrayList<>());
        neg.get(0).add(new int[] {1, 2});      // A -> B 2
        neg.get(0).add(new int[] {2, 3});      // A -> C 3
        neg.get(2).add(new int[] {1, -2});     // C -> B -2
        System.out.println("with a negative edge, dist to B = " + shortestPathsSettled(neg, 0)[1] + " (wrong: A -> C -> B costs 1)");
    }
}
```

**Output:**

```text
dist: 0 3 1 4 INF
path to 3: [0, 2, 1, 3]
with a negative edge, dist to B = 2 (wrong: A -> C -> B costs 1)
```

> [!WARNING]
> The lazy version above (`shortestPaths`) lets a popped vertex be improved and pushed again, so on this tiny input it would happen to print 1. That is not a fix: re-processing vertices destroys the O((V + E) log V) bound (it can become exponential) and it never terminates correctly on negative cycles. Treat Dijkstra as valid only for non-negative weights.

## Dry Run

Heap contents on the main example (entries are (dist, vertex)):

| Pop | Stale? | Relaxations | dist after | Heap after |
|-----|--------|-------------|------------|------------|
| (0, 0) | no | 1 → 4, 2 → 1 | [0, 4, 1, ∞, ∞] | (1,2) (4,1) |
| (1, 2) | no | 1 → 3, 3 → 6 | [0, 3, 1, 6, ∞] | (3,1) (4,1) (6,3) |
| (3, 1) | no | 3 → 4 | [0, 3, 1, 4, ∞] | (4,1) (4,3) (6,3) |
| (4, 1) | yes (4 > 3) | — | | (4,3) (6,3) |
| (4, 3) | no | none | | (6,3) |
| (6, 3) | yes | — | | empty |

## Complexity Analysis

| Implementation | Time | Space |
|----------------|------|-------|
| Binary heap with lazy deletion | O((V + E) log V) | O(V + E) |
| Array scan for the minimum (no heap) | O(V²) | O(V) |
| Fibonacci heap (theory) | O(E + V log V) | O(V + E) |

The O(V²) array version is better for **dense** graphs (E ≈ V²).

## Properties

- Greedy: always settles the closest unsettled vertex.
- Correct only with non-negative weights.
- Single source, all destinations; stop early when the target is popped if only one path is needed.

## Variations

- **Path reconstruction** with `parent[]`.
- **Shortest path in a grid with cell costs** ("minimum effort", "swim in rising water") — vertices are cells.
- **Minimise the maximum edge on a path** (bottleneck path) — same algorithm, combine with `max` instead of `+`.
- **Counting shortest paths** — when an equal-length path is found, add the counts.
- **0-1 BFS** — weights 0/1 only, deque instead of heap (see [BFS](../bfs/content.md)).
- **A\*** — Dijkstra plus a heuristic estimate to the target.

## Comparison

| Algorithm | Weights | Sources | Time | Detects negative cycles |
|-----------|---------|---------|------|-------------------------|
| BFS | unweighted | one | O(V + E) | — |
| 0-1 BFS | 0 or 1 | one | O(V + E) | — |
| **Dijkstra** | non-negative | one | O((V + E) log V) | no |
| [Bellman–Ford](../bellman-ford/content.md) | any | one | O(V × E) | yes |
| [Floyd–Warshall](../floyd-warshall/content.md) | any (no negative cycles) | all pairs | O(V³) | yes (negative diagonal) |

## Edge Cases

- Unreachable vertices stay at ∞ — print or handle them explicitly.
- Overflow: use `long` distances or check before adding to `Integer.MAX_VALUE`.
- Multiple edges between the same pair — relaxation keeps the cheapest automatically.
- Zero-weight edges are fine.

## Advantages

- Efficient, widely applicable, easy to implement with `PriorityQueue`.

## Disadvantages

- Fails with negative weights; heap overhead compared with BFS on unweighted graphs.

## When to Use

- Weighted graph, non-negative costs, "minimum total cost/time/distance" from a source.
- Grid problems where moving into a cell has a non-negative cost.

## Common Mistakes

- Forgetting the stale-entry check (`d > dist[u]`) — still correct but much slower, and wrong for some variants.
- Using a visited set and refusing to push improved distances.
- Using Dijkstra with negative edges.
- Integer overflow in `dist[u] + w` when `dist[u]` is `Integer.MAX_VALUE`.
- Comparing heap entries by subtraction (`a[0] − b[0]`), which can overflow.

## Key Takeaways

- Min-heap of (distance, vertex); pop the closest, relax its edges, skip stale entries.
- O((V + E) log V) with a binary heap; O(V²) array version for dense graphs.
- Non-negative weights only: settled distances must never improve.
