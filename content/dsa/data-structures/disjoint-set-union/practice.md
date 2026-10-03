# Disjoint Set Union (Union-Find) — Practice

Solutions include a compact DSU (path compression + union by size), as in the lesson.

### P1. Does a path exist?

**Difficulty:** Easy · **Pattern:** Connectivity query

Given n vertices, an undirected edge list, a source and a destination, return `true` if a path connects them.

**Constraints:** 1 ≤ n ≤ 2 × 10⁵; 0 ≤ E ≤ 2 × 10⁵.

Example: n = 6, edges `[[0,1],[0,2],[3,5],[5,4],[4,3]]`, 0 → 5 → `false`.

<details>
<summary>Hint</summary>

Union every edge, then compare the roots of source and destination. (BFS/DFS from the source works equally well.)

</details>

<details>
<summary>Answer</summary>

```java
public class PathExists {

    static int[] parent, size;

    static int find(int x) {
        return parent[x] == x ? x : (parent[x] = find(parent[x]));
    }

    static void union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return;
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        size[ra] += size[rb];
    }

    static boolean validPath(int n, int[][] edges, int source, int destination) {
        parent = new int[n];
        size = new int[n];
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
        for (int[] e : edges) union(e[0], e[1]);
        return find(source) == find(destination);
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1}, {0, 2}, {3, 5}, {5, 4}, {4, 3}};
        System.out.println(validPath(6, edges, 0, 5) + " " + validPath(6, edges, 3, 4));
    }
}
```

**Output:**

```text
false true
```

**Complexity:** O((V + E) α(V)) time, O(V) space.

</details>

### P2. Redundant connection

**Difficulty:** Medium · **Pattern:** Cycle detection with union

A tree with n vertices (1..n) had one extra edge added. Return the edge that can be removed to restore a tree; if several, return the one that appears **last** in the input.

**Constraints:** 3 ≤ n ≤ 1000; edges.length = n.

Example: `[[1,2],[1,3],[2,3]]` → `[2,3]`.

<details>
<summary>Hint</summary>

Process edges in order. The first edge whose endpoints are already connected closes the cycle — and it is the last edge of that cycle in input order.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class RedundantConnection {

    static int[] parent;

    static int find(int x) {
        return parent[x] == x ? x : (parent[x] = find(parent[x]));
    }

    static int[] findRedundant(int[][] edges) {
        parent = new int[edges.length + 1];          // vertices are 1..n
        for (int i = 0; i < parent.length; i++) parent[i] = i;
        for (int[] e : edges) {
            int ra = find(e[0]), rb = find(e[1]);
            if (ra == rb) return e;                   // already connected: this edge makes the cycle
            parent[ra] = rb;
        }
        return new int[0];
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(findRedundant(new int[][] {{1, 2}, {1, 3}, {2, 3}})));
        System.out.println(Arrays.toString(findRedundant(new int[][] {{1, 2}, {2, 3}, {3, 4}, {1, 4}, {1, 5}})));
    }
}
```

**Output:**

```text
[2, 3]
[1, 4]
```

**Complexity:** O(n α(n)) time, O(n) space. (Path compression alone already makes this fast here.)

</details>

### P3. Is the graph a valid tree?

**Difficulty:** Medium · **Pattern:** Edge count + no cycle

Given n vertices (0..n − 1) and an undirected edge list, return `true` if the edges form a tree.

**Constraints:** 1 ≤ n ≤ 2000; 0 ≤ E ≤ 5000.

Example: n = 5, `[[0,1],[0,2],[0,3],[1,4]]` → `true`; n = 5, `[[0,1],[1,2],[2,3],[1,3],[1,4]]` → `false`.

<details>
<summary>Hint</summary>

A tree has exactly n − 1 edges and no cycle. With exactly n − 1 edges and no cycle, the graph is automatically connected.

</details>

<details>
<summary>Answer</summary>

```java
public class ValidTree {

    static int[] parent;

    static int find(int x) {
        return parent[x] == x ? x : (parent[x] = find(parent[x]));
    }

    static boolean validTree(int n, int[][] edges) {
        if (edges.length != n - 1) return false;
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int[] e : edges) {
            int ra = find(e[0]), rb = find(e[1]);
            if (ra == rb) return false;               // cycle
            parent[ra] = rb;
        }
        return true;                                   // n - 1 edges, acyclic → connected
    }

    public static void main(String[] args) {
        System.out.println(validTree(5, new int[][] {{0, 1}, {0, 2}, {0, 3}, {1, 4}}) + " "
                + validTree(5, new int[][] {{0, 1}, {1, 2}, {2, 3}, {1, 3}, {1, 4}}) + " "
                + validTree(4, new int[][] {{0, 1}, {2, 3}}));
    }
}
```

**Output:**

```text
true false false
```

**Complexity:** O(n α(n)) time, O(n) space.

</details>

### P4. Number of islands after each land addition

**Difficulty:** Hard · **Pattern:** Online connectivity on a grid

An r × c grid starts as all water. Each operation turns one cell into land. After each operation, return the number of islands (groups of 4-directionally connected land).

**Constraints:** 1 ≤ r, c ≤ 10⁴ with r × c ≤ 10⁵; up to 10⁴ operations; a cell may be added twice.

Example: 3 × 3, positions `[[0,0],[0,1],[1,2],[2,1]]` → `[1, 1, 2, 3]`.

<details>
<summary>Hint</summary>

Re-running BFS after each addition costs O(r × c) per step. With DSU: a new land cell adds one island, then each union with a neighbouring land cell that succeeds removes one.

</details>

<details>
<summary>Answer</summary>

**Approach:** Map cell (r, c) to index r × cols + c. Keep `isLand[]`. On adding a cell: if already land, the count is unchanged; otherwise count++ and union with each land neighbour, decrementing the count for every successful union.

```java
import java.util.*;

public class IslandsTwo {

    static int[] parent, size;

    static int find(int x) {
        return parent[x] == x ? x : (parent[x] = find(parent[x]));
    }

    static boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        size[ra] += size[rb];
        return true;
    }

    static List<Integer> numIslands(int rows, int cols, int[][] positions) {
        parent = new int[rows * cols];
        size = new int[rows * cols];
        boolean[] isLand = new boolean[rows * cols];
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        List<Integer> result = new ArrayList<>();
        int islands = 0;
        for (int[] p : positions) {
            int id = p[0] * cols + p[1];
            if (!isLand[id]) {
                isLand[id] = true;
                parent[id] = id;
                size[id] = 1;
                islands++;                                    // a new island of one cell
                for (int[] d : dirs) {
                    int nr = p[0] + d[0], nc = p[1] + d[1];
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                    int neighbour = nr * cols + nc;
                    if (isLand[neighbour] && union(id, neighbour)) islands--;   // two islands became one
                }
            }
            result.add(islands);
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(numIslands(3, 3, new int[][] {{0, 0}, {0, 1}, {1, 2}, {2, 1}}));
        System.out.println(numIslands(3, 3, new int[][] {{0, 0}, {0, 2}, {0, 1}, {0, 1}}));
    }
}
```

**Output:**

```text
[1, 1, 2, 3]
[1, 2, 1, 1]
```

**Complexity:** O(r × c + k α(r × c)) for k operations; O(r × c) space.

</details>
