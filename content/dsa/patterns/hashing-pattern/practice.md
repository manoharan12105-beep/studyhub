# Hashing Pattern — Practice

### P1. Nearby duplicate

**Difficulty:** Easy · **Pattern:** Value → last index

Return true if there are two indices i ≠ j with `nums[i] == nums[j]` and |i − j| ≤ k.

**Constraints:** 1 ≤ n ≤ 10⁵; 0 ≤ k ≤ 10⁵.

Example: `[1, 2, 3, 1]`, k = 3 → `true`; `[1, 2, 3, 1, 2, 3]`, k = 2 → `false`.

<details>
<summary>Hint</summary>

For each value, only its most recent index matters: if the latest earlier occurrence is too far, older ones are farther still.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class NearbyDuplicate {

    static boolean containsNearbyDuplicate(int[] nums, int k) {
        Map<Integer, Integer> last = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            Integer j = last.put(nums[i], i);            // put returns the previous index
            if (j != null && i - j <= k) return true;
        }
        return false;
    }

    public static void main(String[] args) {
        System.out.println(containsNearbyDuplicate(new int[] {1, 2, 3, 1}, 3) + " " + containsNearbyDuplicate(new int[] {1, 2, 3, 1, 2, 3}, 2) + " "
                + containsNearbyDuplicate(new int[] {1, 0, 1, 1}, 1));
    }
}
```

**Output:**

```text
true false true
```

**Complexity:** O(n) expected time, O(n) space. A set holding only the last k values (a sliding window) reduces space to O(k).

</details>

### P2. Four arrays summing to zero

**Difficulty:** Medium · **Pattern:** Meet in the middle with a sum → count map

Given four arrays A, B, C, D of length n, count tuples (i, j, k, l) with A[i] + B[j] + C[k] + D[l] = 0.

**Constraints:** 1 ≤ n ≤ 200; −2²⁸ ≤ values ≤ 2²⁸.

Example: A = [1, 2], B = [−2, −1], C = [−1, 2], D = [0, 2] → `2`.

<details>
<summary>Hint</summary>

Four loops are n⁴ = 1.6 × 10⁹. Count every sum A[i] + B[j] in a map (n² entries); then for each C[k] + D[l] add the count of its negation.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class FourSumCount {

    static int fourSumCount(int[] a, int[] b, int[] c, int[] d) {
        Map<Integer, Integer> pairSums = new HashMap<>();
        for (int x : a) for (int y : b) pairSums.merge(x + y, 1, Integer::sum);
        int count = 0;
        for (int x : c) for (int y : d) count += pairSums.getOrDefault(-(x + y), 0);
        return count;
    }

    public static void main(String[] args) {
        System.out.println(fourSumCount(new int[] {1, 2}, new int[] {-2, -1}, new int[] {-1, 2}, new int[] {0, 2}) + " "
                + fourSumCount(new int[] {0}, new int[] {0}, new int[] {0}, new int[] {0}));
    }
}
```

**Output:**

```text
2 1
```

**Complexity:** O(n²) expected time, O(n²) space. With |values| ≤ 2²⁸, a sum of two fits in `int`.

</details>

### P3. Number of boomerangs

**Difficulty:** Medium · **Pattern:** Per-anchor distance → count map

Given n distinct points, a boomerang is an ordered triple (i, j, k) where the distance from i to j equals the distance from i to k. Count boomerangs.

**Constraints:** 1 ≤ n ≤ 500; coordinates −10⁴ … 10⁴.

Example: `[[0, 0], [1, 0], [2, 0]]` → `2` ((1, 0, 2) and (1, 2, 0)).

<details>
<summary>Hint</summary>

Fix i as the anchor and count how many other points lie at each squared distance. If c points share a distance, they form c × (c − 1) ordered pairs (j, k).

</details>

<details>
<summary>Answer</summary>

**Approach:** Use squared distances (exact integers, no square roots). Clear the map per anchor. Checking all triples would be O(n³) ≈ 1.25 × 10⁸ with a large constant.

```java
import java.util.*;

public class Boomerangs {

    static int numberOfBoomerangs(int[][] points) {
        int total = 0;
        Map<Integer, Integer> byDistance = new HashMap<>();
        for (int[] p : points) {
            byDistance.clear();
            for (int[] q : points) {
                int dx = p[0] - q[0], dy = p[1] - q[1];
                byDistance.merge(dx * dx + dy * dy, 1, Integer::sum);
            }
            for (int c : byDistance.values()) total += c * (c - 1);   // ordered pairs (j, k)
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.println(numberOfBoomerangs(new int[][] {{0, 0}, {1, 0}, {2, 0}}) + " " + numberOfBoomerangs(new int[][] {{1, 1}, {2, 2}, {3, 3}}) + " "
                + numberOfBoomerangs(new int[][] {{1, 1}}));
    }
}
```

**Output:**

```text
2 2 0
```

**Complexity:** O(n²) expected time, O(n) space. The point itself (distance 0) has count 1 and contributes 0.

</details>
