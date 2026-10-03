# Strongly Connected Components — Practice

### P1. A directed graph has SCCs A, B, C with condensation edges A → B and A → C. Which statement is true?

**Difficulty:** Medium · **Pattern:** Reasoning about the condensation DAG

- A) Every vertex in B can reach every vertex in A
- B) Every vertex in A can reach every vertex in B and C
- C) B and C must be the same component
- D) The condensation can contain the edge B → A as well

<details>
<summary>Hint</summary>

Inside an SCC everything is mutually reachable; between SCCs edges go one way only.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) Every vertex in A can reach every vertex in B and C

**Explanation:** Any vertex in A reaches the endpoint of the A → B edge (within A), crosses it, and then reaches all of B (within B). D is impossible: B → A would put A and B on a cycle, merging them into one SCC.

</details>

### P2. Minimum edges to make a directed graph strongly connected

**Difficulty:** Hard · **Pattern:** Count sources and sinks of the condensation

Return the minimum number of directed edges to add so that the whole graph becomes strongly connected.

**Constraints:** 1 ≤ n ≤ 10⁴; E ≤ 10⁵.

Example: n = 4, edges `[[0,1],[1,2],[2,0],[2,3]]` → `1` (add 3 → 0).

<details>
<summary>Hint</summary>

Compute SCCs and the condensation DAG. Each source component needs an incoming edge and each sink component an outgoing edge; one added edge can serve one sink and one source. If there is only one SCC, the answer is 0.

</details>

<details>
<summary>Answer</summary>

**Approach:** Label components (Kosaraju), compute in-degree and out-degree of each component using edges between different components, then answer max(#sources, #sinks) — a known result for DAG augmentation.

```java
import java.util.*;

public class MakeStronglyConnected {

    static int[] comp;

    static int minEdgesToAdd(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>(), rev = new ArrayList<>();
        for (int i = 0; i < n; i++) { adj.add(new ArrayList<>()); rev.add(new ArrayList<>()); }
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); rev.get(e[1]).add(e[0]); }
        boolean[] seen = new boolean[n];
        Deque<Integer> order = new ArrayDeque<>();
        for (int v = 0; v < n; v++) if (!seen[v]) finish(v, adj, seen, order);
        comp = new int[n];
        Arrays.fill(comp, -1);
        int count = 0;
        while (!order.isEmpty()) {
            int v = order.pop();
            if (comp[v] == -1) label(v, rev, count++);
        }
        if (count == 1) return 0;
        boolean[] hasIn = new boolean[count], hasOut = new boolean[count];
        for (int[] e : edges) {
            if (comp[e[0]] != comp[e[1]]) {
                hasOut[comp[e[0]]] = true;
                hasIn[comp[e[1]]] = true;
            }
        }
        int sources = 0, sinks = 0;
        for (int c = 0; c < count; c++) {
            if (!hasIn[c]) sources++;
            if (!hasOut[c]) sinks++;
        }
        return Math.max(sources, sinks);
    }

    private static void finish(int u, List<List<Integer>> adj, boolean[] seen, Deque<Integer> order) {
        seen[u] = true;
        for (int v : adj.get(u)) if (!seen[v]) finish(v, adj, seen, order);
        order.push(u);
    }

    private static void label(int u, List<List<Integer>> rev, int id) {
        comp[u] = id;
        for (int v : rev.get(u)) if (comp[v] == -1) label(v, rev, id);
    }

    public static void main(String[] args) {
        System.out.println(minEdgesToAdd(4, new int[][] {{0, 1}, {1, 2}, {2, 0}, {2, 3}}) + " "
                + minEdgesToAdd(3, new int[][] {}) + " " + minEdgesToAdd(3, new int[][] {{0, 1}, {1, 2}, {2, 0}}));
    }
}
```

**Output:**

```text
1 3 0
```

**Complexity:** O(V + E) time and space. (Three isolated vertices: 3 sources and 3 sinks → 3 edges, e.g. a cycle 0 → 1 → 2 → 0.)

</details>
