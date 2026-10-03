# Heap Applications

## Definition

The standard problems solved with heaps (priority queues): the **k-th largest/smallest** element, **top K** elements, the **median of a data stream**, and **merging k sorted** lists or arrays. Each keeps a heap of limited size so that the work per element is O(log k) instead of sorting everything.

## Why It Matters

These four problems appear constantly in interviews and in real systems (leaderboards, monitoring dashboards, log merging, database external sorting). They also teach the most important heap trick: **the heap does not have to hold all the data** — a heap of size k is enough to track the k best items, and two heaps can track a median.

## Prerequisites

- [Heap](../heap/content.md)
- [Java Toolkit: Stack, Queue, Deque and PriorityQueue](../../fundamentals/java-stacks-and-queues/content.md)

## Intuition

| Problem | Heap setup | Why |
|---------|-----------|-----|
| k-th **largest** | **min**-heap of size k | the root is the smallest of the k largest seen — exactly the k-th largest, and the first to be evicted |
| k-th **smallest** | **max**-heap of size k | mirror image |
| Running median | max-heap for the lower half + min-heap for the upper half | the two roots are the middle elements |
| Merge k sorted lists | min-heap of the current head of each list | the next output is the smallest current head |

The counter-intuitive part: to keep the **largest** k you use a **min**-heap, because you need quick access to the weakest member in order to replace it.

## How It Works

### K-th largest element

1. For each element, push it into a min-heap.
2. If the heap size exceeds k, poll (remove the smallest).
3. After all elements, the root is the k-th largest.

Alternative: **quickselect** (the partition step of quick sort, recursing into one side only) finds it in O(n) average, O(n²) worst, without extra memory — but it is not online (needs all data) and mutates the array. See [Top K Elements](../../patterns/top-k-elements/content.md).

### Top K elements

Same size-k heap; at the end, poll everything (and reverse if you want descending order). For "top K by frequency", first count with a `HashMap`, then heap the entries by count.

### Median of a data stream

Maintain two heaps:

- `low` — a **max**-heap holding the smaller half.
- `high` — a **min**-heap holding the larger half.

Invariants: every element of `low` ≤ every element of `high`, and `low.size()` equals `high.size()` or is one larger.

To add x:

1. Push x into `low`.
2. Move `low`'s maximum into `high` (this restores the ordering invariant).
3. If `high` became larger than `low`, move `high`'s minimum back into `low` (restores the size invariant).

Median: `low.peek()` if sizes differ, else the average of both roots.

### Merge k sorted lists

1. Push the first node of each non-empty list into a min-heap keyed by value.
2. Repeatedly poll the smallest node, append it to the result, and push its successor (if any).

Each of the N total elements is pushed and polled once with a heap of size ≤ k: O(N log k). Merging the lists one at a time instead costs O(N × k).

## Visual Explanation

```text
Running median after adding 5, 15, 1, 3:

add 5:   low (max-heap) [5]          high (min-heap) []          median 5
add 15:  low [5]                     high [15]                   median (5 + 15)/2 = 10
add 1:   low [5, 1]                  high [15]                   median 5
add 3:   low [3, 1]                  high [5, 15]                median (3 + 5)/2 = 4

          lower half ≤ low.peek()  |  high.peek() ≤ upper half
```

## Pseudocode

```pseudocode
kthLargest(nums, k):
    heap ← empty min-heap
    for x in nums:
        heap.push(x)
        if heap.size > k: heap.pop()
    return heap.peek()

mergeK(lists):
    heap ← min-heap of (head value, list id) for each non-empty list
    while heap not empty:
        (value, id) ← heap.pop(); output value
        if list id has a next element: heap.push(next)
```

## Java Implementation

