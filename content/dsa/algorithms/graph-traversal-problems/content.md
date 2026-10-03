# Graph Traversal Problems: Components, Islands, Flood Fill, Clone Graph

## Definition

Four classic problems that are "just a traversal" once the graph is identified: **connected components** (how many separate groups), **number of islands** (components of land cells in a grid), **flood fill** (recolour the region connected to a cell) and **clone graph** (deep-copy a graph given one node). Each runs one BFS or DFS per unvisited start point in **O(V + E)**.

## Why It Matters

These are among the most common graph interview questions, and they teach the two key modelling skills: seeing a **grid as a graph** (cells = vertices, neighbouring cells = edges) and keeping a **visited / old→new map** so cycles do not cause infinite loops or duplicate copies.

## Prerequisites

- [BFS](../bfs/content.md) and [DFS](../dfs/content.md)
- [2D Arrays and Matrices](../../data-structures/matrices/content.md) — direction arrays.

## Intuition

Counting islands on a map: scan the map; whenever you find land you have not coloured yet, you found a new island — colour all land connected to it (one traversal), then keep scanning. The number of times you started colouring is the answer. Every other problem here is a variation of "start a traversal, mark what you reach".

## How It Works

### Connected components

For each vertex not yet visited: increment the counter and run DFS/BFS from it, marking everything reachable. (Incremental alternative as edges arrive: [Disjoint Set Union](../../data-structures/disjoint-set-union/content.md).)

### Number of islands

Grid of '1' (land) and '0' (water), 4-directional adjacency. For each '1' cell, count an island and sink the whole island (set its cells to '0' or mark visited) via DFS/BFS.

### Flood fill

Start at (sr, sc) with original colour `old`; recolour every cell 4-connected to it that has colour `old`. If `old == newColour`, return immediately — otherwise the traversal never sees a difference between visited and unvisited cells and loops forever (in the "recolour as visited" approach).

### Clone graph

Given a node of a connected undirected graph (each node has a value and a neighbour list), return a deep copy. Keep a map **original → copy**:

1. When you first see a node, create its copy and store it in the map **before** visiting neighbours (so cycles find the existing copy).
2. For each neighbour, get or create its copy and add it to the current copy's neighbour list.

## Visual Explanation

```text
Number of islands:
1 1 0 0 0        island A: the four 1s top-left
1 1 0 0 0
0 0 1 0 0        island B: the single 1 in the middle
0 0 0 1 1        island C: the two 1s bottom-right
→ 3 islands (diagonal cells are not connected)

Clone graph (1–2–3–4–1 cycle):
original 1 → map {1: 1'}; visit neighbour 2 → map {2: 2'}; … visit 4 → its neighbour 1 is
already in the map → reuse 1' instead of creating a second copy (this is what stops the cycle)
```

## Pseudocode

```pseudocode
numIslands(grid):
    count ← 0
    for each cell (r, c):
        if grid[r][c] = '1':
            count ← count + 1
            sink(r, c)
    return count

sink(r, c):
    if out of bounds or grid[r][c] ≠ '1': return
    grid[r][c] ← '0'
    sink(r+1, c); sink(r−1, c); sink(r, c+1); sink(r, c−1)
```

## Java Implementation

