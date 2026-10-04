# Shortest Path Pattern — Practice

### P1. Minimum sign changes to create a valid grid path

**Difficulty:** Hard · **Pattern:** 0-1 BFS (following a sign costs 0, changing it costs 1)

Each cell has a sign: 1 → right, 2 → left, 3 → down, 4 → up. Starting at the top-left, you follow signs. You may change any cell's sign at cost 1 (each cell at most once). Return the minimum total cost to create a path to the bottom-right.

**Constraints:** 1 ≤ rows, cols ≤ 100.

Example: `[[1,1,1,1],[2,2,2,2],[1,1,1,1],[2,2,2,2]]` → `3`; `[[1,1,3],[3,2,2],[1,1,4]]` → `0`.

<details>
<summary>Hint</summary>

Model each cell as a node with 4 edges: the direction its sign points costs 0, the other three cost 1. Edge weights are only 0 and 1, so use a deque: push 0-cost neighbours to the front and 1-cost neighbours to the back.

</details>

<details>
<summary>Answer</summary>

**Approach:** 0-1 BFS keeps the deque sorted by distance (front values ≤ back values, differing by at most 1), giving Dijkstra's correctness in O(V + E).

```java
import java.util.*;

public class MinCostValidPath {

    static int minCost(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};   // signs 1, 2, 3, 4
        int[][] dist = new int[rows][cols];
        for (int[] row : dist) Arrays.fill(row, Integer.MAX_VALUE);
        Deque<int[]> deque = new ArrayDeque<>();
        dist[0][0] = 0;
        deque.offerFirst(new int[] {0, 0});
        while (!deque.isEmpty()) {
            int[] cur = deque.pollFirst();
            int r = cur[0], c = cur[1];
            for (int k = 0; k < 4; k++) {
                int nr = r + dirs[k][0], nc = c + dirs[k][1];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                int cost = grid[r][c] == k + 1 ? 0 : 1;          // follow the sign for free
                if (dist[r][c] + cost < dist[nr][nc]) {
                    dist[nr][nc] = dist[r][c] + cost;
                    if (cost == 0) deque.offerFirst(new int[] {nr, nc});
                    else deque.offerLast(new int[] {nr, nc});
                }
            }
        }
        return dist[rows - 1][cols - 1];
    }

    public static void main(String[] args) {
        System.out.println(minCost(new int[][] {{1, 1, 1, 1}, {2, 2, 2, 2}, {1, 1, 1, 1}, {2, 2, 2, 2}}) + " " + minCost(new int[][] {{1, 1, 3}, {3, 2, 2}, {1, 1, 4}}) + " "
                + minCost(new int[][] {{1, 2}, {4, 3}}));
    }
}
```

**Output:**

```text
3 0 1
```

**Complexity:** O(R × C) time and space.

</details>

### P2. Smallest subgraph so two sources reach one destination

**Difficulty:** Hard · **Pattern:** Three Dijkstra runs (two forward, one on the reversed graph)

A directed graph has weighted edges `[u, v, w]`. Choose a set of edges of minimum total weight such that both `src1` and `src2` can reach `dest` using only chosen edges. Return that weight, or −1.

**Constraints:** 3 ≤ n ≤ 10⁵; 1 ≤ edges ≤ 10⁵; 1 ≤ w ≤ 10⁵.

Example: n = 6, edges `[[0,2,2],[0,5,6],[1,0,3],[1,4,5],[2,1,1],[2,3,3],[2,3,4],[3,4,2],[4,5,1]]`, src1 = 0, src2 = 1, dest = 5 → `9`.

<details>
<summary>Hint</summary>

In an optimal answer the two paths share a common suffix: they meet at some node m and continue together to dest. Cost = d1(m) + d2(m) + dt(m), where d1, d2 are distances from the sources and dt(m) is the distance from m to dest (Dijkstra from dest on reversed edges). Minimise over m.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class MinWeightSubgraph {

    static long[] dijkstra(List<List<int[]>> adj, int src) {
        long[] dist = new long[adj.size()];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[src] = 0;
        PriorityQueue<long[]> heap = new PriorityQueue<>(Comparator.comparingLong(x -> x[0]));
        heap.offer(new long[] {0, src});
        while (!heap.isEmpty()) {
            long[] top = heap.poll();
            int u = (int) top[1];
            if (top[0] > dist[u]) continue;
            for (int[] e : adj.get(u)) {
                if (dist[u] + e[1] < dist[e[0]]) {
                    dist[e[0]] = dist[u] + e[1];
                    heap.offer(new long[] {dist[e[0]], e[0]});
                }
            }
        }
        return dist;
    }

    static long minimumWeight(int n, int[][] edges, int src1, int src2, int dest) {
        List<List<int[]>> fwd = new ArrayList<>(), rev = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            fwd.add(new ArrayList<>());
            rev.add(new ArrayList<>());
        }
        for (int[] e : edges) {
            fwd.get(e[0]).add(new int[] {e[1], e[2]});
            rev.get(e[1]).add(new int[] {e[0], e[2]});           // reversed: distances *to* dest
        }
        long[] d1 = dijkstra(fwd, src1), d2 = dijkstra(fwd, src2), dt = dijkstra(rev, dest);
        long best = Long.MAX_VALUE;
        for (int m = 0; m < n; m++) {
            if (d1[m] == Long.MAX_VALUE || d2[m] == Long.MAX_VALUE || dt[m] == Long.MAX_VALUE) continue;
            best = Math.min(best, d1[m] + d2[m] + dt[m]);        // paths meet at m
        }
        return best == Long.MAX_VALUE ? -1 : best;
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 2, 2}, {0, 5, 6}, {1, 0, 3}, {1, 4, 5}, {2, 1, 1}, {2, 3, 3}, {2, 3, 4}, {3, 4, 2}, {4, 5, 1}};
        System.out.println(minimumWeight(6, edges, 0, 1, 5) + " " + minimumWeight(3, new int[][] {{0, 1, 1}, {2, 1, 1}}, 0, 1, 2));
    }
}
```

**Output:**

```text
9 -1
```

**Complexity:** O((V + E) log V) time (three Dijkstra runs), O(V + E) space.

</details>
