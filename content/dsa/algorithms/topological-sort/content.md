# Topological Sort (DFS and Kahn's Algorithm)

## Definition

A **topological order** of a directed graph lists its vertices so that every edge u → v has u **before** v. It exists exactly when the graph is a **DAG** (directed acyclic graph). Two standard O(V + E) algorithms compute it: **DFS** (reverse postorder) and **Kahn's algorithm** (repeatedly remove vertices with in-degree 0). Kahn's algorithm also detects cycles: if not every vertex is removed, the graph has a cycle.

## Why It Matters

Any "do things in an order that respects dependencies" problem is topological sorting: course prerequisites (**Course Schedule**), build systems and package managers, task scheduling, spreadsheet formula evaluation, compiling modules. It is also the first step of DP on DAGs (longest path, counting paths).

## Prerequisites

- [DFS](../dfs/content.md), [BFS](../bfs/content.md)
- [Cycle Detection](../cycle-detection/content.md) (directed)

## Intuition

Getting dressed: socks before shoes, shirt before tie. A valid order puts every item after everything it depends on. Kahn's view: anything with no remaining prerequisites can be done now — do it, cross it off everyone else's list, and repeat. DFS view: a task can only be **finished** after everything it leads to is finished, so listing tasks by finishing time and reversing it puts each task before its dependents.

## How It Works

### Kahn's algorithm (BFS)

1. Compute the in-degree of every vertex.
2. Enqueue all vertices with in-degree 0.
3. While the queue is not empty: dequeue u, append it to the order, and for each edge u → v decrement `indegree[v]`; if it reaches 0, enqueue v.
4. If the order contains all V vertices, it is a topological order; otherwise the remaining vertices are on or behind a cycle.

### DFS (reverse postorder)

1. Run DFS from every unvisited vertex.
2. When a vertex **finishes** (all its descendants are done), push it onto a stack (or add to a list).
3. Reverse the finish order. Detect cycles with the grey/black colouring at the same time.

