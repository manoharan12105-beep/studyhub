# Greedy Algorithms

## Definition

A **greedy algorithm** builds a solution step by step, always making the choice that looks best **right now** (the locally optimal choice) and never reconsidering it. It produces a globally optimal solution only for problems with the **greedy choice property** (some optimal solution starts with the greedy choice) and **optimal substructure** (after that choice, the rest is a smaller instance of the same problem).

## Why It Matters

When greedy works it is usually the simplest and fastest solution — often just a sort followed by one pass, O(n log n). The difficulty is knowing **when** it works: interviewers frequently ask you to justify a greedy choice or to show a counterexample where it fails, and to fall back to [Dynamic Programming](../dynamic-programming/content.md) when it does.

## Prerequisites

- [Java Toolkit: Sorting, Comparable and Comparator](../../fundamentals/java-sorting-and-comparators/content.md) — most greedy solutions start with a custom sort.
- [Heap](../../data-structures/heap/content.md) — for Huffman coding and scheduling.

## Intuition

Paying ₹289 with the fewest Indian notes/coins: take the largest note that fits (200), then the largest that fits the rest (50, 20, 10, 5, 2, 2). For this coin system, grabbing the biggest each time is optimal. But with coins {1, 3, 4} and amount 6, greedy takes 4 + 1 + 1 (three coins) while 3 + 3 (two coins) is better. Greedy is a bet that local best choices never block a better global solution — the bet must be proven, not assumed.

## How It Works

### Designing a greedy algorithm

1. Identify the decision made at each step.
2. Propose a greedy rule (earliest end time, highest value per weight, nearest deadline…).
3. **Prove it** (or find a counterexample):
   - **Exchange argument:** take any optimal solution that differs from the greedy one; swap in the greedy choice and show the solution stays valid and no worse.
   - **Stays-ahead argument:** after each step, greedy's partial solution is at least as good as any other's.
4. Implement — usually sort by the greedy key, then scan (or use a heap when the best choice changes as you go).

### Local vs global optimum

A **local optimum** is the best choice for the current step; the **global optimum** is the best overall solution. Greedy algorithms only look locally. They succeed when local and global agree (proved as above) and fail when an early choice rules out a better combination later (0/1 knapsack, coin change with arbitrary denominations, longest path).

### Activity selection (interval scheduling)

Choose the maximum number of non-overlapping activities. **Greedy rule: always pick the activity that finishes earliest** among those compatible with what has been chosen.

Exchange argument: let the earliest-finishing activity be g. In any optimal schedule, replace its first activity with g — g ends no later, so it conflicts with nothing the first activity did not. The count stays the same, so an optimal solution containing g exists. Repeat on the remaining activities.

(Earliest **start** or **shortest duration** both fail on simple counterexamples.)

### Fractional knapsack

Items have weight and value; you may take **fractions** of items; maximise value within capacity W. **Greedy rule: take items in decreasing value/weight ratio**, taking a fraction of the last one that does not fit. Optimal because any unit of capacity is best spent on the highest ratio available.

With **0/1** items (all or nothing), the same rule fails — e.g. W = 50, items (10 kg, ₹60), (20 kg, ₹100), (30 kg, ₹120): ratio order takes 60 + 100 = 160, but 100 + 120 = 220 is optimal. Use [Knapsack DP](../knapsack-dp/content.md).

### Job sequencing with deadlines

Each job takes one time unit, has a deadline and a profit; maximise total profit of jobs finished by their deadlines. **Greedy rule: consider jobs in decreasing profit; schedule each in the latest free slot not after its deadline.** Using the latest free slot keeps earlier slots open for jobs with tighter deadlines. (A [Disjoint Set Union](../../data-structures/disjoint-set-union/content.md) over slots makes "latest free slot" O(α(n)).)

### Huffman coding

Build an optimal prefix-free binary code for symbols with given frequencies (no code is a prefix of another, so decoding is unambiguous). **Greedy rule: repeatedly merge the two least frequent nodes** into a new node whose frequency is their sum, using a min-heap. Frequent symbols end up near the root (short codes), rare ones deep (long codes). The total encoded length = Σ frequency × code length is minimal.

## Visual Explanation

