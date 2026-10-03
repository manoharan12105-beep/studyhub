# Binary Tree Problems

## Definition

The classic binary-tree interview problems built on traversals: **views** (left, right, top, bottom), **boundary traversal**, **diameter**, **maximum path sum**, **lowest common ancestor (LCA)**, **symmetry** and **mirroring**. Each is a traversal (DFS or BFS) plus a small amount of state carried down or returned up.

## Why It Matters

These problems test whether you can decide *what each recursive call should return* — the core skill for all tree questions. Diameter and maximum path sum, in particular, show the "return one thing, record another" technique that reappears in [Tree DP](../../algorithms/tree-dp/content.md).

## Prerequisites

- [Binary Tree](../binary-tree/content.md)
- [Tree Traversals](../tree-traversals/content.md)

## Intuition

Two information flows solve almost everything:

| Flow | How | Examples |
|------|-----|----------|
| **Top-down** (preorder) | pass parameters to children: depth, column, path so far | views, path sums |
| **Bottom-up** (postorder) | return values from children and combine | height, diameter, max path sum, LCA, symmetry |

When the answer can pass **through** a node (using both children) but a parent can only extend a path through **one** child, return the one-sided value and update a global best with the two-sided value.

## How It Works

### Left and right views

The **left view** is the first node of each level seen from the left; the **right view** the last node of each level. Level order: record the first (left view) or last (right view) node of each level. DFS alternative: preorder visiting left before right, record a node when its depth equals the result size (first time that depth is reached).

### Top and bottom views

Give the root column 0, a left child column − 1, a right child column + 1. Traverse with **BFS** (so higher nodes come first):

- **Top view:** the first node seen in each column.
- **Bottom view:** the last node seen in each column (when two nodes share a column and depth, the one later in level order wins).

Use a `TreeMap<column, value>` so columns come out sorted, or track min/max column.

### Boundary traversal (anticlockwise)

1. The root.
2. The **left boundary** top-down: follow left children (right child if there is no left), excluding leaves.
3. All **leaves** left to right.
4. The **right boundary** bottom-up: follow right children (left if no right), excluding leaves, then reverse.

### Diameter

The **diameter** is the number of edges on the longest path between any two nodes; it may not pass through the root. At each node, the longest path through it = height(left) + height(right) (counting nodes on each side, i.e. edges from this node). Compute heights in postorder and keep a global maximum: O(n).

### Maximum path sum

A path can start and end anywhere but cannot branch. At each node:

- `gain(node)` = node.val + max(0, gain(left), gain(right)) — the best downward path **starting** at node, which is what the parent can use. Negative branches are dropped (max with 0).
- Best path **through** node = node.val + max(0, gain(left)) + max(0, gain(right)) — update the global answer.

### Lowest common ancestor (any binary tree)

The **LCA** of p and q is the deepest node that has both as descendants (a node is its own descendant).

1. If the node is `null`, p or q → return it.
2. Recurse left and right.
3. If both sides return non-null, this node is the LCA. Otherwise return whichever side is non-null.

For a BST there is a faster O(h) method — see [Binary Search Tree](../binary-search-tree/content.md).

### Symmetric tree

A tree is symmetric if its left subtree is a mirror of its right subtree. Compare pairs: `mirror(a, b)` = both null, or equal values with `mirror(a.left, b.right)` and `mirror(a.right, b.left)`.

### Mirror (invert) a tree

Swap the left and right children of every node — any traversal order works.

## Visual Explanation

```text
                1                      columns:  -2  -1   0   1   2
              /   \                               4   2   1   3   7     ← top view
             2     3                                  8   6   9         ← bottom view (4 and 7 too)
            / \   / \
           4   5 6   7          left view:  1 2 4 8      right view: 1 3 7 9
              / \
             8   9              boundary: 1 2 | 4 8 9 6 7 | 3
                                diameter: 8-5-2-1-3-7 (5 edges)
```

## Pseudocode

```pseudocode
best ← -∞
gain(node):
    if node = null: return 0
    left  ← max(0, gain(node.left))
    right ← max(0, gain(node.right))
    best  ← max(best, node.val + left + right)    // path bending at node
    return node.val + max(left, right)            // path a parent can extend

lca(node, p, q):
    if node = null or node = p or node = q: return node
    l ← lca(node.left, p, q); r ← lca(node.right, p, q)
    if l ≠ null and r ≠ null: return node
    return l ≠ null ? l : r
```

## Java Implementation

