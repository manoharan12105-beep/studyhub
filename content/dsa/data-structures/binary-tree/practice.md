# Binary Tree — Practice

Solutions use a nested `TreeNode` class and a `build(Integer...)` helper that creates a tree from a level-order array with `null` for missing nodes, as shown in the lesson.

### P1. Sum of left leaves

**Difficulty:** Easy · **Pattern:** Recursion with a role flag

Return the sum of all leaves that are the **left** child of their parent.

**Constraints:** 1 ≤ n ≤ 1000.

Example: `[3, 9, 20, null, null, 15, 7]` → 9 + 15 = `24`.

<details>
<summary>Hint</summary>

A leaf alone does not know whether it is a left child — pass that information down.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class SumOfLeftLeaves {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static int sumLeftLeaves(TreeNode node, boolean isLeft) {
        if (node == null) return 0;
        if (node.left == null && node.right == null) return isLeft ? node.val : 0;
        return sumLeftLeaves(node.left, true) + sumLeftLeaves(node.right, false);
    }

    static TreeNode build(Integer... v) {
        TreeNode root = new TreeNode(v[0]);
        Queue<TreeNode> q = new ArrayDeque<>(List.of(root));
        for (int i = 1; i < v.length; i += 2) {
            TreeNode p = q.poll();
            if (v[i] != null) { p.left = new TreeNode(v[i]); q.offer(p.left); }
            if (i + 1 < v.length && v[i + 1] != null) { p.right = new TreeNode(v[i + 1]); q.offer(p.right); }
        }
        return root;
    }

    public static void main(String[] args) {
        System.out.println(sumLeftLeaves(build(3, 9, 20, null, null, 15, 7), false));
        System.out.println(sumLeftLeaves(build(1), false));        // the root is not a left leaf
    }
}
```

**Output:**

```text
24
0
```

**Complexity:** O(n) time, O(h) space.

</details>

### P2. Same tree

**Difficulty:** Easy · **Pattern:** Parallel recursion

Return `true` if two binary trees have the same shape and the same values.

**Constraints:** 0 ≤ n ≤ 100 for each tree.

<details>
<summary>Hint</summary>

Two empty trees are equal; an empty and a non-empty tree are not.

</details>

<details>
<summary>Answer</summary>

```java
public class SameTree {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
    }

    static boolean same(TreeNode a, TreeNode b) {
        if (a == null || b == null) return a == b;              // both null → true
        return a.val == b.val && same(a.left, b.left) && same(a.right, b.right);
    }

    public static void main(String[] args) {
        TreeNode t1 = new TreeNode(1, new TreeNode(2, null, null), new TreeNode(3, null, null));
        TreeNode t2 = new TreeNode(1, new TreeNode(2, null, null), new TreeNode(3, null, null));
        TreeNode t3 = new TreeNode(1, new TreeNode(2, null, null), null);
        TreeNode t4 = new TreeNode(1, null, new TreeNode(2, null, null));
        System.out.println(same(t1, t2) + " " + same(t3, t4));
    }
}
```

**Output:**

```text
true false
```

**Complexity:** O(min(n₁, n₂)) time, O(min(h₁, h₂)) space.

</details>

### P3. Minimum depth

**Difficulty:** Medium · **Pattern:** BFS stops at the first leaf

Return the number of nodes on the shortest path from the root to a **leaf**.

**Constraints:** 0 ≤ n ≤ 10⁵.

Example: `[2, null, 3, null, 4]` (a chain) → `3`, not 1 — the root is not a leaf.

<details>
<summary>Hint</summary>

The trap: `1 + min(left, right)` counts a missing child as depth 0. A level-order search can stop at the first leaf it meets.

</details>

<details>
<summary>Answer</summary>

**Approach:** BFS visits nodes in order of depth, so the first leaf dequeued is the shallowest. This is also faster than DFS on wide, shallow trees.

```java
import java.util.*;

public class MinDepth {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static int minDepth(TreeNode root) {
        if (root == null) return 0;
        Queue<TreeNode> queue = new ArrayDeque<>(List.of(root));
        int depth = 1;
        while (!queue.isEmpty()) {
            for (int i = queue.size(); i > 0; i--) {
                TreeNode node = queue.poll();
                if (node.left == null && node.right == null) return depth;
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            depth++;
        }
        return depth;
    }

