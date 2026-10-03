# Cycle Detection in Graphs — Practice

### P1. Why does a plain `visited[]` array give wrong answers for cycle detection in a **directed** graph?

**Difficulty:** Easy · **Pattern:** Directed vs undirected

- A) It misses self-loops
- B) It reports a cycle whenever a vertex is reached by two different paths, even without a cycle
- C) It is too slow — O(V²)
- D) It cannot handle disconnected graphs

<details>
<summary>Hint</summary>

Consider A → B, A → C, C → B.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) It reports a cycle whenever a vertex is reached by two different paths, even without a cycle

**Explanation:** B is visited from A, then reached again from C — but B is already finished, not on the current path. Only an edge to a vertex **on the current recursion path** (grey) proves a cycle.

</details>

### P2. Find eventual safe states

**Difficulty:** Medium · **Pattern:** Three-colour DFS; black = safe

In a directed graph, a vertex is **safe** if every path starting from it ends at a terminal vertex (no outgoing edges) — i.e. no cycle is reachable. Return all safe vertices in increasing order.

**Constraints:** 1 ≤ n ≤ 10⁴; E ≤ 4 × 10⁴.

Example: `[[1,2],[2,3],[5],[0],[5],[],[]]` → `[2, 4, 5, 6]`.

<details>
<summary>Hint</summary>

Run the colour DFS without stopping at the first cycle. A vertex that finishes black never reached a grey vertex — it is safe. A vertex left grey is on or leads to a cycle.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class SafeStates {

    static List<Integer> eventualSafeNodes(int[][] graph) {
        int[] colour = new int[graph.length];               // 0 white, 1 grey, 2 black (safe)
        List<Integer> safe = new ArrayList<>();
        for (int u = 0; u < graph.length; u++) {
            if (isSafe(graph, u, colour)) safe.add(u);
        }
        return safe;
    }

    private static boolean isSafe(int[][] g, int u, int[] colour) {
        if (colour[u] != 0) return colour[u] == 2;          // grey = cycle on this path; black = safe
        colour[u] = 1;
        for (int v : g[u]) {
            if (!isSafe(g, v, colour)) return false;        // u stays grey: it reaches a cycle
        }
        colour[u] = 2;
        return true;
    }

    public static void main(String[] args) {
        System.out.println(eventualSafeNodes(new int[][] {{1, 2}, {2, 3}, {5}, {0}, {5}, {}, {}}));
    }
}
```

**Output:**

```text
[2, 4, 5, 6]
```

**Complexity:** O(V + E) time, O(V) space.

</details>

### P3. Longest cycle when each vertex has at most one outgoing edge

**Difficulty:** Hard · **Pattern:** Functional graph with visit timestamps

`edges[i]` is the single vertex that i points to, or −1. Return the length of the longest cycle, or −1 if there is none.

**Constraints:** 2 ≤ n ≤ 10⁵.

Example: `[3, 3, 4, 2, 3]` → `3` (cycle 2 → 4 → 3 → 2); `[2, -1, 3, 1]` → `-1`.

<details>
<summary>Hint</summary>

Walk from each unvisited vertex, stamping each vertex with a global step counter. If the walk meets a vertex stamped **during this same walk**, the cycle length is the difference of the stamps.

</details>

<details>
<summary>Answer</summary>

**Approach:** With out-degree ≤ 1, each walk is a simple chain that may end in a cycle. Recording the step at which each vertex was first seen lets you tell "seen in this walk" (stamp ≥ the walk's start stamp) from "seen in an earlier walk" (already handled). Each vertex is visited once overall.

```java
public class LongestCycle {

    static int longestCycle(int[] edges) {
        int n = edges.length;
        int[] stamp = new int[n];                     // 0 = never visited
        int clock = 1, best = -1;
        for (int start = 0; start < n; start++) {
            if (stamp[start] != 0) continue;
            int walkBegin = clock, u = start;
            while (u != -1 && stamp[u] == 0) {
                stamp[u] = clock++;
                u = edges[u];
            }
            if (u != -1 && stamp[u] >= walkBegin) {   // closed a cycle within this walk
                best = Math.max(best, clock - stamp[u]);
            }
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(longestCycle(new int[] {3, 3, 4, 2, 3}) + " " + longestCycle(new int[] {2, -1, 3, 1}) + " " + longestCycle(new int[] {1, 0}));
    }
}
```

**Output:**

```text
3 -1 2
```

**Complexity:** O(n) time, O(n) space.

</details>
