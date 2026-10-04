# Monotonic Queue

## What Is the Pattern

A **monotonic queue** is a deque of indices whose values stay in decreasing order (for maxima) or increasing order (for minima). It maintains the maximum or minimum of a **sliding window** in O(1) amortized per step:

- **Back:** before adding index i, remove from the back every index whose value is ≤ a[i] — those can never be a window maximum again.
- **Front:** remove the front index if it has left the window.
- **Answer:** the front is the current window's maximum.

Tiny example: maximum of each window of size 2 in `[1, 3, 2]`: windows [1, 3] → 3, [3, 2] → 3.

The deque itself is covered in [Queue](../../data-structures/queue/content.md).

## Why It Works

If j < i and a[j] ≤ a[i], then index j leaves the window **before** i and is never larger than i while both are inside — j is **dominated** and can be discarded forever. After discarding dominated indices, the deque holds a decreasing sequence of candidates; the oldest (front) is the largest. Each index enters once and leaves once, so n steps cost O(n) in total, instead of O(n × k) for rescanning each window.

The same structure speeds up DP transitions of the form `dp[i] = a[i] + max(dp[i − k … i − 1])` from O(n × k) to O(n).

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "Maximum/minimum of every window of size k" | the direct use |
| Sliding window whose validity depends on the window's max or min (e.g. max − min ≤ limit) | two deques, one for max and one for min |
| DP where `dp[i]` depends on the best `dp[j]` for j in a sliding range [i − k, i − 1] | window maximum over dp values |
| Shortest subarray with sum ≥ K when values can be **negative** | increasing deque of prefix sums |
| O(n) required and a heap would give O(n log n) | deque beats the heap |

## Typical Problem Structure

- Input: an array and a window size k (or a distance limit), sometimes a target sum.
- Output: an array of window extremes, a maximum DP value, or a shortest length.
- What the deque stores: indices (to check expiry) of either the raw values, DP values, or prefix sums.

## Template

```pseudocode
deque ← empty                                   // indices, values decreasing front → back
for i from 0 to n − 1:
    while deque not empty and a[deque.back] ≤ a[i]: deque.popBack()      // dominated
    deque.pushBack(i)
    if deque.front ≤ i − k: deque.popFront()                             // expired
    if i ≥ k − 1: output a[deque.front]                                  // window [i − k + 1, i]
```

## Java Template

```java
import java.util.*;

public class MonotonicQueueTemplate {

    // Minimum of every window of size k (increasing deque).
    static int[] windowMin(int[] a, int k) {
        int[] result = new int[a.length - k + 1];
        Deque<Integer> dq = new ArrayDeque<>();
        for (int i = 0; i < a.length; i++) {
            while (!dq.isEmpty() && a[dq.peekLast()] >= a[i]) dq.pollLast();
            dq.offerLast(i);
            if (dq.peekFirst() <= i - k) dq.pollFirst();
            if (i >= k - 1) result[i - k + 1] = a[dq.peekFirst()];
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(windowMin(new int[] {4, 2, 12, 3, 8, 1, 7}, 3)));
    }
}
```

**Output:**

```text
[2, 2, 3, 1, 1]
```

## Example Problem

**Sliding window maximum.** Return the maximum of every contiguous window of size k. Example: `[1, 3, -1, -3, 5, 3, 6, 7]`, k = 3 → `[3, 3, 5, 5, 6, 7]`.

- **Brute force:** scan each window — O(n × k), 10¹⁰ for n = 10⁵, k = 10⁵/2.
- **Heap:** max-heap of (value, index), lazily discarding expired tops — O(n log n).
- **Observation:** a smaller element to the left of a larger one is useless for all future windows. Discard it; the remaining candidates are decreasing, and the front is the answer.

```java
import java.util.*;

public class SlidingWindowMaximum {

    static int[] maxSlidingWindow(int[] a, int k) {
        int[] result = new int[a.length - k + 1];
        Deque<Integer> dq = new ArrayDeque<>();        // indices, values decreasing front → back
        for (int i = 0; i < a.length; i++) {
            while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();   // dominated by a[i]
            dq.offerLast(i);
            if (dq.peekFirst() <= i - k) dq.pollFirst();                       // left the window
            if (i >= k - 1) result[i - k + 1] = a[dq.peekFirst()];
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(maxSlidingWindow(new int[] {1, 3, -1, -3, 5, 3, 6, 7}, 3)) + " " + Arrays.toString(maxSlidingWindow(new int[] {9, 8, 7}, 1)));
    }
}
```

**Output:**

```text
[3, 3, 5, 5, 6, 7] [9, 8, 7]
```

## Dry Run

`a = [1, 3, -1, -3, 5, 3, 6, 7]`, k = 3 (deque shows indices with values):

| i | a[i] | Popped from back | Expired from front | Deque after | Output |
|---|------|------------------|--------------------|-------------|--------|
| 0 | 1 | — | — | [0:1] | — |
| 1 | 3 | 0 | — | [1:3] | — |
| 2 | −1 | — | — | [1:3, 2:−1] | 3 |
| 3 | −3 | — | — | [1:3, 2:−1, 3:−3] | 3 |
| 4 | 5 | 3, 2, 1 | — | [4:5] | 5 |
| 5 | 3 | — | — | [4:5, 5:3] | 5 |
| 6 | 6 | 5, 4 | — | [6:6] | 6 |
| 7 | 7 | 6 | — | [7:7] | 7 |

At i = 4 index 1 would also have expired (1 ≤ 4 − 3), but it was already popped from the back as dominated.

## Common Mistakes

- Storing values instead of indices — expiry cannot be checked.
- Checking expiry with `<` instead of `<=` (`front ≤ i − k` means the index is outside `[i − k + 1, i]`).
- Using `<` vs `<=` inconsistently when popping dominated elements — both work for maxima, but be deliberate with duplicates.
- Producing output before the first full window (`i ≥ k − 1`).
- Reaching for a `PriorityQueue` and forgetting that removing an arbitrary expired element is O(n).

## Variations

- **Window minimum:** increasing deque (pop while back ≥ current).
- **Max − min ≤ limit:** variable window with two deques; shrink while `a[maxFront] − a[minFront] > limit`.
- **DP with a window:** `dp[i] = a[i] + max(dp[i − k … i − 1])` — deque over dp values (jump game with a step limit, constrained subsequence sum).
- **Shortest subarray with sum ≥ K (negatives allowed):** increasing deque of prefix sums; pop the front while `prefix[i] − prefix[front] ≥ K`.
- **Without expiry:** when elements never leave from the front, it degenerates into a [Monotonic Stack](../monotonic-stack/content.md).

## Complexity

| Task | Time | Space |
|------|------|-------|
| All window maxima/minima | O(n) amortized — each index pushed and popped once | O(k) deque |
| DP with window max | O(n) instead of O(n × k) | O(n) dp + O(k) deque |
| Heap alternative | O(n log n) | O(n) |

## When Not to Use It

- Arbitrary (non-sliding) range max queries — use a [sparse table](../../data-structures/sparse-table/content.md) or [segment tree](../../data-structures/segment-tree/content.md).
- The window does not move monotonically (left end jumps backwards).
- Only the global maximum is needed — a single variable suffices.

## Key Takeaways

- Deque of indices with monotone values; pop dominated elements from the back, expired ones from the front.
- The front is the window's max (or min); O(1) amortized per step.
- Also turns sliding-range DP transitions from O(n × k) into O(n).
