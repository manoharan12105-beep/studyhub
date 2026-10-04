# Divide and Conquer Pattern

## What Is the Pattern

The **divide and conquer** pattern solves a problem by splitting it into **independent** smaller instances of the same problem, solving them recursively, and **combining** their answers. As a problem-solving pattern, the skill is spotting a split point that makes the pieces independent: the middle index, a pivot, a character that cannot belong to any answer, the root of a tree.

Tiny example: the maximum of `[3, 8, 2, 5]` is max(max of `[3, 8]`, max of `[2, 5]`) = max(8, 5) = 8.

The general method, recurrences and the Master Theorem are in [Divide and Conquer](../../algorithms/divide-and-conquer/content.md) and [Recurrence Relations](../../fundamentals/recurrence-relations/content.md); merge sort, quick sort and binary search are its best-known instances.

## Why It Works

If the answer for the whole input can be built from answers for disjoint parts (plus some work across the boundary), recursion reduces the problem size geometrically. Balanced splits give O(log n) levels; with O(n) combine work per level, the total is O(n log n) — often beating an O(n²) direct approach. Correctness is by induction: if the recursive calls are right and the combine step accounts for everything that crosses the split, the whole answer is right.

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| Answer for a range = combine(answer for left half, answer for right half, cross term) | classic split at the middle (merge sort, maximum subarray, count inversions) |
| Some element can **never** be part of a valid answer, so it separates the input into independent pieces | split at the "bad" elements |
| Expression or structure with a natural root/operator to split on | recursive split at each operator (different ways to parenthesise) |
| Merging two partial results is easier than building the whole (skylines, sorted lists, convex hulls) | conquer halves, merge |
| Tree input (each subtree is an independent subproblem) | D&C on trees = postorder |
| Expected O(n log n) where brute force is O(n²) | balanced splitting with linear combine |

## Typical Problem Structure

- Input: an array, string, list of geometric objects or a tree.
- Output: a single value (count, maximum, length) or a merged structure (sorted list, skyline).
- Shape: `solve(range) = combine(solve(left part), solve(right part))` with a base case on size 0/1.

## Template

```pseudocode
solve(input):
    if input is small: return direct answer         // base case
    parts ← split(input)                            // independent pieces
    results ← [solve(p) for p in parts]
    return combine(results, input)                  // include anything that crosses the split
```

## Java Template

```java
public class DivideConquerTemplate {

    // Number of elements greater than x in a[lo..hi], by halves — illustrates split / conquer / combine.
    static int countGreater(int[] a, int lo, int hi, int x) {
        if (lo > hi) return 0;                         // empty range
        if (lo == hi) return a[lo] > x ? 1 : 0;        // base case
        int mid = lo + (hi - lo) / 2;
        return countGreater(a, lo, mid, x) + countGreater(a, mid + 1, hi, x);   // combine = add
    }

    public static void main(String[] args) {
        System.out.println(countGreater(new int[] {3, 8, 2, 5, 9}, 0, 4, 4));
    }
}
```

**Output:**

```text
3
```

## Example Problem

**Longest substring where every character repeats at least k times.** Return the length of the longest substring of `s` in which every character occurs at least k times. Example: `"ababbc"`, k = 2 → `5` (`"ababb"`).

- **Brute force:** check every substring's counts — O(n² × 26) or worse.
- **Why a sliding window is awkward:** validity is not monotone (adding a character can fix or break it).
- **Observation:** count characters in the current range. Any character occurring fewer than k times in the **whole range** cannot appear in a valid substring, so it splits the range into independent pieces. If no such character exists, the whole range is valid.

```java
public class LongestSubstringAtLeastK {

    static int longestSubstring(String s, int k) {
        return solve(s, 0, s.length(), k);
    }

    static int solve(String s, int lo, int hi, int k) {     // range [lo, hi)
        if (hi - lo < k) return 0;
        int[] count = new int[26];
        for (int i = lo; i < hi; i++) count[s.charAt(i) - 'a']++;
        int best = 0, start = lo;
        boolean split = false;
        for (int i = lo; i <= hi; i++) {
            if (i == hi || count[s.charAt(i) - 'a'] < k) {  // bad character (or end): close the piece
                if (i < hi) split = true;
                if (split) best = Math.max(best, solve(s, start, i, k));
                start = i + 1;
            }
        }
        return split ? best : hi - lo;                      // no bad character: the whole range is valid
    }

    public static void main(String[] args) {
        System.out.println(longestSubstring("aaabb", 3) + " " + longestSubstring("ababbc", 2) + " " + longestSubstring("abcde", 2) + " " + longestSubstring("bbaaacbd", 3));
    }
}
```

**Output:**

```text
3 5 0 3
```

## Dry Run

`s = "ababbc"`, k = 2:

| Call (range) | Counts | First bad character | Action |
|--------------|--------|---------------------|--------|
| [0, 6) "ababbc" | a:2, b:3, c:1 | c at 5 | split at every bad character: pieces [0, 5) and [6, 6) |
| [0, 5) "ababb" | a:2, b:3 | none | return 5 |
| [6, 6) "" | — | — | length < k → 0 |

Answer max(5, 0) = 5.

## Common Mistakes

- Pieces that are **not independent** (overlapping subproblems) — then D&C recomputes work exponentially; use [DP](../dp-pattern/content.md).
- Forgetting the **cross term** in the combine step (subarrays crossing the middle, pairs split across halves).
- Base cases that miss empty ranges, causing infinite recursion.
- Unbalanced splits (always peeling off one element) turning O(n log n) into O(n²).
- Allocating new arrays at every level when index ranges would do.

## Variations

- **Split at the middle + linear combine:** merge sort, count inversions, maximum subarray, closest pair.
- **Split at a pivot:** quick sort, quickselect.
- **Split at invalid elements:** the example above.
- **Split at operators:** all results of an expression with different parenthesisation.
- **Merge partial structures:** skyline, merging sorted lists, convex hull.
- **Decrease and conquer:** only one part matters (binary search, fast exponentiation).

## Complexity

| Recurrence | Time | Example |
|------------|------|---------|
| T(n) = 2T(n/2) + O(n) | O(n log n) | merge sort, skyline |
| T(n) = T(n/2) + O(1) | O(log n) | binary search |
| T(n) = 2T(n/2) + O(1) | O(n) | tree height, max by halves |
| Split at bad characters (example) | O(26 × n) | depth ≤ 26, O(n) work per level |

For the example, a piece never contains a character that was bad in its parent range, and every split removes at least one bad character, so each level has a strictly smaller alphabet: depth ≤ 26, and each level scans O(n) characters in total — O(26 × n).

## When Not to Use It

- Subproblems overlap — use DP (e.g. Fibonacci, edit distance).
- A one-pass method exists (Kadane's O(n) beats the O(n log n) D&C maximum subarray).
- Splitting does not make the pieces independent of each other.

## Key Takeaways

- Look for a split that makes the pieces independent; handle what crosses the split in the combine step.
- Balanced splits + linear combine → O(n log n); analyse with a recurrence.
- Overlapping pieces mean DP, not D&C.
