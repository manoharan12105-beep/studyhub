# Segment Tree and Lazy Propagation

> [!NOTE]
> **Advanced topic.** Segment trees appear in competitive programming and in harder interviews (mostly at companies that ask contest-style questions). Learn [Prefix Sum](../../patterns/prefix-sum/content.md) and [Binary Tree](../binary-tree/content.md) first; many interview problems that look like they need a segment tree can be solved with prefix sums, a [Fenwick Tree](../fenwick-tree/content.md) or a `TreeMap`.

## Definition

A **segment tree** is a binary tree over an array in which each node stores an aggregate (sum, minimum, maximum, gcd, …) of a contiguous **segment** of the array. The root covers the whole array, its children cover the two halves, and so on down to single elements. It answers **range queries** and handles **point updates** in O(log n). With **lazy propagation**, it also handles **range updates** (add a value to every element in [l, r]) in O(log n).

## Why It Matters

Prefix sums answer range-sum queries in O(1) but need O(n) to update. A plain array updates in O(1) but sums a range in O(n). When both queries and updates are frequent — say 10⁵ of each — only a structure with O(log n) for both is fast enough. Segment trees are also more general than prefix sums: they work for any **associative** operation, including min and max, which have no "subtraction".

## Core Concept

### Structure

```text
array: index   0   1   2   3   4   5
       value   5   3   7   9   6   4

                     [0,5] sum 34
                   /              \
            [0,2] 15                [3,5] 19
            /      \                /       \
       [0,1] 8    [2,2] 7      [3,4] 15    [5,5] 4
       /     \                 /     \
  [0,0] 5  [1,1] 3        [3,3] 9  [4,4] 6
```

- A node covering [lo, hi] with lo < hi has children [lo, mid] and [mid + 1, hi], where mid = (lo + hi)/2.
- Stored in an array like a heap: node i has children 2i + 1 and 2i + 2 (0-based). An array of size **4n** is always enough.
- The tree has 2n − 1 nodes and height ⌈log₂ n⌉.

### Query [l, r]

At each node, three cases:

1. Node segment entirely **outside** [l, r] → contribute the identity (0 for sum, +∞ for min).
2. Node segment entirely **inside** [l, r] → contribute the node's stored value; do not go deeper.
3. **Partial** overlap → ask both children and combine.

At each level, at most two nodes are partially overlapped (the ones containing l and r), so a query visits O(log n) nodes — about 4 log n in the worst case.

### Point update

Change the leaf for index i, then recompute every ancestor on the way back up: O(log n).

### Lazy propagation

A range update "add v to every element in [l, r]" would touch O(n) leaves if done one by one. Instead, when a node's segment is fully inside [l, r]:

1. Update the node's value directly (for sums: value += v × segment length).
2. Record a **pending** ("lazy") tag v at the node instead of updating its children.
3. When a later query or update needs to go **below** that node, first **push** the tag down to both children (apply it to them and add it to their lazy tags), then clear it.

Every range update or query still visits O(log n) nodes.

## Visual Explanation

```text
query sum(1, 4) on the tree above:

[0,5] partial → [0,2] partial → [0,1] partial → [0,0] outside (0), [1,1] inside (3)
                              → [2,2] inside (7)
             → [3,5] partial → [3,4] inside (15)
                              → [5,5] outside (0)

result = 3 + 7 + 15 = 25 = 3 + 7 + 9 + 6 ✓
```

## Operations

### Build

Recursively build both halves, then combine: O(n) — each of the 2n − 1 nodes is computed once.

```java
void build(int[] arr, int node, int lo, int hi) {
    if (lo == hi) {
        tree[node] = arr[lo];
        return;
    }
    int mid = (lo + hi) / 2;
    build(arr, 2 * node + 1, lo, mid);
    build(arr, 2 * node + 2, mid + 1, hi);
    tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
}
```

### Query

```java
long query(int node, int lo, int hi, int l, int r) {
    if (r < lo || hi < l) return 0;                 // outside
    if (l <= lo && hi <= r) return tree[node];      // fully inside
    int mid = (lo + hi) / 2;
    return query(2 * node + 1, lo, mid, l, r) + query(2 * node + 2, mid + 1, hi, l, r);
}
```

