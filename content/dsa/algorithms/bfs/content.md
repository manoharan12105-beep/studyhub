# Breadth-First Search (BFS)

## Definition

**Breadth-first search** explores a graph level by level: first the start vertex, then all its neighbours, then all vertices two edges away, and so on. It uses a **queue** and a **visited** set. In an **unweighted** graph, BFS finds the **shortest path** (fewest edges) from the source to every reachable vertex in **O(V + E)** time.

## Why It Matters

BFS is the answer to almost every "minimum number of steps/moves/edges" question on unweighted graphs and grids: shortest path in a maze, word ladder, rotting oranges, knight moves, minimum mutations. It is also the basis of level-order tree traversal, multi-source spreading problems and [topological sorting with Kahn's algorithm](../topological-sort/content.md).

## Prerequisites

- [Graph](../../data-structures/graph/content.md) — adjacency lists.
- [Queue](../../data-structures/queue/content.md)

## Intuition

Drop a stone in a pond: the ripple reaches everything 1 metre away before anything 2 metres away. BFS expands a "frontier" in rings of equal distance. Because a vertex is first reached by the ring of smallest distance, the first time BFS sees a vertex is via a shortest path.

## How It Works

1. Mark the source visited, set `dist[source] = 0`, enqueue it.
2. While the queue is not empty:
   1. Dequeue u.
   2. For each neighbour v of u that is not visited: mark it visited, set `dist[v] = dist[u] + 1`, `parent[v] = u`, enqueue v.
3. `dist[v]` is the shortest number of edges from the source; follow `parent` back from v to rebuild the path.

**Mark vertices when they are enqueued, not when dequeued** — otherwise the same vertex can be enqueued many times.

### Why BFS gives shortest paths (unweighted)

The queue always contains vertices of distance d followed by vertices of distance d + 1 — never anything else. Vertices are therefore dequeued in nondecreasing distance order, and a vertex's first discovery comes from a vertex at the smallest possible distance. With **weighted** edges this breaks (a path with more edges can be cheaper), which is why [Dijkstra](../dijkstra/content.md) exists.

### Multi-source BFS

Enqueue **all** sources at distance 0 at the start. The result is the distance from each vertex to its **nearest** source — e.g. how long until every orange rots, distance from every cell to the nearest exit.

### BFS on a grid

Cells are vertices; up/down/left/right (or 8 directions) are edges. Use a `boolean[][] visited` (or overwrite the grid), and a direction array for neighbours.

### 0-1 BFS (awareness)

If edge weights are only **0 or 1**, use a **deque**: push the neighbour to the **front** for a 0-weight edge and to the **back** for a 1-weight edge. The deque stays sorted by distance like Dijkstra's heap, giving shortest paths in O(V + E) instead of O((V + E) log V).

## Visual Explanation

```text
Graph:                   BFS from 0:
   0 ─ 1 ─ 4              queue        visit   dist
   │   │                  [0]          0       0:0
   2 ─ 3 ─ 5              [1, 2]       1       1:1, 2:1
                          [2, 4, 3]    2       4:2, 3:2   (3 found from 1 first)
                          [4, 3]       4
                          [3]          3       5:3
                          [5]          5
levels: {0} → {1, 2} → {4, 3} → {5}
shortest path 0 → 5: 5 ← 3 ← 1 ← 0  (3 edges)
```

## Pseudocode

```pseudocode
bfs(graph, source):
    dist[all] ← −1; dist[source] ← 0
    queue ← [source]
    while queue not empty:
        u ← dequeue
        for v in neighbours(u):
            if dist[v] = −1:                 // not yet visited
                dist[v] ← dist[u] + 1
                parent[v] ← u
                enqueue v
    return dist, parent
```

## Java Implementation

```java
import java.util.*;

public class BreadthFirstSearch {

    static int[] parent;

    static int[] bfs(List<List<Integer>> adj, int source) {
        int n = adj.size();
        int[] dist = new int[n];
        Arrays.fill(dist, -1);                         // -1 doubles as "not visited"
        parent = new int[n];
        Arrays.fill(parent, -1);
        Queue<Integer> queue = new ArrayDeque<>();
        dist[source] = 0;
        queue.offer(source);
        while (!queue.isEmpty()) {
            int u = queue.poll();
            for (int v : adj.get(u)) {
                if (dist[v] == -1) {                   // mark on enqueue
                    dist[v] = dist[u] + 1;
                    parent[v] = u;
                    queue.offer(v);
                }
            }
        }
        return dist;
    }

    static List<Integer> path(int target) {
        LinkedList<Integer> p = new LinkedList<>();
        for (int v = target; v != -1; v = parent[v]) p.addFirst(v);
        return p;
    }

    // Shortest steps from (0,0) to bottom-right in a grid of 0 = open, 1 = wall.
    static int gridShortest(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        if (grid[0][0] == 1) return -1;
        int[][] dist = new int[rows][cols];
        for (int[] row : dist) Arrays.fill(row, -1);
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        Queue<int[]> q = new ArrayDeque<>();
        q.offer(new int[] {0, 0});
        dist[0][0] = 0;
        while (!q.isEmpty()) {
            int[] cell = q.poll();
            for (int[] d : dirs) {
                int r = cell[0] + d[0], c = cell[1] + d[1];
                if (r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] == 0 && dist[r][c] == -1) {
                    dist[r][c] = dist[cell[0]][cell[1]] + 1;
                    q.offer(new int[] {r, c});
                }
            }
        }
        return dist[rows - 1][cols - 1];
    }

    // 0-1 BFS: edges {to, weight} with weight 0 or 1.
    static int[] zeroOneBfs(List<List<int[]>> adj, int source) {
        int[] dist = new int[adj.size()];
        Arrays.fill(dist, Integer.MAX_VALUE);
        Deque<Integer> deque = new ArrayDeque<>();
        dist[source] = 0;
        deque.offerFirst(source);
        while (!deque.isEmpty()) {
            int u = deque.pollFirst();
            for (int[] e : adj.get(u)) {
                int v = e[0], w = e[1];
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    if (w == 0) deque.offerFirst(v); else deque.offerLast(v);
                }
            }
        }
        return dist;
    }

    public static void main(String[] args) {
        int n = 6;
        int[][] edges = {{0, 1}, {0, 2}, {1, 4}, {1, 3}, {2, 3}, {3, 5}};
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
        }
        System.out.println("dist from 0: " + Arrays.toString(bfs(adj, 0)));
        System.out.println("path 0 -> 5: " + path(5));

        int[][] grid = {{0, 0, 1}, {1, 0, 1}, {1, 0, 0}};
        System.out.println("grid shortest steps: " + gridShortest(grid));

        List<List<int[]>> w = new ArrayList<>();
        for (int i = 0; i < 4; i++) w.add(new ArrayList<>());
        w.get(0).add(new int[] {1, 1});
        w.get(0).add(new int[] {2, 0});
        w.get(2).add(new int[] {1, 0});
        w.get(1).add(new int[] {3, 1});
        System.out.println("0-1 BFS dist: " + Arrays.toString(zeroOneBfs(w, 0)));
    }
}
```

**Output:**

```text
dist from 0: [0, 1, 1, 2, 2, 3]
path 0 -> 5: [0, 1, 3, 5]
grid shortest steps: 4
0-1 BFS dist: [0, 0, 0, 1]
```

## Dry Run

BFS from 0 on the graph above (adjacency order as built: 0: [1, 2], 1: [0, 4, 3], 2: [0, 3], 3: [1, 2, 5]):

| Dequeue | Neighbours checked | Newly discovered (dist) | Queue after |
|---------|--------------------|--------------------------|-------------|
| 0 | 1, 2 | 1 (1), 2 (1) | [1, 2] |
| 1 | 0, 4, 3 | 4 (2), 3 (2) | [2, 4, 3] |
| 2 | 0, 3 | — (3 already discovered) | [4, 3] |
| 4 | 1 | — | [3] |
| 3 | 1, 2, 5 | 5 (3) | [5] |
| 5 | 3 | — | [] |

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best / Average / Worst | O(V + E) | each vertex is enqueued and dequeued once; each adjacency list is scanned once (each undirected edge twice) |
| Grid r × c | O(r × c) | V = r × c, E ≤ 4V |
| 0-1 BFS | O(V + E) | each vertex settles once per improvement; at most a constant number of deque operations per edge |

**Space:** O(V) for the queue, `dist`/`visited` and `parent`.

## Properties

- Finds shortest paths in **unweighted** graphs (or uniform weights).
- Visits vertices in nondecreasing distance from the source.
- Iterative — no recursion depth issues.

## Variations

- **Multi-source BFS** — several starting points at distance 0.
- **Bidirectional BFS** — search from both ends; meets in the middle, exploring roughly 2 × b^(d/2) instead of b^d states.
- **BFS over states** — vertices are configurations (lock combinations, word ladders, positions + keys collected).
- **0-1 BFS** — deque, weights 0/1.
- **Level-order traversal** of trees — [Tree Traversals](../../data-structures/tree-traversals/content.md).

## Comparison

| | BFS | DFS | Dijkstra |
|---|-----|-----|----------|
| Data structure | queue | stack / recursion | priority queue |
| Shortest path (unweighted) | yes | no | yes, but slower |
| Shortest path (non-negative weights) | no | no | yes |
| Memory | O(width) frontier — can be large | O(depth) | O(V) |
| Typical uses | minimum steps, levels, spreading | connectivity, cycles, topological order, backtracking | weighted shortest paths |

Choose BFS when the question is "how few steps"; DFS when it is "is there a path / explore everything / order things".

## Edge Cases

- Source equals target (distance 0).
- Unreachable vertices (distance stays −1 / ∞).
- Disconnected graphs: BFS from one source only covers its component.
- Grids where the start or end cell is blocked.

## Advantages

- Optimal for unweighted shortest paths; simple; iterative.

## Disadvantages

- Frontier can hold O(V) vertices (memory-heavy on wide graphs).
- Not correct for weighted shortest paths.

## When to Use

- "Minimum number of moves/steps/edges/transformations".
- Spreading processes over time (fire, infection, rotting) → multi-source BFS.
- Level-by-level processing.

## Common Mistakes

- Marking visited when dequeuing (duplicates in the queue, possibly exponential blow-up on grids).
- Using BFS for weighted graphs.
- Forgetting to process level by level when the answer is a level count (capture `queue.size()` first).
- Not handling unreachable targets.

## Key Takeaways

- Queue + visited; expand level by level; O(V + E).
- First discovery = shortest path in an unweighted graph; store `parent` to rebuild it.
- Multi-source BFS for nearest-source distances; 0-1 BFS with a deque for 0/1 weights.
