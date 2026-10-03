# Subsequence DP (LIS and LCS) — Practice

### P1. Minimum deletions to make two strings equal

**Difficulty:** Medium · **Pattern:** Reduce to LCS

Return the minimum number of characters to delete from the two strings (in total) to make them equal.

**Constraints:** 1 ≤ lengths ≤ 500.

Example: `"sea"`, `"eat"` → `2` (delete 's' and 't'; both become "ea").

<details>
<summary>Hint</summary>

Whatever survives must be a common subsequence; keep the longest one.

</details>

<details>
<summary>Answer</summary>

```java
public class DeleteToEqual {

    static int minDistance(String a, String b) {
        int m = a.length(), n = b.length();
        int[] prev = new int[n + 1], curr = new int[n + 1];       // two rows: O(n) space
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                curr[j] = a.charAt(i - 1) == b.charAt(j - 1) ? prev[j - 1] + 1 : Math.max(prev[j], curr[j - 1]);
            }
            int[] t = prev; prev = curr; curr = t;
        }
        return m + n - 2 * prev[n];
    }

    public static void main(String[] args) {
        System.out.println(minDistance("sea", "eat") + " " + minDistance("leetcode", "etco"));
    }
}
```

**Output:**

```text
2 4
```

**Complexity:** O(m × n) time, O(n) space.

</details>

### P2. Longest bitonic subsequence

**Difficulty:** Medium · **Pattern:** LIS from both directions

A bitonic subsequence strictly increases and then strictly decreases (either part may be empty). Return the length of the longest one.

**Constraints:** 1 ≤ n ≤ 2000.

Example: `[1, 11, 2, 10, 4, 5, 2, 1]` → `6` (1, 2, 10, 4, 2, 1).

<details>
<summary>Hint</summary>

For each peak index i: (LIS ending at i from the left) + (LIS ending at i from the right) − 1.

</details>

<details>
<summary>Answer</summary>

```java
public class LongestBitonic {

    static int longestBitonic(int[] a) {
        int n = a.length;
        int[] inc = new int[n], dec = new int[n];
        for (int i = 0; i < n; i++) {
            inc[i] = 1;
            for (int j = 0; j < i; j++) if (a[j] < a[i]) inc[i] = Math.max(inc[i], inc[j] + 1);
        }
        for (int i = n - 1; i >= 0; i--) {
            dec[i] = 1;
            for (int j = n - 1; j > i; j--) if (a[j] < a[i]) dec[i] = Math.max(dec[i], dec[j] + 1);
        }
        int best = 0;
        for (int i = 0; i < n; i++) best = Math.max(best, inc[i] + dec[i] - 1);   // i counted twice
        return best;
    }

    public static void main(String[] args) {
        System.out.println(longestBitonic(new int[] {1, 11, 2, 10, 4, 5, 2, 1}) + " " + longestBitonic(new int[] {12, 11, 40, 5, 3, 1}) + " " + longestBitonic(new int[] {80, 60, 30, 40, 20, 10}));
    }
}
```

**Output:**

```text
6 5 5
```

**Complexity:** O(n²) time, O(n) space.

</details>

### P3. Number of longest increasing subsequences

**Difficulty:** Medium · **Pattern:** Track (length, count) per index

Return how many strictly increasing subsequences have the maximum length.

**Constraints:** 1 ≤ n ≤ 2000.

Example: `[1, 3, 5, 4, 7]` → `2` ([1,3,4,7] and [1,3,5,7]); `[2, 2, 2, 2, 2]` → `5`.

<details>
<summary>Hint</summary>

When `len[j] + 1 > len[i]`, a longer ending at i is found: reset `count[i] = count[j]`. When equal, add `count[j]`.

</details>

<details>
<summary>Answer</summary>

```java
public class NumberOfLis {

    static int findNumberOfLis(int[] a) {
        int n = a.length;
        int[] len = new int[n], count = new int[n];
        int bestLen = 0, total = 0;
        for (int i = 0; i < n; i++) {
            len[i] = 1;
            count[i] = 1;
            for (int j = 0; j < i; j++) {
                if (a[j] < a[i]) {
                    if (len[j] + 1 > len[i]) {
                        len[i] = len[j] + 1;
                        count[i] = count[j];          // new best length: inherit the count
                    } else if (len[j] + 1 == len[i]) {
                        count[i] += count[j];         // another way to reach the same length
                    }
                }
            }
            if (len[i] > bestLen) {
                bestLen = len[i];
                total = count[i];
            } else if (len[i] == bestLen) {
                total += count[i];
            }
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.println(findNumberOfLis(new int[] {1, 3, 5, 4, 7}) + " " + findNumberOfLis(new int[] {2, 2, 2, 2, 2}));
    }
}
```

**Output:**

```text
2 5
```

**Complexity:** O(n²) time, O(n) space.

</details>

### P4. Russian doll envelopes

**Difficulty:** Hard · **Pattern:** Sort to reduce 2D nesting to 1D LIS

Envelope (w, h) fits inside another if both its width and height are strictly smaller. Return the maximum number of envelopes that can be nested.

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: `[[5,4],[6,4],[6,7],[2,3]]` → `3` ([2,3] → [5,4] → [6,7]).

<details>
<summary>Hint</summary>

Sort by width ascending and, for equal widths, height **descending**. Then the answer is the LIS of the heights — the descending tie order prevents two envelopes of the same width from both being chosen.

</details>

<details>
<summary>Answer</summary>

**Approach:** After the sort, any strictly increasing sequence of heights has strictly increasing widths too (equal widths appear in decreasing height order, so they can never both be in an increasing run). O(n log n) LIS keeps it fast for n = 10⁵.

```java
import java.util.*;

public class RussianDoll {

    static int maxEnvelopes(int[][] envelopes) {
        int[][] e = envelopes.clone();
        Arrays.sort(e, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(b[1], a[1]));
        int[] tails = new int[e.length];
        int size = 0;
        for (int[] env : e) {
            int h = env[1], lo = 0, hi = size;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (tails[mid] >= h) hi = mid; else lo = mid + 1;
            }
            tails[lo] = h;
            if (lo == size) size++;
        }
        return size;
    }

    public static void main(String[] args) {
        System.out.println(maxEnvelopes(new int[][] {{5, 4}, {6, 4}, {6, 7}, {2, 3}}) + " " + maxEnvelopes(new int[][] {{1, 1}, {1, 1}, {1, 1}}));
    }
}
```

**Output:**

```text
3 1
```

**Complexity:** O(n log n) time, O(n) space.

</details>