### Point update

```java
void update(int node, int lo, int hi, int index, long value) {
    if (lo == hi) {
        tree[node] = value;
        return;
    }
    int mid = (lo + hi) / 2;
    if (index <= mid) update(2 * node + 1, lo, mid, index, value);
    else update(2 * node + 2, mid + 1, hi, index, value);
    tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
}
```

(`tree` is a `long[]` field of size 4n.)

### Other operations

Replace `+` with `Math.min`, `Math.max` or `gcd`, and the identity 0 with `Long.MAX_VALUE`, `Long.MIN_VALUE` or 0 respectively. The operation must be **associative**: (a ⊕ b) ⊕ c = a ⊕ (b ⊕ c).

## Full Java Implementation

A sum segment tree with point updates, and a lazy segment tree supporting "add v to a range" + "sum of a range":

```java
public class SegmentTrees {

    // Range sum + point assignment.
    static class SumSegmentTree {
        private final long[] tree;
        private final int n;

        SumSegmentTree(int[] arr) {
            n = arr.length;
            tree = new long[4 * n];
            build(arr, 0, 0, n - 1);
        }

        private void build(int[] arr, int node, int lo, int hi) {
            if (lo == hi) { tree[node] = arr[lo]; return; }
            int mid = (lo + hi) / 2;
            build(arr, 2 * node + 1, lo, mid);
            build(arr, 2 * node + 2, mid + 1, hi);
            tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
        }

        long sum(int l, int r) { return query(0, 0, n - 1, l, r); }

        private long query(int node, int lo, int hi, int l, int r) {
            if (r < lo || hi < l) return 0;
            if (l <= lo && hi <= r) return tree[node];
            int mid = (lo + hi) / 2;
            return query(2 * node + 1, lo, mid, l, r) + query(2 * node + 2, mid + 1, hi, l, r);
        }

        void set(int index, long value) { update(0, 0, n - 1, index, value); }

        private void update(int node, int lo, int hi, int index, long value) {
            if (lo == hi) { tree[node] = value; return; }
            int mid = (lo + hi) / 2;
            if (index <= mid) update(2 * node + 1, lo, mid, index, value);
            else update(2 * node + 2, mid + 1, hi, index, value);
            tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
        }
    }

    // Range add + range sum with lazy propagation.
    static class LazySegmentTree {
        private final long[] tree, lazy;
        private final int n;

        LazySegmentTree(int n) {
            this.n = n;
            tree = new long[4 * n];
            lazy = new long[4 * n];
        }

        // Apply "add v to every element" to a whole node segment of the given length.
        private void apply(int node, int length, long v) {
            tree[node] += v * length;
            lazy[node] += v;                       // children still owe this addition
        }

        private void push(int node, int lo, int hi) {
            if (lazy[node] != 0) {
                int mid = (lo + hi) / 2;
                apply(2 * node + 1, mid - lo + 1, lazy[node]);
                apply(2 * node + 2, hi - mid, lazy[node]);
                lazy[node] = 0;
            }
        }

        void add(int l, int r, long v) { add(0, 0, n - 1, l, r, v); }

        private void add(int node, int lo, int hi, int l, int r, long v) {
            if (r < lo || hi < l) return;
            if (l <= lo && hi <= r) { apply(node, hi - lo + 1, v); return; }
            push(node, lo, hi);                    // children must be up to date before we touch them
            int mid = (lo + hi) / 2;
            add(2 * node + 1, lo, mid, l, r, v);
            add(2 * node + 2, mid + 1, hi, l, r, v);
            tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
        }

        long sum(int l, int r) { return sum(0, 0, n - 1, l, r); }

        private long sum(int node, int lo, int hi, int l, int r) {
            if (r < lo || hi < l) return 0;
            if (l <= lo && hi <= r) return tree[node];
            push(node, lo, hi);
            int mid = (lo + hi) / 2;
            return sum(2 * node + 1, lo, mid, l, r) + sum(2 * node + 2, mid + 1, hi, l, r);
        }
    }

    public static void main(String[] args) {
        SumSegmentTree st = new SumSegmentTree(new int[] {5, 3, 7, 9, 6, 4});
        System.out.println("sum(1,4)=" + st.sum(1, 4) + " sum(0,5)=" + st.sum(0, 5));
        st.set(2, 10);                               // 7 -> 10
        System.out.println("after set(2,10): sum(1,4)=" + st.sum(1, 4));

        LazySegmentTree lazy = new LazySegmentTree(6);   // all zeros
        lazy.add(0, 3, 2);                           // [2, 2, 2, 2, 0, 0]
        lazy.add(2, 5, 5);                           // [2, 2, 7, 7, 5, 5]
        System.out.println("lazy sum(0,5)=" + lazy.sum(0, 5) + " sum(2,3)=" + lazy.sum(2, 3) + " sum(4,4)=" + lazy.sum(4, 4));
    }
}
```

