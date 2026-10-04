# Topological Sort Pattern — Practice

### P1. Roots of minimum-height trees

**Difficulty:** Medium · **Pattern:** Kahn-style leaf trimming on an undirected tree

A tree has n nodes labelled 0 … n − 1. Choosing a root gives a height. Return all roots that give the minimum height.

**Constraints:** 1 ≤ n ≤ 2 × 10⁴; edges form a tree.

Example: n = 4, edges `[[1, 0], [1, 2], [1, 3]]` → `[1]`; n = 6, edges `[[3, 0], [3, 1], [3, 2], [3, 4], [5, 4]]` → `[3, 4]`.

<details>
<summary>Hint</summary>

BFS from every node is O(n²). The best roots are the centres of the longest path. Remove all leaves (degree 1) layer by layer, like Kahn's algorithm with degrees; the last one or two nodes left are the answer.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class MinHeightTrees {

    static List<Integer> findMinHeightTrees(int n, int[][] edges) {
        if (n == 1) return List.of(0);
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[] degree = new int[n];
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
            degree[e[0]]++;
            degree[e[1]]++;
        }
        List<Integer> leaves = new ArrayList<>();
        for (int v = 0; v < n; v++) if (degree[v] == 1) leaves.add(v);
        int remaining = n;
        while (remaining > 2) {                        // peel one layer of leaves
            remaining -= leaves.size();
            List<Integer> next = new ArrayList<>();
            for (int leaf : leaves)
                for (int u : adj.get(leaf))
                    if (--degree[u] == 1) next.add(u);
            leaves = next;
        }
        return leaves;
    }

    public static void main(String[] args) {
        System.out.println(findMinHeightTrees(4, new int[][] {{1, 0}, {1, 2}, {1, 3}}) + " " + findMinHeightTrees(6, new int[][] {{3, 0}, {3, 1}, {3, 2}, {3, 4}, {5, 4}}));
    }
}
```

**Output:**

```text
[1] [3, 4]
```

**Complexity:** O(n) time and space. A tree has at most two centres, hence the `remaining > 2` stop.

</details>

### P2. Earliest time to finish all courses in parallel

**Difficulty:** Hard · **Pattern:** DP over a topological order (critical path)

There are n courses; course i takes `time[i]` months. `relations[j] = [a, b]` means course a must be finished before b starts. Any number of courses can run at once. Return the minimum months to finish all courses (the graph is a DAG).

**Constraints:** 1 ≤ n ≤ 5 × 10⁴; courses are labelled 1 … n.

Example: n = 3, relations `[[1, 3], [2, 3]]`, time `[3, 2, 5]` → `8`; n = 5, relations `[[1, 5], [2, 5], [3, 5], [3, 4], [4, 5]]`, time `[1, 2, 3, 4, 5]` → `12`.

<details>
<summary>Hint</summary>

`finish[v] = time[v] + max(finish[u])` over prerequisites u (0 if none). Process courses in topological order so all prerequisites are final before v; the answer is the maximum finish time.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class ParallelCourses {

    static int minimumTime(int n, int[][] relations, int[] time) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        int[] indegree = new int[n + 1];
        for (int[] r : relations) {
            adj.get(r[0]).add(r[1]);
            indegree[r[1]]++;
        }
        int[] start = new int[n + 1];                  // earliest start = max finish of prerequisites
        Deque<Integer> queue = new ArrayDeque<>();
        for (int v = 1; v <= n; v++) if (indegree[v] == 0) queue.offer(v);
        int answer = 0;
        while (!queue.isEmpty()) {
            int u = queue.poll();
            int finish = start[u] + time[u - 1];
            answer = Math.max(answer, finish);
            for (int v : adj.get(u)) {
                start[v] = Math.max(start[v], finish);
                if (--indegree[v] == 0) queue.offer(v);
            }
        }
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(minimumTime(3, new int[][] {{1, 3}, {2, 3}}, new int[] {3, 2, 5}) + " "
                + minimumTime(5, new int[][] {{1, 5}, {2, 5}, {3, 5}, {3, 4}, {4, 5}}, new int[] {1, 2, 3, 4, 5}));
    }
}
```

**Output:**

```text
8 12
```

**Complexity:** O(n + relations) time and space. This is the longest weighted path in a DAG — the "critical path" of a project.

</details>