```text
Activity selection — activities (start, end) sorted by end:

a1 (1,2)  ██
a2 (3,4)      ██
a3 (0,6)  ████████████
a4 (5,7)          ████
a5 (8,9)                ██
a6 (5,9)          ████████

pick a1 (ends 2) → a2 starts 3 ≥ 2, pick (ends 4) → a3 starts 0 < 4, skip
→ a4 starts 5 ≥ 4, pick (ends 7) → a5 starts 8 ≥ 7, pick → a6 starts 5 < 9, skip
answer: a1, a2, a4, a5 (4 activities)

Huffman for a:5 b:9 c:12 d:13 e:16 f:45
merge 5+9=14; 12+13=25; 14+16=30; 25+30=55; 45+55=100
codes: f=0, c=100, d=101, a=1100, b=1101, e=111
```

## Pseudocode

```pseudocode
activitySelection(activities):
    sort activities by end time
    lastEnd ← −∞; chosen ← []
    for a in activities:
        if a.start ≥ lastEnd:
            chosen.add(a); lastEnd ← a.end
    return chosen
```

## Java Implementation

```java
import java.util.*;

public class GreedyAlgorithms {

    static List<int[]> activitySelection(int[][] activities) {
        int[][] sorted = activities.clone();
        Arrays.sort(sorted, Comparator.comparingInt(a -> a[1]));      // earliest end first
        List<int[]> chosen = new ArrayList<>();
        int lastEnd = Integer.MIN_VALUE;
        for (int[] a : sorted) {
            if (a[0] >= lastEnd) {                                    // compatible with the last chosen
                chosen.add(a);
                lastEnd = a[1];
            }
        }
        return chosen;
    }

    static double fractionalKnapsack(int[] weights, int[] values, int capacity) {
        Integer[] order = new Integer[weights.length];
        for (int i = 0; i < order.length; i++) order[i] = i;
        // Highest value per kilogram first; compare a/b > c/d as a*d > c*b to avoid rounding.
        Arrays.sort(order, (i, j) -> Long.compare((long) values[j] * weights[i], (long) values[i] * weights[j]));
        double total = 0;
        int remaining = capacity;
        for (int i : order) {
            if (remaining == 0) break;
            int take = Math.min(weights[i], remaining);
            total += (double) values[i] * take / weights[i];
            remaining -= take;
        }
        return total;
    }

    // jobs: {deadline, profit}; returns {jobsDone, totalProfit}
    static int[] jobSequencing(int[][] jobs) {
        int[][] sorted = jobs.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(b[1], a[1]));   // highest profit first
        int maxDeadline = 0;
        for (int[] j : sorted) maxDeadline = Math.max(maxDeadline, j[0]);
        boolean[] slotTaken = new boolean[maxDeadline + 1];           // slots 1..maxDeadline
        int count = 0, profit = 0;
        for (int[] j : sorted) {
            for (int slot = j[0]; slot >= 1; slot--) {                // latest free slot before the deadline
                if (!slotTaken[slot]) {
                    slotTaken[slot] = true;
                    count++;
                    profit += j[1];
                    break;
                }
            }
        }
        return new int[] {count, profit};
    }

    static class HuffmanNode {
        final int freq;
        final char symbol;                      // '\0' for internal nodes
        final HuffmanNode left, right;

        HuffmanNode(int freq, char symbol, HuffmanNode left, HuffmanNode right) {
            this.freq = freq;
            this.symbol = symbol;
            this.left = left;
            this.right = right;
        }
    }

    static Map<Character, String> huffman(char[] symbols, int[] freqs) {
        PriorityQueue<HuffmanNode> heap = new PriorityQueue<>(Comparator.comparingInt(n -> n.freq));
        for (int i = 0; i < symbols.length; i++) heap.offer(new HuffmanNode(freqs[i], symbols[i], null, null));
        while (heap.size() > 1) {
            HuffmanNode a = heap.poll(), b = heap.poll();             // two least frequent
            heap.offer(new HuffmanNode(a.freq + b.freq, '\0', a, b));
        }
        Map<Character, String> codes = new TreeMap<>();
        assign(heap.poll(), "", codes);
        return codes;
    }

    private static void assign(HuffmanNode node, String code, Map<Character, String> codes) {
        if (node.left == null) {                                      // leaf
            codes.put(node.symbol, code.isEmpty() ? "0" : code);
            return;
        }
        assign(node.left, code + "0", codes);
        assign(node.right, code + "1", codes);
    }

    public static void main(String[] args) {
        int[][] acts = {{1, 2}, {3, 4}, {0, 6}, {5, 7}, {8, 9}, {5, 9}};
        StringBuilder sb = new StringBuilder();
        for (int[] a : activitySelection(acts)) sb.append(Arrays.toString(a)).append(' ');
        System.out.println("activities: " + sb.toString().trim());

        System.out.println("fractional knapsack: " + fractionalKnapsack(new int[] {10, 20, 30}, new int[] {60, 100, 120}, 50));

        int[] js = jobSequencing(new int[][] {{4, 20}, {1, 10}, {1, 40}, {1, 30}});
        System.out.println("jobs done: " + js[0] + ", profit: " + js[1]);

        Map<Character, String> codes = huffman(new char[] {'a', 'b', 'c', 'd', 'e', 'f'}, new int[] {5, 9, 12, 13, 16, 45});
        System.out.println("huffman: " + codes);
    }
}
```

