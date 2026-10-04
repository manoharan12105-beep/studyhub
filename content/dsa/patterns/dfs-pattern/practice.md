# DFS Pattern — Practice

### P1. Number of closed islands

**Difficulty:** Medium · **Pattern:** Region DFS with a "touches the border" flag

In a grid, 0 is land and 1 is water. A closed island is a group of 4-connected land cells completely surrounded by water (it does not touch the grid border). Count closed islands.

**Constraints:** 1 ≤ rows, cols ≤ 100.

Example: `[[1,1,1,1,1,1,1,0],[1,0,0,0,0,1,1,0],[1,0,1,0,1,1,1,0],[1,0,0,0,0,1,0,1],[1,1,1,1,1,1,1,0]]` → `2`.

<details>
<summary>Hint</summary>

Either flood-fill every land region connected to the border first and then count the remaining regions, or DFS each region and AND together "this cell is not on the border" — without short-circuiting.

</details>

<details>
<summary>Answer</summary>

```java
public class ClosedIslands {

    static int closedIsland(int[][] g) {
        int count = 0;
        for (int r = 0; r < g.length; r++)
            for (int c = 0; c < g[0].length; c++)
                if (g[r][c] == 0 && closed(g, r, c)) count++;
        return count;
    }

    static boolean closed(int[][] g, int r, int c) {
        if (r < 0 || r >= g.length || c < 0 || c >= g[0].length) return false;   // fell off: touches border
        if (g[r][c] != 0) return true;                                            // water or visited
        g[r][c] = 2;
        boolean ok = true;
        ok &= closed(g, r + 1, c);                     // visit all four sides even if one fails
        ok &= closed(g, r - 1, c);
        ok &= closed(g, r, c + 1);
        ok &= closed(g, r, c - 1);
        return ok;
    }

    public static void main(String[] args) {
        int[][] g = {{1, 1, 1, 1, 1, 1, 1, 0}, {1, 0, 0, 0, 0, 1, 1, 0}, {1, 0, 1, 0, 1, 1, 1, 0}, {1, 0, 0, 0, 0, 1, 0, 1}, {1, 1, 1, 1, 1, 1, 1, 0}};
        System.out.println(closedIsland(g) + " " + closedIsland(new int[][] {{0, 0, 1, 0, 0}, {0, 1, 0, 1, 0}, {0, 1, 1, 1, 0}}));
    }
}
```

**Output:**

```text
2 1
```

**Complexity:** O(R × C) time and space (recursion).

</details>

### P2. Detonate the maximum number of bombs

**Difficulty:** Medium · **Pattern:** DFS reachability in a directed graph

Bomb i at (xᵢ, yᵢ) with radius rᵢ detonates every bomb within distance rᵢ of its centre, which may set off more bombs. You may detonate one bomb; return the maximum number of bombs that explode.

**Constraints:** 1 ≤ n ≤ 100; coordinates and radii up to 10⁵.

Example: `[[2, 1, 3], [6, 1, 4]]` → `2`; `[[1, 2, 3], [2, 3, 1], [3, 4, 2], [4, 5, 3], [5, 6, 4]]` → `5`.

<details>
<summary>Hint</summary>

Edge i → j if bomb j lies within bomb i's radius (not symmetric — radii differ). For each start, count nodes reachable by DFS. Compare squared distances with `long` to avoid overflow and square roots.

</details>

<details>
<summary>Answer</summary>

**Approach:** Union-find would be wrong here because reachability is directed (a big bomb can trigger a small one but not the reverse).

```java
import java.util.*;

public class DetonateBombs {

    static int maximumDetonation(int[][] bombs) {
        int n = bombs.length;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            adj.add(new ArrayList<>());
            for (int j = 0; j < n; j++) {
                long dx = bombs[i][0] - bombs[j][0], dy = bombs[i][1] - bombs[j][1], r = bombs[i][2];
                if (i != j && dx * dx + dy * dy <= r * r) adj.get(i).add(j);
            }
        }
        int best = 0;
        for (int s = 0; s < n; s++) best = Math.max(best, reach(s, adj, new boolean[n]));
        return best;
    }

    static int reach(int v, List<List<Integer>> adj, boolean[] seen) {
        seen[v] = true;
        int count = 1;
        for (int u : adj.get(v)) if (!seen[u]) count += reach(u, adj, seen);
        return count;
    }

    public static void main(String[] args) {
        System.out.println(maximumDetonation(new int[][] {{2, 1, 3}, {6, 1, 4}}) + " " + maximumDetonation(new int[][] {{1, 1, 5}, {10, 10, 5}}) + " "
                + maximumDetonation(new int[][] {{1, 2, 3}, {2, 3, 1}, {3, 4, 2}, {4, 5, 3}, {5, 6, 4}}));
    }
}
```

**Output:**

```text
2 1 5
```

**Complexity:** O(n²) to build the graph and O(n × (n + E)) = O(n³) for the searches, O(n²) space.

</details>

### P3. Reconstruct an itinerary

**Difficulty:** Hard · **Pattern:** DFS that consumes edges (Hierholzer's Euler path)

Given airline tickets `[from, to]`, reconstruct the itinerary that starts at `"JFK"` and uses every ticket exactly once. If several exist, return the lexicographically smallest. A valid itinerary is guaranteed.

**Constraints:** 1 ≤ tickets ≤ 300.

Example: `[["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]` → `[JFK, MUC, LHR, SFO, SJC]`.

<details>
<summary>Hint</summary>

Using every edge once is an Euler path. Keep each airport's destinations in a min-heap. DFS: while the current airport has unused tickets, take the smallest and recurse; after an airport has no tickets left, **prepend** it to the answer (post-order). Dead ends are therefore placed at the end automatically.

</details>

<details>
<summary>Answer</summary>

**Approach:** Greedily taking the smallest destination can enter a dead end early; post-order insertion fixes that, because the dead-end airport is added first (it ends the path) and the DFS continues from earlier airports.

```java
import java.util.*;

public class ReconstructItinerary {

    static List<String> findItinerary(List<List<String>> tickets) {
        Map<String, PriorityQueue<String>> graph = new HashMap<>();
        for (List<String> t : tickets) graph.computeIfAbsent(t.get(0), k -> new PriorityQueue<>()).add(t.get(1));
        LinkedList<String> route = new LinkedList<>();
        visit("JFK", graph, route);
        return route;
    }

    static void visit(String airport, Map<String, PriorityQueue<String>> graph, LinkedList<String> route) {
        PriorityQueue<String> next = graph.get(airport);
        while (next != null && !next.isEmpty()) visit(next.poll(), graph, route);   // consume each ticket once
        route.addFirst(airport);                                                   // post-order
    }

    public static void main(String[] args) {
        System.out.println(findItinerary(List.of(List.of("MUC", "LHR"), List.of("JFK", "MUC"), List.of("SFO", "SJC"), List.of("LHR", "SFO"))));
        System.out.println(findItinerary(List.of(List.of("JFK", "KUL"), List.of("JFK", "NRT"), List.of("NRT", "JFK"))));
    }
}
```

**Output:**

```text
[JFK, MUC, LHR, SFO, SJC]
[JFK, NRT, JFK, KUL]
```

**Complexity:** O(E log E) time (heap operations), O(E) space. The second example shows the dead end: KUL is smallest but has no outgoing ticket, so it must come last.

</details>
