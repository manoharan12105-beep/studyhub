# Top K Elements

## What Is the Pattern

The **top K** pattern selects the k largest, smallest, most frequent or closest items without fully sorting everything. The standard tool is a **heap of size k** that holds the best k candidates seen so far, with the *worst* of them on top so it can be evicted in O(log k):

- k **largest** → **min-heap** of size k (the smallest of the top k is on top, ready to be replaced).
- k **smallest** → **max-heap** of size k.

Tiny example: 2 largest of `[5, 1, 9, 3, 7]`: heap {5} → {1, 5} → push 9, evict 1 → {5, 9} → 3 is smaller than the top 5, skip → push 7, evict 5 → {7, 9}.

Heap mechanics and the classic applications (k-th largest, top-k frequent, k closest points, running median, merging k sorted lists) are in [Heap](../../data-structures/heap/content.md) and [Heap Applications](../../data-structures/heap-applications/content.md).

## Why It Works

Sorting costs O(n log n) even though only k items matter. A size-k heap only needs to know the **weakest** member of the current top k: a new item either beats it (swap in, O(log k)) or does not (skip, O(1)). Total O(n log k), with O(k) memory — useful when k ≪ n or when data arrives as a stream.

When the candidates come from k sorted sources (rows of a matrix, sorted lists, pairs from two sorted arrays), the heap holds one **frontier** element per source; popping the best and pushing its successor enumerates items in order without generating them all (the k-way merge idea).

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "k largest / smallest / closest / most frequent", "k-th largest" | size-k heap or quickselect |
| A **stream** of values with queries about the top k | heap updates per arrival |
| "k smallest sums/pairs/products" from sorted inputs | heap over a frontier of candidates |
| "Schedule / pick repeatedly the best available" | heap as a priority queue (often with greedy) |
| k ≪ n, memory limited | O(k) memory instead of O(n) |

## Typical Problem Structure

- Input: an array, a stream, a matrix with sorted rows/columns, or several sorted lists; an integer k.
- Output: the k items (any order or sorted), or only the k-th one.
- Ranking key: value, frequency (count first with a map), distance, a computed score — encoded in the heap's comparator.

## Template

```pseudocode
// k largest by key
heap ← min-heap ordered by key
for x in items:
    heap.push(x)
    if heap.size > k: heap.pop()          // drop the weakest
return heap contents                     // top k, weakest on top

// k smallest from sorted sources (frontier)
heap ← min-heap of (value, source, position) for the first element of each source
repeat k times:
    (v, s, p) ← heap.pop(); output v
    if source s has position p + 1: heap.push((next value, s, p + 1))
```

## Java Template

```java
import java.util.*;

public class TopKTemplate {

    static List<Integer> kLargest(int[] a, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();      // min-heap: weakest of the top k on top
        for (int x : a) {
            heap.offer(x);
            if (heap.size() > k) heap.poll();
        }
        List<Integer> result = new ArrayList<>(heap);
        Collections.sort(result, Collections.reverseOrder());
        return result;
    }

    public static void main(String[] args) {
        System.out.println(kLargest(new int[] {5, 1, 9, 3, 7}, 2) + " " + kLargest(new int[] {4, 4, 1}, 2));
    }
}
```

**Output:**

```text
[9, 7] [4, 4]
```

## Example Problem

**K pairs with the smallest sums.** Two arrays sorted in non-decreasing order; return the k pairs (u from the first, v from the second) with the smallest sums u + v. Example: `[1, 7, 11]`, `[2, 4, 6]`, k = 3 → `[[1, 2], [1, 4], [1, 6]]`.

- **Brute force:** generate all n × m pairs, sort — O(nm log(nm)); n = m = 10⁵ is impossible.
- **Observation:** for a fixed i, pairs (i, 0), (i, 1), … come in increasing order (second array sorted). That gives n sorted "sources"; the smallest unseen pair is always one of their frontiers. Start with (i, 0) for the first min(n, k) values of i; each pop pushes (i, j + 1).

