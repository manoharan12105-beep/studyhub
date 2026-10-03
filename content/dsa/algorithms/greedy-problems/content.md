# Greedy Problems: Intervals, Platforms, Gas Station, Jump Game

## Definition

Four families of classic interview problems with proven greedy solutions: **interval scheduling** (removing the fewest intervals to eliminate overlaps, covering points with the fewest arrows), **minimum platforms** (maximum number of overlapping intervals), **gas station** (the start point of a circular route), and **jump game** (can you reach the end, and in how few jumps). Each is solved in one or two linear passes, usually after sorting.

## Why It Matters

These problems are favourites because the brute force is exponential or quadratic, while the greedy solution is short — but only if you find the right invariant. They train the habit of asking "what is the one quantity I need to track?" (the earliest end time, the running fuel balance, the farthest reachable index).

## Prerequisites

- [Greedy Algorithms](../greedy-algorithms/content.md) — greedy choice property, exchange arguments.
- [Merge Intervals](../../patterns/merge-intervals/content.md) — merging and inserting intervals.

## Intuition

| Problem | Greedy insight |
|---------|----------------|
| Erase overlapping intervals | keep the interval that **ends earliest** — it leaves the most room (activity selection in disguise) |
| Minimum arrows for balloons | shoot at the earliest **end**; that arrow bursts every balloon starting before it |
| Minimum platforms | sort arrivals and departures separately; the answer is the maximum number of trains present at once |
| Gas station | if you run out of fuel going from A to B, no station between A and B can be the start either |
| Jump game | track the **farthest** index reachable so far; if you ever stand beyond it, you are stuck |
| Jump game II | BFS by levels: every index reachable with k jumps forms a window; the next window ends at the farthest reach from it |

## How It Works

### Erase overlapping intervals (non-overlapping intervals)

1. Sort by end time.
2. Keep the first interval; for each next interval, if it starts before the last kept end, it overlaps → remove it (count it); otherwise keep it and update the end.
3. Answer = number removed = n − (maximum set of non-overlapping intervals).

### Minimum arrows to burst balloons

Balloons are horizontal intervals; an arrow at x bursts all balloons with start ≤ x ≤ end. Sort by end; shoot at the first end; skip every balloon whose start ≤ that end; shoot again at the next unburst balloon's end.

### Minimum platforms

1. Sort arrival times and departure times separately.
2. Walk both with two pointers like a merge: an arrival (when `arr[i] ≤ dep[j]`) increments the platforms in use; otherwise a departure decrements it.
3. Track the maximum in use. (If a train arrives at the same time another departs, decide whether that needs two platforms — here `≤` means it does.)

### Gas station

Stations on a circle: `gas[i]` fuel is available at station i, `cost[i]` is needed to drive to station i + 1.

1. If total gas < total cost, no solution (return −1).
2. Otherwise scan once with a running tank from a candidate `start`. When the tank goes negative at station i, no station from `start` to i can be the start (each would arrive at i with even less fuel), so set `start = i + 1` and reset the tank.
3. The final candidate is the answer (it exists because the total is non-negative).

### Jump game (reachability)

`nums[i]` is the maximum jump length from i. Keep `farthest`; for i from 0: if `i > farthest`, return false; else `farthest = max(farthest, i + nums[i])`.

### Jump game II (minimum jumps)

Keep the end of the current jump's window (`currentEnd`) and the farthest reach from inside it (`farthest`). When i reaches `currentEnd`, you must jump: `jumps++`, `currentEnd = farthest`. This is BFS where each level is a contiguous window.

## Visual Explanation

