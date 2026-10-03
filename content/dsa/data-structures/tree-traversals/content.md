# Tree Traversals

## Definition

A **traversal** visits every node of a tree exactly once in a defined order. **Depth-first** traversals go down one branch before backtracking: **preorder** (node, left, right), **inorder** (left, node, right) and **postorder** (left, right, node). **Breadth-first** traversal — **level order** — visits nodes level by level; **zigzag** level order alternates the direction on each level.

## Why It Matters

Nearly every tree problem is a traversal plus a little work at each node, and the order decides what information is available when you visit a node:

| Order | You see a node… | Typical use |
|-------|-----------------|-------------|
| Preorder | before its subtrees | copy/serialize a tree, pass values **down** (paths from the root) |
| Inorder | between its subtrees | BST → sorted order |
| Postorder | after its subtrees | compute values **up** (heights, sizes, deleting a tree) |
| Level order | with its whole level | shortest distance from the root, per-level answers, views |

Interviewers also ask for **iterative** versions to check that you understand the call stack.

## Prerequisites

- [Binary Tree](../binary-tree/content.md)
- [Stack](../stack/content.md) and [Queue](../queue/content.md)
- [Recursion](../../algorithms/recursion/content.md)

## Intuition

Imagine walking around the outside of the tree, starting left of the root and keeping the tree on your right hand side. You pass each node three times: on its left (preorder moment), underneath it (inorder moment) and on its right (postorder moment). Each depth-first order records the node at one of these moments.

Level order is different: it needs to remember all nodes of the current level, so it uses a **queue** instead of the (call) stack.

## How It Works

### Recursive depth-first traversals

1. If the node is `null`, return.
2. Preorder: visit, recurse left, recurse right. Inorder: left, visit, right. Postorder: left, right, visit.

### Iterative preorder (stack)

1. Push the root.
2. Pop a node, visit it, push its **right** child, then its **left** child (so left is popped first).

### Iterative inorder (stack)

1. Go as far left as possible, pushing every node on the way.
2. Pop a node, visit it, then move to its right child and repeat step 1.

### Iterative postorder

- **Two stacks / reversal:** do a modified preorder (node, right, left) and reverse the result — that gives left, right, node.
- **One stack:** go left as far as possible; peek the top; if it has an unvisited right child, go right; otherwise pop and visit it, remembering it as `lastVisited`.

### Level order (queue)

1. Enqueue the root.
2. While the queue is not empty: read `size = queue.size()` — the number of nodes on this level; dequeue exactly that many, recording them and enqueueing their children.

### Zigzag level order

Same as level order, but alternate: add values to the level list left-to-right on even levels and right-to-left on odd levels (e.g. `addFirst` on a deque, or reverse the list).

### Morris inorder traversal (awareness)

Inorder in O(1) extra space: temporarily link each node's inorder predecessor's right pointer back to the node, and remove the link on the second visit. Rarely required, but a common follow-up to "can you do it without a stack?".

## Visual Explanation

```text
            1
          /   \
         2     3
        / \     \
       4   5     6

Preorder   (N L R): 1 2 4 5 3 6
Inorder    (L N R): 4 2 5 1 3 6
Postorder  (L R N): 4 5 2 6 3 1
Level order       : [1] [2 3] [4 5 6]
Zigzag            : [1] [3 2] [4 5 6]
```

## Pseudocode

```pseudocode
inorderIterative(root):
    stack ← empty, node ← root
    while node ≠ null or stack not empty:
        while node ≠ null:
            push node; node ← node.left
        node ← pop
        visit(node)
        node ← node.right

levelOrder(root):
    queue ← [root]
    while queue not empty:
        size ← queue.size
        repeat size times:
            node ← dequeue; visit(node)
            enqueue non-null children
```

## Java Implementation

```java
import java.util.*;

public class TreeTraversals {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val) { this.val = val; }
    }

    static void preorder(TreeNode n, List<Integer> out) {
        if (n == null) return;
        out.add(n.val);
        preorder(n.left, out);
        preorder(n.right, out);
    }

    static void inorder(TreeNode n, List<Integer> out) {
        if (n == null) return;
        inorder(n.left, out);
        out.add(n.val);
        inorder(n.right, out);
    }

    static void postorder(TreeNode n, List<Integer> out) {
        if (n == null) return;
        postorder(n.left, out);
        postorder(n.right, out);
        out.add(n.val);
    }

    static List<Integer> preorderIterative(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        if (root == null) return out;
        Deque<TreeNode> stack = new ArrayDeque<>();
        stack.push(root);
        while (!stack.isEmpty()) {
            TreeNode node = stack.pop();
            out.add(node.val);
            if (node.right != null) stack.push(node.right);   // pushed first, popped later
            if (node.left != null) stack.push(node.left);
        }
        return out;
    }

    static List<Integer> inorderIterative(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode node = root;
        while (node != null || !stack.isEmpty()) {
            while (node != null) {                  // go as far left as possible
                stack.push(node);
                node = node.left;
            }
            node = stack.pop();
            out.add(node.val);
            node = node.right;                      // then handle the right subtree
        }
        return out;
    }

    static List<Integer> postorderIterative(TreeNode root) {
        List<Integer> out = new ArrayList<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode node = root, lastVisited = null;
        while (node != null || !stack.isEmpty()) {
            while (node != null) {
                stack.push(node);
                node = node.left;
            }
            TreeNode top = stack.peek();
            if (top.right != null && top.right != lastVisited) {
                node = top.right;                   // right subtree not done yet
            } else {
                out.add(top.val);
                lastVisited = stack.pop();
            }
        }
        return out;
    }

    static List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> levels = new ArrayList<>();
        if (root == null) return levels;
        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            int size = queue.size();                // fix the level size before adding children
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            levels.add(level);
        }
        return levels;
    }

    static List<List<Integer>> zigzag(TreeNode root) {
        List<List<Integer>> levels = new ArrayList<>();
        if (root == null) return levels;
        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        boolean leftToRight = true;
        while (!queue.isEmpty()) {
            int size = queue.size();
            Deque<Integer> level = new ArrayDeque<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                if (leftToRight) level.addLast(node.val); else level.addFirst(node.val);
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            levels.add(new ArrayList<>(level));
            leftToRight = !leftToRight;
        }
        return levels;
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(1);
        root.left = new TreeNode(2);
        root.right = new TreeNode(3);
        root.left.left = new TreeNode(4);
        root.left.right = new TreeNode(5);
        root.right.right = new TreeNode(6);

        List<Integer> pre = new ArrayList<>(), in = new ArrayList<>(), post = new ArrayList<>();
        preorder(root, pre);
        inorder(root, in);
        postorder(root, post);
        System.out.println("pre  " + pre + " iterative " + preorderIterative(root));
        System.out.println("in   " + in + " iterative " + inorderIterative(root));
        System.out.println("post " + post + " iterative " + postorderIterative(root));
        System.out.println("level  " + levelOrder(root));
        System.out.println("zigzag " + zigzag(root));
    }
}
```

