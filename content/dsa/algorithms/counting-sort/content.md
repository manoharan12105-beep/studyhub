# Counting Sort

## Definition

**Counting sort** sorts integers in a known small range [min, max] by **counting** how many times each value occurs and then using those counts to place every element directly at its final position. It makes **no comparisons** and runs in **O(n + k)** time, where k = max − min + 1 is the range size, using O(n + k) extra space. The prefix-sum version is **stable**.

## Why It Matters

It breaks the Ω(n log n) lower bound for comparison sorts (see [Algorithm Properties](../../fundamentals/algorithm-properties/content.md)) by using values as array indices. It is the go-to when values are small integers — ages, grades, letters, digits — and it is the stable subroutine inside [Radix Sort](../radix-sort/content.md). Frequency-array thinking (`int[26]` counts) is one of the most common interview techniques.

## Prerequisites

- [Arrays](../../data-structures/arrays/content.md) — prefix sums.

## Intuition

To sort exam scores out of 100, you do not compare papers: you make 101 piles labelled 0–100, drop each paper on its pile, then pick up the piles in order. The cost depends on the number of papers plus the number of piles, not on comparisons.

## How It Works

### Simple version (values only)

1. Count occurrences: `count[v − min]++` for every v.
2. Write each value `count` times, in increasing order.

This is enough for plain integers but cannot carry attached data and is not meaningfully "stable".

### Stable version (prefix sums)

1. Count occurrences of each key.
2. Turn counts into **starting positions**: `start[v]` = number of elements with key < v (an exclusive prefix sum).
3. Scan the input **left to right**; place each element at `output[start[key]]` and increment `start[key]`. Elements with equal keys keep their input order → stable.

(An equivalent formulation uses inclusive prefix sums and scans **right to left**, decrementing.)

## Visual Explanation

```text
input:   [4, 2, 2, 8, 3, 3, 1]          range 1..8 → k = 8

counts (value: count):  1:1  2:2  3:2  4:1  5:0  6:0  7:0  8:1
start positions:        1:0  2:1  3:3  4:5  5:6  6:6  7:6  8:6

place left to right:
4 → pos 5;  2 → pos 1;  2 → pos 2;  8 → pos 6;  3 → pos 3;  3 → pos 4;  1 → pos 0
output:  [1, 2, 2, 3, 3, 4, 8]
```

## Pseudocode

```pseudocode
countingSort(arr):
    min, max ← range of arr; k ← max − min + 1
    count[0..k−1] ← 0
    for x in arr: count[x − min] += 1
    start ← 0
    for v from 0 to k − 1:                 // exclusive prefix sums
        c ← count[v]; count[v] ← start; start ← start + c
    for x in arr (left to right):
        output[count[x − min]] ← x; count[x − min] += 1
    return output
```

## Java Implementation

```java
import java.util.*;

public class CountingSort {

    // Stable counting sort for any int range; returns a new array.
    static int[] sort(int[] arr) {
        if (arr.length == 0) return arr;
        int min = Arrays.stream(arr).min().getAsInt();
        int max = Arrays.stream(arr).max().getAsInt();
        int[] count = new int[max - min + 1];
        for (int x : arr) {
            count[x - min]++;
        }
        int start = 0;
        for (int v = 0; v < count.length; v++) {        // count[v] becomes the first index for key v
            int c = count[v];
            count[v] = start;
            start += c;
        }
        int[] output = new int[arr.length];
        for (int x : arr) {                             // left to right → stable
            output[count[x - min]++] = x;
        }
        return output;
    }

    record Student(String name, int grade) { }

    // Same algorithm on records: equal grades keep input order.
    static Student[] sortByGrade(Student[] students, int maxGrade) {
        int[] start = new int[maxGrade + 2];
        for (Student s : students) start[s.grade() + 1]++;
        for (int g = 1; g < start.length; g++) start[g] += start[g - 1];   // start[g] = students with grade < g
        Student[] out = new Student[students.length];
        for (Student s : students) out[start[s.grade()]++] = s;
        return out;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(sort(new int[] {4, 2, 2, 8, 3, 3, 1})));
        System.out.println(Arrays.toString(sort(new int[] {-3, 5, 0, -3, 2})));

        Student[] students = {new Student("Ravi", 2), new Student("Anu", 1), new Student("Mei", 2), new Student("Joe", 1)};
        StringBuilder sb = new StringBuilder();
        for (Student s : sortByGrade(students, 3)) sb.append(s.name()).append("(").append(s.grade()).append(") ");
        System.out.println(sb.toString().trim());
    }
}
```

