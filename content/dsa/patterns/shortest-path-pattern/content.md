# Shortest Path Pattern

## What Is the Pattern

The **shortest path pattern** is about recognising that a problem asks for the cheapest way to get from one state to another, and then choosing the right algorithm by looking at the **edge costs** and the **number of sources**:

| Edge costs | Algorithm | Time |
|------------|-----------|------|
| All equal (unit) | [BFS](../bfs-pattern/content.md) | O(V + E) |
| Only 0 and 1 | 0-1 BFS (deque) | O(V + E) |
| Non-negative | [Dijkstra](../../algorithms/dijkstra/content.md) (min-heap) | O((V + E) log V) |
| Negative allowed, detect negative cycles, or "at most k edges" | [Bellman–Ford](../../algorithms/bellman-ford/content.md) | O(V × E) |
| All pairs, small V (≤ ~400) | [Floyd–Warshall](../../algorithms/floyd-warshall/content.md) | O(V³) |
| DAG | relax edges in [topological order](../../algorithms/topological-sort/content.md) | O(V + E) |

Tiny example: from A, edges A→B (4), A→C (1), C→B (2). BFS would say B is one edge away, but the cheapest route costs 3 via C — weights call for Dijkstra.

## Why It Works

All these algorithms repeatedly **relax** edges: if `dist[u] + w(u, v) < dist[v]`, a better route to v has been found. Dijkstra settles nodes in increasing distance order, which is valid only when no edge can make a settled distance smaller later — that is, with non-negative weights. Bellman–Ford relaxes every edge V − 1 times, enough for any shortest path (at most V − 1 edges) even with negative weights. The pattern's skill is mapping the story to a graph: what are the nodes (often states), what are the edges and their costs, and is the objective a sum, a product, or a bottleneck (max/min along the path)?

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "Minimum cost / time / distance / effort from A to B" with varying costs | weighted shortest path |
| "Network delay", "time for a signal to reach all nodes" | single-source shortest paths, take the maximum |
| "Maximum probability path" | products of probabilities ≤ 1 → Dijkstra with max instead of min |
| "Minimise the maximum edge on the path" (effort, height, water level) | bottleneck path: Dijkstra on max, or binary search + BFS, or DSU |
| "With at most k stops / edges" | Bellman–Ford limited to k rounds, or BFS over (node, stops) |
| Changing a cell or direction costs 1, following it costs 0 | 0-1 BFS |
| "Distance between every pair" with small n | Floyd–Warshall |
| Several required meeting points / sources | run Dijkstra from each (and on the reversed graph if needed) |

## Typical Problem Structure

- Input: n nodes and weighted edges `[u, v, w]` (directed or undirected), or a grid with per-move costs.
- Output: a minimum (or maximum) path value, all distances, or −1 if unreachable.
- Modelling decisions: node = (position, extra state)? edge weight = cost of one move? objective = sum / product / max?

## Template

```pseudocode
dijkstra(source):
    dist[all] ← ∞; dist[source] ← 0
    heap ← {(0, source)}
    while heap not empty:
        (d, u) ← heap.popMin()
        if d > dist[u]: continue                    // stale entry
        for (v, w) in adj[u]:
            if d + w < dist[v]:
                dist[v] ← d + w
                heap.push((dist[v], v))
    return dist
```

## Java Template

```java
import java.util.*;

public class DijkstraTemplate {

    // edges[i] = {u, v, w}, directed, w ≥ 0.
    static long[] dijkstra(int n, int[][] edges, int source) {
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) adj.get(e[0]).add(new int[] {e[1], e[2]});
        long[] dist = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[source] = 0;
        PriorityQueue<long[]> heap = new PriorityQueue<>(Comparator.comparingLong(x -> x[0]));
        heap.offer(new long[] {0, source});
        while (!heap.isEmpty()) {
            long[] top = heap.poll();
            int u = (int) top[1];
            if (top[0] > dist[u]) continue;            // outdated entry
            for (int[] e : adj.get(u)) {
                if (dist[u] + e[1] < dist[e[0]]) {
                    dist[e[0]] = dist[u] + e[1];
                    heap.offer(new long[] {dist[e[0]], e[0]});
                }
            }
        }
        return dist;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(dijkstra(3, new int[][] {{0, 1, 4}, {0, 2, 1}, {2, 1, 2}}, 0)));
    }
}
```

**Output:**

```text
[0, 3, 1]
```

## Example Problem

**Path with maximum success probability.** In an undirected graph, edge i succeeds with probability `succProb[i]`. Return the maximum probability of reaching `end` from `start` (0 if unreachable). Example: n = 3, edges `[[0, 1], [1, 2], [0, 2]]`, probabilities `[0.5, 0.5, 0.2]`, start 0, end 2 → `0.25`.

