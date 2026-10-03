# Tree DP

## Definition

**Tree DP** computes an answer for every subtree from the answers of its children, using a **postorder** traversal. The state is attached to a node — often several values per node, such as "best if this node is chosen" and "best if it is not". Because each node is processed once, tree DP runs in **O(n)** time (times the number of states per node).

## Why It Matters

Many tree problems are optimisation problems with a constraint between parent and child: rob houses arranged as a tree without robbing directly connected ones, place the fewest cameras to watch every node, choose a maximum set of non-adjacent nodes, compute subtree sizes or sums of distances. Diameter and maximum path sum ([Binary Tree Problems](../../data-structures/binary-tree-problems/content.md)) are tree DP too.

## Prerequisites

- [Tree Traversals](../../data-structures/tree-traversals/content.md) — postorder.
- [Dynamic Programming](../dynamic-programming/content.md)

## Intuition

A subtree is a smaller instance of the whole problem, and subtrees of different children never overlap. So the node's answer is built from its children's answers — but often a single number per child is not enough. If the rule is "a node and its parent cannot both be chosen", the parent needs to know the child's best **with** the child chosen and **without** it. Returning a small tuple of values per node keeps all the information the parent needs.

## How It Works

1. **Define the state per node:** e.g. `take(v)` = best value in v's subtree if v is chosen; `skip(v)` = best if v is not chosen.
2. **Write the transition from children:** for house robber III,
   - `take(v) = v.val + Σ skip(child)` (children cannot be chosen),
   - `skip(v) = Σ max(take(child), skip(child))` (each child free to choose).
3. **Base case:** an empty subtree returns (0, 0).
4. **Postorder:** compute children first, then the node.
5. **Answer:** combine the root's states (`max(take(root), skip(root))`).

Return the tuple from the recursive function (e.g. an `int[2]`) instead of using a memo map — each node is visited once anyway.

### General trees

For trees given as edge lists (n nodes, n − 1 edges), build an adjacency list and DFS from a root, passing the parent to avoid walking back up. The same take/skip idea gives the **maximum weight independent set** on trees in O(n), a problem that is NP-hard on general graphs.

### Rerooting (awareness)

Some problems need the answer **for every node as the root** (e.g. sum of distances from each node to all others). Compute subtree values with one postorder pass, then push values from parent to child with a second preorder pass: O(n) instead of O(n²).

## Visual Explanation

```text
House robber III (values shown in the nodes):

            3
          /   \
         4     5
        / \     \
       1   3     1

leaves 1, 3, 1:   (take, skip) = (1, 0), (3, 0), (1, 0)
node 4:           take = 4 + 0 + 0 = 4      skip = max(1,0) + max(3,0) = 4
node 5:           take = 5 + 0 = 5          skip = max(1,0) = 1
root 3:           take = 3 + 4 + 1 = 8      skip = max(4,4) + max(5,1) = 9
answer = max(8, 9) = 9   (rob 4 and 5)
```

## Pseudocode

```pseudocode
solve(node):                      // returns (take, skip)
    if node = null: return (0, 0)
    (lt, ls) ← solve(node.left)
    (rt, rs) ← solve(node.right)
    take ← node.val + ls + rs
    skip ← max(lt, ls) + max(rt, rs)
    return (take, skip)
```

## Java Implementation

