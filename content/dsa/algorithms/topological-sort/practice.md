# Topological Sort (DFS and Kahn's Algorithm) — Practice

### P1. Course order

**Difficulty:** Medium · **Pattern:** Kahn's algorithm returning the order

Given `numCourses` and pairs `[course, prerequisite]`, return any valid order to take all courses, or an empty array if impossible.

**Constraints:** 1 ≤ numCourses ≤ 2000; pairs ≤ 5000.

Example: 4, `[[1,0],[2,0],[3,1],[3,2]]` → `[0, 1, 2, 3]` (or `[0, 2, 1, 3]`).

<details>
<summary>Hint</summary>

Edge prerequisite → course. Kahn's order is the answer when it contains every course.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class CourseOrder {

    static int[] findOrder(int n, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[] indegree = new int[n];
        for (int[] p : prerequisites) {
            adj.get(p[1]).add(p[0]);
            indegree[p[0]]++;
        }
        Queue<Integer> q = new ArrayDeque<>();
        for (int c = 0; c < n; c++) if (indegree[c] == 0) q.offer(c);
        int[] order = new int[n];
        int count = 0;
        while (!q.isEmpty()) {
            int c = q.poll();
            order[count++] = c;
            for (int next : adj.get(c)) if (--indegree[next] == 0) q.offer(next);
        }
        return count == n ? order : new int[0];
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(findOrder(4, new int[][] {{1, 0}, {2, 0}, {3, 1}, {3, 2}})) + " "
                + Arrays.toString(findOrder(2, new int[][] {{0, 1}, {1, 0}})));
    }
}
```

**Output:**

```text
[0, 1, 2, 3] []
```

**Complexity:** O(V + E) time and space.

</details>

### P2. Minimum number of semesters

**Difficulty:** Medium · **Pattern:** Kahn level by level

Courses 1..n with relations `[prev, next]`. In one semester you may take any number of courses whose prerequisites were all completed in earlier semesters. Return the minimum number of semesters, or −1 if impossible.

**Constraints:** 1 ≤ n ≤ 5000.

Example: n = 3, `[[1,3],[2,3]]` → `2`.

<details>
<summary>Hint</summary>

All in-degree-0 courses can be taken in semester 1; removing them frees the next level. The number of BFS levels is the answer — the length of the longest dependency chain.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class MinSemesters {

    static int minimumSemesters(int n, int[][] relations) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        int[] indegree = new int[n + 1];
        for (int[] r : relations) {
            adj.get(r[0]).add(r[1]);
            indegree[r[1]]++;
        }
        Queue<Integer> q = new ArrayDeque<>();
        for (int c = 1; c <= n; c++) if (indegree[c] == 0) q.offer(c);
        int semesters = 0, taken = 0;
        while (!q.isEmpty()) {
            semesters++;
            for (int i = q.size(); i > 0; i--) {          // everything available this semester
                int c = q.poll();
                taken++;
                for (int next : adj.get(c)) if (--indegree[next] == 0) q.offer(next);
            }
        }
        return taken == n ? semesters : -1;
    }

    public static void main(String[] args) {
        System.out.println(minimumSemesters(3, new int[][] {{1, 3}, {2, 3}}) + " " + minimumSemesters(3, new int[][] {{1, 2}, {2, 3}, {3, 1}})
                + " " + minimumSemesters(4, new int[][] {{1, 2}, {2, 3}, {3, 4}}));
    }
}
```

**Output:**

```text
2 -1 4
```

**Complexity:** O(V + E) time and space.

</details>

### P3. Alien dictionary

**Difficulty:** Hard · **Pattern:** Derive edges from adjacent words, then topological sort

Words of an alien language are sorted lexicographically by an unknown letter order. Return any letter order consistent with the list, or "" if the list is contradictory.

**Constraints:** 1 ≤ words ≤ 100; lengths ≤ 100; lowercase letters.

Example: `["wrt","wrf","er","ett","rftt"]` → `"wertf"`.

<details>
<summary>Hint</summary>

Only **adjacent** words give information: the first position where they differ says letter a comes before letter b. Watch for the invalid case where a word is followed by its own proper prefix ("abc" before "ab").

</details>

<details>
<summary>Answer</summary>

**Approach:** Build edges from the first difference of each adjacent pair, include every letter that appears (even with no edges), then run Kahn's algorithm. A cycle or a prefix violation means no valid order.

```java
import java.util.*;

public class AlienDictionary {

    static String alienOrder(String[] words) {
        Map<Character, Set<Character>> adj = new TreeMap<>();      // TreeMap: deterministic output
        Map<Character, Integer> indegree = new TreeMap<>();
        for (String w : words) {
            for (char c : w.toCharArray()) {
                adj.putIfAbsent(c, new TreeSet<>());
                indegree.putIfAbsent(c, 0);
            }
        }
        for (int i = 0; i + 1 < words.length; i++) {
            String a = words[i], b = words[i + 1];
            if (a.length() > b.length() && a.startsWith(b)) return "";   // "abc" cannot precede "ab"
            for (int j = 0; j < Math.min(a.length(), b.length()); j++) {
                char x = a.charAt(j), y = b.charAt(j);
                if (x != y) {
                    if (adj.get(x).add(y)) indegree.merge(y, 1, Integer::sum);   // count each edge once
                    break;                                   // only the first difference matters
                }
            }
        }
        Queue<Character> q = new ArrayDeque<>();
        for (Map.Entry<Character, Integer> e : indegree.entrySet()) if (e.getValue() == 0) q.offer(e.getKey());
        StringBuilder order = new StringBuilder();
        while (!q.isEmpty()) {
            char c = q.poll();
            order.append(c);
            for (char next : adj.get(c)) {
                if (indegree.merge(next, -1, Integer::sum) == 0) q.offer(next);
            }
        }
        return order.length() == indegree.size() ? order.toString() : "";
    }

    public static void main(String[] args) {
        System.out.println(alienOrder(new String[] {"wrt", "wrf", "er", "ett", "rftt"}) + " [" + alienOrder(new String[] {"z", "x", "z"}) + "] [" + alienOrder(new String[] {"abc", "ab"}) + "]");
    }
}
```

**Output:**

```text
wertf [] []
```

**Complexity:** O(C + U + E) where C is the total number of characters, U the distinct letters (≤ 26) and E ≤ U² edges.

</details>