- **Brute force:** enumerate all simple paths — exponential.
- **Recognise:** the path value is a **product** of numbers in [0, 1]. Extending a path can only keep or lower its value — the analogue of non-negative weights. So Dijkstra works with a **max-heap** and `max` in place of `min`. (Equivalently, minimise the sum of −log p.)

```java
import java.util.*;

public class MaxProbabilityPath {

    static double maxProbability(int n, int[][] edges, double[] prob, int start, int end) {
        List<List<double[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int i = 0; i < edges.length; i++) {
            adj.get(edges[i][0]).add(new double[] {edges[i][1], prob[i]});
            adj.get(edges[i][1]).add(new double[] {edges[i][0], prob[i]});
        }
        double[] best = new double[n];
        best[start] = 1.0;
        PriorityQueue<double[]> heap = new PriorityQueue<>((a, b) -> Double.compare(b[0], a[0]));   // max-heap
        heap.offer(new double[] {1.0, start});
        while (!heap.isEmpty()) {
            double[] top = heap.poll();
            int u = (int) top[1];
            if (u == end) return top[0];               // first time end is popped, it is optimal
            if (top[0] < best[u]) continue;
            for (double[] e : adj.get(u)) {
                int v = (int) e[0];
                double p = top[0] * e[1];
                if (p > best[v]) {
                    best[v] = p;
                    heap.offer(new double[] {p, v});
                }
            }
        }
        return 0.0;
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1}, {1, 2}, {0, 2}};
        System.out.println(maxProbability(3, edges, new double[] {0.5, 0.5, 0.2}, 0, 2) + " " + maxProbability(3, edges, new double[] {0.5, 0.5, 0.3}, 0, 2) + " "
                + maxProbability(3, new int[][] {{0, 1}}, new double[] {0.5}, 0, 2));
    }
}
```

**Output:**

```text
0.25 0.3 0.0
```

## Dry Run

Probabilities `[0.5, 0.5, 0.2]` (edges 0–1, 1–2, 0–2), start 0, end 2:

| Pop (prob, node) | Updates | Heap after |
|------------------|---------|------------|
| (1.0, 0) | best[1] = 0.5, best[2] = 0.2 | (0.5, 1), (0.2, 2) |
| (0.5, 1) | to 2: 0.5 × 0.5 = 0.25 > 0.2 → best[2] = 0.25 | (0.25, 2), (0.2, 2) |
| (0.25, 2) | node 2 = end → return 0.25 | — |

The direct edge (0.2) loses to the two-edge path (0.25) — the heap order guarantees the better value is popped first.

## Common Mistakes

- Using BFS on weighted graphs (fewest edges ≠ cheapest).
- Using Dijkstra with **negative** edges (settled nodes can still improve) — use Bellman–Ford.
- Not skipping stale heap entries (correct but slower), or using a `visited` set and marking nodes on push instead of on pop (incorrect).
- `int` overflow in `dist[u] + w` when `dist` is `Integer.MAX_VALUE`.
- Forgetting to add both directions for undirected edges.
- For "at most k stops", running plain Dijkstra on node alone — the state must include the stops used, or use k-round Bellman–Ford.

## Variations

- **Bottleneck path:** replace `+` with `max` (minimise the largest edge) — Dijkstra still works.
- **Multiplicative path:** products ≤ 1, maximise (example above).
- **State-expanded Dijkstra:** node = (cell, direction) or (city, fuel); edges between states.
- **Multi-source Dijkstra:** push all sources with distance 0.
- **Reverse graph:** distances **to** a target from everywhere = Dijkstra from the target on reversed edges.
- **Several sources meeting:** run Dijkstra from each source (and from the destination on the reversed graph), combine per node.
- **Count shortest paths:** maintain `ways[v]` alongside `dist[v]`.

## Complexity

| Algorithm | Time | Space |
|-----------|------|-------|
| BFS / 0-1 BFS | O(V + E) | O(V) |
| Dijkstra (binary heap, lazy deletion) | O((V + E) log V) | O(V + E) |
| Bellman–Ford | O(V × E) | O(V) |
| Floyd–Warshall | O(V³) | O(V²) |
| DAG relaxation | O(V + E) | O(V) |

## When Not to Use It

- The graph is unweighted — plain BFS is simpler and faster.
- The question is connectivity only — DFS/BFS/union-find.
- You need a minimum **spanning tree** (connect everything cheaply), not a path — [Kruskal](../../algorithms/kruskals-algorithm/content.md)/[Prim](../../algorithms/prims-algorithm/content.md).
- Longest simple path in a general graph — NP-hard (only DAGs are easy).

## Key Takeaways

- Pick by edge costs: unit → BFS, 0/1 → 0-1 BFS, non-negative → Dijkstra, negative → Bellman–Ford, all pairs small → Floyd–Warshall, DAG → topological relaxation.
- Model states and the objective (sum, product, bottleneck) before choosing.
- Dijkstra: pop the minimum, skip stale entries, relax neighbours; never with negative edges.
