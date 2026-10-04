# Greedy Pattern

## What Is the Pattern

A **greedy** solution builds the answer step by step, each time taking the choice that looks best **right now** — and never reconsidering it. It is correct only when a **locally optimal choice can always be extended to a globally optimal solution**. The pattern is: find the right ordering or rule (sort by end time, by ratio, by difference, take the largest feasible…), then sweep once.

Tiny example: pay 63 with coins {25, 10, 5, 1} using the fewest coins: 25, 25, 10, 1, 1, 1 — six coins, optimal for this coin system. With coins {4, 3, 1} and amount 6, greedy gives 4 + 1 + 1 (three coins) but 3 + 3 (two) is better: the rule is not always safe.

Theory (greedy-choice property, optimal substructure, exchange arguments) and standard algorithms are in [Greedy Algorithms](../../algorithms/greedy-algorithms/content.md); classic interval, jump and gas-station problems in [Greedy Problems](../../algorithms/greedy-problems/content.md).

## Why It Works

A greedy algorithm is correct when you can prove the **greedy-choice property**: some optimal solution makes the same first choice as greedy. The usual proof is an **exchange argument**: take any optimal solution that differs from greedy, swap in greedy's choice, and show the result is no worse. Repeating the argument shows greedy's whole sequence is optimal. Greedy is fast — usually one sort plus a linear scan — because it explores a single path instead of all combinations ([DP](../dp-pattern/content.md)) or all candidates ([backtracking](../backtracking-pattern/content.md)).

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "Maximum number of non-overlapping …", "minimum arrows/rooms/platforms" | interval greedy (sort by end or by start) |
| "Assign / pair items to minimise total cost or maximise count" | sort both sides and match in order, or sort by a difference/ratio |
| "Can you reach the end", "minimum jumps", "minimum refuels" | track the furthest reach |
| Choices are independent except for a simple capacity or ordering constraint | a local rule may suffice |
| n up to 10⁵–10⁶ and an optimisation objective | O(n log n) greedy fits; DP over large values may not |
| You can state a swap argument: "if an optimal solution did X instead, swapping to greedy's choice doesn't hurt" | the proof that greedy is safe |

**Warning signs against greedy:** "count the number of ways", choices that affect future options in complex ways (0/1 knapsack, coin change with arbitrary coins, longest increasing subsequence), or a small counterexample you can find in a minute.

## Typical Problem Structure

- Input: a list of items/intervals/tasks with values, costs, deadlines or positions.
- Output: an optimal count, cost, or a feasibility answer.
- Shape of the solution: **sort by a key → scan → take or skip** each item, or **repeatedly take the best available** with a heap.

## Template

```pseudocode
sort items by the greedy key            // the key is the whole insight
state ← initial (count, capacity, reach, current end…)
for item in items:
    if taking item keeps the solution valid and is the locally best move:
        take it; update state
return result

// "best available" variant
heap ← items available now (by priority)
while work remains:
    add newly available items to the heap
    take heap.top; update state
```

## Java Template

```java
import java.util.*;

public class GreedyTemplate {

    // Maximum number of non-overlapping intervals: sort by end, take whatever fits.
    static int maxNonOverlapping(int[][] intervals) {
        int[][] sorted = intervals.clone();
        Arrays.sort(sorted, Comparator.comparingInt(iv -> iv[1]));
        int count = 0, lastEnd = Integer.MIN_VALUE;
        for (int[] iv : sorted) {
            if (iv[0] >= lastEnd) {                    // compatible with everything taken so far
                count++;
                lastEnd = iv[1];                       // earliest finish leaves the most room
            }
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(maxNonOverlapping(new int[][] {{1, 3}, {2, 4}, {3, 5}, {0, 7}, {5, 8}}));
    }
}
```

**Output:**

```text
3
```

## Example Problem

**Two-city scheduling.** 2n people must be flown to two cities, exactly n to each. Person i costs `costs[i][0]` to city A and `costs[i][1]` to city B. Minimise the total. Example: `[[10, 20], [30, 200], [400, 50], [30, 20]]` → `110` (A: 10 + 30, B: 50 + 20).

