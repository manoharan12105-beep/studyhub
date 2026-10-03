# Binary Search Tree

## Definition

A **binary search tree (BST)** is a binary tree where, for every node, all keys in its **left** subtree are **smaller** than the node's key and all keys in its **right** subtree are **larger**. This ordering lets search, insert and delete follow a single root-to-leaf path, so each takes **O(h)** time, where h is the tree's height.

## Why It Matters

A BST keeps data sorted while still allowing fast insertions and deletions — something neither a sorted array (O(n) insert) nor a hash table (no order) offers. It answers ordered questions: minimum, maximum, predecessor, successor, floor, ceiling, range queries, k-th smallest. Java's `TreeMap` and `TreeSet` are balanced BSTs. Interviews use BSTs to test recursion, invariants and the difference between average and worst case.

## Core Concept

### The BST property

For every node `x`: `left subtree keys < x.key < right subtree keys`. The property applies to **entire subtrees**, not just direct children — a common source of wrong validation code.

### Consequence 1: search is a single path

Comparing with the root tells you which half the key must be in, like binary search on a sorted array. Each step goes one level down, so the cost is the height.

### Consequence 2: inorder traversal is sorted

Inorder visits left subtree, node, right subtree — exactly ascending order. Many BST problems reduce to "do an inorder traversal and …".

### Height decides everything

| Shape | Height h | Search / insert / delete |
|-------|----------|--------------------------|
| Balanced (random inserts on average, or self-balancing) | O(log n) | O(log n) |
| Degenerate (sorted inserts: 1, 2, 3, …) | n − 1 | O(n) |

Inserting already-sorted data into a plain BST produces a linked list. **Self-balancing** BSTs (AVL, red-black) restructure the tree with **rotations** after updates to guarantee O(log n) height.

Duplicates: this lesson assumes distinct keys. Common choices for duplicates are a count field per node, or a consistent rule such as "equal keys go right".

## Visual Explanation

```text
              50
            /    \
          30      70
         /  \    /  \
       20   40  60   80
                  \
                   65

inorder: 20 30 40 50 60 65 70 80   (sorted)

search(65): 50 → right (65 > 50) → 70 → left (65 < 70) → 60 → right (65 > 60) → 65 ✓
```

## Types

| Variant | Guarantee | Notes |
|---------|-----------|-------|
| Plain BST | none — O(n) worst case | simplest; fine for random data |
| **AVL tree** | heights of children differ by ≤ 1 at every node → h ≤ ~1.44 log₂ n | stricter balance, faster lookups, more rotations on update |
| **Red-black tree** | no path is more than twice as long as another → h ≤ 2 log₂(n + 1) | fewer rotations; used by Java `TreeMap`/`TreeSet` and `HashMap` tree bins |
| B-tree / B+ tree | many keys per node, all leaves at the same depth | databases and file systems (disk-friendly) |

## Operations

### Search

1. Start at the root.
2. If the node is `null`, the key is absent. If equal, found.
3. Go left if the key is smaller, right if larger.

```java
static TreeNode search(TreeNode node, int key) {
    while (node != null && node.val != key) {
        node = (key < node.val) ? node.left : node.right;
    }
    return node;
}
```

**Time:** O(h) · **Space:** O(1) iterative

### Insert

Search for the key; the `null` position where the search ends is where the new node belongs.

```java
static TreeNode insert(TreeNode node, int key) {
    if (node == null) return new TreeNode(key);
    if (key < node.val) node.left = insert(node.left, key);
    else if (key > node.val) node.right = insert(node.right, key);
    return node;                                  // duplicates ignored
}
```

**Time:** O(h) · **Space:** O(h) recursion

### Minimum and maximum

The minimum is the leftmost node; the maximum is the rightmost.

```java
static TreeNode min(TreeNode node) {
    while (node.left != null) node = node.left;
    return node;
}
```

**Time:** O(h)

### Delete

Find the node, then three cases:

