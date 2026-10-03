# Bridges and Articulation Points — Practice

### P1. Which edges of a graph can never be bridges?

**Difficulty:** Easy · **Pattern:** Bridges vs cycles

- A) Edges incident to a degree-1 vertex
- B) Edges that lie on some cycle
- C) Edges of a tree
- D) The edge with the largest weight

<details>
<summary>Hint</summary>

If an edge is on a cycle, what happens when you remove it?

</details>

<details>
<summary>Answer</summary>

**Answer:** B) Edges that lie on some cycle

**Explanation:** The rest of the cycle is an alternative route between the edge's endpoints, so removing it cannot disconnect anything. Conversely, every tree edge and every edge to a degree-1 vertex **is** a bridge. Weights are irrelevant.

</details>

### P2. Critical connections in a network

**Difficulty:** Hard · **Pattern:** Tarjan low-link bridges

n servers (0..n − 1) are connected by undirected links. Return every link whose removal disconnects some servers from others.

**Constraints:** 2 ≤ n ≤ 10⁵; n − 1 ≤ links ≤ 10⁵; the network is connected; no duplicate links.

Example: n = 4, `[[0,1],[1,2],[2,0],[1,3]]` → `[[1,3]]`.

<details>
<summary>Hint</summary>

Critical connection = bridge. One DFS computing `disc` and `low`; edge (u, v) with child v is a bridge iff `low[v] > disc[u]`.

</details>

<details>
<summary>Answer</summary>

**Approach:** Removing each link and testing connectivity costs O(E × (V + E)) — far too slow for 10⁵. The low-link DFS is O(V + E). With no duplicate links, skipping the parent **vertex** is safe here.

```java
import java.util.*;

public class CriticalConnections {

    static List<List<Integer>> adj;
    static int[] disc, low;
    static int timer;
    static List<List<Integer>> result;

    static List<List<Integer>> criticalConnections(int n, int[][] links) {
        adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] l : links) {
            adj.get(l[0]).add(l[1]);
            adj.get(l[1]).add(l[0]);
        }
        disc = new int[n];
        low = new int[n];
        Arrays.fill(disc, -1);
        timer = 0;
        result = new ArrayList<>();
        dfs(0, -1);
        return result;
    }

    private static void dfs(int u, int parent) {
        disc[u] = low[u] = timer++;
        for (int v : adj.get(u)) {
            if (v == parent) continue;
            if (disc[v] == -1) {
                dfs(v, u);
                low[u] = Math.min(low[u], low[v]);
                if (low[v] > disc[u]) result.add(List.of(u, v));   // no back edge from v's subtree to u or above
            } else {
                low[u] = Math.min(low[u], disc[v]);
            }
        }
    }

    public static void main(String[] args) {
        System.out.println(criticalConnections(4, new int[][] {{0, 1}, {1, 2}, {2, 0}, {1, 3}}));
        System.out.println(criticalConnections(2, new int[][] {{0, 1}}));
    }
}
```

**Output:**

```text
[[1, 3]]
[[0, 1]]
```

**Complexity:** O(V + E) time and space. For n = 10⁵ in a long chain, convert the DFS to an iterative one (or run it in a thread with a larger stack) to avoid `StackOverflowError`.

</details>
