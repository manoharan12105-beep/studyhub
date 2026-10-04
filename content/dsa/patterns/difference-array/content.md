# Difference Array

## What Is the Pattern

A **difference array** records range **updates** cheaply: to add v to every element of `a[l … r]`, do `diff[l] += v` and `diff[r + 1] −= v`. After all updates, a prefix sum over `diff` reconstructs the final array. Each update is O(1) instead of O(r − l + 1).

It is the inverse of the [prefix sum](../prefix-sum/content.md): prefix sums make range **queries** O(1); difference arrays make range **updates** O(1).

Tiny example: n = 5, add 2 to [1, 3] and 3 to [2, 4]:

```text
diff after updates: [0, 2, 3, 0, −2, −3]     (index 5 is the sentinel)
prefix sums:        [0, 2, 5, 5,  3]         final array
```

## Why It Works

`diff[i] = a[i] − a[i − 1]` describes where the array **changes** value. Adding v to a range raises the step at its start by v and lowers the step just after its end by v; nothing in between changes relative to its neighbour. Summing the steps from the left rebuilds the values. With q updates on n positions, the cost is O(n + q) instead of O(n × q).

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| Many "add v to every element from l to r", then read the final array once | O(1) per update, one O(n) rebuild |
| Intervals of time with a load (passengers, bookings, meetings) and a capacity or maximum overlap question | +load at start, −load at end, sweep |
| "How many intervals cover point x" for all x | +1/−1 events, prefix sum |
| Shifting characters over ranges, flipping bits over ranges | same additive structure (sometimes mod 26 or mod 2) |
| 2D: add v to many rectangles, then read the grid | 2D difference with four corner updates |

## Typical Problem Structure

- Input: an array size or a coordinate range, and a list of (l, r, v) updates or intervals.
- Output: the final array, a maximum load, a feasibility boolean, or counts per position.
- All updates happen **before** the reads (offline). Interleaved updates and queries need a [Fenwick tree](../../data-structures/fenwick-tree/content.md) or [segment tree](../../data-structures/segment-tree/content.md) with range updates.

## Template

```pseudocode
diff[0 … n] ← 0                       // one extra slot for r + 1 = n
for each update (l, r, v):
    diff[l] ← diff[l] + v
    diff[r + 1] ← diff[r + 1] − v
running ← 0
for i from 0 to n − 1:
    running ← running + diff[i]
    a[i] ← running                    // or check running against a limit
```

## Java Template

```java
import java.util.Arrays;

public class DifferenceArrayTemplate {

    // updates[i] = {l, r, v}: add v to positions l..r (inclusive).
    static long[] applyUpdates(int n, int[][] updates) {
        long[] diff = new long[n + 1];
        for (int[] u : updates) {
            diff[u[0]] += u[2];
            diff[u[1] + 1] -= u[2];                    // sentinel slot n absorbs r = n − 1
        }
        long[] result = new long[n];
        long running = 0;
        for (int i = 0; i < n; i++) {
            running += diff[i];
            result[i] = running;
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(applyUpdates(5, new int[][] {{1, 3, 2}, {2, 4, 3}})));
    }
}
```

**Output:**

```text
[0, 2, 5, 5, 3]
```

## Example Problem

**Car pooling.** A car with `capacity` seats drives east. Each trip `[passengers, from, to]` picks people up at kilometre `from` and drops them at `to` (they are out of the car at `to`). Can all trips be served? Locations are 0 … 1000. Example: trips `[[2, 1, 5], [3, 3, 7]]`: capacity 4 → `false` (5 people between km 3 and 5); capacity 5 → `true`.

- **Brute force:** for each trip, add passengers to every kilometre it covers — O(trips × distance).
- **Observation:** the load changes only at pick-up and drop-off points. Record +p at `from` and −p at `to` (the interval is [from, to), so the drop happens exactly at `to`), then sweep.

```java
public class CarPooling {

    static boolean carPooling(int[][] trips, int capacity) {
        int[] diff = new int[1001];
        for (int[] t : trips) {
            diff[t[1]] += t[0];                        // board at from
            diff[t[2]] -= t[0];                        // leave at to (half-open interval)
        }
        int load = 0;
        for (int km = 0; km <= 1000; km++) {
            load += diff[km];
            if (load > capacity) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        int[][] trips = {{2, 1, 5}, {3, 3, 7}};
        System.out.println(carPooling(trips, 4) + " " + carPooling(trips, 5) + " " + carPooling(new int[][] {{2, 1, 5}, {3, 5, 7}}, 3));
    }
}
```

**Output:**

```text
false true true
```

The third call shows the half-open interval: the first group leaves at km 5 exactly when the second boards.

## Dry Run

Trips `[[2, 1, 5], [3, 3, 7]]`, capacity 4 (only kilometres with changes shown):

| km | diff[km] | load after | Over capacity? |
|----|----------|------------|----------------|
| 1 | +2 | 2 | no |
| 3 | +3 | 5 | **yes → false** |
| 5 | −2 | (3) | — |
| 7 | −3 | (0) | — |

## Common Mistakes

- Using `diff[r] −= v` for an inclusive range (should be `r + 1`) — or the reverse mistake for half-open intervals.
- Allocating `diff` of size n, so `r + 1 = n` is out of bounds.
- Reading the array before running the prefix sum.
- Using it when updates and queries interleave (each read would need an O(n) rebuild).

## Variations

- **Sweep with sorted events:** for coordinates up to 10⁹, store (position, +v/−v) events, sort them, and sweep — or use a `TreeMap<Integer, Integer>` as a sparse difference array.
- **2D difference:** add v at (r1, c1), −v at (r1, c2 + 1) and (r2 + 1, c1), +v at (r2 + 1, c2 + 1); then 2D prefix sums.
- **Modular / XOR updates:** shifting letters mod 26, flipping bits with XOR.
- **Maximum overlap:** the largest running value = minimum number of rooms/platforms (compare the sorting-based approach in [Greedy Problems](../../algorithms/greedy-problems/content.md)).

## Complexity

| Task | Time | Space |
|------|------|-------|
| q range updates | O(q) | O(n) |
| Rebuild / sweep | O(n) | — |
| Total | O(n + q) vs O(n × q) naive | O(n) |
| Sorted-event sweep | O(q log q) | O(q) |

## When Not to Use It

- Queries arrive between updates (online) — use a Fenwick tree with range updates or a lazy segment tree.
- Updates are not additive (e.g. "set every element in [l, r] to x") — use a segment tree with assignment, or process intervals in order with a [merge-intervals](../merge-intervals/content.md) style sweep.
- Coordinate range is huge and dense arrays do not fit — switch to sorted events.

## Key Takeaways

- Range add in O(1): `diff[l] += v`, `diff[r + 1] −= v`; rebuild with one prefix sum.
- Intervals with loads → +load at start, −load at end, sweep and track the running value.
- Offline only; for interleaved updates and queries use a tree structure.
