# Breadth-First Search (BFS) — Practice

### P1. Rotting oranges

**Difficulty:** Medium · **Pattern:** Multi-source BFS

In a grid, 0 = empty, 1 = fresh orange, 2 = rotten orange. Every minute, fresh oranges adjacent (4 directions) to a rotten one become rotten. Return the minutes until no fresh orange remains, or −1 if impossible.

**Constraints:** 1 ≤ r, c ≤ 10.

Example: `[[2,1,1],[1,1,0],[0,1,1]]` → `4`; `[[2,1,1],[0,1,1],[1,0,1]]` → `-1`.

<details>
<summary>Hint</summary>

All rotten oranges spread at the same time: enqueue all of them at minute 0 and process level by level.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class RottingOranges {

    static int minutes(int[][] grid) {
        int rows = grid.length, cols = grid[0].length, fresh = 0;
        Queue<int[]> q = new ArrayDeque<>();
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) q.offer(new int[] {r, c});
                else if (grid[r][c] == 1) fresh++;
            }
        }
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        int minute = 0;
        while (!q.isEmpty() && fresh > 0) {
            for (int i = q.size(); i > 0; i--) {            // one minute = one BFS level
                int[] cell = q.poll();
                for (int[] d : dirs) {
                    int r = cell[0] + d[0], c = cell[1] + d[1];
                    if (r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] == 1) {
                        grid[r][c] = 2;                     // mark when enqueued
                        fresh--;
                        q.offer(new int[] {r, c});
                    }
                }
            }
            minute++;
        }
        return fresh == 0 ? minute : -1;
    }

    public static void main(String[] args) {
        System.out.println(minutes(new int[][] {{2, 1, 1}, {1, 1, 0}, {0, 1, 1}}) + " "
                + minutes(new int[][] {{2, 1, 1}, {0, 1, 1}, {1, 0, 1}}) + " " + minutes(new int[][] {{0, 2}}));
    }
}
```

**Output:**

```text
4 -1 0
```

**Complexity:** O(r × c) time and space.

</details>

### P2. Shortest path in a binary matrix (8 directions)

**Difficulty:** Medium · **Pattern:** Grid BFS counting cells

Return the number of cells on the shortest path from the top-left to the bottom-right cell through 0-cells, moving in 8 directions; −1 if none.

**Constraints:** 1 ≤ n ≤ 100.

Example: `[[0,1],[1,0]]` → `2`; `[[0,0,0],[1,1,0],[1,1,0]]` → `4`.

<details>
<summary>Hint</summary>

Same as 4-directional BFS with 8 direction vectors; the answer counts cells, so start the distance at 1.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class ShortestBinaryPath {

    static int shortest(int[][] g) {
        int n = g.length;
        if (g[0][0] == 1 || g[n - 1][n - 1] == 1) return -1;
        Queue<int[]> q = new ArrayDeque<>();
        q.offer(new int[] {0, 0, 1});                         // row, col, cells so far
        g[0][0] = 1;                                          // reuse the grid as "visited"
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            if (cur[0] == n - 1 && cur[1] == n - 1) return cur[2];
            for (int dr = -1; dr <= 1; dr++) {
                for (int dc = -1; dc <= 1; dc++) {
                    int r = cur[0] + dr, c = cur[1] + dc;
                    if (r >= 0 && r < n && c >= 0 && c < n && g[r][c] == 0) {
                        g[r][c] = 1;
                        q.offer(new int[] {r, c, cur[2] + 1});
                    }
                }
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(shortest(new int[][] {{0, 1}, {1, 0}}) + " " + shortest(new int[][] {{0, 0, 0}, {1, 1, 0}, {1, 1, 0}}) + " " + shortest(new int[][] {{1, 0}, {0, 0}}));
    }
}
```

**Output:**

```text
2 4 -1
```

**Complexity:** O(n²) time and space (it mutates the input — mention it or copy first).

</details>

### P3. Open the lock

**Difficulty:** Medium · **Pattern:** BFS over states

A lock has 4 wheels with digits 0–9 (wrapping around). It starts at "0000"; one move turns one wheel one step up or down. Avoid every code in `deadends`. Return the minimum moves to reach `target`, or −1.

