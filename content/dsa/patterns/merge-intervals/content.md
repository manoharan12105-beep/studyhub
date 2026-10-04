# Merge Intervals

## What Is the Pattern

The **merge intervals** pattern handles collections of ranges `[start, end]`: sort them by start, then sweep once, comparing each interval only with the last one kept. Two sorted intervals `[a, b]` and `[c, d]` (a ≤ c) **overlap** exactly when `c ≤ b`; merged, they become `[a, max(b, d)]`.

Tiny example: `[[1, 3], [2, 6], [8, 10]]` → `[1, 3]` and `[2, 6]` overlap (2 ≤ 3) → `[1, 6]`; `[8, 10]` starts after 6 → separate. Result `[[1, 6], [8, 10]]`.

## Why It Works

After sorting by start, an interval can only overlap intervals that come **before** it through the most recent merged block: every earlier block ends before the current block starts (otherwise they would have merged). So one comparison with the last kept interval decides everything, and the sweep is O(n) after an O(n log n) sort — instead of comparing all pairs, O(n²), and repeating until nothing changes.

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| Input is a list of intervals, meetings, bookings, time ranges | interval structure |
| "Merge overlapping", "union of ranges", "total covered length" | sort + sweep and merge |
| "Insert a new interval into a sorted list" | three phases: before, overlapping, after |
| "Intersection of two interval lists" | two pointers over two sorted lists |
| "Free time", "gaps between busy intervals" | merge, then read the gaps |
| "Minimum intervals to remove for no overlap", "minimum arrows" | sort by **end** + greedy (see [Greedy Problems](../../algorithms/greedy-problems/content.md)) |
| "Maximum number overlapping at once" | sweep over start/end events ([Difference Array](../difference-array/content.md)) or a min-heap of end times |

## Typical Problem Structure

- Input: `int[][] intervals` with `intervals[i] = {start, end}`, possibly unsorted; sometimes a second list or a new interval.
- Output: a list of merged/inserted/intersected intervals, a count, or a total length.
- Clarify whether endpoints are inclusive (`[1, 2]` and `[2, 3]` touch — merge or not?).

## Template

```pseudocode
sort intervals by start
merged ← [intervals[0]]
for each interval [s, e] after the first:
    last ← merged.last
    if s ≤ last.end:                 // overlap (use < if touching intervals must stay separate)
        last.end ← max(last.end, e)
    else:
        append [s, e] to merged
```

## Java Template

```java
import java.util.*;

public class IntervalTemplate {

    static boolean overlaps(int[] a, int[] b) {        // inclusive endpoints
        return a[0] <= b[1] && b[0] <= a[1];
    }

    static int[] intersection(int[] a, int[] b) {      // assumes overlaps(a, b)
        return new int[] {Math.max(a[0], b[0]), Math.min(a[1], b[1])};
    }

    public static void main(String[] args) {
        int[] a = {1, 5}, b = {4, 9}, c = {6, 7};
        System.out.println(overlaps(a, b) + " " + Arrays.toString(intersection(a, b)) + " " + overlaps(a, c));
    }
}
```

**Output:**

```text
true [4, 5] false
```

## Example Problem

**Merge overlapping intervals.** Given intervals in any order, merge all that overlap (touching endpoints count as overlapping) and return the result sorted by start. Example: `[[1, 3], [2, 6], [8, 10], [15, 18]]` → `[[1, 6], [8, 10], [15, 18]]`.

- **Brute force:** repeatedly find any overlapping pair and merge it — O(n²) per round, up to n rounds.
- **Observation:** after sorting by start, each interval either extends the last merged block or starts a new one.

```java
import java.util.*;

public class MergeIntervals {

    static int[][] merge(int[][] intervals) {
        int[][] sorted = intervals.clone();
        Arrays.sort(sorted, Comparator.comparingInt(iv -> iv[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] iv : sorted) {
            if (!merged.isEmpty() && iv[0] <= merged.get(merged.size() - 1)[1]) {
                int[] last = merged.get(merged.size() - 1);
                last[1] = Math.max(last[1], iv[1]);        // extend; max handles a fully contained interval
            } else {
                merged.add(new int[] {iv[0], iv[1]});      // copy: do not mutate the caller's arrays
            }
        }
        return merged.toArray(new int[0][]);
    }

    public static void main(String[] args) {
        System.out.println(Arrays.deepToString(merge(new int[][] {{1, 3}, {2, 6}, {8, 10}, {15, 18}})));
        System.out.println(Arrays.deepToString(merge(new int[][] {{1, 4}, {4, 5}})) + " " + Arrays.deepToString(merge(new int[][] {{1, 10}, {2, 3}, {4, 5}})));
    }
}
```

**Output:**

```text
[[1, 6], [8, 10], [15, 18]]
[[1, 5]] [[1, 10]]
```

## Dry Run

Input (already sorted) `[[1, 10], [2, 3], [4, 5], [11, 12]]`:

| Interval | Last kept | Overlap? | Merged list after |
|----------|-----------|----------|-------------------|
| [1, 10] | — | — | [[1, 10]] |
| [2, 3] | [1, 10] | 2 ≤ 10 yes | [[1, max(10, 3) = 10]] |
| [4, 5] | [1, 10] | 4 ≤ 10 yes | [[1, 10]] |
| [11, 12] | [1, 10] | 11 ≤ 10 no | [[1, 10], [11, 12]] |

Without `max`, [2, 3] would shrink the block to [1, 3] and [4, 5] would wrongly start a new block.

## Common Mistakes

- Forgetting to sort (or sorting by end when merging).
- Setting `last.end = e` instead of `max(last.end, e)` (contained intervals).
- Ambiguity about touching intervals — `<=` merges [1, 2] and [2, 3]; `<` keeps them apart. Ask.
- Comparator `(a, b) -> a[0] − b[0]` overflowing for large negative/positive values — use `Integer.compare` / `comparingInt`.
- Mutating the input arrays when the caller still uses them.

## Variations

- **Insert interval** into a sorted, non-overlapping list in O(n) without re-sorting.
- **Intersections of two sorted lists:** two pointers; advance the one that ends first.
- **Free time / gaps:** merge all busy intervals, then report the gaps between consecutive blocks.
- **Total covered length:** sum of merged lengths.
- **Non-overlapping selection / arrows:** sort by end, greedy.
- **Meeting rooms (max overlap):** min-heap of end times or a sweep of +1/−1 events.

## Complexity

| Task | Time | Space |
|------|------|-------|
| Merge | O(n log n) sort + O(n) sweep | O(n) output (+ O(log n) sort stack) |
| Insert into a sorted list | O(n) | O(n) output |
| Intersect two sorted lists | O(n + m) | O(n + m) output |

## When Not to Use It

- Intervals arrive online with interleaved queries ("is point x covered?") — use a `TreeMap` of starts → ends, or a segment tree.
- You only need the maximum overlap count — a sweep over events is simpler than merging.
- Point updates over a fixed range — a [difference array](../difference-array/content.md) is O(n + q).

## Key Takeaways

- Sort by start; compare each interval only with the last kept one; extend with `max`.
- Overlap test for sorted intervals: `next.start ≤ last.end`.
- Selection problems (remove fewest, arrows) sort by **end** instead — that is the greedy pattern.
