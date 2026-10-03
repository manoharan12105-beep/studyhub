# Binary Search Tree — Practice

### P1. Floor and ceiling in a BST

**Difficulty:** Easy · **Pattern:** Single path with a candidate

Return the **floor** (largest key ≤ x) and **ceiling** (smallest key ≥ x) of x in a BST, or `null` if none.

**Constraints:** 1 ≤ n ≤ 10⁴; keys distinct.

Example: keys {8, 4, 12, 2, 6, 10, 14}, x = 5 → floor 4, ceiling 6; x = 12 → floor 12, ceiling 12.

<details>
<summary>Hint</summary>

Walk down from the root. A node ≤ x is a floor candidate (try to find a bigger one on the right).

</details>

<details>
<summary>Answer</summary>

```java
public class FloorCeil {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static Integer floor(TreeNode node, int x) {
        Integer best = null;
        while (node != null) {
            if (node.val == x) return x;
            if (node.val < x) { best = node.val; node = node.right; }
            else node = node.left;
        }
        return best;
    }

    static Integer ceiling(TreeNode node, int x) {
        Integer best = null;
        while (node != null) {
            if (node.val == x) return x;
            if (node.val > x) { best = node.val; node = node.left; }
            else node = node.right;
        }
        return best;
    }

    static TreeNode insert(TreeNode n, int k) {
        if (n == null) return new TreeNode(k);
        if (k < n.val) n.left = insert(n.left, k); else n.right = insert(n.right, k);
        return n;
    }

    public static void main(String[] args) {
        TreeNode root = null;
        for (int k : new int[] {8, 4, 12, 2, 6, 10, 14}) root = insert(root, k);
        System.out.println(floor(root, 5) + " " + ceiling(root, 5));
        System.out.println(floor(root, 12) + " " + ceiling(root, 12));
        System.out.println(floor(root, 1) + " " + ceiling(root, 15));
    }
}
```

**Output:**

```text
4 6
12 12
null null
```

**Complexity:** O(h) time, O(1) space.

</details>

### P2. Range sum of a BST

**Difficulty:** Easy · **Pattern:** Prune with the BST property

Return the sum of all keys in the inclusive range [low, high].

**Constraints:** 1 ≤ n ≤ 2 × 10⁴.

Example: keys {10, 5, 15, 3, 7, 18}, range [7, 15] → 7 + 10 + 15 = `32`.

<details>
<summary>Hint</summary>

If a node's key is below `low`, its whole left subtree is too — skip it.

</details>

<details>
<summary>Answer</summary>

```java
public class RangeSumBst {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static int rangeSum(TreeNode node, int low, int high) {
        if (node == null) return 0;
        if (node.val < low) return rangeSum(node.right, low, high);   // left side all too small
        if (node.val > high) return rangeSum(node.left, low, high);   // right side all too large
        return node.val + rangeSum(node.left, low, high) + rangeSum(node.right, low, high);
    }

    static TreeNode insert(TreeNode n, int k) {
        if (n == null) return new TreeNode(k);
        if (k < n.val) n.left = insert(n.left, k); else n.right = insert(n.right, k);
        return n;
    }

    public static void main(String[] args) {
        TreeNode root = null;
        for (int k : new int[] {10, 5, 15, 3, 7, 18}) root = insert(root, k);
        System.out.println(rangeSum(root, 7, 15));
    }
}
```

**Output:**

```text
32
```

**Complexity:** O(h + m) where m is the number of nodes visited inside the range; O(n) worst case. O(h) space.

</details>

### P3. K-th smallest element

**Difficulty:** Medium · **Pattern:** Inorder with early exit

Return the k-th smallest key (1-indexed).

**Constraints:** 1 ≤ k ≤ n ≤ 10⁴.

Example: keys {5, 3, 6, 2, 4, 1}, k = 3 → `3`.

<details>
<summary>Hint</summary>