```java
import java.util.*;

public class KSmallestPairs {

    static List<List<Integer>> kSmallestPairs(int[] a, int[] b, int k) {
        PriorityQueue<int[]> heap = new PriorityQueue<>((x, y) -> Integer.compare(a[x[0]] + b[x[1]], a[y[0]] + b[y[1]]));
        for (int i = 0; i < Math.min(a.length, k); i++) heap.offer(new int[] {i, 0});   // frontier: (i, 0)
        List<List<Integer>> result = new ArrayList<>();
        while (result.size() < k && !heap.isEmpty()) {
            int[] top = heap.poll();
            result.add(List.of(a[top[0]], b[top[1]]));
            if (top[1] + 1 < b.length) heap.offer(new int[] {top[0], top[1] + 1});      // successor in row i
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(kSmallestPairs(new int[] {1, 7, 11}, new int[] {2, 4, 6}, 3));
        System.out.println(kSmallestPairs(new int[] {1, 1, 2}, new int[] {1, 2, 3}, 2) + " " + kSmallestPairs(new int[] {1, 2}, new int[] {3}, 3));
    }
}
```

**Output:**

```text
[[1, 2], [1, 4], [1, 6]]
[[1, 1], [1, 1]] [[1, 3], [2, 3]]
```

## Dry Run

`a = [1, 7, 11]`, `b = [2, 4, 6]`, k = 3. Heap entries are (i, j) with sum a[i] + b[j]:

| Step | Heap before (sum) | Pop | Push | Output so far |
|------|-------------------|-----|------|---------------|
| 1 | (0,0)=3, (1,0)=9, (2,0)=13 | (0,0) | (0,1)=5 | [1,2] |
| 2 | (0,1)=5, (1,0)=9, (2,0)=13 | (0,1) | (0,2)=7 | [1,2], [1,4] |
| 3 | (0,2)=7, (1,0)=9, (2,0)=13 | (0,2) | — (end of b) | [1,2], [1,4], [1,6] |

Only 5 pairs were ever created, not 9.

## Common Mistakes

- Using a max-heap to keep the k **largest** (then you cannot evict the weakest cheaply) — use a min-heap of size k.
- Comparator `(x, y) -> x − y` overflowing for large values — use `Integer.compare`.
- Expecting `PriorityQueue` iteration or `toString` to be sorted — only `poll` order is sorted.
- Pushing all n × m candidates up front in frontier problems.
- Forgetting ties in frequency problems (state the tie-break rule in the comparator).

## Variations

- **K-th largest only:** quickselect, O(n) average ([Quick Sort](../../algorithms/quick-sort/content.md)), or a size-k heap.
- **Top k frequent:** count with a map, then a size-k heap by count, or bucket sort by frequency, O(n).
- **K closest points:** max-heap of size k by distance.
- **K-th smallest in a sorted matrix:** frontier heap, or [binary search on the answer](../binary-search-on-answer/content.md) with counting.
- **Reorganise / schedule:** repeatedly take the most frequent remaining item (heap + greedy).
- **Two heaps:** running median (max-heap of the lower half, min-heap of the upper half).

## Complexity

| Approach | Time | Space |
|----------|------|-------|
| Full sort | O(n log n) | O(n) |
| Size-k heap | O(n log k) | O(k) |
| Heapify all, pop k | O(n + k log n) | O(n) |
| Quickselect (k-th / top k unordered) | O(n) average, O(n²) worst | O(1) extra |
| Frontier heap over sorted sources | O(k log min(k, sources)) | O(min(k, sources)) |

## When Not to Use It

- k is close to n — sorting is simpler with the same cost.
- Only one extreme is needed (k = 1) — a linear scan.
- Values are small integers — counting/bucket approaches are O(n).
- The set changes with deletions of arbitrary elements — a `TreeMap`/`TreeSet` supports removal in O(log n).

## Key Takeaways

- k largest → min-heap of size k; k smallest → max-heap of size k; O(n log k).
- Sorted sources → heap of frontiers; pop the best, push its successor.
- Quickselect for an unordered top k in O(n) average; buckets for small integer keys.
