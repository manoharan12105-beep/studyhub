# Binary Search on Answer

## What Is the Pattern

**Binary search on answer** (parametric search) solves "find the minimum (or maximum) value X such that a condition is achievable" by binary searching over the **range of possible answers** instead of over an input array. It needs a function `feasible(X)` that is **monotone**: if X works, every larger X works too (for minimisation).

Tiny example: what is the smallest daily capacity that ships packages `[3, 2, 2, 4, 1, 4]` within 3 days? Capacity 6 works (3+2 | 2+4 | 1+4), capacity 5 does not (needs 4 days) — and every capacity above 6 also works. So the answer is the first capacity where `feasible` turns true.

It builds on the boundary search of the [Binary Search Pattern](../binary-search-pattern/content.md).

## Why It Works

Optimisation directly ("what is the best X?") is often hard; checking ("can it be done with X?") is often easy — usually a greedy O(n) simulation. Monotonicity turns the answer range into F…F T…T, so binary search finds the boundary with O(log R) checks, where R is the size of the range. Total cost: O(n log R) instead of trying every X (O(n × R)).

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "Minimum possible maximum" / "maximum possible minimum" | classic min-max objective with a monotone check |
| "Smallest speed/capacity/size/time such that … within D days/hours" | larger values only make it easier |
| "Split into k parts minimising the largest part sum" | feasible(maxSum) = can split into ≤ k parts |
| "Place k items as far apart as possible" (maximise minimum distance) | feasible(d) = can place k with gap ≥ d |
| Answer is a number in a huge range (up to 10⁹ or 10¹⁸) and n is moderate | O(n log R) fits; trying every value does not |
| A checking procedure is obvious once X is fixed | write `feasible(X)`, then binary search |

## Typical Problem Structure

- Input: an array (piles, weights, positions, task times) and a limit (days, hours, k parts, k items).
- Output: a single number — the optimal threshold.
- Range: low = smallest conceivable answer (often max element or 1), high = largest needed (often sum of elements or max value).

## Template

```pseudocode
// smallest X in [lo, hi] with feasible(X) true (feasible is F…F T…T)
while lo < hi:
    mid ← lo + (hi − lo) / 2
    if feasible(mid): hi ← mid
    else: lo ← mid + 1
return lo

// largest X with feasible(X) true (feasible is T…T F…F)
while lo < hi:
    mid ← lo + (hi − lo + 1) / 2        // round up, or the loop never ends
    if feasible(mid): lo ← mid
    else: hi ← mid − 1
return lo
```

## Java Template

```java
public class AnswerSearchTemplate {

    // Can all weights be shipped within `days` days with this capacity (in order, no splitting)?
    static boolean feasible(int[] weights, int days, int capacity) {
        int used = 1, load = 0;
        for (int w : weights) {
            if (load + w > capacity) {                 // start a new day
                used++;
                load = 0;
            }
            load += w;
        }
        return used <= days;
    }

    static int minCapacity(int[] weights, int days) {
        int lo = 0, hi = 0;
        for (int w : weights) {
            lo = Math.max(lo, w);                      // must carry the heaviest package
            hi += w;                                   // one day for everything always works
        }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (feasible(weights, days, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    public static void main(String[] args) {
        System.out.println(minCapacity(new int[] {3, 2, 2, 4, 1, 4}, 3) + " " + minCapacity(new int[] {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}, 5));
    }
}
```

**Output:**

```text
6 15
```

## Example Problem

**Minimum eating speed.** There are piles of bananas; an eater picks a speed s (bananas per hour) and each hour eats s bananas from one pile (if the pile has fewer, they finish it and wait for the next hour). Find the minimum integer s that finishes all piles within h hours. Example: piles `[3, 6, 7, 11]`, h = 8 → `4`.

- **Brute force:** try s = 1, 2, 3, … and simulate — O(max × n), up to 10⁹ × 10⁴.
- **Observation:** hours needed at speed s = Σ ⌈pile / s⌉, which never increases as s grows. So "finishes within h" is F…F T…T over s ∈ [1, max pile].

```java
public class MinEatingSpeed {

    static int minEatingSpeed(int[] piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) hi = Math.max(hi, p);      // speed = max pile finishes each pile in one hour
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long hours = 0;
            for (int p : piles) hours += (p + mid - 1) / mid;   // ceil(p / mid) without doubles
            if (hours <= h) hi = mid;                  // fast enough: try slower
            else lo = mid + 1;
        }
        return lo;
    }

    public static void main(String[] args) {
        System.out.println(minEatingSpeed(new int[] {3, 6, 7, 11}, 8) + " " + minEatingSpeed(new int[] {30, 11, 23, 4, 20}, 5) + " "
                + minEatingSpeed(new int[] {30, 11, 23, 4, 20}, 6));
    }
}
```

**Output:**

```text
4 30 23
```

## Dry Run

piles `[3, 6, 7, 11]`, h = 8, range [1, 11]:

| lo | hi | mid | hours = Σ ⌈p / mid⌉ | ≤ 8? | New range |
|----|----|-----|---------------------|------|-----------|
| 1 | 11 | 6 | 1 + 1 + 2 + 2 = 6 | yes | [1, 6] |
| 1 | 6 | 3 | 1 + 2 + 3 + 4 = 10 | no | [4, 6] |
| 4 | 6 | 5 | 1 + 2 + 2 + 3 = 8 | yes | [4, 5] |
| 4 | 5 | 4 | 1 + 2 + 2 + 3 = 8 | yes | [4, 4] |

Answer 4: four checks instead of up to eleven simulations.

## Common Mistakes

- Choosing the range wrongly: a lower bound that is infeasible for structural reasons is fine, but the upper bound **must** be feasible (e.g. capacity = sum of weights).
- A `feasible` function that is not monotone — then binary search silently returns garbage.
- Infinite loop when searching for the **largest** feasible value with `mid = (lo + hi) / 2` and `lo = mid` — round up.
- Overflow in the check (sum of hours, distances) — use `long`.
- Using floating-point `Math.ceil(p / (double) s)` instead of integer `(p + s − 1) / s`.

## Variations

- **Minimise the maximum:** split array into k subarrays, ship within D days, painters partition.
- **Maximise the minimum:** aggressive cows / magnetic force between balls (place k items with gaps ≥ d).
- **k-th smallest value in an implicit set:** count elements ≤ X (e.g. multiplication table, sorted matrix, pair distances) and find the first X with count ≥ k.
- **Real-valued answers:** iterate a fixed number of times (e.g. 60–100) on doubles.
- **Check by a different algorithm:** feasible(X) may be a BFS/DFS ("can you reach the end using only cells with height ≤ X"), union-find, or greedy.

## Complexity

| Part | Cost |
|------|------|
| Number of checks | O(log R), R = hi − lo + 1 (≈ 30 for 10⁹, ≈ 60 for 10¹⁸) |
| Each check | usually O(n) (greedy simulation) |
| Total | O(n log R) time, O(1) extra space for greedy checks |

## When Not to Use It

- No monotone feasibility (e.g. "exactly k parts" where more capacity can make an exact split impossible) — reformulate as "at most k", or use DP.
- A direct formula or greedy gives the optimum without searching.
- The check is as hard as the original problem.

## Key Takeaways

- "Minimum X such that possible" / "max-min" / "min-max" → binary search over X with a monotone `feasible(X)`.
- Design order: write `feasible`, prove monotonicity, pick a safe [lo, hi], then search.
- Cost O(check × log range) — often O(n log 10⁹).