Inorder visits keys in ascending order. Stop after k visits — an iterative inorder makes stopping easy.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class KthSmallestBst {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static int kthSmallest(TreeNode root, int k) {
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode node = root;
        while (true) {
            while (node != null) {
                stack.push(node);
                node = node.left;
            }
            node = stack.pop();
            if (--k == 0) return node.val;          // k-th visit in sorted order
            node = node.right;
        }
    }

    static TreeNode insert(TreeNode n, int k) {
        if (n == null) return new TreeNode(k);
        if (k < n.val) n.left = insert(n.left, k); else n.right = insert(n.right, k);
        return n;
    }

    public static void main(String[] args) {
        TreeNode root = null;
        for (int k : new int[] {5, 3, 6, 2, 4, 1}) root = insert(root, k);
        System.out.println(kthSmallest(root, 3) + " " + kthSmallest(root, 1) + " " + kthSmallest(root, 6));
    }
}
```

**Output:**

```text
3 1 6
```

**Complexity:** O(h + k) time, O(h) space. Follow-up: if the tree is modified often and queried often, store subtree sizes in each node to answer in O(h).

</details>

### P4. BST iterator

**Difficulty:** Medium · **Pattern:** Controlled iterative inorder

Implement an iterator over a BST with `next()` (next smallest key) and `hasNext()`, using O(h) memory, with O(1) amortized time per call.

**Constraints:** up to 10⁵ calls; `next` is only called when `hasNext` is true.

<details>
<summary>Hint</summary>

Keep the stack of the iterative inorder traversal between calls.

</details>

<details>
<summary>Answer</summary>

**Approach:** The stack always holds the path of "left spine" nodes not yet returned. `next` pops one and pushes the left spine of its right subtree. Every node is pushed and popped once over the whole iteration, so n calls cost O(n) — O(1) amortized.

```java
import java.util.*;

public class BstIterator {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    private final Deque<TreeNode> stack = new ArrayDeque<>();

    BstIterator(TreeNode root) {
        pushLeftSpine(root);
    }

    private void pushLeftSpine(TreeNode node) {
        while (node != null) {
            stack.push(node);
            node = node.left;
        }
    }

    boolean hasNext() {
        return !stack.isEmpty();
    }

    int next() {
        TreeNode node = stack.pop();
        pushLeftSpine(node.right);
        return node.val;
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(7);
        root.left = new TreeNode(3);
        root.right = new TreeNode(15);
        root.right.left = new TreeNode(9);
        root.right.right = new TreeNode(20);
        BstIterator it = new BstIterator(root);
        StringBuilder sb = new StringBuilder();
        while (it.hasNext()) sb.append(it.next()).append(' ');
        System.out.println(sb.toString().trim());
    }
}
```

**Output:**

```text
3 7 9 15 20
```

**Complexity:** O(1) amortized per call, O(h) memory.

</details>

### P5. Recover a BST with two swapped keys

**Difficulty:** Hard · **Pattern:** Find inversions in inorder

Exactly two nodes of a BST had their keys swapped by mistake. Fix the tree without changing its structure.

**Constraints:** 2 ≤ n ≤ 1000.

Example: inorder `[1, 3, 2, 4]` → swap back 3 and 2.

<details>
<summary>Hint</summary>

The inorder sequence is sorted except for one or two places where `prev > current`. The first wrong node is the `prev` of the first such pair; the second is the `current` of the last pair.

</details>

<details>
<summary>Answer</summary>

**Approach:** Swapping two adjacent values in a sorted list creates one inversion; swapping non-adjacent values creates two. Track `prev` during inorder; at each inversion, record `first` (only the first time) and update `second`. Then swap their values.

```java
import java.util.*;

public class RecoverBst {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    private TreeNode first, second, prev;

    void recover(TreeNode root) {
        inorder(root);
        int temp = first.val;
        first.val = second.val;
        second.val = temp;
    }

    private void inorder(TreeNode node) {
        if (node == null) return;
        inorder(node.left);
        if (prev != null && prev.val > node.val) {
            if (first == null) first = prev;       // first inversion: the larger value is misplaced
            second = node;                          // last inversion: the smaller value is misplaced
        }
        prev = node;
        inorder(node.right);
    }

    static void collect(TreeNode n, List<Integer> out) {
        if (n == null) return;
        collect(n.left, out);
        out.add(n.val);
        collect(n.right, out);
    }

    public static void main(String[] args) {
        // Correct BST 1..7 with 2 and 6 swapped (non-adjacent in inorder).
        TreeNode root = new TreeNode(4);
        root.left = new TreeNode(6);
        root.right = new TreeNode(2);
        root.left.left = new TreeNode(1);
        root.left.right = new TreeNode(3);
        root.right.left = new TreeNode(5);
        root.right.right = new TreeNode(7);
        List<Integer> before = new ArrayList<>(), after = new ArrayList<>();
        collect(root, before);
        new RecoverBst().recover(root);
        collect(root, after);
        System.out.println(before + " -> " + after);
    }
}
```

**Output:**

```text
[1, 6, 3, 4, 5, 2, 7] -> [1, 2, 3, 4, 5, 6, 7]
```

**Complexity:** O(n) time, O(h) space (Morris traversal reduces this to O(1)).

</details>