```java
import java.util.*;

public class HeapApplications {

    static int kthLargest(int[] nums, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        for (int x : nums) {
            minHeap.offer(x);
            if (minHeap.size() > k) {
                minHeap.poll();                         // evict the smallest of k + 1
            }
        }
        return minHeap.peek();
    }

    static List<Integer> topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> count = new HashMap<>();
        for (int x : nums) count.merge(x, 1, Integer::sum);
        PriorityQueue<Map.Entry<Integer, Integer>> heap =
                new PriorityQueue<>(Map.Entry.comparingByValue());   // least frequent on top
        for (Map.Entry<Integer, Integer> e : count.entrySet()) {
            heap.offer(e);
            if (heap.size() > k) heap.poll();
        }
        List<Integer> result = new ArrayList<>();
        while (!heap.isEmpty()) result.add(heap.poll().getKey());
        Collections.reverse(result);                    // most frequent first
        return result;
    }

    static class MedianFinder {
        private final PriorityQueue<Integer> low = new PriorityQueue<>(Comparator.reverseOrder());
        private final PriorityQueue<Integer> high = new PriorityQueue<>();

        void add(int x) {
            low.offer(x);
            high.offer(low.poll());                     // largest of the lower half moves up
            if (high.size() > low.size()) {
                low.offer(high.poll());                 // keep low at least as big as high
            }
        }

        double median() {
            return low.size() > high.size() ? low.peek() : (low.peek() + (double) high.peek()) / 2;
        }
    }

    static List<Integer> mergeKSorted(int[][] arrays) {
        // heap entries: {value, which array, index in that array}
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        for (int i = 0; i < arrays.length; i++) {
            if (arrays[i].length > 0) heap.offer(new int[] {arrays[i][0], i, 0});
        }
        List<Integer> merged = new ArrayList<>();
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            merged.add(top[0]);
            int arr = top[1], next = top[2] + 1;
            if (next < arrays[arr].length) heap.offer(new int[] {arrays[arr][next], arr, next});
        }
        return merged;
    }

    public static void main(String[] args) {
        System.out.println("2nd largest: " + kthLargest(new int[] {3, 2, 1, 5, 6, 4}, 2));
        System.out.println("4th largest: " + kthLargest(new int[] {3, 2, 3, 1, 2, 4, 5, 5, 6}, 4));
        System.out.println("top 2 frequent: " + topKFrequent(new int[] {1, 1, 1, 2, 2, 3}, 2));

        MedianFinder mf = new MedianFinder();
        StringBuilder medians = new StringBuilder();
        for (int x : new int[] {5, 15, 1, 3}) {
            mf.add(x);
            medians.append(mf.median()).append(' ');
        }
        System.out.println("medians: " + medians.toString().trim());

        System.out.println("merged: " + mergeKSorted(new int[][] {{1, 4, 5}, {1, 3, 4}, {2, 6}, {}}));
    }
}
```

**Output:**

```text
2nd largest: 5
4th largest: 4
top 2 frequent: [1, 2]
medians: 5.0 10.0 5.0 4.0
merged: [1, 1, 2, 3, 4, 4, 5, 6]
```

## Dry Run

`kthLargest([3, 2, 1, 5, 6, 4], k = 2)` with a min-heap:

| x | Heap after offer | Size > 2? | Heap after poll |
|---|------------------|-----------|-----------------|
| 3 | [3] | no | [3] |
| 2 | [2, 3] | no | [2, 3] |
| 1 | [1, 3, 2] | yes → poll 1 | [2, 3] |
| 5 | [2, 3, 5] | yes → poll 2 | [3, 5] |
| 6 | [3, 5, 6] | yes → poll 3 | [5, 6] |
| 4 | [4, 6, 5] | yes → poll 4 | [5, 6] |

Root = 5 = 2nd largest.

## Complexity Analysis

| Problem | Time | Space | Note |
|---------|------|-------|------|
| k-th largest / top K (size-k heap) | O(n log k) | O(k) | online — works on a stream |
| k-th largest (sort) | O(n log n) | O(1)–O(n) | simplest |
| k-th largest (quickselect) | O(n) average, O(n²) worst | O(1) | offline, mutates input |
| Top K frequent | O(n + u log k), u = distinct values | O(u) | bucket sort gives O(n) |
| Median of stream | O(log n) per add, O(1) per query | O(n) | |
| Merge k sorted (N elements total) | O(N log k) | O(k) heap + output | |

## Variations

- **K closest points / K closest numbers** — size-k max-heap keyed by distance.
- **Sliding window median** — two heaps with lazy deletion, or two `TreeMap` multisets.
- **Smallest range covering k lists** — merge-k heap while tracking the current maximum.
- **K-th smallest in a sorted matrix** — merge-k over the rows.
- **Reorganise string / task scheduler** — max-heap by remaining count.

## Comparison

| Approach for "k-th largest" | When to prefer |
|-----------------------------|----------------|
| Size-k min-heap | streaming data, k ≪ n, or you cannot modify the input |
| Quickselect | all data available, average O(n) matters, mutation allowed |
| Sorting | small n, or you need many order statistics afterwards |
| Counting / bucket | small value range or frequency-based questions |

## Edge Cases

- k = 1 (maximum) and k = n (minimum).
- Duplicates — k-th largest counts duplicates as separate elements unless the problem says "distinct".
- Empty lists among the k lists to merge.
- Integer overflow when averaging two medians — add as `double` or `long`.

## Advantages

- O(log k) per element and O(k) memory, independent of n.
- Works online for streams.

## Disadvantages

- Slower than quickselect on average for one-shot k-th queries.
- Heaps give no order among the K elements without polling them all.

## When to Use

- "k-th largest/smallest", "top K", "K most frequent", "K closest" → size-k heap.
- "Median", "middle value" of a changing collection → two heaps.
- "Merge k sorted …" → min-heap of current heads.

## Common Mistakes

- Using a max-heap of all n elements for k-th largest (O(n log n) time, O(n) space) when a size-k min-heap suffices.
- Mixing up which heap type to use (largest K → **min**-heap).
- Forgetting to rebalance the two median heaps, or comparing the wrong roots.
- In merge-k, pushing all elements at the start (O(N log N)) instead of only the heads.

## Key Takeaways

- Largest K → min-heap of size k; smallest K → max-heap of size k: O(n log k).
- Median of a stream → max-heap (lower half) + min-heap (upper half).
- Merge k sorted → heap of current heads: O(N log k).
- Quickselect is the O(n) average offline alternative for k-th element.