**Output:**

```text
sum(1,4)=25 sum(0,5)=34
after set(2,10): sum(1,4)=28
lazy sum(0,5)=28 sum(2,3)=14 sum(4,4)=5
```

## Dry Run

Lazy tree on 6 zeros, `add(0, 3, 2)`:

| Node segment | Relation to [0, 3] | Action |
|--------------|--------------------|--------|
| [0,5] | partial | push (nothing pending), recurse |
| [0,2] | inside | tree += 2 × 3 = 6, lazy = 2 — stop |
| [3,5] | partial | push, recurse |
| [3,4] | partial | push, recurse |
| [3,3] | inside | tree = 2, lazy = 2 |
| [4,4] | outside | — |
| [5,5] | outside | — |

Nodes below [0,2] are untouched; they receive their +2 only if a later operation needs to descend there.

## Complexity Summary

| Operation | Time | Space |
|-----------|------|-------|
| Build | O(n) | O(4n) array |
| Range query | O(log n) | O(log n) recursion |
| Point update | O(log n) | O(log n) |
| Range update (lazy) | O(log n) | O(4n) lazy array |

## Advantages

- O(log n) for both queries and updates.
- Works for any associative operation (sum, min, max, gcd, xor, matrix product…).
- Lazy propagation adds range updates without changing the complexity.

## Disadvantages

- More code and more memory (4n) than prefix sums or a Fenwick tree.
- Easy to get index boundaries wrong; lazy propagation adds subtle bugs (forgetting to push).

## Comparison

| | Prefix sums | Fenwick tree | Segment tree | Sparse table |
|---|-------------|--------------|--------------|--------------|
| Range query | O(1) | O(log n) (invertible ops: sum, xor) | O(log n) any associative op | O(1) idempotent ops (min, max, gcd) |
| Point update | O(n) | O(log n) | O(log n) | not supported |
| Range update | O(n) | O(log n) with tricks | O(log n) with lazy | not supported |
| Memory | n | n | 4n | n log n |
| Code size | tiny | small | medium/large | small |

## Java Collections Equivalent

None in the JDK. For "count of elements ≤ x" style queries, a Fenwick tree over compressed values or a `TreeMap` is often simpler.

## Real-World Applications

- Databases and analytics: range aggregates over changing data.
- Computational geometry: sweep-line algorithms (rectangle union area, overlapping intervals).
- Games and simulations: interval updates on timelines.

## Common Mistakes

- Allocating `2n` instead of `4n` for the recursive layout.
- Using `int` sums that overflow — use `long`.
- Forgetting `push` before recursing in a lazy tree, or forgetting to recompute the parent after recursing.
- Wrong identity element (0 for min queries gives wrong answers).
- Choosing a segment tree when prefix sums suffice (no updates).

## Key Takeaways

- Each node stores an aggregate of a segment; the root covers everything; leaves are single elements.
- Query = combine fully covered nodes; at most O(log n) nodes per level boundary → O(log n).
- Point update = change a leaf and recompute its ancestors.
- Lazy propagation stores pending range updates at covering nodes and pushes them down only when needed.
