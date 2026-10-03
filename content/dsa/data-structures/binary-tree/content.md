# Binary Tree

## Definition

A **tree** is a hierarchical structure of **nodes** connected by **edges**, with one **root** and no cycles: every node except the root has exactly one parent. A **binary tree** is a tree in which every node has **at most two children**, called the **left** and **right** child.

## Why It Matters

Trees represent hierarchy (file systems, HTML documents, organisation charts) and make searching fast when ordered ([Binary Search Tree](../binary-search-tree/content.md), [Heap](../heap/content.md), [Trie](../trie/content.md)). Tree questions are a staple of interviews because they test recursion: almost every tree algorithm is "solve for the left subtree, solve for the right subtree, combine".

## Core Concept

### Terminology

| Term | Meaning |
|------|---------|
| Root | the top node; has no parent |
| Parent / child | a node directly above / below another |
| Siblings | nodes with the same parent |
| Leaf | a node with no children |
| Internal node | a node with at least one child |
| Edge | the link between a parent and a child; a tree with n nodes has n − 1 edges |
| Subtree | a node together with all its descendants |
| Ancestor / descendant | any node on the path up to the root / down from the node |
| Degree (of a node) | number of children (0, 1 or 2 in a binary tree) |
| **Depth** of a node | number of edges from the **root** down to the node (root depth = 0) |
| **Height** of a node | number of edges on the longest path from the node down to a **leaf** (leaf height = 0) |
| Height of the tree | height of the root |
| Level | all nodes with the same depth (level 0 = root) |

> [!WARNING]
> Some sources count heights in **nodes** instead of edges (a single node has height 1, an empty tree 0). Both conventions are common — state which one you use. This section uses edges and treats an empty tree's height as −1, but code examples that return "max depth" count nodes, as most interview problems do.

### The recursive view

A binary tree is either **empty** (`null`) or a node with a value, a left binary tree and a right binary tree. This definition is why recursive code fits so naturally:

```java
static int size(TreeNode node) {
    if (node == null) {
        return 0;                                    // empty tree
    }
    return 1 + size(node.left) + size(node.right);   // me + left subtree + right subtree
}
```

### Key properties

| Property | Value |
|----------|-------|
| Maximum nodes at level i | 2ⁱ |
| Maximum nodes in a tree of height h | 2ʰ⁺¹ − 1 |
| Minimum height of a tree with n nodes | ⌊log₂ n⌋ |
| Maximum height with n nodes | n − 1 (a chain) |
| In a full binary tree | leaves = internal nodes + 1 |
| Null child links in any binary tree with n nodes | n + 1 |

The gap between ⌊log₂ n⌋ and n − 1 is the whole reason "balanced" matters: operations that walk one root-to-leaf path cost O(height).

## Visual Explanation

```text
              1            ← root, depth 0, level 0
            /   \
           2     3         ← depth 1
          / \     \
         4   5     6       ← depth 2; 4, 5, 6 are leaves
            /
           7               ← depth 3

height(tree) = 3 (path 1-2-5-7); height(3) = 1; depth(5) = 2
subtree rooted at 2 = {2, 4, 5, 7}
```

## Types

```text
Full             Complete          Perfect            Degenerate (skewed)
(0 or 2 kids)    (filled left      (all levels        (every node has
                  to right)         completely full)   one child)
    1                1                  1              1
   / \              / \               /   \             \
  2   3            2   3             2     3             2
     / \          / \               / \   / \             \
    4   5        4   5             4   5 6   7             3
```

| Type | Definition | Note |
|------|-----------|------|
| **Full** (proper, strict) | every node has 0 or 2 children | leaves = internal + 1 |
| **Complete** | every level full except possibly the last, which is filled **left to right** | can be stored in an array with no gaps — heaps use this |
| **Perfect** | all internal nodes have 2 children and all leaves are at the same depth | exactly 2ʰ⁺¹ − 1 nodes |
| **Balanced** (height-balanced) | for every node, the heights of the left and right subtrees differ by at most 1 | height is O(log n) — AVL trees enforce exactly this |
| **Degenerate** (skewed) | every internal node has one child | behaves like a linked list; height n − 1 |

