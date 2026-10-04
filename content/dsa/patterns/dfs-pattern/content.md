# DFS Pattern

## What Is the Pattern

The **DFS pattern** explores as deep as possible along one path before backing up, visiting every state reachable from a start exactly once. It is the tool for questions about **reachability and structure** rather than shortest distance: which cells belong to a region, whether something is connected, whether a region touches the border, what a whole subtree or component looks like.

Tiny example: count the cells of the island containing (0, 0) in `[[1, 1], [0, 1]]`: visit (0,0) → (0,1) → (1,1) → back up → 3 cells.

The traversal itself (recursive and iterative DFS, visited marking, entry/exit order) is in [DFS](../../algorithms/dfs/content.md); flood fill, islands, provinces and similar applications in [Graph Traversal Problems](../../algorithms/graph-traversal-problems/content.md); cycle detection in [Cycle Detection](../../algorithms/cycle-detection/content.md).

## Why It Works

From a state, DFS visits each unvisited neighbour and recurses, marking states visited so each is processed once. Everything reachable is eventually visited (every reachable state has a path, and DFS follows every edge from every visited state). Because the recursion returns only after the whole reachable part below a state is done, DFS can **aggregate** information on the way back — size of a region, whether any cell broke a rule, the answer for a subtree — which BFS does not naturally give.

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "Count regions / islands / components / provinces" | one DFS per unvisited start = one component |
| "Is every cell of this region …", "does the region touch the border" | DFS the region and combine a boolean on the way back |
| "Size / perimeter / sum of a region" | aggregate while returning |
| "Can you reach X from Y" (no distance needed) | reachability |
| Trees: height, path sums, subtree properties | DFS = postorder recursion |
| "Use every edge exactly once", "order of dependencies", "detect a cycle" | DFS with entry/exit states (Euler paths, topological order, colouring) |

## Typical Problem Structure

- Input: a grid, an adjacency list/matrix, an edge list, or a tree.
- Output: a count, a size, a boolean, a list of nodes, or an ordering.
- Visited tracking: a `boolean[]`, or mark grid cells in place (restore afterwards if the input must stay unchanged).

## Template

```pseudocode
dfs(state):
    mark state visited
    result ← contribution of state
    for next in neighbours(state):
        if next is valid and not visited:
            result ← combine(result, dfs(next))
    return result

count ← 0
for each state s:
    if s is unvisited and is a start candidate: dfs(s); count ← count + 1
```

## Java Template

```java
public class DfsTemplate {

    static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    // Size of the region of 1s containing (r, c); cells are set to 0 when visited.
    static int regionSize(int[][] g, int r, int c) {
        if (r < 0 || r >= g.length || c < 0 || c >= g[0].length || g[r][c] != 1) return 0;
        g[r][c] = 0;                                   // mark visited before recursing
        int size = 1;
        for (int[] d : DIRS) size += regionSize(g, r + d[0], c + d[1]);
        return size;
    }

    public static void main(String[] args) {
        int[][] g = {{1, 1, 0}, {0, 1, 0}, {1, 0, 1}};
        int regions = 0, largest = 0;
        for (int r = 0; r < g.length; r++)
            for (int c = 0; c < g[0].length; c++)
                if (g[r][c] == 1) {
                    regions++;
                    largest = Math.max(largest, regionSize(g, r, c));
                }
        System.out.println(regions + " regions, largest " + largest);
    }
}
```

**Output:**

```text
3 regions, largest 3
```

## Example Problem

**Count sub-islands.** Two grids of the same size contain 0 (water) and 1 (land). An island in `grid2` is a **sub-island** if every one of its cells is also land in `grid1`. Count the sub-islands of `grid2`.

- **Brute force:** for each island of grid2, collect its cells (one traversal), then check each against grid1 — fine, but two passes.
- **Observation:** a region property ("all cells satisfy X") is an AND aggregated over a DFS. Explore the whole island of grid2 **without stopping early** (so it is fully marked visited), and AND together `grid1[r][c] == 1` for its cells.

