# BFS Pattern — Practice

### P1. Snakes and ladders

**Difficulty:** Medium · **Pattern:** BFS over board squares (implicit graph)

An n × n board is numbered 1 … n² in a boustrophedon order starting from the bottom-left (left to right on the bottom row, right to left on the next, and so on). `board[r][c] != -1` means a snake or ladder that moves you to that square. From square s you roll a die and move to s + 1 … s + 6 (capped at n²), then follow a snake/ladder if present (only once per move). Return the fewest rolls to reach n², or −1.

**Constraints:** 2 ≤ n ≤ 20.

Example: `[[-1, -1], [-1, 3]]` → `1` (from square 1, a roll of 3 reaches square 4 = n²).

<details>
<summary>Hint</summary>

Squares are states; each roll is a unit-cost move to up to 6 destinations. Write a helper that converts a square number to (row, column) given the alternating direction.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class SnakesAndLadders {

    static int snakesAndLadders(int[][] board) {
        int n = board.length, target = n * n;
        int[] dist = new int[target + 1];
        Arrays.fill(dist, -1);
        Deque<Integer> queue = new ArrayDeque<>();
        dist[1] = 0;
        queue.offer(1);
        while (!queue.isEmpty()) {
            int s = queue.poll();
            if (s == target) return dist[s];
            for (int next = s + 1; next <= Math.min(s + 6, target); next++) {
                int[] rc = cell(next, n);
                int dest = board[rc[0]][rc[1]] == -1 ? next : board[rc[0]][rc[1]];   // follow snake/ladder once
                if (dist[dest] == -1) {
                    dist[dest] = dist[s] + 1;
                    queue.offer(dest);
                }
            }
        }
        return -1;
    }

    static int[] cell(int square, int n) {
        int q = (square - 1) / n, r = (square - 1) % n;
        int row = n - 1 - q;
        int col = q % 2 == 0 ? r : n - 1 - r;          // direction alternates every row
        return new int[] {row, col};
    }

    public static void main(String[] args) {
        int[][] board = {
            {-1, -1, -1, -1, -1, -1}, {-1, -1, -1, -1, -1, -1}, {-1, -1, -1, -1, -1, -1},
            {-1, 35, -1, -1, 13, -1}, {-1, -1, -1, -1, -1, -1}, {-1, 15, -1, -1, -1, -1}};
        System.out.println(snakesAndLadders(board) + " " + snakesAndLadders(new int[][] {{-1, -1}, {-1, 3}}));
    }
}
```

**Output:**

```text
4 1
```

**Complexity:** O(n² × 6) time, O(n²) space.

</details>

### P2. Fewest buses to the destination

**Difficulty:** Hard · **Pattern:** BFS where routes (not stops) are the nodes

`routes[i]` lists the stops bus i visits in a loop. Starting at stop `source` (not on a bus), return the fewest buses you must take to reach stop `target`, or −1.

**Constraints:** 1 ≤ routes ≤ 500; total stops listed ≤ 10⁵; stop ids < 10⁶.

Example: `[[1, 2, 7], [3, 6, 7]]`, source 1, target 6 → `2` (bus 0 to stop 7, bus 1 to stop 6).

<details>
<summary>Hint</summary>

The cost counts buses, not stops. Map each stop to the buses that serve it. BFS level = number of buses taken: from a bus, every stop on it is reachable at no extra cost, and every other bus through those stops costs one more. Mark buses (and stops) visited so each route is expanded once.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class BusRoutes {

    static int numBusesToDestination(int[][] routes, int source, int target) {
        if (source == target) return 0;
        Map<Integer, List<Integer>> busesAt = new HashMap<>();
        for (int b = 0; b < routes.length; b++)
            for (int stop : routes[b]) busesAt.computeIfAbsent(stop, k -> new ArrayList<>()).add(b);
        boolean[] usedBus = new boolean[routes.length];
        Set<Integer> seenStop = new HashSet<>(List.of(source));
        Deque<Integer> queue = new ArrayDeque<>();                 // buses boarded at the current level
        for (int b : busesAt.getOrDefault(source, List.of())) {
            usedBus[b] = true;
            queue.offer(b);
        }
        for (int buses = 1; !queue.isEmpty(); buses++) {
            for (int size = queue.size(); size > 0; size--) {
                int b = queue.poll();
                for (int stop : routes[b]) {
                    if (stop == target) return buses;
                    if (!seenStop.add(stop)) continue;
                    for (int next : busesAt.get(stop)) {
                        if (!usedBus[next]) {
                            usedBus[next] = true;
                            queue.offer(next);
                        }
                    }
                }
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(numBusesToDestination(new int[][] {{1, 2, 7}, {3, 6, 7}}, 1, 6) + " "
                + numBusesToDestination(new int[][] {{7, 12}, {4, 5, 15}, {6}, {15, 19}, {9, 12, 13}}, 15, 12));
    }
}
```

**Output:**

```text
2 -1
```

**Complexity:** O(total stops listed) time and space — each bus and each stop is expanded once. BFS over stops directly would connect every pair of stops on a route, O(Σ route²) edges.

</details>

### P3. Shortest path when up to k walls may be removed

**Difficulty:** Hard · **Pattern:** BFS over (cell, eliminations left)

In a grid of 0 (empty) and 1 (wall), move 4-directionally from the top-left to the bottom-right. You may walk through at most k walls. Return the fewest steps, or −1.

**Constraints:** 1 ≤ rows, cols ≤ 40; 1 ≤ k ≤ rows × cols.

Example: `[[0,0,0],[1,1,0],[0,0,0],[0,1,1],[0,0,0]]`, k = 1 → `6`; `[[0,1,1],[1,1,1],[1,0,0]]`, k = 1 → `-1`.

<details>
<summary>Hint</summary>

The position alone is not enough state: reaching a cell with more eliminations left is better. Use state (r, c, remaining) with a 3D visited array. Shortcut: if k ≥ rows + cols − 2, the Manhattan path is always possible.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class ObstacleElimination {

    static int shortestPath(int[][] grid, int k) {
        int rows = grid.length, cols = grid[0].length;
        if (k >= rows + cols - 2) return rows + cols - 2;         // can break straight through
        boolean[][][] seen = new boolean[rows][cols][k + 1];
        Deque<int[]> queue = new ArrayDeque<>();
        queue.offer(new int[] {0, 0, k});
        seen[0][0][k] = true;
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        for (int steps = 0; !queue.isEmpty(); steps++) {
            for (int size = queue.size(); size > 0; size--) {
                int[] cur = queue.poll();
                if (cur[0] == rows - 1 && cur[1] == cols - 1) return steps;
                for (int[] d : dirs) {
                    int r = cur[0] + d[0], c = cur[1] + d[1];
                    if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
                    int left = cur[2] - grid[r][c];                 // walking into a wall uses one elimination
                    if (left >= 0 && !seen[r][c][left]) {
                        seen[r][c][left] = true;
                        queue.offer(new int[] {r, c, left});
                    }
                }
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(shortestPath(new int[][] {{0, 0, 0}, {1, 1, 0}, {0, 0, 0}, {0, 1, 1}, {0, 0, 0}}, 1) + " "
                + shortestPath(new int[][] {{0, 1, 1}, {1, 1, 1}, {1, 0, 0}}, 1));
    }
}
```

**Output:**

```text
6 -1
```

**Complexity:** O(rows × cols × k) time and space.

</details>
