# Binary Search — Practice

### P1. First bad version

**Difficulty:** Easy · **Pattern:** First true of a monotonic condition

Versions 1..n were released; once a version is bad, every later version is bad. Given `isBad(v)`, find the first bad version with as few calls as possible.

**Constraints:** 1 ≤ bad ≤ n ≤ 2³¹ − 1.

Example: n = 5, first bad = 4 → `4`.

<details>
<summary>Hint</summary>

`isBad` is false, …, false, true, …, true — the boundary template. Beware: n can be close to `Integer.MAX_VALUE`.

</details>

<details>
<summary>Answer</summary>

```java
public class FirstBadVersion {

    static int firstBad;
    static int calls;

    static boolean isBad(int v) {
        calls++;
        return v >= firstBad;
    }

    static int find(int n) {
        int lo = 1, hi = n;                       // the answer is guaranteed to be in [1, n]
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;         // (lo + hi) would overflow for n near 2^31
            if (isBad(mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    public static void main(String[] args) {
        firstBad = 4;
        System.out.println(find(5) + " in " + calls + " calls");
        firstBad = 1_702_766_719;
        calls = 0;
        System.out.println(find(2_126_753_390) + " in " + calls + " calls");
    }
}
```

**Output:**

```text
4 in 2 calls
1702766719 in 31 calls
```

**Complexity:** O(log n) calls, O(1) space.

</details>

### P2. Smallest letter greater than target

**Difficulty:** Easy · **Pattern:** Upper bound with wrap-around

Letters are sorted (with possible repeats). Return the smallest letter strictly greater than `target`; if none exists, wrap around to the first letter.

**Constraints:** 2 ≤ n ≤ 10⁴.

Example: `['c', 'f', 'j']`, target 'a' → 'c'; target 'c' → 'f'; target 'j' → 'c'.

<details>
<summary>Hint</summary>

This is the upper bound. An index of n means "none" — wrap with `% n`.

</details>

<details>
<summary>Answer</summary>

```java
public class NextLetter {

    static char nextGreatestLetter(char[] letters, char target) {
        int lo = 0, hi = letters.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (letters[mid] > target) hi = mid;
            else lo = mid + 1;
        }
        return letters[lo % letters.length];
    }

    public static void main(String[] args) {
        char[] letters = {'c', 'f', 'j'};
        System.out.println(nextGreatestLetter(letters, 'a') + " " + nextGreatestLetter(letters, 'c') + " " + nextGreatestLetter(letters, 'j'));
    }
}
```

**Output:**

```text
c f c
```

**Complexity:** O(log n) time, O(1) space.

</details>

### P3. Single element in a sorted array

**Difficulty:** Medium · **Pattern:** Binary search on index parity

Every element appears exactly twice except one, which appears once. The array is sorted. Find the single element in O(log n) time.

**Constraints:** 1 ≤ n ≤ 10⁵ (n is odd).

Example: `[1, 1, 2, 3, 3, 4, 4, 8, 8]` → `2`.

<details>
<summary>Hint</summary>

Before the single element, pairs start at **even** indices; after it, pairs start at odd indices. Check the pair at an even mid.

</details>

<details>
<summary>Answer</summary>

**Approach:** XOR of everything is O(n). For O(log n), make `mid` even; if `arr[mid] == arr[mid + 1]`, the pairs are still aligned, so the single element is to the right; otherwise it is at mid or to the left.

```java
public class SingleInSorted {

    static int singleNonDuplicate(int[] arr) {
        int lo = 0, hi = arr.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (mid % 2 == 1) mid--;                 // align to the start of a pair
            if (arr[mid] == arr[mid + 1]) lo = mid + 2;
            else hi = mid;
        }
        return arr[lo];
    }

    public static void main(String[] args) {
        System.out.println(singleNonDuplicate(new int[] {1, 1, 2, 3, 3, 4, 4, 8, 8}) + " " + singleNonDuplicate(new int[] {3, 3, 7, 7, 10, 11, 11}) + " " + singleNonDuplicate(new int[] {5}));
    }
}
```

**Output:**

```text
2 10 5
```

**Complexity:** O(log n) time, O(1) space.

</details>

### P4. Median of two sorted arrays

**Difficulty:** Hard · **Pattern:** Binary search on a partition

Return the median of two sorted arrays of sizes m and n in O(log(min(m, n))) time.

**Constraints:** 0 ≤ m, n ≤ 1000; m + n ≥ 1.

Example: `[1, 3]`, `[2]` → `2.0`; `[1, 2]`, `[3, 4]` → `2.5`.

<details>
<summary>Hint</summary>

Choose how many elements i to take from the shorter array A for the left half; then j = (m + n + 1)/2 − i come from B. The partition is correct when `A[i−1] ≤ B[j]` and `B[j−1] ≤ A[i]`. Binary search on i.

</details>

<details>
<summary>Answer</summary>

**Approach:** Merging takes O(m + n). Instead, binary search the cut position in the shorter array. If `A[i−1] > B[j]`, too many elements came from A → move left; if `B[j−1] > A[i]`, too few → move right. Use ±∞ for missing neighbours at the edges.

```java
public class MedianTwoSorted {

    static double median(int[] a, int[] b) {
        if (a.length > b.length) return median(b, a);       // binary search the shorter array
        int m = a.length, n = b.length, half = (m + n + 1) / 2;
        int lo = 0, hi = m;
        while (lo <= hi) {
            int i = lo + (hi - lo) / 2, j = half - i;
            int aLeft = i == 0 ? Integer.MIN_VALUE : a[i - 1];
            int aRight = i == m ? Integer.MAX_VALUE : a[i];
            int bLeft = j == 0 ? Integer.MIN_VALUE : b[j - 1];
            int bRight = j == n ? Integer.MAX_VALUE : b[j];
            if (aLeft <= bRight && bLeft <= aRight) {
                int leftMax = Math.max(aLeft, bLeft);
                if ((m + n) % 2 == 1) return leftMax;
                return (leftMax + (double) Math.min(aRight, bRight)) / 2;
            }
            if (aLeft > bRight) hi = i - 1;                 // took too many from a
            else lo = i + 1;                                // took too few from a
        }
        throw new IllegalArgumentException("inputs must be sorted");
    }

    public static void main(String[] args) {
        System.out.println(median(new int[] {1, 3}, new int[] {2}) + " " + median(new int[] {1, 2}, new int[] {3, 4}) + " " + median(new int[] {}, new int[] {7}));
    }
}
```

**Output:**

```text
2.0 2.5 7.0
```

**Complexity:** O(log(min(m, n))) time, O(1) space.

</details>
