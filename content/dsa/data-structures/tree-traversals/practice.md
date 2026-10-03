# Tree Traversals — Practice

### P1. Average of each level

**Difficulty:** Easy · **Pattern:** Level order

Return the average value of the nodes on each level.

**Constraints:** 1 ≤ n ≤ 10⁴; values fit in `int` (sums may not).

Example: `[3, 9, 20, null, null, 15, 7]` → `[3.0, 14.5, 11.0]`.

<details>
<summary>Hint</summary>

Level order with a fixed `size` per level; sum in a `long`.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class LevelAverages {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static List<Double> averages(TreeNode root) {
        List<Double> result = new ArrayList<>();
        Queue<TreeNode> queue = new ArrayDeque<>(List.of(root));
        while (!queue.isEmpty()) {
            int size = queue.size();
            long sum = 0;
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                sum += node.val;
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            result.add((double) sum / size);
        }
        return result;
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(3);
        root.left = new TreeNode(9);
        root.right = new TreeNode(20);
        root.right.left = new TreeNode(15);
        root.right.right = new TreeNode(7);
        System.out.println(averages(root));
    }
}
```

**Output:**

```text
[3.0, 14.5, 11.0]
```

**Complexity:** O(n) time, O(w) space.

</details>

### P2. Build a tree from preorder and inorder

**Difficulty:** Medium · **Pattern:** Divide by the root's inorder position

Given the preorder and inorder traversals of a tree with **distinct** values, rebuild the tree.

**Constraints:** 1 ≤ n ≤ 3000.

Example: preorder `[3, 9, 20, 15, 7]`, inorder `[9, 3, 15, 20, 7]` → tree `[3, 9, 20, null, null, 15, 7]`.

<details>
<summary>Hint</summary>

The first preorder value is the root. Its position in inorder splits the inorder array into the left and right subtrees, and tells you how many preorder values belong to the left subtree.

</details>

<details>
<summary>Answer</summary>

**Approach:** Searching for the root in inorder each time costs O(n) per node (O(n²) total on skewed trees). Store value → inorder index in a `HashMap` for O(1) lookups. Consume preorder from left to right with a shared index, building the left subtree before the right.

```java
import java.util.*;

public class BuildFromPreIn {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    private int preIndex = 0;
    private int[] preorder;
    private final Map<Integer, Integer> inorderIndex = new HashMap<>();

    TreeNode build(int[] preorder, int[] inorder) {
        this.preorder = preorder;
        for (int i = 0; i < inorder.length; i++) inorderIndex.put(inorder[i], i);
        return build(0, inorder.length - 1);
    }

    // Builds the subtree whose inorder values are inorder[lo..hi].
    private TreeNode build(int lo, int hi) {
        if (lo > hi) return null;
        TreeNode root = new TreeNode(preorder[preIndex++]);
        int mid = inorderIndex.get(root.val);
        root.left = build(lo, mid - 1);             // left first: preorder lists it first
        root.right = build(mid + 1, hi);
        return root;
    }

    static String levelOrder(TreeNode root) {
        List<String> out = new ArrayList<>();
        Queue<TreeNode> q = new LinkedList<>(List.of(root));
        while (!q.isEmpty()) {
            TreeNode n = q.poll();
            out.add(n == null ? "null" : String.valueOf(n.val));
            if (n != null) { q.offer(n.left); q.offer(n.right); }
        }
        while (out.get(out.size() - 1).equals("null")) out.remove(out.size() - 1);
        return out.toString();
    }