Every perfect tree is full and complete; a complete tree is not necessarily full, and a full tree is not necessarily complete.

## Operations

### Representation 1: linked nodes

```java
class TreeNode {
    int val;
    TreeNode left, right;

    TreeNode(int val) {
        this.val = val;
    }
}
```

Flexible for any shape; each node costs two references.

### Representation 2: array (for complete trees)

Store nodes level by level in an array. For the node at index i (0-based):

```text
left child  = 2i + 1
right child = 2i + 2
parent      = (i − 1) / 2   (integer division)
```

```text
tree:        10                 array: index  0   1   2   3   4   5
            /  \                              10  20  30  40  50  60
          20    30
         / \    /
        40  50 60
```

No pointers are stored, and the parent is computed — this is how binary heaps are stored. For a sparse, skewed tree the array would be mostly empty (a chain of height h needs 2ʰ⁺¹ − 1 slots), so linked nodes are used instead.

### Height

Height = 1 + max(height of left, height of right), with an empty tree at −1 (edges) or 0 (nodes).

```java
static int height(TreeNode node) {          // in edges; empty tree = -1
    if (node == null) {
        return -1;
    }
    return 1 + Math.max(height(node.left), height(node.right));
}
```

**Time:** O(n) · **Space:** O(h) recursion

### Checking balance in O(n)

Calling `height` at every node is O(n²) on a skewed tree. Instead compute heights bottom-up and return a sentinel (−2 here, never a real height) as soon as any subtree is unbalanced.

```java
// Returns the height in edges, or -2 if the subtree is not balanced.
static int checkedHeight(TreeNode node) {
    if (node == null) return -1;
    int left = checkedHeight(node.left);
    if (left == -2) return -2;
    int right = checkedHeight(node.right);
    if (right == -2) return -2;
    if (Math.abs(left - right) > 1) return -2;
    return 1 + Math.max(left, right);
}
```

**Time:** O(n) · **Space:** O(h)

### Checking completeness

Do a level-order traversal including `null` children. In a complete tree, once a `null` appears, no real node may follow.

## Full Java Implementation

Builds a tree from a level-order array (with `null` for missing nodes) and computes its main properties:

```java
import java.util.*;

public class BinaryTreeBasics {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    // Level-order array → tree; null entries are missing nodes (the format used by most problem statements).
    static TreeNode build(Integer... values) {
        if (values.length == 0 || values[0] == null) return null;
        TreeNode root = new TreeNode(values[0]);
        Queue<TreeNode> queue = new ArrayDeque<>(List.of(root));
        int i = 1;
        while (i < values.length) {
            TreeNode parent = queue.poll();
            if (values[i] != null) {
                parent.left = new TreeNode(values[i]);
                queue.offer(parent.left);
            }
            i++;
            if (i < values.length && values[i] != null) {
                parent.right = new TreeNode(values[i]);
                queue.offer(parent.right);
            }
            i++;
        }
        return root;
    }

    static int size(TreeNode n) { return n == null ? 0 : 1 + size(n.left) + size(n.right); }

    static int height(TreeNode n) { return n == null ? -1 : 1 + Math.max(height(n.left), height(n.right)); }

    static int leaves(TreeNode n) {
        if (n == null) return 0;
        if (n.left == null && n.right == null) return 1;
        return leaves(n.left) + leaves(n.right);
    }

    static boolean isFull(TreeNode n) {
        if (n == null) return true;
        if ((n.left == null) != (n.right == null)) return false;   // exactly one child
        return isFull(n.left) && isFull(n.right);
    }

    static int checkedHeight(TreeNode n) {
        if (n == null) return -1;
        int l = checkedHeight(n.left);
        if (l == -2) return -2;
        int r = checkedHeight(n.right);
        if (r == -2 || Math.abs(l - r) > 1) return -2;
        return 1 + Math.max(l, r);
    }

    static boolean isComplete(TreeNode root) {
        Queue<TreeNode> queue = new LinkedList<>();     // LinkedList allows null elements
        queue.offer(root);
        boolean seenNull = false;
        while (!queue.isEmpty()) {
            TreeNode node = queue.poll();
            if (node == null) {
                seenNull = true;
            } else {
                if (seenNull) return false;             // a real node after a gap
                queue.offer(node.left);
                queue.offer(node.right);
            }
        }
        return true;
    }

    static void describe(String name, TreeNode root) {
        System.out.println(name + ": size=" + size(root) + " height=" + height(root) + " leaves=" + leaves(root)
                + " full=" + isFull(root) + " complete=" + isComplete(root) + " balanced=" + (checkedHeight(root) != -2));
    }

    public static void main(String[] args) {
        describe("perfect ", build(1, 2, 3, 4, 5, 6, 7));
        describe("complete", build(1, 2, 3, 4, 5, 6));
        describe("example ", build(1, 2, 3, 4, 5, null, 6, null, null, 7));
        describe("skewed  ", build(1, null, 2, null, 3));
    }
}
```

