# BFS Pattern

## What Is the Pattern

The **BFS pattern** explores states in rings of increasing distance from the start using a queue. Because every state at distance d is processed before any state at distance d + 1, the first time a state is reached is by a **shortest path in number of steps**. As a pattern, the key skill is modelling the problem: deciding what a **state** is and which **moves** connect states — the graph is often implicit (grid cells, strings, board positions, (cell, extra info) pairs).

Tiny example: the fewest moves from cell (0, 0) to (2, 2) in an open 3 × 3 grid with 4-directional moves: ring 0 = {(0,0)}, ring 1 = {(0,1), (1,0)}, ring 2 = {(0,2), (1,1), (2,0)}, ring 3 = {(1,2), (2,1)}, ring 4 = {(2,2)} → 4 moves.

The algorithm itself (queue, visited set, level-by-level processing, 0-1 BFS) is in [BFS](../../algorithms/bfs/content.md); applied problems (islands, provinces, flood fill) in [Graph Traversal Problems](../../algorithms/graph-traversal-problems/content.md).

## Why It Works

With all moves costing 1, distances grow by exactly one per ring. A FIFO queue processes states in non-decreasing distance order, so when a state is first discovered, no shorter route to it can exist (it would have been discovered in an earlier ring). Marking states visited on **enqueue** ensures each state enters the queue once: O(V + E) for V states and E moves.

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "Minimum number of steps / moves / operations / transformations" with unit cost per move | shortest path in an unweighted graph |
| Grid with walls and "shortest path from A to B" | cells are states, neighbours are moves |
| "Nearest X for every cell", "time for something to spread to everything" | **multi-source** BFS: start from all sources at once |
| Transform one string/number/lock combination into another, one small change at a time | states are strings; moves are single edits |
| The state needs extra information (keys collected, obstacles removed, direction) | BFS over (position, extra) pairs |
| "Level order", "by distance", "layer by layer" | process the queue one level at a time |

## Typical Problem Structure

- Input: a grid, a graph, a start and target (or many sources), sometimes a dictionary of allowed states.
- Output: a minimum step count, a distance array/grid, or −1 if unreachable.
- Model: state → encode as an int (`r * cols + c`), a string, or an `int[]`; moves → neighbour generator; visited → `boolean[]`, `boolean[][]`, or a `HashSet`.

## Template

```pseudocode
queue ← all start states; mark them visited; steps ← 0
while queue not empty:
    repeat size(queue) times:              // one ring
        state ← queue.pop()
        if state is a target: return steps
        for next in moves(state):
            if next is valid and not visited:
                mark next visited; queue.push(next)
    steps ← steps + 1
return −1                                  // target unreachable
```

## Java Template

```java
import java.util.*;

public class BfsTemplate {

    static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    // Fewest 4-directional moves from (sr, sc) to (tr, tc) through cells with value 0.
    static int shortestPath(int[][] grid, int sr, int sc, int tr, int tc) {
        int rows = grid.length, cols = grid[0].length;
        boolean[][] seen = new boolean[rows][cols];
        Deque<int[]> queue = new ArrayDeque<>();
        queue.offer(new int[] {sr, sc});
        seen[sr][sc] = true;
        for (int steps = 0; !queue.isEmpty(); steps++) {
            for (int size = queue.size(); size > 0; size--) {          // process one ring
                int[] cur = queue.poll();
                if (cur[0] == tr && cur[1] == tc) return steps;
                for (int[] d : DIRS) {
                    int r = cur[0] + d[0], c = cur[1] + d[1];
                    if (r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] == 0 && !seen[r][c]) {
                        seen[r][c] = true;                                // mark on enqueue
                        queue.offer(new int[] {r, c});
                    }
                }
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        int[][] grid = {{0, 0, 0}, {1, 1, 0}, {0, 0, 0}};
        System.out.println(shortestPath(grid, 0, 0, 2, 0) + " " + shortestPath(new int[][] {{0, 1}, {1, 0}}, 0, 0, 1, 1));
    }
}
```

**Output:**

```text
6 -1
```

## Example Problem

**Shortest bridge.** A binary grid contains exactly two islands (4-directionally connected groups of 1s). Return the minimum number of 0-cells to flip to 1 to connect them. Example: `[[0, 1, 0], [0, 0, 0], [0, 0, 1]]` → `2`.

- **Brute force:** BFS from every cell of island A to island B — O((R × C)²).
- **Observation:** "minimum flips between two regions" is the shortest distance from **any** cell of A to **any** cell of B. Collect all cells of A (with a DFS/flood fill), then run a **multi-source BFS** from all of them at once; the first ring that touches B gives the answer.