    public static void main(String[] args) {
        TreeNode chain = new TreeNode(2);
        chain.right = new TreeNode(3);
        chain.right.right = new TreeNode(4);
        TreeNode bushy = new TreeNode(3);
        bushy.left = new TreeNode(9);
        bushy.right = new TreeNode(20);
        bushy.right.left = new TreeNode(15);
        System.out.println(minDepth(chain) + " " + minDepth(bushy));
    }
}
```

**Output:**

```text
3 2
```

**Complexity:** O(n) time worst case, O(w) space for the queue.

</details>

### P4. Maximum width of a binary tree

**Difficulty:** Medium · **Pattern:** Array-position numbering

The width of a level is the number of positions between its leftmost and rightmost non-null nodes, **counting the gaps** as if the tree were complete. Return the maximum width over all levels.

**Constraints:** 1 ≤ n ≤ 3000.

Example: `[1, 3, 2, 5, null, null, 9]` → level 2 has 5 … 9 spanning 4 positions → `4`.

<details>
<summary>Hint</summary>

Number nodes as in the array representation: left = 2i + 1, right = 2i + 2. Width = last index − first index + 1 on each level. Renumber each level from 0 to avoid overflow in deep trees.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class MaxWidth {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    record Item(TreeNode node, long index) { }

    static int widthOfBinaryTree(TreeNode root) {
        long best = 0;
        Queue<Item> queue = new ArrayDeque<>(List.of(new Item(root, 0)));
        while (!queue.isEmpty()) {
            int count = queue.size();
            long first = queue.peek().index();
            long last = first;
            for (int i = 0; i < count; i++) {
                Item item = queue.poll();
                long index = item.index() - first;          // renumber from 0 on each level
                last = item.index();
                if (item.node().left != null) queue.offer(new Item(item.node().left, 2 * index + 1));
                if (item.node().right != null) queue.offer(new Item(item.node().right, 2 * index + 2));
            }
            best = Math.max(best, last - first + 1);
        }
        return (int) best;
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(1);
        root.left = new TreeNode(3);
        root.right = new TreeNode(2);
        root.left.left = new TreeNode(5);
        root.right.right = new TreeNode(9);
        System.out.println(widthOfBinaryTree(root));
    }
}
```

**Output:**

```text
4
```

**Complexity:** O(n) time, O(w) space.

</details>

### P5. Count nodes in a complete tree faster than O(n)

**Difficulty:** Hard · **Pattern:** Use the complete-tree shape

Count the nodes of a **complete** binary tree in less than O(n) time.

**Constraints:** 0 ≤ n ≤ 5 × 10⁴; the tree is complete.

<details>
<summary>Hint</summary>

Compare the height of the leftmost path and the rightmost path. If they are equal, the tree is perfect: 2ʰ − 1 nodes (counting levels). Otherwise recurse — one of the two subtrees will be perfect.

</details>

<details>
<summary>Answer</summary>

**Approach:** Measuring both edge paths costs O(log n). If equal, return 2ᵈ − 1 directly. If not, recurse into both children; in a complete tree at least one of them is perfect and returns immediately, so only one path keeps recursing: O(log n) levels × O(log n) per level.

```java
public class CountCompleteNodes {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static int countNodes(TreeNode root) {
        if (root == null) return 0;
        int leftDepth = 0, rightDepth = 0;
        for (TreeNode n = root; n != null; n = n.left) leftDepth++;
        for (TreeNode n = root; n != null; n = n.right) rightDepth++;
        if (leftDepth == rightDepth) {
            return (1 << leftDepth) - 1;              // perfect tree with leftDepth levels
        }
        return 1 + countNodes(root.left) + countNodes(root.right);
    }

    static TreeNode completeTree(int n) {             // nodes 1..n laid out in array order
        TreeNode[] nodes = new TreeNode[n + 1];
        for (int i = 1; i <= n; i++) nodes[i] = new TreeNode(i);
        for (int i = 1; i <= n; i++) {
            if (2 * i <= n) nodes[i].left = nodes[2 * i];
            if (2 * i + 1 <= n) nodes[i].right = nodes[2 * i + 1];
        }
        return n == 0 ? null : nodes[1];
    }

    public static void main(String[] args) {
        System.out.println(countNodes(completeTree(6)) + " " + countNodes(completeTree(7)) + " " + countNodes(completeTree(50000)) + " " + countNodes(completeTree(0)));
    }
}
```

**Output:**

```text
6 7 50000 0
```

**Complexity:** O(log² n) time, O(log n) space.

</details>
