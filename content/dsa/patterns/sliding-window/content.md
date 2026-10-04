# Sliding Window

## What Is the Pattern

A **sliding window** is a contiguous range `[left, right]` of an array or string that moves left to right while a summary of its contents (sum, counts, distinct elements) is updated incrementally. Two forms:

- **Fixed size k** — add the entering element, remove the leaving one.
- **Variable size** — expand `right` every step; shrink from `left` while the window breaks a condition.

Tiny example: the maximum sum of any 3 consecutive values in `[2, 1, 5, 1, 3, 2]`: window sums 8, 7, 9, 6 → 9. Each new sum is the old one + entering − leaving, O(1) per step.

## Why It Works

Recomputing each window from scratch costs O(k) (fixed) or O(n) (variable) per window — O(n × k) or O(n²) overall. The window shares all but one element with its predecessor, so an incremental update suffices.

For variable windows, the key property is **monotonicity**: if a window is invalid, every larger window containing it is also invalid (or: if valid, every smaller one inside it is valid). That justifies moving `left` forward and never back. Both pointers move only forward, so the total work is O(n) ([amortized](../../fundamentals/amortized-analysis/content.md)).

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "Contiguous subarray" / "substring" | windows are contiguous ranges |
| "Of size k" / "every k consecutive" | fixed window |
| "Longest/shortest subarray such that …" | variable window; the condition decides when to shrink |
| "At most k distinct", "no repeating characters", "sum ≤ S" with non-negative values | condition is monotone in window size |
| "Contains all characters of t", "anagram/permutation of p in s" | window with character counts |

## Typical Problem Structure

- Input: an array of numbers or a string, sometimes a second pattern string or a number k.
- Output: a length, a count of windows, a maximum/minimum aggregate, or the window itself.
- A per-window summary that can be updated by adding and removing one element: sum, `int[26]`/`HashMap` counts, number of distinct values, number of "satisfied" characters.

## Template

```pseudocode
// variable window: longest valid window
left ← 0; best ← 0
for right from 0 to n − 1:
    add a[right] to the window summary
    while window is invalid:
        remove a[left] from the summary; left ← left + 1
    best ← max(best, right − left + 1)

// variable window: shortest valid window
for right from 0 to n − 1:
    add a[right]
    while window is valid:
        best ← min(best, right − left + 1)
        remove a[left]; left ← left + 1
```

## Java Template

```java
public class SlidingWindowTemplates {

    // Fixed window: maximum sum of k consecutive elements.
    static long maxSumOfK(int[] a, int k) {
        long sum = 0, best;
        for (int i = 0; i < k; i++) sum += a[i];
        best = sum;
        for (int right = k; right < a.length; right++) {
            sum += a[right] - a[right - k];            // enter right, leave right − k
            best = Math.max(best, sum);
        }
        return best;
    }

    // Variable window: shortest subarray with sum ≥ target (all values positive).
    static int shortestWithSumAtLeast(int[] a, int target) {
        int left = 0, best = Integer.MAX_VALUE;
        long sum = 0;
        for (int right = 0; right < a.length; right++) {
            sum += a[right];
            while (sum >= target) {                    // valid: record, then try to shrink
                best = Math.min(best, right - left + 1);
                sum -= a[left++];
            }
        }
        return best == Integer.MAX_VALUE ? 0 : best;
    }

    public static void main(String[] args) {
        System.out.println(maxSumOfK(new int[] {2, 1, 5, 1, 3, 2}, 3) + " " + shortestWithSumAtLeast(new int[] {2, 3, 1, 2, 4, 3}, 7));
    }
}
```

**Output:**

```text
9 2
```

## Example Problem

**Longest substring without repeating characters.** Return the length of the longest substring of `s` with all characters distinct. Example: `"abcabcbb"` → `3` (`"abc"`); `"pwwkew"` → `3` (`"wke"`).

- **Brute force:** check every substring for duplicates — O(n³), or O(n²) with a set per start.
- **Why slow:** n = 5 × 10⁴ gives about 1.25 × 10⁹ substrings.
- **Observation:** if `s[left…right]` has a repeat, every longer window containing it does too — monotone. Expand `right`; when the new character is already inside, move `left` just past its previous occurrence.
- **Summary:** last index of each character (`int[128]`), letting `left` jump directly instead of stepping.

```java
import java.util.Arrays;

public class LongestUniqueSubstring {

    static int lengthOfLongestSubstring(String s) {
        int[] lastIndex = new int[128];
        Arrays.fill(lastIndex, -1);
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (lastIndex[c] >= left) left = lastIndex[c] + 1;   // repeat inside the window: jump past it
            lastIndex[c] = right;
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(lengthOfLongestSubstring("abcabcbb") + " " + lengthOfLongestSubstring("bbbbb") + " "
                + lengthOfLongestSubstring("pwwkew") + " " + lengthOfLongestSubstring("") + " " + lengthOfLongestSubstring("abba"));
    }
}
```

**Output:**

```text
3 1 3 0 2
```

## Dry Run

`s = "abba"` — shows why the check is `lastIndex[c] >= left`:

| right | char | lastIndex[c] before | left after | window | best |
|-------|------|---------------------|------------|--------|------|
| 0 | a | −1 | 0 | a | 1 |
| 1 | b | −1 | 0 | ab | 2 |
| 2 | b | 1 (≥ 0) | 2 | b | 2 |
| 3 | a | 0 (< 2, outside the window) | 2 | ba | 2 |

Without the `>= left` check, step 3 would move `left` back to 1 and report `"bba"` as valid.

## Common Mistakes

- Using a variable window when values can be **negative** with a sum condition — shrinking no longer helps monotonically; use [prefix sums](../prefix-sum/content.md) + hashing, or a [monotonic queue](../monotonic-queue/content.md).
- Off-by-one in window length: it is `right − left + 1`.
- Updating the answer at the wrong moment (before shrinking for "longest", inside the loop for "shortest").
- Moving `left` backwards (see the `"abba"` dry run).
- Forgetting to remove the leaving element from the counts.

## Variations

- **Fixed window with counts:** find all anagrams of p in s (`int[26]` compared or a "matched" counter).
- **At most k distinct:** a count map plus a distinct counter; "exactly k" = atMost(k) − atMost(k − 1).
- **Minimum window containing all of t:** shrink while valid, track the best.
- **Window maximum/minimum:** needs a [monotonic queue](../monotonic-queue/content.md).
- **Two-pointer cousin:** [Two Pointers](../two-pointers/content.md) when only the ends matter, not the contents.

## Complexity

| Form | Time | Space |
|------|------|-------|
| Fixed window | O(n) | O(1) or O(alphabet) |
| Variable window | O(n) — each index enters and leaves once | O(alphabet) or O(k) for the map |

## When Not to Use It

- The subarray need not be contiguous (subsequence problems → [DP](../dp-pattern/content.md)).
- The validity condition is not monotone in window size (e.g. "sum exactly k" with negative numbers).
- You need aggregate queries over arbitrary ranges, not a moving window — use [prefix sums](../prefix-sum/content.md) or a [segment tree](../../data-structures/segment-tree/content.md).

## Key Takeaways

- Contiguous + longest/shortest/count with a monotone condition → sliding window.
- Expand right every step; shrink left while invalid (longest) or while valid (shortest).
- Both pointers only move forward: O(n) total.