**Output:**

```text
perfect : size=7 height=2 leaves=4 full=true complete=true balanced=true
complete: size=6 height=2 leaves=3 full=false complete=true balanced=true
example : size=7 height=3 leaves=3 full=false complete=false balanced=true
skewed  : size=3 height=2 leaves=1 full=false complete=false balanced=false
```

## Dry Run

`checkedHeight` on the skewed tree 1 → 2 → 3 (each a right child):

| Call | left | right | |left − right| | Returns |
|------|------|-------|---------------|---------|
| node 3 | −1 (null) | −1 (null) | 0 | 0 |
| node 2 | −1 (null) | 0 (node 3) | 1 | 1 |
| node 1 | −1 (null) | 1 (node 2) | 2 > 1 | −2 → not balanced |

## Complexity Summary

| Operation | Time | Space |
|-----------|------|-------|
| Size, height, leaves, full check | O(n) | O(h) recursion |
| Balanced check (bottom-up) | O(n) | O(h) |
| Balanced check (height at every node) | O(n²) worst | O(h) |
| Complete check (BFS) | O(n) | O(w) queue width |
| Parent/child in array representation | O(1) | — |

h ranges from log₂ n (balanced) to n − 1 (skewed); w (width) can reach about n/2.

## Advantages

- Natural model for hierarchy and recursive decomposition.
- With ordering (BST) or shape (heap) constraints, gives O(log n) operations.

## Disadvantages

- No ordering by itself — finding a value in a plain binary tree is O(n).
- Recursive code can overflow the stack on very deep (skewed) trees.

## Comparison

| | Array | Linked list | Binary tree (balanced, ordered) |
|---|-------|-------------|----------------------------------|
| Search | O(n) / O(log n) sorted | O(n) | O(log n) |
| Insert | O(n) | O(1) at a known spot | O(log n) |
| Hierarchical data | no | no | yes |

## Java Collections Equivalent

The JDK has no general binary-tree class. `TreeMap`/`TreeSet` are red-black trees (balanced BSTs) and `PriorityQueue` is an array-based binary heap. Interview problems use a hand-written `TreeNode`.

## Real-World Applications

- File systems and DOM trees (general trees, often stored as binary "first child / next sibling").
- Expression trees in compilers (operators inside, operands at leaves).
- Huffman coding trees for compression.
- Decision trees in machine learning.

## Common Mistakes

- Mixing up height and depth, or edge-count vs node-count heights.
- Forgetting the `null` base case → `NullPointerException`.
- Calling `height` inside a recursive check, making it O(n²).
- Assuming a binary tree is a BST (no ordering is implied).
- Treating "complete" and "full" as the same thing.

## Key Takeaways

- Binary tree: each node has ≤ 2 children; n nodes → n − 1 edges, n + 1 null links.
- Depth counts from the root; height counts down to the deepest leaf.
- Full (0 or 2 children), complete (filled left to right), perfect (all full), balanced (heights differ ≤ 1), degenerate (chain).
- Complete trees fit in arrays: children 2i + 1, 2i + 2; parent (i − 1)/2.
- Most tree algorithms: base case at `null`, recurse left and right, combine — O(n) time, O(h) space.