```java
import java.util.*;

public class TreeProblems {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static List<Integer> rightView(TreeNode root) {
        List<Integer> view = new ArrayList<>();
        collectRight(root, 0, view);
        return view;
    }

    private static void collectRight(TreeNode n, int depth, List<Integer> view) {
        if (n == null) return;
        if (depth == view.size()) view.add(n.val);        // first node seen at this depth
        collectRight(n.right, depth + 1, view);            // right first → rightmost wins
        collectRight(n.left, depth + 1, view);
    }

    static List<Integer> leftView(TreeNode root) {
        List<Integer> view = new ArrayList<>();
        Queue<TreeNode> q = new ArrayDeque<>(List.of(root));
        while (!q.isEmpty()) {
            int size = q.size();
            for (int i = 0; i < size; i++) {
                TreeNode n = q.poll();
                if (i == 0) view.add(n.val);               // first node of the level
                if (n.left != null) q.offer(n.left);
                if (n.right != null) q.offer(n.right);
            }
        }
        return view;
    }

    record Cell(TreeNode node, int column) { }

    // top = true → first node per column; false → last node per column (bottom view)
    static Collection<Integer> verticalView(TreeNode root, boolean top) {
        TreeMap<Integer, Integer> byColumn = new TreeMap<>();
        Queue<Cell> q = new ArrayDeque<>(List.of(new Cell(root, 0)));
        while (!q.isEmpty()) {
            Cell c = q.poll();
            if (!top || !byColumn.containsKey(c.column())) byColumn.put(c.column(), c.node().val);
            if (c.node().left != null) q.offer(new Cell(c.node().left, c.column() - 1));
            if (c.node().right != null) q.offer(new Cell(c.node().right, c.column() + 1));
        }
        return byColumn.values();
    }

    static List<Integer> boundary(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        if (root == null) return out;
        if (!isLeaf(root)) out.add(root.val);
        for (TreeNode n = root.left; n != null; n = (n.left != null) ? n.left : n.right) {
            if (!isLeaf(n)) out.add(n.val);                 // left boundary, top-down
        }
        addLeaves(root, out);
        Deque<Integer> right = new ArrayDeque<>();
        for (TreeNode n = root.right; n != null; n = (n.right != null) ? n.right : n.left) {
            if (!isLeaf(n)) right.push(n.val);              // right boundary, reversed by the stack
        }
        out.addAll(right);
        return out;
    }

    private static boolean isLeaf(TreeNode n) { return n.left == null && n.right == null; }

    private static void addLeaves(TreeNode n, List<Integer> out) {
        if (n == null) return;
        if (isLeaf(n)) { out.add(n.val); return; }
        addLeaves(n.left, out);
        addLeaves(n.right, out);
    }

    private static int diameter;

    static int diameter(TreeNode root) {
        diameter = 0;
        depth(root);
        return diameter;
    }

    // Returns the number of nodes on the longest downward path; records the best edges-through-node.
    private static int depth(TreeNode n) {
        if (n == null) return 0;
        int l = depth(n.left), r = depth(n.right);
        diameter = Math.max(diameter, l + r);               // edges on the path bending at n
        return 1 + Math.max(l, r);
    }

    private static int bestSum;

    static int maxPathSum(TreeNode root) {
        bestSum = Integer.MIN_VALUE;
        gain(root);
        return bestSum;
    }

    private static int gain(TreeNode n) {
        if (n == null) return 0;
        int l = Math.max(0, gain(n.left));                  // drop negative branches
        int r = Math.max(0, gain(n.right));
        bestSum = Math.max(bestSum, n.val + l + r);
        return n.val + Math.max(l, r);
    }

    static TreeNode lca(TreeNode n, TreeNode p, TreeNode q) {
        if (n == null || n == p || n == q) return n;
        TreeNode l = lca(n.left, p, q), r = lca(n.right, p, q);
        if (l != null && r != null) return n;               // p and q on different sides
        return (l != null) ? l : r;
    }

    static boolean isSymmetric(TreeNode root) {
        return root == null || mirrorEqual(root.left, root.right);
    }

    private static boolean mirrorEqual(TreeNode a, TreeNode b) {
        if (a == null || b == null) return a == b;
        return a.val == b.val && mirrorEqual(a.left, b.right) && mirrorEqual(a.right, b.left);
    }

    static TreeNode mirror(TreeNode n) {
        if (n == null) return null;
        TreeNode oldLeft = n.left;
        n.left = mirror(n.right);
        n.right = mirror(oldLeft);
        return n;
    }

    static void preorder(TreeNode n, List<Integer> out) {
        if (n == null) return;
        out.add(n.val);
        preorder(n.left, out);
        preorder(n.right, out);
    }

    static TreeNode[] nodes(int count) {
        TreeNode[] t = new TreeNode[count + 1];
        for (int i = 1; i <= count; i++) t[i] = new TreeNode(i);
        return t;
    }

    public static void main(String[] args) {
        TreeNode[] t = nodes(9);
        t[1].left = t[2]; t[1].right = t[3];
        t[2].left = t[4]; t[2].right = t[5];
        t[3].left = t[6]; t[3].right = t[7];
        t[5].left = t[8]; t[5].right = t[9];
        TreeNode root = t[1];

        System.out.println("left view   " + leftView(root));
        System.out.println("right view  " + rightView(root));
        System.out.println("top view    " + verticalView(root, true));
        System.out.println("bottom view " + verticalView(root, false));
        System.out.println("boundary    " + boundary(root));
        System.out.println("diameter    " + diameter(root));
        System.out.println("max path    " + maxPathSum(root));
        System.out.println("lca(8,4)=" + lca(root, t[8], t[4]).val + " lca(8,7)=" + lca(root, t[8], t[7]).val + " lca(5,9)=" + lca(root, t[5], t[9]).val);

        TreeNode neg = new TreeNode(-10);
        neg.left = new TreeNode(9);
        neg.right = new TreeNode(20);
        neg.right.left = new TreeNode(15);
        neg.right.right = new TreeNode(7);
        System.out.println("max path (with negatives) " + maxPathSum(neg));

        TreeNode sym = new TreeNode(1);
        sym.left = new TreeNode(2);
        sym.right = new TreeNode(2);
        sym.left.left = new TreeNode(3);
        sym.right.right = new TreeNode(3);
        System.out.println("symmetric " + isSymmetric(sym) + " " + isSymmetric(root));

        List<Integer> pre = new ArrayList<>();
        preorder(mirror(root), pre);
        System.out.println("mirror preorder " + pre);
    }
}
```

