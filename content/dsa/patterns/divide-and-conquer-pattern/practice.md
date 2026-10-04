# Divide and Conquer Pattern — Practice

### P1. Beautiful array

**Difficulty:** Medium · **Pattern:** Split by parity, transform the halves

Return any permutation of 1 … n such that for every i < k < j, `2 × a[k] ≠ a[i] + a[j]` (no element is the average of two elements on either side of it).

**Constraints:** 1 ≤ n ≤ 1000.

Example: n = 4 → `[1, 3, 2, 4]` is valid (other answers exist).

<details>
<summary>Hint</summary>

If the left part holds only odd numbers and the right part only even numbers, any pair (i, j) across the split has an odd sum, which cannot equal 2 × a[k]. Inside each part, the property survives the maps x → 2x − 1 and x → 2x (they are linear). So build a beautiful array for ⌈n/2⌉ and for ⌊n/2⌋ and transform.

</details>

<details>
<summary>Answer</summary>

**Approach:** f(n) = [2x − 1 for x in f(⌈n/2⌉)] + [2x for x in f(⌊n/2⌋)], with f(1) = [1]. A checker verifies the result.

```java
import java.util.*;

public class BeautifulArray {

    static List<Integer> beautiful(int n) {
        if (n == 1) return List.of(1);
        List<Integer> result = new ArrayList<>();
        for (int x : beautiful((n + 1) / 2)) result.add(2 * x - 1);   // odds on the left
        for (int x : beautiful(n / 2)) result.add(2 * x);             // evens on the right
        return result;
    }

    static boolean isBeautiful(List<Integer> a) {
        for (int i = 0; i < a.size(); i++)
            for (int k = i + 1; k < a.size(); k++)
                for (int j = k + 1; j < a.size(); j++)
                    if (2 * a.get(k) == a.get(i) + a.get(j)) return false;
        return true;
    }

    public static void main(String[] args) {
        System.out.println(beautiful(4) + " " + beautiful(5) + " " + isBeautiful(beautiful(50)));
    }
}
```

**Output:**

```text
[1, 3, 2, 4] [1, 5, 3, 2, 4] true
```

**Complexity:** T(n) = 2T(n/2) + O(n) → O(n log n) time, O(n log n) total allocation (O(n) live at once). Memoising f by n reduces repeated work further.

</details>

### P2. The skyline problem

**Difficulty:** Hard · **Pattern:** Split the buildings, merge two skylines

Buildings are `[left, right, height]` rectangles on a flat line. Return the skyline as key points `[x, y]`: positions where the outline's height changes to y, sorted by x, with no two consecutive points of equal height.

**Constraints:** 1 ≤ n ≤ 10⁴.

Example: `[[2, 9, 10], [3, 7, 15], [5, 12, 12], [15, 20, 10], [19, 24, 8]]` → `[[2, 10], [3, 15], [7, 12], [12, 0], [15, 10], [20, 8], [24, 0]]`.

<details>
<summary>Hint</summary>

One building's skyline is `[[left, h], [right, 0]]`. Merging two skylines is like merging sorted lists: walk both by x, tracking the current height of each; the merged height at x is max(h1, h2). Emit a point only when the merged height changes.

</details>

<details>
<summary>Answer</summary>

**Approach:** Split the building list in half, compute both skylines recursively, merge in O(n). An alternative is a sweep line with a max-heap (or `TreeMap`) of active heights, also O(n log n).

```java
import java.util.*;

public class Skyline {

    static List<int[]> skyline(int[][] b, int lo, int hi) {
        if (lo == hi) {
            List<int[]> one = new ArrayList<>();
            one.add(new int[] {b[lo][0], b[lo][2]});
            one.add(new int[] {b[lo][1], 0});
            return one;
        }
        int mid = (lo + hi) >>> 1;
        return merge(skyline(b, lo, mid), skyline(b, mid + 1, hi));
    }

    static List<int[]> merge(List<int[]> a, List<int[]> c) {
        List<int[]> out = new ArrayList<>();
        int i = 0, j = 0, h1 = 0, h2 = 0;
        while (i < a.size() || j < c.size()) {
            int x;
            if (j == c.size() || (i < a.size() && a.get(i)[0] < c.get(j)[0])) {
                x = a.get(i)[0];
                h1 = a.get(i++)[1];
            } else if (i == a.size() || c.get(j)[0] < a.get(i)[0]) {
                x = c.get(j)[0];
                h2 = c.get(j++)[1];
            } else {                                   // same x in both: advance both
                x = a.get(i)[0];
                h1 = a.get(i++)[1];
                h2 = c.get(j++)[1];
            }
            int h = Math.max(h1, h2);
            if (out.isEmpty() || out.get(out.size() - 1)[1] != h) {
                if (!out.isEmpty() && out.get(out.size() - 1)[0] == x) out.get(out.size() - 1)[1] = h;   // same x: keep the latest height
                else out.add(new int[] {x, h});
            }
        }
        return out;
    }

    public static void main(String[] args) {
        int[][] b = {{2, 9, 10}, {3, 7, 15}, {5, 12, 12}, {15, 20, 10}, {19, 24, 8}};
        System.out.println(Arrays.deepToString(skyline(b, 0, b.length - 1).toArray()));
        int[][] c = {{0, 2, 3}, {2, 5, 3}};
        System.out.println(Arrays.deepToString(skyline(c, 0, c.length - 1).toArray()));
    }
}
```

**Output:**

```text
[[2, 10], [3, 15], [7, 12], [12, 0], [15, 10], [20, 8], [24, 0]]
[[0, 3], [5, 0]]
```

**Complexity:** T(n) = 2T(n/2) + O(n) → O(n log n) time, O(n) space for the skylines (plus O(log n) recursion).

</details>
