# Monotonic Stack

## What Is the Pattern

A **monotonic stack** keeps its elements (usually array indices) in increasing or decreasing order of value. Before pushing a new element, it pops every element that would break the order — and **the moment an element is popped is the moment its answer is known**: the new element is its next greater (or smaller) element.

Tiny example: next greater element for `[2, 1, 3]`. Push 2; push 1 (smaller, order kept); 3 arrives and pops 1 (next greater of 1 is 3) and 2 (next greater of 2 is 3); 3 has none.

The stack itself is covered in [Stack](../../data-structures/stack/content.md).

## Why It Works

Suppose we scan left to right looking for each element's next greater value. An element waiting on the stack has not yet seen anything greater. If a new value x is greater than the top, x is the **first** greater value to the right of the top (anything between them was smaller, or it would have popped the top earlier). Elements below the top are larger than the top, so once x stops popping, the remaining stack is still decreasing — the invariant holds.

Each index is pushed once and popped at most once, so the whole scan is O(n) despite the inner `while` loop ([Amortized Analysis](../../fundamentals/amortized-analysis/content.md)). The brute force checks, for each element, everything to its right: O(n²).

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "Next greater / next smaller / previous greater / previous smaller element" | the direct use |
| "How many days until a warmer temperature", "how far until …" | distance to the next greater element |
| "Largest rectangle", "maximal area", "span" | each bar's extent = distance between previous and next smaller |
| "Remove k digits to get the smallest number", "smallest subsequence" | greedy: pop larger earlier digits while allowed |
| Sum over all subarrays of their minimum/maximum | each element's contribution needs previous/next smaller boundaries |
| O(n) required on an array with "nearest" comparisons | brute force is O(n²) |

## Typical Problem Structure

- Input: an array of numbers (heights, temperatures, prices, digits), sometimes circular.
- Output: an array of the same length (next greater values, distances) or one aggregate (max area, total sum).
- Decide: **direction** (scan left→right for "next", right→left or pop-time for "previous"), **order** (decreasing stack for next greater, increasing stack for next smaller), and **strictness** (`<` vs `<=` decides how equal values are treated).

## Template

```pseudocode
// next greater element to the right (−1 if none)
result[0 … n−1] ← −1
stack ← empty                         // indices; values decreasing from bottom to top
for i from 0 to n − 1:
    while stack not empty and a[stack.top] < a[i]:
        result[stack.pop()] ← a[i]    // a[i] is the first greater value to the right
    stack.push(i)
```

## Java Template

```java
import java.util.*;

public class MonotonicStackTemplates {

    static int[] nextGreater(int[] a) {
        int[] result = new int[a.length];
        Arrays.fill(result, -1);
        Deque<Integer> stack = new ArrayDeque<>();         // indices with decreasing values
        for (int i = 0; i < a.length; i++) {
            while (!stack.isEmpty() && a[stack.peek()] < a[i]) result[stack.pop()] = a[i];
            stack.push(i);
        }
        return result;
    }

    static int[] previousSmallerIndex(int[] a) {
        int[] result = new int[a.length];
        Deque<Integer> stack = new ArrayDeque<>();         // indices with increasing values
        for (int i = 0; i < a.length; i++) {
            while (!stack.isEmpty() && a[stack.peek()] >= a[i]) stack.pop();
            result[i] = stack.isEmpty() ? -1 : stack.peek();
            stack.push(i);
        }
        return result;
    }

    public static void main(String[] args) {
        int[] a = {2, 1, 2, 4, 3};
        System.out.println(Arrays.toString(nextGreater(a)) + " " + Arrays.toString(previousSmallerIndex(a)));
    }
}
```

**Output:**

```text
[4, 2, 4, -1, -1] [-1, -1, 1, 2, 2]
```

## Example Problem

**Days until a warmer temperature.** For each day, return how many days you must wait for a strictly warmer temperature (0 if never). Example: `[73, 74, 75, 71, 69, 72, 76, 73]` → `[1, 1, 4, 2, 1, 1, 0, 0]`.

