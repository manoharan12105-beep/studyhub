# Bellman–Ford Algorithm

## Definition

The **Bellman–Ford algorithm** computes single-source shortest paths in a graph whose edges may have **negative** weights. It **relaxes every edge V − 1 times**; one more pass that still improves some distance proves the graph contains a **negative cycle** reachable from the source. It runs in **O(V × E)** time.

## Why It Matters

Dijkstra fails with negative weights; Bellman–Ford handles them and detects negative cycles, which model real situations: currency arbitrage (a cycle of exchanges that makes money), cost refunds, and constraint systems. Its "at most k edges" structure also solves "cheapest path with at most k stops" problems directly.

## Prerequisites

- [Dijkstra](../dijkstra/content.md) — relaxation.
- [Graph](../../data-structures/graph/content.md) — edge lists.

## Intuition

A shortest path without cycles uses at most V − 1 edges. After the first pass over all edges, every vertex whose shortest path has 1 edge has the right distance; after the second pass, every vertex whose shortest path has ≤ 2 edges; …; after V − 1 passes, all of them. If a V-th pass can still lower a distance, the "shortest path" would need V or more edges — only possible if it loops around a cycle with negative total weight.

## How It Works

1. `dist[source] = 0`, all others ∞.
2. Repeat V − 1 times: for every edge (u, v, w), if `dist[u] ≠ ∞` and `dist[u] + w < dist[v]`, set `dist[v] = dist[u] + w`.
   - Optimisation: stop early if a whole pass changes nothing.
3. Run one more pass: if any edge can still be relaxed, a negative cycle is reachable from the source.

### Exactly-k-edges variant

To limit paths to at most k edges (e.g. "at most k stops"), run k passes and relax from a **copy** of the previous pass's distances; otherwise one pass could chain several edges and exceed the limit.

## Visual Explanation

```text
Edges (u, v, w): (0,1,4) (0,2,5) (1,2,-3) (2,3,4) (3,1,2)   source 0

pass 0 (start):  dist = [0, ∞, ∞, ∞]
pass 1:  0→1: 4    0→2: 5    1→2: 4−3 = 1    2→3: 1+4 = 5    3→1: 5+2 = 7 (not < 4)
         dist = [0, 4, 1, 5]
pass 2:  no edge improves anything → stop early
check:   no edge relaxes → no negative cycle

Change (3,1,2) to (3,1,-2): cycle 1→2→3→1 has weight −3 + 4 − 2 = −1 < 0
→ distances keep dropping every pass → negative cycle detected
```

## Pseudocode

```pseudocode
bellmanFord(V, edges, source):
    dist[all] ← ∞; dist[source] ← 0
    repeat V − 1 times:
        changed ← false
        for (u, v, w) in edges:
            if dist[u] ≠ ∞ and dist[u] + w < dist[v]:
                dist[v] ← dist[u] + w; changed ← true
        if not changed: break
    for (u, v, w) in edges:
        if dist[u] ≠ ∞ and dist[u] + w < dist[v]: return "negative cycle"
    return dist
```

## Java Implementation

