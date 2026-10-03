# Bucket Sort

## Definition

**Bucket sort** distributes elements into k **buckets** by value range, sorts each bucket individually (usually with insertion sort), and concatenates the buckets in order. When the input is **uniformly distributed** over a known range, each bucket holds O(1) elements on average and the whole sort takes **O(n + k)** expected time. In the worst case (everything in one bucket) it degrades to the cost of the inner sort — **O(n²)** with insertion sort.

## Why It Matters

It is the natural linear-time sort for real numbers spread evenly over a range (counting and radix sort need integer keys). The bucketing idea itself — group by value range or by frequency — solves several interview problems in O(n): "maximum gap", "top K frequent", "sort characters by frequency".

## Prerequisites

- [Insertion Sort](../insertion-sort/content.md)
- [Counting Sort](../counting-sort/content.md)

## Intuition

Sorting a pile of exam papers with scores 0–100: first drop them into ten trays (0–9, 10–19, …), then sort each small tray by hand, then stack the trays in order. If scores are spread evenly, each tray is tiny and fast to sort.

## How It Works

For n values in [min, max] and k buckets:

1. Create k empty lists.
2. Put each value x into bucket `⌊(x − min) / (max − min) × (k − 1)⌋` (any monotonic mapping works: larger values must never go to an earlier bucket).
3. Sort each bucket (insertion sort is typical — buckets are small).
4. Concatenate buckets 0, 1, …, k − 1.

Correctness: every value in bucket i is ≤ every value in bucket i + 1, so concatenating sorted buckets yields a sorted array.

## Visual Explanation

```text
input (in [0, 1)):  [0.78, 0.17, 0.39, 0.26, 0.72, 0.94, 0.21, 0.12, 0.23, 0.68]
10 buckets, index = floor(10 × x):

bucket 1: 0.17, 0.12        → sort → 0.12, 0.17
bucket 2: 0.26, 0.21, 0.23  → sort → 0.21, 0.23, 0.26
bucket 3: 0.39
bucket 6: 0.68
bucket 7: 0.78, 0.72        → sort → 0.72, 0.78
bucket 9: 0.94

concatenate: [0.12, 0.17, 0.21, 0.23, 0.26, 0.39, 0.68, 0.72, 0.78, 0.94]
```

## Pseudocode

```pseudocode
bucketSort(arr, k):
    buckets ← k empty lists
    for x in arr:
        buckets[index(x)].add(x)          // index is monotonic in x
    result ← empty
    for b in buckets:
        insertionSort(b); result.addAll(b)
    return result
```

## Java Implementation

```java
import java.util.*;

public class BucketSort {

    // Sorts values in [0, 1) using n buckets.
    static void sortUnitInterval(double[] arr) {
        int n = arr.length;
        List<List<Double>> buckets = new ArrayList<>();
        for (int i = 0; i < n; i++) buckets.add(new ArrayList<>());
        for (double x : arr) {
            buckets.get((int) (x * n)).add(x);               // x in [0,1) → bucket 0..n-1
        }
        int write = 0;
        for (List<Double> bucket : buckets) {
            insertionSort(bucket);                            // buckets are small on uniform input
            for (double x : bucket) arr[write++] = x;
        }
    }

    // General version for ints in any range, with a chosen number of buckets.
    static void sortInts(int[] arr, int bucketCount) {
        if (arr.length == 0) return;
        int min = Arrays.stream(arr).min().getAsInt(), max = Arrays.stream(arr).max().getAsInt();
        long range = (long) max - min + 1;
        List<List<Integer>> buckets = new ArrayList<>();
        for (int i = 0; i < bucketCount; i++) buckets.add(new ArrayList<>());
        for (int x : arr) {
            int index = (int) (((long) x - min) * bucketCount / range);   // monotonic in x
            buckets.get(index).add(x);
        }
        int write = 0;
        for (List<Integer> bucket : buckets) {
            Collections.sort(bucket);
            for (int x : bucket) arr[write++] = x;
        }
    }

    private static void insertionSort(List<Double> list) {
        for (int i = 1; i < list.size(); i++) {
            double key = list.get(i);
            int j = i - 1;
            while (j >= 0 && list.get(j) > key) {
                list.set(j + 1, list.get(j));
                j--;
            }
            list.set(j + 1, key);
        }
    }

    public static void main(String[] args) {
        double[] a = {0.78, 0.17, 0.39, 0.26, 0.72, 0.94, 0.21, 0.12, 0.23, 0.68};
        sortUnitInterval(a);
        System.out.println(Arrays.toString(a));
        int[] b = {29, -3, 25, 3, 49, 9, 37, 21, 43};
        sortInts(b, 5);
        System.out.println(Arrays.toString(b));
    }
}
```