**Output:**

```text
[1, 2, 2, 3, 3, 4, 8]
[-3, -3, 0, 2, 5]
Anu(1) Joe(1) Ravi(2) Mei(2)
```

## Dry Run

Placement for `[4, 2, 2, 8, 3, 3, 1]` with starting positions `1:0, 2:1, 3:3, 4:5, 8:6`:

| Element | Position used | Next start for that key | Output so far |
|---------|---------------|--------------------------|---------------|
| 4 | 5 | 6 | `[_, _, _, _, _, 4, _]` |
| 2 | 1 | 2 | `[_, 2, _, _, _, 4, _]` |
| 2 | 2 | 3 | `[_, 2, 2, _, _, 4, _]` |
| 8 | 6 | 7 | `[_, 2, 2, _, _, 4, 8]` |
| 3 | 3 | 4 | `[_, 2, 2, 3, _, 4, 8]` |
| 3 | 4 | 5 | `[_, 2, 2, 3, 3, 4, 8]` |
| 1 | 0 | 1 | `[1, 2, 2, 3, 3, 4, 8]` |

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best | O(n + k) | one pass to count, one over the k counts, one to place |
| Average | O(n + k) | independent of input order |
| Worst | O(n + k) | |

**Space:** O(n + k) — count array of size k plus the output array.

The catch is k: sorting 10 numbers in the range 0..10⁹ needs a billion counters. Counting sort is only good when k = O(n) or smaller.

## Properties

| Property | Value |
|----------|-------|
| Stable | Yes (prefix-sum version, scanning left to right with exclusive starts) |
| In-place | No |
| Comparison-based | No |
| Requires | integer keys (or keys mappable to a small integer range) |

## Variations

- **Frequency counting** without full sorting — anagram checks, "most frequent element", histogram problems.
- **Counting sort by a digit** — the inner step of LSD radix sort.
- **Sorting characters** — `int[26]` or `int[128]` counts, then rebuild the string.

## Comparison

| | Counting sort | Comparison sorts | Radix sort |
|---|---------------|------------------|------------|
| Time | O(n + k) | Ω(n log n) | O(d × (n + b)) |
| Best when | small value range | any data | many large integers with few digits |
| Extra space | O(n + k) | O(1)–O(n) | O(n + b) |

## Edge Cases

- Negative values — offset by `min`.
- Empty array.
- One huge value (e.g. 10⁹) with small n — range explodes; use another sort.

## Advantages

- Linear time for small ranges; simple; stable.

## Disadvantages

- Memory and time proportional to the range k; integers only.

## When to Use

- Values are integers in a small known range (ages 0–150, grades, letters, digits, small IDs).
- As the stable pass inside radix sort.

**When not to use:** large or unknown ranges, floating-point keys, or objects without a small integer key.

## Common Mistakes

- Forgetting the `min` offset (negative indices).
- Building output with the simple version when records with attached data must stay stable.
- Using inclusive prefix sums while scanning left to right (breaks stability) — inclusive sums pair with a right-to-left scan.
- Allocating `max + 1` counters when values start far from zero.

## Key Takeaways

- Count occurrences, convert counts to start positions with prefix sums, place elements directly.
- O(n + k) time and space; no comparisons; stable.
- Only practical when the value range k is small relative to n.
