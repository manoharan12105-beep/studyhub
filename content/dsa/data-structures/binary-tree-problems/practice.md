# Binary Tree Problems — Practice

### P1. Root-to-leaf path sum

**Difficulty:** Easy · **Pattern:** Top-down remaining sum

Return `true` if some root-to-leaf path has values summing to `target`.

**Constraints:** 0 ≤ n ≤ 5000; values and target in [−1000, 1000] (sums fit in `int`).

<details>
<summary>Hint</summary>

Pass `target − node.val` down; check for zero at a leaf (not at a null child).

</details>

<details>
<summary>Answer</summary>

```java
public class PathSumExists {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
    }

    static boolean hasPathSum(TreeNode node, int target) {
        if (node == null) return false;
        int remaining = target - node.val;
        if (node.left == null && node.right == null) return remaining == 0;
        return hasPathSum(node.left, remaining) || hasPathSum(node.right, remaining);
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(5,
                new TreeNode(4, new TreeNode(11, new TreeNode(7, null, null), new TreeNode(2, null, null)), null),
                new TreeNode(8, new TreeNode(13, null, null), new TreeNode(4, null, new TreeNode(1, null, null))));
        System.out.println(hasPathSum(root, 22) + " " + hasPathSum(root, 26) + " " + hasPathSum(root, 9));
    }
}
```

**Output:**

```text
true true false
```

**Complexity:** O(n) time, O(h) space. (5 + 4 + 11 + 2 = 22; 5 + 8 + 13 = 26; 9 would need 5 + 4, but 4 is not a leaf.)

</details>

### P2. All root-to-leaf paths with a given sum

**Difficulty:** Medium · **Pattern:** Backtracking on a tree

Return every root-to-leaf path whose values sum to `target`.

**Constraints:** 0 ≤ n ≤ 5000.

<details>
<summary>Hint</summary>

Keep one shared path list: add the node, recurse, then remove it (undo) before returning. Copy the path when you find a match.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class PathSumAll {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
    }

    static List<List<Integer>> pathSum(TreeNode root, int target) {
        List<List<Integer>> result = new ArrayList<>();
        dfs(root, target, new ArrayList<>(), result);
        return result;
    }

    private static void dfs(TreeNode node, int remaining, List<Integer> path, List<List<Integer>> result) {
        if (node == null) return;
        path.add(node.val);                                   // choose
        remaining -= node.val;
        if (node.left == null && node.right == null && remaining == 0) {
            result.add(new ArrayList<>(path));                // copy: path keeps changing
        } else {
            dfs(node.left, remaining, path, result);          // explore
            dfs(node.right, remaining, path, result);
        }
        path.remove(path.size() - 1);                         // undo
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(5,
                new TreeNode(4, new TreeNode(11, new TreeNode(7, null, null), new TreeNode(2, null, null)), null),
                new TreeNode(8, new TreeNode(13, null, null), new TreeNode(4, new TreeNode(5, null, null), new TreeNode(1, null, null))));
        System.out.println(pathSum(root, 22));
    }
}
```

**Output:**

```text
[[5, 4, 11, 2], [5, 8, 4, 5]]
```

**Complexity:** O(n × h) time in the worst case (copying paths of length h), O(h) space besides the output.

</details>

### P3. All nodes at distance K from a target node

**Difficulty:** Medium · **Pattern:** Tree → graph, then BFS

Return the values of all nodes exactly K edges away from a given target node (in any direction).

**Constraints:** 1 ≤ n ≤ 500; values unique; 0 ≤ K ≤ 1000.

Example: tree `[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]`, target = 5, K = 2 → `[7, 4, 1]` (any order).

<details>
<summary>Hint</summary>

Nodes do not know their parents. Record a parent map with one DFS, then BFS from the target over left, right and parent edges.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class DistanceK {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static List<Integer> distanceK(TreeNode root, TreeNode target, int k) {
        Map<TreeNode, TreeNode> parent = new HashMap<>();
        recordParents(root, null, parent);
        Queue<TreeNode> queue = new ArrayDeque<>(List.of(target));
        Set<TreeNode> seen = new HashSet<>(List.of(target));
        for (int distance = 0; distance < k && !queue.isEmpty(); distance++) {
            for (int i = queue.size(); i > 0; i--) {
                TreeNode node = queue.poll();
                for (TreeNode next : new TreeNode[] {node.left, node.right, parent.get(node)}) {
                    if (next != null && seen.add(next)) queue.offer(next);
                }
            }
        }
        List<Integer> result = new ArrayList<>();
        for (TreeNode n : queue) result.add(n.val);
        return result;
    }

    private static void recordParents(TreeNode node, TreeNode par, Map<TreeNode, TreeNode> parent) {
        if (node == null) return;
        parent.put(node, par);
        recordParents(node.left, node, parent);
        recordParents(node.right, node, parent);
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(3);
        TreeNode five = root.left = new TreeNode(5);
        root.right = new TreeNode(1);
        five.left = new TreeNode(6);
        five.right = new TreeNode(2);
        root.right.left = new TreeNode(0);
        root.right.right = new TreeNode(8);
        five.right.left = new TreeNode(7);
        five.right.right = new TreeNode(4);
        System.out.println(distanceK(root, five, 2));
        System.out.println(distanceK(root, five, 0));
    }
}
```