**Output:**

```text
activities: [1, 2] [3, 4] [5, 7] [8, 9]
fractional knapsack: 240.0
jobs done: 2, profit: 60
huffman: {a=1100, b=1101, c=100, d=101, e=111, f=0}
```

## Dry Run

Fractional knapsack, capacity 50, items (w, v): (10, 60), (20, 100), (30, 120). Ratios: 6, 5, 4.

| Item (ratio) | Remaining before | Take | Value added | Total |
|--------------|------------------|------|-------------|-------|
| (10, 60), 6/kg | 50 | 10 kg | 60 | 60 |
| (20, 100), 5/kg | 40 | 20 kg | 100 | 160 |
| (30, 120), 4/kg | 20 | 20 of 30 kg | 120 × 20/30 = 80 | 240 |

## Complexity Analysis

| Algorithm | Time | Space |
|-----------|------|-------|
| Activity selection | O(n log n) (sorting) + O(n) scan | O(1) extra besides the sort |
| Fractional knapsack | O(n log n) | O(n) for the index order |
| Job sequencing (slot scan) | O(n log n + n × D), D = max deadline | O(D) |
| Job sequencing (DSU slots) | O(n log n + n α(D)) | O(D) |
| Huffman coding | O(n log n) with a heap | O(n) |

## Properties

- Greedy choices are never undone (unlike backtracking).
- Correctness needs a proof; a few small counterexample attempts quickly reveal wrong greedy rules.

## Variations

- **Interval problems, minimum platforms, gas station, jump game:** [Greedy Problems](../greedy-problems/content.md).
- **Graph greedy algorithms:** [Dijkstra](../dijkstra/content.md) (closest unvisited vertex), [Prim](../prims-algorithm/content.md) and [Kruskal](../kruskals-algorithm/content.md) (cheapest safe edge).
- **Greedy with a heap:** when the best choice changes as you go (Huffman, task scheduling, IPO).

## Comparison

| Problem | Greedy works? | Why / alternative |
|---------|---------------|-------------------|
| Activity selection | yes | exchange argument on earliest finish |
| Fractional knapsack | yes | best ratio first |
| 0/1 knapsack | no | items are indivisible → DP |
| Coin change, Indian/US denominations | yes | canonical coin system |
| Coin change, arbitrary denominations ({1, 3, 4}) | no | DP |
| Shortest path, non-negative weights | yes | Dijkstra |
| Shortest path with negative weights | no | Bellman–Ford |
| Minimum spanning tree | yes | cut property |

## Edge Cases

- Ties in the greedy key (equal end times, equal ratios) — make sure tie-breaking does not matter, or choose it deliberately.
- Empty input, zero capacity.
- Huffman with a single symbol (give it the code "0").

## Advantages

- Simple and fast (often one sort + one pass).
- Low memory.

## Disadvantages

- Correct only for problems with the greedy choice property; wrong greedy rules look plausible.
- Proofs are needed to be confident.

## When to Use

- The problem asks for a max/min count or value and a natural ordering exists (by end time, ratio, deadline, size).
- Each choice leaves a smaller problem of the same type, and an exchange argument works.
- Constraints are large (n up to 10⁵–10⁶), ruling out DP over values.

## Common Mistakes

- Choosing an intuitive but wrong key (earliest start instead of earliest end).
- Applying the fractional-knapsack ratio rule to 0/1 knapsack.
- Assuming greedy coin change works for any denominations.
- Comparing ratios with floating point when exact cross-multiplication is available.

## Key Takeaways

- Greedy = best local choice, never revisited; correct only with the greedy choice property + optimal substructure.
- Prove with an exchange or stays-ahead argument; disprove with a small counterexample.
- Classics: activity selection (earliest finish), fractional knapsack (best ratio), job sequencing (highest profit, latest free slot), Huffman (merge two smallest).
- When greedy fails, try DP.
