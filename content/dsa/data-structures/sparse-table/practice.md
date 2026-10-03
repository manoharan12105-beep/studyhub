# Sparse Table and Range Minimum Query — Practice

### P1. Range GCD queries

**Difficulty:** Medium · **Pattern:** Sparse table with an idempotent operation

Answer q queries "gcd of arr[l..r]" on a static array, each in O(1) after preprocessing (treat a gcd computation as O(log value)).

**Constraints:** 1 ≤ n, q ≤ 10⁵; 1 ≤ arr[i] ≤ 10⁹.

Example: `[12, 18, 24, 9, 27]`: gcd(0, 2) = 6; gcd(2, 4) = 3; gcd(1, 1) = 18.

<details>
<summary>Hint</summary>

gcd(x, x) = x, so gcd is idempotent: the overlapping two-block trick works exactly as for min.

</details>

<details>
<summary>Answer</summary>

```java
public class RangeGcd {

    private final int[][] table;
    private final int[] log;

    RangeGcd(int[] arr) {
        int n = arr.length;
        log = new int[n + 1];
        for (int i = 2; i <= n; i++) log[i] = log[i / 2] + 1;
        table = new int[log[n] + 1][];
        table[0] = arr.clone();
        for (int k = 1; k < table.length; k++) {
            table[k] = new int[n - (1 << k) + 1];
            for (int i = 0; i < table[k].length; i++) {
                table[k][i] = gcd(table[k - 1][i], table[k - 1][i + (1 << (k - 1))]);
            }
        }
    }

    static int gcd(int a, int b) {
        return b == 0 ? a : gcd(b, a % b);
    }

    int query(int l, int r) {
        int k = log[r - l + 1];
        return gcd(table[k][l], table[k][r - (1 << k) + 1]);
    }

    public static void main(String[] args) {
        RangeGcd rg = new RangeGcd(new int[] {12, 18, 24, 9, 27});
        System.out.println(rg.query(0, 2) + " " + rg.query(2, 4) + " " + rg.query(1, 1) + " " + rg.query(0, 4));
    }
}
```

**Output:**

```text
6 3 18 3
```

**Complexity:** O(n log n) build (times a gcd), O(1) gcd combinations per query. The Euclidean algorithm is covered in [Euclidean GCD](../../algorithms/euclidean-gcd/content.md).

</details>

### P2. Longest subarray with max − min ≤ limit

**Difficulty:** Hard · **Pattern:** Sparse tables + two pointers

Return the length of the longest contiguous subarray whose maximum minus minimum is at most `limit`.

**Constraints:** 1 ≤ n ≤ 10⁵; 0 ≤ limit ≤ 10⁹.

Example: `[8, 2, 4, 7]`, limit = 4 → `2` ([2, 4] or [4, 7]); `[10, 1, 2, 4, 7, 2]`, limit = 5 → `4` ([2, 4, 7, 2]).

<details>
<summary>Hint</summary>

If a window is valid, every window inside it is valid, so two pointers apply: extend `right`; while the window is invalid, advance `left`. Checking "max − min" of a window is a range query.

</details>

<details>
<summary>Answer</summary>

**Approach:** Build a min sparse table and a max sparse table (O(n log n)); each window check is O(1), and the two pointers move at most n times each → O(n) checks. The more common O(n) solution replaces the sparse tables with two [monotonic deques](../../patterns/monotonic-queue/content.md) — both are valid; the sparse table shows how static range queries plug into a window scan.

```java
public class LongestBoundedSubarray {

    static int[][] build(int[] arr, boolean max) {
        int n = arr.length, levels = 32 - Integer.numberOfLeadingZeros(n);
        int[][] t = new int[levels][];
        t[0] = arr.clone();
        for (int k = 1; k < levels; k++) {
            t[k] = new int[n - (1 << k) + 1];
            for (int i = 0; i < t[k].length; i++) {
                int a = t[k - 1][i], b = t[k - 1][i + (1 << (k - 1))];
                t[k][i] = max ? Math.max(a, b) : Math.min(a, b);
            }
        }
        return t;
    }

    static int query(int[][] t, int l, int r, boolean max) {
        int k = 31 - Integer.numberOfLeadingZeros(r - l + 1);    // floor(log2(length))
        int a = t[k][l], b = t[k][r - (1 << k) + 1];
        return max ? Math.max(a, b) : Math.min(a, b);
    }

    static int longest(int[] arr, int limit) {
        int[][] maxT = build(arr, true), minT = build(arr, false);
        int best = 0, left = 0;
        for (int right = 0; right < arr.length; right++) {
            while (query(maxT, left, right, true) - query(minT, left, right, false) > limit) {
                left++;
            }
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(longest(new int[] {8, 2, 4, 7}, 4) + " " + longest(new int[] {10, 1, 2, 4, 7, 2}, 5) + " " + longest(new int[] {4, 2, 2, 2, 4, 4, 2, 2}, 0));
    }
}
```

**Output:**

```text
2 4 3
```

**Complexity:** O(n log n) time and space (dominated by building the tables).

</details>