**Constraints:** up to 500 dead ends.

Example: deadends `["0201","0101","0102","1212","2002"]`, target `"0202"` → `6`.

<details>
<summary>Hint</summary>

Each of the 10⁴ codes is a vertex with 8 neighbours. BFS from "0000"; treat dead ends as already visited.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class OpenLock {

    static int openLock(String[] deadends, String target) {
        Set<String> visited = new HashSet<>(Arrays.asList(deadends));
        if (visited.contains("0000")) return -1;
        Queue<String> q = new ArrayDeque<>(List.of("0000"));
        visited.add("0000");
        for (int moves = 0; !q.isEmpty(); moves++) {
            for (int i = q.size(); i > 0; i--) {
                String code = q.poll();
                if (code.equals(target)) return moves;
                char[] digits = code.toCharArray();
                for (int w = 0; w < 4; w++) {
                    char original = digits[w];
                    for (int step : new int[] {1, 9}) {                 // +1 or -1 (mod 10)
                        digits[w] = (char) ('0' + (original - '0' + step) % 10);
                        String next = new String(digits);
                        if (visited.add(next)) q.offer(next);
                    }
                    digits[w] = original;
                }
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(openLock(new String[] {"0201", "0101", "0102", "1212", "2002"}, "0202") + " "
                + openLock(new String[] {"8888"}, "0009") + " "
                + openLock(new String[] {"8887", "8889", "8878", "8898", "8788", "8988", "7888", "9888"}, "8888"));
    }
}
```

**Output:**

```text
6 1 -1
```

**Complexity:** O(10⁴ × 8 × 4) time for the at most 10⁴ states, each generating 8 neighbours of length 4; O(10⁴) space.

</details>

### P4. Word ladder

**Difficulty:** Hard · **Pattern:** BFS on an implicit graph

Transform `begin` into `end` by changing one letter at a time; every intermediate word must be in the dictionary. Return the number of words in the shortest transformation sequence (including both ends), or 0.

**Constraints:** word length ≤ 10; dictionary ≤ 5000 words.

Example: `"hit"` → `"cog"`, dictionary `[hot, dot, dog, lot, log, cog]` → `5` (hit → hot → dot → dog → cog).

<details>
<summary>Hint</summary>

Words are vertices; one-letter differences are edges. Generate neighbours by trying all 26 letters at each position and checking a `HashSet` — cheaper than comparing all pairs.

</details>

<details>
<summary>Answer</summary>

**Approach:** Building all edges by comparing every pair costs O(N² × L). Generating candidates costs O(26 × L) per word, with O(L) per lookup. Removing words from the set when enqueued marks them visited.

```java
import java.util.*;

public class WordLadder {

    static int ladderLength(String begin, String end, List<String> dictionary) {
        Set<String> words = new HashSet<>(dictionary);
        if (!words.contains(end)) return 0;
        Queue<String> q = new ArrayDeque<>(List.of(begin));
        words.remove(begin);
        for (int length = 1; !q.isEmpty(); length++) {
            for (int i = q.size(); i > 0; i--) {
                String word = q.poll();
                if (word.equals(end)) return length;
                char[] chars = word.toCharArray();
                for (int p = 0; p < chars.length; p++) {
                    char original = chars[p];
                    for (char c = 'a'; c <= 'z'; c++) {
                        if (c == original) continue;
                        chars[p] = c;
                        String next = new String(chars);
                        if (words.remove(next)) q.offer(next);     // remove = mark visited
                    }
                    chars[p] = original;
                }
            }
        }
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(ladderLength("hit", "cog", List.of("hot", "dot", "dog", "lot", "log", "cog")) + " "
                + ladderLength("hit", "cog", List.of("hot", "dot", "dog", "lot", "log")));
    }
}
```

**Output:**

```text
5 0
```

**Complexity:** O(N × L² × 26) time for N dictionary words of length L (L positions × 26 letters × O(L) to build/hash each candidate), O(N × L) space. Bidirectional BFS speeds it up further.

</details>