**Output:**

```text
[0.12, 0.17, 0.21, 0.23, 0.26, 0.39, 0.68, 0.72, 0.78, 0.94]
[-3, 3, 9, 21, 25, 29, 37, 43, 49]
```

## Dry Run

`sortInts([29, −3, 25, 3, 49, 9, 37, 21, 43], 5)`: min = −3, max = 49, range = 53; index = (x + 3) × 5 / 53.

| x | (x + 3) × 5 / 53 | Bucket |
|---|------------------|--------|
| 29 | 160 / 53 = 3 | 3 |
| −3 | 0 | 0 |
| 25 | 140 / 53 = 2 | 2 |
| 3 | 30 / 53 = 0 | 0 |
| 49 | 260 / 53 = 4 | 4 |
| 9 | 60 / 53 = 1 | 1 |
| 37 | 200 / 53 = 3 | 3 |
| 21 | 120 / 53 = 2 | 2 |
| 43 | 230 / 53 = 4 | 4 |

Buckets: 0: [−3, 3], 1: [9], 2: [21, 25], 3: [29, 37], 4: [43, 49] → concatenated in order.

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best | O(n + k) | each bucket has about one element |
| Average | O(n + k) expected | uniform input: expected bucket sizes are O(n/k); with k ≈ n the expected total insertion-sort work is O(n) |
| Worst | O(n²) | all elements land in one bucket; insertion sort on n elements (O(n log n) if buckets use an O(n log n) sort) |

**Space:** O(n + k) for the buckets.

## Properties

| Property | Value |
|----------|-------|
| Stable | Yes, if elements are appended to buckets in input order and buckets are sorted stably (insertion sort) |
| In-place | No |
| Comparison-based | partly — comparisons only inside buckets |
| Requires | a known range and a roughly uniform distribution for good performance |

## Variations

- **Bucketing without sorting buckets:** when only bucket boundaries matter — e.g. "maximum gap" (the answer is always between buckets), or "top K frequent" with buckets indexed by frequency.
- **Counting sort** is bucket sort with one bucket per value.
- **Histogram / proxmap sort:** precompute bucket positions so elements go straight into one output array.

## Comparison

| | Bucket sort | Counting sort | Radix sort |
|---|-------------|---------------|------------|
| Keys | real numbers or integers in a known range | small-range integers | fixed-width integers/strings |
| Time | O(n + k) expected, O(n²) worst | O(n + k) | O(d(n + b)) |
| Depends on distribution | yes | no | no |

## Edge Cases

- All values equal (`max == min`) — range 1 avoids division by zero in the integer version; the unit-interval version needs values in [0, 1).
- Skewed data (most values in one small range) — one big bucket → slow.
- Value exactly equal to the top of the range — make sure the index stays below k.

## Advantages

- Linear expected time on uniformly distributed data, including floating-point values.
- Stable if implemented carefully; easy to parallelise (buckets are independent).

## Disadvantages

- Performance depends on the distribution; worst case quadratic.
- Extra memory for buckets; needs the range in advance.

## When to Use

- Floating-point or integer data known to be spread evenly over a known range.
- Problems where grouping into value ranges is the key insight (maximum gap, frequency buckets).

**When not to use:** unknown or heavily skewed distributions — use a comparison sort.

## Common Mistakes

- A bucket index that is not monotonic in the value (breaks correctness).
- Index out of range for the maximum value (`x × k` when x can equal 1.0).
- Choosing far too few buckets (degenerates to insertion sort on big buckets).

## Key Takeaways

- Scatter into range buckets, sort each, concatenate.
- O(n + k) expected for uniform data; O(n²) worst case with insertion sort inside buckets.
- The bucketing idea solves "maximum gap" and frequency problems without full sorting.
