# Monotonic Stack — Practice

### P1. Final prices with a discount

**Difficulty:** Easy · **Pattern:** Next smaller-or-equal element

Item i costs `prices[i]`. Buying item i gives a discount equal to `prices[j]` for the first j > i with `prices[j] ≤ prices[i]` (no discount if none). Return the final prices.

**Constraints:** 1 ≤ n ≤ 500.

Example: `[8, 4, 6, 2, 3]` → `[4, 2, 4, 2, 3]`.

<details>
<summary>Hint</summary>

The discount for i is its next smaller-or-equal element. Keep a stack of indices with strictly increasing prices; a new price ≤ the top pays the top's discount.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class FinalPrices {

    static int[] finalPrices(int[] prices) {
        int[] result = prices.clone();
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < prices.length; i++) {
            while (!stack.isEmpty() && prices[stack.peek()] >= prices[i]) {
                int j = stack.pop();
                result[j] = prices[j] - prices[i];      // first later price ≤ prices[j]
            }
            stack.push(i);
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(finalPrices(new int[] {8, 4, 6, 2, 3})) + " " + Arrays.toString(finalPrices(new int[] {10, 1, 1, 6})));
    }
}
```

**Output:**

```text
[4, 2, 4, 2, 3] [9, 0, 1, 6]
```

**Complexity:** O(n) time, O(n) space. The pop condition uses `>=` because an equal price also counts as a discount.

</details>

### P2. Next greater element in a circular array

**Difficulty:** Medium · **Pattern:** Two passes with indices mod n

In a circular array (the element after the last is the first), return each element's next greater value, or −1.

**Constraints:** 1 ≤ n ≤ 10⁴.

Example: `[1, 2, 1]` → `[2, -1, 2]`; `[1, 2, 3, 4, 3]` → `[2, 3, 4, -1, 4]`.

<details>
<summary>Hint</summary>

Walk i from 0 to 2n − 1 and use `a[i % n]`: the second lap lets elements near the end find greater values near the start. Push indices only during the first lap.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class NextGreaterCircular {

    static int[] nextGreaterElements(int[] a) {
        int n = a.length;
        int[] result = new int[n];
        Arrays.fill(result, -1);
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < 2 * n; i++) {
            int v = a[i % n];
            while (!stack.isEmpty() && a[stack.peek()] < v) result[stack.pop()] = v;
            if (i < n) stack.push(i);                   // second lap only resolves, never adds
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(nextGreaterElements(new int[] {1, 2, 1})) + " " + Arrays.toString(nextGreaterElements(new int[] {1, 2, 3, 4, 3})));
    }
}
```

**Output:**

```text
[2, -1, 2] [2, 3, 4, -1, 4]
```

**Complexity:** O(n) time, O(n) space.

</details>

### P3. Remove k digits for the smallest number

**Difficulty:** Medium · **Pattern:** Greedy increasing stack

Remove exactly k digits from the decimal string `num` to make the smallest possible number; return it without leading zeros (`"0"` if empty).

**Constraints:** 1 ≤ k ≤ |num| ≤ 10⁵.

Example: `"1432219"`, k = 3 → `"1219"`; `"10200"`, k = 1 → `"200"`; `"10"`, k = 2 → `"0"`.

<details>
<summary>Hint</summary>

A number is smaller if an earlier digit is smaller. Scanning left to right, while the previous kept digit is larger than the current one and removals remain, remove it. Remove any leftover k from the end.

</details>

<details>
<summary>Answer</summary>

**Approach:** The kept digits form a non-decreasing stack. Removing a larger digit before a smaller one always improves the number at the first differing position.

```java
public class RemoveKDigits {

    static String removeKdigits(String num, int k) {
        StringBuilder stack = new StringBuilder();
        for (char c : num.toCharArray()) {
            while (k > 0 && stack.length() > 0 && stack.charAt(stack.length() - 1) > c) {
                stack.deleteCharAt(stack.length() - 1);  // a larger earlier digit: drop it
                k--;
            }
            stack.append(c);
        }
        stack.setLength(stack.length() - k);           // still need removals: the tail is the largest part
        int start = 0;
        while (start < stack.length() - 1 && stack.charAt(start) == '0') start++;
        return stack.length() == 0 ? "0" : stack.substring(start);
    }

    public static void main(String[] args) {
        System.out.println(removeKdigits("1432219", 3) + " " + removeKdigits("10200", 1) + " " + removeKdigits("10", 2) + " " + removeKdigits("112", 1));
    }
}
```

**Output:**

```text
1219 200 0 11
```

**Complexity:** O(n) time, O(n) space.

</details>

### P4. Largest rectangle in a histogram

**Difficulty:** Hard · **Pattern:** Previous and next smaller boundaries

Bars of width 1 have heights `h[i]`. Return the area of the largest rectangle that fits under the histogram.

**Constraints:** 1 ≤ n ≤ 10⁵; 0 ≤ h[i] ≤ 10⁴.

Example: `[2, 1, 5, 6, 2, 3]` → `10` (heights 5 and 6, width 2).

<details>
<summary>Hint</summary>

The best rectangle with bar i as its shortest bar spans from just after the previous smaller bar to just before the next smaller bar. With an increasing stack, when bar i pops bar j, i is j's next smaller and the new top is j's previous smaller.

</details>

<details>
<summary>Answer</summary>

**Approach:** Append a sentinel height 0 at the end so every bar gets popped. Trying every pair of boundaries is O(n²).

```java
import java.util.*;

public class LargestRectangle {

    static int largestRectangleArea(int[] h) {
        Deque<Integer> stack = new ArrayDeque<>();       // indices with increasing heights
        int best = 0;
        for (int i = 0; i <= h.length; i++) {
            int cur = i == h.length ? 0 : h[i];          // sentinel flushes the stack
            while (!stack.isEmpty() && h[stack.peek()] >= cur) {
                int height = h[stack.pop()];
                int left = stack.isEmpty() ? -1 : stack.peek();   // previous smaller
                best = Math.max(best, height * (i - left - 1));   // i is the next smaller
            }
            stack.push(i);
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(largestRectangleArea(new int[] {2, 1, 5, 6, 2, 3}) + " " + largestRectangleArea(new int[] {2, 4}) + " " + largestRectangleArea(new int[] {3, 3, 3}));
    }
}
```

**Output:**

```text
10 4 9
```

**Complexity:** O(n) time, O(n) space. Popping on `>=` handles equal heights: the last bar of a run of equal heights computes the full width.

</details>
