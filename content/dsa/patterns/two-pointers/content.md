# Two Pointers

## What Is the Pattern

**Two pointers** walks two indices through a sequence so that every step discards part of the search space. Two shapes cover most problems:

- **Opposite ends** — `left` starts at 0, `right` at n − 1, and they move toward each other (pair sums in a sorted array, palindromes, container problems).
- **Same direction** — a `slow` writer and a `fast` reader both move left to right (in-place removal, compaction, merging).

Tiny example: in the sorted array `[1, 3, 4, 6, 9]`, find two numbers summing to 10. Start with 1 + 9 = 10 — done. If the sum had been too small, only moving `left` right could increase it; if too large, only moving `right` left could decrease it.

## Why It Works

In the opposite-ends form on a **sorted** array, when `a[left] + a[right] < target`, pairing `a[left]` with any element left of `right` gives an even smaller sum, so `a[left]` can never be part of a solution — discard it with `left++`. Symmetrically for a sum that is too large. Each step eliminates one element **with proof**, so the pair search takes O(n) instead of the O(n²) of checking all pairs.

In the same-direction form, the invariant is "everything before `slow` is the finished output". The fast pointer reads each element once, so in-place filtering is O(n) with O(1) extra space.

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| Input is **sorted** (or can be sorted) and asks for a pair/triplet with a target sum | sortedness lets one comparison discard an element |
| "In place", "O(1) extra space", remove/move elements while keeping order | slow writer + fast reader |
| Palindrome, reverse, compare from both ends | symmetric structure → opposite ends |
| Two sorted arrays/lists to merge or intersect | one pointer per input |
| Maximise/minimise something determined by the two ends (area, width) | move the end that limits the answer |

## Typical Problem Structure

- Input: an array or string, often sorted; sometimes two sorted sequences.
- Output: a pair/triplet of indices or values, a count, a boolean, or the array modified in place with a new length.
- Constraints: n up to 10⁵–10⁶, so O(n²) pair checks are too slow but O(n log n) sorting is fine.

## Template

```pseudocode
// opposite ends (sorted input)
left ← 0; right ← n − 1
while left < right:
    if condition(left, right) is satisfied: record; move one or both pointers
    else if value is too small: left ← left + 1
    else: right ← right − 1

// same direction (in-place filter)
slow ← 0
for fast from 0 to n − 1:
    if keep(a[fast]): a[slow] ← a[fast]; slow ← slow + 1
return slow          // new length
```

## Java Template

```java
public class TwoPointerTemplates {

    // Opposite ends: pair with the given sum in a sorted array.
    static int[] pairWithSum(int[] sorted, int target) {
        int left = 0, right = sorted.length - 1;
        while (left < right) {
            int sum = sorted[left] + sorted[right];
            if (sum == target) return new int[] {left, right};
            if (sum < target) left++;              // a[left] is too small for every remaining partner
            else right--;                          // a[right] is too big for every remaining partner
        }
        return new int[] {-1, -1};
    }

    // Same direction: keep elements satisfying a condition, return the new length.
    static int removeValue(int[] a, int value) {
        int slow = 0;
        for (int fast = 0; fast < a.length; fast++) {
            if (a[fast] != value) a[slow++] = a[fast];
        }
        return slow;
    }

    public static void main(String[] args) {
        int[] p = pairWithSum(new int[] {1, 3, 4, 6, 9}, 10);
        int[] a = {3, 2, 2, 3, 4};
        System.out.println(p[0] + "," + p[1] + " " + removeValue(a, 3));
    }
}
```

**Output:**

```text
0,4 3
```

## Example Problem

**Zero-sum triplets.** Given an integer array, return all unique triplets `[a, b, c]` with a + b + c = 0. Example: `[-1, 0, 1, 2, -1, -4]` → `[[-1, -1, 2], [-1, 0, 1]]`.