**Output:**

```text
left view   [1, 2, 4, 8]
right view  [1, 3, 7, 9]
top view    [4, 2, 1, 3, 7]
bottom view [4, 8, 6, 9, 7]
boundary    [1, 2, 4, 8, 9, 6, 7, 3]
diameter    5
max path    27
lca(8,4)=2 lca(8,7)=1 lca(5,9)=5
max path (with negatives) 42
symmetric true false
mirror preorder [1, 3, 7, 6, 2, 5, 9, 8, 4]
```

## Dry Run

`maxPathSum` on `[-10, 9, 20, null, null, 15, 7]`:

| Node (postorder) | gain(left) | gain(right) | Path through node | best | Returns |
|------------------|-----------|-------------|-------------------|------|---------|
| 9 | 0 | 0 | 9 | 9 | 9 |
| 15 | 0 | 0 | 15 | 15 | 15 |
| 7 | 0 | 0 | 7 | 15 | 7 |
| 20 | 15 | 7 | 20 + 15 + 7 = 42 | 42 | 20 + 15 = 35 |
| −10 | 9 | 35 | −10 + 9 + 35 = 34 | 42 | −10 + 35 = 25 |

The answer 42 bends at node 20 and never reaches the root — which is why the global `best` is needed.

## Complexity Analysis

| Problem | Time | Space |
|---------|------|-------|
| Left/right view | O(n) | O(h) DFS or O(w) BFS |
| Top/bottom view (`TreeMap`) | O(n log c), c = number of columns | O(n) |
| Boundary | O(n) | O(h) |
| Diameter, max path sum | O(n) | O(h) |
| LCA (binary tree) | O(n) | O(h) |
| Symmetric, mirror | O(n) | O(h) |

## Variations

- **Vertical order traversal** — all nodes per column, not just one (sort ties by row, then value).
- **LCA with parent pointers** — walk up from p storing ancestors in a set, then walk up from q (or align depths).
- **Distance between two nodes** = depth(p) + depth(q) − 2 × depth(LCA).
- **Diameter of an n-ary tree / general tree** — keep the two largest child heights.

## Comparison

| Need | Use |
|------|-----|
| One node per level | level order (views) |
| One node per column | BFS + column numbers (top/bottom view) |
| Combine two subtrees into an answer | postorder with a global best (diameter, path sum) |
| Ancestor relationships | LCA recursion |

## Edge Cases

- Empty tree; single node (diameter 0, path sum = its value).
- All-negative values in max path sum — the answer is the largest single value, so `best` must start at `Integer.MIN_VALUE`, not 0.
- p is an ancestor of q in LCA — the recursion returns p as soon as it meets it.
- Skewed trees for boundary traversal (left boundary may be all of them).

## Advantages

- One recursive template covers all of these with O(n) time.

## Disadvantages

- Global/instance variables (`best`) must be reset between calls.
- Recursion depth equals the tree height — iterative versions needed for very deep trees.

## When to Use

- "View", "visible from" → level order or columns.
- "Longest path", "maximum path", "between any two nodes" → postorder returning one-sided values + global best.
- "Common ancestor", "distance between nodes" → LCA.

## Common Mistakes

- Counting nodes instead of edges for the diameter (off by one).
- Returning `node.val + left + right` from `gain` — a parent cannot use a path that already bends.
- Using DFS for top/bottom view without tracking depth (a deeper node can be visited before a higher one in the same column).
- In boundary traversal, adding leaves twice (as part of a boundary and as a leaf) or the root twice when it is a leaf.

## Key Takeaways

- Views: level order (left/right) or BFS with columns (top/bottom).
- Diameter and max path sum: postorder, return the best one-sided value, record the best two-sided value.
- LCA: return p/q when found; the node where both sides report back is the answer.
- Symmetric = left subtree mirrors right; mirror = swap children everywhere.
