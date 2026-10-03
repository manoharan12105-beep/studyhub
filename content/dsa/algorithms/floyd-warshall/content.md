# Floyd–Warshall Algorithm

## Definition

The **Floyd–Warshall algorithm** computes the shortest distances between **all pairs** of vertices. It is dynamic programming over intermediate vertices: after processing vertex k, `dist[i][j]` is the shortest path from i to j that uses only vertices 0..k as intermediate stops. Three nested loops give **O(V³)** time and **O(V²)** space. It handles negative edges, and a negative value on the diagonal reveals a **negative cycle**.

## Why It Matters

When you need distances between many pairs in a small, possibly dense graph (V up to a few hundred), Floyd–Warshall is the simplest correct choice — about ten lines of code. It also computes **transitive closure** (which vertices can reach which) and is a clean example of a DP formulation over a clever state.

## Prerequisites

- [Graph](../../data-structures/graph/content.md) — adjacency matrix.
- [Dynamic Programming](../dynamic-programming/content.md) — states and transitions.

## Intuition

Ask, for every pair (i, j): "would going through vertex k make this trip shorter?" Do this for k = 0, then k = 1, and so on. Once every vertex has been offered as a possible stopover, every shortest path has been found — because any shortest path is built from shorter shortest paths through its intermediate vertices.

## How It Works

1. Initialise `dist[i][j]` = edge weight if an edge exists, 0 if i == j, ∞ otherwise.
2. For k = 0..V − 1 (the **outermost** loop), for every i and j:
   `dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])` (skip when either part is ∞).
3. If `dist[i][i] < 0` for any i, i lies on a negative cycle.

**Why k must be the outer loop:** the DP state is "shortest path using intermediates from {0..k}". Every value with intermediates up to k − 1 must be complete before vertex k is allowed. Putting k inside gives wrong results.

**Why updating in place is safe:** in round k, `dist[i][k]` and `dist[k][j]` do not change (going through k to reach k cannot help without a negative cycle), so one matrix suffices.

## Visual Explanation

```text
Edges: 0→1 (3), 0→2 (8), 1→2 (2), 2→3 (1), 3→0 (4)

initial          after k=0          after k=1          after k=2          after k=3
   0  1  2  3      0  1  2  3         0  1  2  3         0  1  2  3         0  1  2  3
0  0  3  8  ∞   0  0  3  8  ∞   0  0  3  5  ∞   0  0  3  5  6   0  0  3  5  6
1  ∞  0  2  ∞   1  ∞  0  2  ∞   1  ∞  0  2  ∞   1  ∞  0  2  3   1  7  0  2  3
2  ∞  ∞  0  1   2  ∞  ∞  0  1   2  ∞  ∞  0  1   2  ∞  ∞  0  1   2  5  8  0  1
3  4  ∞  ∞  0   3  4  7 12  0   3  4  7  9  0   3  4  7  9  0   3  4  7  9  0

k=1: 0→2 improves 8 → 3 + 2 = 5 (go through 1)
k=3: 1→0 = 1→3 + 3→0 = 3 + 4 = 7
```

## Pseudocode

```pseudocode
floydWarshall(dist):            // dist[i][j] = weight, 0 on the diagonal, ∞ if no edge
    for k from 0 to V − 1:
        for i from 0 to V − 1:
            for j from 0 to V − 1:
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] ← dist[i][k] + dist[k][j]
    for i: if dist[i][i] < 0: report negative cycle
```

## Java Implementation