1. **Leaf** — remove it (return `null` to the parent).
2. **One child** — replace the node with its child.
3. **Two children** — copy the **inorder successor** (minimum of the right subtree) into the node, then delete that successor from the right subtree. The successor has no left child, so its deletion is case 1 or 2. (Using the inorder predecessor works symmetrically.)

```java
static TreeNode delete(TreeNode node, int key) {
    if (node == null) return null;
    if (key < node.val) {
        node.left = delete(node.left, key);
    } else if (key > node.val) {
        node.right = delete(node.right, key);
    } else {
        if (node.left == null) return node.right;      // cases 1 and 2
        if (node.right == null) return node.left;
        TreeNode successor = node.right;               // case 3: leftmost of right subtree
        while (successor.left != null) successor = successor.left;
        node.val = successor.val;
        node.right = delete(node.right, successor.val);
    }
    return node;
}
```

**Time:** O(h) · **Space:** O(h)

### Predecessor and successor

The **inorder successor** of x is the smallest key greater than x.

- If x has a right subtree: the minimum of that subtree.
- Otherwise: the lowest ancestor for which x is in the **left** subtree. Without parent pointers, find it by searching from the root and remembering the last node where you went left.

```java
static TreeNode successor(TreeNode root, int key) {
    TreeNode candidate = null;
    while (root != null) {
        if (key < root.val) {
            candidate = root;             // root is larger; maybe the answer
            root = root.left;
        } else {
            root = root.right;            // root is not larger; look right
        }
    }
    return candidate;
}
```

The predecessor is symmetric (largest key smaller than x). Floor and ceiling use the same walk with `<=`/`>=`.

**Time:** O(h)

### Validate a BST

Checking only `left.val < node.val < right.val` at each node is **wrong**: it accepts a node deep in the left subtree that is larger than an ancestor. Pass down the allowed range (low, high) instead — or check that the inorder traversal is strictly increasing.

```java
static boolean isValid(TreeNode node, long low, long high) {
    if (node == null) return true;
    if (node.val <= low || node.val >= high) return false;
    return isValid(node.left, low, node.val) && isValid(node.right, node.val, high);
}
// call: isValid(root, Long.MIN_VALUE, Long.MAX_VALUE) — long bounds so Integer.MIN/MAX values are allowed
```

**Time:** O(n) · **Space:** O(h)

### Lowest common ancestor in a BST

Starting at the root: if both keys are smaller, go left; if both larger, go right; otherwise the current node is where the paths split — the LCA.

```java
static TreeNode lcaBst(TreeNode node, int p, int q) {
    while (node != null) {
        if (p < node.val && q < node.val) node = node.left;
        else if (p > node.val && q > node.val) node = node.right;
        else return node;
    }
    return null;
}
```

**Time:** O(h) — compared with O(n) for a general binary tree.

### Sorted array to balanced BST

Pick the **middle** element as the root, then build the left half and right half recursively. Each subtree gets half the elements, so the height is ⌊log₂ n⌋.

```java
static TreeNode fromSorted(int[] sorted, int lo, int hi) {
    if (lo > hi) return null;
    int mid = lo + (hi - lo) / 2;
    TreeNode root = new TreeNode(sorted[mid]);
    root.left = fromSorted(sorted, lo, mid - 1);
    root.right = fromSorted(sorted, mid + 1, hi);
    return root;
}
```

**Time:** O(n) · **Space:** O(log n) recursion

### Balanced BSTs (awareness)

A **rotation** changes the shape of a small part of the tree while keeping the BST order:

```text
right rotation at y:             left rotation at x:

      y                x              x                  y
     / \              / \            / \                / \
    x   C    ──►     A   y          A   y      ──►     x   C
   / \                  / \            / \            / \
  A   B                B   C          B   C          A   B
```

AVL and red-black trees apply rotations (and recolouring, for red-black) after inserts and deletes so the height stays O(log n). You are rarely asked to implement them in interviews; you are expected to know that `TreeMap` guarantees O(log n) and why a plain BST does not.