**Output:**

```text
pre  [1, 2, 4, 5, 3, 6] iterative [1, 2, 4, 5, 3, 6]
in   [4, 2, 5, 1, 3, 6] iterative [4, 2, 5, 1, 3, 6]
post [4, 5, 2, 6, 3, 1] iterative [4, 5, 2, 6, 3, 1]
level  [[1], [2, 3], [4, 5, 6]]
zigzag [[1], [3, 2], [4, 5, 6]]
```

## Dry Run

Iterative inorder on the tree above:

| Step | Action | Stack (bottom → top) | Output |
|------|--------|----------------------|--------|
| 1 | push 1, 2, 4 (go left) | 1 2 4 | |
| 2 | pop 4, visit; right = null | 1 2 | 4 |
| 3 | pop 2, visit; go right to 5 | 1 | 4 2 |
| 4 | push 5 | 1 5 | |
| 5 | pop 5, visit; right = null | 1 | 4 2 5 |
| 6 | pop 1, visit; go right to 3 | — | 4 2 5 1 |
| 7 | push 3 | 3 | |
| 8 | pop 3, visit; go right to 6 | — | … 1 3 |
| 9 | push 6, pop 6, visit | — | 4 2 5 1 3 6 |

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best | O(n) | every node is visited once |
| Average | O(n) | |
| Worst | O(n) | |

**Space:** depth-first traversals use O(h) — the recursion or explicit stack holds one root-to-node path: O(log n) for balanced trees, O(n) for skewed ones. Level order uses O(w), the maximum width, up to about n/2 for the last level of a perfect tree. Morris traversal uses O(1).

## Properties

- **Inorder of a BST is sorted** — the basis of BST validation and k-th smallest queries.
- **Preorder + inorder** (or postorder + inorder) uniquely determine a binary tree with distinct values; preorder + postorder alone does not (unless the tree is full).
- **Level order** visits nodes in nondecreasing depth — BFS on a tree.

## Variations

- **Reverse level order** (bottom-up): level order, then reverse the list of levels.
- **Vertical order**: tag nodes with a column (root 0, left −1, right +1) during BFS — see [Binary Tree Problems](../binary-tree-problems/content.md).
- **N-ary trees**: preorder/postorder/level order generalise by looping over the children list.

## Comparison

| | Recursive DFS | Iterative DFS | BFS (level order) |
|---|---------------|---------------|-------------------|
| Code length | shortest | longer | medium |
| Extra space | O(h) call stack | O(h) explicit stack | O(w) queue |
| Risk | `StackOverflowError` on very deep trees | none | none |
| Natural for | most tree recursion | deep trees, interview follow-ups | per-level and shortest-depth questions |

## Edge Cases

- Empty tree → empty result (guard `root == null` before using a queue/stack).
- Single node.
- Completely skewed tree — recursion depth n.

## Advantages

- Uniform O(n) framework for almost every tree computation.
- Choosing the order gives the information you need at the right time.

## Disadvantages

- Recursive versions can overflow on very deep trees; iterative versions are trickier to write correctly.

## When to Use

- "Process parent before children" → preorder. "Children before parent" → postorder. "Sorted order of a BST" → inorder.
- "Level", "depth", "row", "closest to the root", "views" → level order.

## Common Mistakes

- Reading `queue.size()` inside the loop condition instead of saving it once per level.
- In iterative preorder, pushing left before right (gives node, right, left).
- In iterative postorder, forgetting `lastVisited`, which causes an infinite loop.
- Using `ArrayDeque` with `null` children (`offer(null)` throws) — check before enqueueing.

## Key Takeaways

- Pre = N L R, In = L N R, Post = L R N; level order uses a queue.
- All traversals are O(n) time; DFS space O(h), BFS space O(w).
- Iterative inorder: push lefts, pop-visit, go right. Iterative preorder: pop-visit, push right then left.
- Inorder of a BST is sorted; preorder + inorder rebuild a tree.