```java
import java.util.*;

public class TreeDp {

    static class TreeNode {
        int val;
        TreeNode left, right;
        TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
    }

    // House robber III: returns {take, skip} for the subtree.
    static int[] rob(TreeNode node) {
        if (node == null) return new int[] {0, 0};
        int[] l = rob(node.left), r = rob(node.right);
        int take = node.val + l[1] + r[1];                     // children must be skipped
        int skip = Math.max(l[0], l[1]) + Math.max(r[0], r[1]);
        return new int[] {take, skip};
    }

    // Maximum weight independent set on a general tree (edge list, weights per node).
    static long[] independentSet(int v, int parent, List<List<Integer>> adj, int[] weight) {
        long take = weight[v], skip = 0;
        for (int child : adj.get(v)) {
            if (child == parent) continue;                     // do not walk back up
            long[] c = independentSet(child, v, adj, weight);
            take += c[1];
            skip += Math.max(c[0], c[1]);
        }
        return new long[] {take, skip};
    }

    // Subtree sizes in one postorder pass.
    static int subtreeSize(int v, int parent, List<List<Integer>> adj, int[] size) {
        size[v] = 1;
        for (int child : adj.get(v)) {
            if (child != parent) size[v] += subtreeSize(child, v, adj, size);
        }
        return size[v];
    }

    public static void main(String[] args) {
        TreeNode root = new TreeNode(3,
                new TreeNode(4, new TreeNode(1, null, null), new TreeNode(3, null, null)),
                new TreeNode(5, null, new TreeNode(1, null, null)));
        int[] r = rob(root);
        System.out.println("house robber III: take root " + r[0] + ", skip root " + r[1] + " -> " + Math.max(r[0], r[1]));

        int n = 6;
        int[][] edges = {{0, 1}, {0, 2}, {1, 3}, {1, 4}, {2, 5}};
        int[] weight = {1, 5, 3, 2, 2, 6};
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
        }
        long[] best = independentSet(0, -1, adj, weight);
        System.out.println("max independent set weight: " + Math.max(best[0], best[1]));
        int[] size = new int[n];
        subtreeSize(0, -1, adj, size);
        System.out.println("subtree sizes: " + Arrays.toString(size));
    }
}
```

**Output:**

```text
house robber III: take root 8, skip root 9 -> 9
max independent set weight: 11
subtree sizes: [6, 3, 2, 1, 1, 1]
```

## Dry Run

Independent set on the general tree (weights 0:1, 1:5, 2:3, 3:2, 4:2, 5:6):

| Node (postorder) | Children (take, skip) | take | skip |
|------------------|-----------------------|------|------|
| 3 | — | 2 | 0 |
| 4 | — | 2 | 0 |
| 1 | (2, 0), (2, 0) | 5 + 0 + 0 = 5 | 2 + 2 = 4 |
| 5 | — | 6 | 0 |
| 2 | (6, 0) | 3 + 0 = 3 | 6 |
| 0 | (5, 4), (3, 6) | 1 + 4 + 6 = 11 | 5 + 6 = 11 |

Answer 11 (e.g. nodes 1 and 5).

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best / Average / Worst | O(n × s) | each node computed once from its children; s = states per node (usually 1–3) |

**Space:** O(h) recursion depth (O(n) for a path-like tree) plus the returned tuples.

## Properties

- Subtrees are disjoint, so there is no overlap between children — the "DP" comes from carrying several states per node.
- Postorder is mandatory: a node needs all children's values.

## Variations

- **Binary tree cameras** — states: covered with a camera, covered without, not covered.
- **Diameter / maximum path sum** — return one-sided best, record two-sided best globally.
- **Sum of distances in a tree** — rerooting technique.
- **Tree knapsack** — choose k nodes forming a connected subtree (merging child tables).

## Comparison

| | Tree DP | Graph DP |
|---|---------|----------|
| Structure | no cycles → postorder gives a valid order | needs a DAG / topological order, or is NP-hard (independent set) |
| Independent set | O(n) | NP-hard in general |

## Edge Cases

- Empty tree → 0; single node.
- Negative node values (decide whether choosing nothing is allowed).
- Very deep trees → recursion depth; use an iterative postorder if needed.

## Advantages

- Linear time; elegant; solves problems that are hard on general graphs.

## Disadvantages

- Designing the right per-node states takes practice.

## When to Use

- Tree input + an optimisation or counting question with a constraint between parent and child, or answers that depend on whole subtrees.

## Common Mistakes

- Returning a single value when the parent needs two (chosen / not chosen).
- Walking back to the parent in general trees (missing the `parent` check).
- Memoizing with a `HashMap<TreeNode, Integer>` and calling the function twice per child (correct but slower and messier than returning a tuple).

## Key Takeaways

- Postorder: compute each node from its children's states.
- Return several states per node (take/skip, covered/not) when parent–child constraints exist.
- O(n) time; rerooting gives "answer for every root" in O(n).