## Full Java Implementation

```java
import java.util.*;

public class BinarySearchTree {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    private TreeNode root;

    void insert(int key) { root = insert(root, key); }

    private static TreeNode insert(TreeNode node, int key) {
        if (node == null) return new TreeNode(key);
        if (key < node.val) node.left = insert(node.left, key);
        else if (key > node.val) node.right = insert(node.right, key);
        return node;
    }

    boolean contains(int key) {
        TreeNode node = root;
        while (node != null && node.val != key) {
            node = (key < node.val) ? node.left : node.right;
        }
        return node != null;
    }

    void delete(int key) { root = delete(root, key); }

    private static TreeNode delete(TreeNode node, int key) {
        if (node == null) return null;
        if (key < node.val) node.left = delete(node.left, key);
        else if (key > node.val) node.right = delete(node.right, key);
        else {
            if (node.left == null) return node.right;
            if (node.right == null) return node.left;
            TreeNode successor = node.right;
            while (successor.left != null) successor = successor.left;
            node.val = successor.val;
            node.right = delete(node.right, successor.val);
        }
        return node;
    }

    Integer successor(int key) {
        TreeNode node = root, candidate = null;
        while (node != null) {
            if (key < node.val) { candidate = node; node = node.left; }
            else node = node.right;
        }
        return candidate == null ? null : candidate.val;
    }

    Integer predecessor(int key) {
        TreeNode node = root, candidate = null;
        while (node != null) {
            if (key > node.val) { candidate = node; node = node.right; }
            else node = node.left;
        }
        return candidate == null ? null : candidate.val;
    }

    List<Integer> inorder() {
        List<Integer> out = new ArrayList<>();
        inorder(root, out);
        return out;
    }

    private static void inorder(TreeNode n, List<Integer> out) {
        if (n == null) return;
        inorder(n.left, out);
        out.add(n.val);
        inorder(n.right, out);
    }

    int height() { return height(root); }

    private static int height(TreeNode n) { return n == null ? -1 : 1 + Math.max(height(n.left), height(n.right)); }

    static boolean isValid(TreeNode n, long low, long high) {
        if (n == null) return true;
        if (n.val <= low || n.val >= high) return false;
        return isValid(n.left, low, n.val) && isValid(n.right, n.val, high);
    }

    public static void main(String[] args) {
        BinarySearchTree bst = new BinarySearchTree();
        for (int key : new int[] {50, 30, 70, 20, 40, 60, 80, 65}) bst.insert(key);
        System.out.println("inorder " + bst.inorder() + " height " + bst.height());
        System.out.println("contains 65? " + bst.contains(65) + ", 55? " + bst.contains(55));
        System.out.println("successor(40)=" + bst.successor(40) + " predecessor(60)=" + bst.predecessor(60) + " successor(80)=" + bst.successor(80));

        bst.delete(20);          // leaf
        bst.delete(60);          // one child (65)
        bst.delete(50);          // two children → replaced by successor 65
        System.out.println("after deletes " + bst.inorder() + " root=" + bst.root.val + " valid=" + isValid(bst.root, Long.MIN_VALUE, Long.MAX_VALUE));

        BinarySearchTree skewed = new BinarySearchTree();
        for (int key = 1; key <= 6; key++) skewed.insert(key);
        System.out.println("sorted inserts → height " + skewed.height() + " (a chain)");

        TreeNode bad = new TreeNode(10);
        bad.left = new TreeNode(5);
        bad.left.right = new TreeNode(12);   // 12 > 10 but sits in 10's left subtree
        System.out.println("child-only check would pass, range check says valid=" + isValid(bad, Long.MIN_VALUE, Long.MAX_VALUE));
    }
}
```

**Output:**

