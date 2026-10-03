# Depth-First Search (DFS) — Practice

### P1. Keys and rooms

**Difficulty:** Medium · **Pattern:** Reachability from one source

Room 0 is unlocked; `rooms[i]` lists the keys found in room i (each key opens the room with that number). Can you visit every room?

**Constraints:** 2 ≤ n ≤ 1000; total keys ≤ 3000.

Example: `[[1],[2],[3],[]]` → `true`; `[[1,3],[3,0,1],[2],[0]]` → `false` (room 2's key is only inside room 2).

<details>
<summary>Hint</summary>

Rooms are vertices, keys are directed edges. Is every vertex reachable from 0?

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class KeysAndRooms {

    static boolean canVisitAll(List<List<Integer>> rooms) {
        boolean[] visited = new boolean[rooms.size()];
        Deque<Integer> stack = new ArrayDeque<>(List.of(0));
        visited[0] = true;
        int count = 1;
        while (!stack.isEmpty()) {
            for (int key : rooms.get(stack.pop())) {
                if (!visited[key]) {
                    visited[key] = true;
                    count++;
                    stack.push(key);
                }
            }
        }
        return count == rooms.size();
    }

    public static void main(String[] args) {
        System.out.println(canVisitAll(List.of(List.of(1), List.of(2), List.of(3), List.of())) + " "
                + canVisitAll(List.of(List.of(1, 3), List.of(3, 0, 1), List.of(2), List.of(0))));
    }
}
```

**Output:**

```text
true false
```

**Complexity:** O(V + E) time, O(V) space.

</details>

### P2. All paths from source to target in a DAG

**Difficulty:** Medium · **Pattern:** DFS with path backtracking

Given a directed acyclic graph with vertices 0..n − 1, return every path from 0 to n − 1.

**Constraints:** 2 ≤ n ≤ 15.

Example: `[[1,2],[3],[3],[]]` → `[[0,1,3],[0,2,3]]`.

<details>
<summary>Hint</summary>

No visited array is needed: a DAG has no cycles, and the same vertex may appear on different paths.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class AllPathsDag {

    static List<List<Integer>> allPaths(int[][] graph) {
        List<List<Integer>> result = new ArrayList<>();
        List<Integer> path = new ArrayList<>(List.of(0));
        dfs(graph, 0, path, result);
        return result;
    }

    private static void dfs(int[][] g, int u, List<Integer> path, List<List<Integer>> result) {
        if (u == g.length - 1) {
            result.add(new ArrayList<>(path));
            return;
        }
        for (int v : g[u]) {
            path.add(v);
            dfs(g, v, path, result);
            path.remove(path.size() - 1);
        }
    }

    public static void main(String[] args) {
        System.out.println(allPaths(new int[][] {{1, 2}, {3}, {3}, {}}));
        System.out.println(allPaths(new int[][] {{4, 3, 1}, {3, 2, 4}, {3}, {4}, {}}));
    }
}
```

**Output:**

```text
[[0, 1, 3], [0, 2, 3]]
[[0, 4], [0, 3, 4], [0, 1, 3, 4], [0, 1, 2, 3, 4], [0, 1, 4]]
```

**Complexity:** O(2ⁿ × n) in the worst case (a DAG can have exponentially many paths), O(n) recursion depth.

</details>

### P3. Evaluate division

**Difficulty:** Hard · **Pattern:** DFS on a weighted graph, multiplying along the path

Given equations like a / b = 2.0 and b / c = 3.0, answer queries like a / c (= 6.0). Return −1.0 for unknown variables or unconnected pairs.

**Constraints:** up to 20 equations and 20 queries.

<details>
<summary>Hint</summary>

Each equation a / b = k gives edges a → b with weight k and b → a with weight 1/k. A query x / y is the product of weights along any path from x to y.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class EvaluateDivision {

    static double[] calc(String[][] equations, double[] values, String[][] queries) {
        Map<String, Map<String, Double>> graph = new HashMap<>();
        for (int i = 0; i < equations.length; i++) {
            String a = equations[i][0], b = equations[i][1];
            graph.computeIfAbsent(a, k -> new HashMap<>()).put(b, values[i]);
            graph.computeIfAbsent(b, k -> new HashMap<>()).put(a, 1.0 / values[i]);
        }
        double[] answers = new double[queries.length];
        for (int i = 0; i < queries.length; i++) {
            String x = queries[i][0], y = queries[i][1];
            answers[i] = (graph.containsKey(x) && graph.containsKey(y)) ? dfs(graph, x, y, new HashSet<>()) : -1.0;
        }
        return answers;
    }

    private static double dfs(Map<String, Map<String, Double>> g, String u, String target, Set<String> seen) {
        if (u.equals(target)) return 1.0;
        seen.add(u);
        for (Map.Entry<String, Double> e : g.get(u).entrySet()) {
            if (seen.contains(e.getKey())) continue;
            double rest = dfs(g, e.getKey(), target, seen);
            if (rest != -1.0) return e.getValue() * rest;     // multiply weights along the path
        }
        return -1.0;
    }

    public static void main(String[] args) {
        String[][] eq = {{"a", "b"}, {"b", "c"}};
        String[][] q = {{"a", "c"}, {"b", "a"}, {"a", "e"}, {"a", "a"}, {"x", "x"}};
        System.out.println(Arrays.toString(calc(eq, new double[] {2.0, 3.0}, q)));
    }
}
```

**Output:**

```text
[6.0, 0.5, -1.0, 1.0, -1.0]
```

**Complexity:** O(Q × (V + E)) time, O(V + E) space. ("x / x" is −1 because x never appears in an equation.) A weighted union-find answers each query in near O(1).

</details>
