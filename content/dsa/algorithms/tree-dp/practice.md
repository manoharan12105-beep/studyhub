# Tree DP — Practice

### P1. Largest BST inside a binary tree

**Difficulty:** Medium · **Pattern:** Return (isBST, size, min, max) per subtree

Return the number of nodes in the largest subtree that is a valid binary search tree.

**Constraints:** 0 ≤ n ≤ 10⁴.

Example: `[10, 5, 15, 1, 8, null, 7]` → `3` (the subtree rooted at 5).

<details>
<summary>Hint</summary>

Checking every subtree separately is O(n²). In one postorder pass, each node needs from its children: are they BSTs, their sizes, and their min/max values.

</details>

<details>
<summary>Answer</summary>

```java
public class LargestBstSubtree {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static int best;

    // Returns {isBst (1/0), size, min, max}.
    static int[] visit(TreeNode node) {
        if (node == null) return new int[] {1, 0, Integer.MAX_VALUE, Integer.MIN_VALUE};
        int[] l = visit(node.left), r = visit(node.right);
        if (l[0] == 1 && r[0] == 1 && l[3] < node.val && node.val < r[2]) {
            int size = l[1] + r[1] + 1;
            best = Math.max(best, size);
            return new int[] {1, size, Math.min(l[2], node.val), Math.max(r[3], node.val)};
        }
        return new int[] {0, 0, 0, 0};                     // not a BST: parent cannot be one either
    }

    static int largestBst(TreeNode root) {
        best = 0;
        visit(root);
        return best;
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(10);
        root.left = new TreeNode(5);
        root.right = new TreeNode(15);
        root.left.left = new TreeNode(1);
        root.left.right = new TreeNode(8);
        root.right.right = new TreeNode(7);
        System.out.println(largestBst(root) + " " + largestBst(null));
    }
}
```

**Output:**

```text
3 0
```

**Complexity:** O(n) time, O(h) space.

</details>

### P2. Binary tree cameras

**Difficulty:** Hard · **Pattern:** Three states per node, greedy from the leaves

A camera at a node monitors itself, its parent and its children. Return the minimum number of cameras to monitor every node.

**Constraints:** 1 ≤ n ≤ 1000.

Example: `[0, 0, null, 0, 0]` → `1`; `[0, 0, null, 0, null, 0, null, null, 0]` → `2`.

<details>
<summary>Hint</summary>

States returned to the parent: 0 = not covered, 1 = covered without a camera, 2 = has a camera. A null child counts as covered. If any child is not covered, this node must hold a camera; if any child has a camera, this node is covered; otherwise this node is not covered (let its parent cover it).

</details>

<details>
<summary>Answer</summary>

**Approach:** Placing cameras at leaves wastes coverage; placing them at leaves' parents covers the most. The postorder state machine implements exactly that.

```java
public class TreeCameras {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode() { }
    }

    static int cameras;
    static final int NOT_COVERED = 0, COVERED = 1, CAMERA = 2;

    static int state(TreeNode node) {
        if (node == null) return COVERED;                  // nothing to watch
        int l = state(node.left), r = state(node.right);
        if (l == NOT_COVERED || r == NOT_COVERED) {
            cameras++;                                     // a child needs us
            return CAMERA;
        }
        if (l == CAMERA || r == CAMERA) return COVERED;
        return NOT_COVERED;                                // leave it to the parent
    }

    static int minCameraCover(TreeNode root) {
        cameras = 0;
        if (state(root) == NOT_COVERED) cameras++;         // the root has no parent to rely on
        return cameras;
    }

    public static void main(String[] args) {
        TreeNode a = new TreeNode();                        // [0,0,null,0,0]
        a.left = new TreeNode();
        a.left.left = new TreeNode();
        a.left.right = new TreeNode();

        TreeNode b = new TreeNode();                        // chain of 5 nodes
        TreeNode cur = b;
        for (int i = 0; i < 4; i++) {
            cur.left = new TreeNode();
            cur = cur.left;
        }
        System.out.println(minCameraCover(a) + " " + minCameraCover(b) + " " + minCameraCover(new TreeNode()));
    }
}
```

**Output:**

```text
1 2 1
```

**Complexity:** O(n) time, O(h) space.

</details>