```java
import java.util.*;

public class FloydWarshall {

    static final long INF = Long.MAX_VALUE / 4;

    static long[][] allPairs(int n, int[][] edges) {
        long[][] dist = new long[n][n];
        for (long[] row : dist) Arrays.fill(row, INF);
        for (int i = 0; i < n; i++) dist[i][i] = 0;
        for (int[] e : edges) dist[e[0]][e[1]] = Math.min(dist[e[0]][e[1]], e[2]);   // keep the cheapest parallel edge
        for (int k = 0; k < n; k++) {                    // k outermost: allowed intermediates grow one at a time
            for (int i = 0; i < n; i++) {
                if (dist[i][k] == INF) continue;
                for (int j = 0; j < n; j++) {
                    if (dist[k][j] == INF) continue;
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                    }
                }
            }
        }
        return dist;
    }

    static boolean hasNegativeCycle(long[][] dist) {
        for (int i = 0; i < dist.length; i++) {
            if (dist[i][i] < 0) return true;
        }
        return false;
    }

    // Transitive closure: can i reach j?
    static boolean[][] reachability(int n, int[][] edges) {
        boolean[][] reach = new boolean[n][n];
        for (int i = 0; i < n; i++) reach[i][i] = true;
        for (int[] e : edges) reach[e[0]][e[1]] = true;
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    reach[i][j] |= reach[i][k] && reach[k][j];
        return reach;
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1, 3}, {0, 2, 8}, {1, 2, 2}, {2, 3, 1}, {3, 0, 4}};
        long[][] dist = allPairs(4, edges);
        for (long[] row : dist) {
            StringBuilder sb = new StringBuilder();
            for (long d : row) sb.append(d == INF ? "INF" : String.valueOf(d)).append(' ');
            System.out.println(sb.toString().trim());
        }
        System.out.println("negative cycle: " + hasNegativeCycle(dist)
                + ", with edge 3->0 weight -7: " + hasNegativeCycle(allPairs(4, new int[][] {{0, 1, 3}, {1, 2, 2}, {2, 3, 1}, {3, 0, -7}})));
        boolean[][] reach = reachability(3, new int[][] {{0, 1, 1}, {1, 2, 1}});
        System.out.println("0 reaches 2: " + reach[0][2] + ", 2 reaches 0: " + reach[2][0]);
    }
}
```

**Output:**

```text
0 3 5 6
7 0 2 3
5 8 0 1
4 7 9 0
negative cycle: false, with edge 3->0 weight -7: true
0 reaches 2: true, 2 reaches 0: false
```

## Dry Run

Cell `dist[1][0]` over the rounds (no direct edge 1 → 0):

| After k | Candidate dist[1][k] + dist[k][0] | dist[1][0] |
|---------|-----------------------------------|------------|
| 0 | dist[1][0] + dist[0][0] = ∞ | ∞ |
| 1 | dist[1][1] + dist[1][0] = ∞ | ∞ |
| 2 | dist[1][2] + dist[2][0] = 2 + ∞ | ∞ |
| 3 | dist[1][3] + dist[3][0] = 3 + 4 = 7 | 7 |

`dist[1][3] = 3` was itself found in round k = 2 (1 → 2 → 3) — DP builds on earlier rounds.

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best / Average / Worst | O(V³) | three nested loops over V vertices, regardless of E |

**Space:** O(V²) for the distance matrix (O(V²) more if you store `next[i][j]` to rebuild paths).

## Properties

- All-pairs shortest paths; works with negative edges; detects negative cycles via the diagonal.
- Independent of the number of edges — good for dense graphs, wasteful for sparse ones.

## Variations

- **Path reconstruction:** keep `next[i][j]` (first hop); update it to `next[i][k]` when going through k improves the path.
- **Transitive closure** with booleans (`||`, `&&`).
- **Minimax / maximin paths** (best bottleneck between all pairs) by replacing `+`/`min` with `max`/`min`.

## Comparison

| Need | Algorithm | Time |
|------|-----------|------|
| All pairs, small V (≤ ~400), any weights | Floyd–Warshall | O(V³) |
| All pairs, sparse graph, non-negative weights | Dijkstra from every vertex | O(V (V + E) log V) |
| One source, non-negative weights | Dijkstra | O((V + E) log V) |
| One source, negative weights | Bellman–Ford | O(V E) |

## Edge Cases

- No path: keep ∞ and never add two ∞ values (overflow or wrong comparisons).
- Parallel edges: keep the minimum when initialising.
- Self-loops with positive weight do not matter; negative self-loops are negative cycles.

## Advantages

- Very short code; handles negative edges; answers every pair at once.

## Disadvantages

- O(V³) time and O(V²) memory — impractical beyond a few hundred to ~1000 vertices.

## When to Use

- Many distance queries between arbitrary pairs in a small graph.
- "City with the fewest reachable cities within a distance threshold", transitive closure, small dense graphs.

## Common Mistakes

- Putting the k loop inside the i/j loops.
- Initialising the diagonal to ∞ instead of 0.
- Using `Integer.MAX_VALUE` as ∞ and overflowing on addition.

## Key Takeaways

- DP over allowed intermediate vertices: `dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])`, with k outermost.
- O(V³) time, O(V²) space, all pairs, negative edges allowed; a negative diagonal entry means a negative cycle.