- **Brute force:** for each day scan forward — O(n²), 10¹⁰ for n = 10⁵.
- **Observation:** this is "next greater element", reporting the index distance instead of the value. Days still waiting for a warmer day form a non-increasing sequence — exactly the stack.

```java
import java.util.*;

public class DailyTemperatures {

    static int[] dailyTemperatures(int[] t) {
        int[] wait = new int[t.length];
        Deque<Integer> stack = new ArrayDeque<>();         // days still waiting, temperatures non-increasing
        for (int i = 0; i < t.length; i++) {
            while (!stack.isEmpty() && t[stack.peek()] < t[i]) {
                int day = stack.pop();
                wait[day] = i - day;                       // today is the first warmer day for `day`
            }
            stack.push(i);
        }
        return wait;                                       // days left on the stack keep 0
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(dailyTemperatures(new int[] {73, 74, 75, 71, 69, 72, 76, 73})));
        System.out.println(Arrays.toString(dailyTemperatures(new int[] {30, 30, 40})));
    }
}
```

**Output:**

```text
[1, 1, 4, 2, 1, 1, 0, 0]
[2, 1, 0]
```

## Dry Run

`t = [73, 74, 75, 71, 69, 72, 76, 73]` (stack shows indices, bottom → top):

| i | t[i] | Popped (wait set) | Stack after |
|---|------|-------------------|-------------|
| 0 | 73 | — | [0] |
| 1 | 74 | 0 (1) | [1] |
| 2 | 75 | 1 (1) | [2] |
| 3 | 71 | — | [2, 3] |
| 4 | 69 | — | [2, 3, 4] |
| 5 | 72 | 4 (1), 3 (2) | [2, 5] |
| 6 | 76 | 5 (1), 2 (4) | [6] |
| 7 | 73 | — | [6, 7] |

Indices 6 and 7 remain — no warmer day, wait 0. Every index was pushed once and popped at most once.

## Common Mistakes

- Pushing values instead of indices when distances or positions are needed.
- Wrong strictness: `<` vs `<=` changes how equal values behave (e.g. `[30, 30, 40]` must wait for a **strictly** warmer day).
- Forgetting the elements left on the stack at the end (they have no next greater — default value).
- Using `java.util.Stack` (synchronized, legacy) instead of `ArrayDeque`.
- For circular arrays, scanning once instead of twice (indices `i % n`).

## Variations

- **Next smaller:** keep an increasing stack (pop while top > current).
- **Previous greater/smaller:** read the top after popping, before pushing.
- **Circular next greater:** loop i from 0 to 2n − 1 using `i % n`, push only in the first pass.
- **Largest rectangle in a histogram:** width of bar i = nextSmaller − previousSmaller − 1.
- **Sum of subarray minimums:** contribution of a[i] = a[i] × (i − prev) × (next − i), with one side strict to avoid double counting.
- **Greedy digit removal / smallest subsequence:** pop larger digits while removals remain.
- **Window extremes over a sliding window:** a deque version — [Monotonic Queue](../monotonic-queue/content.md).

## Complexity

| Task | Time | Space |
|------|------|-------|
| Next/previous greater or smaller for all n | O(n) amortized total | O(n) stack |
| Largest rectangle | O(n) | O(n) |
| Circular variant | O(n) (2n iterations) | O(n) |

## When Not to Use It

- You need the maximum/minimum of a **window that slides** (elements leave from the front) — use a monotonic deque.
- Arbitrary range queries (max of any [l, r]) — use a [sparse table](../../data-structures/sparse-table/content.md) or segment tree.
- "Next greater" by a criterion that is not a simple comparison of the current element with earlier ones.

## Key Takeaways

- Keep indices in monotone order; popping an element = its next greater/smaller has arrived.
- Decreasing stack → next greater; increasing stack → next smaller; check strictness.
- Each index is pushed and popped at most once: O(n).