    public static void main(String[] args) {
        TreeNode root = new BuildFromPreIn().build(new int[] {3, 9, 20, 15, 7}, new int[] {9, 3, 15, 20, 7});
        System.out.println(levelOrder(root));
    }
}
```

**Output:**

```text
[3, 9, 20, null, null, 15, 7]
```

**Complexity:** O(n) time, O(n) space (map + recursion).

</details>

### P3. Flatten a tree into a linked list in preorder

**Difficulty:** Medium · **Pattern:** Reverse-postorder rewiring

Flatten the tree in place so that it becomes a "linked list" using `right` pointers in **preorder** order, with every `left` pointer set to `null`.

**Constraints:** 0 ≤ n ≤ 2000.

Example: `[1, 2, 5, 3, 4, null, 6]` → `1 → 2 → 3 → 4 → 5 → 6`.

<details>
<summary>Hint</summary>

Process nodes in the reverse of preorder (right, left, node), keeping a pointer `prev` to the node processed last. Then each node's `right` becomes `prev`.

</details>

<details>
<summary>Answer</summary>

**Approach:** Visiting right subtree, then left subtree, then the node itself, nodes are seen in exact reverse preorder (6, 5, 4, 3, 2, 1). Linking each node to the previously seen one builds the list from the back.

```java
public class FlattenTree {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    private TreeNode prev = null;

    void flatten(TreeNode node) {
        if (node == null) return;
        flatten(node.right);
        flatten(node.left);
        node.right = prev;
        node.left = null;
        prev = node;
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(1);
        root.left = new TreeNode(2);
        root.right = new TreeNode(5);
        root.left.left = new TreeNode(3);
        root.left.right = new TreeNode(4);
        root.right.right = new TreeNode(6);
        new FlattenTree().flatten(root);
        StringBuilder sb = new StringBuilder();
        for (TreeNode n = root; n != null; n = n.right) {
            sb.append(n.val).append(n.left == null ? "" : "(left not null!)").append(n.right != null ? " -> " : "");
        }
        System.out.println(sb);
    }
}
```

**Output:**

```text
1 -> 2 -> 3 -> 4 -> 5 -> 6
```

**Complexity:** O(n) time, O(h) recursion space. (A Morris-style loop does it in O(1) space.)

</details>

### P4. Serialize and deserialize a binary tree

**Difficulty:** Hard · **Pattern:** Preorder with null markers

Design `serialize(root) → String` and `deserialize(String) → root` so that any binary tree survives the round trip.

**Constraints:** 0 ≤ n ≤ 10⁴; values in [−1000, 1000].

<details>
<summary>Hint</summary>

Preorder alone is ambiguous, but preorder **with explicit null markers** is not: it records exactly where each subtree ends.

</details>

<details>
<summary>Answer</summary>

**Approach:** Write preorder with `#` for null, comma-separated. To rebuild, read tokens in the same order: a `#` is an empty subtree; otherwise create the node and recursively build its left then right subtree.

```java
import java.util.*;

public class Codec {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        write(root, sb);
        return sb.toString();
    }

    private static void write(TreeNode node, StringBuilder sb) {
        if (sb.length() > 0) sb.append(',');
        if (node == null) {
            sb.append('#');
            return;
        }
        sb.append(node.val);
        write(node.left, sb);
        write(node.right, sb);
    }

    static TreeNode deserialize(String data) {
        Iterator<String> tokens = Arrays.asList(data.split(",")).iterator();
        return read(tokens);
    }

    private static TreeNode read(Iterator<String> tokens) {
        String token = tokens.next();
        if (token.equals("#")) return null;
        TreeNode node = new TreeNode(Integer.parseInt(token));
        node.left = read(tokens);
        node.right = read(tokens);
        return node;
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(1);
        root.left = new TreeNode(2);
        root.right = new TreeNode(3);
        root.right.left = new TreeNode(4);
        root.right.right = new TreeNode(-5);
        String text = serialize(root);
        System.out.println(text);
        System.out.println(serialize(deserialize(text)).equals(text));
        System.out.println(serialize(deserialize(serialize(null))));
    }
}
```

**Output:**

```text
1,2,#,#,3,4,#,#,-5,#,#
true
#
```

**Complexity:** O(n) time and space for both directions. Very deep trees would need an iterative version to avoid stack overflow.

</details>