```text
Minimum platforms
arrivals:    900  940  950  1100  1500  1800
departures:  910 1200 1120  1130  1900  2000
sorted dep:  910 1120 1130  1200  1900  2000

event:   A900 D910 A940 A950 A1100 D1120 D1130 D1200 A1500 A1800 D1900 D2000
in use:   1    0    1    2    3     2     1     0     1     2     1     0
maximum = 3 platforms

Gas station: gas = [1,2,3,4,5], cost = [3,4,5,1,2]
net    = [-2,-2,-2, 3, 3]    total = 0 ≥ 0 → a start exists
i=0: tank -2 < 0 → start = 1, tank 0
i=1: tank -2 < 0 → start = 2, tank 0
i=2: tank -2 < 0 → start = 3, tank 0
i=3: tank 3;  i=4: tank 6  → start = 3
```

## Pseudocode

```pseudocode
canCompleteCircuit(gas, cost):
    if sum(gas) < sum(cost): return −1
    start ← 0; tank ← 0
    for i from 0 to n − 1:
        tank ← tank + gas[i] − cost[i]
        if tank < 0: start ← i + 1; tank ← 0
    return start

minJumps(nums):
    jumps ← 0; currentEnd ← 0; farthest ← 0
    for i from 0 to n − 2:
        farthest ← max(farthest, i + nums[i])
        if i = currentEnd: jumps ← jumps + 1; currentEnd ← farthest
    return jumps
```

## Java Implementation

```java
import java.util.*;

public class GreedyProblems {

    static int eraseOverlapIntervals(int[][] intervals) {
        int[][] s = intervals.clone();
        Arrays.sort(s, Comparator.comparingInt(a -> a[1]));      // earliest end first
        int removed = 0, lastEnd = Integer.MIN_VALUE;
        for (int[] in : s) {
            if (in[0] < lastEnd) removed++;                       // overlaps the kept one: drop it
            else lastEnd = in[1];
        }
        return removed;
    }

    static int minArrows(int[][] balloons) {
        int[][] s = balloons.clone();
        Arrays.sort(s, Comparator.comparingInt(a -> a[1]));
        int arrows = 0;
        long arrowAt = Long.MIN_VALUE;                            // long: ends may equal Integer.MIN_VALUE
        for (int[] b : s) {
            if (b[0] > arrowAt) {                                 // not burst by the last arrow
                arrows++;
                arrowAt = b[1];
            }
        }
        return arrows;
    }

    static int minPlatforms(int[] arrivals, int[] departures) {
        int[] arr = arrivals.clone(), dep = departures.clone();
        Arrays.sort(arr);
        Arrays.sort(dep);
        int inUse = 0, best = 0, i = 0, j = 0;
        while (i < arr.length) {
            if (arr[i] <= dep[j]) {                               // arrival first (a tie needs a new platform)
                inUse++;
                i++;
                best = Math.max(best, inUse);
            } else {
                inUse--;
                j++;
            }
        }
        return best;
    }

    static int canCompleteCircuit(int[] gas, int[] cost) {
        int total = 0, tank = 0, start = 0;
        for (int i = 0; i < gas.length; i++) {
            int net = gas[i] - cost[i];
            total += net;
            tank += net;
            if (tank < 0) {                                       // cannot reach i + 1 from start
                start = i + 1;
                tank = 0;
            }
        }
        return total >= 0 ? start : -1;
    }

    static boolean canJump(int[] nums) {
        int farthest = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > farthest) return false;                       // i is unreachable
            farthest = Math.max(farthest, i + nums[i]);
        }
        return true;
    }

    static int minJumps(int[] nums) {
        int jumps = 0, currentEnd = 0, farthest = 0;
        for (int i = 0; i < nums.length - 1; i++) {
            farthest = Math.max(farthest, i + nums[i]);
            if (i == currentEnd) {                                // must jump to go further
                jumps++;
                currentEnd = farthest;
            }
        }
        return jumps;
    }

    public static void main(String[] args) {
        System.out.println("erase overlaps: " + eraseOverlapIntervals(new int[][] {{1, 2}, {2, 3}, {3, 4}, {1, 3}}));
        System.out.println("arrows: " + minArrows(new int[][] {{10, 16}, {2, 8}, {1, 6}, {7, 12}}));
        System.out.println("platforms: " + minPlatforms(new int[] {900, 940, 950, 1100, 1500, 1800}, new int[] {910, 1200, 1120, 1130, 1900, 2000}));
        System.out.println("gas start: " + canCompleteCircuit(new int[] {1, 2, 3, 4, 5}, new int[] {3, 4, 5, 1, 2})
                + ", impossible: " + canCompleteCircuit(new int[] {2, 3, 4}, new int[] {3, 4, 3}));
        System.out.println("can jump: " + canJump(new int[] {2, 3, 1, 1, 4}) + " " + canJump(new int[] {3, 2, 1, 0, 4}));
        System.out.println("min jumps: " + minJumps(new int[] {2, 3, 1, 1, 4}) + " " + minJumps(new int[] {2, 3, 0, 1, 4}));
    }
}
```

