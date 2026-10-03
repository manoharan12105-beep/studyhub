# Segment Tree and Lazy Propagation — Practice

### P1. Range minimum with point updates

**Difficulty:** Medium · **Pattern:** Segment tree with min

Support two operations on an array: `update(i, value)` and `minimum(l, r)` (inclusive), each in O(log n).

**Constraints:** 1 ≤ n, q ≤ 10⁵.

Example: `[4, 2, 8, 6, 1, 9]`: min(0, 3) = 2; update(1, 7); min(0, 3) = 4; min(3, 5) = 1.

<details>
<summary>Hint</summary>

Same structure as the sum tree; combine with `Math.min` and use `Integer.MAX_VALUE` as the identity for segments outside the range.

</details>

<details>
<summary>Answer</summary>

**Approach:** This version uses the compact **iterative** layout (array of size 2n, leaves at n..2n − 1, parent of i is i/2), which is shorter and avoids recursion.

```java
public class RangeMin {

    private final int n;
    private final int[] tree;

    RangeMin(int[] arr) {
        n = arr.length;
        tree = new int[2 * n];
        for (int i = 0; i < n; i++) tree[n + i] = arr[i];             // leaves
        for (int i = n - 1; i >= 1; i--) tree[i] = Math.min(tree[2 * i], tree[2 * i + 1]);
    }

    void update(int index, int value) {
        int i = index + n;
        tree[i] = value;
        for (i /= 2; i >= 1; i /= 2) tree[i] = Math.min(tree[2 * i], tree[2 * i + 1]);
    }

    int minimum(int l, int r) {                     // inclusive
        int result = Integer.MAX_VALUE;
        for (l += n, r += n + 1; l < r; l /= 2, r /= 2) {
            if ((l & 1) == 1) result = Math.min(result, tree[l++]);   // l is a right child: take it alone
            if ((r & 1) == 1) result = Math.min(result, tree[--r]);   // r is exclusive: take its left sibling
        }
        return result;
    }

    public static void main(String[] args) {
        RangeMin rm = new RangeMin(new int[] {4, 2, 8, 6, 1, 9});
        System.out.print(rm.minimum(0, 3) + " ");
        rm.update(1, 7);
        System.out.println(rm.minimum(0, 3) + " " + rm.minimum(3, 5) + " " + rm.minimum(2, 2));
    }
}
```

**Output:**

```text
2 4 1 8
```

**Complexity:** O(n) build, O(log n) per update and query, O(n) space.

</details>

### P2. Choosing a range-query structure

**Difficulty:** Medium · **Pattern:** Tool selection

For each scenario, choose the simplest structure that meets the bounds (n, q ≤ 10⁵):

1. Range-sum queries, the array never changes.
2. Range-sum queries interleaved with point updates.
3. Range-minimum queries, the array never changes.
4. Range-minimum queries interleaved with "add v to a range" updates.

<details>
<summary>Hint</summary>

Ask two questions: does the data change, and is the operation invertible (sum) or only idempotent (min)?

</details>

<details>
<summary>Answer</summary>

1. **Prefix sums** — O(n) build, O(1) query.
2. **Fenwick tree** (or segment tree) — O(log n) both; the Fenwick tree is shorter. See [Fenwick Tree](../fenwick-tree/content.md).
3. **Sparse table** — O(n log n) build, O(1) query, since min is idempotent. See [Sparse Table](../sparse-table/content.md).
4. **Segment tree with lazy propagation** — the only one of these that supports range updates with min queries in O(log n).

Reaching for a segment tree in cases 1–3 works but costs more code and more chances for bugs.

</details>

### P3. Range add, range maximum

**Difficulty:** Hard · **Pattern:** Lazy propagation with max

Start with n zeros. Support `add(l, r, v)` (add v to every element of [l, r]) and `max(l, r)`, both in O(log n).

**Constraints:** 1 ≤ n, q ≤ 10⁵; |v| ≤ 10⁹ (use `long`).

Example: n = 5; add(0, 2, 3); add(1, 4, 2); max(0, 4) = 5; max(3, 4) = 2; add(4, 4, 10); max(2, 4) = 12.

<details>
<summary>Hint</summary>

Adding v to every element of a segment increases its maximum by exactly v (not v × length). The lazy tag is still "pending addition".

</details>

<details>
<summary>Answer</summary>

```java
public class RangeAddMax {

    private final long[] tree, lazy;
    private final int n;

    RangeAddMax(int n) {
        this.n = n;
        tree = new long[4 * n];
        lazy = new long[4 * n];
    }

    private void apply(int node, long v) {
        tree[node] += v;                    // max shifts by v
        lazy[node] += v;
    }

    private void push(int node) {
        if (lazy[node] != 0) {
            apply(2 * node + 1, lazy[node]);
            apply(2 * node + 2, lazy[node]);
            lazy[node] = 0;
        }
    }

    void add(int l, int r, long v) { add(0, 0, n - 1, l, r, v); }

    private void add(int node, int lo, int hi, int l, int r, long v) {
        if (r < lo || hi < l) return;
        if (l <= lo && hi <= r) { apply(node, v); return; }
        push(node);
        int mid = (lo + hi) / 2;
        add(2 * node + 1, lo, mid, l, r, v);
        add(2 * node + 2, mid + 1, hi, l, r, v);
        tree[node] = Math.max(tree[2 * node + 1], tree[2 * node + 2]);
    }

    long max(int l, int r) { return max(0, 0, n - 1, l, r); }

    private long max(int node, int lo, int hi, int l, int r) {
        if (r < lo || hi < l) return Long.MIN_VALUE;
        if (l <= lo && hi <= r) return tree[node];
        push(node);
        int mid = (lo + hi) / 2;
        return Math.max(max(2 * node + 1, lo, mid, l, r), max(2 * node + 2, mid + 1, hi, l, r));
    }

    public static void main(String[] args) {
        RangeAddMax t = new RangeAddMax(5);
        t.add(0, 2, 3);                     // [3, 3, 3, 0, 0]
        t.add(1, 4, 2);                     // [3, 5, 5, 2, 2]
        System.out.print(t.max(0, 4) + " " + t.max(3, 4) + " ");
        t.add(4, 4, 10);                    // [3, 5, 5, 2, 12]
        System.out.println(t.max(2, 4));
    }
}
```

**Output:**

```text
5 2 12
```

**Complexity:** O(log n) per operation, O(n) space.

</details>
