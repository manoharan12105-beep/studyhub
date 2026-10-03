# Divide and Conquer — Practice

### P1. Which recurrence describes a function that splits an array in half, recurses on **both** halves, and does O(1) work to combine?

**Difficulty:** Easy · **Pattern:** Recurrence from code shape

- A) T(n) = T(n/2) + O(1) → O(log n)
- B) T(n) = 2T(n/2) + O(1) → O(n)
- C) T(n) = 2T(n/2) + O(n) → O(n log n)
- D) T(n) = T(n − 1) + O(1) → O(n)

<details>
<summary>Hint</summary>

Two recursive calls on half the size, constant extra work. Apply the Master Theorem with a = 2, b = 2.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) T(n) = 2T(n/2) + O(1) → O(n)

**Explanation:** n^(log₂ 2) = n dominates f(n) = 1 (Master Theorem case 1), so T(n) = O(n). Example: computing the maximum of an array by halves, or the size of a balanced tree. Recursing on only **one** half (A) is binary search.

</details>

### P2. Different ways to add parentheses

**Difficulty:** Medium · **Pattern:** Split at every operator

Given an expression of numbers and operators `+`, `-`, `*`, return the results of all possible ways to fully parenthesise it (in any order).

**Constraints:** length ≤ 20; at most 10 operators.

Example: `"2-1-1"` → `[0, 2]` ((2−1)−1 = 0, 2−(1−1) = 2).

<details>
<summary>Hint</summary>

Every parenthesisation has a **last** operator applied. For each operator, recursively compute all results of the left and right parts and combine every pair.

</details>

<details>
<summary>Answer</summary>

**Approach:** Divide at each operator, conquer both sides, combine with the operator. Subexpressions repeat across splits, so memoizing on the substring helps for longer inputs (that turns it into interval DP).

```java
import java.util.*;

public class AddParentheses {

    static List<Integer> diffWays(String expr) {
        List<Integer> results = new ArrayList<>();
        for (int i = 0; i < expr.length(); i++) {
            char op = expr.charAt(i);
            if (op == '+' || op == '-' || op == '*') {
                List<Integer> left = diffWays(expr.substring(0, i));
                List<Integer> right = diffWays(expr.substring(i + 1));
                for (int a : left) {
                    for (int b : right) {
                        results.add(op == '+' ? a + b : op == '-' ? a - b : a * b);
                    }
                }
            }
        }
        if (results.isEmpty()) results.add(Integer.parseInt(expr));   // no operator: a plain number
        return results;
    }

    public static void main(String[] args) {
        System.out.println(diffWays("2-1-1"));
        List<Integer> r = diffWays("2*3-4*5");
        Collections.sort(r);
        System.out.println(r);
    }
}
```

**Output:**

```text
[2, 0]
[-34, -14, -10, -10, 10]
```

**Complexity:** The number of results is a Catalan number in the number of operators — exponential; without memoization, subexpressions are recomputed.

</details>

### P3. Closest pair of points

**Difficulty:** Hard · **Pattern:** Split by x, check a narrow strip

Given n points in the plane, return the smallest Euclidean distance between any two of them, in O(n log² n) or better.

**Constraints:** 2 ≤ n ≤ 10⁵; coordinates fit in `int`.

Example: `(2,3), (12,30), (40,50), (5,1), (12,10), (3,4)` → `1.414…` (between (2,3) and (3,4)).

<details>
<summary>Hint</summary>

Sort by x and split at the median. With d = min(left answer, right answer), only points within d of the dividing line can form a closer crossing pair. Sort those strip points by y; each needs comparing with only the next few points whose y-difference is below d.

</details>

<details>
<summary>Answer</summary>

**Approach:** Brute force checks all pairs: O(n²). In the strip, any two points closer than d lie in a d × 2d rectangle, which can hold only a constant number of points with pairwise distance ≥ d — so each strip point is compared with O(1) neighbours. Sorting the strip at every level gives O(n log² n) (merging by y as in merge sort gives O(n log n)).

```java
import java.util.*;

public class ClosestPair {

    static double closest(int[][] pts) {
        int[][] p = pts.clone();
        Arrays.sort(p, Comparator.comparingInt(a -> a[0]));
        return solve(p, 0, p.length - 1);
    }

    private static double solve(int[][] p, int lo, int hi) {
        if (hi - lo < 3) {                                   // brute force tiny ranges
            double best = Double.MAX_VALUE;
            for (int i = lo; i <= hi; i++)
                for (int j = i + 1; j <= hi; j++) best = Math.min(best, dist(p[i], p[j]));
            return best;
        }
        int mid = lo + (hi - lo) / 2;
        int midX = p[mid][0];
        double d = Math.min(solve(p, lo, mid), solve(p, mid + 1, hi));
        List<int[]> strip = new ArrayList<>();
        for (int i = lo; i <= hi; i++) if (Math.abs(p[i][0] - midX) < d) strip.add(p[i]);
        strip.sort(Comparator.comparingInt(a -> a[1]));
        for (int i = 0; i < strip.size(); i++) {
            for (int j = i + 1; j < strip.size() && strip.get(j)[1] - strip.get(i)[1] < d; j++) {
                d = Math.min(d, dist(strip.get(i), strip.get(j)));
            }
        }
        return d;
    }

    private static double dist(int[] a, int[] b) {
        long dx = a[0] - b[0], dy = a[1] - b[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    public static void main(String[] args) {
        int[][] pts = {{2, 3}, {12, 30}, {40, 50}, {5, 1}, {12, 10}, {3, 4}};
        System.out.printf("%.4f%n", closest(pts));
        System.out.printf("%.4f%n", closest(new int[][] {{0, 0}, {10, 10}, {20, 0}, {10, 11}}));
    }
}
```

**Output:**

```text
1.4142
1.0000
```

**Complexity:** O(n log² n) time as written, O(n) space.

</details>
