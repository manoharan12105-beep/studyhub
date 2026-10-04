# Prefix Sum — Practice

### P1. Pivot index

**Difficulty:** Easy · **Pattern:** Total minus left prefix

Return the leftmost index where the sum of elements strictly to the left equals the sum strictly to the right, or −1.

**Constraints:** 1 ≤ n ≤ 10⁴; −1000 ≤ values ≤ 1000.

Example: `[1, 7, 3, 6, 5, 6]` → `3` (1 + 7 + 3 = 11 = 5 + 6); `[2, 1, -1]` → `0` (left sum 0, right sum 0).

<details>
<summary>Hint</summary>

With the total known, the right sum at i is `total − left − a[i]`. Keep `left` as a running prefix.

</details>

<details>
<summary>Answer</summary>

```java
public class PivotIndex {

    static int pivotIndex(int[] a) {
        int total = 0;
        for (int v : a) total += v;
        int left = 0;
        for (int i = 0; i < a.length; i++) {
            if (left == total - left - a[i]) return i;
            left += a[i];
        }
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(pivotIndex(new int[] {1, 7, 3, 6, 5, 6}) + " " + pivotIndex(new int[] {2, 1, -1}) + " " + pivotIndex(new int[] {1, 2, 3}));
    }
}
```

**Output:**

```text
3 0 -1
```

**Complexity:** O(n) time, O(1) space — a prefix sum does not always need an array.

</details>

### P2. Longest subarray with equal 0s and 1s

**Difficulty:** Medium · **Pattern:** Value transform + first occurrence of each prefix

Given a binary array, return the length of the longest contiguous subarray with an equal number of 0s and 1s.

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: `[0, 1, 0]` → `2`; `[0, 1, 1, 1, 0, 0]` → `6`.

<details>
<summary>Hint</summary>

Count 0 as −1 and 1 as +1. A balanced subarray has sum 0, which means two equal prefix sums. For the longest one, remember the **first** index at which each prefix value appeared.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class ContiguousBalanced {

    static int findMaxLength(int[] a) {
        Map<Integer, Integer> first = new HashMap<>();
        first.put(0, -1);                                  // empty prefix "ends" at index −1
        int running = 0, best = 0;
        for (int i = 0; i < a.length; i++) {
            running += a[i] == 1 ? 1 : -1;
            Integer j = first.putIfAbsent(running, i);     // keep the earliest index only
            if (j != null) best = Math.max(best, i - j);
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(findMaxLength(new int[] {0, 1, 0}) + " " + findMaxLength(new int[] {0, 1, 1, 1, 0, 0}) + " " + findMaxLength(new int[] {1, 1}));
    }
}
```

**Output:**

```text
2 6 0
```

**Complexity:** O(n) time and space. Running sums range over [−n, n], so an array of size 2n + 1 can replace the map.

</details>

### P3. Number of submatrices that sum to a target

**Difficulty:** Hard · **Pattern:** Fix a row band, then 1D "subarray sum equals k"

Count the non-empty rectangular submatrices whose elements sum to `target`.

**Constraints:** 1 ≤ rows, cols ≤ 100; −1000 ≤ values ≤ 1000.

Example: `[[0, 1, 0], [1, 1, 1], [0, 1, 0]]`, target 0 → `4` (the four corner cells); `[[1, -1], [-1, 1]]`, target 0 → `5`.

<details>
<summary>Hint</summary>

Enumerating all rectangles with a 2D prefix sum is O(R² C²) ≈ 10⁸ — borderline. Instead fix the top and bottom rows; collapse each column of that band into one number. Now count subarrays of this 1D array with sum `target` using the prefix + hash map method.

</details>

<details>
<summary>Answer</summary>

**Approach:** For each top row, extend the bottom row downward while maintaining `colSum[c]` (sum of column c within the band). Each band costs O(C) with the hash-map count.

```java
import java.util.*;

public class SubmatrixSumTarget {

    static int numSubmatrixSumTarget(int[][] m, int target) {
        int rows = m.length, cols = m[0].length, count = 0;
        for (int top = 0; top < rows; top++) {
            int[] colSum = new int[cols];
            for (int bottom = top; bottom < rows; bottom++) {
                for (int c = 0; c < cols; c++) colSum[c] += m[bottom][c];   // extend the band by one row
                Map<Integer, Integer> seen = new HashMap<>();
                seen.put(0, 1);
                int running = 0;
                for (int c = 0; c < cols; c++) {
                    running += colSum[c];
                    count += seen.getOrDefault(running - target, 0);
                    seen.merge(running, 1, Integer::sum);
                }
            }
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(numSubmatrixSumTarget(new int[][] {{0, 1, 0}, {1, 1, 1}, {0, 1, 0}}, 0) + " "
                + numSubmatrixSumTarget(new int[][] {{1, -1}, {-1, 1}}, 0) + " " + numSubmatrixSumTarget(new int[][] {{904}}, 0));
    }
}
```

**Output:**

```text
4 5 0
```

**Complexity:** O(R² × C) time, O(C) space. Choose the smaller dimension for the band loops if R > C.

</details>
