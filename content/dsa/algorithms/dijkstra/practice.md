# Dijkstra's Algorithm — Practice

### P1. Network delay time

**Difficulty:** Medium · **Pattern:** Single-source shortest paths, take the maximum

A signal starts at node k in a directed network of n nodes (1..n) with travel times `times[i] = [u, v, w]`. Return the time until all nodes have received it, or −1 if some never do.

**Constraints:** 1 ≤ n ≤ 100; 1 ≤ E ≤ 6000; 0 ≤ w ≤ 100.

Example: `[[2,1,1],[2,3,1],[3,4,1]]`, n = 4, k = 2 → `2`.

<details>
<summary>Hint</summary>

Every node receives the signal at its shortest-path distance from k. The answer is the largest of these distances.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class NetworkDelay {

    static int networkDelayTime(int[][] times, int n, int k) {
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        for (int[] t : times) adj.get(t[0]).add(new int[] {t[1], t[2]});
        int[] dist = new int[n + 1];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[k] = 0;
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        heap.offer(new int[] {0, k});
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            if (top[0] > dist[top[1]]) continue;
            for (int[] e : adj.get(top[1])) {
                if (top[0] + e[1] < dist[e[0]]) {
                    dist[e[0]] = top[0] + e[1];
                    heap.offer(new int[] {dist[e[0]], e[0]});
                }
            }
        }
        int answer = 0;
        for (int v = 1; v <= n; v++) {
            if (dist[v] == Integer.MAX_VALUE) return -1;
            answer = Math.max(answer, dist[v]);
        }
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(networkDelayTime(new int[][] {{2, 1, 1}, {2, 3, 1}, {3, 4, 1}}, 4, 2) + " "
                + networkDelayTime(new int[][] {{1, 2, 1}}, 2, 2));
    }
}
```

**Output:**

```text
2 -1
```

**Complexity:** O((V + E) log V) time, O(V + E) space.

</details>

### P2. Path with minimum effort

**Difficulty:** Medium · **Pattern:** Dijkstra with a bottleneck (max) cost

Moving between 4-adjacent cells costs the absolute height difference; a path's **effort** is the **maximum** cost along it. Return the minimum effort from the top-left to the bottom-right cell.

**Constraints:** 1 ≤ r, c ≤ 100; heights ≤ 10⁶.

Example: `[[1,2,2],[3,8,2],[5,3,5]]` → `2`.

<details>
<summary>Hint</summary>

Dijkstra still works when the path cost is combined with `max` instead of `+` — the cost never decreases along a path, which is what Dijkstra needs.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class MinimumEffort {

    static int minimumEffort(int[][] h) {
        int rows = h.length, cols = h[0].length;
        int[][] effort = new int[rows][cols];
        for (int[] row : effort) Arrays.fill(row, Integer.MAX_VALUE);
        effort[0][0] = 0;
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));   // {effort, r, c}
        heap.offer(new int[] {0, 0, 0});
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int e = top[0], r = top[1], c = top[2];
            if (r == rows - 1 && c == cols - 1) return e;              // target settled
            if (e > effort[r][c]) continue;
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                int next = Math.max(e, Math.abs(h[nr][nc] - h[r][c]));   // bottleneck, not sum
                if (next < effort[nr][nc]) {
                    effort[nr][nc] = next;
                    heap.offer(new int[] {next, nr, nc});
                }
            }
        }
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(minimumEffort(new int[][] {{1, 2, 2}, {3, 8, 2}, {5, 3, 5}}) + " " + minimumEffort(new int[][] {{1, 2, 3}, {3, 8, 4}, {5, 3, 5}}));
    }
}
```

**Output:**

```text
2 1
```

**Complexity:** O(r c log(r c)) time, O(r c) space. (Binary search on the answer + BFS also works: O(r c log H).)

</details>

### P3. Number of ways to arrive at the destination

**Difficulty:** Hard · **Pattern:** Dijkstra + counting shortest paths

In an undirected weighted graph of n intersections (0..n − 1), count the number of different shortest paths from 0 to n − 1, modulo 10⁹ + 7.

**Constraints:** 1 ≤ n ≤ 200; weights up to 10⁹ (use `long`).

Example: n = 7, roads `[[0,6,7],[0,1,2],[1,2,3],[1,3,3],[6,3,3],[3,5,1],[6,5,1],[2,5,1],[0,4,5],[4,6,2]]` → `4`.

<details>
<summary>Hint</summary>

Keep `ways[v]`. On a strictly shorter path to v, reset `ways[v] = ways[u]`; on an equally short path, add `ways[u]`. Vertices are popped in distance order, so `ways[u]` is final when u is popped.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class CountShortestPaths {

    static int countPaths(int n, int[][] roads) {
        final int MOD = 1_000_000_007;
        List<List<long[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] r : roads) {
            adj.get(r[0]).add(new long[] {r[1], r[2]});
            adj.get(r[1]).add(new long[] {r[0], r[2]});
        }
        long[] dist = new long[n];
        long[] ways = new long[n];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[0] = 0;
        ways[0] = 1;
        PriorityQueue<long[]> heap = new PriorityQueue<>((a, b) -> Long.compare(a[0], b[0]));
        heap.offer(new long[] {0, 0});
        while (!heap.isEmpty()) {
            long[] top = heap.poll();
            long d = top[0];
            int u = (int) top[1];
            if (d > dist[u]) continue;
            for (long[] e : adj.get(u)) {
                int v = (int) e[0];
                long nd = d + e[1];
                if (nd < dist[v]) {                       // strictly better: replace the count
                    dist[v] = nd;
                    ways[v] = ways[u];
                    heap.offer(new long[] {nd, v});
                } else if (nd == dist[v]) {               // another shortest path: add
                    ways[v] = (ways[v] + ways[u]) % MOD;
                }
            }
        }
        return (int) ways[n - 1];
    }

    public static void main(String[] args) {
        int[][] roads = {{0, 6, 7}, {0, 1, 2}, {1, 2, 3}, {1, 3, 3}, {6, 3, 3}, {3, 5, 1}, {6, 5, 1}, {2, 5, 1}, {0, 4, 5}, {4, 6, 2}};
        System.out.println(countPaths(7, roads) + " " + countPaths(2, new int[][] {{1, 0, 10}}));
    }
}
```

**Output:**

```text
4 1
```

**Complexity:** O((V + E) log V) time, O(V + E) space.

</details>