```text
inorder [20, 30, 40, 50, 60, 65, 70, 80] height 3
contains 65? true, 55? false
successor(40)=50 predecessor(60)=50 successor(80)=null
after deletes [30, 40, 65, 70, 80] root=65 valid=true
sorted inserts → height 5 (a chain)
child-only check would pass, range check says valid=false
```

## Dry Run

`delete(50)` when 50 has two children (after 20 and 60 were removed):

```text
before:        50                   after:        65
             /    \                             /    \
           30      70                         30      70
             \    /  \                          \       \
             40  65   80                        40       80
```

| Step | Action |
|------|--------|
| 1 | 50 found; it has two children |
| 2 | successor = min of right subtree: 70 → left 65 → no left → 65 |
| 3 | copy 65 into the root |
| 4 | delete 65 from the right subtree: 65 is a leaf → 70.left = null |

## Complexity Summary

| Operation | Best | Average (random BST) | Worst (degenerate) | Space |
|-----------|------|----------------------|--------------------|-------|
| Search | O(1) | O(log n) | O(n) | O(1) iterative |
| Insert | O(1) | O(log n) | O(n) | O(h) recursive |
| Delete | O(1) | O(log n) | O(n) | O(h) |
| Min / max / successor / predecessor | O(1) | O(log n) | O(n) | O(1) |
| Inorder traversal | O(n) | O(n) | O(n) | O(h) |
| Validate | O(n) | O(n) | O(n) | O(h) |
| Build from sorted array | O(n) | O(n) | O(n) | O(log n) |

Self-balancing trees (AVL, red-black, `TreeMap`) make every O(h) row O(log n) in the worst case.

## Advantages

- Sorted order maintained under insertions and deletions.
- Ordered queries (min, max, floor, ceiling, range, k-th) in O(h).
- Balanced variants guarantee O(log n) worst case.

## Disadvantages

- A plain BST degrades to O(n) on sorted or adversarial input.
- Slower than hashing for pure lookups; more memory per element than an array.

## Comparison

| | Plain BST | Balanced BST (`TreeMap`) | Hash table (`HashMap`) | Sorted array |
|---|-----------|--------------------------|------------------------|--------------|
| Search | O(log n) avg, O(n) worst | O(log n) | O(1) avg | O(log n) |
| Insert / delete | O(log n) avg, O(n) worst | O(log n) | O(1) avg | O(n) |
| Sorted iteration | O(n) | O(n) | O(n log n) (must sort) | O(n) |
| Floor / ceiling / range | O(h) | O(log n) | not supported | O(log n) |

## Java Collections Equivalent

`TreeMap<K, V>` and `TreeSet<E>` (red-black trees): `floorKey`, `ceilingKey`, `higherKey`, `lowerKey`, `firstKey`, `lastKey`, `headMap`, `tailMap`, `subMap`. See [Java Toolkit: HashMap, HashSet, LinkedHashMap, TreeMap and TreeSet](../../fundamentals/java-maps-and-sets/content.md).

## Real-World Applications

- Ordered maps and sets in standard libraries (`TreeMap`, C++ `std::map`).
- Database indexes (B-trees/B+ trees — wide balanced search trees).
- Event schedulers and interval/booking systems (nearest time slot).
- Leaderboards needing rank and neighbours.

## Common Mistakes

- Validating with parent–child comparisons only.
- Using `int` bounds in validation so a node with `Integer.MIN_VALUE` or `MAX_VALUE` is wrongly rejected.
- Forgetting to reattach the returned subtree (`node.left = insert(node.left, key)`).
- In two-child deletion, deleting the successor from the wrong subtree.
- Quoting O(log n) for a plain BST without "average" or "if balanced".

## Key Takeaways

- Left < node < right for whole subtrees; inorder is sorted.
- Search, insert, delete, min/max, successor: one path → O(h).
- h is O(log n) only if balanced; sorted inserts make a chain (O(n)).
- Delete with two children: replace with the inorder successor.
- Validate with ranges; BST LCA is where p and q split.
