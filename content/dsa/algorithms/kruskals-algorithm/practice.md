# Kruskal's Algorithm (Minimum Spanning Tree) — Practice

### P1. Connecting cities with minimum cost

**Difficulty:** Medium · **Pattern:** Kruskal on an edge list

n cities (1..n) and possible connections `[a, b, cost]` are given. Return the minimum cost to connect all cities, or −1 if impossible.

**Constraints:** 1 ≤ n ≤ 10⁴; connections ≤ 10⁴.

Example: n = 3, `[[1,2,5],[1,3,6],[2,3,1]]` → `6`; n = 4, `[[1,2,3],[3,4,4]]` → `-1`.

<details>
<summary>Hint</summary>

The input is already an edge list — sort by cost and union. Remember the 1-indexing.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class ConnectingCities {

    static int[] parent;

    static int find(int x) {
        return parent[x] == x ? x : (parent[x] = find(parent[x]));
    }

    static int minimumCost(int n, int[][] connections) {
        parent = new int[n + 1];
        for (int i = 0; i <= n; i++) parent[i] = i;
        int[][] edges = connections.clone();
        Arrays.sort(edges, Comparator.comparingInt(e -> e[2]));
        int cost = 0, used = 0;
        for (int[] e : edges) {
            int a = find(e[0]), b = find(e[1]);
            if (a != b) {
                parent[a] = b;
                cost += e[2];
                if (++used == n - 1) return cost;
            }
        }
        return n == 1 ? 0 : -1;
    }

    public static void main(String[] args) {
        System.out.println(minimumCost(3, new int[][] {{1, 2, 5}, {1, 3, 6}, {2, 3, 1}}) + " " + minimumCost(4, new int[][] {{1, 2, 3}, {3, 4, 4}}));
    }
}
```

**Output:**

```text
6 -1
```

**Complexity:** O(E log E) time, O(n + E) space.

</details>

### P2. Critical and pseudo-critical MST edges

**Difficulty:** Hard · **Pattern:** Re-run Kruskal with an edge excluded or forced

An edge is **critical** if deleting it increases the MST weight (or disconnects the graph), and **pseudo-critical** if it appears in some MST but is not critical. Return the indices of both kinds.

**Constraints:** 2 ≤ n ≤ 100; 1 ≤ E ≤ min(200, n(n − 1)/2).

Example: n = 5, edges `[[0,1,1],[1,2,1],[2,3,2],[0,3,2],[0,4,3],[3,4,3],[1,4,6]]` → critical `[0, 1]`, pseudo-critical `[2, 3, 4, 5]`.

<details>
<summary>Hint</summary>

Compute the MST weight W. For each edge i: run Kruskal **without** it — if the weight exceeds W (or the graph disconnects), it is critical. Otherwise run Kruskal with edge i **forced in first** — if the weight equals W, it is pseudo-critical.

</details>

<details>
<summary>Answer</summary>

**Approach:** Small constraints allow O(E) extra Kruskal runs, each O(E α(n)) after one global sort: O(E² α(n)) total.

```java
import java.util.*;

public class CriticalEdges {

    static int[] parent;

    static int find(int x) {
        return parent[x] == x ? x : (parent[x] = find(parent[x]));
    }

    // MST weight skipping edge `skip`, starting with edge `force` (−1 = none); MAX_VALUE if disconnected.
    static int kruskal(int n, int[][] edges, Integer[] order, int skip, int force) {
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        int weight = 0, used = 0;
        if (force != -1) {
            parent[find(edges[force][0])] = find(edges[force][1]);
            weight += edges[force][2];
            used++;
        }
        for (int i : order) {
            if (i == skip) continue;
            int a = find(edges[i][0]), b = find(edges[i][1]);
            if (a != b) {
                parent[a] = b;
                weight += edges[i][2];
                used++;
            }
        }
        return used == n - 1 ? weight : Integer.MAX_VALUE;
    }

    static List<List<Integer>> classify(int n, int[][] edges) {
        Integer[] order = new Integer[edges.length];
        for (int i = 0; i < order.length; i++) order[i] = i;
        Arrays.sort(order, Comparator.comparingInt(i -> edges[i][2]));
        int best = kruskal(n, edges, order, -1, -1);
        List<Integer> critical = new ArrayList<>(), pseudo = new ArrayList<>();
        for (int i = 0; i < edges.length; i++) {
            if (kruskal(n, edges, order, i, -1) > best) critical.add(i);
            else if (kruskal(n, edges, order, -1, i) == best) pseudo.add(i);
        }
        return List.of(critical, pseudo);
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1, 1}, {1, 2, 1}, {2, 3, 2}, {0, 3, 2}, {0, 4, 3}, {3, 4, 3}, {1, 4, 6}};
        System.out.println(classify(5, edges));
    }
}
```

**Output:**

```text
[[0, 1], [2, 3, 4, 5]]
```

**Complexity:** O(E log E + E² α(n)) time, O(n + E) space.

</details>
