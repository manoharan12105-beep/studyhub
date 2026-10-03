# Graph — Practice

### P1. Find the town judge

**Difficulty:** Easy · **Pattern:** In-degree / out-degree

In a town of n people (labelled 1..n), `trust[i] = {a, b}` means a trusts b. The judge trusts nobody and is trusted by everyone else. Return the judge's label or −1.

**Constraints:** 1 ≤ n ≤ 1000; 0 ≤ trust.length ≤ 10⁴.

Example: n = 3, trust `[[1,3],[2,3]]` → `3`.

<details>
<summary>Hint</summary>

The judge has in-degree n − 1 and out-degree 0. One score array `in − out` is enough.

</details>

<details>
<summary>Answer</summary>

```java
public class TownJudge {

    static int findJudge(int n, int[][] trust) {
        int[] score = new int[n + 1];             // in-degree minus out-degree, 1-indexed
        for (int[] t : trust) {
            score[t[0]]--;
            score[t[1]]++;
        }
        for (int person = 1; person <= n; person++) {
            if (score[person] == n - 1) return person;
        }
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(findJudge(3, new int[][] {{1, 3}, {2, 3}}) + " " + findJudge(3, new int[][] {{1, 3}, {2, 3}, {3, 1}}) + " " + findJudge(1, new int[][] {}));
    }
}
```

**Output:**

```text
3 -1 1
```

**Complexity:** O(n + E) time, O(n) space. Score n − 1 is only reachable with in-degree n − 1 and out-degree 0.

</details>

### P2. Centre of a star graph

**Difficulty:** Easy · **Pattern:** Degree reasoning

A star graph has one centre connected to every other vertex and no other edges. Given its edge list, return the centre.

**Constraints:** 3 ≤ n ≤ 10⁵; the input is a valid star.

Example: `[[1,2],[2,3],[4,2]]` → `2`.

<details>
<summary>Hint</summary>

The centre appears in every edge — so it appears in the first two edges.

</details>

<details>
<summary>Answer</summary>

```java
public class StarCentre {

    static int findCenter(int[][] edges) {
        int a = edges[0][0], b = edges[0][1];
        return (a == edges[1][0] || a == edges[1][1]) ? a : b;
    }

    public static void main(String[] args) {
        System.out.println(findCenter(new int[][] {{1, 2}, {2, 3}, {4, 2}}) + " " + findCenter(new int[][] {{1, 2}, {5, 1}, {1, 3}, {1, 4}}));
    }
}
```

**Output:**

```text
2 1
```

**Complexity:** O(1). Counting degrees would be O(E) — correct, but it ignores the structure.

</details>

### P3. Minimum set of vertices that reach every node in a DAG

**Difficulty:** Medium · **Pattern:** In-degree zero

Given a directed acyclic graph with n vertices, return the smallest set of vertices from which all vertices are reachable.

**Constraints:** 2 ≤ n ≤ 10⁵; 1 ≤ E ≤ 10⁵.

Example: n = 6, edges `[[0,1],[0,2],[2,5],[3,4],[4,2]]` → `[0, 3]`.

<details>
<summary>Hint</summary>

A vertex with an incoming edge can be reached from its predecessor. Which vertices can never be reached from anything else?

</details>

<details>
<summary>Answer</summary>

**Approach:** Vertices with in-degree 0 must be in the set (nothing reaches them). And in a DAG every vertex is reachable from some in-degree-0 vertex (follow edges backwards; it must stop because there are no cycles). So the answer is exactly the in-degree-0 vertices.

```java
import java.util.*;

public class MinReachSet {

    static List<Integer> findSmallestSet(int n, int[][] edges) {
        boolean[] hasIncoming = new boolean[n];
        for (int[] e : edges) hasIncoming[e[1]] = true;
        List<Integer> result = new ArrayList<>();
        for (int v = 0; v < n; v++) if (!hasIncoming[v]) result.add(v);
        return result;
    }

    public static void main(String[] args) {
        System.out.println(findSmallestSet(6, new int[][] {{0, 1}, {0, 2}, {2, 5}, {3, 4}, {4, 2}}));
    }
}
```

**Output:**

```text
[0, 3]
```

**Complexity:** O(V + E) time, O(V) space.

</details>

### P4. Maximal network rank

**Difficulty:** Medium · **Pattern:** Degrees + adjacency lookup

There are n cities and a list of undirected roads. The network rank of two different cities is the total number of roads connected to either city; a road between them counts once. Return the maximum network rank over all pairs.

**Constraints:** 2 ≤ n ≤ 100; 0 ≤ roads ≤ n(n − 1)/2.

Example: n = 4, roads `[[0,1],[0,3],[1,2],[1,3]]` → `4` (cities 0 and 1: 2 + 3 − 1).

<details>
<summary>Hint</summary>

rank(a, b) = degree(a) + degree(b) − (1 if a and b are directly connected). n is small, so checking all pairs with an O(1) edge lookup (adjacency matrix) is fine.

</details>

<details>
<summary>Answer</summary>

```java
public class NetworkRank {

    static int maximalNetworkRank(int n, int[][] roads) {
        int[] degree = new int[n];
        boolean[][] connected = new boolean[n][n];    // O(1) edge checks; n ≤ 100
        for (int[] r : roads) {
            degree[r[0]]++;
            degree[r[1]]++;
            connected[r[0]][r[1]] = connected[r[1]][r[0]] = true;
        }
        int best = 0;
        for (int a = 0; a < n; a++) {
            for (int b = a + 1; b < n; b++) {
                best = Math.max(best, degree[a] + degree[b] - (connected[a][b] ? 1 : 0));
            }
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(maximalNetworkRank(4, new int[][] {{0, 1}, {0, 3}, {1, 2}, {1, 3}}));
        System.out.println(maximalNetworkRank(5, new int[][] {{0, 1}, {0, 3}, {1, 2}, {1, 3}, {2, 3}, {2, 4}}));
    }
}
```

**Output:**

```text
4
5
```

**Complexity:** O(n² + E) time, O(n²) space. This is a case where the matrix representation is the right choice: n is small and the algorithm needs constant-time edge checks.

</details>
