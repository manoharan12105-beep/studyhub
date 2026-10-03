# Prim's Algorithm (Minimum Spanning Tree) — Practice

### P1. Which statement about a minimum spanning tree is always true?

**Difficulty:** Easy · **Pattern:** MST vs shortest paths

- A) The MST path between two vertices is the shortest path between them
- B) An MST of a connected graph with V vertices has exactly V − 1 edges
- C) An MST cannot contain the heaviest edge of the graph
- D) Prim's algorithm fails with negative edge weights

<details>
<summary>Hint</summary>

Think about what "spanning tree" means and test the others on small graphs.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) An MST of a connected graph with V vertices has exactly V − 1 edges

**Explanation:** Every spanning tree has V − 1 edges. A is false (an MST minimises total weight, not individual paths). C is false — if the heaviest edge is a bridge, it must be included. D is false — the cut property does not depend on signs.

</details>

### P2. Minimum cost to connect all points

**Difficulty:** Medium · **Pattern:** Dense Prim on an implicit complete graph

Points are given on a plane; connecting two points costs their Manhattan distance |x₁ − x₂| + |y₁ − y₂|. Return the minimum total cost to connect all points.

**Constraints:** 1 ≤ n ≤ 1000.

Example: `[[0,0],[2,2],[3,10],[5,2],[7,0]]` → `20`.

<details>
<summary>Hint</summary>

Every pair is an edge: E ≈ n²/2 = 5 × 10⁵. Building and sorting all edges (Kruskal) works but costs O(n² log n). The O(n²) array version of Prim computes distances on the fly without storing edges.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class ConnectPoints {

    static int minCostConnectPoints(int[][] points) {
        int n = points.length;
        int[] key = new int[n];                     // cheapest connection of each point to the tree
        Arrays.fill(key, Integer.MAX_VALUE);
        boolean[] inTree = new boolean[n];
        key[0] = 0;
        int total = 0;
        for (int step = 0; step < n; step++) {
            int u = -1;
            for (int v = 0; v < n; v++) {
                if (!inTree[v] && (u == -1 || key[v] < key[u])) u = v;
            }
            inTree[u] = true;
            total += key[u];
            for (int v = 0; v < n; v++) {
                if (!inTree[v]) {
                    int d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);
                    if (d < key[v]) key[v] = d;
                }
            }
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.println(minCostConnectPoints(new int[][] {{0, 0}, {2, 2}, {3, 10}, {5, 2}, {7, 0}}) + " "
                + minCostConnectPoints(new int[][] {{3, 12}, {-2, 5}, {-4, 1}}) + " " + minCostConnectPoints(new int[][] {{0, 0}}));
    }
}
```

**Output:**

```text
20 18 0
```

**Complexity:** O(n²) time, O(n) space — optimal for a complete graph, since there are Θ(n²) edges to consider.

</details>