```java
import java.util.*;

public class GraphTraversalProblems {

    static int countComponents(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
        }
        boolean[] visited = new boolean[n];
        int components = 0;
        for (int start = 0; start < n; start++) {
            if (visited[start]) continue;
            components++;                                    // a new, unexplored group
            Deque<Integer> stack = new ArrayDeque<>(List.of(start));
            visited[start] = true;
            while (!stack.isEmpty()) {
                for (int v : adj.get(stack.pop())) {
                    if (!visited[v]) {
                        visited[v] = true;
                        stack.push(v);
                    }
                }
            }
        }
        return components;
    }

    static int numIslands(char[][] grid) {
        int count = 0;
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == '1') {
                    count++;
                    sink(grid, r, c);
                }
            }
        }
        return count;
    }

    private static void sink(char[][] g, int r, int c) {
        if (r < 0 || r >= g.length || c < 0 || c >= g[0].length || g[r][c] != '1') return;
        g[r][c] = '0';                                       // mark visited by sinking
        sink(g, r + 1, c);
        sink(g, r - 1, c);
        sink(g, r, c + 1);
        sink(g, r, c - 1);
    }

    static int[][] floodFill(int[][] image, int sr, int sc, int newColour) {
        int old = image[sr][sc];
        if (old == newColour) return image;                  // nothing to do; also prevents endless revisits
        Queue<int[]> q = new ArrayDeque<>();
        q.offer(new int[] {sr, sc});
        image[sr][sc] = newColour;
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!q.isEmpty()) {
            int[] cell = q.poll();
            for (int[] d : dirs) {
                int r = cell[0] + d[0], c = cell[1] + d[1];
                if (r >= 0 && r < image.length && c >= 0 && c < image[0].length && image[r][c] == old) {
                    image[r][c] = newColour;
                    q.offer(new int[] {r, c});
                }
            }
        }
        return image;
    }

    static class Node {
        int val;
        List<Node> neighbors = new ArrayList<>();
        Node(int val) { this.val = val; }
    }

    static Node cloneGraph(Node node) {
        return node == null ? null : clone(node, new HashMap<>());
    }

    private static Node clone(Node node, Map<Node, Node> copies) {
        if (copies.containsKey(node)) return copies.get(node);     // already copied: reuse (handles cycles)
        Node copy = new Node(node.val);
        copies.put(node, copy);                                     // register BEFORE visiting neighbours
        for (Node neighbour : node.neighbors) {
            copy.neighbors.add(clone(neighbour, copies));
        }
        return copy;
    }

    public static void main(String[] args) {
        System.out.println("components: " + countComponents(5, new int[][] {{0, 1}, {1, 2}, {3, 4}}) + " " + countComponents(4, new int[][] {}));

        char[][] grid = {
            "11000".toCharArray(), "11000".toCharArray(), "00100".toCharArray(), "00011".toCharArray()};
        System.out.println("islands: " + numIslands(grid));

        int[][] image = {{1, 1, 1}, {1, 1, 0}, {1, 0, 1}};
        System.out.println("flood fill: " + Arrays.deepToString(floodFill(image, 1, 1, 2)));

        Node[] nodes = new Node[5];
        for (int i = 1; i <= 4; i++) nodes[i] = new Node(i);
        int[][] links = {{1, 2}, {2, 3}, {3, 4}, {4, 1}};
        for (int[] l : links) {
            nodes[l[0]].neighbors.add(nodes[l[1]]);
            nodes[l[1]].neighbors.add(nodes[l[0]]);
        }
        Node copy = cloneGraph(nodes[1]);
        Node copyOf4 = copy.neighbors.get(1);                // 1's neighbours: [2, 4]
        System.out.println("clone: node " + copy.val + " neighbours " + copy.neighbors.get(0).val + "," + copyOf4.val
                + "; new objects: " + (copy != nodes[1]) + "; 4' links back to the same 1': " + copyOf4.neighbors.contains(copy));
    }
}
```

**Output:**

```text
components: 2 4
islands: 3
flood fill: [[2, 2, 2], [2, 2, 0], [2, 0, 1]]
clone: node 1 neighbours 2,4; new objects: true; 4' links back to the same 1': true
```

## Dry Run

Flood fill from (1, 1) with old colour 1 → 2 on `[[1,1,1],[1,1,0],[1,0,1]]`:

| Dequeued | Recoloured neighbours | Queue after |
|----------|-----------------------|-------------|
| (1,1) | (0,1), (1,0) | [(0,1), (1,0)] |
| (0,1) | (0,0), (0,2) | [(1,0), (0,0), (0,2)] |
| (1,0) | (2,0) | [(0,0), (0,2), (2,0)] |
| (0,0), (0,2), (2,0) | none new | [] |

(2, 2) stays 1: it touches only 0-cells, so it is not 4-connected to the start.

## Complexity Analysis

| Problem | Time | Space |
|---------|------|-------|
| Connected components | O(V + E) | O(V + E) |
| Number of islands | O(r × c) | O(r × c) recursion worst case (one big island) |
| Flood fill | O(r × c) | O(r × c) queue |
| Clone graph | O(V + E) | O(V) map + recursion |

## Properties

- One traversal per component; each vertex/cell processed once overall.
- Marking can reuse the input (sinking land, recolouring) — mention that it mutates the input.

## Variations

- **Max area of island, perimeter of island, distinct island shapes.**
- **Surrounded regions / enclaves** — flood from the border first, then everything not reached is enclosed.
- **Pacific–Atlantic water flow** — two multi-source traversals from the two coasts, intersect the results.
- **Number of provinces** — components from an adjacency matrix.
- **Copy list with random pointer** — same old → new map idea on a linked list.

## Comparison

| Approach | Components (static) | Components (edges arriving online) |
|----------|--------------------|-----------------------------------|
| DFS / BFS | O(V + E) once | O(V + E) per update |
| Union-Find | O(E α(V)) | O(α(V)) per edge |

## Edge Cases

- Empty grid; all water; all land (deep recursion — use BFS or an explicit stack for very large grids).
- Flood fill with the same new colour as the old one.
- Clone graph with a single node, a self-loop, or `null` input.
- Isolated vertices count as their own components.

## Advantages

- Simple, linear-time solutions; one template covers many problems.

## Disadvantages

- Recursive DFS on large grids (10⁶ cells) can overflow the stack.

## When to Use

- "How many groups/regions/islands", "fill/colour the connected area", "copy a structure with cycles".

## Common Mistakes

- Forgetting diagonal vs 4-directional rules stated in the problem.
- Not marking cells visited before recursing (revisits and infinite recursion).
- Flood fill with `old == newColour` looping forever.
- Clone graph: creating the copy after visiting neighbours, so cycles create duplicate copies.

## Key Takeaways

- Count components by starting a traversal from every unvisited vertex.
- Grids are graphs: cells are vertices, 4 (or 8) neighbours are edges.
- Mark visited before exploring; for cloning, map original → copy before recursing.