```java
public class CountSubIslands {

    static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    static int countSubIslands(int[][] grid1, int[][] grid2) {
        int count = 0;
        for (int r = 0; r < grid2.length; r++)
            for (int c = 0; c < grid2[0].length; c++)
                if (grid2[r][c] == 1 && allCovered(grid1, grid2, r, c)) count++;
        return count;
    }

    // Visits the whole island of grid2 and reports whether every cell is land in grid1.
    static boolean allCovered(int[][] g1, int[][] g2, int r, int c) {
        if (r < 0 || r >= g2.length || c < 0 || c >= g2[0].length || g2[r][c] != 1) return true;
        g2[r][c] = 0;                                  // visited
        boolean ok = g1[r][c] == 1;
        for (int[] d : DIRS) ok &= allCovered(g1, g2, r + d[0], c + d[1]);   // &= : never short-circuit
        return ok;
    }

    public static void main(String[] args) {
        int[][] g1 = {{1, 1, 1, 0, 0}, {0, 1, 1, 1, 1}, {0, 0, 0, 0, 0}, {1, 0, 0, 0, 0}, {1, 1, 0, 1, 1}};
        int[][] g2 = {{1, 1, 1, 0, 0}, {0, 0, 1, 1, 1}, {0, 1, 0, 0, 0}, {1, 0, 1, 1, 0}, {0, 1, 0, 1, 0}};
        System.out.println(countSubIslands(g1, g2));
    }
}
```

**Output:**

```text
3
```

## Dry Run

Islands of `grid2` in scan order and the AND of their cells' grid1 values:

| Island (cells in grid2) | grid1 values | Sub-island? |
|-------------------------|--------------|-------------|
| {(0,0), (0,1), (0,2), (1,2), (1,3), (1,4)} | all 1 | yes (1) |
| {(2,1)} | grid1[2][1] = 0 | no |
| {(3,0)} | 1 | yes (2) |
| {(3,2), (3,3), (4,3)} | grid1[3][2] = 0 | no |
| {(4,1)} | grid1[4][1] = 1 | yes (3) |

Using `ok = ok && dfs(...)` would stop exploring the island at (3,2); its other cells would later be counted as a separate (wrong) island.

## Common Mistakes

- Short-circuiting (`&&`, early `return false`) before the whole region is visited — the rest of the region is miscounted later.
- Marking visited **after** recursing, causing infinite recursion on cycles.
- Recursion depth: a 1000 × 1000 grid can need 10⁶ frames — `StackOverflowError`; use an explicit stack for large inputs.
- Modifying the input grid when the caller needs it unchanged (copy it or restore it).
- Using DFS for shortest paths in unweighted graphs — the first path found is not the shortest; use [BFS](../bfs-pattern/content.md).

## Variations

- **Border-connected regions:** DFS from every border cell first (surrounded regions, enclaves, closed islands).
- **Component counting / sizes:** one DFS per unvisited node.
- **DFS with memo:** longest increasing path in a grid (DFS + DP on a DAG).
- **Graph reachability lists:** all nodes reachable from x, or "detonation chains".
- **Euler path (Hierholzer):** DFS that removes edges as it uses them, adding nodes in post-order.
- **Entry/exit colouring:** cycle detection and topological sort in directed graphs.

## Complexity

| Graph | Time | Space |
|-------|------|-------|
| Adjacency list | O(V + E) | O(V) visited + O(V) recursion worst case |
| R × C grid | O(R × C) | O(R × C) worst-case recursion |

## When Not to Use It

- Minimum steps in an unweighted graph — BFS.
- Weighted shortest paths — [Shortest Path Pattern](../shortest-path-pattern/content.md).
- Very deep recursion in Java without an explicit stack.
- Dynamic connectivity as edges are added — [Union-Find](../union-find-pattern/content.md) is simpler.

## Key Takeaways

- DFS answers reachability and "whole region/subtree" questions; aggregate results on the way back.
- Mark visited before recursing; never short-circuit when the whole region must be consumed.
- O(V + E); watch recursion depth in Java.
