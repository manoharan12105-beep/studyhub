# Brute Force to Optimal — Practice

### P1. Pairs of song durations divisible by 60

**Difficulty:** Easy · **Pattern:** All pairs → remainder counting

Count pairs i < j with `(time[i] + time[j]) % 60 == 0`.

**Constraints:** 1 ≤ n ≤ 6 × 10⁴; 1 ≤ time[i] ≤ 500.

Example: `[30, 20, 150, 100, 40]` → `3` ((30, 150), (20, 100), (20, 40)); `[60, 60, 60]` → `3`.

<details>
<summary>Hint</summary>

Brute force checks all pairs, O(n²) ≈ 1.8 × 10⁹. A pair works when the remainders r and (60 − r) % 60 match. Count remainders seen so far and add the count of the needed partner — the hashing move with a 60-slot array.

</details>

<details>
<summary>Answer</summary>

```java
public class SongPairs {

    static long bruteForce(int[] t) {
        long count = 0;
        for (int i = 0; i < t.length; i++)
            for (int j = i + 1; j < t.length; j++)
                if ((t[i] + t[j]) % 60 == 0) count++;
        return count;
    }

    static long optimal(int[] t) {
        long[] seen = new long[60];                    // seen[r] = earlier songs with remainder r
        long count = 0;
        for (int x : t) {
            int r = x % 60;
            count += seen[(60 - r) % 60];              // partners that complete a multiple of 60
            seen[r]++;
        }
        return count;
    }

    public static void main(String[] args) {
        int[] a = {30, 20, 150, 100, 40}, b = {60, 60, 60};
        System.out.println(bruteForce(a) + " " + optimal(a) + " " + bruteForce(b) + " " + optimal(b));
    }
}
```

**Output:**

```text
3 3 3 3
```

**Complexity:** O(n) time, O(60) space. The `% 60` on `60 − r` maps r = 0 to partner 0.

</details>

### P2. Maximum sum of a circular subarray

**Difficulty:** Medium · **Pattern:** Kadane twice (max and min)

The array is circular (the end wraps to the start). Return the maximum sum of a non-empty subarray, using each element at most once.

**Constraints:** 1 ≤ n ≤ 3 × 10⁴; −3 × 10⁴ ≤ values ≤ 3 × 10⁴.

Example: `[1, -2, 3, -2]` → `3`; `[5, -3, 5]` → `10` (wraps: 5 + 5); `[-3, -2, -3]` → `-2`.

<details>
<summary>Hint</summary>

Brute force: every start and length, O(n²). A wrapping subarray is the whole array **minus** a non-wrapping middle part; to maximise it, remove the minimum-sum subarray. Answer = max(Kadane max, total − Kadane min), except when every element is negative (then the "wrap" would be empty).

</details>

<details>
<summary>Answer</summary>

```java
public class MaxCircularSubarray {

    static int maxSubarraySumCircular(int[] a) {
        int total = 0, curMax = 0, bestMax = Integer.MIN_VALUE, curMin = 0, bestMin = Integer.MAX_VALUE;
        for (int x : a) {
            curMax = Math.max(x, curMax + x);
            bestMax = Math.max(bestMax, curMax);
            curMin = Math.min(x, curMin + x);          // Kadane for the minimum
            bestMin = Math.min(bestMin, curMin);
            total += x;
        }
        if (bestMax < 0) return bestMax;               // all negative: total − bestMin would be an empty subarray
        return Math.max(bestMax, total - bestMin);
    }

    public static void main(String[] args) {
        System.out.println(maxSubarraySumCircular(new int[] {1, -2, 3, -2}) + " " + maxSubarraySumCircular(new int[] {5, -3, 5}) + " " + maxSubarraySumCircular(new int[] {-3, -2, -3}));
    }
}
```

**Output:**

```text
3 10 -2
```

**Complexity:** O(n) time, O(1) space.

</details>

### P3. Maximum subarray sum with at most one deletion

**Difficulty:** Medium · **Pattern:** Kadane with two states

Return the maximum sum of a non-empty subarray after optionally deleting one element from it (the subarray must stay non-empty after the deletion).

**Constraints:** 1 ≤ n ≤ 10⁵; −10⁴ ≤ values ≤ 10⁴.

Example: `[1, -2, 0, 3]` → `4` (delete −2); `[1, -2, -2, 3]` → `3`; `[-1, -1, -1, -1]` → `-1`.

<details>
<summary>Hint</summary>

Brute force: every subarray and every deletion, O(n³). Track two values for subarrays ending at j: `keep` (no deletion yet) and `deleted` (one element already deleted). `deleted_j = max(deleted_{j−1} + a[j], keep_{j−1})` — either the deletion happened earlier, or a[j] itself is deleted.

</details>

<details>
<summary>Answer</summary>

```java
public class MaxSubarrayOneDeletion {

    static int maximumSum(int[] a) {
        int keep = a[0], deleted = Integer.MIN_VALUE / 2, best = a[0];
        for (int j = 1; j < a.length; j++) {
            deleted = Math.max(deleted + a[j], keep);  // keep_{j-1}: delete a[j] itself
            keep = Math.max(a[j], keep + a[j]);        // plain Kadane
            best = Math.max(best, Math.max(keep, deleted));
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(maximumSum(new int[] {1, -2, 0, 3}) + " " + maximumSum(new int[] {1, -2, -2, 3}) + " " + maximumSum(new int[] {-1, -1, -1, -1}));
    }
}
```

**Output:**

```text
4 3 -1
```

**Complexity:** O(n) time, O(1) space. `deleted` is updated before `keep` so it uses the previous `keep`.

</details>