**Output:**

```text
erase overlaps: 1
arrows: 2
platforms: 3
gas start: 3, impossible: -1
can jump: true false
min jumps: 2 2
```

## Dry Run

`minJumps([2, 3, 1, 1, 4])`:

| i | nums[i] | farthest | i == currentEnd? | jumps | currentEnd |
|---|---------|----------|------------------|-------|------------|
| 0 | 2 | 2 | yes | 1 | 2 |
| 1 | 3 | 4 | no | 1 | 2 |
| 2 | 1 | 4 | yes | 2 | 4 |
| 3 | 1 | 4 | no | 2 | 4 |

The loop stops before the last index; 2 jumps (0 → 1 → 4).

## Complexity Analysis

| Problem | Time | Space |
|---------|------|-------|
| Erase overlapping intervals | O(n log n) | O(n) for the sorted copy |
| Minimum arrows | O(n log n) | O(n) |
| Minimum platforms | O(n log n) | O(n) |
| Gas station | O(n) | O(1) |
| Jump game I and II | O(n) | O(1) |

## Properties

- All are one-pass scans after at most one sort.
- Each relies on a monotonic invariant (end time, fuel balance, farthest reach).

## Variations

- **Meeting rooms II** = minimum platforms (also solvable with a min-heap of end times).
- **Car pooling / flight bookings** — difference arrays over time: [Difference Array](../../patterns/difference-array/content.md).
- **Jump game with costs or exact landing** — DP or BFS instead.
- **Minimum refuelling stops** — greedy with a max-heap of passed stations.

## Comparison

| Problem | Brute force | Greedy |
|---------|-------------|--------|
| Erase overlaps | try all subsets: O(2ⁿ) | sort by end: O(n log n) |
| Gas station | simulate from every start: O(n²) | one pass: O(n) |
| Jump game II | BFS on indices with all edges: O(n²) | window BFS: O(n) |

## Edge Cases

- Intervals that touch (`[1,2]` and `[2,3]`): overlapping or not depends on the problem statement — read it.
- A single interval; all intervals identical.
- Gas station with exactly zero total surplus (a start still exists).
- Jump arrays of length 1 (already at the end: 0 jumps).

## Advantages

- Optimal answers in O(n) or O(n log n) with tiny code.

## Disadvantages

- Each greedy rule is problem-specific and easy to get subtly wrong (sorting by start instead of end).

## When to Use

- Interval scheduling/covering/overlap counting questions.
- Reachability along a line or circle where only a running maximum or balance matters.

## Common Mistakes

- Sorting intervals by start for erase-overlaps (works only with extra care); sorting by end is the clean choice.
- Integer overflow when sorting with `a[1] - b[1]` for extreme coordinates — use `Integer.compare`.
- Gas station: forgetting the total-sum feasibility check.
- Jump game II: looping to the last index and counting an extra jump.

## Key Takeaways

- Intervals: sort by end and keep the earliest finisher; arrows go at ends.
- Platforms: maximum overlap via sorted arrivals and departures.
- Gas station: a negative running tank rules out every start before it.
- Jump game: track the farthest reach; minimum jumps = BFS over index windows.
