# Brute Force to Optimal

## Definition

**Brute force to optimal** is the habit of starting from the simplest correct solution and improving it step by step, each step removing one specific kind of wasted work, until the complexity meets the constraints. Each intermediate version is correct; only its cost changes. This is how strong candidates arrive at optimal solutions in interviews — not by recalling them, but by deriving them.

## Why It Matters

- A brute force is almost always findable, and it proves you understand the problem.
- Each optimisation step is explainable ("the inner loop recomputes a sum we already had"), which is exactly what interviewers want to hear.
- The same few optimisation moves recur across hundreds of problems, so practising the progressions builds pattern recognition.

## Core Concept

Find the **wasted work** in the current solution and remove it with a standard move:

| Wasted work | Optimisation move | Typical gain |
|-------------|-------------------|--------------|
| Recomputing a sum/aggregate that differs by one element from the previous one | keep a running value / [prefix sums](../../patterns/prefix-sum/content.md) | O(n) factor |
| Searching for a partner element | [hash map](../../patterns/hashing-pattern/content.md) or sorting + [two pointers](../../patterns/two-pointers/content.md) / binary search | O(n) → O(1) or O(log n) per lookup |
| Rebuilding a window | [sliding window](../../patterns/sliding-window/content.md) | O(k) → O(1) per step |
| Re-solving identical subproblems | memoisation / [DP](../../patterns/dp-pattern/content.md) | exponential → polynomial |
| Rescanning for the next larger/smaller | [monotonic stack](../../patterns/monotonic-stack/content.md) | O(n²) → O(n) |
| Repeated min/max of a changing set | heap ([top K](../../patterns/top-k-elements/content.md)) or monotonic deque | O(n) → O(log n) or O(1) |
| Keeping information that can never matter again | discard it (keep only the best candidate so far) | memory and time |
| Trying every candidate answer | [binary search on the answer](../../patterns/binary-search-on-answer/content.md) | O(range) → O(log range) checks |

Two questions guide the process: **what is the best conceivable runtime?** (usually O(n) — you must read the input) and **what does the current solution compute more than once?**

## How It Works

1. Write the brute force and its complexity.
2. Point at the innermost loop or the repeated recursive call and ask what it recomputes.
3. Apply one move from the table; re-check correctness on an example.
4. Recompute the complexity; stop when it fits the constraints ([Constraints and Complexity](../constraints-and-complexity/content.md)) or reaches the best conceivable runtime.
5. Then reduce space if possible (rolling variables instead of arrays).

### Worked progression: maximum subarray sum

Problem: given an integer array (values may be negative, at least one element), return the largest sum of a non-empty contiguous subarray. Example: `[−2, 1, −3, 4, −1, 2, 1, −5, 4]` → `6` (`[4, −1, 2, 1]`).

| Version | Idea | Time | Space |
|---------|------|------|-------|
| 1. Brute force | try every (i, j), sum a[i … j] with a loop | O(n³) | O(1) |
| 2. Running sum | for fixed i, extend j and add a[j] to the previous sum — removes the innermost loop | O(n²) | O(1) |
| 3. Divide and conquer | best of left half, right half and the best sum crossing the middle ([Divide and Conquer](../../algorithms/divide-and-conquer/content.md)) | O(n log n) | O(log n) |
| 4. **Kadane's algorithm** | best sum **ending at** j = max(a[j], best ending at j − 1 + a[j]) | O(n) | O(1) |

**Why Kadane is correct:** any subarray ending at j either is just `a[j]` or extends a subarray ending at j − 1. Extending is only worthwhile if the best sum ending at j − 1 is positive; a negative prefix can only lower the total, so it is dropped. The answer is the maximum over all ending positions. This is a 1D DP (`dp[j]` = best sum ending at j, see [1D DP](../../algorithms/dp-1d/content.md)) whose array collapses into one variable because each state uses only the previous one.

### Other common progressions

