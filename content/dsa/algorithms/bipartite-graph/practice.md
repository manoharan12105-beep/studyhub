# Bipartite Graph Check — Practice

### P1. Which graph is bipartite?

**Difficulty:** Easy · **Pattern:** Odd cycle test

- A) A cycle of 5 vertices
- B) A complete graph on 3 vertices
- C) A cycle of 6 vertices
- D) A graph with a self-loop

<details>
<summary>Hint</summary>

Bipartite ⇔ no odd cycle.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) A cycle of 6 vertices

**Explanation:** Alternate colours around a 6-cycle and you return to the start consistently. A 5-cycle and a triangle are odd cycles; a self-loop joins a vertex to itself.

</details>

### P2. Possible bipartition

**Difficulty:** Medium · **Pattern:** Build a conflict graph, then 2-colour

People 1..n must be split into two groups; `dislikes[i] = [a, b]` means a and b cannot be in the same group. Return `true` if possible.

**Constraints:** 1 ≤ n ≤ 2000; dislikes ≤ 10⁴.

Example: n = 4, `[[1,2],[1,3],[2,4]]` → `true`; n = 3, `[[1,2],[1,3],[2,3]]` → `false`.

<details>
<summary>Hint</summary>

Dislikes are undirected edges. The split exists iff the graph is bipartite. People are 1-indexed.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class PossibleBipartition {

    static boolean possible(int n, int[][] dislikes) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        for (int[] d : dislikes) {
            adj.get(d[0]).add(d[1]);
            adj.get(d[1]).add(d[0]);                  // dislike is mutual
        }
        int[] colour = new int[n + 1];
        Arrays.fill(colour, -1);
        for (int s = 1; s <= n; s++) {
            if (colour[s] != -1) continue;
            colour[s] = 0;
            Deque<Integer> stack = new ArrayDeque<>(List.of(s));
            while (!stack.isEmpty()) {
                int u = stack.pop();
                for (int v : adj.get(u)) {
                    if (colour[v] == -1) {
                        colour[v] = 1 - colour[u];
                        stack.push(v);
                    } else if (colour[v] == colour[u]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(possible(4, new int[][] {{1, 2}, {1, 3}, {2, 4}}) + " " + possible(3, new int[][] {{1, 2}, {1, 3}, {2, 3}}));
    }
}
```

**Output:**

```text
true false
```

**Complexity:** O(n + E) time and space. (Here the traversal uses a stack — DFS order works just as well as BFS for colouring.)

</details>