```java
import java.util.*;

public class BellmanFord {

    static final long INF = Long.MAX_VALUE / 4;         // headroom so INF + w does not overflow

    // Returns distances, or null if a negative cycle is reachable from the source.
    static long[] shortestPaths(int vertices, int[][] edges, int source) {
        long[] dist = new long[vertices];
        Arrays.fill(dist, INF);
        dist[source] = 0;
        for (int pass = 1; pass < vertices; pass++) {
            boolean changed = false;
            for (int[] e : edges) {
                if (dist[e[0]] != INF && dist[e[0]] + e[2] < dist[e[1]]) {
                    dist[e[1]] = dist[e[0]] + e[2];
                    changed = true;
                }
            }
            if (!changed) break;                         // already optimal
        }
        for (int[] e : edges) {
            if (dist[e[0]] != INF && dist[e[0]] + e[2] < dist[e[1]]) {
                return null;                             // still improving after V-1 passes
            }
        }
        return dist;
    }

    // Cheapest price from src to dst using at most k stops (k + 1 edges).
    static int cheapestWithinStops(int n, int[][] flights, int src, int dst, int k) {
        long[] dist = new long[n];
        Arrays.fill(dist, INF);
        dist[src] = 0;
        for (int i = 0; i <= k; i++) {
            long[] previous = dist.clone();              // relax only from last round's values
            for (int[] f : flights) {
                if (previous[f[0]] != INF && previous[f[0]] + f[2] < dist[f[1]]) {
                    dist[f[1]] = previous[f[0]] + f[2];
                }
            }
        }
        return dist[dst] == INF ? -1 : (int) dist[dst];
    }

    static String show(long[] dist) {
        if (dist == null) return "negative cycle";
        StringBuilder sb = new StringBuilder();
        for (long d : dist) sb.append(d == INF ? "INF" : String.valueOf(d)).append(' ');
        return sb.toString().trim();
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1, 4}, {0, 2, 5}, {1, 2, -3}, {2, 3, 4}, {3, 1, 2}};
        System.out.println("dist: " + show(shortestPaths(5, edges, 0)));
        int[][] withNegativeCycle = {{0, 1, 4}, {0, 2, 5}, {1, 2, -3}, {2, 3, 4}, {3, 1, -2}};
        System.out.println("with cycle 1->2->3->1 of weight -1: " + show(shortestPaths(4, withNegativeCycle, 0)));

        int[][] flights = {{0, 1, 100}, {1, 2, 100}, {2, 3, 100}, {0, 2, 500}};
        System.out.println("cheapest 0->3 with <= 1 stop: " + cheapestWithinStops(4, flights, 0, 3, 1)
                + ", with <= 2 stops: " + cheapestWithinStops(4, flights, 0, 3, 2));
    }
}
```

**Output:**

```text
dist: 0 4 1 5 INF
with cycle 1->2->3->1 of weight -1: negative cycle
cheapest 0->3 with <= 1 stop: 600, with <= 2 stops: 300
```

## Dry Run

Cheapest flights with ≤ 1 stop (k = 1 → 2 rounds), dist starts `[0, ∞, ∞, ∞]`:

| Round | Relax from `previous` | dist after |
|-------|------------------------|------------|
| 1 | 0→1 = 100, 0→2 = 500 (1→2, 2→3 use ∞ from previous) | [0, 100, 500, ∞] |
| 2 | 1→2 = 200, 2→3 = 500 + 100 = 600 | [0, 100, 200, 600] |

Without the copy, round 1 would chain 0→1→2→3 in one pass (300) and break the stop limit.

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best | O(E) | early exit after a pass with no change (e.g. edges already in a good order) |
| Average / Worst | O(V × E) | V − 1 passes over all E edges, plus one check pass |

**Space:** O(V) for distances (plus the edge list).

## Properties

- Works with negative weights; detects negative cycles reachable from the source.
- Order of edges affects how fast it converges, not the result.
- Natural fit for an **edge list** representation.

## Variations

- **SPFA (queue-based Bellman–Ford):** only relax edges out of vertices whose distance changed; often faster in practice, same O(V × E) worst case.
- **At most k edges** (cheapest flights within k stops) — k + 1 rounds with a copy.
- **Finding the vertices affected by a negative cycle:** mark vertices relaxed in the V-th pass and everything reachable from them as −∞.
- **Difference constraints** (x_j − x_i ≤ c) solved as shortest paths.

## Comparison

| | Dijkstra | Bellman–Ford | Floyd–Warshall |
|---|----------|--------------|----------------|
| Negative weights | no | yes | yes |
| Negative cycle detection | no | yes | yes |
| Sources | one | one | all pairs |
| Time | O((V + E) log V) | O(V × E) | O(V³) |

## Edge Cases

- Vertices unreachable from the source stay ∞ — do not relax from ∞ (`INF + negative` would look smaller).
- Negative cycles not reachable from the source do not affect the result.
- Overflow: use `long` and an INF with headroom.

## Advantages

- Handles negative edges; detects negative cycles; simple loops over an edge list.

## Disadvantages

- O(V × E) — too slow for large graphs (V = E = 10⁵ → 10¹⁰).

## When to Use

- Negative edge weights, or you need to detect a negative cycle (arbitrage).
- "Shortest/cheapest path using at most k edges".
- Small graphs where simplicity matters.

## Common Mistakes

- Relaxing from vertices whose distance is still ∞.
- Running only V − 1 passes and forgetting the negative-cycle check.
- For "at most k edges", relaxing in place instead of from a copy of the previous round.

## Key Takeaways

- Relax all edges V − 1 times; any improvement on pass V ⇒ negative cycle.
- O(V × E); works with negative weights, unlike Dijkstra.
- k rounds with a copy ⇒ shortest paths using at most k edges.