| Problem | Brute force | Better | Optimal |
|---------|-------------|--------|---------|
| Pair with a given sum (unsorted, indices needed) | all pairs O(n²) | sort with indices + two pointers O(n log n) | hash map O(n) — [Hashing Pattern](../../patterns/hashing-pattern/content.md) |
| Count subarrays with sum k (negatives allowed) | all subarrays O(n²) with running sums | — | prefix sums + map O(n) — [Prefix Sum](../../patterns/prefix-sum/content.md) |
| Longest substring without repeats | all substrings O(n³) | set per start O(n²) | sliding window O(n) — [Sliding Window](../../patterns/sliding-window/content.md) |
| Next greater element for all | scan right for each O(n²) | — | monotonic stack O(n) — [Monotonic Stack](../../patterns/monotonic-stack/content.md) |
| k-th largest | sort O(n log n) | size-k heap O(n log k) | quickselect O(n) average — [Quick Sort](../../algorithms/quick-sort/content.md) |
| Fibonacci-style counts | plain recursion O(φⁿ) | memoisation O(n) time, O(n) space | two variables O(n) time, O(1) space |
| Range minimum queries | scan each query O(n × q) | segment tree O((n + q) log n) | sparse table O(n log n + q) — [Sparse Table](../../data-structures/sparse-table/content.md) |

## Visual Explanation

Kadane on `[−2, 1, −3, 4, −1, 2, 1, −5, 4]` — `cur` is the best sum ending at the current index:

```text
index:    0    1    2    3    4    5    6    7    8
a:       −2    1   −3    4   −1    2    1   −5    4
cur:     −2    1   −2    4    3    5    6    1    5
best:    −2    1    1    4    4    5    6    6    6
                         ▲ restart (previous cur −2 < 0)
```

## Real-World Examples

Kadane's idea — "a running total that resets when it turns negative" — appears in practice as:

- The most profitable stretch of days in a profit/loss series.
- The strongest signal segment in a noisy sensor stream.
- The best single buy/sell (apply Kadane to day-to-day price differences).

## Java Example

```java
public class MaxSubarrayProgression {

    static long cubic(int[] a) {                       // version 1: O(n³)
        long best = Long.MIN_VALUE;
        for (int i = 0; i < a.length; i++)
            for (int j = i; j < a.length; j++) {
                long sum = 0;
                for (int k = i; k <= j; k++) sum += a[k];
                best = Math.max(best, sum);
            }
        return best;
    }

    static long quadratic(int[] a) {                   // version 2: reuse the sum of a[i..j-1]
        long best = Long.MIN_VALUE;
        for (int i = 0; i < a.length; i++) {
            long sum = 0;
            for (int j = i; j < a.length; j++) {
                sum += a[j];
                best = Math.max(best, sum);
            }
        }
        return best;
    }

    static long kadane(int[] a) {                      // version 4: O(n) time, O(1) space
        long cur = a[0], best = a[0];
        for (int j = 1; j < a.length; j++) {
            cur = Math.max(a[j], cur + a[j]);          // extend, or start fresh at j
            best = Math.max(best, cur);
        }
        return best;
    }

    public static void main(String[] args) {
        int[][] tests = {{-2, 1, -3, 4, -1, 2, 1, -5, 4}, {-3, -1, -2}, {5, 4, -1, 7, 8}};
        for (int[] t : tests) System.out.println(cubic(t) + " " + quadratic(t) + " " + kadane(t));
    }
}
```

**Output:**

```text
6 6 6
-1 -1 -1
23 23 23
```

All versions agree; the all-negative case shows why `cur` and `best` start at `a[0]` rather than 0 (the answer must be a non-empty subarray).

## Common Misconceptions

- **"The optimal solution is a trick you either know or not."** Most optimal solutions follow from naming the repeated work in the brute force.
- **"Skip the brute force in interviews."** Stating it costs a minute and gives a correctness baseline and a test oracle.
- **"Kadane should start with `cur = 0, best = 0`."** That returns 0 for all-negative arrays, where the correct answer is the largest (least negative) element.
- **"Faster is always better."** Stop when the constraints are met; extra complexity in code is a cost too.

## Key Takeaways

- Correct first, then fast: brute force → remove one kind of wasted work at a time.
- Know the standard moves: running values, prefix sums, hashing, two pointers, windows, memoisation, monotonic structures, heaps, binary search on the answer.
- Kadane: best sum ending here = max(a[j], previous best ending + a[j]); answer = max over j. O(n), O(1).
