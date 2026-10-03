# Radix Sort

## Definition

**Radix sort** sorts integers (or fixed-length strings) digit by digit. The **LSD** (least significant digit) version sorts by the last digit, then the second-to-last, and so on up to the most significant, using a **stable** sort — usually [Counting Sort](../counting-sort/content.md) — for each digit. With d digits in base b it runs in **O(d × (n + b))** time and O(n + b) space, with no comparisons.

## Why It Matters

Counting sort needs a small value range; radix sort extends linear-time sorting to large integers by handling them one small digit at a time. Sorting a million 32-bit integers takes 4 passes in base 256. It also explains a deep idea: **stable sorting by keys from least to most significant gives a correct multi-key sort**.

## Prerequisites

- [Counting Sort](../counting-sort/content.md)
- [Algorithm Properties](../../fundamentals/algorithm-properties/content.md) — stability.

## Intuition

To sort dates written as YYYYMMDD, sort by day, then (stably) by month, then (stably) by year. After the last pass the years are in order, and within each year the earlier stable passes have already ordered months and days. Radix sort does the same with digits.

## How It Works

1. Find the maximum value to know the number of digits d (in base b, usually 10 for teaching, 256 for speed).
2. For each digit position, starting from the least significant (`exp = 1, b, b², …`):
   1. Stable counting sort of the array by `(x / exp) % b`.
3. After d passes, the array is sorted.

Why it works: after pass i, the numbers are sorted by their last i digits. Pass i + 1 sorts by digit i + 1; for numbers with equal digit i + 1, stability keeps their previous order — which is sorted by the last i digits. So they are now sorted by the last i + 1 digits.

**Negative numbers:** sort negatives and non-negatives separately, or add an offset (subtract the minimum) before sorting.

**MSD radix sort** starts from the most significant digit and recurses into buckets; it suits variable-length strings and can stop early, but is more complex.

## Visual Explanation

```text
input:               [170, 45, 75, 90, 802, 24, 2, 66]

by ones digit:       [170, 90, 802, 2, 24, 45, 75, 66]       (0, 0, 2, 2, 4, 5, 5, 6)
by tens digit:       [802, 2, 24, 45, 66, 170, 75, 90]       (0, 0, 2, 4, 6, 7, 7, 9)
by hundreds digit:   [2, 24, 45, 66, 75, 90, 170, 802]       (0, 0, 0, 0, 0, 0, 1, 8)

stability matters: in pass 2, 802 and 2 both have tens digit 0 — they stay in pass-1 order (802 before 2)
```

## Pseudocode

```pseudocode
radixSort(arr):                      // non-negative integers, base 10
    max ← maximum of arr
    exp ← 1
    while max / exp > 0:
        countingSortByDigit(arr, exp)   // stable, key = (x / exp) mod 10
        exp ← exp × 10
```

## Java Implementation

```java
import java.util.Arrays;

public class RadixSort {

    static void sort(int[] arr) {                        // non-negative ints
        if (arr.length == 0) return;
        int max = Arrays.stream(arr).max().getAsInt();
        int[] output = new int[arr.length];
        for (long exp = 1; max / exp > 0; exp *= 10) {   // long: exp * 10 must not overflow
            countingSortByDigit(arr, output, (int) exp);
        }
    }

    private static void countingSortByDigit(int[] arr, int[] output, int exp) {
        int[] count = new int[10];
        for (int x : arr) count[(x / exp) % 10]++;
        for (int d = 1; d < 10; d++) count[d] += count[d - 1];    // inclusive prefix sums
        for (int i = arr.length - 1; i >= 0; i--) {               // right to left keeps it stable
            int digit = (arr[i] / exp) % 10;
            output[--count[digit]] = arr[i];
        }
        System.arraycopy(output, 0, arr, 0, arr.length);
        System.out.println("after exp=" + exp + ": " + Arrays.toString(arr));
    }

    public static void main(String[] args) {
        int[] a = {170, 45, 75, 90, 802, 24, 2, 66};
        sort(a);
    }
}
```

**Output:**

```text
after exp=1: [170, 90, 802, 2, 24, 45, 75, 66]
after exp=10: [802, 2, 24, 45, 66, 170, 75, 90]
after exp=100: [2, 24, 45, 66, 75, 90, 170, 802]
```

## Dry Run

Pass 1 (ones digit) counting:

| Digit | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7–9 |
|-------|---|---|---|---|---|---|---|-----|
| Count | 2 (170, 90) | 0 | 2 (802, 2) | 0 | 1 (24) | 2 (45, 75) | 1 (66) | 0 |
| Inclusive prefix | 2 | 2 | 4 | 4 | 5 | 7 | 8 | 8 |

Scanning right to left: 66 → index 7; 2 → 3; 24 → 4; 802 → 2; 90 → 1; 75 → 6; 45 → 5; 170 → 0. Result `[170, 90, 802, 2, 24, 45, 75, 66]`.

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best | O(d × (n + b)) | d counting-sort passes, each O(n + b) |
| Average | O(d × (n + b)) | independent of order |
| Worst | O(d × (n + b)) | |

**Space:** O(n + b) — output buffer and counts.

For 32-bit integers in base 256, d = 4 and b = 256: about 4 × (n + 256) operations — linear. In base 10 with values up to 10⁹, d = 10.

## Properties

| Property | Value |
|----------|-------|
| Stable | Yes (LSD with a stable digit sort) |
| In-place | No |
| Comparison-based | No |
| Requires | fixed-size integer keys or fixed-length strings (or padding) |

## Variations

- **Base choice:** larger bases mean fewer passes but bigger count arrays; base 2⁸ or 2¹⁶ with bit operations (`(x >>> shift) & 0xFF`) is common.
- **Strings of equal length:** LSD over character positions, right to left.
- **MSD radix sort / American flag sort:** recursive, good for strings with shared prefixes.
- **Negative integers:** flip the sign bit, or sort with an offset.

## Comparison

| | Radix sort | Counting sort | Quick / merge sort |
|---|-----------|---------------|--------------------|
| Time | O(d(n + b)) | O(n + k) | O(n log n) |
| Range limitation | digits d must be small | range k must be small | none |
| Extra space | O(n + b) | O(n + k) | O(log n) / O(n) |
| Comparisons | none | none | yes |

## Edge Cases

- Empty array; all values equal; zeros.
- Values near `Integer.MAX_VALUE` — make `exp` a `long` so `exp × 10` does not overflow.
- Negative numbers — need special handling.

## Advantages

- Linear time for fixed-width keys; stable; no comparisons.

## Disadvantages

- Only for integer-like keys; O(n) extra memory; constant factors make it slower than `Arrays.sort` for modest n.

## When to Use

- Very large arrays of integers or fixed-length strings (IDs, IP addresses, dates, phone numbers).
- Teaching or demonstrating stable multi-key sorting.

**When not to use:** general objects, floating-point values, variable-length keys (without MSD), or small arrays.

## Common Mistakes

- Using an unstable sort for the digit passes (the result is wrong, not just unstable).
- Processing digits from the most significant first with plain LSD logic.
- Overflowing `exp` for large maxima.
- Scanning left to right with inclusive prefix sums (breaks stability).

## Key Takeaways

- Stable counting sort on each digit, least significant first.
- O(d × (n + b)) time, O(n + b) space; stable; no comparisons.
- Correctness depends entirely on the stability of each pass.
