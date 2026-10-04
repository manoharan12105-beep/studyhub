# Two Pointers — Practice

### P1. Remove duplicates from a sorted array in place

**Difficulty:** Easy · **Pattern:** Same-direction pointers (slow writer, fast reader)

Given a sorted array, keep one copy of each value at the front, in order, and return the number of unique values. Use O(1) extra space.

**Constraints:** 1 ≤ n ≤ 3 × 10⁴.

Example: `[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]` → `5`, front becomes `[0, 1, 2, 3, 4]`.

<details>
<summary>Hint</summary>

Because the array is sorted, a value is new exactly when it differs from the last value written.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class RemoveDuplicatesSorted {

    static int removeDuplicates(int[] a) {
        int slow = 1;                                  // a[0..slow-1] holds the unique values
        for (int fast = 1; fast < a.length; fast++) {
            if (a[fast] != a[slow - 1]) a[slow++] = a[fast];
        }
        return slow;
    }

    public static void main(String[] args) {
        int[] a = {0, 0, 1, 1, 1, 2, 2, 3, 3, 4};
        int k = removeDuplicates(a);
        System.out.println(k + " " + Arrays.toString(Arrays.copyOf(a, k)));
    }
}
```

**Output:**

```text
5 [0, 1, 2, 3, 4]
```

**Complexity:** O(n) time, O(1) space. Variation "keep at most two copies": compare with `a[slow − 2]` instead.

</details>

### P2. Container with the most water

**Difficulty:** Medium · **Pattern:** Opposite ends, move the limiting side

Vertical lines of heights `h[i]` stand at positions i. Choose two lines that, with the x-axis, hold the most water: area = min(h[i], h[j]) × (j − i).

**Constraints:** 2 ≤ n ≤ 10⁵; 0 ≤ h[i] ≤ 10⁴.

Example: `[1, 8, 6, 2, 5, 4, 8, 3, 7]` → `49` (lines at 1 and 8: min(8, 7) × 7).

<details>
<summary>Hint</summary>

Start with the widest pair. The shorter line limits the area; keeping it while moving the taller line inward can only shrink the width without raising the limit. So move the shorter line.

</details>

<details>
<summary>Answer</summary>

**Approach:** If `h[left] < h[right]`, every pair (left, k) with k < right has width smaller than the current one and height at most `h[left]`, so none beats the current area — `left` can be discarded. Checking all pairs is O(n²).

```java
public class ContainerMostWater {

    static int maxArea(int[] h) {
        int left = 0, right = h.length - 1, best = 0;
        while (left < right) {
            best = Math.max(best, Math.min(h[left], h[right]) * (right - left));
            if (h[left] < h[right]) left++;            // the shorter side cannot do better
            else right--;
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(maxArea(new int[] {1, 8, 6, 2, 5, 4, 8, 3, 7}) + " " + maxArea(new int[] {1, 1}));
    }
}
```

**Output:**

```text
49 1
```

**Complexity:** O(n) time, O(1) space.

</details>

### P3. Trapping rain water

**Difficulty:** Hard · **Pattern:** Opposite ends with running maxima

Bars of width 1 have heights `h[i]`. How much rain water is trapped between them?

**Constraints:** 1 ≤ n ≤ 2 × 10⁴; 0 ≤ h[i] ≤ 10⁵.

Example: `[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]` → `6`.

<details>
<summary>Hint</summary>

Water above bar i = min(max height to its left, max height to its right) − h[i]. Two prefix/suffix max arrays give O(n) time and O(n) space. With two pointers: whichever side has the smaller running maximum already knows its water level.

</details>

<details>
<summary>Answer</summary>

**Approach:** Keep `leftMax` and `rightMax`. If `leftMax < rightMax`, the bar at `left` is bounded by `leftMax` (the right side has something at least as tall), so its water is `leftMax − h[left]`; advance `left`. Otherwise process `right` symmetrically.

```java
public class TrappingRainWater {

    static int trap(int[] h) {
        int left = 0, right = h.length - 1, leftMax = 0, rightMax = 0, water = 0;
        while (left <= right) {
            leftMax = Math.max(leftMax, h[left]);
            rightMax = Math.max(rightMax, h[right]);
            if (leftMax < rightMax) {
                water += leftMax - h[left];            // left side is the binding wall
                left++;
            } else {
                water += rightMax - h[right];
                right--;
            }
        }
        return water;
    }

    public static void main(String[] args) {
        System.out.println(trap(new int[] {0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1}) + " " + trap(new int[] {4, 2, 0, 3, 2, 5}) + " " + trap(new int[] {5}));
    }
}
```

**Output:**

```text
6 9 0
```

**Complexity:** O(n) time, O(1) space. A [monotonic stack](../monotonic-stack/content.md) solution also works in O(n), computing water layer by layer.

</details>