Why it works: for an edge u → v in a DAG, v always finishes before u (either v is explored inside u's DFS, or v was already finished). Reversing finish order puts u before v.

### Course Schedule

Courses are vertices; "to take a you must first take b" is an edge b → a.

- **Can all courses be finished?** — is the graph acyclic? (Kahn: did we output all V?)
- **Give an order** — the topological order itself.
- **Minimum number of semesters** (taking any number of courses per semester) — Kahn's algorithm processed **level by level**; the number of levels is the answer.

## Visual Explanation

```text
Prerequisites: 0 → 1, 0 → 2, 1 → 3, 2 → 3, 3 → 4      (u → v: u must come before v)

in-degree: 0:0  1:1  2:1  3:2  4:1

queue [0]          output 0      in-degree 1:0, 2:0 → queue [1, 2]
queue [1, 2]       output 1      3:1
queue [2]          output 2      3:0 → queue [3]
queue [3]          output 3      4:0 → queue [4]
queue [4]          output 4
order: 0 1 2 3 4   (0 2 1 3 4 is also valid — topological orders are usually not unique)
```

## Pseudocode

```pseudocode
kahn(V, edges):
    indegree[v] for every v
    queue ← all v with indegree 0
    order ← []
    while queue not empty:
        u ← dequeue; order.add(u)
        for v in neighbours(u):
            indegree[v] ← indegree[v] − 1
            if indegree[v] = 0: enqueue v
    return order.size = V ? order : "cycle"
```

## Java Implementation

```java
import java.util.*;

public class TopologicalSort {

    static List<List<Integer>> build(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) adj.get(e[0]).add(e[1]);
        return adj;
    }

    // Kahn's algorithm; returns null if the graph has a cycle.
    static List<Integer> kahn(int n, List<List<Integer>> adj) {
        int[] indegree = new int[n];
        for (List<Integer> out : adj) for (int v : out) indegree[v]++;
        Queue<Integer> queue = new ArrayDeque<>();
        for (int v = 0; v < n; v++) if (indegree[v] == 0) queue.offer(v);
        List<Integer> order = new ArrayList<>();
        while (!queue.isEmpty()) {
            int u = queue.poll();
            order.add(u);
            for (int v : adj.get(u)) {
                if (--indegree[v] == 0) queue.offer(v);   // last prerequisite done
            }
        }
        return order.size() == n ? order : null;
    }

    // DFS reverse postorder with cycle detection; returns null on a cycle.
    static List<Integer> dfsOrder(int n, List<List<Integer>> adj) {
        int[] colour = new int[n];                        // 0 white, 1 grey, 2 black
        Deque<Integer> finished = new ArrayDeque<>();
        for (int v = 0; v < n; v++) {
            if (colour[v] == 0 && !dfs(v, adj, colour, finished)) return null;
        }
        return new ArrayList<>(finished);                 // stack order = reverse postorder
    }

    private static boolean dfs(int u, List<List<Integer>> adj, int[] colour, Deque<Integer> finished) {
        colour[u] = 1;
        for (int v : adj.get(u)) {
            if (colour[v] == 1) return false;             // back edge: cycle
            if (colour[v] == 0 && !dfs(v, adj, colour, finished)) return false;
        }
        colour[u] = 2;
        finished.push(u);                                 // pushed after all descendants
        return true;
    }

    // Course Schedule: prerequisites[i] = {course, prerequisite}; can all be finished?
    static boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        for (int[] p : prerequisites) adj.get(p[1]).add(p[0]);   // prerequisite → course
        return kahn(numCourses, adj) != null;
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {3, 4}};
        List<List<Integer>> adj = build(5, edges);
        System.out.println("Kahn: " + kahn(5, adj));
        System.out.println("DFS:  " + dfsOrder(5, adj));
        List<List<Integer>> cyclic = build(3, new int[][] {{0, 1}, {1, 2}, {2, 0}});
        System.out.println("cyclic: Kahn " + kahn(3, cyclic) + ", DFS " + dfsOrder(3, cyclic));
        System.out.println("course schedule [[1,0]]: " + canFinish(2, new int[][] {{1, 0}}) + ", [[1,0],[0,1]]: " + canFinish(2, new int[][] {{1, 0}, {0, 1}}));
    }
}
```

**Output:**

```text
Kahn: [0, 1, 2, 3, 4]
DFS:  [0, 2, 1, 3, 4]
cyclic: Kahn null, DFS null
course schedule [[1,0]]: true, [[1,0],[0,1]]: false
```

Both orders are valid; they differ because the algorithms break ties differently.

## Dry Run

DFS order on the same graph (adjacency 0: [1, 2], 1: [3], 2: [3], 3: [4]):

| Event | Finished stack (top first) |
|-------|----------------------------|
| enter 0 → enter 1 → enter 3 → enter 4, finish 4 | 4 |
| finish 3 | 3 4 |
| finish 1 | 1 3 4 |
| back in 0 → enter 2 (3 already black), finish 2 | 2 1 3 4 |
| finish 0 | 0 2 1 3 4 |

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Kahn | O(V + E) | each vertex enqueued once, each edge decrements once |
| DFS | O(V + E) | standard DFS |

**Space:** O(V) for in-degrees/colours, the queue/stack and the output (plus O(V + E) for the adjacency list).

## Properties

- Exists iff the graph is a DAG.
- Usually not unique; it is unique iff every consecutive pair in the order is joined by an edge (a Hamiltonian path) — in Kahn's terms, the queue never holds more than one vertex.

## Variations

- **Lexicographically smallest order:** Kahn's algorithm with a min-heap instead of a queue (O((V + E) log V)).
- **Minimum semesters / parallel scheduling:** Kahn level by level.
- **Longest path in a DAG / critical path:** process vertices in topological order, relaxing `dist[v] = max(dist[v], dist[u] + w)`.
- **Alien dictionary:** derive letter-order edges from adjacent words, then topologically sort.

## Comparison

| | Kahn's algorithm | DFS reverse postorder |
|---|------------------|------------------------|
| Style | iterative, BFS | recursive (or explicit stack) |
| Cycle detection | order shorter than V | grey (back) edge |
| Levels / parallel scheduling | natural | not natural |
| Lexicographic control | easy with a heap | awkward |

## Edge Cases

- Vertices with no edges — they still appear in the order (in-degree 0).
- Disconnected DAGs — start from every in-degree-0 vertex / every unvisited vertex.
- Duplicate edges — count them consistently in in-degrees (both the increment and decrement see the duplicate).

## Advantages

- Linear time; gives an execution order and a cycle check in one pass.

## Disadvantages

- Only for DAGs; the order is not unique, so tests must accept any valid order.

## When to Use

- "Prerequisites", "dependencies", "order of tasks/compilation", "can all be completed?", "derive an ordering from pairwise rules".

## Common Mistakes

- Reversing edge direction (prerequisite → course is the edge that respects the order).
- Forgetting cycle detection and returning a partial order.
- Using DFS preorder instead of reverse postorder.

## Key Takeaways

- Topological order: every edge points forward; exists iff the graph is a DAG.
- Kahn: repeatedly remove in-degree-0 vertices; fewer than V removed ⇒ cycle.
- DFS: reverse of finishing order; a grey neighbour ⇒ cycle.
- Course Schedule = cycle check + topological order; levels give minimum semesters.