- **Brute force:** three nested loops, O(n³), plus a set to remove duplicate triplets.
- **Why slow:** n = 3000 gives about 4.5 × 10⁹ triples.
- **Observation:** after sorting, fix the first element `a[i]`; the remaining task is "pair with sum −a[i]" in the sorted suffix — the opposite-ends template, O(n) per i.
- **Duplicates:** skip equal values for `i`, and after recording a triplet skip equal values for both pointers.

```java
import java.util.*;

public class ZeroSumTriplets {

    static List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;       // same first value → same triplets
            if (nums[i] > 0) break;                              // smallest value positive: no zero sum left
            int left = i + 1, right = nums.length - 1;
            while (left < right) {
                int sum = nums[i] + nums[left] + nums[right];
                if (sum < 0) left++;
                else if (sum > 0) right--;
                else {
                    result.add(List.of(nums[i], nums[left], nums[right]));
                    while (left < right && nums[left] == nums[left + 1]) left++;     // skip duplicates
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++;
                    right--;
                }
            }
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(threeSum(new int[] {-1, 0, 1, 2, -1, -4}));
        System.out.println(threeSum(new int[] {0, 0, 0, 0}));
        System.out.println(threeSum(new int[] {1, 2, -2, -1}));
    }
}
```

**Output:**

```text
[[-1, -1, 2], [-1, 0, 1]]
[[0, 0, 0]]
[]
```

## Dry Run

Sorted input `[-4, -1, -1, 0, 1, 2]`, i = 1 (`nums[i] = −1`, need a pair summing to 1):

| left | right | nums[left] | nums[right] | sum | Action |
|------|-------|------------|-------------|-----|--------|
| 2 | 5 | −1 | 2 | 0 | record [−1, −1, 2]; move both |
| 3 | 4 | 0 | 1 | 0 | record [−1, 0, 1]; move both |
| 4 | 3 | — | — | — | left ≥ right, stop |

i = 2 is skipped because `nums[2] == nums[1]`. For i = 0 (−4) every sum is negative, so `left` runs to the end without a triplet.

## Common Mistakes

- Using opposite-ends pointers on **unsorted** data — the discard argument needs sortedness.
- Forgetting duplicate skipping, producing repeated triplets.
- Loop condition `left <= right` when the two pointers must be different elements.
- In the same-direction form, overwriting values that have not been read yet (the writer must never pass the reader — it cannot, since `slow ≤ fast`).

## Variations

- **Pair sum in sorted array** — the base template.
- **k-sum** — sort, fix k − 2 elements with loops, finish with two pointers: O(n^(k−1)).
- **Closest sum** — track the best |sum − target| instead of equality.
- **Partitioning** (Dutch national flag) — three pointers `low`, `mid`, `high`.
- **Merging two sorted arrays** — one pointer per array (the merge step of [Merge Sort](../../algorithms/merge-sort/content.md)).
- **Linked lists** — the same idea with node references; the speed-difference version is [Fast and Slow Pointers](../fast-and-slow-pointers/content.md).
- **Variable window** — when both pointers move right and the elements between them matter, it becomes [Sliding Window](../sliding-window/content.md).

## Complexity

| Form | Time | Space |
|------|------|-------|
| Opposite ends on sorted input | O(n) (+ O(n log n) if you must sort) | O(1) (sorting may use O(log n)) |
| Same direction | O(n) | O(1) |
| 3-sum | O(n²) | O(1) besides the output |

Each pointer moves at most n times in total — an [amortized](../../fundamentals/amortized-analysis/content.md) argument.

## When Not to Use It

- Unsorted input where sorting would lose required information (e.g. you must return **original** indices and cannot carry them along) — use [hashing](../hashing-pattern/content.md) instead.
- Sums over subarrays with negative numbers, where moving a pointer does not change the sum monotonically — use [prefix sums](../prefix-sum/content.md).
- When the answer depends on elements between the pointers in a non-monotone way.

## Key Takeaways

- Sorted + pair/triplet target → opposite-ends pointers; in place + keep order → slow/fast writer.
- Each move must be justified: it discards something that provably cannot be in the answer.
- Typical cost: O(n) after an optional O(n log n) sort, O(1) extra space.
