# Binary Search Variations — Practice

### P1. Search in a bitonic array

**Difficulty:** Medium · **Pattern:** Peak + two binary searches

A bitonic array strictly increases and then strictly decreases. Return the index of `target` or −1, in O(log n).

**Constraints:** 3 ≤ n ≤ 10⁵; values distinct.

Example: `[1, 3, 8, 12, 4, 2]`, target 4 → `4`; target 13 → `-1`.

<details>
<summary>Hint</summary>

Find the peak first. Then the left part is ascending and the right part is descending — search each with a direction-aware binary search.

</details>

<details>
<summary>Answer</summary>

```java
public class BitonicSearch {

    static int search(int[] arr, int target) {
        int peak = peakIndex(arr);
        int left = binarySearch(arr, target, 0, peak, true);
        return left != -1 ? left : binarySearch(arr, target, peak + 1, arr.length - 1, false);
    }

    static int peakIndex(int[] arr) {
        int lo = 0, hi = arr.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] < arr[mid + 1]) lo = mid + 1; else hi = mid;
        }
        return lo;
    }

    static int binarySearch(int[] arr, int target, int lo, int hi, boolean ascending) {
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] == target) return mid;
            boolean goRight = ascending ? arr[mid] < target : arr[mid] > target;
            if (goRight) lo = mid + 1; else hi = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] arr = {1, 3, 8, 12, 4, 2};
        System.out.println(search(arr, 4) + " " + search(arr, 13) + " " + search(arr, 1) + " " + search(arr, 12));
    }
}
```

**Output:**

```text
4 -1 0 3
```

**Complexity:** O(log n) time (three binary searches), O(1) space.

</details>

### P2. Minimum of a rotated array with duplicates

**Difficulty:** Medium · **Pattern:** Shrink when undecidable

Find the minimum of a rotated sorted array that may contain duplicates.

**Constraints:** 1 ≤ n ≤ 5000.

Example: `[2, 2, 2, 0, 1]` → `0`; `[1, 3, 3]` → `1`; `[3, 1, 3, 3, 3]` → `1`.

<details>
<summary>Hint</summary>

When `arr[mid] == arr[hi]`, either side could hold the minimum, but `arr[hi]` is safe to discard because `arr[mid]` has the same value.

</details>

<details>
<summary>Answer</summary>

```java
public class MinRotatedDuplicates {

    static int findMin(int[] arr) {
        int lo = 0, hi = arr.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] > arr[hi]) lo = mid + 1;
            else if (arr[mid] < arr[hi]) hi = mid;
            else hi--;                              // equal: drop hi, a copy of its value remains at mid
        }
        return arr[lo];
    }

    public static void main(String[] args) {
        System.out.println(findMin(new int[] {2, 2, 2, 0, 1}) + " " + findMin(new int[] {1, 3, 3}) + " " + findMin(new int[] {3, 1, 3, 3, 3}) + " " + findMin(new int[] {1, 1, 1}));
    }
}
```

**Output:**

```text
0 1 1 1
```

**Complexity:** O(log n) average, O(n) worst case (e.g. all equal except one), O(1) space. No algorithm can beat O(n) worst case here: with all values equal but one, every element may need to be inspected.

</details>

### P3. Peak element in a 2D grid

**Difficulty:** Hard · **Pattern:** Binary search on columns

Find any cell strictly greater than its up/down/left/right neighbours (outside the grid counts as −1). Adjacent cells are never equal.

**Constraints:** 1 ≤ r, c ≤ 500; values distinct between neighbours.

Example: `[[1,4],[3,2]]` → `[0,1]` (4) or `[1,0]` (3).

<details>
<summary>Hint</summary>

Binary search over columns. In the middle column, take the row with the maximum value; compare with its left and right neighbours and move toward a larger one.

</details>

<details>
<summary>Answer</summary>

**Approach:** The column maximum beats its up/down neighbours by definition. If its right neighbour is larger, a peak exists in the right half — follow the uphill direction, as in 1D. Each step halves the columns and scans one column: O(r log c).

```java
import java.util.Arrays;

public class PeakGrid {

    static int[] findPeak(int[][] grid) {
        int lo = 0, hi = grid[0].length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            int bestRow = 0;
            for (int r = 1; r < grid.length; r++) {
                if (grid[r][mid] > grid[bestRow][mid]) bestRow = r;
            }
            int left = mid > 0 ? grid[bestRow][mid - 1] : -1;
            int right = mid < grid[0].length - 1 ? grid[bestRow][mid + 1] : -1;
            int value = grid[bestRow][mid];
            if (value > left && value > right) return new int[] {bestRow, mid};
            if (right > value) lo = mid + 1;
            else hi = mid - 1;
        }
        return new int[] {-1, -1};                 // unreachable for valid input
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(findPeak(new int[][] {{1, 4}, {3, 2}})));
        System.out.println(Arrays.toString(findPeak(new int[][] {{10, 20, 15}, {21, 30, 14}, {7, 16, 32}})));
    }
}
```

**Output:**

```text
[1, 0]
[1, 1]
```

**Complexity:** O(r log c) time, O(1) space.

</details>