- **Brute force:** choose which n go to A — C(2n, n) subsets, about 10⁵⁸ for 2n = 200.
- **DP:** `dp[i][a]` = best cost for the first i people with a sent to A — O(n²), works but is not needed.
- **Greedy insight:** start by sending everyone to B; moving person i to A changes the total by `costs[i][0] − costs[i][1]`. Send to A the n people with the **smallest** differences. Equivalently: sort by `a − b` and send the first half to A.
- **Exchange argument:** if an optimal plan sends p to B and q to A with diff(p) < diff(q), swapping them changes the total by diff(p) − diff(q) < 0 — so the plan was not optimal. Hence optimal plans send the n smallest differences to A.

```java
import java.util.*;

public class TwoCityScheduling {

    static int twoCitySchedCost(int[][] costs) {
        int[][] sorted = costs.clone();
        Arrays.sort(sorted, Comparator.comparingInt(c -> c[0] - c[1]));   // most "A-favourable" first
        int n = sorted.length / 2, total = 0;
        for (int i = 0; i < sorted.length; i++) total += i < n ? sorted[i][0] : sorted[i][1];
        return total;
    }

    public static void main(String[] args) {
        System.out.println(twoCitySchedCost(new int[][] {{10, 20}, {30, 200}, {400, 50}, {30, 20}}) + " "
                + twoCitySchedCost(new int[][] {{259, 770}, {448, 54}, {926, 667}, {184, 139}, {840, 118}, {577, 469}}));
    }
}
```

**Output:**

```text
110 1859
```

## Dry Run

`costs = [[10, 20], [30, 200], [400, 50], [30, 20]]`, differences a − b: −10, −170, 350, 10.

| Rank (by a − b) | Person | a − b | Sent to | Cost |
|-----------------|--------|-------|---------|------|
| 1 | [30, 200] | −170 | A | 30 |
| 2 | [10, 20] | −10 | A | 10 |
| 3 | [30, 20] | 10 | B | 20 |
| 4 | [400, 50] | 350 | B | 50 |

Total 110. Note that greedily sending each person to their individually cheaper city (A, A, B, B here happens to match, but not in general) can violate the n/n split.

## Common Mistakes

- Using greedy without a proof or at least a search for counterexamples (coin change with {4, 3, 1}).
- Sorting by the wrong key — e.g. interval scheduling by start time or by length instead of end time.
- Ignoring constraints that couple choices (the n/n split above).
- Comparator overflow with `a − b` style comparisons on large values — use `Integer.compare`.
- Confusing "greedy works for this instance" with "greedy works always".

## Variations

- **Sort by end** — activity selection, minimum arrows, non-overlapping intervals.
- **Sort by ratio** — fractional knapsack, minimum cost to hire workers (with a heap).
- **Sort by difference** — two-city scheduling, assigning tasks to two machines.
- **Furthest reach** — jump game, minimum taps/stations to cover a range.
- **Heap-driven greedy** — always process the cheapest/most urgent available item (Huffman coding, IPO capital, CPU scheduling).
- **Two-pointer matching after sorting** — assign cookies, boats to save people.

## Complexity

| Shape | Time | Space |
|-------|------|-------|
| Sort + scan | O(n log n) | O(1)–O(n) |
| Linear scan with running state (reach, balance) | O(n) | O(1) |
| Heap-driven | O(n log n) | O(n) |

## When Not to Use It

- A small counterexample exists — switch to [DP](../dp-pattern/content.md) (0/1 knapsack, general coin change, LIS).
- The problem asks to **count** solutions or list them all ([backtracking](../backtracking-pattern/content.md)).
- Choices interact over many steps (scheduling with weighted intervals → DP with binary search).

## Key Takeaways

- Greedy = the right sort key or selection rule + one pass, never undoing a choice.
- Justify it with an exchange argument; test it against small counterexamples.
- If the local rule fails, the problem usually needs DP.