**Output:**

```text
[7, 4, 1]
[5]
```

**Complexity:** O(n) time and space.

</details>

### P4. Vertical order traversal with tie-breaking

**Difficulty:** Hard · **Pattern:** Coordinates + sorting

Give the root position (row 0, column 0); a left child is (row + 1, column − 1) and a right child (row + 1, column + 1). Return the nodes column by column from left to right; within a column, order by row, and nodes in the same row **and** column by value.

**Constraints:** 1 ≤ n ≤ 1000.

Example: `[1, 2, 3, 4, 6, 5, 7]` → `[[4], [2], [1, 5, 6], [3], [7]]` (5 and 6 share row 2, column 0 → sorted by value).

<details>
<summary>Hint</summary>

Collect (column, row, value) triples with any traversal, sort them, then group by column.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class VerticalOrder {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    record Point(int column, int row, int value) { }

    static List<List<Integer>> verticalTraversal(TreeNode root) {
        List<Point> points = new ArrayList<>();
        collect(root, 0, 0, points);
        points.sort(Comparator.comparingInt(Point::column)
                .thenComparingInt(Point::row)
                .thenComparingInt(Point::value));
        List<List<Integer>> result = new ArrayList<>();
        Integer currentColumn = null;
        for (Point p : points) {
            if (currentColumn == null || p.column() != currentColumn) {
                result.add(new ArrayList<>());
                currentColumn = p.column();
            }
            result.get(result.size() - 1).add(p.value());
        }
        return result;
    }

    private static void collect(TreeNode n, int row, int column, List<Point> points) {
        if (n == null) return;
        points.add(new Point(column, row, n.val));
        collect(n.left, row + 1, column - 1, points);
        collect(n.right, row + 1, column + 1, points);
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(1);
        root.left = new TreeNode(2);
        root.right = new TreeNode(3);
        root.left.left = new TreeNode(4);
        root.left.right = new TreeNode(6);
        root.right.left = new TreeNode(5);
        root.right.right = new TreeNode(7);
        System.out.println(verticalTraversal(root));
    }
}
```

**Output:**

```text
[[4], [2], [1, 5, 6], [3], [7]]
```

**Complexity:** O(n log n) time (sorting), O(n) space.

</details>

### P5. Count downward paths with a given sum

**Difficulty:** Hard · **Pattern:** Prefix sums on a root-to-node path

Count paths that go **downward** (parent to child, any start and end node) whose values sum to `target`.

**Constraints:** 0 ≤ n ≤ 1000; values in [−10⁹, 10⁹] (use `long` sums).

Example: `[10, 5, -3, 3, 2, null, 11, 3, -2, null, 1]`, target = 8 → `3` (5→3, 5→2→1, −3→11).

<details>
<summary>Hint</summary>

Brute force starts a path sum from every node: O(n × h). Instead, keep a map of prefix sums along the current root-to-node path: a path ending here with sum target exists for every earlier prefix equal to `currentSum − target`.

</details>

<details>
<summary>Answer</summary>

**Approach:** This is the array "subarray sum equals k" idea ([Prefix Sum](../../patterns/prefix-sum/content.md)) applied to each root-to-node path. Add the current prefix to the map before recursing and remove it afterwards (backtrack), so sibling branches do not see each other's prefixes.

```java
import java.util.*;

public class PathSumIII {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static int pathSum(TreeNode root, long target) {
        Map<Long, Integer> prefixCount = new HashMap<>();
        prefixCount.put(0L, 1);                      // empty prefix: paths starting at the root
        return dfs(root, 0L, target, prefixCount);
    }

    private static int dfs(TreeNode node, long sum, long target, Map<Long, Integer> prefixCount) {
        if (node == null) return 0;
        sum += node.val;
        int count = prefixCount.getOrDefault(sum - target, 0);
        prefixCount.merge(sum, 1, Integer::sum);
        count += dfs(node.left, sum, target, prefixCount) + dfs(node.right, sum, target, prefixCount);
        prefixCount.merge(sum, -1, Integer::sum);     // backtrack
        return count;
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(10);
        root.left = new TreeNode(5);
        root.right = new TreeNode(-3);
        root.left.left = new TreeNode(3);
        root.left.right = new TreeNode(2);
        root.right.right = new TreeNode(11);
        root.left.left.left = new TreeNode(3);
        root.left.left.right = new TreeNode(-2);
        root.left.right.right = new TreeNode(1);
        System.out.println(pathSum(root, 8));
    }
}
```

**Output:**

```text
3
```

**Complexity:** O(n) average time, O(h) space for the map and recursion.

</details>