```java
import java.util.*;

public class ShortestBridge {

    static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    static int shortestBridge(int[][] grid) {
        int n = grid.length;
        Deque<int[]> queue = new ArrayDeque<>();
        outer:
        for (int r = 0; r < n; r++)
            for (int c = 0; c < n; c++)
                if (grid[r][c] == 1) {
                    markIsland(grid, r, c, queue);                   // island A → value 2, all cells queued
                    break outer;
                }
        for (int flips = 0; !queue.isEmpty(); flips++) {
            for (int size = queue.size(); size > 0; size--) {
                int[] cur = queue.poll();
                for (int[] d : DIRS) {
                    int r = cur[0] + d[0], c = cur[1] + d[1];
                    if (r < 0 || r >= n || c < 0 || c >= n || grid[r][c] == 2) continue;
                    if (grid[r][c] == 1) return flips;               // reached island B
                    grid[r][c] = 2;                                  // water cell joins the frontier
                    queue.offer(new int[] {r, c});
                }
            }
        }
        return -1;
    }

    static void markIsland(int[][] grid, int r, int c, Deque<int[]> queue) {
        Deque<int[]> stack = new ArrayDeque<>();
        stack.push(new int[] {r, c});
        grid[r][c] = 2;
        while (!stack.isEmpty()) {
            int[] cur = stack.pop();
            queue.offer(cur);
            for (int[] d : DIRS) {
                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid.length && grid[nr][nc] == 1) {
                    grid[nr][nc] = 2;
                    stack.push(new int[] {nr, nc});
                }
            }
        }
    }

    public static void main(String[] args) {
        System.out.println(shortestBridge(new int[][] {{0, 1}, {1, 0}}) + " " + shortestBridge(new int[][] {{0, 1, 0}, {0, 0, 0}, {0, 0, 1}}) + " "
                + shortestBridge(new int[][] {{1, 1, 1, 1, 1}, {1, 0, 0, 0, 1}, {1, 0, 1, 0, 1}, {1, 0, 0, 0, 1}, {1, 1, 1, 1, 1}}));
    }
}
```

**Output:**

```text
1 2 1
```

## Dry Run

`[[0, 1, 0], [0, 0, 0], [0, 0, 1]]`: island A = {(0,1)}, island B = {(2,2)}.

| Ring (flips) | Frontier cells expanded | New water cells added | Touches B? |
|--------------|-------------------------|-----------------------|------------|
| 0 | (0,1) | (1,1), (0,0), (0,2) | no |
| 1 | (1,1), (0,0), (0,2) | (2,1), (1,0), (1,2) | no |
| 2 | (2,1), … | — | (2,1) → (2,2) is B → return 2 |

Two water cells — e.g. (1,1) and (2,1) — must be flipped.

## Common Mistakes

- Marking visited when **dequeuing** instead of enqueuing — the same state enters the queue many times (often a time-limit failure).
- Counting steps per node instead of per ring (use the `size` loop or store the distance with each state).
- Forgetting extra state dimensions: if keys or remaining eliminations matter, `visited` must include them.
- Using BFS when moves have **different costs** — use [Dijkstra](../../algorithms/dijkstra/content.md), or 0-1 BFS for costs 0 and 1.
- Starting multi-source problems from one source at a time (O(k × V) instead of O(V)).

## Variations

- **Multi-source BFS:** enqueue all sources at distance 0 (nearest exit, spreading processes, distance to nearest 1).
- **State-space BFS:** state = (position, keys mask), (position, eliminations left), a string, a board.
- **Bidirectional BFS:** search from both ends and meet in the middle — far fewer states when branching is high.
- **0-1 BFS:** deque; cost-0 moves to the front, cost-1 moves to the back.
- **BFS on implicit graphs:** word transformations, lock combinations, bus routes (routes as nodes).

## Complexity

| Graph | Time | Space |
|-------|------|-------|
| Explicit graph | O(V + E) | O(V) |
| R × C grid, 4 directions | O(R × C) | O(R × C) |
| State space with extra dimension k | O(V × k × moves) | O(V × k) |

## When Not to Use It

- Weighted moves — Dijkstra / Bellman–Ford ([Shortest Path Pattern](../shortest-path-pattern/content.md)).
- You need all paths, or a path with constraints that are not part of a small state — DFS/backtracking.
- Deep, narrow searches where memory for a whole ring is too large — DFS or iterative deepening.

## Key Takeaways

- Unit-cost moves + "minimum steps" → BFS; the first visit is the shortest.
- Model the state carefully; mark visited on enqueue; count steps per ring.
- Many sources → start them all together; weighted edges → not BFS.
